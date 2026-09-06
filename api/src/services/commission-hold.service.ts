import { commissionReceivableRepo } from '../cosmos/commission-receivable-repository.js';
import {
  listTechniciansWithHold,
  patchCommissionHold,
  readCommissionHold,
} from '../cosmos/technician-repository.js';
import { getCommissionConfig } from './commission-config.service.js';
import type { CommissionHold, HoldState } from '../schemas/technician.js';

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
 * Recomputes a technician's commissionHold absolutely from their outstanding receivables
 * (never incremented) and writes it via a conditional Cosmos patch so a stale recompute can
 * never overwrite a fresher one.
 *
 * `readStartedAt` is captured BEFORE the reads so the patch condition can never accept a write
 * from a recompute that started before one already applied. `evaluatedAt` on the returned hold
 * is stamped AFTER the reads complete.
 *
 * Returns null when the technician doc does not exist (nothing to patch). Returns the computed
 * hold even when the patch reports STALE — a newer recompute already landed; ours is superseded,
 * not wrong, and the caller (e.g. a sweep) still gets a value to compare against for drift.
 */
export async function recomputeCommissionHold(technicianId: string): Promise<CommissionHold | null> {
  const readStartedAt = new Date().toISOString();
  const [rows, cfg, current] = await Promise.all([
    commissionReceivableRepo.getOutstandingByTechnician(technicianId),
    getCommissionConfig(),
    readCommissionHold(technicianId),
  ]);
  if (!current.exists) return null;

  const outstandingPaise = rows.reduce((sum, r) => sum + r.outstandingPaise, 0);
  const due = rows.filter((r) => r.outstandingPaise > 0);
  const override =
    current.hold?.override && current.hold.override.until > readStartedAt ? current.hold.override : undefined;

  const hold: CommissionHold = {
    outstandingPaise,
    dueCount: due.length,
    ...(due.length ? { oldestDueAt: due.map((r) => r.entry.createdAt).sort()[0]! } : {}),
    state: evaluateState(outstandingPaise, cfg, override),
    evaluatedAt: new Date().toISOString(),
    ...(override ? { override } : {}),
  };

  const result = await patchCommissionHold(technicianId, hold, readStartedAt);
  if (result === 'MISSING') return null;
  return hold;
}

/**
 * Recomputes every technician that either has an outstanding DUE receivable or currently
 * carries a commissionHold — the union guarantees a technician whose balance just dropped to
 * zero still gets swept down to CLEAR/0 (they'd otherwise never appear in the DUE-side source).
 */
export async function sweepAllHolds(
  opts: { dryRun?: boolean; log?: (s: string) => void } = {},
): Promise<{ recomputed: number; drifted: number }> {
  const seen = new Set<string>();

  let dueToken: string | undefined;
  do {
    const page = await commissionReceivableRepo.sumDueGroupedByTechnician(dueToken);
    for (const group of page.groups) seen.add(group.technicianId);
    dueToken = page.continuationToken;
  } while (dueToken);

  let holdToken: string | undefined;
  do {
    const page = await listTechniciansWithHold(holdToken);
    for (const t of page.items) seen.add(t.id);
    holdToken = page.continuationToken;
  } while (holdToken);

  let recomputed = 0;
  let drifted = 0;
  for (const id of seen) {
    const before = (await readCommissionHold(id)).hold;
    if (opts.dryRun) {
      recomputed++;
      continue;
    }
    const after = await recomputeCommissionHold(id);
    recomputed++;
    if (after && (before?.outstandingPaise !== after.outstandingPaise || before?.state !== after.state)) {
      drifted++;
      opts.log?.(
        `hold drift ${id}: ${before?.state ?? 'none'}/${before?.outstandingPaise ?? 0} → ${after.state}/${after.outstandingPaise}`,
      );
    }
  }
  return { recomputed, drifted };
}
