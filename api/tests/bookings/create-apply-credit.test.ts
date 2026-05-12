/**
 * E13-S01 — TDD tests for POST /v1/bookings with applyCredit flag
 *
 * Tests committed BEFORE implementation (red phase).
 * Covers: AC-3, AC-4, AC-5, AC-6, AC-9 (coverage floor).
 */

import { beforeEach, describe, it, expect, vi } from 'vitest';
import { HttpRequest, type HttpResponseInit } from '@azure/functions';

// ---------------------------------------------------------------------------
// Stubs — Razorpay keys so we exercise the credit path, not the fallback path
// ---------------------------------------------------------------------------

vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test');
vi.stubEnv('RAZORPAY_KEY_SECRET', 'rzp_secret');

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('../../src/middleware/requireCustomer.js', () => ({
  requireCustomer: (
    handler: (req: HttpRequest, ctx: unknown, claims: { customerId: string }) => Promise<unknown>,
  ) =>
    (req: HttpRequest, ctx: unknown) =>
      handler(req, ctx, { customerId: 'cust-1' }),
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    createPending: vi.fn().mockResolvedValue({
      id: 'bk-100',
      customerId: 'cust-1',
      serviceId: 'svc-1',
      categoryId: 'cat-1',
      slotDate: '2026-05-15',
      slotWindow: '10:00-12:00',
      addressText: '12 Main St',
      addressLatLng: { lat: 26.79, lng: 82.19 },
      status: 'PENDING_PAYMENT',
      paymentOrderId: 'order_abc',
      paymentId: null,
      paymentSignature: null,
      amount: 59900,
      createdAt: new Date().toISOString(),
    }),
    getById: vi.fn(),
    confirmPayment: vi.fn(),
    markPaid: vi.fn(),
  },
}));

vi.mock('../../src/services/razorpay.service.js', () => ({
  createRazorpayOrder: vi.fn().mockResolvedValue({ id: 'order_abc', amount: 59900, currency: 'INR' }),
  verifyPaymentSignature: vi.fn().mockReturnValue(true),
}));

vi.mock('../../src/services/dispatcher.service.js', () => ({
  dispatcherService: {
    triggerDispatch: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/cosmos/catalogue-repository.js', () => ({
  catalogueRepo: {
    getServiceByIdCrossPartition: vi.fn().mockResolvedValue({
      id: 'svc-1',
      name: 'AC Deep Clean',
      basePrice: 59900,
      isActive: true,
    }),
  },
}));

vi.mock('../../src/cosmos/customer-credit-ledger-repository.js', () => ({
  customerCreditLedgerRepo: {
    getBalance: vi.fn(),
    applyCredit: vi.fn(),
  },
}));

vi.mock('../../src/services/featureFlags.service.js', () => ({
  isSoftLaunchEnabled: vi.fn().mockResolvedValue(true),
  isMarketingPaused: vi.fn().mockResolvedValue(false),
  isServiceAreaGatingEnabled: vi.fn().mockResolvedValue(false),
  isWalletCreditEnabled: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../src/cosmos/audit-log-repository.js', () => ({
  appendAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
  withScope: vi.fn(),
}));

vi.mock('../../src/observability/posthog.js', () => ({
  posthog: { capture: vi.fn() },
}));

vi.mock('../../src/data/service-area-ayodhya.js', () => ({
  AYODHYA_SERVICE_AREA: { type: 'Polygon', coordinates: [[]] },
}));

vi.mock('../../src/services/service-area.service.js', () => ({
  isLatLngInServiceArea: vi.fn().mockReturnValue(true),
}));

// ---------------------------------------------------------------------------
// Test imports (after mocks)
// ---------------------------------------------------------------------------

import { createBookingHandler } from '../../src/functions/bookings.js';
import { customerCreditLedgerRepo } from '../../src/cosmos/customer-credit-ledger-repository.js';
import { isWalletCreditEnabled } from '../../src/services/featureFlags.service.js';

type MockFn = ReturnType<typeof vi.fn>;

const VALID_BODY_IN_AREA = {
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  slotDate: '2026-05-15',
  slotWindow: '10:00-12:00',
  addressText: '12 Main St, Ayodhya',
  addressLatLng: { lat: 26.79, lng: 82.19 },
};

function postReq(body: unknown, idempotencyKey?: string): HttpRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;
  return new HttpRequest({
    url: 'http://localhost/api/v1/bookings',
    method: 'POST',
    body: { string: JSON.stringify(body) },
    headers,
  });
}

// ---------------------------------------------------------------------------
// AC-3: Sufficient credit — apply
// ---------------------------------------------------------------------------

describe('POST /v1/bookings with applyCredit=true — sufficient credit (AC-3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 50000,
      lastUpdatedAt: new Date().toISOString(),
    });
    (customerCreditLedgerRepo.applyCredit as MockFn).mockResolvedValue({
      appliedAmountInPaise: 50000,
      newBalanceInPaise: 0,
      idempotent: false,
    });
  });

  it('returns 201 with appliedCreditAmount > 0 when credit available', async () => {
    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-001'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    const body = res.jsonBody as { bookingId: string; appliedCreditAmount: number };
    // bookingId in response is the mock's return value (bk-100); applyCredit uses preGeneratedBookingId (UUID)
    expect(body.bookingId).toBe('bk-100');
    expect(body.appliedCreditAmount).toBeGreaterThan(0);
    expect(body.appliedCreditAmount).toBe(50000);
    expect(customerCreditLedgerRepo.applyCredit).toHaveBeenCalledWith(
      'cust-1',
      expect.any(String), // preGeneratedBookingId — UUID generated at runtime
      50000, // min(balance=50000, bookingAmount=59900)
      'idem-key-001',
    );
  });

  it('caps applied credit at booking amount when balance exceeds total', async () => {
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 100000, // more than booking amount
      lastUpdatedAt: new Date().toISOString(),
    });
    (customerCreditLedgerRepo.applyCredit as MockFn).mockResolvedValue({
      appliedAmountInPaise: 59900, // capped at booking amount
      newBalanceInPaise: 40100,
      idempotent: false,
    });

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-002'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    expect(customerCreditLedgerRepo.applyCredit).toHaveBeenCalledWith(
      'cust-1',
      expect.any(String), // preGeneratedBookingId — UUID generated at runtime
      59900, // capped at booking amount
      'idem-key-002',
    );
  });
});

// ---------------------------------------------------------------------------
// AC-4: Zero balance — skip
// ---------------------------------------------------------------------------

describe('POST /v1/bookings with applyCredit=true — zero balance (AC-4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 0,
      lastUpdatedAt: new Date().toISOString(),
    });
  });

  it('returns 201 with appliedCreditAmount=0 and does not write ledger entry', async () => {
    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-003'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    const body = res.jsonBody as { appliedCreditAmount: number };
    expect(body.appliedCreditAmount).toBe(0);
    expect(customerCreditLedgerRepo.applyCredit).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AC-4 variant: applyCredit=false or absent — no credit lookup
// ---------------------------------------------------------------------------

describe('POST /v1/bookings with applyCredit absent / false', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
  });

  it('does not query balance when applyCredit is absent', async () => {
    const res = (await createBookingHandler(
      postReq(VALID_BODY_IN_AREA),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    expect(customerCreditLedgerRepo.getBalance).not.toHaveBeenCalled();
    expect(customerCreditLedgerRepo.applyCredit).not.toHaveBeenCalled();
  });

  it('does not query balance when applyCredit=false', async () => {
    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: false }),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    expect(customerCreditLedgerRepo.getBalance).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AC-5: Idempotency-key dedup
// ---------------------------------------------------------------------------

describe('POST /v1/bookings — idempotency-key dedup (AC-5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 50000,
      lastUpdatedAt: new Date().toISOString(),
    });
  });

  it('returns original response on replay (idempotent=true from repo)', async () => {
    // Repo indicates this key was already processed
    (customerCreditLedgerRepo.applyCredit as MockFn).mockResolvedValue({
      appliedAmountInPaise: 50000,
      newBalanceInPaise: 0,
      idempotent: true,
    });

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-replay'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    const body = res.jsonBody as { appliedCreditAmount: number };
    // Should return the previously applied amount without double-writing
    expect(body.appliedCreditAmount).toBe(50000);
  });

  it('returns 422 when applyCredit=true but Idempotency-Key header is missing', async () => {
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 50000,
      lastUpdatedAt: new Date().toISOString(),
    });

    // No idempotencyKey passed
    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(422);
    const body = res.jsonBody as { code: string };
    expect(body.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
  });
});

// ---------------------------------------------------------------------------
// AC-6: Concurrent apply — 412 race path
// ---------------------------------------------------------------------------

describe('POST /v1/bookings — concurrent applyCredit race (AC-6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 50000,
      lastUpdatedAt: new Date().toISOString(),
    });
  });

  it('returns 201 with appliedCreditAmount=0 when repo signals 412 conflict', async () => {
    // Repo throws 412 (etag conflict / concurrent write)
    const conflictErr = Object.assign(new Error('Precondition failed'), { code: 412 });
    (customerCreditLedgerRepo.applyCredit as MockFn).mockRejectedValue(conflictErr);

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-race'),
      {} as never,
    )) as HttpResponseInit;

    // Booking should still succeed, just without credit applied
    expect(res.status).toBe(201);
    const body = res.jsonBody as { appliedCreditAmount: number };
    expect(body.appliedCreditAmount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Feature-flag off: wallet credit disabled
// ---------------------------------------------------------------------------

describe('POST /v1/bookings — wallet credit feature flag off', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(false);
  });

  it('ignores applyCredit=true when feature flag is off', async () => {
    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-flag-off'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    expect(customerCreditLedgerRepo.getBalance).not.toHaveBeenCalled();
    const body = res.jsonBody as { appliedCreditAmount?: number };
    expect(body.appliedCreditAmount ?? 0).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Verify service-area gating still works (Stream 1.4 regression guard)
// ---------------------------------------------------------------------------

describe('POST /v1/bookings — service-area gating (E16-S01 regression guard)', () => {
  it('returns 400 when location is out of service area and gating is enabled', async () => {
    const { isServiceAreaGatingEnabled } = await import('../../src/services/featureFlags.service.js');
    const { isLatLngInServiceArea } = await import('../../src/services/service-area.service.js');
    (isServiceAreaGatingEnabled as MockFn).mockResolvedValue(true);
    (isLatLngInServiceArea as MockFn).mockReturnValue(false);

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, addressLatLng: { lat: 28.6, lng: 77.2 } }), // Delhi
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(400);
    expect((res.jsonBody as { error: string }).error).toBe('SERVICE_NOT_AVAILABLE_AT_LOCATION');
  });
});
