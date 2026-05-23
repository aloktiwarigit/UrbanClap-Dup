import '../../../bootstrap.js';
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { getCosmosClient, DB_NAME } from '../../../cosmos/client.js';
import { getPayoutQueue, getWeekSnapshot } from '../../../cosmos/finance-repository.js';
import { DashboardSummaryResponseSchema } from '../../../schemas/dashboard.js';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getIndiaBusinessDay(now = new Date()): { date: string; startIso: string } {
  const shifted = new Date(now.getTime() + IST_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const date = shifted.getUTCDate();
  const start = new Date(Date.UTC(year, month, date) - IST_OFFSET_MS);
  return {
    date: shifted.toISOString().slice(0, 10),
    startIso: start.toISOString(),
  };
}

function priorWeekBounds(now = new Date()): { weekStart: string; weekEnd: string } {
  const weekEnd = new Date(now);
  weekEnd.setUTCHours(0, 0, 0, 0);
  weekEnd.setUTCDate(weekEnd.getUTCDate() - 1);
  const weekStart = new Date(weekEnd);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  return {
    weekStart: weekStart.toISOString().slice(0, 10),
    weekEnd: weekEnd.toISOString().slice(0, 10),
  };
}

export async function summaryHandler(
  _req: HttpRequest,
  ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> {
  try {
    const db = getCosmosClient().database(DB_NAME);
    const today = getIndiaBusinessDay();
    const { weekStart, weekEnd } = priorWeekBounds();

    const [bookingsResult, gmvResult, techsResult] = await Promise.all([
      db
        .container('bookings')
        .items.query({
          query: 'SELECT VALUE COUNT(1) FROM c WHERE c.slotDate = @todayDate OR c.createdAt >= @todayStart',
          parameters: [
            { name: '@todayDate', value: today.date },
            { name: '@todayStart', value: today.startIso },
          ],
        })
        .fetchAll(),
      db
        .container('bookings')
        .items.query({
          query:
            'SELECT VALUE SUM(IIF(IS_DEFINED(c.finalAmount), c.finalAmount, c.amount)) FROM c WHERE c.slotDate = @todayDate OR c.createdAt >= @todayStart',
          parameters: [
            { name: '@todayDate', value: today.date },
            { name: '@todayStart', value: today.startIso },
          ],
        })
        .fetchAll(),
      db
        .container('technicians')
        .items.query({
          query: 'SELECT VALUE COUNT(1) FROM c WHERE c.isOnline = true AND (NOT IS_DEFINED(c.suspended) OR c.suspended = false)',
          parameters: [],
        })
        .fetchAll(),
    ]);

    // Isolated so a missing complaints container (pre-seed) returns 0 instead of breaking the dashboard.
    const complaintsOpen = await db
      .container('complaints')
      .items.query({
        query: 'SELECT VALUE COUNT(1) FROM c WHERE c.status IN ("NEW", "INVESTIGATING")',
        parameters: [],
      })
      .fetchAll()
      .then((r) => (r.resources[0] as number | undefined) ?? 0)
      .catch((err: unknown) => {
        if (typeof err === 'object' && err !== null && 'code' in err && err.code === 404) return 0;
        throw err;
      });

    const payoutQueue =
      (await getWeekSnapshot(weekStart).catch(() => null)) ?? (await getPayoutQueue(weekStart, weekEnd));
    const commissionRate = parseFloat(process.env['COMMISSION_RATE'] ?? '0.225');
    const gmvToday: number = (gmvResult.resources[0] as number | undefined) ?? 0;
    const summary = {
      bookingsToday: (bookingsResult.resources[0] as number | undefined) ?? 0,
      gmvToday,
      commissionToday: Math.round(gmvToday * commissionRate),
      payoutsPending: Math.round(payoutQueue.totalNetPayable),
      complaintsOpen,
      techsOnDuty: (techsResult.resources[0] as number | undefined) ?? 0,
    };

    return {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
      jsonBody: DashboardSummaryResponseSchema.parse({ summary }),
    };
  } catch {
    ctx.error('Cosmos error in dashboard/summary');
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
}

app.http('adminDashboardSummary', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'v1/admin/dashboard/summary',
  handler: requireAdmin(['super-admin', 'ops-manager'])(summaryHandler),
});
