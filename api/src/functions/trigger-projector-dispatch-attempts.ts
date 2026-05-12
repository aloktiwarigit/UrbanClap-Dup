/**
 * E11-S02 — Dispatch attempts source adapter (change-feed projector).
 *
 * Source: dispatch_attempts container (NOT job_offers).
 * Triggers: dispatch_attempts container change feed.
 * Emits: JOB_OFFER (one per technician in the attempt's technicianIds list)
 * Expires: JOB_OFFER actions when the attempt status becomes EXPIRED or ACCEPTED.
 *
 * STRICT ORDERING: upsertAction MUST be called before emitFcmForAction.
 */

import '../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import {
  upsertAction,
  expireAction,
  emitFcmForAction,
  buildPendingActionId,
} from '../services/pending-action-projector.js';
import type { DispatchAttemptDoc } from '../schemas/dispatch-attempt.js';
import { isRetryableCosmosError } from '../shared/cosmos-errors.js';

/**
 * Exported for unit testing without Azure Functions runtime.
 */
export async function processDispatchAttemptChangeFeedDoc(
  doc: Partial<DispatchAttemptDoc> & { id: string },
  ctx?: InvocationContext,
): Promise<void> {
  const { id: attemptId, technicianIds, status, expiresAt, bookingId } = doc;

  if (!technicianIds || technicianIds.length === 0 || !status) {
    ctx?.warn(`[trigger-projector-dispatch-attempts] Skipping doc ${attemptId}: missing fields`);
    return;
  }

  if (status === 'PENDING' && expiresAt) {
    // Emit JOB_OFFER for each technician in parallel
    await Promise.all(
      technicianIds.map(async (technicianId) => {
        const actionId = buildPendingActionId('JOB_OFFER', technicianId, attemptId);
        const { doc: upserted, noOp } = await upsertAction({
          id: actionId,
          userId: technicianId,
          type: 'JOB_OFFER',
          role: 'technician',
          sourceId: attemptId,
          expiresAt, // inherit from dispatch attempt
          priority: 1, // highest priority — time-sensitive
          payload: {
            attemptId,
            bookingId: bookingId ?? '',
          },
        });

        if (!noOp) {
          // STRICT: upsertAction THEN emitFcmForAction
          await emitFcmForAction(upserted, 'dispatch_attempts');
        }
      }),
    );
  } else if (status === 'EXPIRED' || status === 'ACCEPTED') {
    // Expire JOB_OFFER for all technicians in this attempt
    await Promise.all(
      technicianIds.map(async (technicianId) => {
        const actionId = buildPendingActionId('JOB_OFFER', technicianId, attemptId);
        try {
          await expireAction(actionId, technicianId);
        } catch (err) {
          ctx?.warn(`[trigger-projector-dispatch-attempts] Could not expire JOB_OFFER for tech ${technicianId}: ${String(err)}`);
        }
      }),
    );
  }
}

// ── Azure Functions trigger ───────────────────────────────────────────────────

app.cosmosDB('triggerProjectorDispatchAttempts', {
  connection: 'COSMOS_CONNECTION_STRING',
  databaseName: '%COSMOS_DATABASE%',
  containerName: 'dispatch_attempts',
  leaseContainerName: 'pending_actions_dispatch_leases',
  createLeaseContainerIfNotExists: false,
  handler: async (documents: unknown[], ctx: InvocationContext) => {
    const docs = documents as Array<Partial<DispatchAttemptDoc> & { id: string }>;
    for (const doc of docs) {
      try {
        await processDispatchAttemptChangeFeedDoc(doc, ctx);
      } catch (err) {
        // Rethrow retryable Cosmos errors so runtime retries and checkpoint doesn't advance.
        if (isRetryableCosmosError(err)) {
          ctx.error('[trigger-projector-dispatch-attempts] Retryable error — rethrowing for runtime retry', String(err));
          throw err;
        }
        ctx.error('[trigger-projector-dispatch-attempts] Non-retryable error — swallowing to advance checkpoint', String(err));
      }
    }
  },
});
