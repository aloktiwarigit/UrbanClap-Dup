import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { randomUUID } from 'node:crypto';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { commissionReceivableRepo } from '../../../cosmos/commission-receivable-repository.js';
import { appendAuditEntry } from '../../../cosmos/audit-log-repository.js';
import { MarkCommissionReceivedBodySchema } from '../../../schemas/commission-receivable.js';

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
  const { bookingId, technicianId } = body;

  try {
    let result;
    if (body.action === 'REMIT') {
      result = await commissionReceivableRepo.markRemitted(bookingId, technicianId, {
        remittedAmount: body.remittedAmount,
        remittanceMethod: body.remittanceMethod,
        remittanceRef: body.remittanceRef,
        markedByAdminId: admin.adminId,
      });
    } else {
      result = await commissionReceivableRepo.markWaived(bookingId, technicianId, {
        waivedReason: body.waivedReason,
        markedByAdminId: admin.adminId,
      });
    }

    if (!result) {
      return { status: 404, jsonBody: { code: 'RECEIVABLE_NOT_FOUND' } };
    }

    const timestamp = new Date().toISOString();
    await appendAuditEntry({
      id: randomUUID(),
      adminId: admin.adminId,
      role: admin.role,
      action: body.action === 'REMIT' ? 'COMMISSION_REMITTED' : 'COMMISSION_WAIVED',
      resourceType: 'commission_receivable',
      resourceId: bookingId,
      payload: {
        technicianId,
        bookingId,
        action: body.action,
        ...(body.action === 'REMIT'
          ? {
              remittedAmount: body.remittedAmount,
              remittanceMethod: body.remittanceMethod,
              remittanceRef: body.remittanceRef,
            }
          : { waivedReason: body.waivedReason }),
      },
      timestamp,
      partitionKey: timestamp.slice(0, 7),
    }).catch(() => undefined);

    return { status: 200, jsonBody: result };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('markCommissionReceived', {
  methods: ['POST'],
  route: 'v1/admin/finance/commission-receivables/settle',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'finance'])(markCommissionReceivedHandler),
});
