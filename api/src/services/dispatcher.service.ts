import { randomUUID } from 'node:crypto';
import { getMessaging } from 'firebase-admin/messaging';
import { bookingRepo, updateBookingFields } from '../cosmos/booking-repository.js';
import { getTechniciansWithinRadius } from '../cosmos/technician-repository.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import { dispatchAttemptRepo } from '../cosmos/dispatch-attempt-repository.js';
import { haversine } from '../cosmos/geo.js';
import { getDispatchAttemptsContainer } from '../cosmos/client.js';
import type { TechnicianProfile } from '../schemas/technician.js';
import type { DispatchAttemptDoc } from '../schemas/dispatch-attempt.js';
import type { BookingDoc } from '../schemas/booking.js';

const DISPATCH_RADIUS_KM = 10;
const OFFER_WINDOW_MS = 30_000;

export function rankTechnicians(
  techs: TechnicianProfile[],
  bookingLat: number,
  bookingLng: number,
): TechnicianProfile[] {
  // GeoJSON coordinates: [longitude, latitude]
  return techs
    .map((t) => ({
      tech: t,
      distanceKm: haversine(bookingLat, bookingLng, t.location.coordinates[1], t.location.coordinates[0]),
    }))
    .sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      // Operator policy (Ayodhya pilot): secondary sort is rating only — decline history must never be used
      return (b.tech.rating ?? 0) - (a.tech.rating ?? 0);
    })
    .map((x) => x.tech);
}

async function dispatchBookingToTechs(
  bookingId: string,
  booking: BookingDoc,
  radiusKm: number,
  excludedTechnicianIds: string[] = [],
): Promise<boolean> {
  const { lat, lng } = booking.addressLatLng;
  const excluded = new Set([
    ...excludedTechnicianIds,
    ...(booking.technicianId ? [booking.technicianId] : []),
  ]);
  // Cosmos uses a bounding-box (square) query; filter to the actual circle radius.
  // Exclude the original (no-show) technician from the candidate set so they cannot
  // receive the same booking again via a redispatch.
  const candidates = (await getTechniciansWithinRadius(lat, lng, radiusKm, booking.serviceId))
    .filter((t) => haversine(lat, lng, t.location.coordinates[1], t.location.coordinates[0]) <= radiusKm)
    .filter((t) => !excluded.has(t.id))
    .filter((t) => !(t.blockedCustomerIds ?? []).includes(booking.customerId));

  if (candidates.length === 0) {
    console.log(`DISPATCH_NO_TECHS bookingId=${bookingId}`);
    await updateBookingFields(bookingId, { status: 'UNFULFILLED' });
    return false;
  }

  const selected = rankTechnicians(candidates, lat, lng)[0]!;
  const sentAt = new Date();
  const expiresAt = new Date(sentAt.getTime() + OFFER_WINDOW_MS);

  const attempt: DispatchAttemptDoc = {
    id: randomUUID(),
    bookingId,
    technicianIds: [selected.id],
    sentAt: sentAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'PENDING',
  };

  await getDispatchAttemptsContainer().items.create(attempt);
  // Transition to SEARCHING so the stale-booking reconciler can find stuck dispatches
  await updateBookingFields(bookingId, { status: 'SEARCHING' });

  let serviceName = booking.serviceId;
  try {
    const service = await catalogueRepo.getServiceByIdCrossPartition(booking.serviceId);
    serviceName = service?.name ?? booking.serviceId;
  } catch (err: unknown) {
    console.error('DISPATCH_SERVICE_LOOKUP_FAILED', err);
  }
  const messaging = getMessaging();
  if (selected.fcmToken) {
    try {
      await messaging.send({
        token: selected.fcmToken,
        data: {
          type: 'JOB_OFFER',
          bookingId,
          serviceId: booking.serviceId,
          serviceName,
          addressText: booking.addressText,
          slotDate: booking.slotDate,
          slotWindow: booking.slotWindow,
          amount: String(booking.amount),
          distanceKm: String(
            haversine(lat, lng, selected.location.coordinates[1], selected.location.coordinates[0]),
          ),
          expiresAt: expiresAt.toISOString(),
          dispatchAttemptId: attempt.id,
        },
      });
    } catch (err: unknown) {
      console.error('DISPATCH_FCM_FAILED', err);
    }
  }

  console.log(`DISPATCH_SENT bookingId=${bookingId} technicianIds=${selected.id}`);
  return true;
}

export const dispatcherService = {
  async triggerDispatch(bookingId: string): Promise<void> {
    const booking = await bookingRepo.getById(bookingId);
    if (!booking || booking.status !== 'PAID') {
      console.log(`DISPATCH_SKIP bookingId=${bookingId} status=${booking?.status ?? 'NOT_FOUND'}`);
      return;
    }
    await dispatchBookingToTechs(bookingId, booking, DISPATCH_RADIUS_KM);
  },

  /**
   * Returns true if offers were actually sent to at least one technician.
   * @param excludeTechnicianId — the no-show technician's id, passed explicitly so that
   *   the filter is not lost if the booking doc is updated before this call reads it.
   */
  async redispatch(bookingId: string, radiusKm: number, excludeTechnicianId?: string): Promise<boolean> {
    const booking = await bookingRepo.getById(bookingId);
    if (!booking || booking.status !== 'NO_SHOW_REDISPATCH') return false;
    // Merge the caller-supplied exclusion so redispatch works even when technicianId was
    // already cleared from the booking document by the status-write step.
    const bookingForDispatch = excludeTechnicianId
      ? { ...booking, technicianId: excludeTechnicianId }
      : booking;
    return dispatchBookingToTechs(bookingId, bookingForDispatch, radiusKm);
  },

  /**
   * Continue nearest-first dispatch after a live offer is declined or expires.
   * Previously attempted technicians are excluded so the booking walks the ranked
   * candidate list instead of re-offering the same nearest technician.
   */
  async continueDispatchAfterOfferOutcome(
    bookingId: string,
    extraExcludeTechnicianIds: string[] = [],
    radiusKm: number = DISPATCH_RADIUS_KM,
  ): Promise<boolean> {
    const booking = await bookingRepo.getById(bookingId);
    if (!booking || booking.status !== 'SEARCHING') return false;
    const previouslyAttempted = await dispatchAttemptRepo.getAttemptedTechnicianIds(bookingId);
    return dispatchBookingToTechs(
      bookingId,
      booking,
      radiusKm,
      [...new Set([...previouslyAttempted, ...extraExcludeTechnicianIds])],
    );
  },
};
