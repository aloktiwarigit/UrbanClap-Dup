import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { commissionReceivableRepo } from '../../../cosmos/commission-receivable-repository.js';
import { readCommissionHold } from '../../../cosmos/technician-repository.js';
import { systemDocsRepo } from '../../../cosmos/system-docs-repository.js';
import { applyCredit } from '../../../services/commission-allocator.service.js';
import { recomputeCommissionHold } from '../../../services/commission-hold.service.js';
import { auditLog } from '../../../services/auditLog.service.js';
import { RecordRemittanceBodySchema, remittanceDocId } from '../../../schemas/commission-ledger.js';
import type { CommissionHold } from '../../../schemas/technician.js';

/**
 * Records a technician's cash/UPI remittance and applies it against their oldest outstanding
 * receivables (E21-S02 Task 10). Idempotent on `idempotencyKey`: a replayed call with the same
 * key returns the previously-recorded remittance without re-applying credit or re-auditing.
 *
 * The hold recompute is best-effort: a failure there must never fail the remittance itself (the
 * money has already moved and the ledger batch already committed) — it's Sentry-captured and the
 * technician is queued for the async hold-repair sweep instead.
 */
export const recordCommissionRemittanceHandler: AdminHttpHandler = async (
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> => {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'PARSE_ERROR' } };
  }

  const parsed = RecordRemittanceBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  const body = parsed.data;
  const anchorId = remittanceDocId(body.idempotencyKey);

  try {
    const existing = await commissionReceivableRepo.getRemittance(body.technicianId, anchorId);
    if (existing) {
      const { hold } = await readCommissionHold(body.technicianId);
      return {
        status: 200,
        jsonBody: {
          remittance: existing,
          allocations: existing.allocations,
          creditCreatedPaise: existing.creditCreatedPaise,
          hold,
          holdRecomputePending: false,
          replayed: true,
        },
      };
    }

    const now = new Date().toISOString();
    const result = await applyCredit({
      technicianId: body.technicianId,
      refId: anchorId,
      source: 'REMITTANCE',
      paise: body.amountPaise,
      byId: admin.adminId,
      anchor: {
        id: anchorId,
        build: (plan) => ({
          id: anchorId,
          docType: 'REMITTANCE',
          technicianId: body.technicianId,
          partitionKey: body.technicianId,
          amountPaise: body.amountPaise,
          method: body.method,
          ref: body.ref,
          ...(body.note ? { note: body.note } : {}),
          allocations: plan.allocations,
          creditCreatedPaise: plan.leftoverPaise,
          recordedByAdminId: admin.adminId,
          idempotencyKey: body.idempotencyKey,
          createdAt: now,
        }),
      },
    });

    let hold: CommissionHold | null = null;
    let holdRecomputePending = false;
    try {
      hold = (await recomputeCommissionHold(body.technicianId)).hold;
    } catch (e: unknown) {
      Sentry.captureException(e);
      holdRecomputePending = true;
      await systemDocsRepo.enqueueHoldRepair([body.technicianId]).catch((e2: unknown) => Sentry.captureException(e2));
    }

    const remittance = await commissionReceivableRepo.getRemittance(body.technicianId, anchorId);
    if (!remittance) {
      return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
    }

    const allocations = result.replayed ? remittance.allocations : result.allocations;
    const creditCreatedPaise = result.replayed ? remittance.creditCreatedPaise : result.creditCreatedPaise;

    if (!result.replayed) {
      await auditLog(admin, 'COMMISSION_REMITTANCE_RECORDED', 'commission_remittance', anchorId, {
        technicianId: body.technicianId,
        amountPaise: body.amountPaise,
        method: body.method,
        ref: body.ref,
        allocations,
        creditCreatedPaise,
      });
    }

    return {
      status: 200,
      jsonBody: { remittance, allocations, creditCreatedPaise, hold, holdRecomputePending, replayed: result.replayed },
    };
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'IDEMPOTENCY_MISMATCH') return { status: 409, jsonBody: { code: 'IDEMPOTENCY_MISMATCH' } };
    if (code === 'PRECONDITION') return { status: 409, jsonBody: { code: 'LEDGER_BUSY' } };
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('recordCommissionRemittance', {
  methods: ['POST'],
  route: 'v1/admin/finance/commission-remittances',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'finance'])(recordCommissionRemittanceHandler),
});
