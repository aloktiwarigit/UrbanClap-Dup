import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock module declarations (must precede imports) ───────────────────────────

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: vi.fn() },
  updateBookingFields: vi.fn(),
}));

vi.mock('../../src/cosmos/technician-repository.js', () => ({
  getTechniciansWithinRadius: vi.fn(),
}));

vi.mock('firebase-admin/messaging', () => ({
  getMessaging: vi.fn(),
}));

vi.mock('../../src/cosmos/client.js', () => ({
  getDispatchAttemptsContainer: vi.fn(),
  DB_NAME: 'homeservices',
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { dispatcherService, rankTechnicians } from '../../src/services/dispatcher.service.js';
import { bookingRepo, updateBookingFields } from '../../src/cosmos/booking-repository.js';
import { getTechniciansWithinRadius } from '../../src/cosmos/technician-repository.js';
import { getMessaging } from 'firebase-admin/messaging';
import { getDispatchAttemptsContainer } from '../../src/cosmos/client.js';
import type { BookingDoc } from '../../src/schemas/booking.js';
import type { TechnicianProfile } from '../../src/schemas/technician.js';

// ── Test fixtures ─────────────────────────────────────────────────────────────

const BASE_BOOKING: BookingDoc = {
  id: 'bk-1',
  customerId: 'cust-1',
  serviceId: 'svc-plumbing',
  categoryId: 'cat-home',
  slotDate: '2026-04-25',
  slotWindow: '10:00-12:00',
  addressText: '100 MG Road, Bangalore',
  addressLatLng: { lat: 12.9716, lng: 77.5946 },
  status: 'PAID',
  paymentOrderId: 'order_abc',
  paymentId: 'pay_abc',
  paymentSignature: 'sig_abc',
  amount: 59900,
  createdAt: '2026-04-23T10:00:00.000Z',
};

function makeTech(id: string, lngOffset: number, rating?: number): TechnicianProfile {
  return {
    id,
    technicianId: id,
    location: { type: 'Point', coordinates: [77.5946 + lngOffset, 12.9716] }, // [lng, lat]
    skills: ['svc-plumbing'],
    availabilityWindows: [],
    isOnline: true,
    isAvailable: true,
    kycStatus: 'APPROVED',
    fcmToken: `fcm-token-${id}`,
    rating,
  };
}

function makeDispatchContainer() {
  return { items: { create: vi.fn().mockResolvedValue({}) } };
}

function makeMessaging() {
  return { send: vi.fn().mockResolvedValue('msg-id') };
}

// ── rankTechnicians ───────────────────────────────────────────────────────────

describe('rankTechnicians', () => {
  const bookingLat = 12.9716;
  const bookingLng = 77.5946;

  it('sorts by distance ASC', () => {
    const techs = [
      makeTech('far', 0.5),    // ~55 km east
      makeTech('mid', 0.1),    // ~11 km east
      makeTech('near', 0.02),  // ~2 km east
    ];
    const ranked = rankTechnicians(techs, bookingLat, bookingLng);
    expect(ranked.map((t) => t.id)).toEqual(['near', 'mid', 'far']);
  });

  it('breaks ties by rating DESC', () => {
    const techs = [
      makeTech('same-dist-low', 0.1, 3.0),
      makeTech('same-dist-high', 0.1, 4.5),
    ];
    const ranked = rankTechnicians(techs, bookingLat, bookingLng);
    expect(ranked[0]!.id).toBe('same-dist-high');
  });

  it('treats undefined rating as 0 for tie-breaking', () => {
    const techs = [
      makeTech('rated', 0.1, 4.0),
      makeTech('unrated', 0.1, undefined),
    ];
    const ranked = rankTechnicians(techs, bookingLat, bookingLng);
    expect(ranked[0]!.id).toBe('rated');
  });
});

// ── dispatcherService.triggerDispatch ─────────────────────────────────────────

describe('dispatcherService.triggerDispatch', () => {
  let dispatchContainer: ReturnType<typeof makeDispatchContainer>;
  let messaging: ReturnType<typeof makeMessaging>;

  beforeEach(() => {
    vi.clearAllMocks();
    dispatchContainer = makeDispatchContainer();
    messaging = makeMessaging();
    vi.mocked(getDispatchAttemptsContainer).mockReturnValue(dispatchContainer as any);
    vi.mocked(getMessaging).mockReturnValue(messaging as any);
    vi.mocked(updateBookingFields).mockResolvedValue(null);
  });

  it('skips when booking status is not PAID', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue({ ...BASE_BOOKING, status: 'SEARCHING' });
    await dispatcherService.triggerDispatch('bk-1');
    expect(getTechniciansWithinRadius).not.toHaveBeenCalled();
    expect(dispatchContainer.items.create).not.toHaveBeenCalled();
  });

  it('skips when booking not found', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue(null);
    await dispatcherService.triggerDispatch('bk-1');
    expect(getTechniciansWithinRadius).not.toHaveBeenCalled();
  });

  it('marks booking UNFULFILLED when 0 technicians found', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue(BASE_BOOKING);
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([]);
    vi.mocked(updateBookingFields).mockResolvedValue({ ...BASE_BOOKING, status: 'UNFULFILLED' });

    await dispatcherService.triggerDispatch('bk-1');

    expect(updateBookingFields).toHaveBeenCalledWith('bk-1', { status: 'UNFULFILLED' });
    expect(dispatchContainer.items.create).not.toHaveBeenCalled();
    expect(messaging.send).not.toHaveBeenCalled();
  });

  it('creates dispatch attempt and sends FCM to all found techs (1 tech)', async () => {
    const tech = makeTech('t1', 0.05);
    vi.mocked(bookingRepo.getById).mockResolvedValue(BASE_BOOKING);
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([tech]);

    await dispatcherService.triggerDispatch('bk-1');

    expect(dispatchContainer.items.create).toHaveBeenCalledOnce();
    const created = vi.mocked(dispatchContainer.items.create).mock.calls[0]![0] as any;
    expect(created.bookingId).toBe('bk-1');
    expect(created.technicianIds).toEqual(['t1']);
    expect(created.status).toBe('PENDING');

    expect(messaging.send).toHaveBeenCalledOnce();
    const msg = vi.mocked(messaging.send).mock.calls[0]![0] as any;
    expect(msg.token).toBe('fcm-token-t1');
    expect(msg.data.type).toBe('JOB_OFFER');
    expect(msg.data.bookingId).toBe('bk-1');
  });

  it('caps dispatch at top 3 techs and sends FCM to each', async () => {
    const techs = [
      makeTech('t1', 0.01),
      makeTech('t2', 0.02),
      makeTech('t3', 0.03),
      makeTech('t4', 0.04),
    ];
    vi.mocked(bookingRepo.getById).mockResolvedValue(BASE_BOOKING);
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue(techs);

    await dispatcherService.triggerDispatch('bk-1');

    const created = vi.mocked(dispatchContainer.items.create).mock.calls[0]![0] as any;
    expect(created.technicianIds).toHaveLength(3);
    expect(messaging.send).toHaveBeenCalledTimes(3);
  });

  it('sets expiresAt to sentAt + 30 seconds', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue(BASE_BOOKING);
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([makeTech('t1', 0.05)]);

    const before = Date.now();
    await dispatcherService.triggerDispatch('bk-1');
    const after = Date.now();

    const created = vi.mocked(dispatchContainer.items.create).mock.calls[0]![0] as any;
    const sentAt = new Date(created.sentAt).getTime();
    const expiresAt = new Date(created.expiresAt).getTime();

    expect(sentAt).toBeGreaterThanOrEqual(before);
    expect(sentAt).toBeLessThanOrEqual(after);
    expect(expiresAt - sentAt).toBe(30_000);

    // expiresAt also propagated to FCM payload
    const msg = vi.mocked(messaging.send).mock.calls[0]![0] as any;
    expect(msg.data.expiresAt).toBe(created.expiresAt);
  });

  it('skips FCM for techs without fcmToken', async () => {
    const noToken = { ...makeTech('t1', 0.05), fcmToken: undefined };
    vi.mocked(bookingRepo.getById).mockResolvedValue(BASE_BOOKING);
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([noToken]);

    await dispatcherService.triggerDispatch('bk-1');

    expect(dispatchContainer.items.create).toHaveBeenCalledOnce(); // attempt still created
    expect(messaging.send).not.toHaveBeenCalled();
  });

  it('queries technicians using booking lat/lng and serviceId', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue(BASE_BOOKING);
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([]);

    await dispatcherService.triggerDispatch('bk-1');

    expect(getTechniciansWithinRadius).toHaveBeenCalledWith(
      12.9716, 77.5946, 10, 'svc-plumbing',
    );
  });

  it('filters out bounding-box corner techs beyond the actual radius', async () => {
    // A tech at +0.09 lat AND +0.09 lng offset is ~14 km away (diagonal > 10 km)
    const cornerTech: TechnicianProfile = {
      id: 'corner',
      technicianId: 'corner',
      location: { type: 'Point', coordinates: [77.5946 + 0.09, 12.9716 + 0.09] },
      skills: ['svc-plumbing'],
      availabilityWindows: [],
      isOnline: true,
      isAvailable: true,
      kycStatus: 'APPROVED',
      fcmToken: 'fcm-corner',
    };
    vi.mocked(bookingRepo.getById).mockResolvedValue(BASE_BOOKING);
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([cornerTech]);

    await dispatcherService.triggerDispatch('bk-1');

    // Corner tech is >10km away — dispatch should treat it as no techs available
    expect(updateBookingFields).toHaveBeenCalledWith('bk-1', { status: 'UNFULFILLED' });
    expect(dispatchContainer.items.create).not.toHaveBeenCalled();
  });

  it('transitions booking to SEARCHING after successful dispatch', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue(BASE_BOOKING);
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([makeTech('t1', 0.05)]);

    await dispatcherService.triggerDispatch('bk-1');

    expect(updateBookingFields).toHaveBeenCalledWith('bk-1', { status: 'SEARCHING' });
  });
});

// ── dispatcherService.redispatch ──────────────────────────────────────────────

describe('dispatcherService.redispatch', () => {
  let dispatchContainer: ReturnType<typeof makeDispatchContainer>;
  let messaging: ReturnType<typeof makeMessaging>;

  beforeEach(() => {
    vi.clearAllMocks();
    dispatchContainer = makeDispatchContainer();
    messaging = makeMessaging();
    vi.mocked(getDispatchAttemptsContainer).mockReturnValue(dispatchContainer as any);
    vi.mocked(getMessaging).mockReturnValue(messaging as any);
    vi.mocked(updateBookingFields).mockResolvedValue(null);
  });

  it('dispatches when booking is in NO_SHOW_REDISPATCH status (bypasses PAID guard)', async () => {
    const noShowBooking = { ...BASE_BOOKING, status: 'NO_SHOW_REDISPATCH' as const };
    vi.mocked(bookingRepo.getById).mockResolvedValue(noShowBooking);
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([makeTech('t1', 0.05)]);

    await dispatcherService.redispatch('bk-1', 15);

    expect(getTechniciansWithinRadius).toHaveBeenCalledWith(
      noShowBooking.addressLatLng.lat,
      noShowBooking.addressLatLng.lng,
      15,
      noShowBooking.serviceId,
    );
    expect(dispatchContainer.items.create).toHaveBeenCalledOnce();
  });

  it('does nothing when booking not found', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue(null);
    await dispatcherService.redispatch('missing', 15);
    expect(getTechniciansWithinRadius).not.toHaveBeenCalled();
  });

  it('marks booking UNFULFILLED when no techs found in expanded radius', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue({
      ...BASE_BOOKING,
      status: 'NO_SHOW_REDISPATCH' as const,
    });
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([]);

    await dispatcherService.redispatch('bk-1', 15);

    expect(updateBookingFields).toHaveBeenCalledWith('bk-1', { status: 'UNFULFILLED' });
  });

  it('uses the radiusKm parameter passed in, not the default 10km', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue({
      ...BASE_BOOKING,
      status: 'NO_SHOW_REDISPATCH' as const,
    });
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([makeTech('t1', 0.05)]);

    await dispatcherService.redispatch('bk-1', 15);

    expect(getTechniciansWithinRadius).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      15,
      expect.any(String),
    );
  });
});
