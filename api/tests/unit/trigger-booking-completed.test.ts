import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { InvocationContext } from '@azure/functions';

vi.mock('../../src/cosmos/commission-receivable-repository.js');
vi.mock('../../src/cosmos/wallet-ledger-repository.js');
vi.mock('../../src/cosmos/technician-repository.js');
vi.mock('../../src/cosmos/audit-log-repository.js');
vi.mock('../../src/cosmos/catalogue-repository.js');
vi.mock('../../src/services/commission-config.service.js');
vi.mock('../../src/services/fcm.service.js');
vi.mock('../../src/services/razorpayRoute.service.js');

import { settleBooking } from '../../src/functions/trigger-booking-completed.js';
import { commissionReceivableRepo } from '../../src/cosmos/commission-receivable-repository.js';
import { walletLedgerRepo } from '../../src/cosmos/wallet-ledger-repository.js';
import * as techRepo from '../../src/cosmos/technician-repository.js';
import * as auditRepo from '../../src/cosmos/audit-log-repository.js';
import { catalogueRepo } from '../../src/cosmos/catalogue-repository.js';
import * as configSvc from '../../src/services/commission-config.service.js';
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
  vi.mocked(commissionReceivableRepo.getByBookingId).mockResolvedValue(null);
  vi.mocked(commissionReceivableRepo.createDueEntry).mockResolvedValue(true);
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
    expect(commissionReceivableRepo.createDueEntry).not.toHaveBeenCalled();
    expect(walletLedgerRepo.createPendingEntry).not.toHaveBeenCalled();
  });

  it('skips malformed documents silently', async () => {
    await settleBooking({ invalid: true }, mockCtx);
    expect(commissionReceivableRepo.createDueEntry).not.toHaveBeenCalled();
  });

  it('skips COMPLETED booking with no technicianId', async () => {
    await settleBooking({ ...cashBooking, technicianId: undefined }, mockCtx);
    expect(commissionReceivableRepo.createDueEntry).not.toHaveBeenCalled();
  });
});

describe('settleBooking — CASH_ON_SERVICE path (pilot)', () => {
  it('creates a DUE commission receivable with global bps when no service/category override', async () => {
    await settleBooking(cashBooking, mockCtx);

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: 'booking-abc',
        technicianId: 'tech-1',
        serviceId: 'svc-1',
        categoryId: 'cat-1',
        bookingAmount: 50000,
        commissionBps: 2200,
        commissionDue: 11000,
        commissionResolvedFrom: 'GLOBAL',
      }),
    );
  });

  it('resolves service-level bps when service has commissionBps override', async () => {
    vi.mocked(configSvc.resolveCommissionBps).mockReturnValue({ bps: 2500, from: 'SERVICE' });
    vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue(
      { commissionBps: 2500 } as never,
    );

    await settleBooking(cashBooking, mockCtx);

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ commissionBps: 2500, commissionDue: 12500, commissionResolvedFrom: 'SERVICE' }),
    );
  });

  it('resolves category-level bps when category has override but service does not', async () => {
    vi.mocked(configSvc.resolveCommissionBps).mockReturnValue({ bps: 3000, from: 'CATEGORY' });
    vi.mocked(catalogueRepo.getCategoryById).mockResolvedValue(
      { commissionBps: 3000 } as never,
    );

    await settleBooking(cashBooking, mockCtx);

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ commissionBps: 3000, commissionDue: 15000, commissionResolvedFrom: 'CATEGORY' }),
    );
  });

  it('passes cashCollectedAmount to createDueEntry when present on booking', async () => {
    await settleBooking({ ...cashBooking, cashCollectedAmount: 50000 }, mockCtx);

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ cashCollectedAmount: 50000 }),
    );
  });

  it('uses finalAmount over amount for commissionDue calculation', async () => {
    // finalAmount=60000 at 2200 bps → commissionDue = round(60000*2200/10000) = 13200
    await settleBooking({ ...cashBooking, finalAmount: 60000, amount: 50000 }, mockCtx);

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ bookingAmount: 60000, commissionDue: 13200 }),
    );
  });

  it('does NOT call RazorpayRouteService or walletLedgerRepo', async () => {
    await settleBooking(cashBooking, mockCtx);
    expect(RazorpayRouteService).not.toHaveBeenCalled();
    expect(walletLedgerRepo.createPendingEntry).not.toHaveBeenCalled();
  });

  it('audits COMMISSION_DUE_RECORDED on success', async () => {
    await settleBooking(cashBooking, mockCtx);

    const auditCall = vi.mocked(auditRepo.appendAuditEntry).mock.calls.find(
      ([entry]) => entry.action === 'COMMISSION_DUE_RECORDED',
    );
    expect(auditCall).toBeDefined();
  });

  it('increments completedJobCount and sends FCM earnings update on success', async () => {
    await settleBooking(cashBooking, mockCtx);
    expect(techRepo.incrementCompletedJobCount).toHaveBeenCalledWith('tech-1');
    expect(fcmService.sendTechEarningsUpdate).toHaveBeenCalledWith(
      'tech-1',
      expect.objectContaining({ bookingId: 'booking-abc', commissionDue: 11000 }),
    );
  });

  it('treats undefined paymentMethod as CASH_ON_SERVICE', async () => {
    const noMethod = { ...cashBooking, paymentMethod: undefined };
    await settleBooking(noMethod, mockCtx);

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalled();
    expect(walletLedgerRepo.createPendingEntry).not.toHaveBeenCalled();
  });

  describe('idempotency', () => {
    it('skips when commission receivable already exists (double-fire)', async () => {
      vi.mocked(commissionReceivableRepo.getByBookingId).mockResolvedValue({
        id: 'booking-abc',
        bookingId: 'booking-abc',
        technicianId: 'tech-1',
        partitionKey: 'tech-1',
        serviceId: 'svc-1',
        categoryId: 'cat-1',
        bookingAmount: 50000,
        commissionBps: 2200,
        commissionDue: 11000,
        commissionResolvedFrom: 'GLOBAL',
        remittanceStatus: 'DUE',
        createdAt: '2026-04-24T10:00:00.000Z',
      });

      await settleBooking(cashBooking, mockCtx);

      expect(commissionReceivableRepo.createDueEntry).not.toHaveBeenCalled();
    });

    it('does not write audit when createDueEntry returns false (concurrent 409)', async () => {
      vi.mocked(commissionReceivableRepo.createDueEntry).mockResolvedValue(false);

      await settleBooking(cashBooking, mockCtx);

      const dueCalls = vi.mocked(auditRepo.appendAuditEntry).mock.calls.filter(
        ([e]) => e.action === 'COMMISSION_DUE_RECORDED',
      );
      expect(dueCalls).toHaveLength(0);
    });
  });
});

describe('settleBooking — RAZORPAY path (guarded, dead in cash pilot)', () => {
  beforeEach(() => {
    vi.stubEnv('RAZORPAY_KEY_ID', 'test-key-id');
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'test-key-secret');
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

  it('does NOT create commission receivable — uses wallet ledger instead', async () => {
    await settleBooking(razorpayBooking, mockCtx);

    expect(commissionReceivableRepo.createDueEntry).not.toHaveBeenCalled();
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
