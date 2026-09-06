import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CommissionReceivableEntry } from '../../src/schemas/commission-receivable.js';

// --- Mocks ---
const mockCreate = vi.fn();
const mockRead = vi.fn();
const mockBatch = vi.fn();
const mockItem = vi.fn(() => ({ read: mockRead }));
const mockFetchAll = vi.fn();
const mockFetchNext = vi.fn();
const mockQuery = vi.fn(() => ({ fetchAll: mockFetchAll, fetchNext: mockFetchNext }));

vi.mock('../../src/cosmos/client.js', () => ({
  getCommissionReceivablesContainer: () => ({
    items: { create: mockCreate, query: mockQuery, batch: mockBatch },
    item: mockItem,
  }),
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import { commissionReceivableRepo } from '../../src/cosmos/commission-receivable-repository.js';

const baseDueEntry: CommissionReceivableEntry = {
  id: 'bk-001',
  bookingId: 'bk-001',
  technicianId: 'tech-1',
  partitionKey: 'tech-1',
  serviceId: 'svc-ac',
  categoryId: 'cat-hvac',
  bookingAmount: 59900,
  commissionBps: 2000,
  commissionDue: 11980,
  commissionResolvedFrom: 'SERVICE',
  remittanceStatus: 'DUE',
  createdAt: '2026-05-01T08:00:00.000Z',
};

describe('commissionReceivableRepo.createDueEntry', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true on successful create', async () => {
    mockCreate.mockResolvedValue({});
    const result = await commissionReceivableRepo.createDueEntry({
      bookingId: 'bk-001',
      technicianId: 'tech-1',
      serviceId: 'svc-ac',
      categoryId: 'cat-hvac',
      bookingAmount: 59900,
      commissionBps: 2000,
      commissionDue: 11980,
      commissionResolvedFrom: 'SERVICE',
    });
    expect(result).toBe(true);
    expect(mockCreate).toHaveBeenCalledOnce();
    const doc = (mockCreate.mock.calls as unknown[][])[0]![0] as CommissionReceivableEntry;
    expect(doc.id).toBe('bk-001');
    expect(doc.remittanceStatus).toBe('DUE');
    expect(doc.partitionKey).toBe('tech-1');
    expect(doc.cashCollectedAmount).toBeUndefined();
  });

  it('includes cashCollectedAmount when provided', async () => {
    mockCreate.mockResolvedValue({});
    await commissionReceivableRepo.createDueEntry({
      bookingId: 'bk-002',
      technicianId: 'tech-1',
      serviceId: 'svc-ac',
      categoryId: 'cat-hvac',
      bookingAmount: 59900,
      commissionBps: 2000,
      commissionDue: 11980,
      commissionResolvedFrom: 'SERVICE',
      cashCollectedAmount: 59900,
    });
    const doc = (mockCreate.mock.calls as unknown[][])[0]![0] as CommissionReceivableEntry;
    expect(doc.cashCollectedAmount).toBe(59900);
  });

  it('includes serviceName, slotDate, collectionMethod when provided', async () => {
    mockCreate.mockResolvedValue({});
    await commissionReceivableRepo.createDueEntry({
      bookingId: 'bk-003',
      technicianId: 'tech-1',
      serviceId: 'svc-ac',
      categoryId: 'cat-hvac',
      bookingAmount: 59900,
      commissionBps: 2000,
      commissionDue: 11980,
      commissionResolvedFrom: 'SERVICE',
      serviceName: 'AC Repair',
      slotDate: '2026-05-01',
      collectionMethod: 'CASH',
    });
    const doc = (mockCreate.mock.calls as unknown[][])[0]![0] as CommissionReceivableEntry;
    expect(doc.serviceName).toBe('AC Repair');
    expect(doc.slotDate).toBe('2026-05-01');
    expect(doc.collectionMethod).toBe('CASH');
  });

  it('returns false on 409 conflict (duplicate create)', async () => {
    mockCreate.mockRejectedValue({ code: 409 });
    const result = await commissionReceivableRepo.createDueEntry({
      bookingId: 'bk-001',
      technicianId: 'tech-1',
      serviceId: 'svc-ac',
      categoryId: 'cat-hvac',
      bookingAmount: 59900,
      commissionBps: 2000,
      commissionDue: 11980,
      commissionResolvedFrom: 'SERVICE',
    });
    expect(result).toBe(false);
  });

  it('rethrows non-409 errors', async () => {
    mockCreate.mockRejectedValue({ code: 500, message: 'Server error' });
    await expect(
      commissionReceivableRepo.createDueEntry({
        bookingId: 'bk-err',
        technicianId: 'tech-1',
        serviceId: 'svc-ac',
        categoryId: 'cat-hvac',
        bookingAmount: 59900,
        commissionBps: 2000,
        commissionDue: 11980,
        commissionResolvedFrom: 'SERVICE',
      }),
    ).rejects.toMatchObject({ code: 500 });
  });
});

describe('commissionReceivableRepo.getByBookingId', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when entry not found', async () => {
    mockRead.mockResolvedValue({ resource: undefined });
    const result = await commissionReceivableRepo.getByBookingId('bk-none', 'tech-1');
    expect(result).toBeNull();
    expect(mockItem).toHaveBeenCalledWith('bk-none', 'tech-1');
  });

  it('returns the entry when found', async () => {
    mockRead.mockResolvedValue({ resource: baseDueEntry });
    const result = await commissionReceivableRepo.getByBookingId('bk-001', 'tech-1');
    expect(result).toEqual(baseDueEntry);
  });
});

describe('runLedgerBatch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns ok when every op succeeded', async () => {
    mockBatch.mockResolvedValue({ result: [{ statusCode: 201 }, { statusCode: 200 }] });
    expect(await commissionReceivableRepo.runLedgerBatch('tech-1', [])).toEqual({ ok: true });
  });

  it('maps 409 to CONFLICT and 412 to PRECONDITION (others 424)', async () => {
    mockBatch.mockResolvedValue({ result: [{ statusCode: 409 }, { statusCode: 424 }] });
    expect(await commissionReceivableRepo.runLedgerBatch('tech-1', [])).toEqual({ ok: false, reason: 'CONFLICT' });
    mockBatch.mockResolvedValue({ result: [{ statusCode: 424 }, { statusCode: 412 }] });
    expect(await commissionReceivableRepo.runLedgerBatch('tech-1', [])).toEqual({ ok: false, reason: 'PRECONDITION' });
  });

  it('rethrows batch-level errors', async () => {
    mockBatch.mockRejectedValue(new Error('Batch request error: 429'));
    await expect(commissionReceivableRepo.runLedgerBatch('tech-1', [])).rejects.toThrow(/429/);
  });
});

describe('readLedgerDoc', () => {
  beforeEach(() => vi.clearAllMocks());

  it('point-reads by id scoped to the technician partition', async () => {
    mockRead.mockResolvedValue({ resource: { id: 'rem:k1', docType: 'REMITTANCE', amountPaise: 500 } });
    const doc = await commissionReceivableRepo.readLedgerDoc('tech-1', 'rem:k1');
    expect(mockItem).toHaveBeenCalledWith('rem:k1', 'tech-1');
    expect(doc).toEqual({ id: 'rem:k1', docType: 'REMITTANCE', amountPaise: 500 });
  });

  it('returns null when the doc does not exist', async () => {
    mockRead.mockResolvedValue({ resource: undefined });
    const doc = await commissionReceivableRepo.readLedgerDoc('tech-1', 'rem:missing');
    expect(doc).toBeNull();
  });
});

describe('docType-aware reads', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getOutstandingByTechnician filters RECEIVABLE+DUE and returns etag + outstanding', async () => {
    mockFetchAll.mockResolvedValue({ resources: [{ ...baseDueEntry, _etag: '"e1"', remittedAmount: 1000 }] });
    const rows = await commissionReceivableRepo.getOutstandingByTechnician('tech-1');
    const q = (mockQuery.mock.calls as unknown[][])[0]![0] as { query: string };
    expect(q.query).toMatch(/docType/);
    expect(rows[0]).toMatchObject({ etag: '"e1"', outstandingPaise: 10980 });
  });

  it('getAllByTechnician excludes non-receivable docs in the query', async () => {
    mockFetchAll.mockResolvedValue({ resources: [] });
    await commissionReceivableRepo.getAllByTechnician('tech-1');
    expect(((mockQuery.mock.calls as unknown[][])[0]![0] as { query: string }).query).toMatch(/NOT IS_DEFINED\(c\.docType\) OR c\.docType = 'RECEIVABLE'/);
  });
});

describe('markWaived (batch)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('replaces the row with a WAIVER allocation under ifMatch', async () => {
    mockRead.mockResolvedValue({ resource: baseDueEntry, etag: '"e1"' });
    mockBatch.mockResolvedValue({ result: [{ statusCode: 200 }] });
    const r = await commissionReceivableRepo.markWaived('bk-001', 'tech-1', { waivedReason: 'dispute', markedByAdminId: 'a1' });
    expect(r?.wasApplied).toBe(true);
    const ops = (mockBatch.mock.calls as unknown[][])[0]![0] as Array<{ operationType: string; ifMatch?: string; resourceBody: { remittanceStatus: string } }>;
    expect(ops[0]).toMatchObject({ operationType: 'Replace', ifMatch: '"e1"' });
    expect(ops[0]!.resourceBody.remittanceStatus).toBe('WAIVED');
  });

  it('is a no-op when already settled', async () => {
    mockRead.mockResolvedValue({ resource: { ...baseDueEntry, remittanceStatus: 'REMITTED' }, etag: '"e1"' });
    const r = await commissionReceivableRepo.markWaived('bk-001', 'tech-1', { waivedReason: 'x', markedByAdminId: 'a1' });
    expect(r?.wasApplied).toBe(false);
    expect(mockBatch).not.toHaveBeenCalled();
  });

  it('returns null when entry is missing', async () => {
    mockRead.mockResolvedValue({ resource: undefined });
    const r = await commissionReceivableRepo.markWaived('bk-none', 'tech-1', { waivedReason: 'n/a', markedByAdminId: 'a1' });
    expect(r).toBeNull();
    expect(mockBatch).not.toHaveBeenCalled();
  });
});

describe('sumDueGroupedByTechnician', () => {
  beforeEach(() => vi.clearAllMocks());

  it('groups DUE receivables by technician with the RECEIVABLE filter and correct query options', async () => {
    const groups = [
      { technicianId: 'tech-1', outstandingPaise: 5000, dueCount: 2, oldestDueAt: '2026-05-01T00:00:00.000Z' },
    ];
    mockFetchNext.mockResolvedValue({ resources: groups });

    const result = await commissionReceivableRepo.sumDueGroupedByTechnician();

    const [spec, options] = (mockQuery.mock.calls as unknown[][])[0] as [
      { query: string },
      { maxItemCount: number; continuationToken?: string },
    ];
    expect(spec.query).toMatch(/NOT IS_DEFINED\(c\.docType\) OR c\.docType = 'RECEIVABLE'/);
    expect(spec.query).toMatch(/c\.remittanceStatus = 'DUE'/);
    expect(spec.query).toMatch(/GROUP BY c\.technicianId/);
    expect(options.maxItemCount).toBe(100);
    expect(options.continuationToken).toBeUndefined();
    expect(result).toEqual({ groups });
  });

  it('passes an incoming continuationToken through to the query options and the outgoing one through to the result', async () => {
    mockFetchNext.mockResolvedValue({ resources: [], continuationToken: 'next-token' });

    const result = await commissionReceivableRepo.sumDueGroupedByTechnician('prev-token');

    const [, options] = (mockQuery.mock.calls as unknown[][])[0] as [unknown, { continuationToken?: string }];
    expect(options.continuationToken).toBe('prev-token');
    expect(result).toEqual({ groups: [], continuationToken: 'next-token' });
  });

  it('omits continuationToken from the result when the page has none', async () => {
    mockFetchNext.mockResolvedValue({ resources: [] });

    const result = await commissionReceivableRepo.sumDueGroupedByTechnician();

    expect(result).toEqual({ groups: [] });
    expect('continuationToken' in result).toBe(false);
  });
});

describe('getOpenCredits', () => {
  beforeEach(() => vi.clearAllMocks());

  it('queries CREDIT docs with remainingPaise > 0 and maps _etag to etag, stripped from doc', async () => {
    const creditDoc = {
      id: 'cr:ref-1',
      docType: 'CREDIT' as const,
      technicianId: 'tech-1',
      partitionKey: 'tech-1',
      source: 'OVERPAYMENT' as const,
      refId: 'ref-1',
      originalPaise: 5000,
      remainingPaise: 3000,
      consumedBy: [],
      createdAt: '2026-05-01T00:00:00.000Z',
      _etag: '"e9"',
    };
    mockFetchAll.mockResolvedValue({ resources: [creditDoc] });

    const rows = await commissionReceivableRepo.getOpenCredits('tech-1');

    const q = (mockQuery.mock.calls as unknown[][])[0]![0] as { query: string };
    expect(q.query).toMatch(/c\.docType = 'CREDIT'/);
    expect(q.query).toMatch(/c\.remainingPaise > 0/);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.etag).toBe('"e9"');
    expect(rows[0]!.doc).not.toHaveProperty('_etag');
    expect(rows[0]!.doc.remainingPaise).toBe(3000);
  });

  it('returns empty array when no open credits', async () => {
    mockFetchAll.mockResolvedValue({ resources: [] });
    const rows = await commissionReceivableRepo.getOpenCredits('tech-1');
    expect(rows).toEqual([]);
  });
});

describe('listLedger', () => {
  beforeEach(() => vi.clearAllMocks());

  it('partitions resources by docType — absent docType is RECEIVABLE, unknown types are ignored', async () => {
    const receivable = { ...baseDueEntry }; // no docType => RECEIVABLE
    const remittance = {
      id: 'rem:idem-1',
      docType: 'REMITTANCE',
      technicianId: 'tech-1',
      partitionKey: 'tech-1',
      amountPaise: 10000,
      method: 'UPI',
      ref: 'ref-1',
      allocations: [],
      creditCreatedPaise: 0,
      recordedByAdminId: 'admin-1',
      idempotencyKey: 'idem-1',
      createdAt: '2026-05-01T00:00:00.000Z',
    };
    const credit = {
      id: 'cr:ref-2',
      docType: 'CREDIT',
      technicianId: 'tech-1',
      partitionKey: 'tech-1',
      source: 'OVERPAYMENT',
      refId: 'ref-2',
      originalPaise: 2000,
      remainingPaise: 2000,
      consumedBy: [],
      createdAt: '2026-05-01T00:00:00.000Z',
    };
    const award = { id: 'award-1', docType: 'INCENTIVE_AWARD', technicianId: 'tech-1', partitionKey: 'tech-1' };
    mockFetchAll.mockResolvedValue({ resources: [receivable, remittance, credit, award] });

    const result = await commissionReceivableRepo.listLedger('tech-1');

    expect(result.receivables).toEqual([receivable]);
    expect(result.remittances).toEqual([remittance]);
    expect(result.credits).toEqual([credit]);
    const allReturned = [...result.receivables, ...result.remittances, ...result.credits];
    expect(allReturned).toHaveLength(3);
    expect(allReturned).not.toContainEqual(award);
  });
});
