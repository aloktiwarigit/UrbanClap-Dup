import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import {
  getDailyPnL,
  getPayoutQueue,
  getLedgerTransfer,
  writeLedgerEntry,
  getTechnicianLinkedAccount,
  getWeekSnapshot,
  upsertWeekSnapshot,
} from '../../src/cosmos/finance-repository.js';
import { getCosmosClient } from '../../src/cosmos/client.js';

function makeContainer(items: unknown[] = [], pointReadResource: unknown = undefined) {
  return {
    items: {
      query: vi.fn().mockReturnValue({ fetchAll: async () => ({ resources: items }) }),
      create: vi.fn().mockResolvedValue({}),
      upsert: vi.fn().mockResolvedValue({}),
    },
    item: vi.fn().mockReturnValue({ read: async () => ({ resource: pointReadResource }) }),
  };
}

function makeClient(containers: Record<string, ReturnType<typeof makeContainer>>) {
  return {
    database: () => ({
      container: (name: string) => containers[name] ?? makeContainer(),
    }),
  };
}

describe('getDailyPnL', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty summary when no completed bookings', async () => {
    vi.mocked(getCosmosClient).mockReturnValue(makeClient({ bookings: makeContainer([]) }) as any);
    const result = await getDailyPnL('2026-04-01', '2026-04-07');
    expect(result.dailyPnL).toHaveLength(0);
    expect(result.totalGross).toBe(0);
    expect(result.totalNet).toBe(0);
  });

  it('aggregates bookings by date and applies commissionBps', async () => {
    const booking = {
      id: 'b1',
      serviceId: 'ac-deep-clean',
      amount: 59900,
      commissionBps: 2250,
      technicianId: 'tech-1',
      technicianName: 'Ravi',
      completedAt: '2026-04-14T10:00:00.000Z',
      status: 'COMPLETED',
    };
    vi.mocked(getCosmosClient).mockReturnValue(makeClient({ bookings: makeContainer([booking]) }) as any);
    const result = await getDailyPnL('2026-04-14', '2026-04-14');
    expect(result.dailyPnL).toHaveLength(1);
    const day = result.dailyPnL[0]!;
    expect(day.date).toBe('2026-04-14');
    expect(day.grossRevenue).toBe(59900);
    const expectedCommission = Math.round(59900 * 2250 / 10000);
    expect(day.commission).toBe(expectedCommission);
    expect(day.netToOwner).toBe(59900 - expectedCommission);
  });

  it('uses commissionBps=0 when field is missing on booking', async () => {
    const booking = {
      id: 'b2',
      amount: 10000,
      technicianId: 't1',
      technicianName: 'X',
      completedAt: '2026-04-14T10:00:00.000Z',
      status: 'COMPLETED',
    };
    vi.mocked(getCosmosClient).mockReturnValue(makeClient({ bookings: makeContainer([booking]) }) as any);
    const result = await getDailyPnL('2026-04-14', '2026-04-14');
    expect(result.dailyPnL[0]!.commission).toBe(0);
    expect(result.dailyPnL[0]!.netToOwner).toBe(10000);
  });

  it('aggregates two bookings on the same date', async () => {
    const bookings = [
      { id: 'b1', amount: 59900, commissionBps: 2000, technicianId: 't1', technicianName: 'Ravi', completedAt: '2026-04-14T09:00:00.000Z', status: 'COMPLETED' },
      { id: 'b2', amount: 49900, commissionBps: 2000, technicianId: 't2', technicianName: 'Suresh', completedAt: '2026-04-14T14:00:00.000Z', status: 'COMPLETED' },
    ];
    vi.mocked(getCosmosClient).mockReturnValue(makeClient({ bookings: makeContainer(bookings) }) as any);
    const result = await getDailyPnL('2026-04-14', '2026-04-14');
    expect(result.dailyPnL).toHaveLength(1);
    expect(result.dailyPnL[0]!.grossRevenue).toBe(109800);
    expect(result.totalGross).toBe(109800);
  });
});

describe('getPayoutQueue', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns queue grouped by technicianId', async () => {
    const bookings = [
      { id: 'b1', technicianId: 't1', technicianName: 'Ravi', amount: 59900, commissionBps: 2250, completedAt: '2026-04-14T10:00:00.000Z', status: 'COMPLETED' },
      { id: 'b2', technicianId: 't1', technicianName: 'Ravi', amount: 49900, commissionBps: 2250, completedAt: '2026-04-15T10:00:00.000Z', status: 'COMPLETED' },
    ];
    vi.mocked(getCosmosClient).mockReturnValue(makeClient({ bookings: makeContainer(bookings) }) as any);
    const result = await getPayoutQueue('2026-04-14', '2026-04-20');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]!.technicianId).toBe('t1');
    expect(result.entries[0]!.completedJobsThisWeek).toBe(2);
    expect(result.entries[0]!.grossEarnings).toBe(59900 + 49900);
  });

  it('excludes techs where netPayable is 0', async () => {
    const booking = {
      id: 'b1',
      technicianId: 't1',
      technicianName: 'Ravi',
      amount: 0,
      commissionBps: 2250,
      completedAt: '2026-04-14T10:00:00.000Z',
      status: 'COMPLETED',
    };
    vi.mocked(getCosmosClient).mockReturnValue(makeClient({ bookings: makeContainer([booking]) }) as any);
    const result = await getPayoutQueue('2026-04-14', '2026-04-20');
    expect(result.entries).toHaveLength(0);
    expect(result.totalNetPayable).toBe(0);
  });
});

describe('getLedgerTransfer', () => {
  it('returns existing transfer doc when found', async () => {
    const doc = {
      id: 'lt-1',
      type: 'TRANSFER',
      technicianId: 't1',
      weekStart: '2026-04-14',
      razorpayTransferId: 'trf_xxx',
      amount: 193750,
      createdAt: '2026-04-21T01:00:00.000Z',
    };
    const container = {
      items: { query: vi.fn().mockReturnValue({ fetchAll: async () => ({ resources: [doc] }) }) },
    };
    vi.mocked(getCosmosClient).mockReturnValue(makeClient({ wallet_ledger: container as any }) as any);
    const result = await getLedgerTransfer('t1', '2026-04-14');
    expect(result?.razorpayTransferId).toBe('trf_xxx');
  });

  it('returns null when no transfer found', async () => {
    vi.mocked(getCosmosClient).mockReturnValue(makeClient({ wallet_ledger: makeContainer([]) }) as any);
    const result = await getLedgerTransfer('t1', '2026-04-14');
    expect(result).toBeNull();
  });
});

describe('writeLedgerEntry', () => {
  it('calls items.create on wallet_ledger with correct fields', async () => {
    const ledgerContainer = makeContainer();
    vi.mocked(getCosmosClient).mockReturnValue(makeClient({ wallet_ledger: ledgerContainer }) as any);
    await writeLedgerEntry({
      technicianId: 't1',
      amount: 193750,
      type: 'TRANSFER',
      weekStart: '2026-04-14',
      razorpayTransferId: 'trf_xxx',
    });
    expect(ledgerContainer.items.create).toHaveBeenCalledOnce();
    const call = ledgerContainer.items.create.mock.calls[0]![0] as Record<string, unknown>;
    expect(call['type']).toBe('TRANSFER');
    expect(call['technicianId']).toBe('t1');
    expect(call['weekStart']).toBe('2026-04-14');
  });
});

describe('getTechnicianLinkedAccount', () => {
  it('returns razorpayLinkedAccountId when tech exists', async () => {
    const tech = { id: 't1', name: 'Ravi', razorpayLinkedAccountId: 'rpacc_test123' };
    const container = { item: vi.fn().mockReturnValue({ read: async () => ({ resource: tech }) }) };
    vi.mocked(getCosmosClient).mockReturnValue(makeClient({ technicians: container as any }) as any);
    const result = await getTechnicianLinkedAccount('t1');
    expect(result).toBe('rpacc_test123');
  });

  it('returns null when tech not found', async () => {
    const container = { item: vi.fn().mockReturnValue({ read: async () => ({ resource: undefined }) }) };
    vi.mocked(getCosmosClient).mockReturnValue(makeClient({ technicians: container as any }) as any);
    const result = await getTechnicianLinkedAccount('t1');
    expect(result).toBeNull();
  });

  it('returns null when tech has no linked account', async () => {
    const tech = { id: 't1', name: 'Ravi' };
    const container = { item: vi.fn().mockReturnValue({ read: async () => ({ resource: tech }) }) };
    vi.mocked(getCosmosClient).mockReturnValue(makeClient({ technicians: container as any }) as any);
    const result = await getTechnicianLinkedAccount('t1');
    expect(result).toBeNull();
  });
});

describe('getWeekSnapshot / upsertWeekSnapshot', () => {
  it('getWeekSnapshot returns null when not found', async () => {
    vi.mocked(getCosmosClient).mockReturnValue(makeClient({ payout_snapshots: makeContainer([], undefined) }) as any);
    const result = await getWeekSnapshot('2026-04-14');
    expect(result).toBeNull();
  });

  it('upsertWeekSnapshot calls items.upsert with correct partition key', async () => {
    const snapshotContainer = makeContainer();
    vi.mocked(getCosmosClient).mockReturnValue(makeClient({ payout_snapshots: snapshotContainer }) as any);
    const queue = { weekStart: '2026-04-14', weekEnd: '2026-04-20', entries: [], totalNetPayable: 0 };
    await upsertWeekSnapshot(queue);
    expect(snapshotContainer.items.upsert).toHaveBeenCalledOnce();
    const call = snapshotContainer.items.upsert.mock.calls[0]![0] as Record<string, unknown>;
    expect(call['weekStart']).toBe('2026-04-14');
  });
});
