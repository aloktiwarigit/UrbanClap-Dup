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

const RATING_RECEIVED_EXPIRY_MS = 7 * 24 * 60 * 60 * 1_000; // 7 days

function isoFromNow(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
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

  // Emit RATING_RECEIVED to the technician
  const actionId = buildPendingActionId('RATING_RECEIVED', technicianId, ratingId);
  const { doc: upserted, noOp } = await upsertAction({
    id: actionId,
    userId: technicianId,
    type: 'RATING_RECEIVED',
    role: 'technician',
    sourceId: ratingId,
    expiresAt: isoFromNow(RATING_RECEIVED_EXPIRY_MS),
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
        ctx.error('[trigger-projector-ratings] Error processing doc', String(err));
      }
    }
  },
});
