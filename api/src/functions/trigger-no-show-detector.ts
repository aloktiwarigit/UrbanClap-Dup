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

    // Guard against stale ASSIGNED snapshot: re-read the booking immediately before the
    // credit write. If the technician marked it IN_PROGRESS or REACHED after the query
    // returned, skip to avoid issuing a wrong credit against a live booking.
    // Also allow NO_SHOW_REDISPATCH — the query intentionally includes that status so that
    // a prior run that wrote credit + status but crashed before redispatch can recover.
    const freshBooking = await bookingRepo.getById(booking.id);
    if (!freshBooking || (freshBooking.status !== 'ASSIGNED' && freshBooking.status !== 'NO_SHOW_REDISPATCH')) {
      ctx.log(`detectNoShows: skipping ${booking.id} — live status is ${freshBooking?.status ?? 'NOT_FOUND'}`);
      continue;
    }

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
    // redispatch already completed on a prior run.
    // `noShowRedispatchAt` is stamped after a confirmed successful redispatch — if present,
    // the prior run completed the flow and nothing more is needed.
    // If absent but status is ASSIGNED with a *different* technicianId, a replacement tech
    // accepted the redispatch but the stamp write failed — treat as done and skip.
    // If absent and technicianId unchanged (original tech still on the booking), the prior run
    // crashed before the status write — retry.
    if (!creditCreated) {
      const liveBooking = await bookingRepo.getById(booking.id);
      if (liveBooking?.noShowRedispatchAt) {
        ctx.log(`detectNoShows: recovery skipped for ${booking.id} — redispatch already fired at ${liveBooking.noShowRedispatchAt}`);
        continue;
      }
      if (
        liveBooking?.status === 'ASSIGNED' &&
        liveBooking.technicianId !== undefined &&
        liveBooking.technicianId !== booking.technicianId
      ) {
        // A replacement tech accepted the redispatch; noShowRedispatchAt stamp failed but we're done
        ctx.log(`detectNoShows: recovery skipped for ${booking.id} — replacement tech ${liveBooking.technicianId} already assigned`);
        continue;
      }
    }

    // Step 1: Set the holding status and clear technicianId so the no-show technician's
    // active-job screen stops receiving updates for this booking. Track success — if this
    // fails we must NOT stamp noShowRedispatchAt, so recovery can retry both write and redispatch.
    let statusWriteOk = false;
    try {
      await updateBookingFields(booking.id, { status: 'NO_SHOW_REDISPATCH', technicianId: undefined });
      statusWriteOk = true;
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.log(`detectNoShows: status update failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Step 2: Fire redispatch only when status write succeeded — prevents redispatch running
    // against a booking that is still ASSIGNED (dispatcher.redispatch checks for NO_SHOW_REDISPATCH).
    // Only stamp noShowRedispatchAt when redispatch actually sent offers (boolean true return)
    // so that recovery can distinguish "offers sent" from "no techs found / dispatcher skipped".
    let redispatchOk = false;
    if (statusWriteOk) {
      try {
        // Pass booking.technicianId explicitly so the exclusion filter survives even if
        // the booking doc was already updated (technicianId cleared) before redispatch reads it.
        redispatchOk = await dispatcherService.redispatch(booking.id, NO_SHOW_REDISPATCH_RADIUS_KM, booking.technicianId);
        if (redispatchOk) {
          // Stamp the completed-redispatch flag after confirmed offers-sent.
          await updateBookingFields(booking.id, { noShowRedispatchAt: new Date().toISOString() });
        } else {
          ctx.log(`detectNoShows: no techs found for ${booking.id} — booking marked UNFULFILLED`);
        }
      } catch (err: unknown) {
        Sentry.captureException(err);
        ctx.log(`detectNoShows: redispatch failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // FCM push: gate on creditCreated (this run issued the credit) — ensures the customer
    // always receives the compensation notification regardless of whether redispatch succeeded.
    // Recovery runs (creditCreated=false) skip the push because the prior run already sent it
    // (or it will be retried in a subsequent creditCreated=true run if the prior run crashed
    // before reaching this point, but since credit was already written that cannot happen —
    // creditCreated=true ↔ this run is the first to issue the credit).
    if (creditCreated) {
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
