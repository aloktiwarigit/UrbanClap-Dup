/**
 * E21-S04 — the roster/aggregate computation shared by the reconciler (which writes
 * `system/hold-reconciliation-summary`) and the admin dashboard (which falls back to computing
 * it live). Extracted verbatim from the E21-S02 dashboard handler so the two paths cannot drift:
 * a divergence here would show the owner different money on consecutive page loads.
 *
 * Pure. No I/O, no mutation of its inputs.
 */
import type { HoldSummaryRow } from '../schemas/hold-reconciliation-summary.js';
import type { CommissionHold } from '../schemas/technician.js';

export interface HoldRosterInput {
  id: string;
  name?: string;
  commissionHold: CommissionHold;
}

export function buildHoldRoster(
  allWithHold: HoldRosterInput[],
  dueGroups: Array<{ technicianId: string; outstandingPaise: number }>,
): { rows: HoldSummaryRow[]; totalOutstandingPaise: number; unreconciledTechnicianCount: number } {
  const dueById = new Map(dueGroups.map((g) => [g.technicianId, g.outstandingPaise]));
  const holdById = new Map(allWithHold.map((t) => [t.id, t.commissionHold]));

  // Two-direction union: a DUE group whose cached hold disagrees (or is missing entirely), AND a
  // non-zero cached hold with no DUE group left (e.g. every row was waived or remitted elsewhere
  // and the hold write never landed).
  const unreconciled = new Set<string>();
  for (const g of dueGroups) {
    const h = holdById.get(g.technicianId);
    if (!h || h.outstandingPaise !== g.outstandingPaise) unreconciled.add(g.technicianId);
  }
  for (const t of allWithHold) {
    if (!dueById.has(t.id) && t.commissionHold.outstandingPaise !== 0) unreconciled.add(t.id);
  }

  // One contribution per technician. The cached hold is preferred because it is the same source
  // the rows display; a technician present only in the DUE aggregate (hold write not landed yet)
  // falls back to that aggregate so their balance is not silently dropped from the headline.
  const seen = new Set<string>();
  let totalOutstandingPaise = 0;
  for (const t of allWithHold) {
    seen.add(t.id);
    totalOutstandingPaise += t.commissionHold.outstandingPaise;
  }
  for (const g of dueGroups) {
    if (!seen.has(g.technicianId)) totalOutstandingPaise += g.outstandingPaise;
  }

  const rows: HoldSummaryRow[] = [...allWithHold]
    .sort((a, b) => b.commissionHold.outstandingPaise - a.commissionHold.outstandingPaise)
    .map((t) => ({
      technicianId: t.id,
      ...(t.name !== undefined ? { technicianName: t.name } : {}),
      outstandingPaise: t.commissionHold.outstandingPaise,
      dueCount: t.commissionHold.dueCount,
      ...(t.commissionHold.oldestDueAt !== undefined ? { oldestDueAt: t.commissionHold.oldestDueAt } : {}),
      state: t.commissionHold.state,
      evaluatedAt: t.commissionHold.evaluatedAt,
      ...(t.commissionHold.override !== undefined ? { override: t.commissionHold.override } : {}),
    }));

  return { rows, totalOutstandingPaise, unreconciledTechnicianCount: unreconciled.size };
}
