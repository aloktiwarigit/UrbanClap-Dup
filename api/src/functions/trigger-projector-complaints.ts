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

const COMPLAINT_UPDATE_EXPIRY_MS = 14 * 24 * 60 * 60 * 1_000; // 14 days

function isoFromNow(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

interface ComplaintDoc {
  id: string;
  customerId: string;
  technicianId?: string;
  bookingId: string;
  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
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
    const { doc: upserted, noOp } = await upsertAction({
      id: actionId,
      userId: customerId,
      type: 'COMPLAINT_UPDATE',
      role: 'customer',
      sourceId: complaintId,
      expiresAt: isoFromNow(COMPLAINT_UPDATE_EXPIRY_MS),
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
        ctx.error('[trigger-projector-complaints] Error processing doc', String(err));
      }
    }
  },
});
