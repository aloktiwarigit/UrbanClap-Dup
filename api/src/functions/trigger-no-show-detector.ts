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
  return new Date(`${slotDate}T${startTime}:00+05:30`).getTime();
}

export async function detectNoShows(ctx: InvocationContext): Promise<void> {
  // 'en-CA' locale gives YYYY-MM-DD format — identical to slotDate schema
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const now = Date.now();

  const assignedBookings = await bookingRepo.getAssignedBookingsBefore(todayIST);
  ctx.log(`detectNoShows: ${assignedBookings.length} ASSIGNED bookings on/before ${todayIST}`);

  for (const booking of assignedBookings) {
    const slotStart = slotStartUtcMs(booking.slotDate, booking.slotWindow);
    if (now < slotStart + NO_SHOW_WINDOW_MS) continue;

    const created = await customerCreditRepo.createCreditIfAbsent({
      id: booking.id,
      customerId: booking.customerId,
      bookingId: booking.id,
      amount: NO_SHOW_CREDIT_PAISE,
      reason: 'NO_SHOW',
      createdAt: new Date().toISOString(),
    });

    if (!created) {
      ctx.log(`detectNoShows: already processed bookingId=${booking.id} — skip`);
      continue;
    }

    ctx.log(`detectNoShows: processing no-show bookingId=${booking.id}`);

    try {
      await updateBookingFields(booking.id, { status: 'NO_SHOW_REDISPATCH' });
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.log(`detectNoShows: status update failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      await dispatcherService.redispatch(booking.id, NO_SHOW_REDISPATCH_RADIUS_KM);
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.log(`detectNoShows: redispatch failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      await sendNoShowCreditPush(booking.customerId, booking.id, NO_SHOW_CREDIT_PAISE);
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.log(`detectNoShows: FCM failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
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
