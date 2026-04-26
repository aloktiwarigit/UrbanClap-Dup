import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InvocationContext } from '@azure/functions';

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getAssignedBookingsBefore: vi.fn() },
  updateBookingFields: vi.fn(),
}));
vi.mock('../../src/cosmos/customer-credit-repository.js', () => ({
  customerCreditRepo: { createCreditIfAbsent: vi.fn() },
}));
vi.mock('../../src/services/dispatcher.service.js', () => ({
  dispatcherService: { redispatch: vi.fn() },
}));
vi.mock('../../src/services/fcm.service.js');
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { detectNoShows } from '../../src/functions/trigger-no-show-detector.js';
import { bookingRepo, updateBookingFields } from '../../src/cosmos/booking-repository.js';
import { customerCreditRepo } from '../../src/cosmos/customer-credit-repository.js';
import { dispatcherService } from '../../src/services/dispatcher.service.js';
import * as fcmService from '../../src/services/fcm.service.js';
import * as Sentry from '@sentry/node';
import type { BookingDoc } from '../../src/schemas/booking.js';

const mockCtx = { log: vi.fn() } as unknown as InvocationContext;

// Builds a booking doc where slotDate+slotWindow produce a slot start that is
// `minutesAgo` minutes before now in UTC.
function makeAssignedBooking(id: string, minutesAgo: number): BookingDoc {
  const slotStartUtc = new Date(Date.now() - minutesAgo * 60 * 1000);
  // Reverse-engineer the IST date+window from the desired UTC slot start.
  // IST = UTC + 5h30m → slot start IST = slotStartUtc + 330 min
  const slotStartIST = new Date(slotStartUtc.getTime() + 330 * 60 * 1000);
  const slotDate = slotStartIST.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const hh = String(slotStartIST.getUTCHours()).padStart(2, '0');
  const mm = String(slotStartIST.getUTCMinutes()).padStart(2, '0');
  const endHh = String((slotStartIST.getUTCHours() + 2) % 24).padStart(2, '0');
  const slotWindow = `${hh}:${mm}-${endHh}:${mm}`;

  return {
    id,
    customerId: `cust-${id}`,
    serviceId: 'svc-1',
    categoryId: 'cat-1',
    slotDate,
    slotWindow,
    addressText: '100 MG Road',
    addressLatLng: { lat: 12.97, lng: 77.59 },
    status: 'ASSIGNED',
    paymentOrderId: `order-${id}`,
    paymentId: `pay-${id}`,
    paymentSignature: `sig-${id}`,
    amount: 59900,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  };
}

beforeEach(() => {
  vi.mocked(mockCtx.log).mockClear();
  vi.resetAllMocks();
  vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([]);
  vi.mocked(customerCreditRepo.createCreditIfAbsent).mockResolvedValue(true);
  vi.mocked(updateBookingFields).mockResolvedValue(null);
  vi.mocked(dispatcherService.redispatch).mockResolvedValue(undefined);
  vi.mocked(fcmService.sendNoShowCreditPush).mockResolvedValue(undefined);
});

describe('detectNoShows', () => {
  it('does nothing when no ASSIGNED bookings returned', async () => {
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([]);
    await detectNoShows(mockCtx);
    expect(customerCreditRepo.createCreditIfAbsent).not.toHaveBeenCalled();
  });

  it('skips booking whose slot start is only 15 minutes ago (not yet 30 min)', async () => {
    vi.mocked(bookingRepo.getAssignedBookingsBefore)
      .mockResolvedValue([makeAssignedBooking('bk-early', 15)]);

    await detectNoShows(mockCtx);

    expect(customerCreditRepo.createCreditIfAbsent).not.toHaveBeenCalled();
    expect(dispatcherService.redispatch).not.toHaveBeenCalled();
  });

  it('processes booking 45 minutes past slot start: writes credit, updates status, redispatches, sends FCM', async () => {
    const booking = makeAssignedBooking('bk-due', 45);
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([booking]);

    await detectNoShows(mockCtx);

    expect(customerCreditRepo.createCreditIfAbsent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'bk-due',
        customerId: booking.customerId,
        bookingId: 'bk-due',
        amount: 50_000,
        reason: 'NO_SHOW',
      }),
    );
    expect(updateBookingFields).toHaveBeenCalledWith('bk-due', { status: 'NO_SHOW_REDISPATCH' });
    expect(dispatcherService.redispatch).toHaveBeenCalledWith('bk-due', 15);
    expect(fcmService.sendNoShowCreditPush).toHaveBeenCalledWith(booking.customerId, 'bk-due', 50_000);
  });

  it('when createCreditIfAbsent returns false (concurrent run): status already written, proceeds with redispatch + FCM', async () => {
    // Simulates a concurrent timer invocation where status was already flipped to
    // NO_SHOW_REDISPATCH by a sibling run. The credit write is idempotent (returns false),
    // but redispatch + FCM must still be attempted so downstream steps are not skipped.
    vi.mocked(bookingRepo.getAssignedBookingsBefore)
      .mockResolvedValue([makeAssignedBooking('bk-dup', 45)]);
    vi.mocked(customerCreditRepo.createCreditIfAbsent).mockResolvedValue(false);

    await detectNoShows(mockCtx);

    // Status write runs before credit check — must have been called
    expect(updateBookingFields).toHaveBeenCalledWith('bk-dup', { status: 'NO_SHOW_REDISPATCH' });
    // Redispatch + FCM proceed even when credit was already present
    expect(dispatcherService.redispatch).toHaveBeenCalled();
    expect(fcmService.sendNoShowCreditPush).toHaveBeenCalled();
  });

  it('propagates when updateBookingFields throws so booking stays ASSIGNED and is retried next tick', async () => {
    // P1 fix: status is written BEFORE the idempotency credit. If the status write
    // fails, the credit is never written, so the next timer run will still find
    // the booking as ASSIGNED and retry — no permanent stuck state.
    vi.mocked(bookingRepo.getAssignedBookingsBefore)
      .mockResolvedValue([makeAssignedBooking('bk-err', 45)]);
    vi.mocked(updateBookingFields).mockRejectedValue(new Error('cosmos 503'));

    await expect(detectNoShows(mockCtx)).rejects.toThrow('cosmos 503');

    // Credit must NOT be written when status write fails
    expect(customerCreditRepo.createCreditIfAbsent).not.toHaveBeenCalled();
    // Downstream steps must NOT be attempted
    expect(dispatcherService.redispatch).not.toHaveBeenCalled();
    expect(fcmService.sendNoShowCreditPush).not.toHaveBeenCalled();
  });

  it('captures Sentry + continues to FCM when redispatch throws', async () => {
    vi.mocked(bookingRepo.getAssignedBookingsBefore)
      .mockResolvedValue([makeAssignedBooking('bk-rdp-err', 45)]);
    vi.mocked(dispatcherService.redispatch).mockRejectedValue(new Error('no techs'));

    await detectNoShows(mockCtx);

    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
    expect(fcmService.sendNoShowCreditPush).toHaveBeenCalled();
  });

  it('captures Sentry without rethrowing when sendNoShowCreditPush throws', async () => {
    vi.mocked(bookingRepo.getAssignedBookingsBefore)
      .mockResolvedValue([makeAssignedBooking('bk-fcm-err', 45)]);
    vi.mocked(fcmService.sendNoShowCreditPush).mockRejectedValue(new Error('FCM 503'));

    await expect(detectNoShows(mockCtx)).resolves.not.toThrow();
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
  });

  it('processes only the due booking when given one due + one not-yet-due', async () => {
    const due = makeAssignedBooking('bk-due', 45);
    const notDue = makeAssignedBooking('bk-notdue', 15);
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([due, notDue]);

    await detectNoShows(mockCtx);

    expect(customerCreditRepo.createCreditIfAbsent).toHaveBeenCalledTimes(1);
    expect(customerCreditRepo.createCreditIfAbsent).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'bk-due' }),
    );
    expect(customerCreditRepo.createCreditIfAbsent).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: 'bk-notdue' }),
    );
  });

  it('aborts processing remaining bookings when createCreditIfAbsent throws (credit-gate invariant)', async () => {
    const due1 = makeAssignedBooking('bk-1', 45);
    const due2 = makeAssignedBooking('bk-2', 45);
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([due1, due2]);
    vi.mocked(customerCreditRepo.createCreditIfAbsent).mockRejectedValue(new Error('cosmos 503'));

    await expect(detectNoShows(mockCtx)).rejects.toThrow('cosmos 503');

    // Status was written for bk-1 before the credit write failed
    expect(updateBookingFields).toHaveBeenCalledTimes(1);
    expect(updateBookingFields).toHaveBeenCalledWith('bk-1', { status: 'NO_SHOW_REDISPATCH' });
    // No downstream steps (redispatch/FCM) for either booking
    expect(dispatcherService.redispatch).not.toHaveBeenCalled();
    expect(fcmService.sendNoShowCreditPush).not.toHaveBeenCalled();
  });
});
