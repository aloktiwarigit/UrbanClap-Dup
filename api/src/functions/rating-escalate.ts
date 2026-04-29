import { randomUUID, createHash } from 'crypto';
import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { requireCustomer } from '../middleware/requireCustomer.js';
import type { CustomerContext } from '../types/customer.js';
import { EscalateRatingBodySchema } from '../schemas/complaint.js';
import type { ComplaintDoc } from '../schemas/complaint.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { ratingRepo } from '../cosmos/rating-repository.js';
import { createComplaint, findRatingShieldEscalation } from '../cosmos/complaints-repository.js';
import { sendOwnerRatingShieldAlert } from '../services/fcm.service.js';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';

export async function escalateRatingHandler(
  req: HttpRequest,
  ctx: InvocationContext,
  customer: CustomerContext,
): Promise<HttpResponseInit> {
  const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'INVALID_JSON' } };
  }
  const parsed = EscalateRatingBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  const booking = await bookingRepo.getById(bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.customerId !== customer.customerId) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (booking.status !== 'CLOSED') return { status: 409, jsonBody: { code: 'BOOKING_NOT_CLOSED' } };
  if (!booking.technicianId) return { status: 409, jsonBody: { code: 'NO_TECHNICIAN' } };

  // Both pre-create checks query Cosmos — wrap together so a 404 from an unprovisioned
  // container surfaces as CONTAINER_NOT_PROVISIONED rather than an unhandled 500.
  let existingRating: Awaited<ReturnType<typeof ratingRepo.getByBookingId>>;
  let existing: Awaited<ReturnType<typeof findRatingShieldEscalation>>;
  try {
    [existingRating, existing] = await Promise.all([
      ratingRepo.getByBookingId(bookingId),
      findRatingShieldEscalation(bookingId, customer.customerId),
    ]);
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 404) {
      return { status: 503, jsonBody: { code: 'CONTAINER_NOT_PROVISIONED' } };
    }
    throw err;
  }
  if (existingRating?.customerSubmittedAt) {
    return { status: 409, jsonBody: { code: 'RATING_ALREADY_SUBMITTED' } };
  }
  if (existing) return { status: 409, jsonBody: { code: 'SHIELD_ALREADY_ESCALATED' } };

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // Deterministic ID: concurrent duplicate requests both try to create the same document ID;
  // Cosmos rejects the second with a conflict, which we surface as SHIELD_ALREADY_ESCALATED.
  const shieldId = createHash('sha256')
    .update(`shield:${bookingId}:${customer.customerId}`)
    .digest('hex')
    .slice(0, 36);

  const doc: ComplaintDoc = {
    id: shieldId,
    orderId: bookingId,
    customerId: customer.customerId,
    technicianId: booking.technicianId ?? '',
    description: `Rating Shield — booking ${bookingId} — draft: ${parsed.data.draftOverall}★`,
    type: 'RATING_SHIELD',
    draftOverall: parsed.data.draftOverall,
    ...(parsed.data.draftComment !== undefined ? { draftComment: parsed.data.draftComment } : {}),
    status: 'NEW',
    internalNotes: [],
    slaDeadlineAt: expiresAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    escalated: false,
    ackBreached: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  try {
    await createComplaint(doc);
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err) {
      const code = (err as { code: number }).code;
      if (code === 404) return { status: 503, jsonBody: { code: 'CONTAINER_NOT_PROVISIONED' } };
      if (code === 409) return { status: 409, jsonBody: { code: 'SHIELD_ALREADY_ESCALATED' } };
    }
    throw err;
  }

  const _ts = new Date().toISOString();
  void appendAuditEntry({ id: randomUUID(), adminId: customer.customerId, role: 'system', action: 'RATING_SHIELD_ESCALATED', resourceType: 'booking', resourceId: bookingId, payload: { bookingId, complaintId: doc.id, draftOverall: parsed.data.draftOverall }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);

  sendOwnerRatingShieldAlert({
    bookingId,
    technicianId: booking.technicianId ?? '',
    draftOverall: parsed.data.draftOverall,
  }).catch((err: unknown) => ctx.error('FCM OWNER_RATING_SHIELD_ALERT failed', err));

  return { status: 201, jsonBody: { complaintId: doc.id, expiresAt: expiresAt.toISOString() } };
}

app.http('escalateRating', {
  methods: ['POST'],
  route: 'v1/ratings/{bookingId}/escalate',
  authLevel: 'anonymous',
  handler: requireCustomer(escalateRatingHandler),
});
