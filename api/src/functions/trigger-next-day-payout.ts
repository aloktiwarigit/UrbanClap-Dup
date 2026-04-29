import '../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { randomUUID } from 'node:crypto';
import { walletLedgerRepo } from '../cosmos/wallet-ledger-repository.js';
import { getTechnicianForSettlement } from '../cosmos/technician-repository.js';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
import { RazorpayRouteService } from '../services/razorpayRoute.service.js';

const IST_OFFSET_MS = 5.5 * 3600000;

function todayIstMidnightUtc(): string {
  const now = new Date();
  // Shift to IST to determine today's IST calendar date
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const istDateStr = istNow.toISOString().slice(0, 10); // "YYYY-MM-DD" in IST
  // IST midnight of that date in UTC: subtract IST offset from the nominal UTC midnight
  const utcMs = new Date(`${istDateStr}T00:00:00.000Z`).getTime() - IST_OFFSET_MS;
  return new Date(utcMs).toISOString();
}

export async function processNextDayPayouts(ctx: InvocationContext): Promise<void> {
  const cutoff = todayIstMidnightUtc();
  ctx.log(`processNextDayPayouts: cutoff=${cutoff}`);

  const entries = await walletLedgerRepo.getNextDayPendingBefore(cutoff);
  ctx.log(`processNextDayPayouts: found ${entries.length} NEXT_DAY pending entries`);

  const razorpay = new RazorpayRouteService();

  for (const entry of entries) {
    const { bookingId, technicianId, techAmount } = entry;

    // Idempotency guard — may have been processed by a concurrent/retry run
    if (!entry.heldForCadence) {
      ctx.log(`processNextDayPayouts: ${bookingId} already released — skipping`);
      continue;
    }

    const tech = await getTechnicianForSettlement(technicianId);
    if (!tech?.razorpayLinkedAccountId) {
      await walletLedgerRepo.markFailed(bookingId, technicianId, 'no Razorpay linked account');
      Sentry.captureException(new Error(`next-day payout: no Razorpay account for ${technicianId}`));
      continue;
    }

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
      ctx.error(`processNextDayPayouts: transfer failed for ${bookingId}`, err);
      continue;
    }

    await walletLedgerRepo.markPaid(bookingId, technicianId, transferId);

    try {
      const timestamp = new Date().toISOString();
      await appendAuditEntry({
        id: randomUUID(),
        adminId: 'system',
        role: 'system',
        action: 'ROUTE_TRANSFER_NEXT_DAY',
        resourceType: 'booking',
        resourceId: bookingId,
        payload: { transferId, techAmount, technicianId },
        timestamp,
        partitionKey: timestamp.slice(0, 7),
      });
    } catch (auditErr: unknown) {
      Sentry.captureException(auditErr);
    }
  }
}

app.timer('triggerNextDayPayout', {
  schedule: '0 30 4 * * *', // 04:30 UTC = 10:00 IST daily
  handler: async (_myTimer: unknown, context: InvocationContext): Promise<void> => {
    try {
      await processNextDayPayouts(context);
    } catch (err: unknown) {
      Sentry.captureException(err);
      context.error('processNextDayPayouts top-level error', err);
    }
  },
});
