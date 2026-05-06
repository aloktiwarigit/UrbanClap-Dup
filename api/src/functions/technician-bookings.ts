import '../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import type { BookingDoc } from '../schemas/booking.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';

type BookingRecord = Partial<BookingDoc> & Record<string, unknown>;

function safeWarn(ctx: InvocationContext, message: string): void {
  try {
    ctx.warn(message);
  } catch {
    // Logging must not decide the API response path.
  }
}

function safeError(ctx: InvocationContext, message: string, detail: string): void {
  try {
    ctx.error(message, detail);
  } catch {
    // Logging must not decide the API response path.
  }
}

function asBookingRecord(value: unknown): BookingRecord | null {
  if (typeof value === 'object' && value !== null) {
    return value as BookingRecord;
  }
  return null;
}

function safeString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function safeAmount(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function safeLatLng(value: unknown): { lat: number; lng: number } {
  if (typeof value === 'object' && value !== null) {
    const { lat, lng } = value as { lat?: unknown; lng?: unknown };
    if (
      typeof lat === 'number' &&
      Number.isFinite(lat) &&
      typeof lng === 'number' &&
      Number.isFinite(lng)
    ) {
      return { lat, lng };
    }
  }
  return { lat: 0, lng: 0 };
}

function toTechnicianBookingDto(
  booking: BookingRecord,
  serviceNames: Map<string, string>,
) {
  const bookingId = safeString(booking.id, '');
  if (!bookingId) return null;

  const serviceId = safeString(booking.serviceId, 'unknown-service');
  const amount = safeAmount(booking.finalAmount, safeAmount(booking.amount, 0));

  return {
    bookingId,
    customerId: safeString(booking.customerId, ''),
    serviceId,
    serviceName: serviceNames.get(serviceId) ?? safeString(booking.serviceName, serviceId),
    addressText: safeString(booking.addressText, ''),
    addressLatLng: safeLatLng(booking.addressLatLng),
    status: safeString(booking.status, 'UNKNOWN'),
    slotDate: safeString(booking.slotDate, ''),
    slotWindow: safeString(booking.slotWindow, ''),
    amount,
  };
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
    const bookings = await bookingRepo.getByTechnicianId(uid);

    if (!Array.isArray(bookings)) {
      Sentry.captureException(new Error('getByTechnicianId returned a non-array result'));
      safeWarn(ctx, 'getByTechnicianId returned a non-array result; returning empty list');
      return { status: 200, jsonBody: { bookings: [] } };
    }

    const bookingRecords = bookings.flatMap((booking) => {
      const record = asBookingRecord(booking);
      if (!record) {
        Sentry.captureException(new Error('getByTechnicianId returned a malformed booking row'));
        safeWarn(ctx, 'getByTechnicianId returned a malformed booking row; skipping it');
        return [];
      }
      return [record];
    });

    const serviceNames = new Map<string, string>();
    await Promise.all(
      [
        ...new Set(
          bookingRecords
            .map((booking) => safeString(booking.serviceId, ''))
            .filter((serviceId) => serviceId.length > 0),
        ),
      ].map(async (serviceId) => {
        try {
          const service = await catalogueRepo.getServiceByIdCrossPartition(serviceId);
          if (service?.name) {
            serviceNames.set(serviceId, service.name);
          }
        } catch (catalogueErr: unknown) {
          Sentry.captureException(catalogueErr);
          safeWarn(ctx, `getServiceByIdCrossPartition failed for ${serviceId}; using booking fallback`);
        }
      }),
    );

    return {
      status: 200,
      jsonBody: {
        bookings: bookingRecords.flatMap((booking) => {
          const dto = toTechnicianBookingDto(booking, serviceNames);
          if (!dto) {
            Sentry.captureException(new Error('Skipping technician booking row without id'));
            safeWarn(ctx, 'Skipping technician booking row without id');
            return [];
          }
          return [dto];
        }),
      },
    };
  } catch (err: unknown) {
    Sentry.captureException(err);
    safeError(ctx, 'getMyTechnicianBookings failed', err instanceof Error ? err.message : String(err));
    return { status: 500, jsonBody: { code: 'INTERNAL_ERROR' } };
  }
};

app.http('getMyTechnicianBookings', {
  route: 'v1/technicians/me/bookings',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getMyTechnicianBookingsHandler,
});
