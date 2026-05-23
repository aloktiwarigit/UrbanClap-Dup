import * as Sentry from '@sentry/node';
import { type HttpHandler, type InvocationContext, app } from '@azure/functions';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { consume } from '../cosmos/rate-limit-repository.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { liveLocationRepo } from '../cosmos/live-location-repository.js';
import { PostLocationRequestSchema } from '../schemas/live-location.js';
import { sendPeriodicLocationPush } from '../services/fcm.service.js';
import { isPeriodicLocationEnabled } from '../services/featureFlags.service.js';

const ACTIVE_STATUSES = new Set(['EN_ROUTE', 'REACHED', 'IN_PROGRESS']);
const STALENESS_MS = 90_000;

export const activeJobLocationHandler: HttpHandler = async (req, ctx: InvocationContext) => {
  let uid: string;
  try {
    ({ uid } = await verifyTechnicianToken(req));
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };
  }

  const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;

  // Rate-limit keyed by authenticated uid+bookingId - fires after auth so an
  // unauthenticated caller cannot exhaust the bucket for a legitimate technician.
  const rlResult = await consume(`rl:loc:${uid}:${bookingId}`, 1, 1 / 15);
  if (!rlResult.allowed) {
    const retryAfterSec = Math.ceil((rlResult.retryAfterMs ?? 1000) / 1000);
    return {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec), 'Content-Type': 'application/json' },
      jsonBody: { code: 'RATE_LIMITED', retryAfterMs: rlResult.retryAfterMs },
    };
  }
  const booking = await bookingRepo.getById(bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.technicianId !== uid) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (!ACTIVE_STATUSES.has(booking.status)) {
    return { status: 409, jsonBody: { code: 'BOOKING_NOT_ACTIVE' } };
  }

  let body: import('../schemas/live-location.js').PostLocationRequest;
  try {
    const raw: unknown = await req.json();
    const result = PostLocationRequestSchema.safeParse(raw);
    if (!result.success) {
      return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: result.error.issues } };
    }
    body = result.data;
  } catch {
    return { status: 400, jsonBody: { code: 'PARSE_ERROR' } };
  }

  if (Math.abs(Date.now() - body.capturedAt) > STALENESS_MS) {
    return { status: 400, jsonBody: { code: 'STALE_FIX' } };
  }

  if (body.attestation?.isMock === true) {
    Sentry.withScope((scope) => {
      scope.setLevel('warning');
      scope.setExtras({ bookingId, technicianId: uid });
      Sentry.captureMessage('periodic location push with mock GPS fix');
    });
  }

  await liveLocationRepo.upsert({
    id: bookingId,
    bookingId,
    technicianId: uid,
    customerId: booking.customerId,
    lat: body.lat,
    lng: body.lng,
    accuracyMeters: body.accuracyMeters,
    capturedAt: body.capturedAt,
    isMock: body.attestation?.isMock ?? false,
    receivedAt: new Date().toISOString(),
    ttl: 3600,
  });

  const flagOn = await isPeriodicLocationEnabled(booking.customerId);
  if (flagOn) {
    await sendPeriodicLocationPush({
      customerId: booking.customerId,
      bookingId,
      lat: body.lat,
      lng: body.lng,
      capturedAt: body.capturedAt,
    }).catch((err: unknown) => ctx.error('FCM LOCATION_UPDATE failed', err));
  }

  return { status: 204 };
};

app.http('activeJobLocation', {
  route: 'v1/technicians/active-job/{bookingId}/location',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: activeJobLocationHandler,
});
