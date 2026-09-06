import * as Sentry from '@sentry/node';
import type { BookingDoc } from '../schemas/booking.js';
import type { CommissionResolvedFrom } from '../schemas/commission-config.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import { commissionReceivableRepo } from '../cosmos/commission-receivable-repository.js';
import { getGlobalCommissionBps, resolveCommissionBps } from './commission-config.service.js';
import { consumePendingCredits } from './commission-allocator.service.js';
import { recomputeCommissionHold } from './commission-hold.service.js';

export type RecordCommissionDueResult =
  | { created: boolean; commissionDue: number; commissionBps: number; commissionResolvedFrom: CommissionResolvedFrom }
  | { created: false; skipped: 'NO_TECHNICIAN' | 'NOT_COMPLETED' };

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
