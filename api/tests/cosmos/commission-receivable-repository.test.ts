import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CommissionReceivableEntry } from '../../src/schemas/commission-receivable.js';

// --- Mocks ---
const mockCreate = vi.fn();
const mockReplace = vi.fn();
const mockRead = vi.fn();
const mockItem = vi.fn(() => ({ read: mockRead, replace: mockReplace }));
const mockFetchAll = vi.fn();
const mockQuery = vi.fn(() => ({ fetchAll: mockFetchAll }));

vi.mock('../../src/cosmos/client.js', () => ({
  getCommissionReceivablesContainer: () => ({
    items: { create: mockCreate, query: mockQuery },
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

describe('commissionReceivableRepo.markRemitted', () => {
  beforeEach(() => vi.clearAllMocks());

  it('transitions DUE → REMITTED and returns updated entry', async () => {
    mockRead.mockResolvedValue({ resource: { ...baseDueEntry } });
    mockReplace.mockResolvedValue({});
    const result = await commissionReceivableRepo.markRemitted('bk-001', 'tech-1', {
      remittedAmount: 11980,
      remittanceMethod: 'UPI',
      remittanceRef: 'upi-txn-42',
      markedByAdminId: 'admin-7',
    });
    expect(result).not.toBeNull();
    expect(result!.remittanceStatus).toBe('REMITTED');
    expect(result!.remittedAmount).toBe(11980);
    expect(result!.remittanceMethod).toBe('UPI');
    expect(result!.remittanceRef).toBe('upi-txn-42');
    expect(result!.markedByAdminId).toBe('admin-7');
    expect(result!.remittedAt).toBeDefined();
    expect(result!.updatedAt).toBeDefined();
    expect(mockReplace).toHaveBeenCalledOnce();
  });

  it('is idempotent: returns unchanged entry when already REMITTED', async () => {
    const alreadyRemitted: CommissionReceivableEntry = {
      ...baseDueEntry,
      remittanceStatus: 'REMITTED',
      remittedAmount: 11980,
      remittanceMethod: 'UPI',
      remittanceRef: 'upi-txn-42',
    };
    mockRead.mockResolvedValue({ resource: alreadyRemitted });
    const result = await commissionReceivableRepo.markRemitted('bk-001', 'tech-1', {
      remittedAmount: 11980,
      remittanceMethod: 'CASH_DEPOSIT',
      remittanceRef: 'different-ref',
      markedByAdminId: 'admin-9',
    });
    expect(result).toEqual(alreadyRemitted);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('is idempotent: returns unchanged entry when already WAIVED', async () => {
    const waived: CommissionReceivableEntry = {
      ...baseDueEntry,
      remittanceStatus: 'WAIVED',
      waivedReason: 'goodwill',
    };
    mockRead.mockResolvedValue({ resource: waived });
    const result = await commissionReceivableRepo.markRemitted('bk-001', 'tech-1', {
      remittedAmount: 0,
      remittanceMethod: 'ADJUSTMENT',
      remittanceRef: 'adj-1',
      markedByAdminId: 'admin-1',
    });
    expect(result).toEqual(waived);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('returns null when entry is missing', async () => {
    mockRead.mockResolvedValue({ resource: undefined });
    const result = await commissionReceivableRepo.markRemitted('bk-none', 'tech-1', {
      remittedAmount: 100,
      remittanceMethod: 'UPI',
      remittanceRef: 'ref-1',
      markedByAdminId: 'admin-1',
    });
    expect(result).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe('commissionReceivableRepo.markWaived', () => {
  beforeEach(() => vi.clearAllMocks());

  it('transitions DUE → WAIVED and returns updated entry', async () => {
    mockRead.mockResolvedValue({ resource: { ...baseDueEntry } });
    mockReplace.mockResolvedValue({});
    const result = await commissionReceivableRepo.markWaived('bk-001', 'tech-1', {
      waivedReason: 'first-time goodwill',
      markedByAdminId: 'admin-7',
    });
    expect(result).not.toBeNull();
    expect(result!.remittanceStatus).toBe('WAIVED');
    expect(result!.waivedReason).toBe('first-time goodwill');
    expect(result!.markedByAdminId).toBe('admin-7');
    expect(result!.updatedAt).toBeDefined();
    expect(mockReplace).toHaveBeenCalledOnce();
  });

  it('is idempotent: returns unchanged entry when already WAIVED', async () => {
    const alreadyWaived: CommissionReceivableEntry = {
      ...baseDueEntry,
      remittanceStatus: 'WAIVED',
      waivedReason: 'original',
    };
    mockRead.mockResolvedValue({ resource: alreadyWaived });
    const result = await commissionReceivableRepo.markWaived('bk-001', 'tech-1', {
      waivedReason: 'new reason',
      markedByAdminId: 'admin-5',
    });
    expect(result).toEqual(alreadyWaived);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('returns null when entry is missing', async () => {
    mockRead.mockResolvedValue({ resource: undefined });
    const result = await commissionReceivableRepo.markWaived('bk-none', 'tech-1', {
      waivedReason: 'n/a',
      markedByAdminId: 'admin-1',
    });
    expect(result).toBeNull();
  });
});

describe('commissionReceivableRepo.getOutstandingByTechnician', () => {
  beforeEach(() => vi.clearAllMocks());

  it('queries only DUE entries within the technician partition', async () => {
    const dueEntry = { ...baseDueEntry };
    mockFetchAll.mockResolvedValue({ resources: [dueEntry] });

    const results = await commissionReceivableRepo.getOutstandingByTechnician('tech-1');

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(dueEntry);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.stringContaining("remittanceStatus = 'DUE'") }),
      { partitionKey: 'tech-1' },
    );
  });

  it('returns empty array when no DUE entries', async () => {
    mockFetchAll.mockResolvedValue({ resources: [] });
    const results = await commissionReceivableRepo.getOutstandingByTechnician('tech-2');
    expect(results).toHaveLength(0);
  });
});

describe('commissionReceivableRepo.getAllTechnicianOutstandingSummaries', () => {
  beforeEach(() => vi.clearAllMocks());

  it('groups entries by technicianId with correct sums and oldestDueAt', async () => {
    const entries: CommissionReceivableEntry[] = [
      { ...baseDueEntry, bookingId: 'bk-001', id: 'bk-001', technicianId: 'tech-A', partitionKey: 'tech-A', commissionDue: 5000, createdAt: '2026-05-01T08:00:00.000Z' },
      { ...baseDueEntry, bookingId: 'bk-002', id: 'bk-002', technicianId: 'tech-A', partitionKey: 'tech-A', commissionDue: 3000, createdAt: '2026-05-03T08:00:00.000Z' },
      { ...baseDueEntry, bookingId: 'bk-003', id: 'bk-003', technicianId: 'tech-B', partitionKey: 'tech-B', commissionDue: 7000, createdAt: '2026-05-02T08:00:00.000Z' },
    ];
    mockFetchAll.mockResolvedValue({ resources: entries });

    const summaries = await commissionReceivableRepo.getAllTechnicianOutstandingSummaries();

    expect(summaries).toHaveLength(2);

    const techA = summaries.find((s) => s.technicianId === 'tech-A');
    expect(techA).toBeDefined();
    expect(techA!.dueCount).toBe(2);
    expect(techA!.totalCommissionDue).toBe(8000);
    expect(techA!.oldestDueAt).toBe('2026-05-01T08:00:00.000Z');

    const techB = summaries.find((s) => s.technicianId === 'tech-B');
    expect(techB).toBeDefined();
    expect(techB!.dueCount).toBe(1);
    expect(techB!.totalCommissionDue).toBe(7000);
    expect(techB!.oldestDueAt).toBe('2026-05-02T08:00:00.000Z');
  });

  it('returns empty array when no DUE entries exist', async () => {
    mockFetchAll.mockResolvedValue({ resources: [] });
    const summaries = await commissionReceivableRepo.getAllTechnicianOutstandingSummaries();
    expect(summaries).toHaveLength(0);
  });

  it('correctly picks oldestDueAt (min createdAt) across multiple entries', async () => {
    const entries: CommissionReceivableEntry[] = [
      { ...baseDueEntry, bookingId: 'bk-10', id: 'bk-10', technicianId: 'tech-C', partitionKey: 'tech-C', commissionDue: 1000, createdAt: '2026-05-10T00:00:00.000Z' },
      { ...baseDueEntry, bookingId: 'bk-11', id: 'bk-11', technicianId: 'tech-C', partitionKey: 'tech-C', commissionDue: 2000, createdAt: '2026-04-01T00:00:00.000Z' },
      { ...baseDueEntry, bookingId: 'bk-12', id: 'bk-12', technicianId: 'tech-C', partitionKey: 'tech-C', commissionDue: 500, createdAt: '2026-05-20T00:00:00.000Z' },
    ];
    mockFetchAll.mockResolvedValue({ resources: entries });

    const summaries = await commissionReceivableRepo.getAllTechnicianOutstandingSummaries();
    expect(summaries).toHaveLength(1);
    expect(summaries[0]!.oldestDueAt).toBe('2026-04-01T00:00:00.000Z');
    expect(summaries[0]!.totalCommissionDue).toBe(3500);
    expect(summaries[0]!.dueCount).toBe(3);
  });
});
