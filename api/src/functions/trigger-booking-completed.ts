import '../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { randomUUID } from 'node:crypto';
import { BookingDocSchema } from '../schemas/booking.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import { commissionReceivableRepo } from '../cosmos/commission-receivable-repository.js';
import { walletLedgerRepo } from '../cosmos/wallet-ledger-repository.js';
import { getTechnicianForSettlement, incrementCompletedJobCount } from '../cosmos/technician-repository.js';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
import { calculateCommission } from '../services/commission.service.js';
import { getGlobalCommissionBps, resolveCommissionBps } from '../services/commission-config.service.js';
import { RazorpayRouteService } from '../services/razorpayRoute.service.js';
import { sendTechEarningsUpdate } from '../services/fcm.service.js';

const DB_NAME = process.env['COSMOS_DATABASE'] ?? 'homeservices';

function systemAuditEntry(action: string, resourceId: string, payload: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  return appendAuditEntry({
    id: randomUUID(),
    adminId: 'system',
    role: 'system',
    action,
    resourceType: 'booking',
    resourceId,
    payload,
    timestamp,
    partitionKey: timestamp.slice(0, 7),
  });
}

function hasRazorpayCredentials(): boolean {
  return Boolean(process.env['RAZORPAY_KEY_ID'] && process.env['RAZORPAY_KEY_SECRET']);
}

export async function settleBooking(bookingRaw: unknown, ctx: InvocationContext): Promise<void> {
  const parsed = BookingDocSchema.safeParse(bookingRaw);
  if (!parsed.success || parsed.data.status !== 'COMPLETED') return;

  const booking = parsed.data;
  const { id: bookingId, technicianId } = booking;

  if (!technicianId) {
    ctx.log(`settleBooking: COMPLETED booking ${bookingId} has no technicianId — skipping`);
    return;
  }

  const paymentMethod = booking.paymentMethod ?? 'CASH_ON_SERVICE';
  const bookingAmount = booking.finalAmount ?? booking.amount;

  // ── CASH_ON_SERVICE path (pilot default) ────────────────────────────────────
  // Technician already holds the cash; platform records a commission receivable.
  // No money transfer to technician.
  if (paymentMethod !== 'RAZORPAY') {
    const existing = await commissionReceivableRepo.getByBookingId(bookingId, technicianId);
    if (existing) {
      ctx.log(`settleBooking: commission receivable already exists for ${bookingId} — skipping`);
      return;
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
    });
    if (!created) {
      ctx.log(`settleBooking: concurrent invocation already created commission receivable for ${bookingId} — skipping`);
      return;
    }

    try {
      await systemAuditEntry('COMMISSION_DUE_RECORDED', bookingId, {
        technicianId,
        bookingAmount,
        commissionBps: bps,
        commissionDue,
        commissionResolvedFrom,
      });
    } catch (auditErr: unknown) {
      Sentry.captureException(auditErr);
    }

    try {
      await Promise.all([
        incrementCompletedJobCount(technicianId),
        sendTechEarningsUpdate(technicianId, { bookingId, commissionDue }),
      ]);
    } catch (err: unknown) {
      Sentry.captureException(err);
    }
    return;
  }

  // ── RAZORPAY path (guarded — dead in cash pilot, preserved for re-enablement) ─
  if (!hasRazorpayCredentials()) {
    ctx.log(`settleBooking: RAZORPAY booking ${bookingId} but no Razorpay credentials configured — skipping`);
    return;
  }

  const existingLedger = await walletLedgerRepo.getByBookingId(bookingId, technicianId);
  if (existingLedger) {
    ctx.log(`settleBooking: wallet entry already exists for ${bookingId} (status=${existingLedger.payoutStatus}) — skipping`);
    return;
  }

  try {
    await systemAuditEntry('ROUTE_TRANSFER_ATTEMPT', bookingId, { technicianId, bookingAmount });
  } catch (auditErr: unknown) {
    Sentry.captureException(auditErr);
  }

  const [tech, globalBpsRazorpay, serviceRazorpay, categoryRazorpay] = await Promise.all([
    getTechnicianForSettlement(technicianId),
    getGlobalCommissionBps(),
    catalogueRepo.getServiceByIdCrossPartition(booking.serviceId),
    catalogueRepo.getCategoryById(booking.categoryId),
  ]);
  const completedJobCount = tech?.completedJobCount ?? 0;
  const { bps: resolvedBps } = resolveCommissionBps({
    ...(serviceRazorpay?.commissionBps !== undefined ? { serviceBps: serviceRazorpay.commissionBps } : {}),
    ...(categoryRazorpay?.commissionBps !== undefined ? { categoryBps: categoryRazorpay.commissionBps } : {}),
    globalBps: globalBpsRazorpay,
  });
  const { commissionBps, commissionAmount, techAmount: techAmountBeforeFee } = calculateCommission(
    bookingAmount,
    resolvedBps,
  );

  const rawCadence = tech?.payoutCadence;
  const cadence: 'WEEKLY' | 'NEXT_DAY' | 'INSTANT' =
    rawCadence === 'INSTANT' || rawCadence === 'NEXT_DAY' || rawCadence === 'WEEKLY'
      ? rawCadence
      : 'WEEKLY';

  let effectiveCadence = cadence;
  let payoutFeeAmount = 0;
  let techAmount = techAmountBeforeFee;

  if (cadence === 'INSTANT') {
    if (techAmountBeforeFee > 2500) {
      payoutFeeAmount = 2500;
      techAmount = techAmountBeforeFee - 2500;
    } else {
      effectiveCadence = 'WEEKLY';
    }
  } else if (cadence === 'NEXT_DAY') {
    if (techAmountBeforeFee > 1500) {
      payoutFeeAmount = 1500;
      techAmount = techAmountBeforeFee - 1500;
    } else {
      effectiveCadence = 'WEEKLY';
    }
  }

  const heldForCadence = effectiveCadence !== 'INSTANT';

  const created = await walletLedgerRepo.createPendingEntry({
    bookingId,
    technicianId,
    bookingAmount,
    completedJobCountAtSettlement: completedJobCount,
    commissionBps,
    commissionAmount,
    techAmount,
    payoutCadence: effectiveCadence,
    payoutFeeAmount,
    heldForCadence,
  });
  if (!created) {
    ctx.log(`settleBooking: concurrent invocation already created wallet entry for ${bookingId} — skipping`);
    return;
  }

  if (heldForCadence) {
    const auditAction = effectiveCadence === 'NEXT_DAY' ? 'SETTLEMENT_HELD_NEXT_DAY' : 'SETTLEMENT_HELD_WEEKLY';
    try {
      await systemAuditEntry(auditAction, bookingId, { techAmount, payoutFeeAmount, technicianId });
    } catch (auditErr: unknown) {
      Sentry.captureException(auditErr);
    }
    return;
  }

  if (!tech?.razorpayLinkedAccountId) {
    await walletLedgerRepo.markFailed(bookingId, technicianId, 'no Razorpay linked account');
    await systemAuditEntry('ROUTE_TRANSFER_FAILED', bookingId, { reason: 'no Razorpay linked account' });
    return;
  }

  const razorpay = new RazorpayRouteService(); // nosemgrep: cash-razorpay-guard,api.cash-razorpay-guard
  let transferId: string;
  try {
    const result = await razorpay.transfer({
      accountId: tech.razorpayLinkedAccountId,
      amount: techAmount,
      notes: { bookingId, technicianId },
      idempotencyKey: bookingId,
    });
    transferId = result.transferId;
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err);
    await walletLedgerRepo.markFailed(bookingId, technicianId, reason);
    Sentry.captureException(err);
    await systemAuditEntry('ROUTE_TRANSFER_FAILED', bookingId, { reason });
    return;
  }

  await walletLedgerRepo.markPaid(bookingId, technicianId, transferId);
  await systemAuditEntry('ROUTE_TRANSFER_INSTANT', bookingId, { transferId, techAmount, payoutFeeAmount });

  try {
    await incrementCompletedJobCount(technicianId);
    await sendTechEarningsUpdate(technicianId, { bookingId, techAmount });
  } catch (err: unknown) {
    Sentry.captureException(err);
  }
}

app.cosmosDB('triggerBookingCompleted', {
  connection: 'COSMOS_CONNECTION_STRING',
  databaseName: DB_NAME,
  containerName: 'bookings',
  leaseContainerName: 'booking_completed_leases',
  createLeaseContainerIfNotExists: true,
  startFromBeginning: false,
  handler: async (documents: unknown[], context: InvocationContext): Promise<void> => {
    for (const doc of documents) {
      try {
        await settleBooking(doc, context);
      } catch (err: unknown) {
        Sentry.captureException(err);
        context.log(
          `settleBooking ERROR: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  },
});
