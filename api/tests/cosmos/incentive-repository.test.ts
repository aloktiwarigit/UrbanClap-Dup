import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LedgerDocSchema } from '../../src/schemas/commission-ledger.js';

const fetchAll = vi.fn();
const fetchNext = vi.fn();
const hasMoreResults = vi.fn();
const itemRead = vi.fn();
vi.mock('../../src/cosmos/client.js', () => ({
  getCommissionReceivablesContainer: () => ({
    items: { query: () => ({ fetchAll, fetchNext, hasMoreResults }) },
    item: () => ({ read: itemRead }),
  }),
}));
const { commissionReceivableRepo } = await import('../../src/cosmos/commission-receivable-repository.js');
const { incentiveRepo } = await import('../../src/cosmos/incentive-repository.js');

export const awardDoc = {
  id: 'inc:t1:2026-W37', docType: 'INCENTIVE_AWARD', technicianId: 't1', partitionKey: 't1',
  weekKey: '2026-W37', weekStart: '2026-09-07', weekEnd: '2026-09-13',
  countedJobs: 10, countedCommissionPaise: 220_000,
  milestoneSnapshot: [{ jobs: 10, bonusPaise: 30_000 }],
  capFractionBpsSnapshot: 6000, minCountableBookingPaiseSnapshot: 24_900,
  grossBonusPaise: 30_000, capPaise: 132_000, awardedPaise: 30_000, appliedPaise: 30_000,
  status: 'APPLIED', computedAt: '2026-09-14T00:30:00.000Z',
};

beforeEach(() => vi.resetAllMocks());

describe('LedgerDocSchema', () => {
  it('discriminates a real INCENTIVE_AWARD into the typed branch, not a passthrough blob', () => {
    expect((LedgerDocSchema.parse(awardDoc) as typeof awardDoc).awardedPaise).toBe(30_000);
  });
  it('rejects an INCENTIVE_AWARD missing a required field (the placeholder accepted it)', () => {
    const { awardedPaise: _drop, ...broken } = awardDoc;
    expect(() => LedgerDocSchema.parse(broken)).toThrow();
  });
  it('still treats a docType-less document as a RECEIVABLE', () => {
    const legacy = { id: 'b1', bookingId: 'b1', technicianId: 't1', partitionKey: 't1',
      serviceId: 's', categoryId: 'c', bookingAmount: 100_000, commissionBps: 2200,
      commissionDue: 22_000, commissionResolvedFrom: 'GLOBAL', remittanceStatus: 'DUE',
      createdAt: '2026-09-08T10:00:00.000Z' };
    expect((LedgerDocSchema.parse(legacy) as { docType: string }).docType).toBe('RECEIVABLE');
  });
});

describe('listLedger', () => {
  it('separates awards from receivables, remittances and credits', async () => {
    fetchAll.mockResolvedValue({ resources: [
      { id: 'b1', bookingId: 'b1', remittanceStatus: 'DUE' },               // no docType -> RECEIVABLE
      { id: 'rem:k1', docType: 'REMITTANCE', amountPaise: 100 },
      { id: 'cr:inc:t1:2026-W37', docType: 'CREDIT', remainingPaise: 50 },
      awardDoc,
    ] });
    const out = await commissionReceivableRepo.listLedger('t1');
    expect([out.receivables.length, out.remittances.length, out.credits.length, out.awards.length]).toEqual([1, 1, 1, 1]);
    expect(out.awards[0]!.id).toBe('inc:t1:2026-W37');
  });
  it('returns an empty awards array when the technician has never been awarded', async () => {
    fetchAll.mockResolvedValue({ resources: [{ id: 'b1', bookingId: 'b1' }] });
    expect((await commissionReceivableRepo.listLedger('t1')).awards).toEqual([]);
  });
});

describe('incentiveRepo — single-partition reads', () => {
  it('lists awards newest-first, and [] when there are none', async () => {
    fetchAll.mockResolvedValue({ resources: [
      { ...awardDoc, id: 'inc:t1:2026-W37', weekKey: '2026-W37', computedAt: '2026-09-14T00:30:00.000Z' },
      { ...awardDoc, id: 'inc:t1:2026-W36', weekKey: '2026-W36', computedAt: '2026-09-07T00:30:00.000Z' },
    ] });
    expect((await incentiveRepo.listAwards('t1')).map((a) => a.weekKey)).toEqual(['2026-W37', '2026-W36']);
    fetchAll.mockResolvedValue({ resources: [] });
    expect(await incentiveRepo.listAwards('t1')).toEqual([]);
  });
  it('getAwardWithEtag returns the doc plus the etag the reconciler needs, or null', async () => {
    itemRead.mockResolvedValue({ resource: awardDoc, etag: '"v7"' });
    expect(await incentiveRepo.getAwardWithEtag('t1', 'inc:t1:2026-W37')).toEqual({ doc: awardDoc, etag: '"v7"' });
    itemRead.mockResolvedValue({ resource: undefined });
    expect(await incentiveRepo.getAwardWithEtag('t1', 'inc:t1:2026-W37')).toBeNull();
  });
});

describe('incentiveRepo.listAwardsCrossPartition', () => {
  it('returns one page and passes the continuation token through', async () => {
    hasMoreResults.mockReturnValue(true);
    fetchNext.mockResolvedValue({ resources: [awardDoc], continuationToken: 'ct-2' });
    const out = await incentiveRepo.listAwardsCrossPartition({ weekKey: '2026-W37', technicianId: 't1' });
    expect(out).toMatchObject({ continuationToken: 'ct-2' });
    expect(out.awards).toHaveLength(1);
  });
  it('omits continuationToken on the last page and never calls fetchNext when already done', async () => {
    hasMoreResults.mockReturnValue(true);
    fetchNext.mockResolvedValue({ resources: [awardDoc], continuationToken: undefined });
    expect(await incentiveRepo.listAwardsCrossPartition({})).not.toHaveProperty('continuationToken');
    vi.mocked(fetchNext).mockClear();
    hasMoreResults.mockReturnValue(false);
    expect(await incentiveRepo.listAwardsCrossPartition({})).toEqual({ awards: [] });
    expect(fetchNext).not.toHaveBeenCalled();
  });
  it('SURVIVES a page whose resources is undefined, not []', async () => {
    // Same Cosmos aggregate-page shape as the GROUP BY guard below: a page can resolve with
    // `resources: undefined` while hasMoreResults() stayed true. Spreading it unguarded throws
    // "page.resources is not iterable" — the `page.resources ?? []` guard must survive this.
    hasMoreResults.mockReturnValue(true);
    fetchNext.mockResolvedValue({ resources: undefined, continuationToken: undefined });
    expect(await incentiveRepo.listAwardsCrossPartition({})).toEqual({ awards: [] });
  });
});

describe('incentiveRepo.sumAppliedByIstDay', () => {
  it('buckets appliedPaise by the IST calendar day of computedAt', async () => {
    fetchAll.mockResolvedValue({ resources: [
      { appliedPaise: 30_000, computedAt: '2026-09-13T19:00:00.000Z' }, // Mon 2026-09-14 00:30 IST
      { appliedPaise: 10_000, computedAt: '2026-09-13T19:05:00.000Z' },
      { appliedPaise: 5_000,  computedAt: '2026-09-06T19:00:00.000Z' }, // Mon 2026-09-07 00:30 IST
    ] });
    const m = await incentiveRepo.sumAppliedByIstDay('2026-09-01', '2026-09-30');
    expect([m.get('2026-09-14'), m.get('2026-09-07'), m.size]).toEqual([40_000, 5_000, 2]);
  });
  it('skips a malformed row rather than putting NaN on the owner P&L', async () => {
    fetchAll.mockResolvedValue({ resources: [
      { appliedPaise: null, computedAt: '2026-09-13T19:00:00.000Z' },
      { appliedPaise: 100, computedAt: undefined },
      { appliedPaise: 700, computedAt: '2026-09-13T19:00:00.000Z' },
    ] });
    const m = await incentiveRepo.sumAppliedByIstDay('2026-09-01', '2026-09-30');
    expect(m.get('2026-09-14')).toBe(700);
    expect([...m.values()].every(Number.isFinite)).toBe(true);
  });
  it('SURVIVES a page whose resources is undefined, not [], and returns an empty Map', async () => {
    // This feeds getDailyPnL's incentive cost line — an unguarded spread here would throw
    // "page.resources is not iterable" straight into the owner's P&L request, exactly the
    // production incident this Global Constraint exists to prevent.
    fetchAll.mockResolvedValue({ resources: undefined });
    const m = await incentiveRepo.sumAppliedByIstDay('2026-09-01', '2026-09-30');
    expect(m).toEqual(new Map());
  });
});

describe('commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow', () => {
  it('drains every page of the GROUP BY aggregate', async () => {
    hasMoreResults.mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValue(false);
    fetchNext
      .mockResolvedValueOnce({ resources: [{ technicianId: 't1', receivableCount: 3 }] })
      .mockResolvedValueOnce({ resources: [{ technicianId: 't2', receivableCount: 1 }] });
    expect(await commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow(
      '2026-09-06T18:30:00.000Z', '2026-09-13T18:30:00.000Z',
    )).toEqual([{ technicianId: 't1', receivableCount: 3 }, { technicianId: 't2', receivableCount: 1 }]);
  });
  it('SURVIVES a page whose resources is undefined, not []', async () => {
    // Cosmos returns `resources: undefined` on aggregate GROUP BY pages while hasMoreResults()
    // stays true. An idealised mock returning [] hid exactly this as a production 500 behind
    // 1,935 green tests; spreading it unguarded throws "page.resources is not iterable".
    hasMoreResults.mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValue(false);
    fetchNext
      .mockResolvedValueOnce({ resources: undefined })
      .mockResolvedValueOnce({ resources: [{ technicianId: 't1', receivableCount: 2 }] });
    expect(await commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow('a', 'b'))
      .toEqual([{ technicianId: 't1', receivableCount: 2 }]);
  });
  it('returns [] when every page is undefined', async () => {
    hasMoreResults.mockReturnValueOnce(true).mockReturnValue(false);
    fetchNext.mockResolvedValueOnce({ resources: undefined });
    expect(await commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow('a', 'b')).toEqual([]);
  });
});
