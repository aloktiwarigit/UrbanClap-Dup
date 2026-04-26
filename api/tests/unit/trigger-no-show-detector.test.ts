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
function makeAssignedBooking(id: string, minutesAgo: number, extra: Partial<BookingDoc> = {}): BookingDoc {
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
    ...extra,
  };
}

// getById is called multiple times per booking; this helper sets up a sequence.
// Call order: (1) fresh-read guard, (2) recovery check (if creditCreated=false), (3) push-sent check.
// For creditCreated=true paths: call 1 = ASSIGNED, call 2 = push-check (no noShowPushSentAt).
// For creditCreated=false paths: call 1 = fresh-read, call 2 = recovery check, call 3 = push-check.
function mockGetByIdSequence(...docs: (Partial<BookingDoc> | null)[]): void {
  const mock = vi.mocked(bookingRepo.getById);
  let i = 0;
  mock.mockImplementation(async () => {
    const doc = docs[i] ?? docs[docs.length - 1];
    i++;
    return doc as BookingDoc | null;
  });
}

beforeEach(() => {
  vi.mocked(mockCtx.log).mockClear();
  vi.resetAllMocks();
  vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([]);
  // Default getById sequence for creditCreated=true path:
  // call 1: fresh-read → ASSIGNED (guard passes), call 2+: push-check → no noShowPushSentAt
  mockGetByIdSequence({ status: 'ASSIGNED' }, { status: 'NO_SHOW_REDISPATCH' });
  vi.mocked(customerCreditRepo.createCreditIfAbsent).mockResolvedValue(true);
  vi.mocked(updateBookingFields).mockResolvedValue(null);
  vi.mocked(dispatcherService.redispatch).mockResolvedValue(true);
  vi.mocked(fcmService.sendNoShowCreditPush).mockResolvedValue(undefined);
});

describe('detectNoShows', () => {
  it('does nothing when no bookings returned', async () => {
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

  it('skips booking when fresh re-read shows IN_PROGRESS (stale ASSIGNED snapshot)', async () => {
    vi.mocked(bookingRepo.getAssignedBookingsBefore)
      .mockResolvedValue([makeAssignedBooking('bk-in-progress', 45)]);
    mockGetByIdSequence({ status: 'IN_PROGRESS' });

    await detectNoShows(mockCtx);

    expect(customerCreditRepo.createCreditIfAbsent).not.toHaveBeenCalled();
    expect(updateBookingFields).not.toHaveBeenCalled();
    expect(dispatcherService.redispatch).not.toHaveBeenCalled();
    expect(fcmService.sendNoShowCreditPush).not.toHaveBeenCalled();
  });

  it('processes booking 45 minutes past slot start: writes credit, status, redispatches, sends FCM', async () => {
    const booking = makeAssignedBooking('bk-due', 45);
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([booking]);
    // getById sequence: fresh-read → ASSIGNED (guard OK), push-check → no noShowPushSentAt
    mockGetByIdSequence({ status: 'ASSIGNED' }, { status: 'NO_SHOW_REDISPATCH' });

    await detectNoShows(mockCtx);

    expect(customerCreditRepo.createCreditIfAbsent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'bk-due',
        customerId: booking.customerId,
        amount: 50_000,
        reason: 'NO_SHOW',
      }),
    );
    expect(updateBookingFields).toHaveBeenCalledWith(
      'bk-due',
      expect.objectContaining({ status: 'NO_SHOW_REDISPATCH', technicianId: undefined }),
    );
    expect(updateBookingFields).toHaveBeenCalledWith(
      'bk-due',
      expect.objectContaining({ noShowRedispatchAt: expect.any(String) }),
    );
    expect(dispatcherService.redispatch).toHaveBeenCalledWith('bk-due', 15, undefined);
    expect(fcmService.sendNoShowCreditPush).toHaveBeenCalledWith(booking.customerId, 'bk-due', 50_000);
    expect(updateBookingFields).toHaveBeenCalledWith(
      'bk-due',
      expect.objectContaining({ noShowPushSentAt: expect.any(String) }),
    );
  });

  it('allows recovery when fresh re-read shows NO_SHOW_REDISPATCH (prior run wrote status, crashed before redispatch)', async () => {
    const booking = makeAssignedBooking('bk-recovery', 45);
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([booking]);
    vi.mocked(customerCreditRepo.createCreditIfAbsent).mockResolvedValue(false);
    // call 1: fresh-read → NO_SHOW_REDISPATCH, call 2: recovery check → same, call 3: push-check → no stamp
    mockGetByIdSequence(
      { status: 'NO_SHOW_REDISPATCH' },
      { status: 'NO_SHOW_REDISPATCH' },
      { status: 'NO_SHOW_REDISPATCH' },
    );

    await detectNoShows(mockCtx);

    expect(dispatcherService.redispatch).toHaveBeenCalled();
    expect(fcmService.sendNoShowCreditPush).toHaveBeenCalled();
  });

  it('skips all steps when recovery detects both noShowRedispatchAt and noShowPushSentAt are set', async () => {
    const booking = makeAssignedBooking('bk-done', 45);
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([booking]);
    vi.mocked(customerCreditRepo.createCreditIfAbsent).mockResolvedValue(false);
    // Both steps already completed on prior run
    const completedDoc = {
      status: 'ASSIGNED',
      noShowRedispatchAt: '2026-04-26T05:00:00.000Z',
      noShowPushSentAt: '2026-04-26T05:00:01.000Z',
    };
    mockGetByIdSequence({ status: 'ASSIGNED' }, completedDoc, completedDoc);

    await detectNoShows(mockCtx);

    expect(updateBookingFields).not.toHaveBeenCalled();
    expect(dispatcherService.redispatch).not.toHaveBeenCalled();
    expect(fcmService.sendNoShowCreditPush).not.toHaveBeenCalled();
  });

  it('skips when replacement tech detected (different technicianId in recovery check)', async () => {
    const booking = makeAssignedBooking('bk-replaced', 45, { technicianId: 'tech-noshow' });
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([booking]);
    vi.mocked(customerCreditRepo.createCreditIfAbsent).mockResolvedValue(false);
    // call 1: fresh-read → ASSIGNED with noShowTechnicianId preserved
    // call 2: recovery check → ASSIGNED with a different (replacement) technicianId
    mockGetByIdSequence(
      { status: 'ASSIGNED', noShowTechnicianId: 'tech-noshow' },
      { status: 'ASSIGNED', technicianId: 'tech-replacement', noShowTechnicianId: 'tech-noshow' },
    );

    await detectNoShows(mockCtx);

    expect(updateBookingFields).not.toHaveBeenCalled();
    expect(dispatcherService.redispatch).not.toHaveBeenCalled();
    expect(fcmService.sendNoShowCreditPush).not.toHaveBeenCalled();
  });

  it('skips entirely when createCreditIfAbsent throws (cannot determine credit state)', async () => {
    const booking = makeAssignedBooking('bk-credit-err', 45);
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([booking]);
    vi.mocked(customerCreditRepo.createCreditIfAbsent).mockRejectedValue(new Error('cosmos 503'));

    await detectNoShows(mockCtx);

    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
    expect(updateBookingFields).not.toHaveBeenCalled();
    expect(dispatcherService.redispatch).not.toHaveBeenCalled();
    expect(fcmService.sendNoShowCreditPush).not.toHaveBeenCalled();
  });

  it('skips redispatch when status write fails; still sends FCM (push-check shows no stamp)', async () => {
    vi.mocked(bookingRepo.getAssignedBookingsBefore)
      .mockResolvedValue([makeAssignedBooking('bk-status-err', 45)]);
    vi.mocked(updateBookingFields).mockRejectedValue(new Error('cosmos 503'));
    // push-check shows no noShowPushSentAt → send push
    mockGetByIdSequence({ status: 'ASSIGNED' }, { status: 'ASSIGNED' });

    await expect(detectNoShows(mockCtx)).resolves.not.toThrow();

    expect(customerCreditRepo.createCreditIfAbsent).toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
    expect(dispatcherService.redispatch).not.toHaveBeenCalled();
    expect(fcmService.sendNoShowCreditPush).toHaveBeenCalled();
  });

  it('captures Sentry when redispatch throws; still sends FCM (credit issued, push not yet sent)', async () => {
    vi.mocked(bookingRepo.getAssignedBookingsBefore)
      .mockResolvedValue([makeAssignedBooking('bk-rdp-err', 45)]);
    vi.mocked(dispatcherService.redispatch).mockRejectedValue(new Error('no techs'));
    mockGetByIdSequence({ status: 'ASSIGNED' }, { status: 'NO_SHOW_REDISPATCH' });

    await detectNoShows(mockCtx);

    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
    expect(fcmService.sendNoShowCreditPush).toHaveBeenCalled();
  });

  it('skips FCM when push-check shows noShowPushSentAt already set (idempotent across recovery)', async () => {
    const booking = makeAssignedBooking('bk-push-done', 45);
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([booking]);
    vi.mocked(customerCreditRepo.createCreditIfAbsent).mockResolvedValue(false);
    // push-check returns a booking with noShowPushSentAt set — already notified
    mockGetByIdSequence(
      { status: 'NO_SHOW_REDISPATCH', noShowRedispatchAt: '2026-04-26T05:00:00.000Z' },
      { status: 'NO_SHOW_REDISPATCH', noShowRedispatchAt: '2026-04-26T05:00:00.000Z' },
      { status: 'NO_SHOW_REDISPATCH', noShowRedispatchAt: '2026-04-26T05:00:00.000Z', noShowPushSentAt: '2026-04-26T05:00:01.000Z' },
    );

    await detectNoShows(mockCtx);

    expect(fcmService.sendNoShowCreditPush).not.toHaveBeenCalled();
  });

  it('captures Sentry without rethrowing when sendNoShowCreditPush throws', async () => {
    vi.mocked(bookingRepo.getAssignedBookingsBefore)
      .mockResolvedValue([makeAssignedBooking('bk-fcm-err', 45)]);
    vi.mocked(fcmService.sendNoShowCreditPush).mockRejectedValue(new Error('FCM 503'));
    mockGetByIdSequence({ status: 'ASSIGNED' }, { status: 'NO_SHOW_REDISPATCH' });

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
    // bk-1: fresh-read → ASSIGNED (then credit throws → skip entirely)
    // bk-2: fresh-read → ASSIGNED, push-check → no stamp
    mockGetByIdSequence(
      { status: 'ASSIGNED' },              // bk-1 fresh-read
      { status: 'ASSIGNED' },              // bk-2 fresh-read
      { status: 'NO_SHOW_REDISPATCH' },    // bk-2 push-check
    );

    await detectNoShows(mockCtx);

    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
    // bk-1 skipped (credit threw), bk-2 proceeds
    expect(updateBookingFields).toHaveBeenCalledWith(
      'bk-2',
      expect.objectContaining({ status: 'NO_SHOW_REDISPATCH' }),
    );
    expect(dispatcherService.redispatch).toHaveBeenCalledWith('bk-2', 15, undefined);
    expect(fcmService.sendNoShowCreditPush).toHaveBeenCalled();
  });
});
