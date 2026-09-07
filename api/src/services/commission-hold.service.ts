import { commissionReceivableRepo } from '../cosmos/commission-receivable-repository.js';
import {
  listAllTechniciansWithHold,
  listTechniciansWithExpiredOverride,
  patchCommissionHold,
  readCommissionHold,
} from '../cosmos/technician-repository.js';
import { getCommissionConfig } from './commission-config.service.js';
import type { CommissionHold, HoldState } from '../schemas/technician.js';

/**
 * Number of retries after an initial STALE patch, each with a completely fresh read (including a
 * new `readStartedAt`). The conditional-patch guard is millisecond-granular string comparison
 * (`evaluatedAt < readStartedAt`), so two recomputes that both start within the same millisecond
 * can each see the other as "not fresher" and both come back STALE against each other's write —
 * retrying with a fresh read breaks that tie on the next attempt instead of silently giving up on
 * the first race.
 */
const MAX_STALE_RETRIES = 2;

/**
 * Pure threshold evaluator. Thresholds are inclusive: `>= block` wins over `>= warn`.
 * An active override (until strictly after `now`) forces CLEAR regardless of outstanding.
 */
export function evaluateState(
  outstandingPaise: number,
  cfg: { warnThresholdPaise: number; blockThresholdPaise: number },
  override?: { until: string },
  now: Date = new Date(),
): HoldState {
  if (override && override.until > now.toISOString()) return 'CLEAR';
  if (outstandingPaise >= cfg.blockThresholdPaise) return 'BLOCKED';
  if (outstandingPaise >= cfg.warnThresholdPaise) return 'WARN';
  return 'CLEAR';
}

/**
 * All the reads needed to recompute a technician's commissionHold, with no write. Returns null
 * when the technician doc does not exist. `readStartedAt` is captured BEFORE the reads so a
 * caller writing with it can never accept its own write from a run that started before one that
 * already applied.
 *
 * A single `evaluationNow` is captured ONCE, after the reads complete, and used both to decide
 * whether the current hold's override is still active and to evaluate the resulting state — so
 * an override that expires between the read and the evaluation is judged consistently in both
 * places rather than being preserved in the data but ignored in the state (or vice versa).
 */
export async function computeCommissionHold(
  technicianId: string,
): Promise<{ hold: CommissionHold; readStartedAt: string } | null> {
  const readStartedAt = new Date().toISOString();
  const [rows, cfg, current] = await Promise.all([
    commissionReceivableRepo.getOutstandingByTechnician(technicianId),
    getCommissionConfig(),
    readCommissionHold(technicianId),
  ]);
  if (!current.exists) return null;

  const evaluationNow = new Date();
  const evaluationNowIso = evaluationNow.toISOString();
  const outstandingPaise = rows.reduce((sum, r) => sum + r.outstandingPaise, 0);
  const due = rows.filter((r) => r.outstandingPaise > 0);
  const override =
    current.hold?.override && current.hold.override.until > evaluationNowIso ? current.hold.override : undefined;

  const hold: CommissionHold = {
    outstandingPaise,
    dueCount: due.length,
    ...(due.length ? { oldestDueAt: due.map((r) => r.entry.createdAt).sort()[0]! } : {}),
    state: evaluateState(outstandingPaise, cfg, override, evaluationNow),
    evaluatedAt: evaluationNowIso,
    ...(override ? { override } : {}),
  };
  return { hold, readStartedAt };
}

/**
 * Recomputes a technician's commissionHold absolutely from their outstanding receivables (never
 * incremented) and writes it via a conditional Cosmos patch so a stale recompute can never
 * overwrite a fresher one.
 *
 * Returns `status: 'MISSING'` (hold: null) when the technician doc does not exist. Returns
 * `status: 'APPLIED'` with the written hold on success. On a `STALE` patch — another recompute's
 * write landed first — retries up to `MAX_STALE_RETRIES` more times with a completely fresh
 * `computeCommissionHold` call (fresh reads, fresh `readStartedAt`) before giving up with
 * `status: 'STALE'` and the last hold it computed (superseded, not wrong — a caller comparing
 * against `before` should not count this as drift it actually applied).
 */
export async function recomputeCommissionHold(
  technicianId: string,
): Promise<{ hold: CommissionHold | null; status: 'APPLIED' | 'STALE' | 'MISSING' }> {
  let lastHold: CommissionHold | null = null;
  for (let attempt = 0; attempt <= MAX_STALE_RETRIES; attempt++) {
    const computed = await computeCommissionHold(technicianId);
    if (!computed) return { hold: null, status: 'MISSING' };
    lastHold = computed.hold;

    const status = await patchCommissionHold(technicianId, computed.hold, computed.readStartedAt);
    if (status === 'APPLIED') return { hold: computed.hold, status: 'APPLIED' };
    if (status === 'MISSING') return { hold: null, status: 'MISSING' };
    // STALE: loop and retry with a completely fresh read.
  }
  return { hold: lastHold, status: 'STALE' };
}

/**
 * Recomputes technician commissionHolds in one of two scopes:
 *
 * - `'FULL'` (default): every technician that either has an outstanding DUE receivable or
 *   currently carries a commissionHold — the union guarantees a technician whose balance just
 *   dropped to zero still gets swept down to CLEAR/0.
 * - `'EXPIRED_OVERRIDES'`: only technicians whose commissionHold.override has expired as of now.
 *   An expired override otherwise sits inert until something else touches that technician's
 *   receivables and triggers a recompute, silently under-enforcing a hold that should have
 *   resumed. **The E21-S04 reconciler must run this scope on a schedule (every 15 minutes)** so
 *   an expired override is cleared promptly instead of only on the next unrelated recompute.
 *
 * In `dryRun`, no patch is issued: each candidate is still evaluated (via `computeCommissionHold`,
 * not `recomputeCommissionHold`) so drift can be reported without writing anything. Drift outside
 * `dryRun` is only counted when the recompute's status was `'APPLIED'` — a `STALE` result did not
 * actually change anything this process wrote, so it must not be counted as drift this sweep
 * caused.
 */
export async function sweepAllHolds(
  opts: { dryRun?: boolean; log?: (s: string) => void; scope?: 'FULL' | 'EXPIRED_OVERRIDES' } = {},
): Promise<{ recomputed: number; drifted: number }> {
  const scope = opts.scope ?? 'FULL';
  const ids = scope === 'EXPIRED_OVERRIDES' ? await listTechniciansWithExpiredOverride(new Date().toISOString()) : await collectFullScopeIds();

  let recomputed = 0;
  let drifted = 0;
  for (const id of ids) {
    const before = (await readCommissionHold(id)).hold;

    if (opts.dryRun) {
      const computed = await computeCommissionHold(id);
      recomputed++;
      if (computed && (before?.outstandingPaise !== computed.hold.outstandingPaise || before?.state !== computed.hold.state)) {
        drifted++;
        opts.log?.(
          `hold drift (dry-run) ${id}: ${before?.state ?? 'none'}/${before?.outstandingPaise ?? 0} → ${computed.hold.state}/${computed.hold.outstandingPaise}`,
        );
      }
      continue;
    }

    const { hold: after, status } = await recomputeCommissionHold(id);
    recomputed++;
    if (
      status === 'APPLIED' &&
      after &&
      (before?.outstandingPaise !== after.outstandingPaise || before?.state !== after.state)
    ) {
      drifted++;
      opts.log?.(
        `hold drift ${id}: ${before?.state ?? 'none'}/${before?.outstandingPaise ?? 0} → ${after.state}/${after.outstandingPaise}`,
      );
    }
  }
  return { recomputed, drifted };
}

async function collectFullScopeIds(): Promise<string[]> {
  const seen = new Set<string>();
  const dueGroups = await commissionReceivableRepo.sumDueGroupedByTechnician();
  for (const group of dueGroups) seen.add(group.technicianId);
  const holders = await listAllTechniciansWithHold();
  for (const t of holders) seen.add(t.id);
  return [...seen];
}
