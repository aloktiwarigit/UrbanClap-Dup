/**
 * E11-S02 — Bookings source adapter (change-feed projector).
 *
 * Triggers: bookings container change feed.
 * Emits: ADDON_APPROVAL_REQUESTED, RATING_PROMPT_CUSTOMER
 * Resolves: ADDON_APPROVAL_REQUESTED (when booking transitions out of AWAITING_PRICE_APPROVAL)
 *
 * STRICT ORDERING: upsertAction MUST be called before emitFcmForAction.
 * The Semgrep rule `pending-action-fcm-ordering` enforces this.
 */

import '../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import {
  upsertAction,
  resolveAction,
  emitFcmForAction,
  buildPendingActionId,
} from '../services/pending-action-projector.js';
import type { BookingDoc } from '../schemas/booking.js';
import { isRetryableCosmosError } from '../shared/cosmos-errors.js';

// Expiry windows (ISO duration → ms approximation)
const ADDON_EXPIRY_MS = 24 * 60 * 60 * 1_000; // 24h
const RATING_PROMPT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1_000; // 7 days

/**
 * Derive a stable expiry ISO string from a source timestamp.
 *
 * Using a stable source timestamp (e.g., booking.createdAt) instead of
 * Date.now() ensures that replayed change-feed events produce the exact same
 * expiresAt value, so isSemanticNoOp() correctly identifies them as no-ops
 * and does NOT bump version or re-send FCM.
 *
 * Falls back to Date.now() only when no source timestamp is available
 * (e.g., legacy documents created before the field was added).
 */
function stableExpiryFrom(sourceIso: string | undefined, windowMs: number): string {
  const base = sourceIso ? new Date(sourceIso).getTime() : Date.now();
  return new Date(base + windowMs).toISOString();
}

/**
 * Exported for unit testing without Azure Functions runtime.
 */
export async function processBookingChangeFeedDoc(
  doc: Partial<BookingDoc> & { id: string },
  ctx?: InvocationContext,
): Promise<void> {
  const { id: bookingId, customerId, status } = doc;

  if (!customerId || !status) {
    ctx?.warn(`[trigger-projector-bookings] Skipping doc ${bookingId}: missing customerId or status`);
    return;
  }

  if (status === 'AWAITING_PRICE_APPROVAL') {
    // Emit ADDON_APPROVAL_REQUESTED
    // expiresAt is derived from booking.createdAt (stable source timestamp) so that
    // replayed change-feed events produce the same value and are correctly identified
    // as no-ops by isSemanticNoOp(), preventing spurious version bumps and FCM resends.
    const actionId = buildPendingActionId('ADDON_APPROVAL_REQUESTED', customerId, bookingId);
    const { doc: upserted, noOp } = await upsertAction({
      id: actionId,
      userId: customerId,
      type: 'ADDON_APPROVAL_REQUESTED',
      role: 'customer',
      sourceId: bookingId,
      expiresAt: stableExpiryFrom(doc.createdAt, ADDON_EXPIRY_MS),
      priority: 1, // highest priority — blocks booking progress
      payload: {
        bookingId,
        addOnCount: (doc.pendingAddOns ?? []).length,
        addOnTotal: (doc.pendingAddOns ?? []).reduce((s, a) => s + (a.price ?? 0), 0),
      },
    });
    if (!noOp) {
      // STRICT: upsertAction THEN emitFcmForAction
      await emitFcmForAction(upserted, 'bookings');
    }
  } else if (status === 'PAID' || status === 'IN_PROGRESS') {
    // Booking moved past price-approval — resolve any pending ADDON_APPROVAL_REQUESTED
    const actionId = buildPendingActionId('ADDON_APPROVAL_REQUESTED', customerId, bookingId);
    await resolveAction(actionId, customerId);
  } else if (status === 'COMPLETED') {
    // Prompt customer to rate the technician.
    // expiresAt derived from booking.completedAt (stable) so replays are idempotent.
    const actionId = buildPendingActionId('RATING_PROMPT_CUSTOMER', customerId, bookingId);
    const { doc: upserted, noOp } = await upsertAction({
      id: actionId,
      userId: customerId,
      type: 'RATING_PROMPT_CUSTOMER',
      role: 'customer',
      sourceId: bookingId,
      expiresAt: stableExpiryFrom(doc.completedAt ?? doc.createdAt, RATING_PROMPT_EXPIRY_MS),
      priority: 5,
      payload: { bookingId, technicianId: doc.technicianId },
    });
    if (!noOp) {
      // STRICT: upsertAction THEN emitFcmForAction
      await emitFcmForAction(upserted, 'bookings');
    }
  }
}

// ── Azure Functions trigger ───────────────────────────────────────────────────

app.cosmosDB('triggerProjectorBookings', {
  connection: 'COSMOS_CONNECTION_STRING',
  databaseName: '%COSMOS_DATABASE%',
  containerName: 'bookings',
  leaseContainerName: 'pending_actions_bookings_leases',
  createLeaseContainerIfNotExists: false,
  handler: async (documents: unknown[], ctx: InvocationContext) => {
    const docs = documents as Array<Partial<BookingDoc> & { id: string }>;
    for (const doc of docs) {
      try {
        await processBookingChangeFeedDoc(doc, ctx);
      } catch (err) {
        // Retry policy: rethrow retryable Cosmos errors (503 Service Unavailable) so the
        // Azure Functions runtime retries the batch and the change-feed checkpoint does NOT
        // advance past a failed document. Note: 429 (throttling) is already transparently
        // retried by the Cosmos SDK (maxRetryAttemptsOnThrottledRequests=9 in client.ts).
        // Only swallow truly non-retryable errors (4xx validation failures) to avoid
        // poison-pill documents permanently blocking the change-feed processor.
        if (isRetryableCosmosError(err)) {
          ctx.error('[trigger-projector-bookings] Retryable error — rethrowing for runtime retry', String(err));
          throw err;
        }
        ctx.error('[trigger-projector-bookings] Non-retryable error — swallowing to advance checkpoint', String(err));
      }
    }
  },
});
