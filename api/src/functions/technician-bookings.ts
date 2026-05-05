import '../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import type { BookingDoc } from '../schemas/booking.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';

function isCosmosTimeout(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as Record<string, unknown>;
  if (e['code'] === 408) return true;
  return typeof e['message'] === 'string' && /timeout/i.test(e['message']);
}

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
      if (isCosmosTimeout(queryErr)) {
        Sentry.captureException(queryErr);
        ctx.warn('getByTechnicianId cross-partition scan timed out; returning empty list for pilot');
        return { status: 200, jsonBody: { bookings: [] } };
      }
      throw queryErr;
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
