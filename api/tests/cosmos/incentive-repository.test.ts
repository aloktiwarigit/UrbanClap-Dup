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
