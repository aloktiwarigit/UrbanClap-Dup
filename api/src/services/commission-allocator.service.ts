import type { Allocation, CommissionReceivableEntry, RemittanceStatus } from '../schemas/commission-receivable.js';

export type OutstandingRow = { entry: CommissionReceivableEntry; etag: string; outstandingPaise: number };

export type AllocationPlan = { allocations: Array<{ bookingId: string; paise: number }>; leftoverPaise: number };

export const MAX_ALLOCATION_ROWS = 98; // 100-op batch limit minus anchor doc and optional credit doc

export function allocateOldestFirst(rows: OutstandingRow[], paise: number, maxRows = MAX_ALLOCATION_ROWS): AllocationPlan {
  const sorted = [...rows].filter((r) => r.outstandingPaise > 0)
    .sort((a, b) => (a.entry.createdAt < b.entry.createdAt ? -1 : a.entry.createdAt > b.entry.createdAt ? 1 : a.entry.bookingId.localeCompare(b.entry.bookingId)));
  const allocations: Array<{ bookingId: string; paise: number }> = [];
  let remaining = paise;
  for (const row of sorted) {
    if (remaining <= 0 || allocations.length >= maxRows) break;
    const take = Math.min(remaining, row.outstandingPaise);
    allocations.push({ bookingId: row.entry.bookingId, paise: take });
    remaining -= take;
  }
  return { allocations, leftoverPaise: remaining };
}

export function deriveStatus(e: Pick<CommissionReceivableEntry, 'commissionDue' | 'allocations' | 'remittanceStatus'>): RemittanceStatus {
  const allocs = e.allocations ?? [];
  if (allocs.some((a) => a.source === 'WAIVER')) return 'WAIVED';
  const paid = allocs.reduce((s, a) => s + a.paise, 0);
  return paid >= e.commissionDue ? 'REMITTED' : 'DUE';
}

/** Idempotent merge: same allocation id twice is a no-op. All derived fields recomputed absolutely. */
export function mergeAllocation(entry: CommissionReceivableEntry, alloc: Allocation): CommissionReceivableEntry {
  const existing = entry.allocations ?? [];
  // Early return if this allocation is already present (replay safety)
  if (existing.some((a) => a.id === alloc.id)) return entry;

  const allocations = [...existing, alloc];
  const remittedAmount = allocations.filter((a) => a.source !== 'WAIVER').reduce((s, a) => s + a.paise, 0);
  const next: CommissionReceivableEntry = { ...entry, allocations, remittedAmount, updatedAt: alloc.appliedAt };
  const status = deriveStatus(next);
  return {
    ...next,
    remittanceStatus: status,
    ...(status === 'REMITTED' && !entry.remittedAt ? { remittedAt: alloc.appliedAt } : {}),
    ...(alloc.source === 'WAIVER' ? { waivedReason: entry.waivedReason ?? alloc.refId, markedByAdminId: alloc.byId } : {}),
  };
}
