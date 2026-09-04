// P0-4 — The owner's P&L and payout queue were computed from a field that does not exist.
//
// `queryCompletedBookings` selected `c.commissionBps` from the bookings container,
// but `commissionBps` is not on `BookingDocSchema` and is never written to a booking.
// So `b.commissionBps ?? DEFAULT_COMMISSION_BPS` always resolved to the 2200 default:
// the per-service and per-category commission overrides (E21-S01's cascade) were
// silently ignored, and so was the commission actually RECORDED at settlement.
//
// Two further inaccuracies in the same query:
//   - gross used `amount`, not `finalAmount`, so every booking with customer-approved
//     add-ons understated revenue. Settlement itself uses `finalAmount ?? amount`.
//   - Razorpay-era bookings have their real commission in `wallet_ledger.commissionAmount`,
//     which was likewise ignored.
//
// The recorded ledgers are authoritative. Guessing is only acceptable when a booking
// predates both of them.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import { getDailyPnL, getPayoutQueue } from '../../src/cosmos/finance-repository.js';
import { getCosmosClient } from '../../src/cosmos/client.js';

function makeContainer(items: unknown[] = []) {
  return {
    items: {
      query: vi.fn().mockReturnValue({ fetchAll: async () => ({ resources: items }) }),
      create: vi.fn().mockResolvedValue({}),
      upsert: vi.fn().mockResolvedValue({}),
    },
    item: vi.fn().mockReturnValue({ read: async () => ({ resource: undefined }) }),
  };
}

function makeClient(containers: Record<string, ReturnType<typeof makeContainer>>) {
  return {
    database: () => ({
      container: (name: string) => containers[name] ?? makeContainer(),
    }),
  };
}

function booking(over: Record<string, unknown> = {}) {
  return {
    id: 'bk-1',
    technicianId: 'tech-1',
    technicianName: 'Ravi',
    amount: 99900,
    completedAt: '2026-04-14T10:00:00.000Z',
    status: 'COMPLETED',
    ...over,
  };
}

function receivable(bookingId: string, commissionDue: number) {
  return { bookingId, commissionDue };
}

function ledgerRow(bookingId: string, commissionAmount: number) {
  return { bookingId, commissionAmount, payoutStatus: 'PAID' };
}

beforeEach(() => vi.clearAllMocks());

describe('P0-4 — getDailyPnL uses recorded commission', () => {
  it('THE BUG: a per-service override is no longer flattened to the 2200 default', async () => {
    // A service on a 3000 bps override: recorded commission is 29970, not 21978.
    vi.mocked(getCosmosClient).mockReturnValue(
      makeClient({
        bookings: makeContainer([booking()]),
        commission_receivables: makeContainer([receivable('bk-1', 29970)]),
      }) as never,
    );

    const result = await getDailyPnL('2026-04-14', '2026-04-14');

    expect(result.totalCommission).toBe(29970);
    expect(result.totalCommission).not.toBe(21978); // the old always-2200 answer
    expect(result.totalNet).toBe(99900 - 29970);
  });

  it('counts customer-approved add-ons — gross is finalAmount, not amount', async () => {
    vi.mocked(getCosmosClient).mockReturnValue(
      makeClient({
        bookings: makeContainer([booking({ amount: 99900, finalAmount: 149900 })]),
        commission_receivables: makeContainer([receivable('bk-1', 32978)]),
      }) as never,
    );

    const result = await getDailyPnL('2026-04-14', '2026-04-14');

    expect(result.totalGross).toBe(149900);
    expect(result.dailyPnL[0]?.grossRevenue).toBe(149900);
  });

  it('uses wallet_ledger commission for a Razorpay-era booking', async () => {
    vi.mocked(getCosmosClient).mockReturnValue(
      makeClient({
        bookings: makeContainer([booking()]),
        commission_receivables: makeContainer([]),
        wallet_ledger: makeContainer([ledgerRow('bk-1', 24975)]),
      }) as never,
    );

    const result = await getDailyPnL('2026-04-14', '2026-04-14');

    expect(result.totalCommission).toBe(24975);
  });

  it('prefers the receivable when a booking somehow appears in both ledgers', async () => {
    vi.mocked(getCosmosClient).mockReturnValue(
      makeClient({
        bookings: makeContainer([booking()]),
        commission_receivables: makeContainer([receivable('bk-1', 29970)]),
        wallet_ledger: makeContainer([ledgerRow('bk-1', 24975)]),
      }) as never,
    );

    const result = await getDailyPnL('2026-04-14', '2026-04-14');

    expect(result.totalCommission).toBe(29970);
  });

  it('falls back to the default only when a booking predates both ledgers', async () => {
    vi.mocked(getCosmosClient).mockReturnValue(
      makeClient({
        bookings: makeContainer([booking()]),
        commission_receivables: makeContainer([]),
        wallet_ledger: makeContainer([]),
      }) as never,
    );

    const result = await getDailyPnL('2026-04-14', '2026-04-14');

    expect(result.totalCommission).toBe(Math.round((99900 * 2200) / 10000));
  });

  it('groups by completion date across multiple days', async () => {
    vi.mocked(getCosmosClient).mockReturnValue(
      makeClient({
        bookings: makeContainer([
          booking({ id: 'bk-1', amount: 50000, completedAt: '2026-04-14T10:00:00.000Z' }),
          booking({ id: 'bk-2', amount: 50000, completedAt: '2026-04-15T10:00:00.000Z' }),
        ]),
        commission_receivables: makeContainer([receivable('bk-1', 11000), receivable('bk-2', 11000)]),
      }) as never,
    );

    const result = await getDailyPnL('2026-04-14', '2026-04-15');

    expect(result.dailyPnL).toHaveLength(2);
    expect(result.dailyPnL[0]?.date).toBe('2026-04-14');
    expect(result.totalCommission).toBe(22000);
  });

  it('returns an empty summary when there are no completed bookings', async () => {
    vi.mocked(getCosmosClient).mockReturnValue(
      makeClient({ bookings: makeContainer([]) }) as never,
    );

    const result = await getDailyPnL('2026-04-01', '2026-04-07');

    expect(result.dailyPnL).toHaveLength(0);
    expect(result.totalGross).toBe(0);
  });
});

describe('P0-4 — getPayoutQueue uses the same recorded commission', () => {
  it('reports recorded commission rather than a 2200 guess', async () => {
    vi.mocked(getCosmosClient).mockReturnValue(
      makeClient({
        bookings: makeContainer([booking()]),
        commission_receivables: makeContainer([receivable('bk-1', 29970)]),
      }) as never,
    );

    const queue = await getPayoutQueue('2026-04-14', '2026-04-20');

    expect(queue.entries[0]?.commissionDeducted).toBe(29970);
    expect(queue.entries[0]?.grossEarnings).toBe(99900);
    expect(queue.entries[0]?.netPayable).toBe(99900 - 29970);
  });

  it('counts add-ons in a technician gross', async () => {
    vi.mocked(getCosmosClient).mockReturnValue(
      makeClient({
        bookings: makeContainer([booking({ amount: 99900, finalAmount: 149900 })]),
        commission_receivables: makeContainer([receivable('bk-1', 32978)]),
      }) as never,
    );

    const queue = await getPayoutQueue('2026-04-14', '2026-04-20');

    expect(queue.entries[0]?.grossEarnings).toBe(149900);
  });

  it('aggregates multiple jobs for one technician', async () => {
    vi.mocked(getCosmosClient).mockReturnValue(
      makeClient({
        bookings: makeContainer([
          booking({ id: 'bk-1', amount: 50000 }),
          booking({ id: 'bk-2', amount: 50000 }),
        ]),
        commission_receivables: makeContainer([receivable('bk-1', 11000), receivable('bk-2', 11000)]),
      }) as never,
    );

    const queue = await getPayoutQueue('2026-04-14', '2026-04-20');

    expect(queue.entries).toHaveLength(1);
    expect(queue.entries[0]?.completedJobsThisWeek).toBe(2);
    expect(queue.entries[0]?.commissionDeducted).toBe(22000);
  });
});
