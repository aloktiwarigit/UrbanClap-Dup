import * as Sentry from '@sentry/node';
import { z } from 'zod';
import { type HttpHandler, type InvocationContext, app } from '@azure/functions';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { requireIntegrity } from '../middleware/requireIntegrity.js';
import { bookingRepo, updateBookingFields } from '../cosmos/booking-repository.js';
import { bookingEventRepo } from '../cosmos/booking-event-repository.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import { haversine } from '../cosmos/geo.js';
import { sendBookingStatusUpdatePush, sendLocationUpdatePush } from '../services/fcm.service.js';
import { settleCashCompletion } from '../services/commission-settlement.service.js';
import { auditLog } from '../services/auditLog.service.js';
import type { BookingDoc as _BookingDoc } from '../schemas/booking.js';
import { CollectionMethodSchema } from '../schemas/commission-receivable.js';
import { ShortCollectionReasonSchema } from '../schemas/booking.js';
import { normalizeAddressText } from '../shared/address-text.js';

const TRANSITION_ORDER = ['ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'COMPLETED'] as const;
const AVG_CITY_SPEED_KMH = 20;
type TransitionStatus = (typeof TRANSITION_ORDER)[number];

function isLegalTransition(from: string, to: string): boolean {
  const fromIdx = TRANSITION_ORDER.indexOf(from as TransitionStatus);
  const toIdx = TRANSITION_ORDER.indexOf(to as TransitionStatus);
  return fromIdx !== -1 && toIdx === fromIdx + 1;
}

const TransitionBodySchema = z.object({
  targetStatus: z.enum(['EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'COMPLETED']),
  currentLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  attestation: z.object({
    isMock: z.boolean(),
    gpsAccuracyM: z.number(),
  }).optional(),
  /** E21-S01: Set true on COMPLETED to confirm the technician collected cash from the customer. */
  cashCollected: z.boolean().optional(),
  /** E21-S01: Cash amount in paise the technician collected. Only honoured when cashCollected=true. */
  collectedAmount: z.number().int().nonnegative().optional(),
  /** E21-S02: how the money changed hands at the door. Only honoured when cashCollected=true; defaults to CASH. */
  collectionMethod: CollectionMethodSchema.optional(),
  /** E21-S02: why the collected amount fell short of the booking amount. */
  shortCollectionReason: ShortCollectionReasonSchema.optional(),
});

export const getActiveJobHandler: HttpHandler = async (req, _ctx: InvocationContext) => {
  let uid: string;
  try {
    ({ uid } = await verifyTechnicianToken(req));
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };
  }

  const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;
  const booking = await bookingRepo.getById(bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.technicianId !== uid) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };

  const service = await catalogueRepo.getServiceByIdCrossPartition(booking.serviceId);

  return {
    status: 200,
    jsonBody: {
      bookingId: booking.id,
      customerId: booking.customerId,
      serviceId: booking.serviceId,
      serviceName: service?.name ?? '',
      addressText: normalizeAddressText(booking.addressText),
      addressLatLng: booking.addressLatLng,
      status: booking.status,
      slotDate: booking.slotDate,
      slotWindow: booking.slotWindow,
    },
  };
};

export const transitionStatusHandler: HttpHandler = async (req, ctx: InvocationContext) => {
  let uid: string;
  try {
    ({ uid } = await verifyTechnicianToken(req));
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };
  }

  const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;
  const booking = await bookingRepo.getById(bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.technicianId !== uid) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };

  let body: z.infer<typeof TransitionBodySchema>;
  try {
    const raw: unknown = await req.json();
    const result = TransitionBodySchema.safeParse(raw);
    if (!result.success) {
      return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: result.error.issues } };
    }
    body = result.data;
  } catch {
    return { status: 400, jsonBody: { code: 'PARSE_ERROR' } };
  }

  if (!isLegalTransition(booking.status, body.targetStatus)) {
    return {
      status: 409,
      jsonBody: { code: 'ILLEGAL_TRANSITION', from: booking.status, to: body.targetStatus },
    };
  }

  // Warn in Sentry if the technician's device reported a mock/spoofed GPS fix.
  // Non-blocking: we allow the transition through and flag for investigation.
  if (body.attestation?.isMock === true) {
    Sentry.withScope((scope) => {
      scope.setLevel('warning');
      scope.setExtras({ bookingId, technicianId: uid, gpsAccuracyM: body.attestation!.gpsAccuracyM });
      Sentry.captureMessage('MARK_REACHED with mock location');
    });
  }

  const now = new Date().toISOString();
  const updated = await updateBookingFields(bookingId, {
    status: body.targetStatus,
    ...(body.targetStatus === 'COMPLETED'
      ? {
          completedAt: now,
          ...(body.cashCollected === true
            ? {
                cashCollectionStatus: 'COLLECTED' as const,
                cashCollectedAt: now,
                ...(body.collectedAmount !== undefined
                  ? { cashCollectedAmount: body.collectedAmount }
                  : {}),
                collectionMethod: body.collectionMethod ?? 'CASH',
                ...(body.shortCollectionReason !== undefined
                  ? { shortCollectionReason: body.shortCollectionReason }
                  : {}),
              }
            : {}),
        }
      : {}),
  });
  if (!updated) return { status: 500, jsonBody: { code: 'UPDATE_FAILED' } };

  await bookingEventRepo.append({
    bookingId,
    event: 'STATUS_TRANSITION',
    technicianId: uid,
    metadata: { from: booking.status, to: body.targetStatus },
  });

  if (body.targetStatus === 'COMPLETED') {
    try {
      // E21-S02 Codex P1 fix: settleCashCompletion internally guards RAZORPAY bookings
      // (skipped: 'NOT_CASH') and only fires side effects for whichever caller actually
      // creates the receivable — see commission-settlement.service.ts.
      await settleCashCompletion(updated, { log: (s) => ctx.log(s) });
    } catch (e: unknown) {
      // The change-feed trigger is the at-least-once catch-up; never fail the transition here.
      Sentry.captureException(e);
    }
    if (body.cashCollected === true) {
      await auditLog({ adminId: 'system', role: 'system' }, 'CASH_COLLECTION_RECORDED', 'booking', bookingId, {
        technicianId: uid,
        collectedAmount: body.collectedAmount,
        collectionMethod: body.collectionMethod ?? 'CASH',
        shortCollectionReason: body.shortCollectionReason,
      });
    }
  }

  await sendBookingStatusUpdatePush({
    customerId: updated.customerId,
    bookingId,
    status: updated.status,
  }).catch((err: unknown) => ctx.error('FCM BOOKING_STATUS_UPDATE failed', err));
  if (body.currentLocation) {
    const etaMinutes = Math.max(
      0,
      Math.round(
        (haversine(
          body.currentLocation.lat,
          body.currentLocation.lng,
          updated.addressLatLng.lat,
          updated.addressLatLng.lng,
        ) / AVG_CITY_SPEED_KMH) * 60,
      ),
    );
    await sendLocationUpdatePush({
      customerId: updated.customerId,
      bookingId,
      lat: body.currentLocation.lat,
      lng: body.currentLocation.lng,
      etaMinutes,
    }).catch((err: unknown) => ctx.error('FCM LOCATION_UPDATE failed', err));
  }

  const service = await catalogueRepo.getServiceByIdCrossPartition(updated.serviceId);

  return {
    status: 200,
    jsonBody: {
      bookingId: updated.id,
      customerId: updated.customerId,
      serviceId: updated.serviceId,
      serviceName: service?.name ?? '',
      addressText: normalizeAddressText(updated.addressText),
      addressLatLng: updated.addressLatLng,
      status: updated.status,
      slotDate: updated.slotDate,
      slotWindow: updated.slotWindow,
    },
  };
};

app.http('getActiveJob', {
  route: 'v1/technicians/active-job/{bookingId}',
  methods: ['GET'],
  handler: getActiveJobHandler,
});

app.http('transitionActiveJobStatus', {
  route: 'v1/technicians/active-job/{bookingId}/transition',
  methods: ['PATCH'],
  // requireIntegrity is applied to the REACHED (and all) status transitions.
  // Non-strict by default: absent/invalid token warns to Sentry but allows through.
  // Set PLAY_INTEGRITY_STRICT=true in production to enforce rejection.
  handler: requireIntegrity(transitionStatusHandler),
});
