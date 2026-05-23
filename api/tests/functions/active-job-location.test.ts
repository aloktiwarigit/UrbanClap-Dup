import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest, InvocationContext, type HttpResponseInit } from '@azure/functions';

vi.mock('@sentry/node', () => ({
  captureMessage: vi.fn(),
  withScope: vi.fn((cb: (scope: { setLevel: (l: string) => void; setExtras: (e: Record<string, unknown>) => void }) => void) => {
    cb({ setLevel: vi.fn(), setExtras: vi.fn() });
  }),
}));

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: vi.fn() },
}));

vi.mock('../../src/cosmos/live-location-repository.js', () => ({
  liveLocationRepo: { upsert: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../src/services/fcm.service.js', () => ({
  sendPeriodicLocationPush: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/services/featureFlags.service.js', () => ({
  isPeriodicLocationEnabled: vi.fn().mockResolvedValue(true),
}));

// consume: allow by default; individual tests override for the 429 case
vi.mock('../../src/cosmos/rate-limit-repository.js', () => ({
  consume: vi.fn().mockResolvedValue({ allowed: true }),
}));

type MockFn = ReturnType<typeof vi.fn>;

const NOW = Date.now();
const FRESH_CAPTURED_AT = NOW - 5_000; // 5s ago — within 90s staleness window

const aBooking = (status = 'EN_ROUTE') => ({
  id: 'bk-1', customerId: 'c-1', technicianId: 'tech-1',
  serviceId: 'svc-1', categoryId: 'cat-1', status,
  slotDate: '2026-05-01', slotWindow: '10:00-12:00',
  addressText: '12 Main St', addressLatLng: { lat: 12.9, lng: 77.6 },
  paymentOrderId: 'o-1', paymentId: null, paymentSignature: null,
  amount: 50000, createdAt: new Date().toISOString(),
});

function makeReq(bookingId: string, body: unknown): HttpRequest {
  const req = new HttpRequest({
    url: `http://localhost/api/v1/technicians/active-job/${bookingId}/location`,
    method: 'POST',
    headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' },
    body: { string: JSON.stringify(body) },
  });
  Object.assign(req, { params: { bookingId } });
  return req;
}

const validBody = {
  lat: 28.5,
  lng: 77.1,
  accuracyMeters: 10,
  capturedAt: FRESH_CAPTURED_AT,
};

describe('POST /v1/technicians/active-job/:bookingId/location', () => {
  let innerHandler: typeof import('../../src/functions/active-job-location.js').activeJobLocationHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    // Re-mock after resetModules
    vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
      verifyTechnicianToken: vi.fn(),
    }));
    vi.mock('../../src/cosmos/booking-repository.js', () => ({
      bookingRepo: { getById: vi.fn() },
    }));
    vi.mock('../../src/cosmos/live-location-repository.js', () => ({
      liveLocationRepo: { upsert: vi.fn().mockResolvedValue(undefined) },
    }));
    vi.mock('../../src/services/fcm.service.js', () => ({
      sendPeriodicLocationPush: vi.fn().mockResolvedValue(undefined),
    }));
    vi.mock('../../src/services/featureFlags.service.js', () => ({
      isPeriodicLocationEnabled: vi.fn().mockResolvedValue(true),
    }));
    vi.mock('../../src/cosmos/rate-limit-repository.js', () => ({
      consume: vi.fn().mockResolvedValue({ allowed: true }),
    }));
    vi.mock('@sentry/node', () => ({
      captureMessage: vi.fn(),
      withScope: vi.fn((cb: (scope: { setLevel: (l: string) => void; setExtras: (e: Record<string, unknown>) => void }) => void) => {
        cb({ setLevel: vi.fn(), setExtras: vi.fn() });
      }),
    }));
    const mod = await import('../../src/functions/active-job-location.js');
    innerHandler = mod.activeJobLocationHandler;
  });

  it('returns 401 for missing/invalid JWT', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    (verifyTechnicianToken as MockFn).mockRejectedValue(new Error('invalid'));

    const res = await innerHandler(makeReq('bk-1', validBody), new InvocationContext()) as HttpResponseInit;
    expect(res.status).toBe(401);
    expect((res.jsonBody as { code: string }).code).toBe('UNAUTHORIZED');
  });

  it('returns 404 when booking not found', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(null);

    const res = await innerHandler(makeReq('bk-1', validBody), new InvocationContext()) as HttpResponseInit;
    expect(res.status).toBe(404);
  });

  it('returns 403 when booking.technicianId !== caller uid', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-99' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking());

    const res = await innerHandler(makeReq('bk-1', validBody), new InvocationContext()) as HttpResponseInit;
    expect(res.status).toBe(403);
    expect((res.jsonBody as { code: string }).code).toBe('FORBIDDEN');
  });

  it('returns 409 BOOKING_NOT_ACTIVE for booking in ASSIGNED status', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('ASSIGNED'));

    const res = await innerHandler(makeReq('bk-1', validBody), new InvocationContext()) as HttpResponseInit;
    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('BOOKING_NOT_ACTIVE');
  });

  it('returns 409 BOOKING_NOT_ACTIVE for booking in COMPLETED status', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('COMPLETED'));

    const res = await innerHandler(makeReq('bk-1', validBody), new InvocationContext()) as HttpResponseInit;
    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('BOOKING_NOT_ACTIVE');
  });

  it('returns 400 VALIDATION_ERROR for lat=91', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking());

    const res = await innerHandler(makeReq('bk-1', { ...validBody, lat: 91 }), new InvocationContext()) as HttpResponseInit;
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 STALE_FIX for capturedAt older than 90s', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking());

    const staleBody = { ...validBody, capturedAt: Date.now() - 91_000 };
    const res = await innerHandler(makeReq('bk-1', staleBody), new InvocationContext()) as HttpResponseInit;
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('STALE_FIX');
  });

  it('returns 429 when rate limit exceeded (keyed by uid+bookingId after auth)', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    const { consume } = await import('../../src/cosmos/rate-limit-repository.js');
    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking());
    (consume as MockFn).mockResolvedValueOnce({ allowed: false, retryAfterMs: 8000 });

    const res = await innerHandler(makeReq('bk-1', validBody), new InvocationContext()) as HttpResponseInit;
    expect(res.status).toBe(429);
    expect((res.jsonBody as { code: string }).code).toBe('RATE_LIMITED');
    // rate-limit key must include the authenticated uid, not just the bookingId
    expect(consume).toHaveBeenCalledWith(expect.stringContaining('tech-1'), expect.any(Number), expect.any(Number));
  });

  it('returns 204, upserts to Cosmos, and calls sendPeriodicLocationPush when flag=on', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    const { liveLocationRepo } = await import('../../src/cosmos/live-location-repository.js');
    const { sendPeriodicLocationPush } = await import('../../src/services/fcm.service.js');
    const { isPeriodicLocationEnabled } = await import('../../src/services/featureFlags.service.js');
    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking());
    (isPeriodicLocationEnabled as MockFn).mockResolvedValue(true);

    const res = await innerHandler(makeReq('bk-1', validBody), new InvocationContext()) as HttpResponseInit;
    expect(res.status).toBe(204);
    expect(liveLocationRepo.upsert).toHaveBeenCalledOnce();
    expect(sendPeriodicLocationPush).toHaveBeenCalledOnce();
    expect(sendPeriodicLocationPush).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'c-1',
      bookingId: 'bk-1',
      lat: validBody.lat,
      lng: validBody.lng,
    }));
  });

  it('returns 204 and upserts Cosmos but skips FCM when flag=off', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    const { liveLocationRepo } = await import('../../src/cosmos/live-location-repository.js');
    const { sendPeriodicLocationPush } = await import('../../src/services/fcm.service.js');
    const { isPeriodicLocationEnabled } = await import('../../src/services/featureFlags.service.js');
    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking());
    (isPeriodicLocationEnabled as MockFn).mockResolvedValue(false);

    const res = await innerHandler(makeReq('bk-1', validBody), new InvocationContext()) as HttpResponseInit;
    expect(res.status).toBe(204);
    expect(liveLocationRepo.upsert).toHaveBeenCalledOnce();
    expect(sendPeriodicLocationPush).not.toHaveBeenCalled();
  });

  it('returns 204 even when FCM publish throws (logged, not propagated)', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    const { sendPeriodicLocationPush } = await import('../../src/services/fcm.service.js');
    const { isPeriodicLocationEnabled } = await import('../../src/services/featureFlags.service.js');
    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking());
    (isPeriodicLocationEnabled as MockFn).mockResolvedValue(true);
    (sendPeriodicLocationPush as MockFn).mockRejectedValue(new Error('FCM down'));

    const ctx = new InvocationContext();
    vi.spyOn(ctx, 'error').mockImplementation(() => {});
    const res = await innerHandler(makeReq('bk-1', validBody), ctx) as HttpResponseInit;
    expect(res.status).toBe(204);
  });
});
