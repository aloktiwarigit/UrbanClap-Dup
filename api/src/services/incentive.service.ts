// api/src/services/incentive.service.ts
import type { EffectiveIncentiveConfig, IncentiveAwardStatus, Milestone } from '../schemas/incentive.js';

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
