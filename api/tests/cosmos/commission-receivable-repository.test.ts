import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CommissionReceivableEntry } from '../../src/schemas/commission-receivable.js';

// --- Mocks ---
const mockCreate = vi.fn();
const mockRead = vi.fn();
const mockBatch = vi.fn();
const mockItem = vi.fn(() => ({ read: mockRead }));
const mockFetchAll = vi.fn();
const mockQuery = vi.fn(() => ({ fetchAll: mockFetchAll }));

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
