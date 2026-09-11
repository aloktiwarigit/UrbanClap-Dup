// api/src/services/incentive.service.ts
import * as Sentry from '@sentry/node';
import type { EffectiveIncentiveConfig, IncentiveAwardStatus, Milestone } from '../schemas/incentive.js';
import { IncentiveAwardWriteSchema, incentiveAwardId, type IncentiveAwardDoc } from '../schemas/incentive.js';
import { applyCredit, consumePendingCredits, type AllocationPlan } from './commission-allocator.service.js';
import { recomputeCommissionHold } from './commission-hold.service.js';
import { systemDocsRepo } from '../cosmos/system-docs-repository.js';
import { incentiveRepo } from '../cosmos/incentive-repository.js';
import { commissionReceivableRepo } from '../cosmos/commission-receivable-repository.js';
import { creditDocId } from '../schemas/commission-ledger.js';
import { istWeekBounds } from '../lib/ist-time.js';
import { systemAudit } from './auditLog.service.js';
// Self-import: gives `_internal.applyAward` below a handle on this module's OWN namespace object
// rather than the closure-scoped local binding. A lexical reference to `applyAward` inside this
// file always resolves to the local function — no getter or object-literal wrapper around it
// changes that, because TS/esbuild output keeps same-module calls as plain variable reads, not
// property reads. Routing through the self-imported namespace instead makes the call a genuine
// property access on the object `vi.spyOn(incentive, 'applyAward')` mutates in tests, so the spy
// is actually observed. Safe because it is only dereferenced inside function bodies invoked after
// the module has fully evaluated, never at module top level.
import * as incentiveService from './incentive.service.js';

/**
 * The subset of a commission receivable the weekly rule reads.
 *
 * There is deliberately NO `remittanceStatus` field. A WAIVED receivable still counts — the
 * technician did the job; an admin forgiving the commission afterwards is a separate decision
 * (spec §7.8). Keeping status out of the input type makes that invariant structural rather than
 * a comment someone can delete.
 */
export type WeekCountableReceivable = {
  bookingId: string; bookingAmount: number; commissionDue: number; createdAt: string;
};

export type ComputeWeekResult = {
  countedJobs: number; countedCommissionPaise: number; reachedMilestone?: Milestone;
  grossBonusPaise: number; capPaise: number; awardedPaise: number;
};

export type ComputeWeekInput = {
  /** EVERY receivable for the technician, any status, any week. Filtering happens here. */
  receivables: readonly WeekCountableReceivable[];
  /** Monday 00:00 IST as a UTC instant (inclusive). */
  startUtc: Date;
  /** The NEXT Monday 00:00 IST as a UTC instant (exclusive). */
  endUtc: Date;
  cfg: Pick<EffectiveIncentiveConfig, 'milestones' | 'capFractionBps' | 'minCountableBookingPaise'>;
};

/**
 * Pure. Two independent anti-gaming guards, both admin-editable (spec §2 item 4):
 *
 *  - `minCountableBookingPaise` keeps cheap phantom bookings out of BOTH the job count and the
 *    commission base, so padding the count is not even free.
 *  - `capFractionBps` limits the bonus to a fraction of the commission actually generated that
 *    week. Self-limiting: topping up with cheap jobs raises the commission base more slowly than
 *    it raises the bonus, so the cap bites in exactly the case that would otherwise pay — with
 *    no fraud heuristics and no false positives against ten genuine jobs.
 */
export function computeWeek(input: ComputeWeekInput): ComputeWeekResult {
  const from = input.startUtc.getTime();
  const to = input.endUtc.getTime();
  const counted = input.receivables.filter((r) => {
    const t = new Date(r.createdAt).getTime();
    return t >= from && t < to && r.bookingAmount >= input.cfg.minCountableBookingPaise;
  });

  const countedJobs = counted.length;
  const countedCommissionPaise = counted.reduce((s, r) => s + r.commissionDue, 0);
  // Highest milestone reached, never the sum. Re-sorting a copy keeps this function total.
  const reachedMilestone = [...input.cfg.milestones]
    .sort((a, b) => a.jobs - b.jobs)
    .filter((m) => m.jobs <= countedJobs)
    .pop();

  const grossBonusPaise = reachedMilestone?.bonusPaise ?? 0;
  // floor, never round: the platform must never over-credit by a rounding paisa.
  const capPaise = Math.floor((countedCommissionPaise * input.cfg.capFractionBps) / 10_000);

  return {
    countedJobs, countedCommissionPaise,
    ...(reachedMilestone ? { reachedMilestone } : {}),
    grossBonusPaise, capPaise,
    awardedPaise: Math.min(grossBonusPaise, capPaise),
  };
}

/** Pure. `appliedPaise` is always recomputed absolutely before this is called (spec §3.2). */
export function deriveAwardStatus(awardedPaise: number, appliedPaise: number): IncentiveAwardStatus {
  if (appliedPaise <= 0) return 'AWARDED';
  return appliedPaise >= awardedPaise ? 'APPLIED' : 'PARTIAL';
}

export type ApplyAwardResult = { technicianId: string; weekKey: string } & (
  | { outcome: 'NO_AWARD'; computed: ComputeWeekResult }
  | { outcome: 'AWARDED'; awardId: string; awardedPaise: number;
      allocations: Array<{ bookingId: string; paise: number }>;
      creditCreatedPaise: number; holdRecomputePending: boolean }
  | { outcome: 'REPLAYED'; awardId: string }
);

export type ApplyAwardInput = {
  technicianId: string;
  weekKey: string;
  cfg: EffectiveIncentiveConfig;
  /** EVERY receivable for this technician (any status, any week). computeWeek filters. */
  receivables: readonly WeekCountableReceivable[];
  byId: string;
};

/**
 * Awards one technician one IST week, applying the bonus as CREDIT against outstanding
 * commission — never as cash.
 *
 * The award document is handed to the E21-S02 allocator as its `anchor`, so the whole thing is
 * ONE single-partition Cosmos TransactionalBatch: [create award, replace each allocated
 * receivable under its etag, optionally create the leftover CREDIT]. Four properties fall out
 * of that for free rather than being re-implemented here:
 *
 *  - Idempotency: the award id is deterministic, so a replayed run 409s on op 0 before any row
 *    is touched and returns REPLAYED.
 *  - Atomicity: batches are all-or-nothing; a mid-flight crash applies everything or nothing.
 *  - Concurrency: a row moving under us surfaces as a 412 across the batch and the allocator
 *    re-reads and re-plans.
 *  - No remittance document: there is exactly one anchor per call and ours is the award, so a
 *    credit can never masquerade as cash the technician handed over.
 *
 * A zero award is never written at all: no document, no audit entry, no P&L line.
 */
export async function applyAward(input: ApplyAwardInput): Promise<ApplyAwardResult> {
  const { technicianId, weekKey } = input;
  const { weekStart, weekEnd, startUtc, endUtc } = istWeekBounds(weekKey);
  const computed = computeWeek({ receivables: input.receivables, startUtc, endUtc, cfg: input.cfg });
  if (computed.awardedPaise <= 0) return { technicianId, weekKey, outcome: 'NO_AWARD', computed };

  const awardId = incentiveAwardId(technicianId, weekKey);
  const computedAt = new Date().toISOString();

  const build = (plan: AllocationPlan): Record<string, unknown> => {
    const appliedPaise = plan.allocations.reduce((s, a) => s + a.paise, 0);
    // IncentiveAwardWriteSchema is `.strict()`: a payout-shaped field added here in a future
    // edit throws before it can ever reach Cosmos. That is the structural half of credit-only.
    const doc: IncentiveAwardDoc = IncentiveAwardWriteSchema.parse({
      id: awardId, docType: 'INCENTIVE_AWARD', technicianId, partitionKey: technicianId,
      weekKey, weekStart, weekEnd,
      countedJobs: computed.countedJobs,
      countedCommissionPaise: computed.countedCommissionPaise,
      milestoneSnapshot: input.cfg.milestones,                       // spec §3.5 snapshot
      capFractionBpsSnapshot: input.cfg.capFractionBps,
      minCountableBookingPaiseSnapshot: input.cfg.minCountableBookingPaise,
      ...(computed.reachedMilestone ? { reachedMilestone: computed.reachedMilestone } : {}),
      grossBonusPaise: computed.grossBonusPaise,
      capPaise: computed.capPaise,
      awardedPaise: computed.awardedPaise,
      appliedPaise,
      status: deriveAwardStatus(computed.awardedPaise, appliedPaise),
      computedAt,
    });
    return doc;
  };

  const res = await applyCredit({
    technicianId, refId: awardId, source: 'INCENTIVE',
    paise: computed.awardedPaise, byId: input.byId,
    anchor: {
      id: awardId,
      build,
      /**
       * MUST be supplied: the allocator's fail-closed default demands a numeric
       * `existing.amountPaise` equal to `input.paise`, and an award carries `awardedPaise`.
       *
       * The amount is deliberately NOT compared. A rerun after a config edit recomputes a
       * different `awardedPaise`; spec §3.5 says config edits never re-price history, so the
       * correct answer is "already awarded, no-op", not a thrown mismatch. Identity is
       * (technician, week) — exactly what the deterministic id encodes.
       */
      matches: (existing) => existing['technicianId'] === technicianId && existing['weekKey'] === weekKey,
    },
  });

  if (res.replayed) {
    // Codex P2: a replay is exactly when appliedPaise/status are most likely to be stale --
    // the original batch may have committed while a later reconcileAwardApplied call failed
    // (best-effort, above), or a later credit-consumption run added allocations since. A
    // manual rerun (the runbook's own documented recovery for a partial failure) must not
    // skip the one step that would actually repair those figures.
    try { await reconcileAwardApplied(technicianId, awardId); }
    catch (e: unknown) { Sentry.captureException(e); }
    return { technicianId, weekKey, outcome: 'REPLAYED', awardId };
  }

  // Best-effort from here. The batch has committed; nothing below may undo or fail the award.
  if (res.creditCreatedPaise > 0) {
    // Spend the remainder against any DUE rows now, rather than leaving it inert until some
    // unrelated future write touches the ledger.
    try { await consumePendingCredits(technicianId); }
    catch (e: unknown) { Sentry.captureException(e); }
  }

  let holdRecomputePending = false;
  try {
    await recomputeCommissionHold(technicianId);
  } catch (e: unknown) {
    Sentry.captureException(e);
    holdRecomputePending = true;
    await systemDocsRepo.enqueueHoldRepair([technicianId]).catch((e2: unknown) => Sentry.captureException(e2));
  }

  // Credit consumption may have added allocations `build()` could not have known about.
  // Recompute appliedPaise absolutely (spec §3.2).
  try { await reconcileAwardApplied(technicianId, awardId); }
  catch (e: unknown) { Sentry.captureException(e); }

  return {
    technicianId, weekKey, outcome: 'AWARDED', awardId,
    awardedPaise: computed.awardedPaise,
    allocations: res.allocations,
    creditCreatedPaise: res.creditCreatedPaise,
    holdRecomputePending,
  };
}

/**
 * Recomputes `appliedPaise` ABSOLUTELY from the receivable allocations and repairs the stored
 * award if it drifted. Never increments (spec §3.2), so it corrects a figure that is too high —
 * the crash-replay case — as readily as one that is too low.
 *
 * TWO refIds, not one. Spec §5.5 says "allocations with refId = awardId"; that undercounts.
 * When an award cannot be fully allocated the remainder becomes a CREDIT whose id is
 * `cr:<awardId>` (creditDocId), and `consumePendingCredits` stamps the allocations it later
 * writes with `refId: <that credit's id>` — commission-allocator.service.ts, around line 194.
 * Counting only the award id leaves a fully-delivered bonus reading PARTIAL forever.
 *
 * Idempotent and safe to call repeatedly: it is a pure function of the ledger's current state.
 * That is exactly what makes it the crash-replay repair — the weekly run and the admin rerun
 * both call it, and any future sweep may too.
 */
export async function reconcileAwardApplied(
  technicianId: string, awardId: string,
): Promise<IncentiveAwardDoc | null> {
  const stored = await incentiveRepo.getAwardWithEtag(technicianId, awardId);
  if (!stored) return null;

  const receivables = await commissionReceivableRepo.getAllByTechnician(technicianId);
  const creditId = creditDocId(awardId); // `cr:${awardId}`
  const appliedPaise = receivables.reduce(
    (sum, r) => sum + (r.allocations ?? [])
      .filter((a) => a.refId === awardId || a.refId === creditId)
      .reduce((s, a) => s + a.paise, 0),
    0,
  );

  const status = deriveAwardStatus(stored.doc.awardedPaise, appliedPaise);
  if (appliedPaise === stored.doc.appliedPaise && status === stored.doc.status) return stored.doc;

  const next: IncentiveAwardDoc = { ...stored.doc, appliedPaise, status, updatedAt: new Date().toISOString() };
  const res = await commissionReceivableRepo.runLedgerBatch(technicianId, [
    { operationType: 'Replace', id: awardId, ifMatch: stored.etag, resourceBody: next as never },
  ]);
  // Derived state. Losing the conditional write means a concurrent recompute already landed a
  // figure at least as fresh as ours — a correct outcome, not an error.
  return res.ok ? next : stored.doc;
}

export type IncentiveRunSummary = {
  weekKey: string; enabled: boolean; technicianCount: number;
  awarded: number; replayed: number; noAward: number; failed: number; totalAwardedPaise: number;
};

/**
 * Indirection so the run's own call to applyAward is interceptable by a module-namespace spy.
 *
 * Routes through the self-imported namespace (`incentiveService`, above), not the bare local
 * `applyAward` binding: a lexical reference to a same-module function is a plain variable read at
 * the JS level, immune to `vi.spyOn(incentive, 'applyAward')`, which mutates only the module's
 * exported *property*. Reading `incentiveService.applyAward` is a property access on that same
 * exports object every time this is called, so it observes the mock.
 */
export const _internal = {
  applyAward: (input: ApplyAwardInput): Promise<ApplyAwardResult> => incentiveService.applyAward(input),
};

/**
 * Awards one IST week to every technician who booked at least one receivable in it.
 *
 * SEQUENTIAL on purpose. These are money writes at pilot scale (tens of technicians); a parallel
 * fan-out would multiply RU pressure on one container and buy nothing, and it would make a
 * partial failure much harder to reason about. Each technician is isolated: one failure is
 * captured and counted, never allowed to abort the run, so a single stuck ledger cannot deny
 * everyone else their bonus. The next run replays cleanly for whoever succeeded (deterministic
 * award id) and retries whoever did not.
 */
export async function runIncentiveWeek(weekKey: string, byId: string): Promise<IncentiveRunSummary> {
  // Validate before any I/O: a bad key must not cost a Cosmos read.
  const { startUtc, endUtc } = istWeekBounds(weekKey);

  const cfg = await systemDocsRepo.getEffectiveIncentiveConfig();
  const summary: IncentiveRunSummary = {
    weekKey, enabled: cfg.enabled, technicianCount: 0,
    awarded: 0, replayed: 0, noAward: 0, failed: 0, totalAwardedPaise: 0,
  };
  // Dark-launch gate. Disabled means disabled — not even the cross-partition roster query runs.
  if (!cfg.enabled) return summary;

  const roster = await commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow(
    startUtc.toISOString(), endUtc.toISOString(),
  );
  summary.technicianCount = roster.length;

  for (const { technicianId } of roster) {
    try {
      const receivables = await commissionReceivableRepo.getAllByTechnician(technicianId);
      const res = await _internal.applyAward({ technicianId, weekKey, cfg, receivables, byId });
      if (res.outcome === 'AWARDED') {
        summary.awarded += 1;
        summary.totalAwardedPaise += res.awardedPaise;
        // One audit entry per GENUINE award. A replay must never produce a second — the owner's
        // trail would otherwise read as the same bonus granted twice.
        await systemAudit('INCENTIVE_AWARDED', 'incentive_award', res.awardId, {
          technicianId, weekKey, awardedPaise: res.awardedPaise, allocations: res.allocations,
          creditCreatedPaise: res.creditCreatedPaise, holdRecomputePending: res.holdRecomputePending, byId,
        });
      } else if (res.outcome === 'REPLAYED') summary.replayed += 1;
      else summary.noAward += 1;
    } catch (err: unknown) {
      summary.failed += 1;
      Sentry.captureException(err);
    }
  }
  return summary;
}
