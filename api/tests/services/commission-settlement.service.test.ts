import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/cosmos/commission-receivable-repository.js');
vi.mock('../../src/cosmos/catalogue-repository.js');
vi.mock('../../src/cosmos/technician-repository.js');
vi.mock('../../src/services/commission-config.service.js');
vi.mock('../../src/services/commission-allocator.service.js');
vi.mock('../../src/services/commission-hold.service.js');
vi.mock('../../src/services/fcm.service.js');
vi.mock('../../src/services/auditLog.service.js');
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import {
  recordCommissionDue,
  finalizeLedgerForTechnician,
  settleCashCompletion,
} from '../../src/services/commission-settlement.service.js';
import { commissionReceivableRepo } from '../../src/cosmos/commission-receivable-repository.js';
import { catalogueRepo } from '../../src/cosmos/catalogue-repository.js';
import { incrementCompletedJobCount } from '../../src/cosmos/technician-repository.js';
import * as configSvc from '../../src/services/commission-config.service.js';
import { consumePendingCredits } from '../../src/services/commission-allocator.service.js';
import { recomputeCommissionHold } from '../../src/services/commission-hold.service.js';
import { sendTechEarningsUpdate } from '../../src/services/fcm.service.js';
import { systemAudit } from '../../src/services/auditLog.service.js';
import * as Sentry from '@sentry/node';
import type { BookingDoc } from '../../src/schemas/booking.js';

const cashBooking: BookingDoc = {
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

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(commissionReceivableRepo.getByBookingId).mockResolvedValue(null);
  vi.mocked(commissionReceivableRepo.createDueEntry).mockResolvedValue(true);
  vi.mocked(configSvc.getGlobalCommissionBps).mockResolvedValue(2200);
  vi.mocked(configSvc.resolveCommissionBps).mockReturnValue({ bps: 2200, from: 'GLOBAL' });
  vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue(null);
  vi.mocked(catalogueRepo.getCategoryById).mockResolvedValue(null);

  vi.mocked(consumePendingCredits).mockResolvedValue({ consumedPaise: 0 });
  vi.mocked(recomputeCommissionHold).mockResolvedValue({ hold: null, status: 'MISSING' });

  vi.mocked(incrementCompletedJobCount).mockResolvedValue(undefined);
  vi.mocked(sendTechEarningsUpdate).mockResolvedValue(undefined);
  vi.mocked(systemAudit).mockResolvedValue(undefined);
});

describe('recordCommissionDue — cascade precedence (moved from trigger test)', () => {
  it('creates a DUE commission receivable with global bps when no service/category override', async () => {
    const r = await recordCommissionDue(cashBooking);

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
    expect(r).toEqual({ created: true, commissionDue: 11000, commissionBps: 2200, commissionResolvedFrom: 'GLOBAL' });
  });

  it('resolves service-level bps when service has commissionBps override', async () => {
    vi.mocked(configSvc.resolveCommissionBps).mockReturnValue({ bps: 2500, from: 'SERVICE' });
    vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue({ commissionBps: 2500 } as never);

    const r = await recordCommissionDue(cashBooking);

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ commissionBps: 2500, commissionDue: 12500, commissionResolvedFrom: 'SERVICE' }),
    );
    expect(r).toMatchObject({ created: true, commissionBps: 2500, commissionDue: 12500, commissionResolvedFrom: 'SERVICE' });
  });

  it('resolves category-level bps when category has override but service does not', async () => {
    vi.mocked(configSvc.resolveCommissionBps).mockReturnValue({ bps: 3000, from: 'CATEGORY' });
    vi.mocked(catalogueRepo.getCategoryById).mockResolvedValue({ commissionBps: 3000 } as never);

    const r = await recordCommissionDue(cashBooking);

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ commissionBps: 3000, commissionDue: 15000, commissionResolvedFrom: 'CATEGORY' }),
    );
    expect(r).toMatchObject({ created: true, commissionBps: 3000, commissionDue: 15000, commissionResolvedFrom: 'CATEGORY' });
  });

  it('passes cashCollectedAmount to createDueEntry when present on booking', async () => {
    await recordCommissionDue({ ...cashBooking, cashCollectedAmount: 50000 });

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ cashCollectedAmount: 50000 }),
    );
  });

  it('omits cashCollectedAmount when absent on booking', async () => {
    await recordCommissionDue(cashBooking);

    const call = vi.mocked(commissionReceivableRepo.createDueEntry).mock.calls[0]![0];
    expect(Object.prototype.hasOwnProperty.call(call, 'cashCollectedAmount')).toBe(false);
  });

  it('uses finalAmount over amount for commissionDue calculation', async () => {
    // finalAmount=60000 at 2200 bps -> commissionDue = round(60000*2200/10000) = 13200
    const r = await recordCommissionDue({ ...cashBooking, finalAmount: 60000, amount: 50000 });

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ bookingAmount: 60000, commissionDue: 13200 }),
    );
    expect(r).toMatchObject({ commissionDue: 13200 });
  });
});

describe('recordCommissionDue — denormalised fields', () => {
  it('includes serviceName from booking.serviceName when present', async () => {
    await recordCommissionDue({ ...cashBooking, serviceName: 'Deep Clean' });

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ serviceName: 'Deep Clean' }),
    );
  });

  it('falls back to the catalogue service name when booking.serviceName is absent', async () => {
    vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue({ name: 'AC Repair' } as never);

    await recordCommissionDue(cashBooking);

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ serviceName: 'AC Repair' }),
    );
  });

  it('omits serviceName entirely when both booking.serviceName and the catalogue service name are absent', async () => {
    await recordCommissionDue(cashBooking);

    const call = vi.mocked(commissionReceivableRepo.createDueEntry).mock.calls[0]![0];
    expect(Object.prototype.hasOwnProperty.call(call, 'serviceName')).toBe(false);
  });

  it('always passes slotDate from the booking', async () => {
    await recordCommissionDue(cashBooking);

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ slotDate: '2026-04-24' }),
    );
  });

  it('passes collectionMethod when present on the booking', async () => {
    await recordCommissionDue({ ...cashBooking, collectionMethod: 'UPI_QR' });

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ collectionMethod: 'UPI_QR' }),
    );
  });

  it('omits collectionMethod entirely when absent on the booking', async () => {
    await recordCommissionDue(cashBooking);

    const call = vi.mocked(commissionReceivableRepo.createDueEntry).mock.calls[0]![0];
    expect(Object.prototype.hasOwnProperty.call(call, 'collectionMethod')).toBe(false);
  });
});

describe('recordCommissionDue — guards', () => {
  it('returns skipped NOT_COMPLETED for a non-COMPLETED booking, without reading the ledger', async () => {
    const r = await recordCommissionDue({ ...cashBooking, status: 'IN_PROGRESS' });

    expect(r).toEqual({ created: false, skipped: 'NOT_COMPLETED' });
    expect(commissionReceivableRepo.getByBookingId).not.toHaveBeenCalled();
  });

  it('returns skipped NO_TECHNICIAN when technicianId is missing, without reading the ledger', async () => {
    const r = await recordCommissionDue({ ...cashBooking, technicianId: undefined });

    expect(r).toEqual({ created: false, skipped: 'NO_TECHNICIAN' });
    expect(commissionReceivableRepo.getByBookingId).not.toHaveBeenCalled();
  });

  it('returns skipped NOT_CASH for a RAZORPAY booking, without touching the receivable repo', async () => {
    const r = await recordCommissionDue({ ...cashBooking, paymentMethod: 'RAZORPAY' });

    expect(r).toEqual({ created: false, skipped: 'NOT_CASH' });
    expect(commissionReceivableRepo.getByBookingId).not.toHaveBeenCalled();
    expect(commissionReceivableRepo.createDueEntry).not.toHaveBeenCalled();
    expect(configSvc.getGlobalCommissionBps).not.toHaveBeenCalled();
  });
});

describe('recordCommissionDue — existing-row and 409 paths', () => {
  it('returns created:false with the stored values when the receivable already exists', async () => {
    vi.mocked(commissionReceivableRepo.getByBookingId).mockResolvedValue({
      id: 'booking-abc',
      bookingId: 'booking-abc',
      technicianId: 'tech-1',
      partitionKey: 'tech-1',
      serviceId: 'svc-1',
      categoryId: 'cat-1',
      bookingAmount: 50000,
      commissionBps: 2500,
      commissionDue: 12500,
      commissionResolvedFrom: 'SERVICE',
      remittanceStatus: 'DUE',
      createdAt: '2026-04-24T10:00:00.000Z',
    });

    const r = await recordCommissionDue(cashBooking);

    expect(r).toEqual({ created: false, commissionDue: 12500, commissionBps: 2500, commissionResolvedFrom: 'SERVICE' });
    expect(commissionReceivableRepo.createDueEntry).not.toHaveBeenCalled();
    expect(configSvc.getGlobalCommissionBps).not.toHaveBeenCalled();
  });

  it('returns created:false with the STORED row values (not the locally computed ones) when createDueEntry 409s', async () => {
    vi.mocked(commissionReceivableRepo.getByBookingId)
      .mockResolvedValueOnce(null) // initial existence check: row doesn't exist yet
      .mockResolvedValueOnce({
        // re-read after the 409: the racing invocation resolved a different bps than we did.
        id: 'booking-abc',
        bookingId: 'booking-abc',
        technicianId: 'tech-1',
        partitionKey: 'tech-1',
        serviceId: 'svc-1',
        categoryId: 'cat-1',
        bookingAmount: 50000,
        commissionBps: 2500,
        commissionDue: 12500,
        commissionResolvedFrom: 'SERVICE',
        remittanceStatus: 'DUE',
        createdAt: '2026-04-24T10:00:00.000Z',
      });
    vi.mocked(commissionReceivableRepo.createDueEntry).mockResolvedValue(false);

    const r = await recordCommissionDue(cashBooking);

    expect(r).toEqual({ created: false, commissionDue: 12500, commissionBps: 2500, commissionResolvedFrom: 'SERVICE' });
    expect(commissionReceivableRepo.getByBookingId).toHaveBeenCalledTimes(2);
  });

  it('throws RECEIVABLE_RACE_UNREADABLE when createDueEntry 409s but the re-read comes back null', async () => {
    vi.mocked(commissionReceivableRepo.getByBookingId).mockResolvedValue(null);
    vi.mocked(commissionReceivableRepo.createDueEntry).mockResolvedValue(false);

    await expect(recordCommissionDue(cashBooking)).rejects.toMatchObject({
      message: 'RECEIVABLE_RACE_UNREADABLE',
      code: 'RECEIVABLE_RACE_UNREADABLE',
    });
  });
});

describe('finalizeLedgerForTechnician', () => {
  it('calls consumePendingCredits then recomputeCommissionHold, in order', async () => {
    const order: string[] = [];
    vi.mocked(consumePendingCredits).mockImplementation(async () => {
      order.push('consume');
      return { consumedPaise: 500 };
    });
    vi.mocked(recomputeCommissionHold).mockImplementation(async () => {
      order.push('recompute');
      return { hold: null, status: 'MISSING' };
    });

    await finalizeLedgerForTechnician('tech-1');

    expect(consumePendingCredits).toHaveBeenCalledWith('tech-1');
    expect(recomputeCommissionHold).toHaveBeenCalledWith('tech-1');
    expect(order).toEqual(['consume', 'recompute']);
  });

  it('captures the error with Sentry and still calls recomputeCommissionHold when consumePendingCredits throws', async () => {
    const err = new Error('consume boom');
    vi.mocked(consumePendingCredits).mockRejectedValue(err);

    await expect(finalizeLedgerForTechnician('tech-1')).resolves.toBeUndefined();

    expect(Sentry.captureException).toHaveBeenCalledWith(err);
    expect(recomputeCommissionHold).toHaveBeenCalledWith('tech-1');
  });

  it('captures the error with Sentry when recomputeCommissionHold throws, without rethrowing', async () => {
    const err = new Error('recompute boom');
    vi.mocked(recomputeCommissionHold).mockRejectedValue(err);

    await expect(finalizeLedgerForTechnician('tech-1')).resolves.toBeUndefined();

    expect(Sentry.captureException).toHaveBeenCalledWith(err);
  });

  it('never throws even when both steps reject', async () => {
    vi.mocked(consumePendingCredits).mockRejectedValue(new Error('a'));
    vi.mocked(recomputeCommissionHold).mockRejectedValue(new Error('b'));

    await expect(finalizeLedgerForTechnician('tech-1')).resolves.toBeUndefined();
    expect(Sentry.captureException).toHaveBeenCalledTimes(2);
  });
});

describe('settleCashCompletion (E21-S02 Codex P1 fix)', () => {
  it('on created:true — audits COMMISSION_DUE_RECORDED once with the payload, increments job count and sends FCM once, and finalizes', async () => {
    const r = await settleCashCompletion(cashBooking);

    expect(r).toEqual({ created: true, commissionDue: 11000, commissionBps: 2200, commissionResolvedFrom: 'GLOBAL' });
    expect(systemAudit).toHaveBeenCalledTimes(1);
    expect(systemAudit).toHaveBeenCalledWith('COMMISSION_DUE_RECORDED', 'booking', 'booking-abc', {
      technicianId: 'tech-1',
      bookingAmount: 50000,
      commissionBps: 2200,
      commissionDue: 11000,
      commissionResolvedFrom: 'GLOBAL',
    });
    expect(incrementCompletedJobCount).toHaveBeenCalledTimes(1);
    expect(incrementCompletedJobCount).toHaveBeenCalledWith('tech-1');
    expect(sendTechEarningsUpdate).toHaveBeenCalledTimes(1);
    expect(sendTechEarningsUpdate).toHaveBeenCalledWith('tech-1', { bookingId: 'booking-abc', commissionDue: 11000 });
    expect(consumePendingCredits).toHaveBeenCalledWith('tech-1');
    expect(recomputeCommissionHold).toHaveBeenCalledWith('tech-1');
  });

  it('on created:false — does not audit/increment/send FCM, but still finalizes the ledger', async () => {
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

    const log = vi.fn();
    const r = await settleCashCompletion(cashBooking, { log });

    expect(r).toEqual({ created: false, commissionDue: 11000, commissionBps: 2200, commissionResolvedFrom: 'GLOBAL' });
    expect(systemAudit).not.toHaveBeenCalled();
    expect(incrementCompletedJobCount).not.toHaveBeenCalled();
    expect(sendTechEarningsUpdate).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringContaining('booking-abc'));
    expect(consumePendingCredits).toHaveBeenCalledWith('tech-1');
    expect(recomputeCommissionHold).toHaveBeenCalledWith('tech-1');
  });

  it('on skipped (e.g. RAZORPAY/NOT_CASH) — calls nothing and does not finalize', async () => {
    const r = await settleCashCompletion({ ...cashBooking, paymentMethod: 'RAZORPAY' });

    expect(r).toEqual({ created: false, skipped: 'NOT_CASH' });
    expect(systemAudit).not.toHaveBeenCalled();
    expect(incrementCompletedJobCount).not.toHaveBeenCalled();
    expect(sendTechEarningsUpdate).not.toHaveBeenCalled();
    expect(consumePendingCredits).not.toHaveBeenCalled();
    expect(recomputeCommissionHold).not.toHaveBeenCalled();
  });

  it('propagates a throwing recordCommissionDue (createDueEntry throws)', async () => {
    const err = new Error('cosmos boom');
    vi.mocked(commissionReceivableRepo.createDueEntry).mockRejectedValue(err);

    await expect(settleCashCompletion(cashBooking)).rejects.toThrow(err);
    expect(consumePendingCredits).not.toHaveBeenCalled();
  });

  it('Sentry-captures a throwing incrementCompletedJobCount and still finalizes the ledger', async () => {
    const err = new Error('increment boom');
    vi.mocked(incrementCompletedJobCount).mockRejectedValue(err);

    await expect(settleCashCompletion(cashBooking)).resolves.toMatchObject({ created: true });

    expect(Sentry.captureException).toHaveBeenCalledWith(err);
    expect(consumePendingCredits).toHaveBeenCalledWith('tech-1');
    expect(recomputeCommissionHold).toHaveBeenCalledWith('tech-1');
  });

  it('exactly-once property: calling twice for the same booking fires side effects exactly once, finalizes twice', async () => {
    // First call creates the row.
    await settleCashCompletion(cashBooking);

    // Second call: the receivable now exists, so recordCommissionDue reports created:false.
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
    await settleCashCompletion(cashBooking);

    expect(systemAudit).toHaveBeenCalledTimes(1);
    expect(incrementCompletedJobCount).toHaveBeenCalledTimes(1);
    expect(sendTechEarningsUpdate).toHaveBeenCalledTimes(1);
    expect(consumePendingCredits).toHaveBeenCalledTimes(2);
    expect(recomputeCommissionHold).toHaveBeenCalledTimes(2);
  });
});
