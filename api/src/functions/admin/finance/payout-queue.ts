import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { getWeekSnapshot, getPayoutQueue } from '../../../cosmos/finance-repository.js';

function currentWeekBounds(): { weekStart: string; weekEnd: string } {
  const now = new Date();
  const dayOfWeek = now.getUTCDay() || 7;
  const monday = new Date(now);
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() - (dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return {
    weekStart: monday.toISOString().slice(0, 10),
    weekEnd: sunday.toISOString().slice(0, 10),
  };
}

export const adminPayoutQueueHandler: AdminHttpHandler = async (
  _req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> => {
  const { weekStart, weekEnd } = currentWeekBounds();
  const snapshot = await getWeekSnapshot(weekStart);
  if (snapshot) return { status: 200, jsonBody: snapshot };
  const queue = await getPayoutQueue(weekStart, weekEnd);
  return { status: 200, jsonBody: queue };
};

app.http('adminPayoutQueue', {
  methods: ['GET'],
  route: 'v1/admin/finance/payout-queue',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager', 'finance'])(adminPayoutQueueHandler),
});
