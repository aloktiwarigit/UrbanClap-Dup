import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InvocationContext } from '@azure/functions';

vi.mock('../../src/cosmos/wallet-ledger-repository.js');
vi.mock('../../src/cosmos/technician-repository.js');
vi.mock('../../src/cosmos/audit-log-repository.js');
vi.mock('../../src/services/fcm.service.js');
vi.mock('../../src/services/razorpayRoute.service.js');

import { reconcilePayouts } from '../../src/functions/trigger-reconcile-payouts.js';
import { walletLedgerRepo } from '../../src/cosmos/wallet-ledger-repository.js';
import * as techRepo from '../../src/cosmos/technician-repository.js';
import * as auditRepo from '../../src/cosmos/audit-log-repository.js';
import * as fcmService from '../../src/services/fcm.service.js';
import { RazorpayRouteService } from '../../src/services/razorpayRoute.service.js';

const mockCtx = { log: vi.fn() } as unknown as InvocationContext;

const mockTransfer = vi.fn();

const stalePendingEntry = {
  id: 'booking-stale',
  bookingId: 'booking-stale',
  technicianId: 'tech-2',
  partitionKey: 'tech-2',
  bookingAmount: 50000,
  completedJobCountAtSettlement: 10,
  commissionBps: 2200,
  commissionAmount: 11000,
  techAmount: 39000,
  payoutStatus: 'PENDING' as const,
  createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
};

const failedEntry = {
  ...stalePendingEntry,
  id: 'booking-fail',
  bookingId: 'booking-fail',
  payoutStatus: 'FAILED' as const,
  failureReason: 'Razorpay timeout',
  createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(walletLedgerRepo.getPendingEntriesOlderThan).mockResolvedValue([]);
  vi.mocked(walletLedgerRepo.getFailedEntries).mockResolvedValue([]);
  vi.mocked(walletLedgerRepo.markPaid).mockResolvedValue(undefined);
  vi.mocked(walletLedgerRepo.markFailed).mockResolvedValue(undefined);
  vi.mocked(techRepo.getTechnicianForSettlement).mockResolvedValue({
    id: 'tech-2', completedJobCount: 10, razorpayLinkedAccountId: 'acc-rp-2',
  });
  vi.mocked(techRepo.incrementCompletedJobCount).mockResolvedValue(undefined);
  vi.mocked(auditRepo.appendAuditEntry).mockResolvedValue(undefined);
  vi.mocked(fcmService.sendTechEarningsUpdate).mockResolvedValue(undefined);
  vi.mocked(fcmService.sendOwnerRouteAlert).mockResolvedValue(undefined);
  mockTransfer.mockResolvedValue({ transferId: 'trf-retry-1' });
  vi.mocked(RazorpayRouteService).mockImplementation(() => ({
    transfer: mockTransfer,
  }) as unknown as RazorpayRouteService);
});

describe('reconcilePayouts', () => {
  it('does nothing and sends no alert when no stale pending or failed entries', async () => {
    await reconcilePayouts(mockCtx);
    expect(mockTransfer).not.toHaveBeenCalled();
    expect(fcmService.sendOwnerRouteAlert).not.toHaveBeenCalled();
  });

  describe('stale PENDING retry', () => {
    it('retries stale PENDING entry with same idempotency key (Razorpay deduplication)', async () => {
      vi.mocked(walletLedgerRepo.getPendingEntriesOlderThan).mockResolvedValue([stalePendingEntry]);

      await reconcilePayouts(mockCtx);

      expect(mockTransfer).toHaveBeenCalledWith(
        expect.objectContaining({ idempotencyKey: 'booking-stale' }),
      );
    });

    it('uses stored techAmount from wallet_ledger entry for retry amount', async () => {
      vi.mocked(walletLedgerRepo.getPendingEntriesOlderThan).mockResolvedValue([stalePendingEntry]);

      await reconcilePayouts(mockCtx);

      expect(mockTransfer).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 39000 }),
      );
    });

    it('marks entry PAID and increments job count on successful retry', async () => {
      vi.mocked(walletLedgerRepo.getPendingEntriesOlderThan).mockResolvedValue([stalePendingEntry]);

      await reconcilePayouts(mockCtx);

      expect(walletLedgerRepo.markPaid).toHaveBeenCalledWith('booking-stale', 'tech-2', 'trf-retry-1');
      expect(techRepo.incrementCompletedJobCount).toHaveBeenCalledWith('tech-2');
    });

    it('marks entry FAILED and sends owner alert on retry failure', async () => {
      vi.mocked(walletLedgerRepo.getPendingEntriesOlderThan).mockResolvedValue([stalePendingEntry]);
      mockTransfer.mockRejectedValue(new Error('retry failed'));

      await reconcilePayouts(mockCtx);

      expect(walletLedgerRepo.markFailed).toHaveBeenCalledWith(
        'booking-stale', 'tech-2', 'retry failed',
      );
      expect(fcmService.sendOwnerRouteAlert).toHaveBeenCalledWith(
        expect.objectContaining({ stalePending: 1 }),
      );
    });
  });

  describe('failed entries alert', () => {
    it('sends owner FCM alert when there are FAILED entries', async () => {
      vi.mocked(walletLedgerRepo.getFailedEntries).mockResolvedValue([failedEntry]);

      await reconcilePayouts(mockCtx);

      expect(fcmService.sendOwnerRouteAlert).toHaveBeenCalledWith(
        expect.objectContaining({ failed: 1 }),
      );
    });

    it('combines retry-failed count and pre-existing failed count in alert', async () => {
      vi.mocked(walletLedgerRepo.getPendingEntriesOlderThan).mockResolvedValue([stalePendingEntry]);
      vi.mocked(walletLedgerRepo.getFailedEntries).mockResolvedValue([failedEntry]);
      mockTransfer.mockRejectedValue(new Error('still failing'));

      await reconcilePayouts(mockCtx);

      expect(fcmService.sendOwnerRouteAlert).toHaveBeenCalledWith({ stalePending: 1, failed: 1 });
    });

    it('writes RECON_MISMATCH_ALERT audit entry when alerting', async () => {
      vi.mocked(walletLedgerRepo.getFailedEntries).mockResolvedValue([failedEntry]);

      await reconcilePayouts(mockCtx);

      const alertCall = vi.mocked(auditRepo.appendAuditEntry).mock.calls.find(
        ([entry]) => entry.action === 'RECON_MISMATCH_ALERT',
      );
      expect(alertCall).toBeDefined();
    });
  });

  describe('audit entries', () => {
    it('writes RECON_RETRY_ATTEMPT before transfer call', async () => {
      vi.mocked(walletLedgerRepo.getPendingEntriesOlderThan).mockResolvedValue([stalePendingEntry]);
      const callOrder: string[] = [];
      vi.mocked(auditRepo.appendAuditEntry).mockImplementation(async (e) => { callOrder.push(`audit:${e.action}`); });
      mockTransfer.mockImplementation(async () => { callOrder.push('razorpay'); return { transferId: 't1' }; });

      await reconcilePayouts(mockCtx);

      expect(callOrder[0]).toBe('audit:RECON_RETRY_ATTEMPT');
      expect(callOrder.indexOf('razorpay')).toBeGreaterThan(callOrder.indexOf('audit:RECON_RETRY_ATTEMPT'));
    });
  });
});
