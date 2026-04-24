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

  await systemAuditEntry('ROUTE_TRANSFER_ATTEMPT', bookingId, { technicianId, bookingAmount });

  const tech = await getTechnicianForSettlement(technicianId);
  const completedJobCount = tech?.completedJobCount ?? 0;
  const { commissionBps, commissionAmount, techAmount } = calculateCommission(
    completedJobCount,
    bookingAmount,
  );

  const created = await walletLedgerRepo.createPendingEntry({
    bookingId,
    technicianId,
    bookingAmount,
    completedJobCountAtSettlement: completedJobCount,
    commissionBps,
    commissionAmount,
    techAmount,
  });
  if (!created) {
    ctx.log(`settleBooking: concurrent invocation already created entry for ${bookingId} — skipping`);
    return;
  }

  if (!tech?.razorpayLinkedAccountId) {
    await walletLedgerRepo.markFailed(bookingId, technicianId, 'no Razorpay linked account');
    await systemAuditEntry('ROUTE_TRANSFER_FAILED', bookingId, { reason: 'no Razorpay linked account' });
    return;
  }

  const razorpay = new RazorpayRouteService();
  try {
    const { transferId } = await razorpay.transfer({
      accountId: tech.razorpayLinkedAccountId,
      amount: techAmount,
      notes: { bookingId, technicianId },
      idempotencyKey: bookingId,
    });
    await walletLedgerRepo.markPaid(bookingId, technicianId, transferId);
    await incrementCompletedJobCount(technicianId);
    await sendTechEarningsUpdate(technicianId, { bookingId, techAmount });
    await systemAuditEntry('ROUTE_TRANSFER_SUCCESS', bookingId, { transferId, techAmount });
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err);
    await walletLedgerRepo.markFailed(bookingId, technicianId, reason);
    Sentry.captureException(err);
    await systemAuditEntry('ROUTE_TRANSFER_FAILED', bookingId, { reason });
  }
}

app.cosmosDB('triggerBookingCompleted', {
  connectionStringSetting: 'COSMOS_CONNECTION_STRING',
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
