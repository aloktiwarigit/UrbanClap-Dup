import '../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { randomUUID } from 'node:crypto';
import { BookingDocSchema } from '../schemas/booking.js';
import { walletLedgerRepo } from '../cosmos/wallet-ledger-repository.js';
import { getTechnicianForSettlement, incrementCompletedJobCount } from '../cosmos/technician-repository.js';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
import { calculateCommission } from '../services/commission.service.js';
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

export async function settleBooking(bookingRaw: unknown, ctx: InvocationContext): Promise<void> {
  const parsed = BookingDocSchema.safeParse(bookingRaw);
  if (!parsed.success || parsed.data.status !== 'COMPLETED') return;

  const booking = parsed.data;
  const { id: bookingId, technicianId } = booking;

  if (!technicianId) {
    ctx.log(`settleBooking: COMPLETED booking ${bookingId} has no technicianId — skipping`);
    return;
  }

  const existing = await walletLedgerRepo.getByBookingId(bookingId, technicianId);
  if (existing) {
    ctx.log(`settleBooking: entry already exists for ${bookingId} (status=${existing.payoutStatus}) — skipping`);
    return;
  }

  const bookingAmount = booking.finalAmount ?? booking.amount;

  // Best-effort: audit failure must not prevent settlement
  try {
    await systemAuditEntry('ROUTE_TRANSFER_ATTEMPT', bookingId, { technicianId, bookingAmount });
  } catch (auditErr: unknown) {
    Sentry.captureException(auditErr);
  }

  const tech = await getTechnicianForSettlement(technicianId);
  const completedJobCount = tech?.completedJobCount ?? 0;
  const { commissionBps, commissionAmount, techAmount: techAmountBeforeFee } = calculateCommission(
    completedJobCount,
    bookingAmount,
  );

  // Determine effective cadence — treat undefined (legacy) as WEEKLY
  const rawCadence = tech?.payoutCadence;
  const cadence: 'WEEKLY' | 'NEXT_DAY' | 'INSTANT' =
    rawCadence === 'INSTANT' || rawCadence === 'NEXT_DAY' || rawCadence === 'WEEKLY'
      ? rawCadence
      : 'WEEKLY';

  // Compute fee and apply minimum-guard: if techAmount would be ≤ fee threshold, treat as WEEKLY
  let effectiveCadence = cadence;
  let payoutFeeAmount = 0;
  let techAmount = techAmountBeforeFee;

  if (cadence === 'INSTANT') {
    if (techAmountBeforeFee > 2500) {
      payoutFeeAmount = 2500;
      techAmount = techAmountBeforeFee - 2500;
    } else {
      effectiveCadence = 'WEEKLY'; // guard: avoid negative/zero payout
    }
  } else if (cadence === 'NEXT_DAY') {
    if (techAmountBeforeFee > 1500) {
      payoutFeeAmount = 1500;
      techAmount = techAmountBeforeFee - 1500;
    } else {
      effectiveCadence = 'WEEKLY'; // guard
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
    ctx.log(`settleBooking: concurrent invocation already created entry for ${bookingId} — skipping`);
    return;
  }

  // NEXT_DAY and WEEKLY are held — audit and stop; cron/admin will release them
  if (heldForCadence) {
    const auditAction = effectiveCadence === 'NEXT_DAY' ? 'SETTLEMENT_HELD_NEXT_DAY' : 'SETTLEMENT_HELD_WEEKLY';
    try {
      await systemAuditEntry(auditAction, bookingId, { techAmount, payoutFeeAmount, technicianId });
    } catch (auditErr: unknown) {
      Sentry.captureException(auditErr);
    }
    return;
  }

  // INSTANT — proceed with immediate Razorpay Route transfer
  if (!tech?.razorpayLinkedAccountId) {
    await walletLedgerRepo.markFailed(bookingId, technicianId, 'no Razorpay linked account');
    await systemAuditEntry('ROUTE_TRANSFER_FAILED', bookingId, { reason: 'no Razorpay linked account' });
    return;
  }

  const razorpay = new RazorpayRouteService();
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

  // Transfer succeeded — mark PAID and audit immediately
  await walletLedgerRepo.markPaid(bookingId, technicianId, transferId);
  await systemAuditEntry('ROUTE_TRANSFER_INSTANT', bookingId, { transferId, techAmount, payoutFeeAmount });

  // Best-effort post-transfer notifications; never rollback PAID status
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
