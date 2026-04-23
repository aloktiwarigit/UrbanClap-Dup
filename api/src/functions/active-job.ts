import { z } from 'zod';
import { type HttpHandler, type InvocationContext, app } from '@azure/functions';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { bookingRepo, updateBookingFields } from '../cosmos/booking-repository.js';
import { bookingEventRepo } from '../cosmos/booking-event-repository.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import type { BookingDoc } from '../schemas/booking.js';

const TRANSITION_ORDER = ['ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'COMPLETED'] as const;
type TransitionStatus = (typeof TRANSITION_ORDER)[number];

function isLegalTransition(from: string, to: string): boolean {
  const fromIdx = TRANSITION_ORDER.indexOf(from as TransitionStatus);
  const toIdx = TRANSITION_ORDER.indexOf(to as TransitionStatus);
  return fromIdx !== -1 && toIdx === fromIdx + 1;
}

const TransitionBodySchema = z.object({
  targetStatus: z.enum(['EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'COMPLETED']),
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
      addressText: booking.addressText,
      addressLatLng: booking.addressLatLng,
      status: booking.status,
      slotDate: booking.slotDate,
      slotWindow: booking.slotWindow,
    },
  };
};

export const transitionStatusHandler: HttpHandler = async (req, _ctx: InvocationContext) => {
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

  let body: { targetStatus: string };
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

  const updated = await updateBookingFields(bookingId, {
    status: body.targetStatus as BookingDoc['status'],
  });
  if (!updated) return { status: 500, jsonBody: { code: 'UPDATE_FAILED' } };

  await bookingEventRepo.append({
    bookingId,
    event: 'STATUS_TRANSITION',
    technicianId: uid,
    metadata: { from: booking.status, to: body.targetStatus },
  });

  const service = await catalogueRepo.getServiceByIdCrossPartition(updated.serviceId);

  return {
    status: 200,
    jsonBody: {
      bookingId: updated.id,
      customerId: updated.customerId,
      serviceId: updated.serviceId,
      serviceName: service?.name ?? '',
      addressText: updated.addressText,
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
  handler: transitionStatusHandler,
});
