import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { getWeekSnapshot, getPayoutQueue } from '../../../cosmos/finance-repository.js';

function priorWeekBounds(): { weekStart: string; weekEnd: string } {
  const weekEnd = new Date();
  weekEnd.setUTCHours(0, 0, 0, 0);
  weekEnd.setUTCDate(weekEnd.getUTCDate() - 1);
  const weekStart = new Date(weekEnd);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  return {
    weekStart: weekStart.toISOString().slice(0, 10),
    weekEnd: weekEnd.toISOString().slice(0, 10),
  };
}

export const adminPayoutQueueHandler: AdminHttpHandler = async (
  _req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> => {
  const { weekStart, weekEnd } = priorWeekBounds();
  try {
    const snapshot = await getWeekSnapshot(weekStart);
    if (snapshot) return { status: 200, jsonBody: snapshot };
    const queue = await getPayoutQueue(weekStart, weekEnd);
    return { status: 200, jsonBody: queue };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('adminPayoutQueue', {
  methods: ['GET'],
  route: 'v1/admin/finance/payout-queue',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager', 'finance'])(adminPayoutQueueHandler),
});
