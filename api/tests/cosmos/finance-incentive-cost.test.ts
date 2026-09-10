import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DailyPnLEntrySchema, FinanceSummarySchema } from '../../src/schemas/finance.js';

describe('finance schemas widen for the incentive line', () => {
  it('accepts a negative netToOwner — an award on a day with no bookings', () => {
    expect(() => DailyPnLEntrySchema.parse({ date: '2026-09-14', grossRevenue: 0, commission: 0,
      netToOwner: -30_000, incentiveCostPaise: 30_000 })).not.toThrow();
  });
  it('still accepts an entry with no incentiveCostPaise at all (optional, additive)', () => {
    expect(() => DailyPnLEntrySchema.parse({ date: '2026-09-14', grossRevenue: 100, commission: 22,
      netToOwner: 78 })).not.toThrow();
  });
  it('accepts a negative totalNet', () => {
    expect(() => FinanceSummarySchema.parse({ dailyPnL: [], totalGross: 0, totalCommission: 0,
      totalNet: -30_000, totalIncentiveCost: 30_000 })).not.toThrow();
  });
});

vi.mock('../../src/cosmos/client.js', () => ({ getCosmosClient: vi.fn(), DB_NAME: 'homeservices' }));
vi.mock('../../src/cosmos/incentive-repository.js');
import { getCosmosClient } from '../../src/cosmos/client.js';
import { incentiveRepo } from '../../src/cosmos/incentive-repository.js';
import { getDailyPnL } from '../../src/cosmos/finance-repository.js';

const makeContainer = (items: unknown[] = []) => ({
  items: { query: vi.fn().mockReturnValue({ fetchAll: async () => ({ resources: items }) }),
    create: vi.fn().mockResolvedValue({}), upsert: vi.fn().mockResolvedValue({}) },
  item: vi.fn().mockReturnValue({ read: async () => ({ resource: undefined }) }),
});
const makeClient = (c: Record<string, ReturnType<typeof makeContainer>>) => ({
  database: () => ({ container: (n: string) => c[n] ?? makeContainer() }),
});
/** One ₹1000 job completed 2026-09-14 with 22_000 of commission recorded against it. */
const arrangeBookings = (bookings: unknown[], receivables: unknown[]) =>
  vi.mocked(getCosmosClient).mockReturnValue(makeClient({
    bookings: makeContainer(bookings), commission_receivables: makeContainer(receivables),
  }) as never);
const job = { id: 'bk-1', technicianId: 't1', technicianName: 'Ravi', amount: 100_000,
  completedAt: '2026-09-14T10:00:00.000Z', status: 'COMPLETED' };

beforeEach(() => vi.clearAllMocks());

describe('getDailyPnL', () => {
  it('subtracts the incentive cost from netToOwner on a day that has bookings', async () => {
    arrangeBookings([job], [{ bookingId: 'bk-1', commissionDue: 22_000 }]);
    vi.mocked(incentiveRepo.sumAppliedByIstDay).mockResolvedValue(new Map([['2026-09-14', 30_000]]));
    const r = await getDailyPnL('2026-09-14', '2026-09-14');
    expect(r.dailyPnL[0]).toMatchObject({
      date: '2026-09-14', grossRevenue: 100_000, commission: 22_000,
      incentiveCostPaise: 30_000, netToOwner: 48_000,
    });
    expect(r).toMatchObject({ totalIncentiveCost: 30_000, totalNet: 48_000 });
  });

  it('creates a row for a day with an award but NO bookings, with a negative net', async () => {
    // Without this the cost silently vanishes on exactly the day it is most likely to land:
    // Monday 00:30 IST, before anyone has completed a job.
    arrangeBookings([], []);
    vi.mocked(incentiveRepo.sumAppliedByIstDay).mockResolvedValue(new Map([['2026-09-14', 30_000]]));
    const r = await getDailyPnL('2026-09-14', '2026-09-14');
    expect(r.dailyPnL).toHaveLength(1);
    expect(r.dailyPnL[0]).toMatchObject({
      date: '2026-09-14', grossRevenue: 0, commission: 0,
      incentiveCostPaise: 30_000, netToOwner: -30_000,
    });
    expect(r.totalNet).toBe(-30_000);
  });

  it('omits the field entirely on a day with no incentive cost', async () => {
    arrangeBookings([job], [{ bookingId: 'bk-1', commissionDue: 22_000 }]);
    vi.mocked(incentiveRepo.sumAppliedByIstDay).mockResolvedValue(new Map());
    const r = await getDailyPnL('2026-09-14', '2026-09-14');
    expect(r.dailyPnL[0]).not.toHaveProperty('incentiveCostPaise');
    expect(r).not.toHaveProperty('totalIncentiveCost');
    expect(r.dailyPnL[0]!.netToOwner).toBe(78_000);
  });

  it('never lets an incentive read failure take down the P&L — the cost degrades to 0', async () => {
    // Reporting endpoint: a cross-partition award query failing must degrade this one line,
    // not 502 the owner's whole dashboard.
    arrangeBookings([job], [{ bookingId: 'bk-1', commissionDue: 22_000 }]);
    vi.mocked(incentiveRepo.sumAppliedByIstDay).mockRejectedValue(new Error('cosmos down'));
    const r = await getDailyPnL('2026-09-14', '2026-09-14');
    expect(r.dailyPnL[0]!.netToOwner).toBe(78_000);
    expect(r.totalNet).toBe(78_000);
  });
});
