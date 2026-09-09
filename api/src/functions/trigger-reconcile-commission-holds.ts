import '../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext, Timer } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { systemDocsRepo } from '../cosmos/system-docs-repository.js';
import { recomputeCommissionHold, sweepAllHolds } from '../services/commission-hold.service.js';
import { getTechniciansByIds, listAllTechniciansWithHold } from '../cosmos/technician-repository.js';
import { commissionReceivableRepo } from '../cosmos/commission-receivable-repository.js';
import { buildHoldRoster } from '../services/commission-dashboard.service.js';
import {
  HOLD_RECONCILIATION_SUMMARY_DOC_ID,
  HOLD_SUMMARY_TOP_N,
  type HoldReconciliationSummaryDoc,
} from '../schemas/hold-reconciliation-summary.js';

/** The timer cadence, in ms. Must match the CRON expression at the bottom of this file. */
const RECONCILE_INTERVAL_MS = 15 * 60 * 1000;

/**
 * A FULL sweep runs on every 6th 15-minute slot — i.e. every 90 minutes, as the E21-S04 spec
 * requires.
 *
 * Derived from the wall clock rather than a module-level counter ON PURPOSE. Azure Functions
 * Consumption cold-starts constantly; a counter would reset to zero on every cold start, firing
 * a full cross-partition sweep on nearly every run, and would drift arbitrarily between
 * instances. `floor(now / interval) % 6` is stateless, deterministic, and identical across
 * every instance that happens to be alive.
 */
function isFullSweepSlot(nowMs: number): boolean {
  return Math.floor(nowMs / RECONCILE_INTERVAL_MS) % 6 === 0;
}

function driftBreadcrumb(message: string): void {
  Sentry.addBreadcrumb({ category: 'commission-hold', level: 'warning', message });
}

/**
 * E21-S04 commission-hold reconciler. Runs every 15 minutes and, in this order:
 *
 *   1. drains the `system/hold-repair` queue and repairs those technicians
 *   2. sweeps EXPIRED_OVERRIDES — **every run, unconditionally** (E21-S02 Task 6 carry-forward:
 *      a lapsed admin override otherwise sits inert until something unrelated touches that
 *      technician's receivables, leaving a technician who should be BLOCKED reading CLEAR)
 *   3. runs a FULL sweep on every 6th slot; this same code path is the rollout backfill
 *   4. writes `system/hold-reconciliation-summary` (E21-S02 Task 10 carry-forward: the admin
 *      dashboard drained every hold document per request)
 *
 * Steps are independent: a failure in one is captured and the rest still run, because step 2 is
 * the one that must never be skipped.
 */
export async function reconcileCommissionHolds(ctx: InvocationContext): Promise<void> {
  const nowMs = Date.now();

  // ── 1. repair queue ────────────────────────────────────────────────────────
  let repairAll = false;
  try {
    const drained = await systemDocsRepo.drainHoldRepair();
    repairAll = drained.all;
    if (!repairAll) {
      for (const technicianId of drained.technicianIds) {
        try {
          await recomputeCommissionHold(technicianId);
        } catch (err: unknown) {
          // Put it back so the next run retries it: a drained-but-unrepaired id is a hold that
          // silently stays wrong forever.
          Sentry.captureException(err);
          ctx.error(`HOLD_REPAIR_FAILED technicianId=${technicianId}`);
          try {
            await systemDocsRepo.enqueueHoldRepair([technicianId]);
          } catch (reEnqueueErr: unknown) {
            Sentry.captureException(reEnqueueErr);
          }
        }
      }
      ctx.log(`reconcileCommissionHolds: repaired ${drained.technicianIds.length} queued technicians`);
    }
  } catch (err: unknown) {
    Sentry.captureException(err);
    ctx.error('HOLD_REPAIR_DRAIN_FAILED');
  }

  // ── 2. expired overrides — EVERY run ───────────────────────────────────────
  try {
    const res = await sweepAllHolds({ scope: 'EXPIRED_OVERRIDES', log: driftBreadcrumb });
    ctx.log(`reconcileCommissionHolds: expired-override sweep recomputed=${res.recomputed} drifted=${res.drifted}`);
  } catch (err: unknown) {
    Sentry.captureException(err);
    ctx.error('HOLD_EXPIRED_OVERRIDE_SWEEP_FAILED');
  }

  // ── 3. full sweep, clock-gated (or on demand from the repair queue) ────────
  if (repairAll || isFullSweepSlot(nowMs)) {
    try {
      const res = await sweepAllHolds({ scope: 'FULL', log: driftBreadcrumb });
      ctx.log(`reconcileCommissionHolds: full sweep recomputed=${res.recomputed} drifted=${res.drifted}`);
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.error('HOLD_FULL_SWEEP_FAILED');
    }
  }

  // ── 4. dashboard summary ───────────────────────────────────────────────────
  try {
    await writeReconciliationSummary(ctx);
  } catch (err: unknown) {
    // Derived, disposable state: the dashboard falls back to a live drain when it is missing or
    // stale, so a failure here costs freshness, never correctness.
    Sentry.captureException(err);
    ctx.error('HOLD_SUMMARY_WRITE_FAILED');
  }
}

async function writeReconciliationSummary(ctx: InvocationContext): Promise<void> {
  const [allWithHold, dueGroups] = await Promise.all([
    listAllTechniciansWithHold(),
    commissionReceivableRepo.sumDueGroupedByTechnician(),
  ]);

  const { rows, totalOutstandingPaise, unreconciledTechnicianCount } = buildHoldRoster(
    allWithHold,
    dueGroups,
  );
  const top = rows.slice(0, HOLD_SUMMARY_TOP_N);

  // Resolve display names for the capped page only, so this never becomes an unbounded lookup.
  const needsName = top.filter((r) => r.technicianName === undefined).map((r) => r.technicianId);
  if (needsName.length > 0) {
    try {
      const profiles = await getTechniciansByIds(needsName);
      const nameById = new Map(
        profiles.map((p) => [p.technicianId || p.id, p.displayName || p.name]),
      );
      for (const row of top) {
        const name = nameById.get(row.technicianId);
        if (row.technicianName === undefined && name) row.technicianName = name;
      }
    } catch (err: unknown) {
      // Names are cosmetic; the numbers are not. Ship the summary without them.
      Sentry.captureException(err);
    }
  }

  const doc: HoldReconciliationSummaryDoc = {
    id: HOLD_RECONCILIATION_SUMMARY_DOC_ID,
    computedAt: new Date().toISOString(),
    totalTechnicianCount: rows.length,
    totalOutstandingPaise,
    unreconciledTechnicianCount,
    topN: HOLD_SUMMARY_TOP_N,
    top,
  };
  await systemDocsRepo.putHoldReconciliationSummary(doc);
  ctx.log(
    `reconcileCommissionHolds: summary written technicians=${rows.length} ` +
      `outstanding=${totalOutstandingPaise} unreconciled=${unreconciledTechnicianCount}`,
  );
}

app.timer('triggerReconcileCommissionHolds', {
  // Every 15 minutes, on the quarter hour. Must stay in step with RECONCILE_INTERVAL_MS above.
  schedule: '0 */15 * * * *',
  handler: async (_timer: Timer, ctx: InvocationContext): Promise<void> => {
    try {
      await reconcileCommissionHolds(ctx);
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.log(`reconcileCommissionHolds ERROR: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  },
});
