import { randomUUID } from 'node:crypto';
import { getMessaging } from 'firebase-admin/messaging';
import { bookingRepo, updateBookingFields } from '../cosmos/booking-repository.js';
import { getTechniciansWithinRadius } from '../cosmos/technician-repository.js';
import { haversine } from '../cosmos/geo.js';
import { getDispatchAttemptsContainer } from '../cosmos/client.js';
import type { TechnicianProfile } from '../schemas/technician.js';
import type { DispatchAttemptDoc } from '../schemas/dispatch-attempt.js';
import type { BookingDoc } from '../schemas/booking.js';

const DISPATCH_RADIUS_KM = 10;
const OFFER_WINDOW_MS = 30_000;
const TOP_N = 3;

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
): Promise<boolean> {
  const { lat, lng } = booking.addressLatLng;
  // Cosmos uses a bounding-box (square) query; filter to the actual circle radius.
  // Exclude the original (no-show) technician from the candidate set so they cannot
  // receive the same booking again via a redispatch.
  const candidates = (await getTechniciansWithinRadius(lat, lng, radiusKm, booking.serviceId))
    .filter((t) => haversine(lat, lng, t.location.coordinates[1], t.location.coordinates[0]) <= radiusKm)
    .filter((t) => t.id !== booking.technicianId);

  if (candidates.length === 0) {
    console.log(`DISPATCH_NO_TECHS bookingId=${bookingId}`);
    await updateBookingFields(bookingId, { status: 'UNFULFILLED' });
    return false;
  }

  const ranked = rankTechnicians(candidates, lat, lng).slice(0, TOP_N);
  const sentAt = new Date();
  const expiresAt = new Date(sentAt.getTime() + OFFER_WINDOW_MS);

  const attempt: DispatchAttemptDoc = {
    id: randomUUID(),
    bookingId,
    technicianIds: ranked.map((t) => t.id),
    sentAt: sentAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'PENDING',
  };

  await getDispatchAttemptsContainer().items.create(attempt);
  // Transition to SEARCHING so the stale-booking reconciler can find stuck dispatches
  await updateBookingFields(bookingId, { status: 'SEARCHING' });

  const messaging = getMessaging();
  await Promise.allSettled(
    ranked.map(async (tech) => {
      if (!tech.fcmToken) return;
      await messaging.send({
        token: tech.fcmToken,
        data: {
          type: 'JOB_OFFER',
          bookingId,
          serviceId: booking.serviceId,
          addressText: booking.addressText,
          slotDate: booking.slotDate,
          slotWindow: booking.slotWindow,
          amount: String(booking.amount),
          distanceKm: String(
            haversine(lat, lng, tech.location.coordinates[1], tech.location.coordinates[0]),
          ),
          expiresAt: expiresAt.toISOString(),
          dispatchAttemptId: attempt.id,
        },
      });
    }),
  );

  console.log(`DISPATCH_SENT bookingId=${bookingId} technicianIds=${ranked.map((t) => t.id).join(',')}`);
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

  /** Returns true if offers were actually sent to at least one technician. */
  async redispatch(bookingId: string, radiusKm: number): Promise<boolean> {
    const booking = await bookingRepo.getById(bookingId);
    if (!booking || booking.status !== 'NO_SHOW_REDISPATCH') return false;
    return dispatchBookingToTechs(bookingId, booking, radiusKm);
  },
};
