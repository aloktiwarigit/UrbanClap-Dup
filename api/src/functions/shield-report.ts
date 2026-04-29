import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import '../bootstrap.js';
import * as Sentry from '@sentry/node';
import { createHash } from 'node:crypto';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { addBlockedCustomer } from '../cosmos/technician-repository.js';
import { createComplaint, findShieldByTechBooking } from '../cosmos/complaints-repository.js';
import { sendAbusiveShieldAlert } from '../services/fcm.service.js';
import { ShieldReportBodySchema } from '../schemas/shield.js';
import type { ComplaintDoc } from '../schemas/complaint.js';

// A tech can file a shield report any time the booking is assigned to them, from
// dispatch acceptance through post-job closure. We exclude pre-assignment statuses
// (PENDING_PAYMENT, SEARCHING) and terminal-cancelled statuses (UNFULFILLED,
// CUSTOMER_CANCELLED, NO_SHOW_REDISPATCH) since those have no real tech assignment.
const ELIGIBLE_STATUSES = new Set([
  'ASSIGNED',
  'EN_ROUTE',
  'REACHED',
  'IN_PROGRESS',
  'AWAITING_PRICE_APPROVAL',
  'COMPLETED',
  'PAID',
  'CLOSED',
]);

export async function shieldReportHandler(req: HttpRequest, _ctx: InvocationContext): Promise<HttpResponseInit> {
  let uid: string;
  try {
    const d = await verifyTechnicianToken(req);
    uid = d.uid;
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'INVALID_JSON' } };
  }
  const parsed = ShieldReportBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  const booking = await bookingRepo.getById(parsed.data.bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.technicianId !== uid) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (!ELIGIBLE_STATUSES.has(booking.status)) {
    return { status: 409, jsonBody: { code: 'BOOKING_NOT_ELIGIBLE', status: booking.status } };
  }

  const existing = await findShieldByTechBooking(uid, parsed.data.bookingId);
  if (existing) return { status: 409, jsonBody: { code: 'SHIELD_ALREADY_FILED' } };

  const shieldId = createHash('sha256')
    .update(`shield-report:${parsed.data.bookingId}:${uid}`)
    .digest('hex')
    .slice(0, 36);

  const now = new Date().toISOString();
  const slaDeadlineAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const doc: ComplaintDoc = {
    id: shieldId,
    orderId: parsed.data.bookingId,
    customerId: booking.customerId,
    technicianId: uid,
    description: parsed.data.description ?? 'Abusive customer — tech-initiated report',
    type: 'ABUSIVE_CUSTOMER_SHIELD',
    status: 'NEW',
    internalNotes: [],
    slaDeadlineAt,
    escalated: false,
    ...(parsed.data.evidenceUrls?.length ? { evidenceUrls: parsed.data.evidenceUrls } : {}),
    createdAt: now,
    updatedAt: now,
  };

  try {
    await createComplaint(doc);
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 409) {
      return { status: 409, jsonBody: { code: 'SHIELD_ALREADY_FILED' } };
    }
    throw err;
  }

  addBlockedCustomer(uid, booking.customerId).catch((e) => Sentry.captureException(e));
  sendAbusiveShieldAlert({ bookingId: parsed.data.bookingId, technicianId: uid, customerId: booking.customerId })
    .catch((e) => Sentry.captureException(e));

  return { status: 201, jsonBody: { complaintId: shieldId } };
}

app.http('shieldReport', {
  route: 'v1/technicians/me/shield-report',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: shieldReportHandler,
});
