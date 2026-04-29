import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import '../bootstrap.js';
import * as Sentry from '@sentry/node';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { ratingRepo } from '../cosmos/rating-repository.js';
import { createComplaint, countAppealsByTechInMonth } from '../cosmos/complaints-repository.js';
import { sendAppealFiledAlert } from '../services/fcm.service.js';
import { RatingAppealBodySchema } from '../schemas/shield.js';
import type { ComplaintDoc } from '../schemas/complaint.js';

export async function ratingAppealHandler(req: HttpRequest, _ctx: InvocationContext): Promise<HttpResponseInit> {
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
  const parsed = RatingAppealBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  const booking = await bookingRepo.getById(parsed.data.bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.technicianId !== uid) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };

  const rating = await ratingRepo.getByBookingId(parsed.data.bookingId);
  if (!rating?.customerSubmittedAt) {
    return { status: 409, jsonBody: { code: 'RATING_NOT_SUBMITTED' } };
  }
  // Defense in depth: the UI only shows the appeal button for ratings < 5★, but
  // the server must reject 5★ appeals too so a tampered request can't bypass.
  if ((rating.customerOverall ?? 5) >= 5) {
    return { status: 409, jsonBody: { code: 'RATING_NOT_APPEALABLE' } };
  }

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const appealCount = await countAppealsByTechInMonth(uid, monthStart);
  if (appealCount > 0) {
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return {
      status: 409,
      jsonBody: { code: 'APPEAL_QUOTA_EXCEEDED', nextAvailableAt: nextMonth.toISOString() },
    };
  }

  // Deterministic ID enforces at-most-one appeal per tech per month at the Cosmos level.
  // Cosmos rejects items.create() with 409 on duplicate id, closing the check-then-act race.
  const yearMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const appealId = `appeal-${uid}-${yearMonth}`;
  const slaDeadlineAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const nowIso = now.toISOString();
  const doc: ComplaintDoc = {
    id: appealId,
    orderId: parsed.data.bookingId,
    customerId: booking.customerId,
    technicianId: uid,
    description: parsed.data.reason,
    type: 'RATING_APPEAL',
    status: 'NEW',
    internalNotes: [],
    slaDeadlineAt,
    escalated: false,
    ...(parsed.data.evidenceUrls?.length ? { evidenceUrls: parsed.data.evidenceUrls } : {}),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    await createComplaint(doc);
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: number }).code === 409) {
      const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      return {
        status: 409,
        jsonBody: { code: 'APPEAL_QUOTA_EXCEEDED', nextAvailableAt: nextMonth.toISOString() },
      };
    }
    throw e;
  }

  sendAppealFiledAlert({ appealId, technicianId: uid, bookingId: parsed.data.bookingId })
    .catch((e) => Sentry.captureException(e));

  return { status: 201, jsonBody: { appealId } };
}

app.http('ratingAppeal', {
  route: 'v1/technicians/me/rating-appeal',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: ratingAppealHandler,
});
