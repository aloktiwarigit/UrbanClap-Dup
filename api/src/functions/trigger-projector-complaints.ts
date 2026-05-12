/**
 * E11-S02 — Complaints source adapter (change-feed projector).
 *
 * Source: complaints container (reuses existing complaints-repository.ts).
 * Triggers: complaints container change feed.
 * Emits: COMPLAINT_UPDATE (to the customer when complaint status changes)
 * Resolves: COMPLAINT_UPDATE when complaint is RESOLVED.
 *
 * STRICT ORDERING: upsertAction MUST be called before emitFcmForAction.
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
import { isRetryableCosmosError } from '../shared/cosmos-errors.js';

const COMPLAINT_UPDATE_EXPIRY_MS = 14 * 24 * 60 * 60 * 1_000; // 14 days

/**
 * Derive a stable expiry from a source ISO timestamp + window.
 * Same source state → same expiresAt → isSemanticNoOp correctly identifies replays.
 */
function stableExpiryFrom(sourceIso: string | undefined, windowMs: number): string {
  const base = sourceIso ? new Date(sourceIso).getTime() : Date.now();
  return new Date(base + windowMs).toISOString();
}

interface ComplaintDoc {
  id: string;
  customerId: string;
  technicianId?: string;
  bookingId: string;
  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  createdAt?: string;
}

/** Statuses that warrant a customer notification */
const ACTIVE_STATUSES = new Set(['NEW', 'INVESTIGATING']);
/** Statuses that indicate closure */
const CLOSED_STATUSES = new Set(['RESOLVED', 'CLOSED']);

/**
 * Exported for unit testing without Azure Functions runtime.
 */
export async function processComplaintChangeFeedDoc(
  doc: Partial<ComplaintDoc> & { id: string },
  ctx?: InvocationContext,
): Promise<void> {
  const { id: complaintId, customerId, bookingId, status } = doc;

  if (!customerId || !bookingId || !status) {
    ctx?.warn(`[trigger-projector-complaints] Skipping doc ${complaintId}: missing required fields`);
    return;
  }

  const actionId = buildPendingActionId('COMPLAINT_UPDATE', customerId, complaintId);

  if (ACTIVE_STATUSES.has(status)) {
    // expiresAt derived from complaint.createdAt so replays produce the same value
    // and are correctly identified as no-ops by isSemanticNoOp().
    const { doc: upserted, noOp } = await upsertAction({
      id: actionId,
      userId: customerId,
      type: 'COMPLAINT_UPDATE',
      role: 'customer',
      sourceId: complaintId,
      expiresAt: stableExpiryFrom(doc.createdAt, COMPLAINT_UPDATE_EXPIRY_MS),
      priority: 8,
      payload: {
        complaintId,
        bookingId,
        status,
        technicianId: doc.technicianId,
      },
    });

    if (!noOp) {
      // STRICT: upsertAction THEN emitFcmForAction
      await emitFcmForAction(upserted, 'complaints');
    }
  } else if (CLOSED_STATUSES.has(status)) {
    // Complaint resolved — close the pending action
    await resolveAction(actionId, customerId);
  }
}

// ── Azure Functions trigger ───────────────────────────────────────────────────

app.cosmosDB('triggerProjectorComplaints', {
  connection: 'COSMOS_CONNECTION_STRING',
  databaseName: '%COSMOS_DATABASE%',
  containerName: 'complaints',
  leaseContainerName: 'pending_actions_complaints_leases',
  createLeaseContainerIfNotExists: false,
  handler: async (documents: unknown[], ctx: InvocationContext) => {
    const docs = documents as Array<Partial<ComplaintDoc> & { id: string }>;
    for (const doc of docs) {
      try {
        await processComplaintChangeFeedDoc(doc, ctx);
      } catch (err) {
        // Rethrow retryable Cosmos errors (503/5xx) so the runtime retries the batch
        // and the change-feed checkpoint does NOT advance past a failed document.
        if (isRetryableCosmosError(err)) {
          ctx.error('[trigger-projector-complaints] Retryable error — rethrowing for runtime retry', String(err));
          throw err;
        }
        ctx.error('[trigger-projector-complaints] Non-retryable error — swallowing to advance checkpoint', String(err));
      }
    }
  },
});
