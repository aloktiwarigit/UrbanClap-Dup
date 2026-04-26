import '../bootstrap.js';
import { app } from '@azure/functions';
import type { Timer, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { bookingRepo, updateBookingFields } from '../cosmos/booking-repository.js';
import { customerCreditRepo } from '../cosmos/customer-credit-repository.js';
import { dispatcherService } from '../services/dispatcher.service.js';
import { sendNoShowCreditPush } from '../services/fcm.service.js';

const NO_SHOW_CREDIT_PAISE = 50_000;
const NO_SHOW_REDISPATCH_RADIUS_KM = 15;
const NO_SHOW_WINDOW_MS = 30 * 60 * 1_000;

function slotStartUtcMs(slotDate: string, slotWindow: string): number {
  const startTime = slotWindow.split('-')[0]; // '10:00' from '10:00-12:00'
  const ms = new Date(`${slotDate}T${startTime}:00+05:30`).getTime();
  if (isNaN(ms)) throw new Error(`invalid slotWindow "${slotWindow}" on slotDate "${slotDate}"`);
  return ms;
}

export async function detectNoShows(ctx: InvocationContext): Promise<void> {
  // 'en-CA' locale gives YYYY-MM-DD format — identical to slotDate schema
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const now = Date.now();

  // Note: bookings with a slotDate > todayIST but a UTC slot start already past 30 min
  // (i.e., slotWindow starts before 05:30 IST) are excluded by this query. For the
  // Ayodhya pilot (service hours 08:00–20:00 IST), this edge case does not apply.
  const assignedBookings = await bookingRepo.getAssignedBookingsBefore(todayIST);
  ctx.log(`detectNoShows: ${assignedBookings.length} ASSIGNED bookings on/before ${todayIST}`);

  for (const booking of assignedBookings) {
    let slotStart: number;
    try {
      slotStart = slotStartUtcMs(booking.slotDate, booking.slotWindow);
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.log(`detectNoShows: invalid slot data for ${booking.id} — skip`);
      continue;
    }
    if (now < slotStart + NO_SHOW_WINDOW_MS) continue;

    // Credit write is the atomic idempotency gate — must come first.
    // If it throws (non-409 Cosmos error), skip this booking entirely.
    // If it returns false (409 = prior run already wrote credit), proceed with
    // downstream steps anyway — the prior run may have failed mid-way.
    let creditCreated: boolean;
    try {
      creditCreated = await customerCreditRepo.createCreditIfAbsent({
        id: booking.id,
        customerId: booking.customerId,
        bookingId: booking.id,
        amount: NO_SHOW_CREDIT_PAISE,
        reason: 'NO_SHOW',
        createdAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.log(`detectNoShows: credit write failed for ${booking.id} — skip`);
      continue;
    }

    if (creditCreated) {
      ctx.log(`detectNoShows: processing no-show bookingId=${booking.id}`);
    } else {
      ctx.log(`detectNoShows: credit already exists for ${booking.id} — retrying remaining steps`);
    }

    // When recovering (creditCreated=false), re-fetch to check whether the status-write and
    // redispatch already completed on a prior run. `noShowRedispatchAt` is written atomically
    // with the NO_SHOW_REDISPATCH status — if it's present, redispatch was already triggered.
    // If the booking is now ASSIGNED *and* noShowRedispatchAt is set, a replacement tech
    // has accepted; skip entirely. If noShowRedispatchAt is absent, the prior run crashed
    // before the status-write completed — retry the write and redispatch.
    if (!creditCreated) {
      const liveBooking = await bookingRepo.getById(booking.id);
      if (liveBooking?.noShowRedispatchAt) {
        // Redispatch was already triggered on a prior run — nothing left to do
        ctx.log(`detectNoShows: recovery skipped for ${booking.id} — redispatch already fired at ${liveBooking.noShowRedispatchAt}`);
        continue;
      }
    }

    // Step 1: Set the holding status. Track success — if this fails we must NOT stamp
    // noShowRedispatchAt, so recovery can retry both the status write and redispatch.
    let statusWriteOk = false;
    try {
      await updateBookingFields(booking.id, { status: 'NO_SHOW_REDISPATCH' });
      statusWriteOk = true;
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.log(`detectNoShows: status update failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Step 2: Fire redispatch only when status write succeeded — prevents redispatch running
    // against a booking that is still ASSIGNED (which would be a no-op or error in the
    // dispatcher). Only stamp noShowRedispatchAt on success so recovery can use it as a gate.
    let redispatchOk = false;
    if (statusWriteOk) {
      try {
        await dispatcherService.redispatch(booking.id, NO_SHOW_REDISPATCH_RADIUS_KM);
        redispatchOk = true;
        // Stamp the completed-redispatch flag after confirmed success.
        await updateBookingFields(booking.id, { noShowRedispatchAt: new Date().toISOString() });
      } catch (err: unknown) {
        Sentry.captureException(err);
        ctx.log(`detectNoShows: redispatch failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // FCM push: only send when redispatch actually started — the push text says "searching
    // for a new technician", which is false if redispatch threw or never ran.
    if (redispatchOk) {
      try {
        await sendNoShowCreditPush(booking.customerId, booking.id, NO_SHOW_CREDIT_PAISE);
      } catch (err: unknown) {
        Sentry.captureException(err);
        ctx.log(`detectNoShows: FCM failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
}

app.timer('triggerNoShowDetector', {
  schedule: '0 */5 * * * *',
  handler: async (_timer: Timer, ctx: InvocationContext): Promise<void> => {
    try {
      await detectNoShows(ctx);
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.log(`detectNoShows ERROR: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  },
});
