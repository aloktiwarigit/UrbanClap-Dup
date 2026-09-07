import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { randomUUID } from 'node:crypto';
import * as Sentry from '@sentry/node';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { commissionReceivableRepo } from '../../../cosmos/commission-receivable-repository.js';
import { appendAuditEntry } from '../../../cosmos/audit-log-repository.js';
import { recomputeCommissionHold } from '../../../services/commission-hold.service.js';
import { MarkCommissionReceivedBodySchema } from '../../../schemas/commission-receivable.js';

/**
 * Waive-only settle endpoint (E21-S02 Task 10). REMIT was retired in favor of the dedicated
 * `POST /v1/admin/finance/commission-remittances` endpoint, which allocates a single remittance
 * across multiple outstanding bookings instead of settling one booking at a time — callers still
 * hitting REMIT here are redirected via 410.
 */
export const markCommissionReceivedHandler: AdminHttpHandler = async (
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

  const parsed = MarkCommissionReceivedBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  const body = parsed.data;

  if (body.action === 'REMIT') {
    return { status: 410, jsonBody: { code: 'USE_COMMISSION_REMITTANCES' } };
  }

  const { bookingId, technicianId } = body;

  try {
    const result = await commissionReceivableRepo.markWaived(bookingId, technicianId, {
      waivedReason: body.waivedReason,
      markedByAdminId: admin.adminId,
    });

    if (!result) {
      return { status: 404, jsonBody: { code: 'RECEIVABLE_NOT_FOUND' } };
    }

    // Only emit audit entry (and recompute the hold) when the operation actually changed state; a
    // no-op on an already-settled entry must not produce a spurious audit record or a redundant
    // recompute.
    if (result.wasApplied) {
      const timestamp = new Date().toISOString();
      await appendAuditEntry({
        id: randomUUID(),
        adminId: admin.adminId,
        role: admin.role,
        action: 'COMMISSION_WAIVED',
        resourceType: 'commission_receivable',
        resourceId: bookingId,
        payload: { technicianId, bookingId, action: body.action, waivedReason: body.waivedReason },
        timestamp,
        partitionKey: timestamp.slice(0, 7),
      }).catch(() => undefined);

      try {
        await recomputeCommissionHold(technicianId);
      } catch (err: unknown) {
        Sentry.captureException(err);
      }
    }

    return { status: 200, jsonBody: result.entry };
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'CONFLICT' || code === 'PRECONDITION') {
      return { status: 409, jsonBody: { code: 'LEDGER_BUSY' } };
    }
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('markCommissionReceived', {
  methods: ['POST'],
  route: 'v1/admin/finance/commission-receivables/settle',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'finance'])(markCommissionReceivedHandler),
});
