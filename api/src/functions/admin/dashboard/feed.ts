import '../../../bootstrap.js';
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { getCosmosClient, DB_NAME } from '../../../cosmos/client.js';
import { BookingEventsResponseSchema } from '../../../schemas/dashboard.js';

const FEED_LIMIT = 50;

export async function feedHandler(
  _req: HttpRequest,
  ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> {
  try {
    const db = getCosmosClient().database(DB_NAME);

    const result = await db
      .container('booking_events')
      .items.query({
        query: `SELECT TOP ${FEED_LIMIT} c.id, c.bookingId, c.status, c.customerId, c.technicianId, c.serviceId, c.amount, c.createdAt, c.kind, c.title, c.detail FROM c ORDER BY c.createdAt DESC`,
        parameters: [],
      })
      .fetchAll();

    const events = result.resources;

    return {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
      jsonBody: BookingEventsResponseSchema.parse({ events, total: events.length }),
    };
  } catch {
    ctx.error('Cosmos error in dashboard/feed');
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
}

app.http('adminDashboardFeed', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'v1/admin/dashboard/feed',
  handler: requireAdmin(['super-admin', 'ops-manager'])(feedHandler),
});
