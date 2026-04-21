import '../../../bootstrap.js';
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { getCosmosClient, DB_NAME } from '../../../cosmos/client.js';
import { DashboardSummaryResponseSchema } from '../../../schemas/dashboard.js';

export async function summaryHandler(
  _req: HttpRequest,
  ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> {
  try {
    const db = getCosmosClient().database(DB_NAME);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const [bookingsResult, gmvResult, techsResult] = await Promise.all([
      db
        .container('bookings')
        .items.query({
          query: 'SELECT VALUE COUNT(1) FROM c WHERE c.createdAt >= @today',
          parameters: [{ name: '@today', value: todayIso }],
        })
        .fetchAll(),
      db
        .container('bookings')
        .items.query({
          query: 'SELECT VALUE SUM(c.amount) FROM c WHERE c.status = "completed" AND c.createdAt >= @today',
          parameters: [{ name: '@today', value: todayIso }],
        })
        .fetchAll(),
      db
        .container('technicians')
        .items.query({
          query: 'SELECT VALUE COUNT(1) FROM c WHERE c.isOnDuty = true',
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

    const commissionRate = parseFloat(process.env['COMMISSION_RATE'] ?? '0.225');
    const gmvToday: number = (gmvResult.resources[0] as number | undefined) ?? 0;
    const summary = {
      bookingsToday: (bookingsResult.resources[0] as number | undefined) ?? 0,
      gmvToday,
      commissionToday: Math.round(gmvToday * commissionRate),
      payoutsPending: 0,
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
