// P0-1 — The technician earnings screen showed ₹0 for the entire cash pilot.
//
// `getEarningsHandler` summed `wallet_ledger.techAmount`. On the cash path,
// `trigger-booking-completed` returns from the CASH branch long before
// `walletLedgerRepo.createPendingEntry` (which lives inside the RAZORPAY branch),
// so nothing was ever written to `wallet_ledger`. Every technician in the live
// pilot therefore saw an empty earnings screen forever, while
// `technician-dashboard.ts` separately reported GROSS booking value with no
// commission subtracted — two contradictory numbers in one app.
//
// Earnings on the cash path = what the technician keeps = bookingAmount − commissionDue.
//
// The response SHAPE is unchanged, so this reaches technicians without an APK release.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));
vi.mock('../../src/cosmos/wallet-ledger-repository.js', () => ({
  walletLedgerRepo: { getAllByTechnicianId: vi.fn(), getPendingHeldByTechnicianId: vi.fn() },
}));
vi.mock('../../src/cosmos/commission-receivable-repository.js', () => ({
  commissionReceivableRepo: { getAllByTechnician: vi.fn() },
}));
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { getEarningsHandler } from '../../src/functions/earnings.js';
import { verifyTechnicianToken } from '../../src/middleware/verifyTechnicianToken.js';
import { walletLedgerRepo } from '../../src/cosmos/wallet-ledger-repository.js';
import { commissionReceivableRepo } from '../../src/cosmos/commission-receivable-repository.js';
import type { WalletLedgerEntry } from '../../src/schemas/wallet-ledger.js';
import type { CommissionReceivableEntry } from '../../src/schemas/commission-receivable.js';

const ctx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;

function makeReq(): HttpRequest {
  return {
    headers: { get: (h: string) => (h.toLowerCase() === 'authorization' ? 'Bearer t' : null) },
    params: {},
  } as unknown as HttpRequest;
}

/** A completed cash job: technician holds `bookingAmount`, owes `commissionDue`. */
function makeReceivable(
  overrides: Partial<CommissionReceivableEntry> & { bookingId: string; createdAt: string },
): CommissionReceivableEntry {
  return {
    id: overrides.bookingId,
    technicianId: 'tech-1',
    partitionKey: 'tech-1',
    serviceId: 'ac-deep-clean',
    categoryId: 'ac-repair',
    bookingAmount: 99900,
    commissionBps: 2200,
    commissionDue: 21978,
    commissionResolvedFrom: 'GLOBAL',
    remittanceStatus: 'DUE',
    ...overrides,
  } as CommissionReceivableEntry;
}

function makeLedgerEntry(bookingId: string, createdAt: string, techAmount: number): WalletLedgerEntry {
  return {
    id: bookingId,
    bookingId,
    technicianId: 'tech-1',
    partitionKey: 'tech-1',
    bookingAmount: techAmount + 10000,
    completedJobCountAtSettlement: 1,
    commissionBps: 1000,
    commissionAmount: 10000,
    techAmount,
    payoutStatus: 'PAID',
    createdAt,
  } as WalletLedgerEntry;
}

// Mid-month, mid-day IST so no period boundary is ambiguous.
const fixedNow = new Date('2026-04-15T12:00:00.000Z');
const todayIso = '2026-04-15T06:00:00.000Z';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(fixedNow);
  vi.resetAllMocks();
  vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-1' } as never);
  vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([]);
  vi.mocked(walletLedgerRepo.getPendingHeldByTechnicianId).mockResolvedValue([]);
  vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

async function callEarnings() {
  const res = (await getEarningsHandler(makeReq(), ctx)) as HttpResponseInit;
  return res.jsonBody as {
    today: { amountPaise: number; jobs: number };
    week: { amountPaise: number; jobs: number };
    month: { amountPaise: number; jobs: number; goalPaise: number };
    lifetime: { amountPaise: number; jobs: number };
    dailyLast7: Array<{ date: string; amountPaise: number; jobs: number }>;
    pendingHeld: number;
  };
}

describe('P0-1 — cash jobs count toward earnings', () => {
  it('THE BUG: a completed cash job no longer reports zero lifetime earnings', async () => {
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue([
      makeReceivable({ bookingId: 'bk-1', createdAt: todayIso }),
    ]);

    const body = await callEarnings();

    // Before the fix every one of these was 0 because wallet_ledger was empty.
    expect(body.lifetime.jobs).toBe(1);
    expect(body.lifetime.amountPaise).toBeGreaterThan(0);
  });

  it('reports what the technician keeps: bookingAmount minus commissionDue', async () => {
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue([
      makeReceivable({ bookingId: 'bk-1', createdAt: todayIso, bookingAmount: 99900, commissionDue: 21978 }),
    ]);

    const body = await callEarnings();

    expect(body.today.amountPaise).toBe(99900 - 21978);
    expect(body.today.jobs).toBe(1);
    expect(body.week.amountPaise).toBe(99900 - 21978);
    expect(body.month.amountPaise).toBe(99900 - 21978);
    expect(body.lifetime.amountPaise).toBe(99900 - 21978);
  });

  it('includes cash jobs in the 7-day sparkline', async () => {
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue([
      makeReceivable({ bookingId: 'bk-1', createdAt: todayIso, bookingAmount: 50000, commissionDue: 11000 }),
    ]);

    const body = await callEarnings();
    const todayRow = body.dailyLast7.find((d) => d.date === '2026-04-15');

    expect(todayRow?.jobs).toBe(1);
    expect(todayRow?.amountPaise).toBe(39000);
  });

  it('counts remitted and waived receivables too — earnings reflect the commission CHARGED', async () => {
    // A waiver or remittance months later must not retroactively change what a
    // past period reported. The charge at completion time is the stable figure.
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue([
      makeReceivable({ bookingId: 'bk-1', createdAt: todayIso, bookingAmount: 50000, commissionDue: 11000, remittanceStatus: 'REMITTED' }),
      makeReceivable({ bookingId: 'bk-2', createdAt: todayIso, bookingAmount: 50000, commissionDue: 11000, remittanceStatus: 'WAIVED' }),
    ]);

    const body = await callEarnings();

    expect(body.lifetime.jobs).toBe(2);
    expect(body.lifetime.amountPaise).toBe(2 * 39000);
  });
});

describe('P0-1 — the dormant Razorpay ledger still works', () => {
  it('sums wallet_ledger and receivables together', async () => {
    vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([
      makeLedgerEntry('bk-rzp', todayIso, 40000),
    ]);
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue([
      makeReceivable({ bookingId: 'bk-cash', createdAt: todayIso, bookingAmount: 50000, commissionDue: 11000 }),
    ]);

    const body = await callEarnings();

    expect(body.lifetime.jobs).toBe(2);
    expect(body.lifetime.amountPaise).toBe(40000 + 39000);
  });

  it('counts a booking once even if it somehow appears in both ledgers', async () => {
    // The two paths are mutually exclusive by design in trigger-booking-completed,
    // but double-counting a technician's money would be the worst possible bug here.
    vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([
      makeLedgerEntry('bk-dupe', todayIso, 40000),
    ]);
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue([
      makeReceivable({ bookingId: 'bk-dupe', createdAt: todayIso, bookingAmount: 50000, commissionDue: 11000 }),
    ]);

    const body = await callEarnings();

    expect(body.lifetime.jobs).toBe(1);
  });

  it('still excludes FAILED wallet_ledger payouts', async () => {
    const failed = { ...makeLedgerEntry('bk-f', todayIso, 40000), payoutStatus: 'FAILED' as const };
    vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([failed]);

    const body = await callEarnings();

    expect(body.lifetime.jobs).toBe(0);
    expect(body.lifetime.amountPaise).toBe(0);
  });

  it('still reports pendingHeld from the wallet ledger', async () => {
    vi.mocked(walletLedgerRepo.getPendingHeldByTechnicianId).mockResolvedValue([
      makeLedgerEntry('bk-held', todayIso, 12345),
    ]);

    const body = await callEarnings();

    expect(body.pendingHeld).toBe(12345);
  });
});

describe('P0-1 — period boundaries still respect IST', () => {
  it('excludes a job from "today" when it falls on the previous IST calendar day', async () => {
    // 2026-04-14T20:00Z = 2026-04-15T01:30 IST → today.
    // 2026-04-14T17:00Z = 2026-04-14T22:30 IST → yesterday.
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue([
      makeReceivable({ bookingId: 'bk-late', createdAt: '2026-04-14T20:00:00.000Z', bookingAmount: 50000, commissionDue: 11000 }),
      makeReceivable({ bookingId: 'bk-prev', createdAt: '2026-04-14T17:00:00.000Z', bookingAmount: 50000, commissionDue: 11000 }),
    ]);

    const body = await callEarnings();

    expect(body.today.jobs).toBe(1);
    expect(body.lifetime.jobs).toBe(2);
  });
});
