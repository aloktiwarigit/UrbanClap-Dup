import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import {
  getWeekSnapshot, getPayoutQueue, getLedgerTransfer, writeLedgerEntry, getTechnicianLinkedAccount,
} from '../../../cosmos/finance-repository.js';
import { RazorpayRouteService } from '../../../services/razorpayRoute.service.js';
import { auditLog } from '../../../services/auditLog.service.js';

function priorWeekBounds(): { weekStart: string; weekEnd: string } {
  const weekEnd = new Date();
  weekEnd.setUTCHours(0, 0, 0, 0);
  weekEnd.setUTCDate(weekEnd.getUTCDate() - 1);
  const weekStart = new Date(weekEnd);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  return { weekStart: weekStart.toISOString().slice(0, 10), weekEnd: weekEnd.toISOString().slice(0, 10) };
}

export const adminApprovePayoutsHandler: AdminHttpHandler = async (
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> => {
  if (admin.role !== 'super-admin') {
    return { status: 403, jsonBody: { code: 'FORBIDDEN', requiredRoles: ['super-admin'] } };
  }

  const { weekStart, weekEnd } = priorWeekBounds();
  const queue = (await getWeekSnapshot(weekStart)) ?? (await getPayoutQueue(weekStart, weekEnd));

  const razorpay = new RazorpayRouteService();
  let approved = 0;
  let failed = 0;
  const errors: Array<{ technicianId: string; reason: string }> = [];

  for (const entry of queue.entries) {
    const existing = await getLedgerTransfer(entry.technicianId, weekStart);
    if (existing) {
      approved += 1;
      continue;
    }

    if (entry.netPayable <= 0) {
      failed += 1;
      errors.push({ technicianId: entry.technicianId, reason: 'netPayable must be positive' });
      continue;
    }

    const accountId = await getTechnicianLinkedAccount(entry.technicianId);
    if (!accountId) {
      failed += 1;
      errors.push({ technicianId: entry.technicianId, reason: 'no linked Razorpay account' });
      continue;
    }

    try {
      const { transferId } = await razorpay.transfer({
        accountId,
        amount: entry.netPayable,
        notes: { weekStart, technicianId: entry.technicianId, technicianName: entry.technicianName },
        idempotencyKey: `${entry.technicianId}-${weekStart}`,
      });
      await writeLedgerEntry({
        technicianId: entry.technicianId,
        amount: entry.netPayable,
        type: 'TRANSFER',
        weekStart,
        razorpayTransferId: transferId,
      });
      approved += 1;
    } catch (err: unknown) {
      failed += 1;
      errors.push({
        technicianId: entry.technicianId,
        reason: err instanceof Error ? err.message : 'transfer failed',
      });
    }
  }

  await auditLog(
    { adminId: admin.adminId, role: admin.role, sessionId: admin.sessionId },
    'PAYOUT_APPROVE',
    'payout_batch',
    weekStart,
    { approved, failed },
    { ip: req.headers.get('x-forwarded-for') ?? 'unknown' },
  );

  return { status: 200, jsonBody: { approved, failed, errors } };
};

app.http('adminApprovePayouts', {
  methods: ['POST'],
  route: 'v1/admin/finance/payouts/approve-all',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin'])(adminApprovePayoutsHandler),
});
