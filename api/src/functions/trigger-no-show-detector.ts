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
  ctx.log(`detectNoShows: ${assignedBookings.length} bookings on/before ${todayIST}`);

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
    const isRecoverableSearching =
      freshBooking?.status === 'SEARCHING' && freshBooking.noShowTechnicianId !== undefined;
    if (
      !freshBooking ||
      (freshBooking.status !== 'ASSIGNED' &&
        freshBooking.status !== 'NO_SHOW_REDISPATCH' &&
        !isRecoverableSearching)
    ) {
      ctx.log(`detectNoShows: skipping ${booking.id} — live status is ${freshBooking?.status ?? 'NOT_FOUND'}`);
      continue;
    }

    // Stable reference to the no-show technician: prefer the preserved field (survives
    // technicianId being cleared from the booking doc), fall back to freshBooking.technicianId.
    const noShowTechId = freshBooking.noShowTechnicianId ?? freshBooking.technicianId;

    // ── Credit write (idempotency gate) ──────────────────────────────────────────
    // If it throws (non-409 Cosmos error), skip this booking entirely.
    // If it returns false (409 = prior run already wrote credit), proceed — the prior run
    // may have failed mid-way and later steps may need to be retried.
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

    // ── Recovery skip check ───────────────────────────────────────────────────────
    // On recovery (creditCreated=false), check which downstream steps already completed.
    // `noShowRedispatchAt` is set after successful offers-sent.
    // `noShowPushSentAt` is set after successful FCM push.
    // Replacement-tech check: if ASSIGNED with a different technicianId and noShowTechId
    // is known, the redispatch already resolved — skip entirely.
    if (!creditCreated) {
      const liveBooking = await bookingRepo.getById(booking.id);

      // If replacement tech accepted, redispatch already resolved.
      // Still send the push if noShowPushSentAt is absent (crashed in step 3 before the push).
      if (
        liveBooking?.status === 'ASSIGNED' &&
        noShowTechId !== undefined &&
        liveBooking.technicianId !== undefined &&
        liveBooking.technicianId !== noShowTechId
      ) {
        if (!liveBooking.noShowPushSentAt) {
          try {
            await sendNoShowCreditPush(booking.customerId, booking.id, NO_SHOW_CREDIT_PAISE);
            await updateBookingFields(booking.id, { noShowPushSentAt: new Date().toISOString() });
          } catch (err: unknown) {
            Sentry.captureException(err);
            ctx.log(`detectNoShows: FCM recovery failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
        ctx.log(`detectNoShows: recovery skipped for ${booking.id} — replacement tech ${liveBooking.technicianId} already assigned`);
        continue;
      }

      // noShowRedispatchAt present → redispatch already fired; only push may be pending
      if (liveBooking?.noShowRedispatchAt && liveBooking.noShowPushSentAt) {
        // Both redispatch and push done — nothing left to do
        ctx.log(`detectNoShows: recovery skipped for ${booking.id} — all steps already completed`);
        continue;
      }
    }

    // ── Step 1: Status write + preserve no-show tech ID ──────────────────────────
    // Clear technicianId so the original tech's active-job screen stops updating.
    // Store noShowTechnicianId separately — needed for exclusion filter across recovery runs.
    // Track success: if this fails, noShowRedispatchAt must NOT be set so recovery retries.
    // Skip if already SEARCHING: a prior run already wrote this step. Writing again would
    // revert SEARCHING → NO_SHOW_REDISPATCH and break the SEARCHING recovery guard in Step 2.
    let statusWriteOk = false;
    if (freshBooking.status === 'SEARCHING') {
      statusWriteOk = true; // Step 1 was completed by the prior run that crashed in Step 2.
    } else {
      try {
        await updateBookingFields(booking.id, {
          status: 'NO_SHOW_REDISPATCH',
          technicianId: undefined,
          noShowTechnicianId: noShowTechId,
        });
        statusWriteOk = true;
      } catch (err: unknown) {
        Sentry.captureException(err);
        ctx.log(`detectNoShows: status update failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // ── Step 2: Redispatch ────────────────────────────────────────────────────────
    // Only when status write succeeded (dispatcher checks for NO_SHOW_REDISPATCH status).
    // Skip if noShowRedispatchAt already set (recovery: prior run completed this step).
    // noShowTechId is passed explicitly so the exclusion filter survives even after
    // technicianId was cleared from the booking doc in Step 1.
    let redispatchOk = false;
    if (statusWriteOk && !freshBooking.noShowRedispatchAt) {
      // Re-read before dispatching: a concurrent invocation or a prior crash may have already
      // moved the booking to SEARCHING without writing noShowRedispatchAt.
      const preDispatchDoc = await bookingRepo.getById(booking.id);
      if (preDispatchDoc?.noShowRedispatchAt) {
        // Concurrent run completed the step.
        redispatchOk = true;
        ctx.log(`detectNoShows: redispatch already completed concurrently for ${booking.id}`);
      } else if (preDispatchDoc?.status === 'SEARCHING') {
        // Prior run called redispatch() (moving the booking to SEARCHING) but crashed before
        // writing noShowRedispatchAt. The dispatch attempt is live — just write the timestamp.
        await updateBookingFields(booking.id, { noShowRedispatchAt: new Date().toISOString() });
        redispatchOk = true;
        ctx.log(`detectNoShows: recovery — booking ${booking.id} already SEARCHING, completing noShowRedispatchAt write`);
      } else {
        try {
          redispatchOk = await dispatcherService.redispatch(booking.id, NO_SHOW_REDISPATCH_RADIUS_KM, noShowTechId);
          if (redispatchOk) {
            await updateBookingFields(booking.id, { noShowRedispatchAt: new Date().toISOString() });
          } else {
            ctx.log(`detectNoShows: no techs found for ${booking.id} — booking marked UNFULFILLED`);
          }
        } catch (err: unknown) {
          Sentry.captureException(err);
          ctx.log(`detectNoShows: redispatch failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } else if (freshBooking.noShowRedispatchAt) {
      // Redispatch was already done on a prior run — mark ok for logging
      redispatchOk = true;
      ctx.log(`detectNoShows: redispatch already completed for ${booking.id}`);
    }

    // ── Step 3: FCM push ──────────────────────────────────────────────────────────
    // Send when:
    //   - creditCreated=true (this run issued the credit, first-time path), OR
    //   - creditCreated=false but noShowPushSentAt is absent (recovery: prior run crashed
    //     before the push — retry is safe since the push is idempotent enough at 5-min cadence)
    // Skip if noShowPushSentAt is already set (already sent on a prior run).
    const pushAlreadySent = !!(await bookingRepo.getById(booking.id))?.noShowPushSentAt;
    if (!pushAlreadySent) {
      try {
        await sendNoShowCreditPush(booking.customerId, booking.id, NO_SHOW_CREDIT_PAISE);
        await updateBookingFields(booking.id, { noShowPushSentAt: new Date().toISOString() });
      } catch (err: unknown) {
        Sentry.captureException(err);
        ctx.log(`detectNoShows: FCM failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    void redispatchOk; // consumed above for logging
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
