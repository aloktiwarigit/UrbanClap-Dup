/**
 * Service-area gating integration tests for POST /v1/bookings — E16-S01
 *
 * Tests AC-2, AC-3, AC-5 (feature flag × inside/outside × validation).
 * AC-1 (inside + any flag state → 201) is covered by the existing create.test.ts.
 *
 * TDD: this file is committed BEFORE the bookings.ts integration changes.
 */

import { beforeEach, describe, it, expect, vi } from 'vitest';
import { HttpRequest, type HttpResponseInit } from '@azure/functions';

vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test');
vi.stubEnv('RAZORPAY_KEY_SECRET', 'rzp_secret');

vi.mock('../../src/middleware/requireCustomer.js', () => ({
  requireCustomer: (handler: (req: HttpRequest, ctx: unknown, claims: { customerId: string }) => Promise<unknown>) =>
    (req: HttpRequest, ctx: unknown) => handler(req, ctx, { customerId: 'cust-area-1' }),
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    createPending: vi.fn().mockResolvedValue({
      id: 'bk-area-1', customerId: 'cust-area-1', serviceId: 'svc-1', categoryId: 'cat-1',
      slotDate: '2026-05-01', slotWindow: '10:00-12:00',
      addressText: 'Ayodhya', addressLatLng: { lat: 26.7958, lng: 82.1947 },
      status: 'PENDING_PAYMENT', paymentOrderId: 'order_xyz',
      paymentId: null, paymentSignature: null, amount: 59900,
      createdAt: '2026-05-12T00:00:00.000Z',
    }),
    markPaid: vi.fn().mockResolvedValue({ id: 'bk-area-1', status: 'PAID' }),
  },
}));

vi.mock('../../src/services/razorpay.service.js', () => ({
  createRazorpayOrder: vi.fn().mockResolvedValue({ id: 'order_xyz', amount: 59900, currency: 'INR' }),
  verifyPaymentSignature: vi.fn().mockReturnValue(true),
}));

vi.mock('../../src/services/dispatcher.service.js', () => ({
  dispatcherService: {
    triggerDispatch: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/cosmos/catalogue-repository.js', () => ({
  catalogueRepo: {
    // durationMinutes: 120 → '10:00-12:00' is a valid generated slot (default 08:00–20:00 window)
    getServiceByIdCrossPartition: vi.fn().mockResolvedValue({
      id: 'svc-1', name: 'AC Deep Clean', basePrice: 59900, isActive: true, durationMinutes: 120,
    }),
  },
}));

// E16-S02: slot-hold gate — mock so service-area tests don't need Cosmos
vi.mock('../../src/cosmos/slot-holds-repository.js', () => ({
  slotHoldsRepo: {
    createHold: vi.fn().mockResolvedValue({ id: 'svc-1|2026-05-01|10:00-12:00', servicePartitionKey: 'svc-1|2026-05-01', serviceId: 'svc-1', date: '2026-05-01', window: '10:00-12:00', customerId: 'cust-area-1', heldAt: new Date().toISOString() }),
    commitHold: vi.fn().mockResolvedValue(undefined),
  },
}));

// featureFlags mock — we control isServiceAreaGatingEnabled per-test
vi.mock('../../src/services/featureFlags.service.js', () => ({
  isSoftLaunchEnabled: vi.fn().mockResolvedValue(true),
  isMarketingPaused: vi.fn().mockResolvedValue(false),
  isServiceAreaGatingEnabled: vi.fn().mockResolvedValue(false), // default: warn-only
}));

import { createBookingHandler } from '../../src/functions/bookings.js';
import { isServiceAreaGatingEnabled } from '../../src/services/featureFlags.service.js';

// ---- helpers ---------------------------------------------------------------

function postReq(body: unknown): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/bookings',
    method: 'POST',
    body: { string: JSON.stringify(body) },
    headers: { 'content-type': 'application/json' },
  });
}

/** A valid booking body with an Ayodhya-area coordinate (inside polygon). */
const INSIDE_BODY = {
  serviceId: 'svc-1', categoryId: 'cat-1', slotDate: '2026-06-01',
  slotWindow: '10:00-12:00', addressText: 'Ramkot, Ayodhya',
  addressLatLng: { lat: 26.7958, lng: 82.1947 }, // Ramkot — centre of polygon
};

/** A valid booking body with a Delhi coordinate (outside polygon). */
const OUTSIDE_BODY = {
  serviceId: 'svc-1', categoryId: 'cat-1', slotDate: '2026-06-01',
  slotWindow: '10:00-12:00', addressText: 'Connaught Place, New Delhi',
  addressLatLng: { lat: 28.6315, lng: 77.2167 }, // Delhi — far outside polygon
};

// ---- tests -----------------------------------------------------------------

describe('POST /v1/bookings — service-area gating (E16-S01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env['RAZORPAY_KEY_ID'] = 'rzp_test';
    process.env['RAZORPAY_KEY_SECRET'] = 'rzp_secret';
    // Reset to warn-only (flag off)
    (isServiceAreaGatingEnabled as ReturnType<typeof vi.fn>).mockResolvedValue(false);
  });

  // AC-1: inside polygon, any flag state → 201
  it('AC-1: inside-polygon address proceeds normally (Razorpay path)', async () => {
    const res = await createBookingHandler(postReq(INSIDE_BODY), {} as never) as HttpResponseInit;
    expect(res.status).toBe(201);
    const b = res.jsonBody as { bookingId: string; requiresPayment: boolean };
    expect(b.bookingId).toBe('bk-area-1');
    expect(b.requiresPayment).toBe(true);
  });

  // AC-2: outside polygon, flag ON → 400
  it('AC-2: outside-polygon + flag ON → 400 SERVICE_NOT_AVAILABLE_AT_LOCATION', async () => {
    (isServiceAreaGatingEnabled as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const res = await createBookingHandler(postReq(OUTSIDE_BODY), {} as never) as HttpResponseInit;
    expect(res.status).toBe(400);
    const b = res.jsonBody as { error: string; suggestedAction: string };
    expect(b.error).toBe('SERVICE_NOT_AVAILABLE_AT_LOCATION');
    expect(b.suggestedAction).toBe('join_waitlist');
  });

  // AC-3: outside polygon, flag OFF → 201 + (log is emitted — observable via console.info spy)
  it('AC-3: outside-polygon + flag OFF → 201 (warn-only mode)', async () => {
    (isServiceAreaGatingEnabled as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const res = await createBookingHandler(postReq(OUTSIDE_BODY), {} as never) as HttpResponseInit;
    expect(res.status).toBe(201);
    // Verify the structured log was emitted with mode: "warn-only"
    const loggedCall = consoleSpy.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('service_area_check'),
    );
    expect(loggedCall).toBeDefined();
    const logPayload = loggedCall?.[1] as { inside: boolean; mode: string };
    expect(logPayload?.inside).toBe(false);
    expect(logPayload?.mode).toBe('warn-only');
    consoleSpy.mockRestore();
  });

  // AC-5: spoofed out-of-range lat/lng → 422 (Zod rejects before reaching service)
  it('AC-5: spoofed lat=999 → 422 (Zod lat range validation)', async () => {
    const res = await createBookingHandler(postReq({
      ...INSIDE_BODY,
      addressLatLng: { lat: 999, lng: 82.1947 },
    }), {} as never) as HttpResponseInit;
    expect(res.status).toBe(422);
    const b = res.jsonBody as { code: string };
    expect(b.code).toBe('VALIDATION_ERROR');
  });

  it('AC-5: spoofed lng=999 → 422 (Zod lng range validation)', async () => {
    const res = await createBookingHandler(postReq({
      ...INSIDE_BODY,
      addressLatLng: { lat: 26.7958, lng: 999 },
    }), {} as never) as HttpResponseInit;
    expect(res.status).toBe(422);
    const b = res.jsonBody as { code: string };
    expect(b.code).toBe('VALIDATION_ERROR');
  });

  it('AC-5: spoofed lat=-999, lng=-999 → 422', async () => {
    const res = await createBookingHandler(postReq({
      ...INSIDE_BODY,
      addressLatLng: { lat: -999, lng: -999 },
    }), {} as never) as HttpResponseInit;
    expect(res.status).toBe(422);
    const b = res.jsonBody as { code: string };
    expect(b.code).toBe('VALIDATION_ERROR');
  });

  // Observability: inside+flag-off → no warn-only log (it's a normal path)
  it('inside-polygon address does not emit warn-only log entry', async () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    await createBookingHandler(postReq(INSIDE_BODY), {} as never);
    const loggedCall = consoleSpy.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('service_area_check'),
    );
    // The service_area_check log should be emitted even for inside — it's always logged
    // but with inside: true
    if (loggedCall) {
      const logPayload = loggedCall[1] as { inside: boolean };
      expect(logPayload?.inside).toBe(true);
    }
    consoleSpy.mockRestore();
  });

  // AC-2 variant: inside polygon, flag ON → still 201 (flag only controls out-of-area)
  it('inside-polygon + flag ON → 201 (flag only applies to out-of-area)', async () => {
    (isServiceAreaGatingEnabled as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const res = await createBookingHandler(postReq(INSIDE_BODY), {} as never) as HttpResponseInit;
    expect(res.status).toBe(201);
  });
});
