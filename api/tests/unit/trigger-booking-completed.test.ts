import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { InvocationContext } from '@azure/functions';

vi.mock('../../src/cosmos/wallet-ledger-repository.js');
vi.mock('../../src/cosmos/technician-repository.js');
vi.mock('../../src/cosmos/audit-log-repository.js');
vi.mock('../../src/cosmos/catalogue-repository.js');
vi.mock('../../src/services/commission-config.service.js');
vi.mock('../../src/services/commission-settlement.service.js');
vi.mock('../../src/services/fcm.service.js');
vi.mock('../../src/services/razorpayRoute.service.js');
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { settleBooking, handleBookingCompletedBatch } from '../../src/functions/trigger-booking-completed.js';
import * as Sentry from '@sentry/node';
import { walletLedgerRepo } from '../../src/cosmos/wallet-ledger-repository.js';
import * as techRepo from '../../src/cosmos/technician-repository.js';
import * as auditRepo from '../../src/cosmos/audit-log-repository.js';
import { catalogueRepo } from '../../src/cosmos/catalogue-repository.js';
import * as configSvc from '../../src/services/commission-config.service.js';
import * as settlementSvc from '../../src/services/commission-settlement.service.js';
import * as fcmService from '../../src/services/fcm.service.js';
import { RazorpayRouteService } from '../../src/services/razorpayRoute.service.js';

const mockCtx = { log: vi.fn() } as unknown as InvocationContext;

const cashBooking = {
  id: 'booking-abc',
  customerId: 'customer-1',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  slotDate: '2026-04-24',
  slotWindow: '09:00-11:00',
  addressText: '123 Main St',
  addressLatLng: { lat: 12.9, lng: 77.6 },
  status: 'COMPLETED',
  paymentOrderId: 'order-1',
  paymentMethod: 'CASH_ON_SERVICE',
  paymentId: 'pay-1',
  paymentSignature: 'sig-1',
  amount: 50000,
  technicianId: 'tech-1',
  createdAt: '2026-04-24T09:00:00.000Z',
};

const mockTransfer = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();

  // CASH path defaults
  vi.mocked(settlementSvc.settleCashCompletion).mockResolvedValue({
    created: true,
    commissionDue: 11000,
    commissionBps: 2200,
    commissionResolvedFrom: 'GLOBAL',
  });
  vi.mocked(configSvc.getGlobalCommissionBps).mockResolvedValue(2200);
  vi.mocked(configSvc.resolveCommissionBps).mockReturnValue({ bps: 2200, from: 'GLOBAL' });
  vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue(null);
  vi.mocked(catalogueRepo.getCategoryById).mockResolvedValue(null);

  // Razorpay path defaults
  vi.mocked(walletLedgerRepo.getByBookingId).mockResolvedValue(null);
  vi.mocked(walletLedgerRepo.createPendingEntry).mockResolvedValue(true);
  vi.mocked(walletLedgerRepo.markPaid).mockResolvedValue(undefined);
  vi.mocked(walletLedgerRepo.markFailed).mockResolvedValue(undefined);
  vi.mocked(techRepo.getTechnicianForSettlement).mockResolvedValue({
    id: 'tech-1',
    completedJobCount: 5,
    razorpayLinkedAccountId: 'acc-rp-1',
    payoutCadence: 'INSTANT',
  });

  // Shared defaults
  vi.mocked(techRepo.incrementCompletedJobCount).mockResolvedValue(undefined);
  vi.mocked(auditRepo.appendAuditEntry).mockResolvedValue(undefined);
  vi.mocked(fcmService.sendTechEarningsUpdate).mockResolvedValue(undefined);
  mockTransfer.mockResolvedValue({ transferId: 'trf-xyz' });
  vi.mocked(RazorpayRouteService).mockImplementation(() => ({
    transfer: mockTransfer,
  }) as unknown as RazorpayRouteService);
});

describe('settleBooking — common guards', () => {
  it('skips non-COMPLETED status', async () => {
    await settleBooking({ ...cashBooking, status: 'IN_PROGRESS' }, mockCtx);
    expect(settlementSvc.settleCashCompletion).not.toHaveBeenCalled();
    expect(walletLedgerRepo.createPendingEntry).not.toHaveBeenCalled();
  });

  it('skips malformed documents silently', async () => {
    await settleBooking({ invalid: true }, mockCtx);
    expect(settlementSvc.settleCashCompletion).not.toHaveBeenCalled();
  });

  it('skips COMPLETED booking with no technicianId', async () => {
    await settleBooking({ ...cashBooking, technicianId: undefined }, mockCtx);
    expect(settlementSvc.settleCashCompletion).not.toHaveBeenCalled();
  });
});

describe('settleBooking — CASH_ON_SERVICE path (pilot)', () => {
  it('calls settleCashCompletion once with the parsed booking', async () => {
    await settleBooking(cashBooking, mockCtx);

    expect(settlementSvc.settleCashCompletion).toHaveBeenCalledTimes(1);
    expect(settlementSvc.settleCashCompletion).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'booking-abc', technicianId: 'tech-1' }),
      expect.objectContaining({ log: expect.any(Function) }),
    );
  });

  it('does NOT call RazorpayRouteService or walletLedgerRepo', async () => {
    await settleBooking(cashBooking, mockCtx);
    expect(RazorpayRouteService).not.toHaveBeenCalled();
    expect(walletLedgerRepo.createPendingEntry).not.toHaveBeenCalled();
  });

  it('does NOT audit/increment/send FCM itself — those side effects now live inside settleCashCompletion', async () => {
    await settleBooking(cashBooking, mockCtx);

    expect(auditRepo.appendAuditEntry).not.toHaveBeenCalled();
    expect(techRepo.incrementCompletedJobCount).not.toHaveBeenCalled();
    expect(fcmService.sendTechEarningsUpdate).not.toHaveBeenCalled();
  });

  it('treats undefined paymentMethod as CASH_ON_SERVICE', async () => {
    const noMethod = { ...cashBooking, paymentMethod: undefined };
    await settleBooking(noMethod, mockCtx);

    expect(settlementSvc.settleCashCompletion).toHaveBeenCalled();
    expect(walletLedgerRepo.createPendingEntry).not.toHaveBeenCalled();
  });

  describe('P1 (Codex review): money-critical settlement failures must propagate, not be swallowed', () => {
    it('settleBooking rejects when settleCashCompletion rejects', async () => {
      const err = new Error('getGlobalCommissionBps unavailable');
      vi.mocked(settlementSvc.settleCashCompletion).mockRejectedValue(err);

      await expect(settleBooking(cashBooking, mockCtx)).rejects.toThrow(err);
    });
  });
});

describe('handleBookingCompletedBatch (registered change-feed handler)', () => {
  it('rethrows after Sentry-capturing and logging a failing document, so the lease is not checkpointed', async () => {
    const err = new Error('getGlobalCommissionBps unavailable');
    vi.mocked(settlementSvc.settleCashCompletion).mockRejectedValue(err);

    await expect(handleBookingCompletedBatch([cashBooking], mockCtx)).rejects.toThrow(err);

    expect(Sentry.captureException).toHaveBeenCalledWith(err);
    expect(mockCtx.log).toHaveBeenCalledWith(expect.stringContaining('settleBooking ERROR'));
  });

  it('does not throw for a non-COMPLETED or unparseable document', async () => {
    await expect(
      handleBookingCompletedBatch([{ ...cashBooking, status: 'IN_PROGRESS' }, { invalid: true }], mockCtx),
    ).resolves.toBeUndefined();

    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(settlementSvc.settleCashCompletion).not.toHaveBeenCalled();
  });
});

describe('settleBooking — RAZORPAY path (guarded, dead in cash pilot)', () => {
  beforeEach(() => {
    vi.stubEnv('RAZORPAY_KEY_ID', 'test-key-id');
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'test-key-secret');
    // P0-0: this block exercises the payout path, so it opts into the kill
    // switch explicitly. Production defaults to disabled.
    vi.stubEnv('PAYOUTS_ENABLED', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const razorpayBooking = { ...cashBooking, paymentMethod: 'RAZORPAY' };

  it('skips gracefully when Razorpay credentials are not configured', async () => {
    vi.unstubAllEnvs();

    await settleBooking(razorpayBooking, mockCtx);

    expect(walletLedgerRepo.createPendingEntry).not.toHaveBeenCalled();
    expect(mockTransfer).not.toHaveBeenCalled();
  });

  // P0-0 regression: credentials alone must never arm a transfer. Before the kill
  // switch this exact input — RAZORPAY booking, credentials present, INSTANT
  // cadence — moved money while the runbook claimed payouts were disabled.
  it('does NOT transfer when payouts are disabled, even with credentials present', async () => {
    vi.stubEnv('PAYOUTS_ENABLED', '');

    await settleBooking(razorpayBooking, mockCtx);

    expect(mockTransfer).not.toHaveBeenCalled();
    expect(RazorpayRouteService).not.toHaveBeenCalled();
    expect(walletLedgerRepo.createPendingEntry).not.toHaveBeenCalled();
  });

  it('does NOT create commission receivable — uses wallet ledger instead', async () => {
    await settleBooking(razorpayBooking, mockCtx);

    expect(settlementSvc.settleCashCompletion).not.toHaveBeenCalled();
    expect(walletLedgerRepo.createPendingEntry).toHaveBeenCalled();
  });

  it('transfers immediately for INSTANT cadence', async () => {
    await settleBooking(razorpayBooking, mockCtx);
    expect(mockTransfer).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: 'booking-abc' }),
    );
  });

  it('is idempotent: skips if wallet entry already exists', async () => {
    vi.mocked(walletLedgerRepo.getByBookingId).mockResolvedValue({
      id: 'booking-abc', bookingId: 'booking-abc', technicianId: 'tech-1',
      partitionKey: 'tech-1', bookingAmount: 50000, completedJobCountAtSettlement: 5,
      commissionBps: 2200, commissionAmount: 11000, techAmount: 39000,
      payoutStatus: 'PAID', razorpayTransferId: 'trf-existing',
      createdAt: '2026-04-24T10:00:00.000Z', settledAt: '2026-04-24T10:00:01.000Z',
    });

    await settleBooking(razorpayBooking, mockCtx);

    expect(walletLedgerRepo.createPendingEntry).not.toHaveBeenCalled();
    expect(mockTransfer).not.toHaveBeenCalled();
  });

  it('WEEKLY: no fee, heldForCadence=true, no transfer', async () => {
    vi.mocked(techRepo.getTechnicianForSettlement).mockResolvedValue({
      id: 'tech-1', completedJobCount: 5, razorpayLinkedAccountId: 'acc-rp-1', payoutCadence: 'WEEKLY',
    });

    await settleBooking(razorpayBooking, mockCtx);

    expect(walletLedgerRepo.createPendingEntry).toHaveBeenCalledWith(
      expect.objectContaining({ payoutCadence: 'WEEKLY', payoutFeeAmount: 0, heldForCadence: true }),
    );
    expect(mockTransfer).not.toHaveBeenCalled();
  });

  it('marks wallet entry FAILED and audits ROUTE_TRANSFER_FAILED on Razorpay error', async () => {
    mockTransfer.mockRejectedValue(new Error('Razorpay timeout'));

    await settleBooking(razorpayBooking, mockCtx);

    expect(walletLedgerRepo.markFailed).toHaveBeenCalledWith('booking-abc', 'tech-1', 'Razorpay timeout');
    const failCall = vi.mocked(auditRepo.appendAuditEntry).mock.calls.find(
      ([e]) => e.action === 'ROUTE_TRANSFER_FAILED',
    );
    expect(failCall).toBeDefined();
  });

  it('marks wallet entry FAILED with "no Razorpay linked account" when INSTANT tech has no account', async () => {
    vi.mocked(techRepo.getTechnicianForSettlement).mockResolvedValue({
      id: 'tech-1', completedJobCount: 5, payoutCadence: 'INSTANT',
    });

    await settleBooking(razorpayBooking, mockCtx);

    expect(walletLedgerRepo.markFailed).toHaveBeenCalledWith(
      'booking-abc', 'tech-1', 'no Razorpay linked account',
    );
    expect(mockTransfer).not.toHaveBeenCalled();
  });

  it('audits ROUTE_TRANSFER_INSTANT on INSTANT success', async () => {
    await settleBooking(razorpayBooking, mockCtx);

    const successCall = vi.mocked(auditRepo.appendAuditEntry).mock.calls.find(
      ([entry]) => entry.action === 'ROUTE_TRANSFER_INSTANT',
    );
    expect(successCall).toBeDefined();
  });
});
