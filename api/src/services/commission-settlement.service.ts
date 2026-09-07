import * as Sentry from '@sentry/node';
import type { BookingDoc } from '../schemas/booking.js';
import type { CommissionResolvedFrom } from '../schemas/commission-config.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import { commissionReceivableRepo } from '../cosmos/commission-receivable-repository.js';
import { incrementCompletedJobCount } from '../cosmos/technician-repository.js';
import { getGlobalCommissionBps, resolveCommissionBps } from './commission-config.service.js';
import { consumePendingCredits } from './commission-allocator.service.js';
import { recomputeCommissionHold } from './commission-hold.service.js';
import { sendTechEarningsUpdate } from './fcm.service.js';
import { systemAudit } from './auditLog.service.js';

export type RecordCommissionDueResult =
  | { created: boolean; commissionDue: number; commissionBps: number; commissionResolvedFrom: CommissionResolvedFrom }
  | { created: false; skipped: 'NO_TECHNICIAN' | 'NOT_COMPLETED' | 'NOT_CASH' };

/**
 * E21-S02 Task 8: the CASH_ON_SERVICE commission cascade, extracted verbatim from
 * trigger-booking-completed.ts's CASH branch so both the change-feed trigger (at-least-once
 * delivery) and the synchronous job-completion endpoint (Task 9) share one implementation.
 *
 * Idempotent by bookingId: an existing receivable (or a 409 from a racing invocation) is reported
 * as `created: false` with the same commissionDue/commissionBps/commissionResolvedFrom the caller
 * would have computed anyway, so the caller can always finalize the ledger (consume credits,
 * recompute hold) regardless of whether this particular delivery created the row.
 */
export async function recordCommissionDue(booking: BookingDoc): Promise<RecordCommissionDueResult> {
  if (booking.status !== 'COMPLETED') return { created: false, skipped: 'NOT_COMPLETED' };

  const technicianId = booking.technicianId;
  if (!technicianId) return { created: false, skipped: 'NO_TECHNICIAN' };

  // E21-S02 Codex P1 fix: RAZORPAY bookings settle through the wallet-ledger path
  // (trigger-booking-completed.ts's RAZORPAY branch); this cascade must never record a
  // cash-style commission receivable or recompute the hold for them.
  if ((booking.paymentMethod ?? 'CASH_ON_SERVICE') === 'RAZORPAY') {
    return { created: false, skipped: 'NOT_CASH' };
  }

  const { id: bookingId } = booking;
  const bookingAmount = booking.finalAmount ?? booking.amount;

  const existing = await commissionReceivableRepo.getByBookingId(bookingId, technicianId);
  if (existing) {
    return {
      created: false,
      commissionDue: existing.commissionDue,
      commissionBps: existing.commissionBps,
      commissionResolvedFrom: existing.commissionResolvedFrom,
    };
  }

  const [globalBps, service, category] = await Promise.all([
    getGlobalCommissionBps(),
    catalogueRepo.getServiceByIdCrossPartition(booking.serviceId),
    catalogueRepo.getCategoryById(booking.categoryId),
  ]);

  const { bps, from: commissionResolvedFrom } = resolveCommissionBps({
    ...(service?.commissionBps !== undefined ? { serviceBps: service.commissionBps } : {}),
    ...(category?.commissionBps !== undefined ? { categoryBps: category.commissionBps } : {}),
    globalBps,
  });
  const commissionDue = Math.round((bookingAmount * bps) / 10000);
  const serviceName = booking.serviceName ?? service?.name;

  const created = await commissionReceivableRepo.createDueEntry({
    bookingId,
    technicianId,
    serviceId: booking.serviceId,
    categoryId: booking.categoryId,
    bookingAmount,
    commissionBps: bps,
    commissionDue,
    commissionResolvedFrom,
    ...(booking.cashCollectedAmount !== undefined
      ? { cashCollectedAmount: booking.cashCollectedAmount }
      : {}),
    ...(serviceName !== undefined ? { serviceName } : {}),
    slotDate: booking.slotDate,
    ...(booking.collectionMethod !== undefined ? { collectionMethod: booking.collectionMethod } : {}),
  });

  if (!created) {
    // A concurrent invocation won the race and created the row first. Never fabricate the
    // returned values from what THIS invocation computed — a racing invocation may have resolved
    // a different commissionBps (e.g. a config edit landed between the two reads). Re-read the
    // stored row so the caller (and finalizeLedgerForTechnician) always acts on ledger truth.
    const stored = await commissionReceivableRepo.getByBookingId(bookingId, technicianId);
    if (!stored) {
      throw Object.assign(new Error('RECEIVABLE_RACE_UNREADABLE'), { code: 'RECEIVABLE_RACE_UNREADABLE' });
    }
    return {
      created: false,
      commissionDue: stored.commissionDue,
      commissionBps: stored.commissionBps,
      commissionResolvedFrom: stored.commissionResolvedFrom,
    };
  }

  return { created: true, commissionDue, commissionBps: bps, commissionResolvedFrom };
}

/**
 * Always safe to call; never throws (errors Sentry-captured). Consumes any open credits against
 * the technician's outstanding receivables, then recomputes their commissionHold absolutely.
 *
 * The second step runs even when the first throws — a redelivery must still get a chance to
 * refresh the hold even if credit consumption failed, and a caller (the change-feed trigger,
 * every delivery; Task 9's synchronous endpoint) must never have this call abort its own flow.
 */
export async function finalizeLedgerForTechnician(technicianId: string): Promise<void> {
  try {
    await consumePendingCredits(technicianId);
  } catch (err: unknown) {
    Sentry.captureException(err);
  }
  try {
    await recomputeCommissionHold(technicianId);
  } catch (err: unknown) {
    Sentry.captureException(err);
  }
}

/**
 * E21-S02 Codex P1 fix (branch review): side effects (COMMISSION_DUE_RECORDED audit,
 * completedJobCount increment, FCM earnings update) belong to whichever caller actually
 * *creates* the commission receivable row — not to every caller that happens to invoke
 * recordCommissionDue. Both the change-feed trigger (at-least-once delivery) and the
 * synchronous active-job COMPLETED transition (Task 9) call this instead of calling
 * recordCommissionDue directly, so exactly one of them fires the side effects for a given
 * booking regardless of which delivery wins the race to create the row.
 *
 * RAZORPAY bookings are guarded inside recordCommissionDue itself (`skipped: 'NOT_CASH'`):
 * this function returns immediately for them without touching the ledger.
 */
export async function settleCashCompletion(
  booking: BookingDoc,
  ctx?: { log?: (s: string) => void },
): Promise<RecordCommissionDueResult> {
  const r = await recordCommissionDue(booking);
  if ('skipped' in r) return r;

  const technicianId = booking.technicianId!;
  const bookingAmount = booking.finalAmount ?? booking.amount;

  if (r.created) {
    await systemAudit('COMMISSION_DUE_RECORDED', 'booking', booking.id, {
      technicianId,
      bookingAmount,
      commissionBps: r.commissionBps,
      commissionDue: r.commissionDue,
      commissionResolvedFrom: r.commissionResolvedFrom,
    });

    try {
      await Promise.all([
        incrementCompletedJobCount(technicianId),
        sendTechEarningsUpdate(technicianId, { bookingId: booking.id, commissionDue: r.commissionDue }),
      ]);
    } catch (err: unknown) {
      Sentry.captureException(err);
    }
  } else {
    ctx?.log?.(`settleCashCompletion: receivable already recorded for ${booking.id} — side effects skipped`);
  }

  await finalizeLedgerForTechnician(technicianId);
  return r;
}
