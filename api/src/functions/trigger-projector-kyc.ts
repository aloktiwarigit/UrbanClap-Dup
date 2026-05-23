/**
 * E11-S02 — KYC source adapter (change-feed projector).
 *
 * Triggers: technicians container change feed.
 *   The KYC flow writes status changes to the `technicians` container as a nested
 *   `kyc` object via `upsertKycStatus()`. A dedicated `kyc_submissions` container
 *   does NOT exist — binding to it would mean the trigger never fires.
 *
 * Emits: KYC_RESUME (to the technician when KYC requires manual action)
 * Resolves: KYC_RESUME (when KYC reaches a terminal/complete status)
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
import type { TechnicianKyc } from '../schemas/kyc.js';
import { isRetryableCosmosError } from '../shared/cosmos-errors.js';

const KYC_RESUME_EXPIRY_MS = 30 * 24 * 60 * 60 * 1_000; // 30 days

/**
 * Shape of a technician document as received from the change feed.
 * The `kyc` object is a nested sub-document written by `upsertKycStatus()`.
 */
interface TechnicianChangeFeedDoc {
  id: string;
  kyc?: Partial<TechnicianKyc>;
}

/**
 * Derive stable expiry from the KYC sub-doc's updatedAt timestamp.
 * updatedAt changes exactly when the KYC status transitions, so same-status
 * replays produce the same expiresAt and are correctly identified as no-ops.
 */
function stableExpiryFrom(sourceIso: string | undefined, windowMs: number): string {
  const base = sourceIso ? new Date(sourceIso).getTime() : Date.now();
  return new Date(base + windowMs).toISOString();
}

/** KYC statuses that require technician action */
const ACTION_REQUIRED_STATUSES = new Set(['PENDING', 'PENDING_MANUAL', 'MANUAL_REVIEW']);
/** KYC statuses that indicate completion — resolve the pending action */
const COMPLETE_STATUSES = new Set(['COMPLETE', 'AADHAAR_DONE', 'PAN_DONE']);

/**
 * Exported for unit testing without Azure Functions runtime.
 *
 * Receives a TechnicianDoc change-feed event, inspects `doc.kyc.kycStatus`,
 * and emits or resolves KYC_RESUME accordingly.
 */
export async function processKycChangeFeedDoc(
  doc: TechnicianChangeFeedDoc,
  ctx?: InvocationContext,
): Promise<void> {
  const technicianId = doc.id;
  const kycStatus = doc.kyc?.kycStatus;

  if (!kycStatus) {
    // Document has no kyc sub-object yet (e.g., technician profile update without KYC fields)
    ctx?.log(`[trigger-projector-kyc] Skipping doc ${technicianId}: no kyc.kycStatus present`);
    return;
  }

  const actionId = buildPendingActionId('KYC_RESUME', technicianId, technicianId); // sourceId = technicianId (1 KYC per tech)

  if (ACTION_REQUIRED_STATUSES.has(kycStatus)) {
    // expiresAt derived from the KYC sub-doc's updatedAt (stable source timestamp).
    // Same kycStatus + same updatedAt → same expiresAt → replay is a no-op.
    const { doc: upserted, noOp } = await upsertAction({
      id: actionId,
      userId: technicianId,
      type: 'KYC_RESUME',
      role: 'technician',
      sourceId: technicianId,
      expiresAt: stableExpiryFrom(doc.kyc?.updatedAt, KYC_RESUME_EXPIRY_MS),
      priority: 2, // high priority — blocks earning
      payload: { kycStatus },
    });

    if (!noOp) {
      // STRICT: upsertAction THEN emitFcmForAction
      await emitFcmForAction(upserted, 'technicians');
    }
  } else if (COMPLETE_STATUSES.has(kycStatus)) {
    // KYC complete — resolve any pending KYC_RESUME action
    await resolveAction(actionId, technicianId);
  }
}

// ── Azure Functions trigger ───────────────────────────────────────────────────

app.cosmosDB('triggerProjectorKyc', {
  connection: 'COSMOS_CONNECTION_STRING',
  databaseName: '%COSMOS_DATABASE%',
  // Bind to `technicians` — the KYC flow writes kyc.kycStatus here via upsertKycStatus().
  // A `kyc_submissions` container does not exist; binding to it would mean this trigger
  // never fires and KYC_RESUME actions are never created.
  containerName: 'technicians',
  leaseContainerName: 'pending_actions_kyc_leases',
  createLeaseContainerIfNotExists: false,
  handler: async (documents: unknown[], ctx: InvocationContext) => {
    const docs = documents as TechnicianChangeFeedDoc[];
    for (const doc of docs) {
      try {
        await processKycChangeFeedDoc(doc, ctx);
      } catch (err) {
        // Rethrow retryable Cosmos errors so runtime retries and checkpoint doesn't advance.
        if (isRetryableCosmosError(err)) {
          ctx.error('[trigger-projector-kyc] Retryable error — rethrowing for runtime retry', String(err));
          throw err;
        }
        ctx.error('[trigger-projector-kyc] Non-retryable error — swallowing to advance checkpoint', String(err));
      }
    }
  },
});
