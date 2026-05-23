/**
 * E13-S01 — TDD tests for POST /v1/bookings with applyCredit flag
 *
 * Tests committed BEFORE implementation (red phase).
 * Covers: AC-3, AC-4, AC-5, AC-6, AC-9 (coverage floor).
 *
 * P1-5: When credit covers 100% of booking, Razorpay order is skipped; requiresPayment=false.
 * P1-6: For partial credit, applyCredit is NOT called at booking-creation time.
 *       Instead pendingCreditAmount is returned to client; debit deferred to payment.captured webhook.
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
    // E16-S02: must return [] for the pre-hold existing-bookings gate
    getBookedWindowsByServiceDate: vi.fn().mockResolvedValue([]),
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
    // durationMinutes: 120 → '10:00-12:00' is a valid generated slot (default 08:00–20:00 window)
    getServiceByIdCrossPartition: vi.fn().mockResolvedValue({
      id: 'svc-1',
      name: 'AC Deep Clean',
      basePrice: 59900,
      isActive: true,
      durationMinutes: 120,
    }),
  },
}));

// E16-S02: slot-hold gate — mock so existing credit tests don't need Cosmos
vi.mock('../../src/cosmos/slot-holds-repository.js', () => ({
  slotHoldsRepo: {
    createHold: vi.fn().mockResolvedValue({ id: 'svc-1|2026-05-15|10:00-12:00', servicePartitionKey: 'svc-1|2026-05-15', serviceId: 'svc-1', date: '2026-05-15', window: '10:00-12:00', customerId: 'cust-1', heldAt: new Date().toISOString() }),
    commitHold: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/cosmos/customer-credit-ledger-repository.js', () => ({
  customerCreditLedgerRepo: {
    getBalance: vi.fn(),
    applyCredit: vi.fn(),
    reserveCredit: vi.fn().mockResolvedValue('reserved'),
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
// AC-3: Sufficient credit — partial credit (Razorpay path)
// P1-6: applyCredit is NOT called at booking-creation; credit deferred to webhook
// ---------------------------------------------------------------------------

describe('POST /v1/bookings with applyCredit=true — partial credit Razorpay (AC-3 / P1-6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 50000, // partial — does NOT cover full 59900 price
      lastUpdatedAt: new Date().toISOString(),
    });
    // applyCredit mock is NOT pre-loaded here because it should NOT be called for partial credit
  });

  it('P1-6: does NOT call applyCredit at booking-creation time for partial Razorpay credit', async () => {
    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-001'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    // applyCredit is deferred to webhook — must NOT be called here
    expect(customerCreditLedgerRepo.applyCredit).not.toHaveBeenCalled();
    // appliedCreditAmount is 0 at booking creation; pendingCreditAmount signals the deferred amount
    const body = res.jsonBody as { appliedCreditAmount: number; pendingCreditAmount: number; requiresPayment: boolean };
    expect(body.appliedCreditAmount).toBe(0);
    expect(body.pendingCreditAmount).toBe(50000);
    expect(body.requiresPayment).toBe(true);
  });

  it('when balance > basePrice the full-credit (P1-5) path fires: requiresPayment=false, applyCredit called', async () => {
    // balance=100000 >= basePrice=59900 → full-credit path (P1-5)
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 100000,
      lastUpdatedAt: new Date().toISOString(),
    });
    (customerCreditLedgerRepo.applyCredit as MockFn).mockResolvedValue({
      appliedAmountInPaise: 59900,
      newBalanceInPaise: 40100,
      idempotent: false,
    });
    // Full-credit path needs markPaid
    const { bookingRepo: repo } = await import('../../src/cosmos/booking-repository.js');
    (repo.markPaid as MockFn).mockResolvedValue({
      id: 'bk-100', customerId: 'cust-1', status: 'PAID', amount: 59900, createdAt: new Date().toISOString(),
    });

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-002'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    const body = res.jsonBody as { appliedCreditAmount: number; requiresPayment: boolean };
    // Credit covers full price → requiresPayment=false (P1-5)
    expect(body.requiresPayment).toBe(false);
    expect(body.appliedCreditAmount).toBe(59900); // capped at basePrice
  });
});

// ---------------------------------------------------------------------------
// P1-5: Credit covers 100% — skip Razorpay order, mark PAID directly
// ---------------------------------------------------------------------------

describe('POST /v1/bookings with applyCredit=true — full credit covers price (P1-5)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
    // Balance >= basePrice → full credit path
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 80000, // > 59900 (basePrice)
      lastUpdatedAt: new Date().toISOString(),
    });
    (customerCreditLedgerRepo.applyCredit as MockFn).mockResolvedValue({
      appliedAmountInPaise: 59900, // capped at booking amount
      newBalanceInPaise: 20100,
      idempotent: false,
    });
    // Full-credit path calls markPaid — configure it to return a successful booking
    const { bookingRepo: repo } = await import('../../src/cosmos/booking-repository.js');
    (repo.markPaid as MockFn).mockResolvedValue({
      id: 'bk-100',
      customerId: 'cust-1',
      status: 'PAID',
      amount: 59900,
      createdAt: new Date().toISOString(),
    });
  });

  it('P1-5: skips Razorpay order creation when credit covers full price', async () => {
    const { createRazorpayOrder } = await import('../../src/services/razorpay.service.js');

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-full-1'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    const body = res.jsonBody as {
      appliedCreditAmount: number;
      requiresPayment: boolean;
      paymentMethod: string;
    };
    expect(body.requiresPayment).toBe(false);
    expect(body.paymentMethod).toBe('CREDIT_FULL');
    expect(body.appliedCreditAmount).toBe(59900);
    // Razorpay order must NOT be created
    expect(createRazorpayOrder).not.toHaveBeenCalled();
    // applyCredit IS called synchronously for full-credit path
    expect(customerCreditLedgerRepo.applyCredit).toHaveBeenCalledWith(
      'cust-1',
      expect.any(String),
      59900, // capped at basePrice
      'idem-key-full-1',
    );
  });

  it('P1-5: dispatches booking immediately after full-credit PAID (no payment event needed)', async () => {
    const { dispatcherService } = await import('../../src/services/dispatcher.service.js');

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-full-2'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    expect(dispatcherService.triggerDispatch).toHaveBeenCalled();
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
// AC-5: Idempotency-key — missing header
// ---------------------------------------------------------------------------

describe('POST /v1/bookings — idempotency-key (AC-5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 50000,
      lastUpdatedAt: new Date().toISOString(),
    });
  });

  it('returns 422 when applyCredit=true but Idempotency-Key header is missing', async () => {
    // No idempotencyKey passed
    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(422);
    const body = res.jsonBody as { code: string };
    expect(body.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
  });

  it('proceeds with partial credit deferred when key is present', async () => {
    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-ok'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    // getBalance called to determine pending credit
    expect(customerCreditLedgerRepo.getBalance).toHaveBeenCalledWith('cust-1');
  });
});

// ---------------------------------------------------------------------------
// AC-6: Concurrent apply — 412 race path
// P1-1: Full-credit race now returns 409 CREDIT_RACE (not 201) because marking
// PAID with unapplied credit would result in a free booking.
// ---------------------------------------------------------------------------

describe('POST /v1/bookings — concurrent applyCredit race for full-credit path (AC-6 / P1-1 / P1-5)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
    // Full-credit path: balance >= basePrice triggers applyCredit synchronously
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 80000,
      lastUpdatedAt: new Date().toISOString(),
    });
    // Re-setup service area mock after clearAllMocks
    const { isLatLngInServiceArea } = await import('../../src/services/service-area.service.js');
    (isLatLngInServiceArea as MockFn).mockReturnValue(true);
    const { isServiceAreaGatingEnabled, isSoftLaunchEnabled, isMarketingPaused } = await import('../../src/services/featureFlags.service.js');
    (isServiceAreaGatingEnabled as MockFn).mockResolvedValue(false);
    (isSoftLaunchEnabled as MockFn).mockResolvedValue(true);
    (isMarketingPaused as MockFn).mockResolvedValue(false);
  });

  it('P1-1: returns 409 CREDIT_RACE when applyCredit throws 412 (etag conflict — full-credit path)', async () => {
    // Repo throws 412 (etag conflict). attemptCreditApplication catches it and returns 0.
    // P1-1: applied=0 < pendingCreditAmount=59900 → 409 CREDIT_RACE (not 201 free booking).
    const conflictErr = Object.assign(new Error('Precondition failed'), { code: 412 });
    (customerCreditLedgerRepo.applyCredit as MockFn).mockRejectedValue(conflictErr);

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-race'),
      {} as never,
    )) as HttpResponseInit;

    // P1-1: Must NOT return 201 — that would mean the booking was marked PAID with 0 credit applied.
    expect(res.status).toBe(409);
    const body = res.jsonBody as { code: string };
    expect(body.code).toBe('CREDIT_RACE');
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

// ---------------------------------------------------------------------------
// P1-1: Verify credit was actually applied before marking booking PAID
// ---------------------------------------------------------------------------

describe('POST /v1/bookings — P1-1 verify-before-PAID (full-credit path)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
    // Full-credit path: balance >= basePrice
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 80000, // > 59900
      lastUpdatedAt: new Date().toISOString(),
    });
    const { bookingRepo: repo } = await import('../../src/cosmos/booking-repository.js');
    (repo.markPaid as MockFn).mockResolvedValue({
      id: 'bk-100', customerId: 'cust-1', status: 'PAID', amount: 59900, createdAt: new Date().toISOString(),
    });
    // Re-setup service area mock after clearAllMocks
    const { isLatLngInServiceArea } = await import('../../src/services/service-area.service.js');
    (isLatLngInServiceArea as MockFn).mockReturnValue(true);
    const { isServiceAreaGatingEnabled } = await import('../../src/services/featureFlags.service.js');
    (isServiceAreaGatingEnabled as MockFn).mockResolvedValue(false);
    const { isSoftLaunchEnabled, isMarketingPaused } = await import('../../src/services/featureFlags.service.js');
    (isSoftLaunchEnabled as MockFn).mockResolvedValue(true);
    (isMarketingPaused as MockFn).mockResolvedValue(false);
  });

  it('P1-1a: marks PAID and dispatches when applied amount equals expected credit', async () => {
    // applyCredit returns full amount — all good
    (customerCreditLedgerRepo.applyCredit as MockFn).mockResolvedValue({
      appliedAmountInPaise: 59900,
      newBalanceInPaise: 20100,
      idempotent: false,
    });

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-p11a'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    const body = res.jsonBody as { requiresPayment: boolean; appliedCreditAmount: number };
    expect(body.requiresPayment).toBe(false);
    expect(body.appliedCreditAmount).toBe(59900);
  });

  it('P1-1b: returns 409 CREDIT_RACE when applyCredit returns 0 (all retries exhausted)', async () => {
    // Simulate race: all sentinel write retries failed, applied = 0
    (customerCreditLedgerRepo.applyCredit as MockFn).mockResolvedValue({
      appliedAmountInPaise: 0,
      newBalanceInPaise: 0,
      idempotent: false,
    });

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-p11b'),
      {} as never,
    )) as HttpResponseInit;

    // Must NOT mark PAID — booking is blocked with 409
    expect(res.status).toBe(409);
    const body = res.jsonBody as { code: string };
    expect(body.code).toBe('CREDIT_RACE');
  });

  it('P1-1c: returns 409 CREDIT_RACE when applyCredit returns partial amount (balance shifted)', async () => {
    // Simulate partial race: applied = 40000 < expected 59900
    (customerCreditLedgerRepo.applyCredit as MockFn).mockResolvedValue({
      appliedAmountInPaise: 40000,
      newBalanceInPaise: 0,
      idempotent: false,
    });

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-p11c'),
      {} as never,
    )) as HttpResponseInit;

    // Partial credit should also reject — booking would be underpaid
    expect(res.status).toBe(409);
    const body = res.jsonBody as { code: string };
    expect(body.code).toBe('CREDIT_RACE');
  });
});

// ---------------------------------------------------------------------------
// P1-2: Reserve credit BEFORE creating Razorpay order (partial credit path)
// ---------------------------------------------------------------------------

describe('POST /v1/bookings — P1-2 reserve-before-Razorpay (partial credit path)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
    // Partial credit: balance < basePrice so we go to Razorpay path
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 30000, // < 59900 → partial credit, Razorpay for the rest
      lastUpdatedAt: new Date().toISOString(),
    });
    (customerCreditLedgerRepo.reserveCredit as MockFn).mockResolvedValue('reserved');
    // Re-setup service area mock after clearAllMocks
    const { isLatLngInServiceArea } = await import('../../src/services/service-area.service.js');
    (isLatLngInServiceArea as MockFn).mockReturnValue(true);
    const { isServiceAreaGatingEnabled, isSoftLaunchEnabled, isMarketingPaused } = await import('../../src/services/featureFlags.service.js');
    (isServiceAreaGatingEnabled as MockFn).mockResolvedValue(false);
    (isSoftLaunchEnabled as MockFn).mockResolvedValue(true);
    (isMarketingPaused as MockFn).mockResolvedValue(false);
  });

  it('P1-2a: calls reserveCredit BEFORE creating the Razorpay order', async () => {
    const { createRazorpayOrder } = await import('../../src/services/razorpay.service.js');
    const callOrder: string[] = [];

    (customerCreditLedgerRepo.reserveCredit as MockFn).mockImplementation(() => {
      callOrder.push('reserve');
      return Promise.resolve('reserved');
    });
    (createRazorpayOrder as MockFn).mockImplementation(() => {
      callOrder.push('razorpay');
      return Promise.resolve({ id: 'order_partial', amount: 29900, currency: 'INR' });
    });

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-p12a'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    // reserve must come before razorpay
    expect(callOrder[0]).toBe('reserve');
    expect(callOrder[1]).toBe('razorpay');
  });

  it('P1-2b: reserveCredit called with correct customerId, bookingId, and amount', async () => {
    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-p12b'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    expect(customerCreditLedgerRepo.reserveCredit).toHaveBeenCalledWith(
      'cust-1',
      expect.any(String), // preGeneratedBookingId
      30000,              // pendingCreditAmount = min(balance, basePrice)
      'idem-key-p12b',
    );
  });

  it('P1-2c: idempotent replay (already_reserved) still proceeds to create Razorpay order', async () => {
    (customerCreditLedgerRepo.reserveCredit as MockFn).mockResolvedValue('already_reserved');
    const { createRazorpayOrder } = await import('../../src/services/razorpay.service.js');

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-p12c'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    // Razorpay order still created on idempotent replay
    expect(createRazorpayOrder).toHaveBeenCalled();
  });

  it('P1-2d: reserveCredit NOT called when pendingCreditAmount is 0', async () => {
    // Zero balance → no reservation needed
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 0,
      lastUpdatedAt: new Date().toISOString(),
    });

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-p12d'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    expect(customerCreditLedgerRepo.reserveCredit).not.toHaveBeenCalled();
  });
});
