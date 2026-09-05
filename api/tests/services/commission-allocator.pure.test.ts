import { describe, it, expect } from 'vitest';
import { allocateOldestFirst, mergeAllocation, deriveStatus, type OutstandingRow } from '../../src/services/commission-allocator.service.js';
import type { CommissionReceivableEntry } from '../../src/schemas/commission-receivable.js';

const mk = (id: string, due: number, createdAt: string, remitted = 0): OutstandingRow => ({
  entry: { id, bookingId: id, technicianId: 't1', partitionKey: 't1', serviceId: 's', categoryId: 'c', bookingAmount: due * 5,
    commissionBps: 2000, commissionDue: due, commissionResolvedFrom: 'GLOBAL', remittanceStatus: 'DUE', createdAt,
    ...(remitted ? { remittedAmount: remitted } : {}) } as CommissionReceivableEntry,
  etag: `"${id}"`, outstandingPaise: due - remitted,
});

describe('allocateOldestFirst', () => {
  it('fills oldest rows first, partial on the last, leftover 0', () => {
    const r = allocateOldestFirst([mk('b2', 300, '2026-09-02'), mk('b1', 200, '2026-09-01')], 400);
    expect(r.allocations).toEqual([{ bookingId: 'b1', paise: 200 }, { bookingId: 'b2', paise: 200 }]);
    expect(r.leftoverPaise).toBe(0);
  });
  it('returns leftover when paying more than outstanding', () => {
    expect(allocateOldestFirst([mk('b1', 200, '2026-09-01')], 250)).toEqual({ allocations: [{ bookingId: 'b1', paise: 200 }], leftoverPaise: 50 });
  });
  it('caps per row at current outstanding and skips zero rows', () => {
    expect(allocateOldestFirst([mk('b1', 200, '2026-09-01', 200), mk('b2', 100, '2026-09-02')], 100).allocations).toEqual([{ bookingId: 'b2', paise: 100 }]);
  });
  it('stops at maxRows and carries the rest as leftover', () => {
    const rows = Array.from({ length: 100 }, (_, i) => mk(`b${i}`, 10, `2026-01-${String(i % 28 + 1).padStart(2, '0')}T00:00:00.${String(i).padStart(3, '0')}Z`));
    const r = allocateOldestFirst(rows, 1000, 98);
    expect(r.allocations).toHaveLength(98);
    expect(r.leftoverPaise).toBe(20);
  });
});

describe('mergeAllocation / deriveStatus', () => {
  const alloc = { id: 'rem:k:b1', source: 'REMITTANCE' as const, refId: 'rem:k', paise: 150, appliedAt: 'now', byId: 'a1' };
  it('appends once, recomputes remittedAmount absolutely, flips to REMITTED at zero', () => {
    const once = mergeAllocation(mk('b1', 200, '2026-09-01').entry, alloc);
    const twice = mergeAllocation(once, alloc);
    expect(twice.allocations).toHaveLength(1);
    expect(twice.remittedAmount).toBe(150);
    expect(twice.remittanceStatus).toBe('DUE');
    const done = mergeAllocation(twice, { ...alloc, id: 'rem:k2:b1', refId: 'rem:k2', paise: 50 });
    expect(done.remittedAmount).toBe(200);
    expect(deriveStatus(done)).toBe('REMITTED');
  });
  it('WAIVER allocation makes the row WAIVED regardless of amount', () => {
    const w = mergeAllocation(mk('b1', 200, '2026-09-01').entry, { ...alloc, id: 'w:b1', source: 'WAIVER', paise: 200 });
    expect(w.remittanceStatus).toBe('WAIVED');
  });
});
