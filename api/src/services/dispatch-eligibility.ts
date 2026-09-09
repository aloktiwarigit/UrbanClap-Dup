/**
 * E21-S04 — the ONLY place dispatch learns about commission holds.
 *
 * KARNATAKA RULE (ADR-0011, ADR-0032): hold state is an ELIGIBILITY FILTER, never a ranking
 * input. Nothing in this module returns an ordering, a score, or a comparator, and
 * `rankTechnicians` is never given anything produced here beyond a boolean pair. Enforced
 * mechanically by the Semgrep rule `no-commission-hold-in-ranking` and by
 * tests/unit/dispatch-ranking-invariance.test.ts.
 */
import { getCommissionConfig } from './commission-config.service.js';
import type { DispatchPredicateOptions } from '../cosmos/technician-repository.js';
import type { TechnicianProfile } from '../schemas/technician.js';

export interface DispatchGates {
  holdEnforcementEnabled: boolean;
  enforceKycInDispatch: boolean;
}

const GATES_OFF: DispatchGates = { holdEnforcementEnabled: false, enforceKycInDispatch: false };

/**
 * Reads the enforcement flags. NEVER throws: dispatch is the revenue path, and a config-read
 * failure must degrade to "no new gating" rather than to "no dispatch". `getCommissionConfig`
 * is cached in-process for 5 minutes, so this costs nothing on the hot path — and a flag flip
 * therefore takes up to 5 minutes to propagate, which is intended for a staged rollout.
 */
export async function loadDispatchGates(): Promise<DispatchGates> {
  try {
    const cfg = await getCommissionConfig();
    return {
      holdEnforcementEnabled: cfg.holdEnforcementEnabled,
      enforceKycInDispatch: cfg.enforceKycInDispatch,
    };
  } catch (err: unknown) {
    console.warn(
      `DISPATCH_GATES_UNAVAILABLE falling back to enforcement-off: ${err instanceof Error ? err.message : String(err)}`,
    );
    return GATES_OFF;
  }
}

/** Pure mapping from flags to SQL predicate options. */
export function gatesToPredicateOptions(gates: DispatchGates): DispatchPredicateOptions {
  return {
    excludeBlockedHolds: gates.holdEnforcementEnabled,
    requireKyc: gates.enforceKycInDispatch,
  };
}

/**
 * Shadow mode: with enforcement off the query runs unfiltered, so the candidates still carry
 * their commissionHold and we can log exactly who enforcement WOULD have excluded. A week of
 * these lines is the readout the owner reviews before flipping `holdEnforcementEnabled`
 * (see docs/runbook.md, "shadow-mode readout"). Returns the count for the caller's own logging.
 */
export function logShadowExclusions(bookingId: string, candidates: TechnicianProfile[]): number {
  let n = 0;
  for (const t of candidates) {
    const hold = t.commissionHold;
    if (hold?.state !== 'BLOCKED') continue;
    n++;
    console.log(
      `DISPATCH_HOLD_SHADOW_EXCLUSION bookingId=${bookingId} technicianId=${t.technicianId || t.id} ` +
        `state=BLOCKED outstandingPaise=${hold.outstandingPaise} evaluatedAt=${hold.evaluatedAt}`,
    );
  }
  return n;
}
