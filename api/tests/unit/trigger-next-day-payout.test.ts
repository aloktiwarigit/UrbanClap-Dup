import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InvocationContext } from '@azure/functions';

vi.mock('../../src/cosmos/wallet-ledger-repository.js');
vi.mock('../../src/cosmos/technician-repository.js');
vi.mock('../../src/cosmos/audit-log-repository.js');
vi.mock('../../src/services/razorpayRoute.service.js');
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { processNextDayPayouts } from '../../src/functions/trigger-next-day-payout.js';
import { walletLedgerRepo } from '../../src/cosmos/wallet-ledger-repository.js';
import * as techRepo from '../../src/cosmos/technician-repository.js';
import * as auditRepo from '../../src/cosmos/audit-log-repository.js';
import { RazorpayRouteService } from '../../src/services/razorpayRoute.service.js';

const mockCtx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;

const pendingEntry = {
  id: 'booking-1',
  bookingId: 'booking-1',
  technicianId: 'tech-1',
  partitionKey: 'tech-1',
  bookingAmount: 50000,
  completedJobCountAtSettlement: 5,
  commissionBps: 2200,
  commissionAmount: 11000,
  techAmount: 37500,
  payoutStatus: 'PENDING' as const,
  payoutCadence: 'NEXT_DAY' as const,
  payoutFeeAmount: 1500,
  heldForCadence: true,
  createdAt: '2026-04-28T12:00:00.000Z',
};

const mockTransfer = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(walletLedgerRepo.getNextDayPendingBefore).mockResolvedValue([pendingEntry]);
  vi.mocked(walletLedgerRepo.markPaid).mockResolvedValue(undefined);
  vi.mocked(walletLedgerRepo.markFailed).mockResolvedValue(undefined);
  vi.mocked(techRepo.getTechnicianForSettlement).mockResolvedValue({
    id: 'tech-1',
    completedJobCount: 5,
    razorpayLinkedAccountId: 'acc-rp-1',
  });
  vi.mocked(auditRepo.appendAuditEntry).mockResolvedValue(undefined);
  mockTransfer.mockResolvedValue({ transferId: 'trf-nd-1' });
  vi.mocked(RazorpayRouteService).mockImplementation(() => ({
    transfer: mockTransfer,
  }) as unknown as RazorpayRouteService);
});

describe('processNextDayPayouts', () => {
  it('fetches NEXT_DAY PENDING entries created before today IST midnight', async () => {
    vi.useFakeTimers();
    // Cron fires at 04:30 UTC = 10:00 IST on 2026-04-29
    vi.setSystemTime(new Date('2026-04-29T04:30:00.000Z'));

    await processNextDayPayouts(mockCtx);

    // Cutoff = today IST midnight in UTC = 2026-04-28T18:30:00.000Z
    expect(walletLedgerRepo.getNextDayPendingBefore).toHaveBeenCalledWith(
      '2026-04-28T18:30:00.000Z',
    );

    vi.useRealTimers();
  });

  it('fires Razorpay transfer with techAmount and bookingId idempotency key', async () => {
    await processNextDayPayouts(mockCtx);

    expect(mockTransfer).toHaveBeenCalledWith({
      accountId: 'acc-rp-1',
      amount: 37500,
      notes: { bookingId: 'booking-1', technicianId: 'tech-1' },
      idempotencyKey: 'booking-1',
    });
  });

  it('marks entry PAID on successful transfer', async () => {
    await processNextDayPayouts(mockCtx);
    expect(walletLedgerRepo.markPaid).toHaveBeenCalledWith('booking-1', 'tech-1', 'trf-nd-1');
  });

  it('writes ROUTE_TRANSFER_NEXT_DAY audit entry on success', async () => {
    await processNextDayPayouts(mockCtx);

    const auditCall = vi.mocked(auditRepo.appendAuditEntry).mock.calls.find(
      ([entry]) => entry.action === 'ROUTE_TRANSFER_NEXT_DAY',
    );
    expect(auditCall).toBeDefined();
  });

  it('marks FAILED and continues to next entry when Razorpay throws', async () => {
    const secondEntry = { ...pendingEntry, id: 'booking-2', bookingId: 'booking-2' };
    vi.mocked(walletLedgerRepo.getNextDayPendingBefore).mockResolvedValue([pendingEntry, secondEntry]);
    mockTransfer
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ transferId: 'trf-nd-2' });

    await processNextDayPayouts(mockCtx);

    expect(walletLedgerRepo.markFailed).toHaveBeenCalledWith('booking-1', 'tech-1', 'timeout');
    expect(walletLedgerRepo.markPaid).toHaveBeenCalledWith('booking-2', 'tech-1', 'trf-nd-2');
  });

  it('skips entry when heldForCadence is already false (idempotency guard)', async () => {
    vi.mocked(walletLedgerRepo.getNextDayPendingBefore).mockResolvedValue([
      { ...pendingEntry, heldForCadence: false },
    ]);

    await processNextDayPayouts(mockCtx);

    expect(mockTransfer).not.toHaveBeenCalled();
    expect(walletLedgerRepo.markPaid).not.toHaveBeenCalled();
  });

  it('marks FAILED when technician has no Razorpay linked account', async () => {
    vi.mocked(techRepo.getTechnicianForSettlement).mockResolvedValue({
      id: 'tech-1',
      completedJobCount: 5,
    });

    await processNextDayPayouts(mockCtx);

    expect(walletLedgerRepo.markFailed).toHaveBeenCalledWith(
      'booking-1', 'tech-1', 'no Razorpay linked account',
    );
    expect(mockTransfer).not.toHaveBeenCalled();
  });

  it('does nothing when no pending entries found', async () => {
    vi.mocked(walletLedgerRepo.getNextDayPendingBefore).mockResolvedValue([]);

    await processNextDayPayouts(mockCtx);

    expect(mockTransfer).not.toHaveBeenCalled();
  });
});
