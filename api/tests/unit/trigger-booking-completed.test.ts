import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InvocationContext } from '@azure/functions';

vi.mock('../../src/cosmos/wallet-ledger-repository.js');
vi.mock('../../src/cosmos/technician-repository.js');
vi.mock('../../src/cosmos/audit-log-repository.js');
vi.mock('../../src/services/fcm.service.js');
vi.mock('../../src/services/razorpayRoute.service.js');

import { settleBooking } from '../../src/functions/trigger-booking-completed.js';
import { walletLedgerRepo } from '../../src/cosmos/wallet-ledger-repository.js';
import * as techRepo from '../../src/cosmos/technician-repository.js';
import * as auditRepo from '../../src/cosmos/audit-log-repository.js';
import * as fcmService from '../../src/services/fcm.service.js';
import { RazorpayRouteService } from '../../src/services/razorpayRoute.service.js';

const mockCtx = { log: vi.fn() } as unknown as InvocationContext;

const completedBooking = {
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
  paymentId: 'pay-1',
  paymentSignature: 'sig-1',
  amount: 50000,
  technicianId: 'tech-1',
  createdAt: '2026-04-24T09:00:00.000Z',
};

const mockTransfer = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(walletLedgerRepo.getByBookingId).mockResolvedValue(null);
  vi.mocked(walletLedgerRepo.createPendingEntry).mockResolvedValue(true);
  vi.mocked(walletLedgerRepo.markPaid).mockResolvedValue(undefined);
  vi.mocked(walletLedgerRepo.markFailed).mockResolvedValue(undefined);
  vi.mocked(techRepo.getTechnicianForSettlement).mockResolvedValue({
    id: 'tech-1',
    completedJobCount: 5,
    razorpayLinkedAccountId: 'acc-rp-1',
  });
  vi.mocked(techRepo.incrementCompletedJobCount).mockResolvedValue(undefined);
  vi.mocked(auditRepo.appendAuditEntry).mockResolvedValue(undefined);
  vi.mocked(fcmService.sendTechEarningsUpdate).mockResolvedValue(undefined);
  mockTransfer.mockResolvedValue({ transferId: 'trf-xyz' });
  vi.mocked(RazorpayRouteService).mockImplementation(() => ({
    transfer: mockTransfer,
  }) as unknown as RazorpayRouteService);
});

describe('settleBooking', () => {
  it('skips documents that are not COMPLETED status', async () => {
    await settleBooking({ ...completedBooking, status: 'IN_PROGRESS' }, mockCtx);
    expect(walletLedgerRepo.createPendingEntry).not.toHaveBeenCalled();
    expect(mockTransfer).not.toHaveBeenCalled();
  });

  it('skips malformed documents silently', async () => {
    await settleBooking({ invalid: true }, mockCtx);
    expect(walletLedgerRepo.createPendingEntry).not.toHaveBeenCalled();
  });

  it('skips COMPLETED booking with no technicianId', async () => {
    const noTech = { ...completedBooking, technicianId: undefined };
    await settleBooking(noTech, mockCtx);
    expect(walletLedgerRepo.createPendingEntry).not.toHaveBeenCalled();
  });

  describe('idempotency', () => {
    it('double-fire: second call does NOT create entry or call Razorpay when entry is PAID', async () => {
      vi.mocked(walletLedgerRepo.getByBookingId).mockResolvedValue({
        id: 'booking-abc',
        bookingId: 'booking-abc',
        technicianId: 'tech-1',
        partitionKey: 'tech-1',
        bookingAmount: 50000,
        completedJobCountAtSettlement: 5,
        commissionBps: 2200,
        commissionAmount: 11000,
        techAmount: 39000,
        payoutStatus: 'PAID',
        razorpayTransferId: 'trf-existing',
        createdAt: '2026-04-24T10:00:00.000Z',
        settledAt: '2026-04-24T10:00:01.000Z',
      });

      await settleBooking(completedBooking, mockCtx);

      expect(walletLedgerRepo.createPendingEntry).not.toHaveBeenCalled();
      expect(mockTransfer).not.toHaveBeenCalled();
    });

    it('concurrent fire: returns early when createPendingEntry returns false (409 Conflict)', async () => {
      vi.mocked(walletLedgerRepo.createPendingEntry).mockResolvedValue(false);

      await settleBooking(completedBooking, mockCtx);

      expect(mockTransfer).not.toHaveBeenCalled();
    });

    it('uses bookingId as Razorpay idempotency key', async () => {
      await settleBooking(completedBooking, mockCtx);

      expect(mockTransfer).toHaveBeenCalledWith(
        expect.objectContaining({ idempotencyKey: 'booking-abc' }),
      );
    });
  });

  describe('commission', () => {
    it('uses finalAmount over amount when both present', async () => {
      await settleBooking({ ...completedBooking, finalAmount: 60000, amount: 50000 }, mockCtx);

      expect(walletLedgerRepo.createPendingEntry).toHaveBeenCalledWith(
        expect.objectContaining({ bookingAmount: 60000 }),
      );
    });

    it('applies 22% commission for completedJobCount < 50', async () => {
      vi.mocked(techRepo.getTechnicianForSettlement).mockResolvedValue({
        id: 'tech-1', completedJobCount: 49, razorpayLinkedAccountId: 'acc-rp-1',
      });

      await settleBooking(completedBooking, mockCtx); // amount = 50000 paise

      expect(walletLedgerRepo.createPendingEntry).toHaveBeenCalledWith(
        expect.objectContaining({ commissionBps: 2200, commissionAmount: 11000, techAmount: 39000 }),
      );
    });

    it('applies 25% commission for completedJobCount >= 50', async () => {
      vi.mocked(techRepo.getTechnicianForSettlement).mockResolvedValue({
        id: 'tech-1', completedJobCount: 50, razorpayLinkedAccountId: 'acc-rp-1',
      });

      await settleBooking(completedBooking, mockCtx);

      expect(walletLedgerRepo.createPendingEntry).toHaveBeenCalledWith(
        expect.objectContaining({ commissionBps: 2500, commissionAmount: 12500, techAmount: 37500 }),
      );
    });
  });

  describe('audit logging', () => {
    it('writes ROUTE_TRANSFER_ATTEMPT audit entry before Razorpay call', async () => {
      const callOrder: string[] = [];
      vi.mocked(auditRepo.appendAuditEntry).mockImplementation(async (entry) => {
        callOrder.push(`audit:${entry.action}`);
      });
      mockTransfer.mockImplementation(async () => {
        callOrder.push('razorpay:transfer');
        return { transferId: 'trf-xyz' };
      });

      await settleBooking(completedBooking, mockCtx);

      expect(callOrder[0]).toBe('audit:ROUTE_TRANSFER_ATTEMPT');
      const razorpayIdx = callOrder.indexOf('razorpay:transfer');
      const attemptIdx = callOrder.indexOf('audit:ROUTE_TRANSFER_ATTEMPT');
      expect(attemptIdx).toBeLessThan(razorpayIdx);
    });

    it('writes ROUTE_TRANSFER_SUCCESS audit entry on success', async () => {
      await settleBooking(completedBooking, mockCtx);

      const successCall = vi.mocked(auditRepo.appendAuditEntry).mock.calls.find(
        ([entry]) => entry.action === 'ROUTE_TRANSFER_SUCCESS',
      );
      expect(successCall).toBeDefined();
    });

    it('writes ROUTE_TRANSFER_FAILED audit entry on Razorpay error', async () => {
      mockTransfer.mockRejectedValue(new Error('Razorpay timeout'));

      await settleBooking(completedBooking, mockCtx);

      const failCall = vi.mocked(auditRepo.appendAuditEntry).mock.calls.find(
        ([entry]) => entry.action === 'ROUTE_TRANSFER_FAILED',
      );
      expect(failCall).toBeDefined();
    });
  });

  describe('failure isolation', () => {
    it('marks wallet_ledger FAILED on Razorpay error — does NOT touch booking status', async () => {
      mockTransfer.mockRejectedValue(new Error('network error'));

      await settleBooking(completedBooking, mockCtx);

      expect(walletLedgerRepo.markFailed).toHaveBeenCalledWith('booking-abc', 'tech-1', 'network error');
      expect(walletLedgerRepo.markPaid).not.toHaveBeenCalled();
    });

    it('marks FAILED with "no Razorpay linked account" when tech has no account', async () => {
      vi.mocked(techRepo.getTechnicianForSettlement).mockResolvedValue({
        id: 'tech-1', completedJobCount: 5, razorpayLinkedAccountId: undefined,
      });

      await settleBooking(completedBooking, mockCtx);

      expect(walletLedgerRepo.markFailed).toHaveBeenCalledWith(
        'booking-abc', 'tech-1', 'no Razorpay linked account',
      );
      expect(mockTransfer).not.toHaveBeenCalled();
    });

    it('increments completedJobCount only on success', async () => {
      await settleBooking(completedBooking, mockCtx);
      expect(techRepo.incrementCompletedJobCount).toHaveBeenCalledWith('tech-1');
    });

    it('does NOT increment completedJobCount on Razorpay failure', async () => {
      mockTransfer.mockRejectedValue(new Error('fail'));
      await settleBooking(completedBooking, mockCtx);
      expect(techRepo.incrementCompletedJobCount).not.toHaveBeenCalled();
    });

    it('sends FCM earnings update to tech only on success', async () => {
      await settleBooking(completedBooking, mockCtx);
      expect(fcmService.sendTechEarningsUpdate).toHaveBeenCalledWith('tech-1', {
        bookingId: 'booking-abc',
        techAmount: 39000,
      });
    });
  });
});
