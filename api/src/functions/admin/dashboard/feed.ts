import '../../../bootstrap.js';
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { getCosmosClient, DB_NAME } from '../../../cosmos/client.js';
import { BookingEventsResponseSchema, type BookingEvent } from '../../../schemas/dashboard.js';

const FEED_LIMIT = 50;

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function feedKind(status: string): BookingEvent['kind'] {
  if (['ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL'].includes(status)) {
    return 'assigned';
  }
  if (['COMPLETED', 'PAID', 'CLOSED'].includes(status)) return 'completed';
  if (['UNFULFILLED', 'CUSTOMER_CANCELLED', 'NO_SHOW_REDISPATCH', 'CANCELLED'].includes(status)) {
    return 'alert';
  }
  return 'booking';
}

function feedTitle(status: string): string {
  switch (feedKind(status)) {
    case 'assigned':
      return 'Booking assigned';
    case 'completed':
      return 'Booking completed';
    case 'alert':
      return 'Booking needs attention';
    default:
      return 'New booking';
  }
}

function toFeedEvent(resource: unknown): BookingEvent {
  const raw = resource as Record<string, unknown>;
  const id = asString(raw['id']) ?? '';
  const status = asString(raw['status']) ?? 'UNKNOWN';
  const slotDate = asString(raw['slotDate']);
  const slotWindow = asString(raw['slotWindow']);

  return {
    id: `booking:${id}`,
    bookingId: id,
    status,
    customerId: asString(raw['customerId']) ?? 'unknown-customer',
    technicianId: asString(raw['technicianId']),
    serviceId: asString(raw['serviceId']) ?? 'unknown-service',
    amount: asNumber(raw['finalAmount']) ?? asNumber(raw['amount']) ?? 0,
    createdAt: asString(raw['createdAt']) ?? new Date(0).toISOString(),
    kind: feedKind(status),
    title: feedTitle(status),
    detail: slotDate && slotWindow ? `${slotDate} ${slotWindow}` : asString(raw['addressText']),
  };
}

export async function feedHandler(
  _req: HttpRequest,
  ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> {
  try {
    const db = getCosmosClient().database(DB_NAME);

    const result = await db
      .container('bookings')
      .items.query({
        query: `SELECT TOP ${FEED_LIMIT} c.id, c.status, c.customerId, c.technicianId, c.serviceId, c.amount, c.finalAmount, c.createdAt, c.slotDate, c.slotWindow, c.addressText FROM c ORDER BY c.createdAt DESC`,
        parameters: [],
      })
      .fetchAll();

    const events = result.resources.map(toFeedEvent);

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
