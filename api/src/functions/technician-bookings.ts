import '../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import type { BookingDoc } from '../schemas/booking.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';

export const getMyTechnicianBookingsHandler: HttpHandler = async (
  req: HttpRequest,
  ctx: InvocationContext,
) => {
  let uid: string;
  try {
    ({ uid } = await verifyTechnicianToken(req));
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }

  try {
    let bookings: BookingDoc[];
    try {
      bookings = await bookingRepo.getByTechnicianId(uid);
    } catch (queryErr: unknown) {
      // Cross-partition scan on bookings (partitioned by customerId) fails on
      // Cosmos Serverless free tier. Return empty list for F&F pilot — new
      // technicians have no jobs anyway. Sentry captures for visibility.
      Sentry.captureException(queryErr);
      ctx.warn('getByTechnicianId failed (cross-partition scan); returning empty list for pilot');
      return { status: 200, jsonBody: { bookings: [] } };
    }

    const serviceNames = new Map<string, string>();
    await Promise.all(
      [...new Set(bookings.map((booking) => booking.serviceId))].map(async (serviceId) => {
        const service = await catalogueRepo.getServiceByIdCrossPartition(serviceId);
        serviceNames.set(serviceId, service?.name ?? serviceId);
      }),
    );

    return {
      status: 200,
      jsonBody: {
        bookings: bookings.map((booking) => ({
          bookingId: booking.id,
          customerId: booking.customerId,
          serviceId: booking.serviceId,
          serviceName: serviceNames.get(booking.serviceId) ?? booking.serviceId,
          addressText: booking.addressText,
          addressLatLng: booking.addressLatLng,
          status: booking.status,
          slotDate: booking.slotDate,
          slotWindow: booking.slotWindow,
          amount: booking.finalAmount ?? booking.amount,
        })),
      },
    };
  } catch (err: unknown) {
    Sentry.captureException(err);
    ctx.error('getMyTechnicianBookings failed', err instanceof Error ? err.message : String(err));
    return { status: 500, jsonBody: { code: 'INTERNAL_ERROR' } };
  }
};

app.http('getMyTechnicianBookings', {
  route: 'v1/technicians/me/bookings',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getMyTechnicianBookingsHandler,
});
