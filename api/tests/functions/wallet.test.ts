/**
 * E13-S01 — TDD tests for GET /v1/wallet/balance and GET /v1/wallet/ledger
 *
 * Tests committed BEFORE implementation (red phase).
 * Covers: AC-1, AC-2, AC-9 (coverage floor).
 */

import { beforeEach, describe, it, expect, vi } from 'vitest';
import { HttpRequest, type HttpResponseInit } from '@azure/functions';

// ---------------------------------------------------------------------------
// Module mocks — established before any import of the module under test
// ---------------------------------------------------------------------------

vi.mock('../../src/middleware/requireCustomer.js', () => ({
  requireCustomer: (
    handler: (req: HttpRequest, ctx: unknown, claims: { customerId: string }) => Promise<unknown>,
  ) =>
    (req: HttpRequest, ctx: unknown) =>
      handler(req, ctx, { customerId: 'cust-1' }),
}));

vi.mock('../../src/cosmos/customer-credit-ledger-repository.js', () => ({
  customerCreditLedgerRepo: {
    getBalance: vi.fn(),
    getLedgerPage: vi.fn(),
  },
}));

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
  withScope: vi.fn(),
}));

vi.mock('../../src/observability/posthog.js', () => ({
  posthog: { capture: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Test imports (after mocks)
// ---------------------------------------------------------------------------

import { getWalletBalanceHandler, getWalletLedgerHandler } from '../../src/functions/wallet.js';
import { customerCreditLedgerRepo } from '../../src/cosmos/customer-credit-ledger-repository.js';

type MockFn = ReturnType<typeof vi.fn>;

function makeGetReq(url: string, overrideClaims?: { customerId: string }): HttpRequest {
  const req = new HttpRequest({ url, method: 'GET', headers: {} });
  if (overrideClaims) {
    // Override requireCustomer mock for cross-user tests by patching via vi.mocked
    // The mock injects cust-1 by default; individual tests can override
  }
  return req;
}

// ---------------------------------------------------------------------------
// GET /v1/wallet/balance
// ---------------------------------------------------------------------------

describe('GET /v1/wallet/balance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 50000,
      lastUpdatedAt: '2026-05-10T10:00:00.000Z',
    });
  });

  it('AC-1a: returns 200 with balanceInPaise and lastUpdatedAt for authed customer', async () => {
    const res = (await getWalletBalanceHandler(
      makeGetReq('http://localhost/api/v1/wallet/balance'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as { balanceInPaise: number; lastUpdatedAt: string };
    expect(body.balanceInPaise).toBe(50000);
    expect(body.lastUpdatedAt).toBe('2026-05-10T10:00:00.000Z');
    expect(customerCreditLedgerRepo.getBalance).toHaveBeenCalledWith('cust-1');
  });

  it('AC-1b: returns 0 balance when customer has no credits', async () => {
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 0,
      lastUpdatedAt: new Date().toISOString(),
    });

    const res = (await getWalletBalanceHandler(
      makeGetReq('http://localhost/api/v1/wallet/balance'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as { balanceInPaise: number };
    expect(body.balanceInPaise).toBe(0);
  });

  it('returns 500 when repo throws', async () => {
    (customerCreditLedgerRepo.getBalance as MockFn).mockRejectedValue(new Error('Cosmos error'));

    const res = (await getWalletBalanceHandler(
      makeGetReq('http://localhost/api/v1/wallet/balance'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(500);
    expect((res.jsonBody as { code: string }).code).toBe('INTERNAL_ERROR');
  });
});

// ---------------------------------------------------------------------------
// GET /v1/wallet/ledger
// ---------------------------------------------------------------------------

describe('GET /v1/wallet/ledger', () => {
  const sampleEntries = [
    {
      id: 'entry-2',
      type: 'CREDIT_APPLIED' as const,
      amountInPaise: 50000,
      bookingId: 'bk-99',
      reason: 'Applied to booking bk-99',
      createdAt: '2026-05-11T08:00:00.000Z',
    },
    {
      id: 'entry-1',
      type: 'CREDIT_ISSUED' as const,
      amountInPaise: 50000,
      bookingId: 'bk-77',
      reason: 'No-show credit: booking bk-77',
      createdAt: '2026-05-10T10:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (customerCreditLedgerRepo.getLedgerPage as MockFn).mockResolvedValue({
      entries: sampleEntries,
      total: 2,
    });
  });

  it('AC-2a: returns 200 with entries newest-first and total count', async () => {
    const req = new HttpRequest({
      url: 'http://localhost/api/v1/wallet/ledger?page=1&limit=20',
      method: 'GET',
      headers: {},
    });

    const res = (await getWalletLedgerHandler(req, {} as never)) as HttpResponseInit;
    expect(res.status).toBe(200);
    const body = res.jsonBody as { entries: unknown[]; total: number; page: number; limit: number };
    expect(body.entries).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
    expect(customerCreditLedgerRepo.getLedgerPage).toHaveBeenCalledWith('cust-1', 1, 20);
  });

  it('AC-2b: defaults to page=1, limit=20 when query params absent', async () => {
    const req = new HttpRequest({
      url: 'http://localhost/api/v1/wallet/ledger',
      method: 'GET',
      headers: {},
    });

    await getWalletLedgerHandler(req, {} as never);
    expect(customerCreditLedgerRepo.getLedgerPage).toHaveBeenCalledWith('cust-1', 1, 20);
  });

  it('AC-2c: clamps limit to maximum of 100', async () => {
    const req = new HttpRequest({
      url: 'http://localhost/api/v1/wallet/ledger?page=1&limit=500',
      method: 'GET',
      headers: {},
    });

    await getWalletLedgerHandler(req, {} as never);
    expect(customerCreditLedgerRepo.getLedgerPage).toHaveBeenCalledWith('cust-1', 1, 100);
  });

  it('returns 422 when page is 0', async () => {
    const req = new HttpRequest({
      url: 'http://localhost/api/v1/wallet/ledger?page=0&limit=20',
      method: 'GET',
      headers: {},
    });

    const res = (await getWalletLedgerHandler(req, {} as never)) as HttpResponseInit;
    expect(res.status).toBe(422);
  });

  it('returns 500 when repo throws', async () => {
    (customerCreditLedgerRepo.getLedgerPage as MockFn).mockRejectedValue(new Error('Cosmos error'));
    const req = new HttpRequest({
      url: 'http://localhost/api/v1/wallet/ledger',
      method: 'GET',
      headers: {},
    });
    const res = (await getWalletLedgerHandler(req, {} as never)) as HttpResponseInit;
    expect(res.status).toBe(500);
  });
});
