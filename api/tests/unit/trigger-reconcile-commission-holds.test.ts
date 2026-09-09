import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/bootstrap.js', () => ({}));
vi.mock('@azure/functions', () => ({ app: { timer: vi.fn() } }));
vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
}));
vi.mock('../../src/cosmos/system-docs-repository.js', () => ({
  systemDocsRepo: {
    drainHoldRepair: vi.fn(),
    enqueueHoldRepair: vi.fn(),
    putHoldReconciliationSummary: vi.fn(),
  },
}));
vi.mock('../../src/services/commission-hold.service.js', () => ({
  sweepAllHolds: vi.fn(),
  recomputeCommissionHold: vi.fn(),
}));
vi.mock('../../src/cosmos/technician-repository.js', () => ({
  listAllTechniciansWithHold: vi.fn(),
}));
vi.mock('../../src/cosmos/commission-receivable-repository.js', () => ({
  commissionReceivableRepo: { sumDueGroupedByTechnician: vi.fn() },
}));

import * as Sentry from '@sentry/node';
import { app } from '@azure/functions';
import { systemDocsRepo } from '../../src/cosmos/system-docs-repository.js';
import { sweepAllHolds, recomputeCommissionHold } from '../../src/services/commission-hold.service.js';
import { listAllTechniciansWithHold } from '../../src/cosmos/technician-repository.js';
import { commissionReceivableRepo } from '../../src/cosmos/commission-receivable-repository.js';
import { reconcileCommissionHolds } from '../../src/functions/trigger-reconcile-commission-holds.js';

const ctx = { log: vi.fn(), error: vi.fn() } as never;

/**
 * The `app.timer(...)` registration the module performed when it was first imported. Captured
 * here at module-eval time because `vi.clearAllMocks()` in `beforeEach` would otherwise wipe it
 * before any test could look at it.
 */
const timerRegistration = vi.mocked(app.timer).mock.calls[0];

/** A wall-clock ms value whose 15-minute slot index is / is not divisible by 6. */
const SLOT_MS = 15 * 60 * 1000;
const FULL_SWEEP_MS = SLOT_MS * 6 * 100;        // slot index 600 → 600 % 6 === 0
const NON_FULL_SWEEP_MS = SLOT_MS * (6 * 100 + 1); // slot index 601 → 601 % 6 === 1

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(systemDocsRepo.drainHoldRepair).mockResolvedValue({ technicianIds: [], all: false });
  vi.mocked(systemDocsRepo.putHoldReconciliationSummary).mockResolvedValue(undefined);
  vi.mocked(sweepAllHolds).mockResolvedValue({ recomputed: 0, drifted: 0 });
  vi.mocked(recomputeCommissionHold).mockResolvedValue({ hold: null, status: 'APPLIED' } as never);
  vi.mocked(listAllTechniciansWithHold).mockResolvedValue([]);
  vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([]);
  vi.useFakeTimers();
  vi.setSystemTime(NON_FULL_SWEEP_MS);
});

afterEach(() => vi.useRealTimers());

describe('EXPIRED_OVERRIDES sweep (E21-S02 carry-forward)', () => {
  it('runs on EVERY invocation, including one with an empty repair queue', async () => {
    await reconcileCommissionHolds(ctx);
    expect(sweepAllHolds).toHaveBeenCalledWith({ scope: 'EXPIRED_OVERRIDES', log: expect.any(Function) });
  });

  it('runs even when the repair queue had ids to process', async () => {
    vi.mocked(systemDocsRepo.drainHoldRepair).mockResolvedValue({ technicianIds: ['t1'], all: false });
    await reconcileCommissionHolds(ctx);
    expect(sweepAllHolds).toHaveBeenCalledWith({ scope: 'EXPIRED_OVERRIDES', log: expect.any(Function) });
  });

  it('runs even when the repair queue requested a FULL sweep', async () => {
    vi.mocked(systemDocsRepo.drainHoldRepair).mockResolvedValue({ technicianIds: [], all: true });
    await reconcileCommissionHolds(ctx);
    const scopes = vi.mocked(sweepAllHolds).mock.calls.map((c) => c[0]?.scope);
    expect(scopes).toContain('EXPIRED_OVERRIDES');
    expect(scopes).toContain('FULL');
  });

  it('runs even when a per-id repair failed', async () => {
    vi.mocked(systemDocsRepo.drainHoldRepair).mockResolvedValue({ technicianIds: ['t1'], all: false });
    vi.mocked(recomputeCommissionHold).mockRejectedValue(new Error('boom'));
    await reconcileCommissionHolds(ctx);
    expect(sweepAllHolds).toHaveBeenCalledWith({ scope: 'EXPIRED_OVERRIDES', log: expect.any(Function) });
  });

  // The case above only exercises the INNER per-id catch and would still pass if steps 1 and 2
  // shared one try block. THIS is the failure that would actually skip the sweep: the drain
  // itself rejecting. It is the test that proves steps 1 and 2 are independent.
  it('runs even when drainHoldRepair itself rejected', async () => {
    vi.mocked(systemDocsRepo.drainHoldRepair).mockRejectedValue(new Error('cosmos down'));
    await expect(reconcileCommissionHolds(ctx)).resolves.toBeUndefined();
    expect(sweepAllHolds).toHaveBeenCalledWith({ scope: 'EXPIRED_OVERRIDES', log: expect.any(Function) });
  });
});

describe('repair queue', () => {
  it('recomputes each drained id', async () => {
    vi.mocked(systemDocsRepo.drainHoldRepair).mockResolvedValue({ technicianIds: ['t1', 't2'], all: false });
    await reconcileCommissionHolds(ctx);
    expect(recomputeCommissionHold).toHaveBeenCalledWith('t1');
    expect(recomputeCommissionHold).toHaveBeenCalledWith('t2');
  });

  it('all:true triggers a FULL sweep and skips per-id recomputes', async () => {
    vi.mocked(systemDocsRepo.drainHoldRepair).mockResolvedValue({ technicianIds: [], all: true });
    await reconcileCommissionHolds(ctx);
    expect(sweepAllHolds).toHaveBeenCalledWith(expect.objectContaining({ scope: 'FULL' }));
    expect(recomputeCommissionHold).not.toHaveBeenCalled();
  });

  it('re-enqueues an id whose recompute threw, and does not abort the run', async () => {
    vi.mocked(systemDocsRepo.drainHoldRepair).mockResolvedValue({ technicianIds: ['t1', 't2'], all: false });
    vi.mocked(recomputeCommissionHold).mockRejectedValueOnce(new Error('boom'));
    await expect(reconcileCommissionHolds(ctx)).resolves.toBeUndefined();
    expect(systemDocsRepo.enqueueHoldRepair).toHaveBeenCalledWith(['t1']);
    expect(recomputeCommissionHold).toHaveBeenCalledWith('t2');
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  // Draining `all` discards the queued ids by short-circuiting the per-id loop, so a FULL sweep
  // that then dies would silently lose the admin's explicit "recompute everything".
  it('re-enqueues ALL when the repairAll-triggered FULL sweep threw', async () => {
    vi.mocked(systemDocsRepo.drainHoldRepair).mockResolvedValue({ technicianIds: [], all: true });
    vi.mocked(sweepAllHolds).mockImplementation(async (opts) => {
      if (opts?.scope === 'FULL') throw new Error('boom');
      return { recomputed: 0, drifted: 0 };
    });
    await expect(reconcileCommissionHolds(ctx)).resolves.toBeUndefined();
    expect(systemDocsRepo.enqueueHoldRepair).toHaveBeenCalledWith('ALL');
  });

  // A clock-scheduled sweep retries on its own next slot; re-enqueuing it would leave a permanent
  // `all` flag forcing a cross-partition sweep on every subsequent run.
  it('does NOT re-enqueue ALL when a clock-scheduled FULL sweep threw', async () => {
    vi.setSystemTime(FULL_SWEEP_MS);
    vi.mocked(systemDocsRepo.drainHoldRepair).mockResolvedValue({ technicianIds: [], all: false });
    vi.mocked(sweepAllHolds).mockImplementation(async (opts) => {
      if (opts?.scope === 'FULL') throw new Error('boom');
      return { recomputed: 0, drifted: 0 };
    });
    await expect(reconcileCommissionHolds(ctx)).resolves.toBeUndefined();
    expect(systemDocsRepo.enqueueHoldRepair).not.toHaveBeenCalled();
  });
});

describe('full-sweep cadence (clock-derived, cold-start proof)', () => {
  it('runs a FULL sweep when the 15-minute slot index is divisible by 6', async () => {
    vi.setSystemTime(FULL_SWEEP_MS);
    await reconcileCommissionHolds(ctx);
    expect(vi.mocked(sweepAllHolds).mock.calls.map((c) => c[0]?.scope)).toContain('FULL');
  });

  it('does NOT run a FULL sweep on other slots', async () => {
    vi.setSystemTime(NON_FULL_SWEEP_MS);
    await reconcileCommissionHolds(ctx);
    expect(vi.mocked(sweepAllHolds).mock.calls.map((c) => c[0]?.scope)).not.toContain('FULL');
  });
});

describe('summary document', () => {
  const hold = { outstandingPaise: 900, dueCount: 2, state: 'BLOCKED' as const, evaluatedAt: '2026-09-08T00:00:00.000Z' };

  it('is written on EVERY run, not only on full-sweep runs', async () => {
    await reconcileCommissionHolds(ctx);
    expect(systemDocsRepo.putHoldReconciliationSummary).toHaveBeenCalledTimes(1);
  });

  it('carries top-N ordering, totals and the unreconciled count', async () => {
    vi.mocked(listAllTechniciansWithHold).mockResolvedValue([
      { id: 't1', name: 'A', commissionHold: { ...hold, outstandingPaise: 100 } },
      { id: 't2', name: 'B', commissionHold: { ...hold, outstandingPaise: 900 } },
    ]);
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([
      // dueCount/oldestDueAt are part of the repo's real return shape; buildHoldRoster ignores
      // them, but the mock must satisfy the signature.
      { technicianId: 't1', outstandingPaise: 100, dueCount: 1, oldestDueAt: '2026-09-01T00:00:00.000Z' },
      { technicianId: 't2', outstandingPaise: 900, dueCount: 2, oldestDueAt: '2026-09-01T00:00:00.000Z' },
    ]);

    await reconcileCommissionHolds(ctx);

    const doc = vi.mocked(systemDocsRepo.putHoldReconciliationSummary).mock.calls[0]![0];
    expect(doc.id).toBe('hold-reconciliation-summary');
    expect(doc.top.map((r) => r.technicianId)).toEqual(['t2', 't1']);
    expect(doc.totalOutstandingPaise).toBe(1000);
    expect(doc.totalTechnicianCount).toBe(2);
    expect(doc.unreconciledTechnicianCount).toBe(0);
    expect(doc.topN).toBe(100);
  });

  it('caps `top` at topN while totalTechnicianCount reflects the full roster', async () => {
    vi.mocked(listAllTechniciansWithHold).mockResolvedValue(
      Array.from({ length: 130 }, (_, i) => ({
        id: `t${i}`, commissionHold: { ...hold, outstandingPaise: 130 - i },
      })),
    );
    await reconcileCommissionHolds(ctx);
    const doc = vi.mocked(systemDocsRepo.putHoldReconciliationSummary).mock.calls[0]![0];
    expect(doc.top).toHaveLength(100);
    expect(doc.totalTechnicianCount).toBe(130);
  });

  // The mirror of the summary-write-failure case below: the summary must not be collateral damage
  // when an earlier, independent step dies. Together they pin CF-2 off the happy path.
  it('is still written when a sweep threw', async () => {
    vi.mocked(sweepAllHolds).mockRejectedValue(new Error('boom'));
    await expect(reconcileCommissionHolds(ctx)).resolves.toBeUndefined();
    expect(systemDocsRepo.putHoldReconciliationSummary).toHaveBeenCalledTimes(1);
  });

  it('a summary write failure is captured but does not fail the run', async () => {
    vi.mocked(systemDocsRepo.putHoldReconciliationSummary).mockRejectedValue(new Error('boom'));
    await expect(reconcileCommissionHolds(ctx)).resolves.toBeUndefined();
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});

describe('timer registration', () => {
  // The CRON string and RECONCILE_INTERVAL_MS are load-bearing on each other: the "every 6th slot"
  // arithmetic only yields 90 minutes while the timer actually fires every 15. Changing either
  // alone would silently alter the sweep frequency, so pin both here rather than in a comment.
  it('registers a 15-minute timer under the expected name', () => {
    expect(timerRegistration?.[0]).toBe('triggerReconcileCommissionHolds');
    expect(timerRegistration?.[1].schedule).toBe('0 */15 * * * *');
  });
});

describe('drift reporting', () => {
  it('records each drift line the sweep reports as a Sentry breadcrumb', async () => {
    vi.mocked(sweepAllHolds).mockImplementation(async (opts) => {
      opts?.log?.('hold drift t1: CLEAR/0 → BLOCKED/900');
      return { recomputed: 1, drifted: 1 };
    });
    await reconcileCommissionHolds(ctx);
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'commission-hold', message: expect.stringContaining('hold drift t1') }),
    );
  });
});
