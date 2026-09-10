// api/src/services/incentive.service.ts
import * as Sentry from '@sentry/node';
import type { EffectiveIncentiveConfig, IncentiveAwardStatus, Milestone } from '../schemas/incentive.js';
import { IncentiveAwardWriteSchema, incentiveAwardId, type IncentiveAwardDoc } from '../schemas/incentive.js';
import { applyCredit, consumePendingCredits, type AllocationPlan } from './commission-allocator.service.js';
import { recomputeCommissionHold } from './commission-hold.service.js';
import { systemDocsRepo } from '../cosmos/system-docs-repository.js';
import { incentiveRepo } from '../cosmos/incentive-repository.js';
import { istWeekBounds } from '../lib/ist-time.js';

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

  if (res.replayed) return { technicianId, weekKey, outcome: 'REPLAYED', awardId };

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
 * Recomputes the award's `appliedPaise` absolutely from the ledger and writes it back under
 * IfMatch (spec §3.2) — `build()` above only knows the allocations from `applyCredit`'s own
 * batch, not any further allocations `consumePendingCredits` makes afterwards against the
 * leftover CREDIT. STUB for this task: the absolute-recompute-and-write body lands in Task 8.
 * For now this only proves the award still exists — a genuine no-op when it does not — which is
 * exactly the behaviour `applyAward` above depends on today.
 */
async function reconcileAwardApplied(technicianId: string, awardId: string): Promise<void> {
  const found = await incentiveRepo.getAwardWithEtag(technicianId, awardId);
  if (!found) return;
  // Task 8: recompute appliedPaise absolutely from ledger allocations for this award (and any
  // credit consumption against it) and write it back under IfMatch. No-op until then.
}
