import type { OperationInput } from '@azure/cosmos';
import type { Allocation, CommissionReceivableEntry, RemittanceStatus } from '../schemas/commission-receivable.js';
import { commissionReceivableRepo } from '../cosmos/commission-receivable-repository.js';
import { allocationId, creditDocId, type CreditDoc } from '../schemas/commission-ledger.js';

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

export type ApplyCreditInput = {
  technicianId: string;
  refId: string;
  source: 'REMITTANCE' | 'INCENTIVE';
  paise: number;
  byId: string;
  /** Deterministic anchor document created in the same batch; its 409 is the replay signal.
   *  `build` receives the final plan so the anchor can embed it (a remittance receipt lists its allocations).
   *  `matches` validates a replayed CONFLICT against the request (idempotency-key mismatch guard);
   *  the default is FAIL-CLOSED — it requires `existing.amountPaise` to be a number equal to
   *  `input.paise`, and rejects (IDEMPOTENCY_MISMATCH) on anything else, including it being absent
   *  or non-numeric. Any anchor type that does not carry `amountPaise` MUST supply its own `matches`. */
  anchor: { id: string; build: (plan: AllocationPlan) => Record<string, unknown>; matches?: (existing: Record<string, unknown>) => boolean };
};
export type ApplyCreditResult =
  | { replayed: true; anchorId: string }
  | { replayed: false; anchorId: string; allocations: Array<{ bookingId: string; paise: number }>; creditCreatedPaise: number };

const MAX_ATTEMPTS = 3;

/**
 * Single-partition transactional batch per attempt: [anchor create, replace per allocated row,
 * optional credit create]. The anchor's deterministic id makes a replayed call surface as a 409
 * on the FIRST op — detected before any row is touched, so a replay is a true no-op. A concurrent
 * edit on any row surfaces as a 412 across the whole batch (Cosmos batches are all-or-nothing),
 * which we treat as "re-read and re-plan", never as partial application.
 */
export async function applyCredit(input: ApplyCreditInput): Promise<ApplyCreditResult> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const rows = await commissionReceivableRepo.getOutstandingByTechnician(input.technicianId);
    const plan = allocateOldestFirst(rows, input.paise);
    const now = new Date().toISOString();
    const byBooking = new Map(rows.map((r) => [r.entry.bookingId, r]));
    const ops: OperationInput[] = [{ operationType: 'Create', resourceBody: input.anchor.build(plan) as never }];
    for (const a of plan.allocations) {
      const row = byBooking.get(a.bookingId)!;
      const merged = mergeAllocation(row.entry, {
        id: allocationId(input.refId, a.bookingId),
        source: input.source,
        refId: input.refId,
        paise: a.paise,
        appliedAt: now,
        byId: input.byId,
      });
      ops.push({ operationType: 'Replace', id: a.bookingId, ifMatch: row.etag, resourceBody: merged as never });
    }
    if (plan.leftoverPaise > 0) {
      const credit: CreditDoc = {
        id: creditDocId(input.refId),
        docType: 'CREDIT',
        technicianId: input.technicianId,
        partitionKey: input.technicianId,
        source: input.source === 'REMITTANCE' ? 'OVERPAYMENT' : 'INCENTIVE',
        refId: input.refId,
        originalPaise: plan.leftoverPaise,
        remainingPaise: plan.leftoverPaise,
        consumedBy: [],
        createdAt: now,
      };
      ops.push({ operationType: 'Create', resourceBody: credit as never });
    }
    const res = await commissionReceivableRepo.runLedgerBatch(input.technicianId, ops);
    if (res.ok) {
      return { replayed: false, anchorId: input.anchor.id, allocations: plan.allocations, creditCreatedPaise: plan.leftoverPaise };
    }
    if (res.reason === 'CONFLICT') {
      // A 409 on this batch only PROVES the anchor's deterministic id already exists if we can
      // read it back — the credit doc's Create op can also 409 on a rare id race. Never trust a
      // bare CONFLICT as "this was a replay" without confirming it's the anchor.
      const existing = await commissionReceivableRepo.readLedgerDoc<Record<string, unknown>>(input.technicianId, input.anchor.id);
      if (existing) {
        // Fail-closed default: an anchor type without a numeric amountPaise MUST supply `matches`.
        const matches = input.anchor.matches
          ? input.anchor.matches(existing)
          : typeof existing['amountPaise'] === 'number' && existing['amountPaise'] === input.paise;
        if (!matches) {
          throw Object.assign(new Error('IDEMPOTENCY_MISMATCH'), { code: 'IDEMPOTENCY_MISMATCH', anchorId: input.anchor.id });
        }
        return { replayed: true, anchorId: input.anchor.id };
      }
      // Anchor is NOT the doc that conflicted (e.g. the credit doc raced) — this wasn't a replay,
      // it's a concurrent-edit race. Re-read fresh rows/etags and re-plan, same as PRECONDITION.
      if (attempt === MAX_ATTEMPTS) {
        throw Object.assign(new Error('ledger PRECONDITION after retries'), { code: 'PRECONDITION' });
      }
      continue;
    }
    // PRECONDITION: some row moved under us — re-read fresh rows and re-plan.
    if (attempt === MAX_ATTEMPTS) {
      throw Object.assign(new Error('ledger PRECONDITION after retries'), { code: 'PRECONDITION' });
    }
  }
  throw new Error('unreachable');
}

/**
 * Applies every open credit (oldest-first) against the technician's current DUE rows. Each credit
 * is driven to exhaustion — remainingPaise === 0, or no DUE row has outstanding > 0 — via
 * however many single-partition batches that takes (bounded by MAX_ALLOCATION_ROWS+1 rows per
 * batch), BEFORE moving on to the next credit; a newer credit must never see a batch while an
 * older one still has remainingPaise > 0 and DUE rows exist to consume it against. Each batch
 * attempt gets its own ≤3-try PRECONDITION-retry budget; a CONFLICT or an exhausted retry budget
 * abandons that credit (never throws) so one stuck credit cannot block the others — the caller can
 * re-run consumePendingCredits later.
 */
export async function consumePendingCredits(technicianId: string): Promise<{ consumedPaise: number }> {
  let consumed = 0;
  const credits = (await commissionReceivableRepo.getOpenCredits(technicianId))
    .sort((a, b) => a.doc.createdAt.localeCompare(b.doc.createdAt));

  for (const initial of credits) {
    let doc = initial.doc;
    let etag = initial.etag;

    // Drive THIS credit to exhaustion before moving to the next one.
    while (doc.remainingPaise > 0) {
      let progressed = false;
      let stopAll = false;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const rows = await commissionReceivableRepo.getOutstandingByTechnician(technicianId);
        if (rows.every((r) => r.outstandingPaise === 0)) { stopAll = true; break; } // no DUE rows left for anyone
        const plan = allocateOldestFirst(rows, doc.remainingPaise, MAX_ALLOCATION_ROWS + 1);
        if (plan.allocations.length === 0) break; // nothing allocatable; give up on this credit

        const now = new Date().toISOString();
        const consumedBy = [
          ...doc.consumedBy,
          ...plan.allocations.map((a) => ({ bookingId: a.bookingId, paise: a.paise, appliedAt: now })),
        ];
        const remainingPaise = doc.originalPaise - consumedBy.reduce((s, c) => s + c.paise, 0); // absolute recompute
        const ops: OperationInput[] = [
          { operationType: 'Replace', id: doc.id, ifMatch: etag, resourceBody: { ...doc, consumedBy, remainingPaise, updatedAt: now } as never },
        ];
        const byBooking = new Map(rows.map((r) => [r.entry.bookingId, r]));
        for (const a of plan.allocations) {
          const row = byBooking.get(a.bookingId)!;
          const source = doc.source === 'INCENTIVE' ? 'INCENTIVE' : 'REMITTANCE';
          ops.push({
            operationType: 'Replace',
            id: a.bookingId,
            ifMatch: row.etag,
            resourceBody: mergeAllocation(row.entry, {
              id: allocationId(doc.id, a.bookingId),
              source,
              refId: doc.id,
              paise: a.paise,
              appliedAt: now,
              byId: 'system:credit',
            }) as never,
          });
        }

        const res = await commissionReceivableRepo.runLedgerBatch(technicianId, ops);
        if (res.ok) {
          consumed += plan.allocations.reduce((s, a) => s + a.paise, 0);
          doc = { ...doc, consumedBy, remainingPaise, updatedAt: now };
          progressed = true;
          if (remainingPaise > 0) {
            // More to consume on THIS credit — refresh its doc/etag before the next batch so the
            // next Replace carries a live etag (our own write above just moved it).
            const fresh = (await commissionReceivableRepo.getOpenCredits(technicianId)).find((c) => c.doc.id === doc.id);
            if (fresh) { doc = fresh.doc; etag = fresh.etag; } else { doc = { ...doc, remainingPaise: 0 }; }
          }
          break;
        }
        // CONFLICT: abandon this credit, never throw.
        if (res.reason === 'CONFLICT') break;
        // PRECONDITION: something (the credit doc or a row) moved under us.
        if (attempt === MAX_ATTEMPTS) break; // retries exhausted for this batch attempt — abandon this credit
        const fresh = (await commissionReceivableRepo.getOpenCredits(technicianId)).find((c) => c.doc.id === doc.id);
        if (fresh) { doc = fresh.doc; etag = fresh.etag; } else { break; } // credit was fully consumed/removed elsewhere
      }

      if (stopAll) return { consumedPaise: consumed }; // no DUE rows anywhere; nothing left for any credit
      if (!progressed) break; // CONFLICT / retries exhausted / nothing allocatable — move to next credit
      // else: this credit made progress; the while-condition re-checks doc.remainingPaise
    }
  }
  return { consumedPaise: consumed };
}
