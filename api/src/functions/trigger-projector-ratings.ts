/**
 * E11-S02 — Ratings source adapter (change-feed projector).
 *
 * Triggers: ratings container change feed.
 * Emits: RATING_RECEIVED (to the technician when a customer submits a rating)
 *
 * STRICT ORDERING: upsertAction MUST be called before emitFcmForAction.
 */

import '../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import {
  upsertAction,
  emitFcmForAction,
  buildPendingActionId,
} from '../services/pending-action-projector.js';
import type { RatingDoc } from '../schemas/rating.js';
import { isRetryableCosmosError } from '../shared/cosmos-errors.js';

const RATING_RECEIVED_EXPIRY_MS = 7 * 24 * 60 * 60 * 1_000; // 7 days

/**
 * Derive stable expiry from a source ISO timestamp + window.
 * customerSubmittedAt is stable: same rating replay → same expiresAt → no-op.
 */
function stableExpiryFrom(sourceIso: string, windowMs: number): string {
  return new Date(new Date(sourceIso).getTime() + windowMs).toISOString();
}

/**
 * Exported for unit testing without Azure Functions runtime.
 */
export async function processRatingChangeFeedDoc(
  doc: Partial<RatingDoc> & { id: string },
  _ctx?: InvocationContext,
): Promise<void> {
  const { id: ratingId, technicianId, customerId, customerOverall, customerSubmittedAt } = doc;

  if (!technicianId || !customerId || !customerOverall || !customerSubmittedAt) {
    // Rating not yet submitted by customer — skip
    return;
  }

  // Emit RATING_RECEIVED to the technician.
  // expiresAt derived from customerSubmittedAt (stable source timestamp) so replays
  // produce the same value and are correctly identified as no-ops.
  const actionId = buildPendingActionId('RATING_RECEIVED', technicianId, ratingId);
  const { doc: upserted, noOp } = await upsertAction({
    id: actionId,
    userId: technicianId,
    type: 'RATING_RECEIVED',
    role: 'technician',
    sourceId: ratingId,
    expiresAt: stableExpiryFrom(customerSubmittedAt, RATING_RECEIVED_EXPIRY_MS),
    priority: 10,
    payload: {
      ratingId,
      customerId,
      overall: customerOverall,
      submittedAt: customerSubmittedAt,
    },
  });

  if (!noOp) {
    // STRICT: upsertAction THEN emitFcmForAction
    await emitFcmForAction(upserted, 'ratings');
  }
}

// ── Azure Functions trigger ───────────────────────────────────────────────────

app.cosmosDB('triggerProjectorRatings', {
  connection: 'COSMOS_CONNECTION_STRING',
  databaseName: '%COSMOS_DATABASE%',
  containerName: 'ratings',
  leaseContainerName: 'pending_actions_ratings_leases',
  createLeaseContainerIfNotExists: false,
  handler: async (documents: unknown[], ctx: InvocationContext) => {
    const docs = documents as Array<Partial<RatingDoc> & { id: string }>;
    for (const doc of docs) {
      try {
        await processRatingChangeFeedDoc(doc, ctx);
      } catch (err) {
        // Rethrow retryable Cosmos errors so runtime retries and checkpoint doesn't advance.
        if (isRetryableCosmosError(err)) {
          ctx.error('[trigger-projector-ratings] Retryable error — rethrowing for runtime retry', String(err));
          throw err;
        }
        ctx.error('[trigger-projector-ratings] Non-retryable error — swallowing to advance checkpoint', String(err));
      }
    }
  },
});
