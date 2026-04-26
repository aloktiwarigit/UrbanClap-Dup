import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InvocationContext } from '@azure/functions';

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getAssignedBookingsBefore: vi.fn(), getById: vi.fn() },
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
  // Default: getById returns ASSIGNED (fresh-read guard passes)
  // The dispatcher.service mock handles its own getById internally (not this mock).
  vi.mocked(bookingRepo.getById).mockResolvedValue({ status: 'ASSIGNED' } as BookingDoc);
  vi.mocked(customerCreditRepo.createCreditIfAbsent).mockResolvedValue(true);
  vi.mocked(updateBookingFields).mockResolvedValue(null);
  vi.mocked(dispatcherService.redispatch).mockResolvedValue(true);
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

  it('skips booking when fresh re-read shows technician already advanced to IN_PROGRESS (stale ASSIGNED snapshot)', async () => {
    vi.mocked(bookingRepo.getAssignedBookingsBefore)
      .mockResolvedValue([makeAssignedBooking('bk-in-progress', 45)]);
    // Fresh re-read reveals tech already started work after the query returned
    vi.mocked(bookingRepo.getById).mockResolvedValue({ status: 'IN_PROGRESS' } as BookingDoc);

    await detectNoShows(mockCtx);

    expect(customerCreditRepo.createCreditIfAbsent).not.toHaveBeenCalled();
    expect(updateBookingFields).not.toHaveBeenCalled();
    expect(dispatcherService.redispatch).not.toHaveBeenCalled();
    expect(fcmService.sendNoShowCreditPush).not.toHaveBeenCalled();
  });

  it('allows recovery when fresh re-read shows NO_SHOW_REDISPATCH (prior run wrote status but crashed before redispatch)', async () => {
    const booking = makeAssignedBooking('bk-recovery-status', 45);
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([booking]);
    // Fresh re-read returns NO_SHOW_REDISPATCH — prior run set status but crashed before redispatch
    vi.mocked(bookingRepo.getById).mockResolvedValue({ status: 'NO_SHOW_REDISPATCH' } as BookingDoc);
    vi.mocked(customerCreditRepo.createCreditIfAbsent).mockResolvedValue(false);

    await detectNoShows(mockCtx);

    // Recovery should proceed to status write and redispatch
    expect(dispatcherService.redispatch).toHaveBeenCalled();
  });

  it('processes booking 45 minutes past slot start: writes credit, updates status+noShowRedispatchAt, redispatches, sends FCM', async () => {
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
    expect(updateBookingFields).toHaveBeenCalledWith('bk-due', { status: 'NO_SHOW_REDISPATCH', technicianId: undefined });
    expect(updateBookingFields).toHaveBeenCalledWith(
      'bk-due',
      expect.objectContaining({ noShowRedispatchAt: expect.any(String) }),
    );
    expect(dispatcherService.redispatch).toHaveBeenCalledWith('bk-due', 15, undefined);
    // FCM fires because creditCreated=true (this run issued the credit)
    expect(fcmService.sendNoShowCreditPush).toHaveBeenCalledWith(booking.customerId, 'bk-due', 50_000);
  });

  it('retries status-write + redispatch + FCM when credit exists but noShowRedispatchAt is absent and same tech (prior run crashed before status-write)', async () => {
    const booking = makeAssignedBooking('bk-dup', 45);
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([booking]);
    vi.mocked(customerCreditRepo.createCreditIfAbsent).mockResolvedValue(false);
    // Prior run created credit but crashed before writing status — original tech still assigned
    vi.mocked(bookingRepo.getById).mockResolvedValue({ status: 'ASSIGNED', technicianId: undefined } as BookingDoc);

    await detectNoShows(mockCtx);

    expect(updateBookingFields).toHaveBeenCalledWith('bk-dup', { status: 'NO_SHOW_REDISPATCH', technicianId: undefined });
    expect(dispatcherService.redispatch).toHaveBeenCalledWith('bk-dup', 15, undefined);
    // FCM must NOT fire in recovery path — creditCreated=false means prior run already sent it
    expect(fcmService.sendNoShowCreditPush).not.toHaveBeenCalled();
  });

  it('skips entirely when credit exists and noShowRedispatchAt is set (redispatch already triggered)', async () => {
    const booking = makeAssignedBooking('bk-already-dispatched', 45);
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([booking]);
    vi.mocked(customerCreditRepo.createCreditIfAbsent).mockResolvedValue(false);
    // noShowRedispatchAt is present — prior run successfully fired redispatch
    vi.mocked(bookingRepo.getById).mockResolvedValue({
      status: 'ASSIGNED',
      technicianId: 'tech-new',
      noShowRedispatchAt: '2026-04-26T05:00:00.000Z',
    } as BookingDoc);

    await detectNoShows(mockCtx);

    expect(updateBookingFields).not.toHaveBeenCalled();
    expect(dispatcherService.redispatch).not.toHaveBeenCalled();
    expect(fcmService.sendNoShowCreditPush).not.toHaveBeenCalled();
  });

  it('skips entirely when replacement tech accepted but noShowRedispatchAt stamp failed (technicianId differs)', async () => {
    const booking = makeAssignedBooking('bk-stamp-failed', 45);
    // Original booking has no technicianId (makeAssignedBooking doesn't set one)
    // but let's give it one to make the test clear
    const bookingWithTech = { ...booking, technicianId: 'tech-original' };
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([bookingWithTech]);
    vi.mocked(customerCreditRepo.createCreditIfAbsent).mockResolvedValue(false);
    // Replacement tech accepted, stamp write failed — liveBooking shows different technicianId
    vi.mocked(bookingRepo.getById).mockResolvedValue({
      status: 'ASSIGNED',
      technicianId: 'tech-replacement',
    } as BookingDoc);

    await detectNoShows(mockCtx);

    expect(updateBookingFields).not.toHaveBeenCalled();
    expect(dispatcherService.redispatch).not.toHaveBeenCalled();
    expect(fcmService.sendNoShowCreditPush).not.toHaveBeenCalled();
  });

  it('skips booking entirely when createCreditIfAbsent throws (cannot determine credit state)', async () => {
    const booking = makeAssignedBooking('bk-credit-err', 45);
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([booking]);
    vi.mocked(customerCreditRepo.createCreditIfAbsent).mockRejectedValue(new Error('cosmos 503'));

    await detectNoShows(mockCtx);

    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
    expect(updateBookingFields).not.toHaveBeenCalled();
    expect(dispatcherService.redispatch).not.toHaveBeenCalled();
    expect(fcmService.sendNoShowCreditPush).not.toHaveBeenCalled();
  });

  it('captures Sentry + skips redispatch when updateBookingFields throws, but still sends FCM (credit was issued)', async () => {
    vi.mocked(bookingRepo.getAssignedBookingsBefore)
      .mockResolvedValue([makeAssignedBooking('bk-err', 45)]);
    vi.mocked(updateBookingFields).mockRejectedValue(new Error('cosmos 503'));

    // Status write failure is non-fatal — detectNoShows should not throw
    await expect(detectNoShows(mockCtx)).resolves.not.toThrow();

    // Credit was attempted (it is the gate — comes first)
    expect(customerCreditRepo.createCreditIfAbsent).toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
    // Redispatch skipped — statusWriteOk=false gates it
    expect(dispatcherService.redispatch).not.toHaveBeenCalled();
    // FCM still fires — creditCreated=true means customer must get the notification
    expect(fcmService.sendNoShowCreditPush).toHaveBeenCalled();
  });

  it('captures Sentry when redispatch throws and still sends FCM (credit was issued, customer deserves notification)', async () => {
    vi.mocked(bookingRepo.getAssignedBookingsBefore)
      .mockResolvedValue([makeAssignedBooking('bk-rdp-err', 45)]);
    vi.mocked(dispatcherService.redispatch).mockRejectedValue(new Error('no techs'));

    await detectNoShows(mockCtx);

    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
    // FCM fires because creditCreated=true — customer must always get the credit notification
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

  it('continues to next booking when createCreditIfAbsent throws for one booking (loop isolation)', async () => {
    const due1 = makeAssignedBooking('bk-1', 45);
    const due2 = makeAssignedBooking('bk-2', 45);
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([due1, due2]);
    vi.mocked(customerCreditRepo.createCreditIfAbsent)
      .mockRejectedValueOnce(new Error('cosmos 503'))
      .mockResolvedValueOnce(true);

    await detectNoShows(mockCtx);

    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
    // bk-1 skipped (credit threw), bk-2 proceeds with 2 updateBookingFields calls
    // (one for NO_SHOW_REDISPATCH status, one for noShowRedispatchAt after successful redispatch)
    expect(updateBookingFields).toHaveBeenCalledTimes(2);
    expect(updateBookingFields).toHaveBeenCalledWith('bk-2', { status: 'NO_SHOW_REDISPATCH', technicianId: undefined });
    expect(updateBookingFields).toHaveBeenCalledWith('bk-2', expect.objectContaining({ noShowRedispatchAt: expect.any(String) }));
    expect(dispatcherService.redispatch).toHaveBeenCalledWith('bk-2', 15, undefined);
  });
});
