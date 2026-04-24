import '../bootstrap.js';
import { app } from '@azure/functions';
import type { Timer, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { randomUUID } from 'node:crypto';
import { walletLedgerRepo } from '../cosmos/wallet-ledger-repository.js';
import { getTechnicianForSettlement, incrementCompletedJobCount } from '../cosmos/technician-repository.js';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
import { RazorpayRouteService } from '../services/razorpayRoute.service.js';
import { sendTechEarningsUpdate, sendOwnerRouteAlert } from '../services/fcm.service.js';

function systemAuditEntry(action: string, payload: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  return appendAuditEntry({
    id: randomUUID(),
    adminId: 'system',
    role: 'system',
    action,
    resourceType: 'wallet_ledger',
    resourceId: 'reconciliation',
    payload,
    timestamp,
    partitionKey: timestamp.slice(0, 7),
  });
}

export async function reconcilePayouts(ctx: InvocationContext): Promise<void> {
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const [pendingStale, failedEntries] = await Promise.all([
    walletLedgerRepo.getPendingEntriesOlderThan(cutoff),
    walletLedgerRepo.getFailedEntries(),
  ]);

  ctx.log(
    `reconcilePayouts: ${pendingStale.length} stale-pending, ${failedEntries.length} failed entries`,
  );

  const razorpay = new RazorpayRouteService();
  let retryFailed = 0;

  for (const entry of pendingStale) {
    // Best-effort: audit failure must not prevent reconciliation attempt
    try {
      await systemAuditEntry('RECON_RETRY_ATTEMPT', { bookingId: entry.bookingId });
    } catch (auditErr: unknown) {
      Sentry.captureException(auditErr);
    }
    let transferId: string;
    try {
      const tech = await getTechnicianForSettlement(entry.technicianId);
      if (!tech?.razorpayLinkedAccountId) {
        throw new Error('no Razorpay linked account');
      }
      const result = await razorpay.transfer({
        accountId: tech.razorpayLinkedAccountId,
        amount: entry.techAmount,
        notes: { bookingId: entry.bookingId, technicianId: entry.technicianId },
        idempotencyKey: entry.bookingId,
      });
      transferId = result.transferId;
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : String(err);
      await walletLedgerRepo.markFailed(entry.bookingId, entry.technicianId, reason);
      Sentry.captureException(err);
      await systemAuditEntry('RECON_RETRY_FAILED', { bookingId: entry.bookingId, reason });
      retryFailed += 1;
      continue;
    }

    // Transfer succeeded
    await walletLedgerRepo.markPaid(entry.bookingId, entry.technicianId, transferId);
    await systemAuditEntry('RECON_RETRY_SUCCESS', { bookingId: entry.bookingId, transferId });
    try {
      await incrementCompletedJobCount(entry.technicianId);
      await sendTechEarningsUpdate(entry.technicianId, {
        bookingId: entry.bookingId,
        techAmount: entry.techAmount,
      });
    } catch (err: unknown) {
      Sentry.captureException(err);
    }
  }

  const totalMismatches = retryFailed + failedEntries.length;
  if (totalMismatches > 0) {
    await sendOwnerRouteAlert({ stalePending: retryFailed, failed: failedEntries.length });
    await systemAuditEntry('RECON_MISMATCH_ALERT', {
      stalePending: retryFailed,
      failed: failedEntries.length,
    });
  }
}

app.timer('triggerReconcilePayouts', {
  // 2 AM IST = 8:30 PM UTC previous day
  schedule: '0 30 20 * * *',
  handler: async (_timer: Timer, ctx: InvocationContext): Promise<void> => {
    try {
      await reconcilePayouts(ctx);
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.log(`reconcilePayouts ERROR: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  },
});
