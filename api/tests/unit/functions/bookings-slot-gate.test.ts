/**
 * E16-S02 — Unit tests for the slot-hold gate inserted in POST /v1/bookings (createHandler).
 *
 * Tests the three new behaviors:
 *   1. createHold returns hold doc → booking proceeds normally
 *   2. createHold returns 'CONFLICT' → 409 SLOT_UNAVAILABLE
 *   3. slotWindow not in generated slots → 422 INVALID_SLOT_WINDOW
 *   4. commitHold rejects → Sentry captures; booking response still returned
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import type { SlotHoldDoc } from '../../../src/schemas/slot-hold.js';

// ---------------------------------------------------------------------------
// Mocks — vi.hoisted() required for variables used inside vi.mock() factories
// ---------------------------------------------------------------------------

const { mockCreateHold, mockCommitHold } = vi.hoisted(() => ({
  mockCreateHold: vi.fn(),
  mockCommitHold: vi.fn(),
}));

vi.mock('../../../src/cosmos/slot-holds-repository.js', () => ({
  slotHoldsRepo: { createHold: mockCreateHold, commitHold: mockCommitHold },
}));

vi.mock('../../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn().mockResolvedValue({ uid: 'cust-1', phone_number: '+919999999999' }),
}));

vi.mock('../../../src/cosmos/catalogue-repository.js', () => ({
  catalogueRepo: { getServiceByIdCrossPartition: vi.fn() },
}));

vi.mock('../../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    createPending: vi.fn(),
    markPaid: vi.fn(),
    // Called before createHold to guard against pre-deployment booking gaps (P1 Codex fix)
    getBookedWindowsByServiceDate: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../src/services/razorpay.service.js', () => ({
  createRazorpayOrder: vi.fn(),
  verifyPaymentSignature: vi.fn(),
}));

vi.mock('../../../src/services/featureFlags.service.js', () => ({
  isSoftLaunchEnabled: vi.fn().mockResolvedValue(true),
  isMarketingPaused: vi.fn().mockResolvedValue(false),
  isServiceAreaGatingEnabled: vi.fn().mockResolvedValue(false),
  isWalletCreditEnabled: vi.fn().mockResolvedValue(false),
}));

vi.mock('../../../src/services/dispatcher.service.js', () => ({
  dispatcherService: { triggerDispatch: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../../src/cosmos/audit-log-repository.js', () => ({
  appendAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/cosmos/customer-credit-ledger-repository.js', () => ({
  customerCreditLedgerRepo: { getBalance: vi.fn().mockResolvedValue({ balanceInPaise: 0 }) },
}));

vi.mock('../../../src/observability/posthog.js', () => ({
  posthog: { capture: vi.fn() },
}));

vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { createBookingHandler } from '../../../src/functions/bookings.js';
import { catalogueRepo } from '../../../src/cosmos/catalogue-repository.js';
import { bookingRepo } from '../../../src/cosmos/booking-repository.js';
import * as Sentry from '@sentry/node';
import type { Service } from '../../../src/schemas/service.js';
import type { BookingDoc } from '../../../src/schemas/booking.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ctx = { log: vi.fn(), error: vi.fn(), info: vi.fn() } as unknown as InvocationContext;

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: 'svc-ac',
    categoryId: 'cat-1',
    name: 'AC Deep Clean',
    shortDescription: 'Deep clean',
    heroImageUrl: 'https://example.com/img.jpg',
    basePrice: 59900,
    commissionBps: 2000,
    durationMinutes: 60,
    includes: [],
    faq: [],
    addOns: [],
    photoStages: [],
    isActive: true,
    updatedBy: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    workStart: '10:00',
    workEnd: '11:00', // single slot: 10:00-11:00
    ...overrides,
  };
}

function makeBooking(): BookingDoc {
  return {
    id: 'bk-1',
    customerId: 'cust-1',
    serviceId: 'svc-ac',
    categoryId: 'cat-1',
    slotDate: '2026-05-20',
    slotWindow: '10:00-11:00',
    addressText: '1 Main St',
    addressLatLng: { lat: 26.79, lng: 82.19 },
    status: 'PENDING_PAYMENT',
    paymentOrderId: 'cash_abc',
    paymentMethod: 'CASH_ON_SERVICE',
    paymentId: null,
    paymentSignature: null,
    amount: 59900,
    createdAt: '2026-05-20T04:30:00.000Z',
  };
}

function makeHold(): SlotHoldDoc {
  return {
    id: 'svc-ac|2026-05-20|10:00-11:00',
    servicePartitionKey: 'svc-ac|2026-05-20',
    serviceId: 'svc-ac',
    date: '2026-05-20',
    window: '10:00-11:00',
    customerId: 'cust-1',
    heldAt: new Date().toISOString(),
  };
}

function makeReq(body: object): HttpRequest {
  return {
    json: vi.fn().mockResolvedValue(body),
    headers: { get: (h: string) => h.toLowerCase() === 'authorization' ? 'Bearer token' : null },
    params: {},
  } as unknown as HttpRequest;
}

const VALID_BODY = {
  serviceId: 'svc-ac',
  categoryId: 'cat-1',
  slotDate: '2026-05-20',
  slotWindow: '10:00-11:00',
  addressText: '1 Main St',
  addressLatLng: { lat: 26.79, lng: 82.19 },
  paymentMethod: 'CASH_ON_SERVICE',
  applyCredit: false,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue(makeService());
  vi.mocked(bookingRepo.createPending).mockResolvedValue(makeBooking());
  vi.mocked(bookingRepo.markPaid).mockResolvedValue(makeBooking());
  // Reset to empty so the existing-bookings gate doesn't block subsequent tests
  vi.mocked(bookingRepo.getBookedWindowsByServiceDate).mockResolvedValue([]);
  mockCommitHold.mockResolvedValue(undefined);
});

describe('E16-S02: slot-hold gate in POST /v1/bookings', () => {
  it('proceeds normally when createHold returns a hold doc', async () => {
    mockCreateHold.mockResolvedValue(makeHold());

    const res = await createBookingHandler(makeReq(VALID_BODY), ctx);

    expect(res.status).toBe(201);
    expect(mockCreateHold).toHaveBeenCalledOnce();
    expect(mockCreateHold).toHaveBeenCalledWith('svc-ac', '2026-05-20', '10:00-11:00', 'cust-1');
  });

  it('returns 409 SLOT_UNAVAILABLE when createHold returns CONFLICT', async () => {
    mockCreateHold.mockResolvedValue('CONFLICT');

    const res = await createBookingHandler(makeReq(VALID_BODY), ctx);

    expect(res.status).toBe(409);
    expect(((res as unknown as HttpResponseInit).jsonBody as { code: string }).code).toBe('SLOT_UNAVAILABLE');
    expect(bookingRepo.createPending).not.toHaveBeenCalled();
  });

  it('returns 422 INVALID_SLOT_WINDOW when slotWindow is not in generated slots', async () => {
    // Service window is 10:00-11:00 (1 slot); request a fabricated window
    const body = { ...VALID_BODY, slotWindow: '99:00-00:00' };

    const res = await createBookingHandler(makeReq(body), ctx);

    expect(res.status).toBe(422);
    expect(((res as unknown as HttpResponseInit).jsonBody as { code: string }).code).toBe('INVALID_SLOT_WINDOW');
    expect(mockCreateHold).not.toHaveBeenCalled();
  });

  it('returns 201 and captures Sentry error when commitHold rejects (non-fatal)', async () => {
    mockCreateHold.mockResolvedValue(makeHold());
    mockCommitHold.mockRejectedValue(new Error('Cosmos timeout'));

    const res = await createBookingHandler(makeReq(VALID_BODY), ctx);

    // Booking still succeeds
    expect(res.status).toBe(201);
    // Wait for the non-blocking commitHold promise to settle
    await new Promise((r) => setTimeout(r, 10));
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it('returns 409 SLOT_UNAVAILABLE when an existing booking already occupies the window', async () => {
    // Pre-deployment gap: booking exists but no hold doc (hold container newly deployed)
    vi.mocked(bookingRepo.getBookedWindowsByServiceDate).mockResolvedValue(['10:00-11:00']);

    const res = await createBookingHandler(makeReq(VALID_BODY), ctx);

    expect(res.status).toBe(409);
    expect(((res as unknown as HttpResponseInit).jsonBody as { code: string }).code).toBe('SLOT_UNAVAILABLE');
    expect(mockCreateHold).not.toHaveBeenCalled();
  });

  it('calls commitHold with holdId and bookingId after successful booking', async () => {
    mockCreateHold.mockResolvedValue(makeHold());

    await createBookingHandler(makeReq(VALID_BODY), ctx);

    // Allow the fire-and-forget to resolve
    await new Promise((r) => setTimeout(r, 10));
    expect(mockCommitHold).toHaveBeenCalledWith(
      'svc-ac|2026-05-20|10:00-11:00',
      'svc-ac|2026-05-20',
      'bk-1',
    );
  });
});
