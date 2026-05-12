/**
 * E11-S02 — KYC source adapter (change-feed projector).
 *
 * Triggers: kyc_submissions container change feed.
 * Emits: KYC_RESUME (to the technician when KYC requires manual action)
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

const KYC_RESUME_EXPIRY_MS = 30 * 24 * 60 * 60 * 1_000; // 30 days

function isoFromNow(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

type KycDoc = TechnicianKyc & { id: string; technicianId: string };

/** KYC statuses that require technician action */
const ACTION_REQUIRED_STATUSES = new Set(['PENDING', 'PENDING_MANUAL', 'MANUAL_REVIEW']);
/** KYC statuses that indicate completion — resolve the pending action */
const COMPLETE_STATUSES = new Set(['COMPLETE', 'AADHAAR_DONE', 'PAN_DONE']);

/**
 * Exported for unit testing without Azure Functions runtime.
 */
export async function processKycChangeFeedDoc(
  doc: Partial<KycDoc> & { id: string },
  ctx?: InvocationContext,
): Promise<void> {
  const { id: kycId, technicianId, kycStatus } = doc;

  if (!technicianId || !kycStatus) {
    ctx?.warn(`[trigger-projector-kyc] Skipping doc ${kycId}: missing technicianId or kycStatus`);
    return;
  }

  const actionId = buildPendingActionId('KYC_RESUME', technicianId, technicianId); // sourceId = technicianId (1 KYC per tech)

  if (ACTION_REQUIRED_STATUSES.has(kycStatus)) {
    const { doc: upserted, noOp } = await upsertAction({
      id: actionId,
      userId: technicianId,
      type: 'KYC_RESUME',
      role: 'technician',
      sourceId: technicianId,
      expiresAt: isoFromNow(KYC_RESUME_EXPIRY_MS),
      priority: 2, // high priority — blocks earning
      payload: { kycId, kycStatus },
    });

    if (!noOp) {
      // STRICT: upsertAction THEN emitFcmForAction
      await emitFcmForAction(upserted, 'kyc');
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
  containerName: 'kyc_submissions',
  leaseContainerName: 'pending_actions_kyc_leases',
  createLeaseContainerIfNotExists: false,
  handler: async (documents: unknown[], ctx: InvocationContext) => {
    const docs = documents as Array<Partial<KycDoc> & { id: string }>;
    for (const doc of docs) {
      try {
        await processKycChangeFeedDoc(doc, ctx);
      } catch (err) {
        ctx.error('[trigger-projector-kyc] Error processing doc', String(err));
      }
    }
  },
});
