# E23-S01 Weekly Incentive Milestones — Implementation Plan, Part 2

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** `plans/e23-s01-incentive-engine.md` (Part 1, Tasks 1–6) must be complete and committed. **Read Part 1's header before starting** — its Goal, Architecture, Spec references, the four corrections to the spec, and especially its **Global Constraints** section govern this document too and are not repeated here.

**Goal (this part):** Apply the computed bonus as credit through the existing ledger allocator, then expose the five routes and the Monday timer.

**Tasks:** 7–9 finish WS-B's service core (the money writes). 10–14 are WS-B's controllers and timer. **Part 3 (`plans/e23-s01c-incentive-pnl-gates-rollout.md`, Tasks 15–21)** carries the P&L line, WS-C's static gates, and WS-E. **WS-D is skipped — no client in this story.**

**Fan-out:** Tasks 10–13 (the four handler files) are mutually independent once Task 9 lands — dispatch those as parallel Sonnet subagents. Keep Tasks 7–9 (the money core) in a single agent.

---

# WS-B (continued) — money application

### Task 7: `applyAward` — the award document as the allocator's anchor

**Files:** Modify `api/src/services/incentive.service.ts` · Test `api/tests/services/incentive.apply.test.ts`

**Interfaces:**
- Consumes: `applyCredit`, `consumePendingCredits`, `AllocationPlan` from `./commission-allocator.service.js`; `recomputeCommissionHold` from `./commission-hold.service.js`; `systemDocsRepo.enqueueHoldRepair`; `incentiveRepo` (Task 6); `computeWeek`/`deriveAwardStatus` (Task 5); `istWeekBounds` (Task 1); `IncentiveAwardWriteSchema`/`incentiveAwardId` (Task 2); `creditDocId`.
- Produces: `type ApplyAwardResult = { technicianId: string; weekKey: string } & ({ outcome: 'NO_AWARD'; computed: ComputeWeekResult } | { outcome: 'AWARDED'; awardId: string; awardedPaise: number; allocations: Array<{ bookingId: string; paise: number }>; creditCreatedPaise: number; holdRecomputePending: boolean } | { outcome: 'REPLAYED'; awardId: string })` · `applyAward(input: { technicianId: string; weekKey: string; cfg: EffectiveIncentiveConfig; receivables: readonly WeekCountableReceivable[]; byId: string }): Promise<ApplyAwardResult>`

**How this maps onto the existing allocator — read before writing code.** `applyCredit` (`commission-allocator.service.ts:78`) already does the work. It takes an `anchor` — a deterministic-id document created as op 0 of the same single-partition `TransactionalBatch` as the row replacements — and E21-S02 already widened `ApplyCreditInput.source` to `'REMITTANCE' | 'INCENTIVE'` and already stamps the leftover `CREDIT` with `source: 'INCENTIVE'` (line 103). `AllocationSourceSchema` already lists `'INCENTIVE'`. Therefore:

- **The award doc IS the anchor.** No second write, and no `REMITTANCE` doc — the "no remittance doc for a credit" requirement (§6, §11) holds structurally, because `applyCredit` creates exactly one anchor and ours is the award.
- **Do NOT use `markRemitted(..., remittanceMethod: 'ADJUSTMENT')`.** The companion doc proposed that against the E21-S01 codebase; E21-S02 deleted `markRemitted` and replaced it with the batch allocator. `RemittanceMethodSchema` still lists `'ADJUSTMENT'` but nothing writes it and this story must not start.
- **`anchor.matches` MUST be supplied.** The allocator's default is fail-closed and requires `existing.amountPaise === input.paise` (lines 123-125). An award carries `awardedPaise`, so the default would throw `IDEMPOTENCY_MISMATCH` on every legitimate replay. Ours compares `technicianId` and `weekKey` and **deliberately does not compare the amount**: a rerun after a config edit recomputes a different `awardedPaise`, and §3.5 says config edits never re-price history, so the right answer is a no-op replay, not a thrown mismatch. That divergence from remittance semantics is precisely why `matches` was made pluggable.

- [ ] **Step 1: Write the failing test**

```typescript
// api/tests/services/incentive.apply.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../src/services/commission-allocator.service.js');
vi.mock('../../src/services/commission-hold.service.js');
vi.mock('../../src/cosmos/system-docs-repository.js');
vi.mock('../../src/cosmos/incentive-repository.js');
vi.mock('../../src/cosmos/commission-receivable-repository.js');
import { applyCredit, consumePendingCredits } from '../../src/services/commission-allocator.service.js';
import { recomputeCommissionHold } from '../../src/services/commission-hold.service.js';
import { systemDocsRepo } from '../../src/cosmos/system-docs-repository.js';
import { incentiveRepo } from '../../src/cosmos/incentive-repository.js';
import { applyAward } from '../../src/services/incentive.service.js';

const cfg = {
  enabled: true, milestones: [{ jobs: 5, bonusPaise: 10_000 }, { jobs: 10, bonusPaise: 30_000 }],
  capFractionBps: 6000, minCountableBookingPaise: 24_900,
};
const jobs = (n: number, amount = 100_000) =>
  Array.from({ length: n }, (_, i) => ({
    bookingId: `b${i}`, bookingAmount: amount,
    commissionDue: Math.round(amount * 0.22), createdAt: '2026-09-09T10:00:00.000Z',
  }));
const base = { technicianId: 't1', weekKey: '2026-W37', cfg, byId: 'system:incentive' };
const ok = (over: Record<string, unknown> = {}) => ({
  replayed: false as const, anchorId: 'inc:t1:2026-W37',
  allocations: [] as Array<{ bookingId: string; paise: number }>, creditCreatedPaise: 0, ...over,
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(recomputeCommissionHold).mockResolvedValue({ hold: null } as never);
  vi.mocked(incentiveRepo.getAwardWithEtag).mockResolvedValue(null);
});

describe('applyAward — no award', () => {
  it('writes NOTHING when no milestone is reached, or when the cap zeroes the award', async () => {
    expect((await applyAward({ ...base, receivables: jobs(3) })).outcome).toBe('NO_AWARD');
    expect((await applyAward({ ...base, receivables: jobs(10), cfg: { ...cfg, capFractionBps: 0 } })).outcome).toBe('NO_AWARD');
    expect(applyCredit).not.toHaveBeenCalled();
    expect(recomputeCommissionHold).not.toHaveBeenCalled();
  });
});

describe('applyAward — the award document is the allocator anchor', () => {
  it('passes source INCENTIVE, refId = awardId, and never mentions a remittance', async () => {
    vi.mocked(applyCredit).mockResolvedValue(ok({ allocations: [{ bookingId: 'b0', paise: 22_000 }], creditCreatedPaise: 8_000 }));
    await applyAward({ ...base, receivables: jobs(10) });
    const arg = vi.mocked(applyCredit).mock.calls[0]![0];
    expect(arg).toMatchObject({ source: 'INCENTIVE', refId: 'inc:t1:2026-W37', paise: 30_000 });
    expect(arg.anchor.id).toBe('inc:t1:2026-W37');
    const doc = arg.anchor.build({ allocations: [{ bookingId: 'b0', paise: 22_000 }], leftoverPaise: 8_000 });
    expect(doc['docType']).toBe('INCENTIVE_AWARD');
    expect(JSON.stringify(doc)).not.toContain('REMITTANCE'); // spec §6, §11
  });
  it('snapshots the milestone table, cap and threshold onto the award', async () => {
    vi.mocked(applyCredit).mockResolvedValue(ok({ creditCreatedPaise: 30_000 }));
    await applyAward({ ...base, receivables: jobs(10) });
    const doc = vi.mocked(applyCredit).mock.calls[0]![0].anchor.build({ allocations: [], leftoverPaise: 30_000 });
    expect(doc).toMatchObject({
      milestoneSnapshot: cfg.milestones, capFractionBpsSnapshot: 6000,
      minCountableBookingPaiseSnapshot: 24_900, reachedMilestone: { jobs: 10, bonusPaise: 30_000 },
    });
  });
  it('sets appliedPaise from the ACTUAL plan, derives status from it, and carries no payout field', async () => {
    vi.mocked(applyCredit).mockResolvedValue(ok());
    await applyAward({ ...base, receivables: jobs(10) });
    const build = vi.mocked(applyCredit).mock.calls[0]![0].anchor.build;
    expect(build({ allocations: [], leftoverPaise: 30_000 })).toMatchObject({ appliedPaise: 0, status: 'AWARDED' });
    expect(build({ allocations: [{ bookingId: 'b0', paise: 12_000 }], leftoverPaise: 18_000 }))
      .toMatchObject({ appliedPaise: 12_000, status: 'PARTIAL' });
    const full = build({ allocations: [{ bookingId: 'b0', paise: 22_000 }, { bookingId: 'b1', paise: 8_000 }], leftoverPaise: 0 });
    expect(full).toMatchObject({ appliedPaise: 30_000, status: 'APPLIED' });
    expect(Object.keys(full).filter((k) => /payout|payable|transfer|razorpay/i.test(k))).toEqual([]);
  });
});

describe('applyAward — anchor.matches', () => {
  it('PROOF: a rerun after a config edit is a REPLAY, not an IDEMPOTENCY_MISMATCH', async () => {
    // Stored award was priced 30_000; the config has since changed and this run recomputes
    // 45_000. Spec §3.5: config edits never re-price history, so this must read "already
    // awarded". Comparing amounts — the allocator's fail-closed default — would throw and leave
    // that technician permanently red on every future run.
    vi.mocked(applyCredit).mockResolvedValue({ replayed: true, anchorId: 'inc:t1:2026-W37' });
    const r = await applyAward({ ...base, receivables: jobs(10) });
    expect(r.outcome).toBe('REPLAYED');
    const matches = vi.mocked(applyCredit).mock.calls[0]![0].anchor.matches!;
    expect(matches({ technicianId: 't1', weekKey: '2026-W37', awardedPaise: 45_000 })).toBe(true);
    expect(matches({ technicianId: 't2', weekKey: '2026-W37' })).toBe(false);
    expect(matches({ technicianId: 't1', weekKey: '2026-W36' })).toBe(false);
    expect(matches({})).toBe(false);
  });
  it('does not recompute the hold or consume credits on a replay', async () => {
    vi.mocked(applyCredit).mockResolvedValue({ replayed: true, anchorId: 'inc:t1:2026-W37' });
    await applyAward({ ...base, receivables: jobs(10) });
    expect(consumePendingCredits).not.toHaveBeenCalled();
    expect(recomputeCommissionHold).not.toHaveBeenCalled();
  });
});

describe('applyAward — after the batch commits', () => {
  it('consumes the leftover credit only when one was created', async () => {
    vi.mocked(applyCredit).mockResolvedValue(ok({ creditCreatedPaise: 30_000 }));
    vi.mocked(consumePendingCredits).mockResolvedValue({ consumedPaise: 0 });
    await applyAward({ ...base, receivables: jobs(10) });
    expect(consumePendingCredits).toHaveBeenCalledWith('t1');
    vi.mocked(consumePendingCredits).mockClear();
    vi.mocked(applyCredit).mockResolvedValue(ok({ allocations: [{ bookingId: 'b0', paise: 30_000 }] }));
    await applyAward({ ...base, receivables: jobs(10) });
    expect(consumePendingCredits).not.toHaveBeenCalled();
  });
  it('never fails the award when the hold recompute throws — queues a repair instead', async () => {
    // The batch already committed; the money moved. A hold-cache failure must not undo that.
    vi.mocked(applyCredit).mockResolvedValue(ok({ allocations: [{ bookingId: 'b0', paise: 30_000 }] }));
    vi.mocked(recomputeCommissionHold).mockRejectedValue(new Error('cosmos down'));
    vi.mocked(systemDocsRepo.enqueueHoldRepair).mockResolvedValue(undefined);
    const r = await applyAward({ ...base, receivables: jobs(10) });
    expect(r).toMatchObject({ outcome: 'AWARDED', holdRecomputePending: true });
    expect(systemDocsRepo.enqueueHoldRepair).toHaveBeenCalledWith(['t1']);
  });
  it('never fails the award when consumePendingCredits throws', async () => {
    vi.mocked(applyCredit).mockResolvedValue(ok({ creditCreatedPaise: 30_000 }));
    vi.mocked(consumePendingCredits).mockRejectedValue(new Error('boom'));
    expect((await applyAward({ ...base, receivables: jobs(10) })).outcome).toBe('AWARDED');
  });
  it('propagates a PRECONDITION from the allocator — a genuinely failed batch is not an award', async () => {
    vi.mocked(applyCredit).mockRejectedValue(Object.assign(new Error('PRECONDITION'), { code: 'PRECONDITION' }));
    await expect(applyAward({ ...base, receivables: jobs(10) })).rejects.toMatchObject({ code: 'PRECONDITION' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npx vitest run tests/services/incentive.apply.test.ts`
Expected: FAIL — `applyAward is not a function`.

- [ ] **Step 3: Write minimal implementation**

Append to `api/src/services/incentive.service.ts`:

```typescript
import * as Sentry from '@sentry/node';
import { applyCredit, consumePendingCredits, type AllocationPlan } from './commission-allocator.service.js';
import { recomputeCommissionHold } from './commission-hold.service.js';
import { systemDocsRepo } from '../cosmos/system-docs-repository.js';
import { incentiveRepo } from '../cosmos/incentive-repository.js';
import { commissionReceivableRepo } from '../cosmos/commission-receivable-repository.js';
import { istWeekBounds } from '../lib/ist-time.js';
import { creditDocId } from '../schemas/commission-ledger.js';
import {
  IncentiveAwardWriteSchema, incentiveAwardId,
  type EffectiveIncentiveConfig, type IncentiveAwardDoc,
} from '../schemas/incentive.js';

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
    return doc as unknown as Record<string, unknown>;
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
```

`reconcileAwardApplied` is written in Task 8; leave the call above in place — the tests mock `incentiveRepo.getAwardWithEtag` to `null`, so it is a no-op here.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && npx vitest run tests/services/incentive.apply.test.ts`
Expected: PASS, 9 tests (Task 8 appends more to this file).

- [ ] **Step 5: Commit**

```bash
git add api/src/services/incentive.service.ts api/tests/services/incentive.apply.test.ts
git commit -m "feat(api): applyAward routes the award doc through the ledger allocator as its anchor (E23-S01)"
```

---

### Task 8: `reconcileAwardApplied` — absolute recomputation and crash replay

**Files:** Modify `api/src/services/incentive.service.ts` · Test: append a describe block to `api/tests/services/incentive.apply.test.ts`

**Interfaces:** Consumes `incentiveRepo.getAwardWithEtag` (Task 6), `commissionReceivableRepo.getAllByTechnician` and `runLedgerBatch`, `creditDocId`, `deriveAwardStatus`. Produces `reconcileAwardApplied(technicianId: string, awardId: string): Promise<IncentiveAwardDoc | null>`.

**Implements correction #4.** Sum allocations whose `refId` is the award id **or** `creditDocId(awardId)`.

- [ ] **Step 1: Write the failing test** (append; also import `commissionReceivableRepo` and `reconcileAwardApplied`)

```typescript
describe('reconcileAwardApplied', () => {
  const award = {
    id: 'inc:t1:2026-W37', docType: 'INCENTIVE_AWARD', technicianId: 't1', partitionKey: 't1',
    weekKey: '2026-W37', weekStart: '2026-09-07', weekEnd: '2026-09-13',
    countedJobs: 10, countedCommissionPaise: 220_000,
    milestoneSnapshot: [{ jobs: 10, bonusPaise: 30_000 }],
    capFractionBpsSnapshot: 6000, minCountableBookingPaiseSnapshot: 24_900,
    grossBonusPaise: 30_000, capPaise: 132_000, awardedPaise: 30_000,
    appliedPaise: 0, status: 'AWARDED', computedAt: '2026-09-14T00:30:00.000Z',
  } as const;
  const receivable = (id: string, allocs: Array<{ refId: string; paise: number }>) => ({
    id, bookingId: id, technicianId: 't1', partitionKey: 't1', serviceId: 's', categoryId: 'c',
    bookingAmount: 100_000, commissionBps: 2200, commissionDue: 22_000,
    commissionResolvedFrom: 'GLOBAL' as const, remittanceStatus: 'DUE' as const,
    createdAt: '2026-09-09T10:00:00.000Z',
    allocations: allocs.map((a, i) => ({ id: `${a.refId}:${id}`, source: 'INCENTIVE' as const,
      refId: a.refId, paise: a.paise, appliedAt: '2026-09-14T00:30:00.000Z', byId: `x${i}` })),
  });
  const arrange = (doc: Record<string, unknown>, rows: unknown[], etag = '"v1"') => {
    vi.mocked(incentiveRepo.getAwardWithEtag).mockResolvedValue({ doc, etag } as never);
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue(rows as never);
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValue({ ok: true });
  };

  it('PROOF: counts allocations from the leftover CREDIT as well as from the award itself', async () => {
    // The award applied 22_000 directly; its 8_000 remainder became CREDIT `cr:inc:t1:2026-W37`,
    // which consumePendingCredits later spent — stamping THAT allocation with refId
    // `cr:inc:t1:2026-W37`, not `inc:t1:2026-W37`. Summing only the award id (what §5.5 literally
    // says) reports 22_000 and leaves the award reading PARTIAL forever despite full delivery.
    arrange({ ...award }, [
      receivable('b0', [{ refId: 'inc:t1:2026-W37', paise: 22_000 }]),
      receivable('b9', [{ refId: 'cr:inc:t1:2026-W37', paise: 8_000 }]),
    ]);
    expect(await reconcileAwardApplied('t1', 'inc:t1:2026-W37'))
      .toMatchObject({ appliedPaise: 30_000, status: 'APPLIED' });
  });

  it('ignores allocations belonging to a remittance or another week', async () => {
    arrange({ ...award }, [receivable('b0', [
      { refId: 'inc:t1:2026-W37', paise: 12_000 },
      { refId: 'rem:key-1', paise: 5_000 },
      { refId: 'inc:t1:2026-W36', paise: 9_000 },
      { refId: 'cr:rem:key-1', paise: 3_000 },
    ])]);
    expect((await reconcileAwardApplied('t1', 'inc:t1:2026-W37'))!.appliedPaise).toBe(12_000);
  });

  it('is a no-op write when the stored figure is already correct', async () => {
    arrange({ ...award, appliedPaise: 22_000, status: 'PARTIAL' },
      [receivable('b0', [{ refId: 'inc:t1:2026-W37', paise: 22_000 }])]);
    await reconcileAwardApplied('t1', 'inc:t1:2026-W37');
    expect(commissionReceivableRepo.runLedgerBatch).not.toHaveBeenCalled();
  });

  it('recomputes ABSOLUTELY — a figure that is too HIGH is corrected downward', async () => {
    // Increment-based code can only grow. Absolute recomputation is the only thing that repairs
    // a doubled write from a crash-replay (spec §3.2).
    arrange({ ...award, appliedPaise: 60_000, status: 'APPLIED' },
      [receivable('b0', [{ refId: 'inc:t1:2026-W37', paise: 22_000 }])]);
    expect(await reconcileAwardApplied('t1', 'inc:t1:2026-W37'))
      .toMatchObject({ appliedPaise: 22_000, status: 'PARTIAL' });
  });

  it('writes through the batch helper under the award etag, never a bare replace', async () => {
    arrange({ ...award }, [receivable('b0', [{ refId: 'inc:t1:2026-W37', paise: 30_000 }])], '"v9"');
    await reconcileAwardApplied('t1', 'inc:t1:2026-W37');
    const [pk, ops] = vi.mocked(commissionReceivableRepo.runLedgerBatch).mock.calls[0]!;
    expect(pk).toBe('t1');
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ operationType: 'Replace', id: 'inc:t1:2026-W37', ifMatch: '"v9"' });
  });

  it('returns null when the award does not exist, without reading receivables', async () => {
    vi.mocked(incentiveRepo.getAwardWithEtag).mockResolvedValue(null);
    expect(await reconcileAwardApplied('t1', 'inc:t1:2026-W37')).toBeNull();
    expect(commissionReceivableRepo.getAllByTechnician).not.toHaveBeenCalled();
  });

  it('returns the stale doc rather than throwing when the conditional write loses a race', async () => {
    // Derived state: losing means a concurrent recompute landed something at least as fresh.
    arrange({ ...award }, [receivable('b0', [{ refId: 'inc:t1:2026-W37', paise: 30_000 }])]);
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValue({ ok: false, reason: 'PRECONDITION' });
    expect((await reconcileAwardApplied('t1', 'inc:t1:2026-W37'))!.appliedPaise).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npx vitest run tests/services/incentive.apply.test.ts`
Expected: FAIL — `reconcileAwardApplied is not a function`.

- [ ] **Step 3: Write minimal implementation**

Add to `api/src/services/incentive.service.ts`:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && npx vitest run tests/services/incentive.apply.test.ts`
Expected: PASS, 16 tests. `PROOF: counts allocations from the leftover CREDIT` is the constructed proof for correction #4 — implemented to §5.5's literal wording it reports `22_000` and fails.

- [ ] **Step 5: Commit**

```bash
git add api/src/services/incentive.service.ts api/tests/services/incentive.apply.test.ts
git commit -m "feat(api): absolute appliedPaise reconciliation across award and its credit (E23-S01)"
```

---

### Task 9: `runIncentiveWeek` — the orchestrator

**Files:** Modify `api/src/services/incentive.service.ts` · Test `api/tests/services/incentive.run.test.ts`

**Interfaces:** Consumes `systemDocsRepo.getEffectiveIncentiveConfig` (Task 4), `commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow` and `getAllByTechnician` (Task 6), `applyAward` (Task 7), `systemAudit` from `./auditLog.service.js`, `istWeekBounds`. Produces `type IncentiveRunSummary = { weekKey: string; enabled: boolean; technicianCount: number; awarded: number; replayed: number; noAward: number; failed: number; totalAwardedPaise: number }` · `runIncentiveWeek(weekKey: string, byId: string): Promise<IncentiveRunSummary>`.

- [ ] **Step 1: Write the failing test**

```typescript
// api/tests/services/incentive.run.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../src/cosmos/system-docs-repository.js');
vi.mock('../../src/cosmos/commission-receivable-repository.js');
vi.mock('../../src/services/auditLog.service.js');
import { systemDocsRepo } from '../../src/cosmos/system-docs-repository.js';
import { commissionReceivableRepo } from '../../src/cosmos/commission-receivable-repository.js';
import { systemAudit } from '../../src/services/auditLog.service.js';
import * as incentive from '../../src/services/incentive.service.js';

const cfg = { enabled: true, milestones: [{ jobs: 10, bonusPaise: 30_000 }],
  capFractionBps: 6000, minCountableBookingPaise: 24_900 };
const awardedRes = (t: string) => ({ technicianId: t, weekKey: '2026-W37', outcome: 'AWARDED' as const,
  awardId: `inc:${t}:2026-W37`, awardedPaise: 30_000, allocations: [{ bookingId: 'b0', paise: 22_000 }],
  creditCreatedPaise: 8_000, holdRecomputePending: false });

beforeEach(() => {
  vi.restoreAllMocks();
  vi.mocked(systemDocsRepo.getEffectiveIncentiveConfig).mockResolvedValue(cfg);
  vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue([]);
  vi.mocked(systemAudit).mockResolvedValue(undefined);
});

describe('runIncentiveWeek', () => {
  it('does NOTHING when incentives are disabled — not even the roster query', async () => {
    vi.mocked(systemDocsRepo.getEffectiveIncentiveConfig).mockResolvedValue({ ...cfg, enabled: false });
    expect(await incentive.runIncentiveWeek('2026-W37', 'system:timer'))
      .toMatchObject({ enabled: false, technicianCount: 0, awarded: 0 });
    expect(commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow).not.toHaveBeenCalled();
  });

  it('queries the roster with the half-open UTC bounds of that IST week', async () => {
    vi.mocked(commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow).mockResolvedValue([]);
    await incentive.runIncentiveWeek('2026-W37', 'system:timer');
    expect(commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow)
      .toHaveBeenCalledWith('2026-09-06T18:30:00.000Z', '2026-09-13T18:30:00.000Z');
  });

  it('tallies AWARDED, REPLAYED and NO_AWARD separately and audits only genuine awards', async () => {
    vi.mocked(commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow).mockResolvedValue([
      { technicianId: 't1', receivableCount: 10 },
      { technicianId: 't2', receivableCount: 10 },
      { technicianId: 't3', receivableCount: 2 },
    ]);
    vi.spyOn(incentive, 'applyAward')
      .mockResolvedValueOnce(awardedRes('t1'))
      .mockResolvedValueOnce({ technicianId: 't2', weekKey: '2026-W37', outcome: 'REPLAYED', awardId: 'inc:t2:2026-W37' })
      .mockResolvedValueOnce({ technicianId: 't3', weekKey: '2026-W37', outcome: 'NO_AWARD',
        computed: { countedJobs: 2, countedCommissionPaise: 44_000, grossBonusPaise: 0, capPaise: 26_400, awardedPaise: 0 } });

    expect(await incentive.runIncentiveWeek('2026-W37', 'system:timer')).toMatchObject({
      enabled: true, technicianCount: 3, awarded: 1, replayed: 1, noAward: 1, failed: 0, totalAwardedPaise: 30_000,
    });
    expect(systemAudit).toHaveBeenCalledTimes(1);
    expect(systemAudit).toHaveBeenCalledWith('INCENTIVE_AWARDED', 'incentive_award', 'inc:t1:2026-W37',
      expect.objectContaining({ technicianId: 't1', weekKey: '2026-W37', awardedPaise: 30_000 }));
  });

  it('PROOF: a rerun of an already-awarded week is a NO-OP', async () => {
    // Verification scenario §9 item 6, final clause: "rerun no-op". Everyone comes back REPLAYED,
    // nothing is awarded, and no second INCENTIVE_AWARDED entry appears — the owner's audit trail
    // would otherwise show the same bonus granted twice.
    vi.mocked(commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow).mockResolvedValue([
      { technicianId: 't1', receivableCount: 10 }, { technicianId: 't2', receivableCount: 12 },
    ]);
    vi.spyOn(incentive, 'applyAward').mockImplementation(async (i) =>
      ({ technicianId: i.technicianId, weekKey: i.weekKey, outcome: 'REPLAYED', awardId: `inc:${i.technicianId}:${i.weekKey}` }));
    expect(await incentive.runIncentiveWeek('2026-W37', 'admin-1'))
      .toMatchObject({ awarded: 0, replayed: 2, failed: 0, totalAwardedPaise: 0 });
    expect(systemAudit).not.toHaveBeenCalled();
  });

  it('one technician failing does not abort the run', async () => {
    vi.mocked(commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow).mockResolvedValue([
      { technicianId: 't1', receivableCount: 10 }, { technicianId: 't2', receivableCount: 10 },
    ]);
    vi.spyOn(incentive, 'applyAward')
      .mockRejectedValueOnce(Object.assign(new Error('PRECONDITION'), { code: 'PRECONDITION' }))
      .mockResolvedValueOnce(awardedRes('t2'));
    expect(await incentive.runIncentiveWeek('2026-W37', 'system:timer')).toMatchObject({ failed: 1, awarded: 1 });
  });

  it('rejects a malformed week key before touching anything', async () => {
    await expect(incentive.runIncentiveWeek('2026-37', 'system:timer')).rejects.toThrow(/invalid IST week key/);
    expect(systemDocsRepo.getEffectiveIncentiveConfig).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npx vitest run tests/services/incentive.run.test.ts`
Expected: FAIL — `incentive.runIncentiveWeek is not a function`.

- [ ] **Step 3: Write minimal implementation**

Append to `api/src/services/incentive.service.ts` (add `import { systemAudit } from './auditLog.service.js';`):

```typescript
export type IncentiveRunSummary = {
  weekKey: string; enabled: boolean; technicianCount: number;
  awarded: number; replayed: number; noAward: number; failed: number; totalAwardedPaise: number;
};

/** Indirection so the run's own call to applyAward is interceptable by a module-namespace spy. */
export const _internal = { applyAward };

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && npx vitest run tests/services/incentive.run.test.ts && npx vitest run tests/services/ tests/schemas/ tests/lib/ tests/cosmos/`
Expected: PASS. `PROOF: a rerun of an already-awarded week is a NO-OP` is the constructed proof for the idempotent-rerun guard and is half of verification scenario §9 item 6. If the `vi.spyOn(incentive, 'applyAward')` spy does not intercept, the `_internal` indirection above is the fix — do not weaken the test to integration-style allocator mocking, which would stop proving the rerun no-op.

- [ ] **Step 5: Commit**

```bash
git add api/src/services/incentive.service.ts api/tests/services/incentive.run.test.ts
git commit -m "feat(api): weekly incentive run orchestrator, idempotent per technician (E23-S01)"
```

---


# WS-B (continued) — controllers and timer

**Route/role table (spec §6, "E23-S01 — Incentives"):**

| Route | Roles | Task |
|---|---|---|
| `GET /v1/admin/incentives/config` | super-admin, finance | 10 |
| `PUT /v1/admin/incentives/config` | super-admin | 10 |
| `GET /v1/admin/incentives/awards?week&technicianId&continuationToken` | super-admin, finance | 11 |
| `POST /v1/admin/incentives/run?week` | super-admin | 12 |
| `GET /v1/technicians/me/incentives` | technician (`verifyTechnicianToken`) | 13 |
| Timer, Monday 00:30 IST | — | 14 |
| `getDailyPnL` + `incentiveCostPaise` | — | 15 (Part 3) |

### Task 10: `GET`/`PUT /v1/admin/incentives/config`

**Files:** Create `api/src/functions/admin/incentives/config.ts` · Test `api/tests/functions/admin/incentives/config.test.ts`

**Interfaces:** Consumes `requireAdmin`/`AdminHttpHandler`, `AdminContext`, `systemDocsRepo.getEffectiveIncentiveConfig`/`patchIncentiveConfig` (Part 1 Task 4), `UpdateIncentiveConfigBodySchema` (Part 1 Task 2), `auditLog`. Produces `getIncentiveConfigHandler`, `putIncentiveConfigHandler` (both `AdminHttpHandler`). Pattern to mirror exactly: `api/src/functions/admin/config/technician-client.ts`.

- [ ] **Step 1: Write the failing test**

```typescript
// api/tests/functions/admin/incentives/config.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../../../src/cosmos/system-docs-repository.js');
vi.mock('../../../../src/services/auditLog.service.js');
import { systemDocsRepo } from '../../../../src/cosmos/system-docs-repository.js';
import { auditLog } from '../../../../src/services/auditLog.service.js';
import { getIncentiveConfigHandler, putIncentiveConfigHandler } from '../../../../src/functions/admin/incentives/config.js';

const admin = { adminId: 'a1', role: 'super-admin' as const, sessionId: 's1' };
const ctx = {} as never;
const req = (body: unknown) => ({ json: async () => body }) as never;
const cfg = { enabled: true, milestones: [{ jobs: 10, bonusPaise: 30_000 }], capFractionBps: 6000, minCountableBookingPaise: 24_900 };

beforeEach(() => { vi.resetAllMocks(); vi.mocked(auditLog).mockResolvedValue(undefined); });

describe('GET config', () => {
  it('returns the defaults-applied config and never 404s', async () => {
    vi.mocked(systemDocsRepo.getEffectiveIncentiveConfig).mockResolvedValue(cfg);
    const res = await getIncentiveConfigHandler({} as never, ctx, admin);
    expect(res).toMatchObject({ status: 200, jsonBody: cfg });
  });
  it('502s on an upstream failure rather than leaking the error', async () => {
    vi.mocked(systemDocsRepo.getEffectiveIncentiveConfig).mockRejectedValue(new Error('cosmos'));
    expect(await getIncentiveConfigHandler({} as never, ctx, admin)).toMatchObject({ status: 502 });
  });
});

describe('PUT config', () => {
  it('patches, audits INCENTIVE_CONFIG_UPDATED, and returns the merged config', async () => {
    vi.mocked(systemDocsRepo.patchIncentiveConfig).mockResolvedValue({ ...cfg, capFractionBps: 5000 });
    const res = await putIncentiveConfigHandler(req({ capFractionBps: 5000 }), ctx, admin);
    expect(res).toMatchObject({ status: 200 });
    expect(systemDocsRepo.patchIncentiveConfig).toHaveBeenCalledWith({ capFractionBps: 5000 }, 'a1');
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: 'a1' }), 'INCENTIVE_CONFIG_UPDATED',
      'incentive-config', 'incentive-config', { patch: { capFractionBps: 5000 } });
  });
  it('400s on a malformed body, an empty patch, or non-ascending milestones — and never writes', async () => {
    for (const body of [
      { capFractionBps: 10_001 },
      {},
      { milestones: [{ jobs: 10, bonusPaise: 30_000 }, { jobs: 5, bonusPaise: 10_000 }] },
      { unknownField: 1 },
    ]) {
      expect(await putIncentiveConfigHandler(req(body), ctx, admin)).toMatchObject({ status: 400 });
    }
    expect(systemDocsRepo.patchIncentiveConfig).not.toHaveBeenCalled();
    expect(auditLog).not.toHaveBeenCalled();
  });
  it('400s with PARSE_ERROR on unparseable JSON', async () => {
    const bad = { json: async () => { throw new Error('bad'); } } as never;
    expect(await putIncentiveConfigHandler(bad, ctx, admin)).toMatchObject({ status: 400, jsonBody: { code: 'PARSE_ERROR' } });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npx vitest run tests/functions/admin/incentives/config.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```typescript
// api/src/functions/admin/incentives/config.ts
import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { systemDocsRepo } from '../../../cosmos/system-docs-repository.js';
import { INCENTIVE_CONFIG_DOC_ID, UpdateIncentiveConfigBodySchema } from '../../../schemas/incentive.js';
import { auditLog } from '../../../services/auditLog.service.js';

/** GET must never 404 — an unwritten doc means "incentives are dark", not "missing". */
export const getIncentiveConfigHandler: AdminHttpHandler = async (
  _req: HttpRequest, _ctx: InvocationContext, _admin: AdminContext,
): Promise<HttpResponseInit> => {
  try {
    return { status: 200, jsonBody: await systemDocsRepo.getEffectiveIncentiveConfig() };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

export const putIncentiveConfigHandler: AdminHttpHandler = async (
  req: HttpRequest, _ctx: InvocationContext, admin: AdminContext,
): Promise<HttpResponseInit> => {
  let raw: unknown;
  try { raw = await req.json(); } catch { return { status: 400, jsonBody: { code: 'PARSE_ERROR' } }; }

  const parsed = UpdateIncentiveConfigBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }
  try {
    const cfg = await systemDocsRepo.patchIncentiveConfig(parsed.data, admin.adminId);
    await auditLog(
      { adminId: admin.adminId, role: admin.role, sessionId: admin.sessionId },
      'INCENTIVE_CONFIG_UPDATED', 'incentive-config', INCENTIVE_CONFIG_DOC_ID,
      { patch: parsed.data },
    );
    return { status: 200, jsonBody: cfg };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('getIncentiveConfig', {
  methods: ['GET'], route: 'v1/admin/incentives/config', authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'finance'])(getIncentiveConfigHandler),
});
app.http('putIncentiveConfig', {
  methods: ['PUT'], route: 'v1/admin/incentives/config', authLevel: 'anonymous',
  handler: requireAdmin(['super-admin'])(putIncentiveConfigHandler),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && npx vitest run tests/functions/admin/incentives/config.test.ts`
Expected: PASS, 6 tests. (`INCENTIVE_CONFIG_UPDATED` is not yet in the `AuditAction` union — Task 16 adds it. Until then `npx tsc --noEmit` will flag this one line; that is expected and is resolved by Task 16.)

- [ ] **Step 5: Commit**

```bash
git add api/src/functions/admin/incentives/config.ts api/tests/functions/admin/incentives/config.test.ts
git commit -m "feat(api): admin incentive config GET/PUT (E23-S01)"
```

---

### Task 11: `GET /v1/admin/incentives/awards`

**Files:** Create `api/src/functions/admin/incentives/awards.ts` · Test `api/tests/functions/admin/incentives/awards.test.ts`

**Interfaces:** Consumes `incentiveRepo.listAwardsCrossPartition` (Part 1 Task 6), `IST_WEEK_KEY_RE` (Part 1 Task 1). Produces `listIncentiveAwardsHandler: AdminHttpHandler`.

- [ ] **Step 1: Write the failing test**

```typescript
// api/tests/functions/admin/incentives/awards.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../../../src/cosmos/incentive-repository.js');
import { incentiveRepo } from '../../../../src/cosmos/incentive-repository.js';
import { listIncentiveAwardsHandler } from '../../../../src/functions/admin/incentives/awards.js';

const admin = { adminId: 'a1', role: 'finance' as const, sessionId: 's1' };
const req = (q: Record<string, string>) => ({ query: new URLSearchParams(q) }) as never;

beforeEach(() => vi.resetAllMocks());

describe('GET awards', () => {
  it('forwards all three filters to the repository and returns the page', async () => {
    vi.mocked(incentiveRepo.listAwardsCrossPartition).mockResolvedValue({ awards: [], continuationToken: 'ct-2' });
    const res = await listIncentiveAwardsHandler(
      req({ week: '2026-W37', technicianId: 't1', continuationToken: 'ct-1' }), {} as never, admin);
    expect(res).toMatchObject({ status: 200, jsonBody: { awards: [], continuationToken: 'ct-2' } });
    expect(incentiveRepo.listAwardsCrossPartition)
      .toHaveBeenCalledWith({ weekKey: '2026-W37', technicianId: 't1', continuationToken: 'ct-1' });
  });
  it('omits absent filters rather than passing empty strings into the query', async () => {
    vi.mocked(incentiveRepo.listAwardsCrossPartition).mockResolvedValue({ awards: [] });
    await listIncentiveAwardsHandler(req({}), {} as never, admin);
    expect(incentiveRepo.listAwardsCrossPartition).toHaveBeenCalledWith({});
  });
  it('400s on a malformed week and never queries', async () => {
    expect(await listIncentiveAwardsHandler(req({ week: '2026-37' }), {} as never, admin))
      .toMatchObject({ status: 400, jsonBody: { code: 'VALIDATION_ERROR' } });
    expect(incentiveRepo.listAwardsCrossPartition).not.toHaveBeenCalled();
  });
  it('502s on an upstream failure', async () => {
    vi.mocked(incentiveRepo.listAwardsCrossPartition).mockRejectedValue(new Error('cosmos'));
    expect(await listIncentiveAwardsHandler(req({}), {} as never, admin)).toMatchObject({ status: 502 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npx vitest run tests/functions/admin/incentives/awards.test.ts` → module not found.

- [ ] **Step 3: Write minimal implementation**

```typescript
// api/src/functions/admin/incentives/awards.ts
import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { incentiveRepo } from '../../../cosmos/incentive-repository.js';
import { IST_WEEK_KEY_RE } from '../../../lib/ist-time.js';

export const listIncentiveAwardsHandler: AdminHttpHandler = async (
  req: HttpRequest, _ctx: InvocationContext, _admin: AdminContext,
): Promise<HttpResponseInit> => {
  const week = req.query.get('week') ?? undefined;
  // Validated here, not just bound as a parameter: a malformed week is a client bug, and
  // returning an empty page for it would look like "no awards that week".
  if (week !== undefined && !IST_WEEK_KEY_RE.test(week)) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', message: 'week must be YYYY-Www' } };
  }
  const technicianId = req.query.get('technicianId') ?? undefined;
  const continuationToken = req.query.get('continuationToken') ?? undefined;
  try {
    const page = await incentiveRepo.listAwardsCrossPartition({
      ...(week !== undefined ? { weekKey: week } : {}),
      ...(technicianId !== undefined ? { technicianId } : {}),
      ...(continuationToken !== undefined ? { continuationToken } : {}),
    });
    return { status: 200, jsonBody: page };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('listIncentiveAwards', {
  methods: ['GET'], route: 'v1/admin/incentives/awards', authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'finance'])(listIncentiveAwardsHandler),
});
```

- [ ] **Step 4: Run test to verify it passes** — Run: `cd api && npx vitest run tests/functions/admin/incentives/awards.test.ts`. Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add api/src/functions/admin/incentives/awards.ts api/tests/functions/admin/incentives/awards.test.ts
git commit -m "feat(api): admin incentive awards listing, paginated (E23-S01)"
```

---

### Task 12: `POST /v1/admin/incentives/run`

**Files:** Create `api/src/functions/admin/incentives/run.ts` · Test `api/tests/functions/admin/incentives/run.test.ts`

**Interfaces:** Consumes `runIncentiveWeek` (Part 1 Task 9), `previousIstWeekKey`/`IST_WEEK_KEY_RE` (Part 1 Task 1). Produces `runIncentivesHandler: AdminHttpHandler`. Super-admin only — this moves money.

- [ ] **Step 1: Write the failing test**

```typescript
// api/tests/functions/admin/incentives/run.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../../../src/services/incentive.service.js');
import { runIncentiveWeek } from '../../../../src/services/incentive.service.js';
import { runIncentivesHandler } from '../../../../src/functions/admin/incentives/run.js';

const admin = { adminId: 'a1', role: 'super-admin' as const, sessionId: 's1' };
const req = (q: Record<string, string>) => ({ query: new URLSearchParams(q) }) as never;
const summary = { weekKey: '2026-W37', enabled: true, technicianCount: 3, awarded: 1,
  replayed: 1, noAward: 1, failed: 0, totalAwardedPaise: 30_000 };

beforeEach(() => vi.resetAllMocks());

describe('POST run', () => {
  it('runs the named week as the calling admin and returns the summary', async () => {
    vi.mocked(runIncentiveWeek).mockResolvedValue(summary);
    expect(await runIncentivesHandler(req({ week: '2026-W37' }), {} as never, admin))
      .toMatchObject({ status: 200, jsonBody: summary });
    expect(runIncentiveWeek).toHaveBeenCalledWith('2026-W37', 'a1');
  });
  it('defaults to the PREVIOUS IST week when none is given', async () => {
    // Same default as the Monday timer, so a manual re-run right after a failed timer needs no
    // argument and cannot accidentally award a week that is still in progress.
    vi.mocked(runIncentiveWeek).mockResolvedValue(summary);
    await runIncentivesHandler(req({}), {} as never, admin);
    const [weekKey] = vi.mocked(runIncentiveWeek).mock.calls[0]!;
    expect(weekKey).toMatch(/^\d{4}-W\d{2}$/);
  });
  it('400s on a malformed week and never runs', async () => {
    expect(await runIncentivesHandler(req({ week: 'nope' }), {} as never, admin)).toMatchObject({ status: 400 });
    expect(runIncentiveWeek).not.toHaveBeenCalled();
  });
  it('surfaces a disabled programme as 200 with enabled:false, not as an error', async () => {
    vi.mocked(runIncentiveWeek).mockResolvedValue({ ...summary, enabled: false, technicianCount: 0, awarded: 0, replayed: 0, noAward: 0, totalAwardedPaise: 0 });
    expect(await runIncentivesHandler(req({ week: '2026-W37' }), {} as never, admin))
      .toMatchObject({ status: 200, jsonBody: { enabled: false } });
  });
  it('502s when the run throws', async () => {
    vi.mocked(runIncentiveWeek).mockRejectedValue(new Error('cosmos'));
    expect(await runIncentivesHandler(req({ week: '2026-W37' }), {} as never, admin)).toMatchObject({ status: 502 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails** → module not found.

- [ ] **Step 3: Write minimal implementation**

```typescript
// api/src/functions/admin/incentives/run.ts
import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { runIncentiveWeek } from '../../../services/incentive.service.js';
import { IST_WEEK_KEY_RE, previousIstWeekKey } from '../../../lib/ist-time.js';

/**
 * Manual incentive run. Super-admin only — it moves money.
 *
 * Idempotent by construction: every award id is `inc:<tech>:<week>`, so re-running a week that
 * already awarded is a no-op replay per technician (see runIncentiveWeek). Safe to re-issue
 * after a failed timer run, and the response's `replayed` count says how much was already done.
 */
export const runIncentivesHandler: AdminHttpHandler = async (
  req: HttpRequest, _ctx: InvocationContext, admin: AdminContext,
): Promise<HttpResponseInit> => {
  // Default to the previous week, exactly like the timer: a week still in progress must never
  // be awarded by an argument-less call.
  const weekKey = req.query.get('week') ?? previousIstWeekKey(new Date());
  if (!IST_WEEK_KEY_RE.test(weekKey)) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', message: 'week must be YYYY-Www' } };
  }
  try {
    return { status: 200, jsonBody: await runIncentiveWeek(weekKey, admin.adminId) };
  } catch (err: unknown) {
    Sentry.captureException(err);
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('runIncentives', {
  methods: ['POST'], route: 'v1/admin/incentives/run', authLevel: 'anonymous',
  handler: requireAdmin(['super-admin'])(runIncentivesHandler),
});
```

- [ ] **Step 4: Run test to verify it passes** — Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add api/src/functions/admin/incentives/run.ts api/tests/functions/admin/incentives/run.test.ts
git commit -m "feat(api): super-admin manual incentive run endpoint (E23-S01)"
```

---

### Task 13: `GET /v1/technicians/me/incentives`

**Files:** Modify `api/src/schemas/incentive.ts` (response schema + pure progress builder) · Create `api/src/functions/technicians/me-incentives.ts` · Test `api/tests/functions/technicians/me-incentives.test.ts`

**Interfaces:**
- Consumes: `verifyTechnicianToken`; `systemDocsRepo.getEffectiveIncentiveConfig`; `commissionReceivableRepo.getAllByTechnician`; `incentiveRepo.listAwards`; `computeWeek` (Part 1 Task 5); `istWeekKey`/`istWeekBounds`.
- Produces in `schemas/incentive.ts`: `TechnicianIncentivesResponseSchema` / `TechnicianIncentivesResponse`.
- Produces the handler `getTechnicianIncentivesHandler`.

`RECENT_AWARD_LIMIT = 8` per spec §6 ("current-week progress (live, single partition) + last 8 awards").

- [ ] **Step 1: Write the failing test**

```typescript
// api/tests/functions/technicians/me-incentives.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../../src/middleware/verifyTechnicianToken.js');
vi.mock('../../../src/cosmos/system-docs-repository.js');
vi.mock('../../../src/cosmos/commission-receivable-repository.js');
vi.mock('../../../src/cosmos/incentive-repository.js');
import { verifyTechnicianToken } from '../../../src/middleware/verifyTechnicianToken.js';
import { systemDocsRepo } from '../../../src/cosmos/system-docs-repository.js';
import { commissionReceivableRepo } from '../../../src/cosmos/commission-receivable-repository.js';
import { incentiveRepo } from '../../../src/cosmos/incentive-repository.js';
import { getTechnicianIncentivesHandler } from '../../../src/functions/technicians/me-incentives.js';

const cfg = { enabled: true, milestones: [{ jobs: 5, bonusPaise: 10_000 }, { jobs: 10, bonusPaise: 30_000 }],
  capFractionBps: 6000, minCountableBookingPaise: 24_900 };
const now = new Date('2026-09-09T10:00:00.000Z'); // Wed of 2026-W37
const receivable = (i: number) => ({ id: `b${i}`, bookingId: `b${i}`, technicianId: 't1', partitionKey: 't1',
  serviceId: 's', categoryId: 'c', bookingAmount: 100_000, commissionBps: 2200, commissionDue: 22_000,
  commissionResolvedFrom: 'GLOBAL' as const, remittanceStatus: 'DUE' as const, createdAt: '2026-09-08T10:00:00.000Z' });

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers().setSystemTime(now);
  vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 't1' } as never);
  vi.mocked(systemDocsRepo.getEffectiveIncentiveConfig).mockResolvedValue(cfg);
  vi.mocked(incentiveRepo.listAwards).mockResolvedValue([]);
});

describe('GET /v1/technicians/me/incentives', () => {
  it('401s without a valid technician token, before any read', async () => {
    vi.mocked(verifyTechnicianToken).mockRejectedValue(new Error('nope'));
    expect(await getTechnicianIncentivesHandler({} as never, {} as never)).toMatchObject({ status: 401 });
    expect(commissionReceivableRepo.getAllByTechnician).not.toHaveBeenCalled();
  });

  it('reports live current-week progress and the next milestone', async () => {
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue(
      Array.from({ length: 6 }, (_, i) => receivable(i)) as never);
    const res = await getTechnicianIncentivesHandler({} as never, {} as never) as { jsonBody: Record<string, unknown> };
    expect(res.jsonBody['currentWeek']).toMatchObject({
      weekKey: '2026-W37', weekStart: '2026-09-07', weekEnd: '2026-09-13',
      countedJobs: 6, countedCommissionPaise: 132_000,
      nextMilestone: { jobs: 10, bonusPaise: 30_000 }, jobsToNextMilestone: 4,
      projectedBonusPaise: 10_000, // the 5-job milestone, uncapped at 6000 bps
    });
  });

  it('shows the cap when it currently binds, so the number is never a promise the cap will break', async () => {
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({ ...receivable(i), bookingAmount: 24_900, commissionDue: 5_478 })) as never);
    const res = await getTechnicianIncentivesHandler({} as never, {} as never) as { jsonBody: Record<string, unknown> };
    // 5 x 5_478 = 27_390 generated; cap = floor(*0.6) = 16_434 < the 10_000 milestone -> not binding.
    expect(res.jsonBody['currentWeek']).toMatchObject({ projectedCapPaise: 16_434, projectedBonusPaise: 10_000 });
  });

  it('omits nextMilestone once the top milestone is reached', async () => {
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => receivable(i)) as never);
    const res = await getTechnicianIncentivesHandler({} as never, {} as never) as { jsonBody: Record<string, unknown> };
    expect(res.jsonBody['currentWeek']).not.toHaveProperty('nextMilestone');
  });

  it('returns at most the last 8 awards, newest first', async () => {
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue([]);
    vi.mocked(incentiveRepo.listAwards).mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => ({ id: `a${i}` })) as never);
    const res = await getTechnicianIncentivesHandler({} as never, {} as never) as { jsonBody: { awards: unknown[] } };
    expect(res.jsonBody.awards).toHaveLength(8);
  });

  it('reports enabled:false with zeroed progress when the programme is dark', async () => {
    vi.mocked(systemDocsRepo.getEffectiveIncentiveConfig).mockResolvedValue({ ...cfg, enabled: false, milestones: [] });
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue([receivable(0)] as never);
    const res = await getTechnicianIncentivesHandler({} as never, {} as never) as { jsonBody: Record<string, unknown> };
    expect(res.jsonBody['enabled']).toBe(false);
    expect(res.jsonBody['currentWeek']).toMatchObject({ projectedBonusPaise: 0 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails** → module not found.

- [ ] **Step 3: Write minimal implementation**

Append to `api/src/schemas/incentive.ts`:

```typescript
/** Spec §6: "current-week progress (live, single partition) + last 8 awards". */
export const RECENT_AWARD_LIMIT = 8;

export const TechnicianIncentivesResponseSchema = z.object({
  enabled: z.boolean(),
  milestones: z.array(MilestoneSchema),
  capFractionBps: z.number().int(),
  minCountableBookingPaise: z.number().int(),
  currentWeek: z.object({
    weekKey: z.string(), weekStart: z.string(), weekEnd: z.string(),
    countedJobs: z.number().int().nonnegative(),
    countedCommissionPaise: z.number().int().nonnegative(),
    nextMilestone: MilestoneSchema.optional(),
    jobsToNextMilestone: z.number().int().nonnegative().optional(),
    /** What the week would pay if it ended now — already capped, so it is never a promise the
     *  cap will later break. */
    projectedBonusPaise: z.number().int().nonnegative(),
    projectedCapPaise: z.number().int().nonnegative(),
  }),
  awards: z.array(IncentiveAwardDocSchema),
});
export type TechnicianIncentivesResponse = z.infer<typeof TechnicianIncentivesResponseSchema>;
```

```typescript
// api/src/functions/technicians/me-incentives.ts
import '../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { verifyTechnicianToken } from '../../middleware/verifyTechnicianToken.js';
import { systemDocsRepo } from '../../cosmos/system-docs-repository.js';
import { commissionReceivableRepo } from '../../cosmos/commission-receivable-repository.js';
import { incentiveRepo } from '../../cosmos/incentive-repository.js';
import { computeWeek } from '../../services/incentive.service.js';
import { istWeekKey, istWeekBounds } from '../../lib/ist-time.js';
import { RECENT_AWARD_LIMIT, TechnicianIncentivesResponseSchema } from '../../schemas/incentive.js';

/**
 * Live current-week progress plus the technician's recent awards. Everything here is
 * single-partition (pk = /technicianId), so it is cheap enough to poll from the wallet screen.
 *
 * `projectedBonusPaise` is run through the SAME computeWeek the Monday run uses, cap included.
 * Showing an uncapped milestone figure would promise a number the cap later takes away, which
 * is the fastest way to make a technician distrust the wallet.
 */
export const getTechnicianIncentivesHandler = async (
  req: HttpRequest, _ctx: InvocationContext,
): Promise<HttpResponseInit> => {
  let uid: string;
  try { uid = (await verifyTechnicianToken(req)).uid; }
  catch { return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } }; }

  try {
    const now = new Date();
    const weekKey = istWeekKey(now);
    const { weekStart, weekEnd, startUtc, endUtc } = istWeekBounds(weekKey);
    const [cfg, receivables, awards] = await Promise.all([
      systemDocsRepo.getEffectiveIncentiveConfig(),
      commissionReceivableRepo.getAllByTechnician(uid),
      incentiveRepo.listAwards(uid),
    ]);

    const c = computeWeek({ receivables, startUtc, endUtc, cfg });
    const nextMilestone = [...cfg.milestones].sort((a, b) => a.jobs - b.jobs)
      .find((m) => m.jobs > c.countedJobs);

    const body = TechnicianIncentivesResponseSchema.parse({
      enabled: cfg.enabled,
      milestones: cfg.milestones,
      capFractionBps: cfg.capFractionBps,
      minCountableBookingPaise: cfg.minCountableBookingPaise,
      currentWeek: {
        weekKey, weekStart, weekEnd,
        countedJobs: c.countedJobs,
        countedCommissionPaise: c.countedCommissionPaise,
        ...(nextMilestone
          ? { nextMilestone, jobsToNextMilestone: nextMilestone.jobs - c.countedJobs }
          : {}),
        projectedBonusPaise: c.awardedPaise,
        projectedCapPaise: c.capPaise,
      },
      awards: awards.slice(0, RECENT_AWARD_LIMIT),
    });
    return { status: 200, jsonBody: body, headers: { 'Cache-Control': 'private, max-age=60' } };
  } catch (err: unknown) {
    Sentry.captureException(err);
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('technicianIncentives', {
  methods: ['GET'], route: 'v1/technicians/me/incentives', authLevel: 'anonymous',
  handler: getTechnicianIncentivesHandler,
});
```

- [ ] **Step 4: Run test to verify it passes** — Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add api/src/schemas/incentive.ts api/src/functions/technicians/me-incentives.ts api/tests/functions/technicians/me-incentives.test.ts
git commit -m "feat(api): technician-facing weekly incentive progress + recent awards (E23-S01)"
```

---

### Task 14: Monday 00:30 IST timer

**Files:** Create `api/src/functions/trigger-incentive-weekly.ts` · Test `api/tests/functions/timers/incentive-weekly.test.ts`

**Interfaces:** Consumes `runIncentiveWeek`, `previousIstWeekKey`. Produces `runWeeklyIncentives(ctx: InvocationContext): Promise<void>` plus the `app.timer` registration.

**Schedule:** Monday 00:30 IST = **Sunday 19:00 UTC**. Azure Functions on Linux Consumption runs CRON in UTC unless `WEBSITE_TIME_ZONE` is set (it is not, and every other timer in this repo assumes UTC). NCRONTAB is `{sec} {min} {hour} {day} {month} {dow}` → `0 0 19 * * 0`.

- [ ] **Step 1: Write the failing test**

```typescript
// api/tests/functions/timers/incentive-weekly.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../../src/services/incentive.service.js');
import { runIncentiveWeek } from '../../../src/services/incentive.service.js';
import { runWeeklyIncentives } from '../../../src/functions/trigger-incentive-weekly.js';
import { readFileSync } from 'node:fs';

const ctx = { log: vi.fn(), error: vi.fn() } as never;
beforeEach(() => vi.resetAllMocks());

describe('runWeeklyIncentives', () => {
  it('runs the PREVIOUS IST week as system:incentive-timer', async () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-09-13T19:00:00.000Z')); // Mon 2026-09-14 00:30 IST
    vi.mocked(runIncentiveWeek).mockResolvedValue({ weekKey: '2026-W37', enabled: true,
      technicianCount: 2, awarded: 1, replayed: 0, noAward: 1, failed: 0, totalAwardedPaise: 30_000 });
    await runWeeklyIncentives(ctx);
    // The week that just ended, never the one starting 30 minutes ago.
    expect(runIncentiveWeek).toHaveBeenCalledWith('2026-W37', 'system:incentive-timer');
  });
  it('rethrows so the Functions host records a failed invocation', async () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-09-13T19:00:00.000Z'));
    vi.mocked(runIncentiveWeek).mockRejectedValue(new Error('cosmos'));
    await expect(runWeeklyIncentives(ctx)).rejects.toThrow('cosmos');
  });
  it('is scheduled at Sunday 19:00 UTC, which is Monday 00:30 IST', () => {
    const src = readFileSync('src/functions/trigger-incentive-weekly.ts', 'utf8');
    expect(src).toMatch(/schedule:\s*'0 0 19 \* \* 0'/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** → module not found.

- [ ] **Step 3: Write minimal implementation**

```typescript
// api/src/functions/trigger-incentive-weekly.ts
import '../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext, Timer } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { runIncentiveWeek } from '../services/incentive.service.js';
import { previousIstWeekKey } from '../lib/ist-time.js';

/**
 * Weekly incentive run, Monday 00:30 IST.
 *
 * Always the PREVIOUS IST week — the week that closed half an hour ago — never the one just
 * starting. Idempotent: award ids are deterministic, so a duplicate delivery or a manual re-run
 * of the same week replays per technician and awards nothing twice.
 */
export async function runWeeklyIncentives(ctx: InvocationContext): Promise<void> {
  const weekKey = previousIstWeekKey(new Date());
  const s = await runIncentiveWeek(weekKey, 'system:incentive-timer');
  ctx.log(
    `runWeeklyIncentives week=${s.weekKey} enabled=${s.enabled} technicians=${s.technicianCount} ` +
    `awarded=${s.awarded} replayed=${s.replayed} noAward=${s.noAward} failed=${s.failed} ` +
    `totalAwardedPaise=${s.totalAwardedPaise}`,
  );
  if (s.failed > 0) ctx.error(`INCENTIVE_RUN_PARTIAL_FAILURE week=${s.weekKey} failed=${s.failed}`);
}

app.timer('triggerIncentiveWeekly', {
  // Sunday 19:00 UTC == Monday 00:30 IST. The host runs CRON in UTC (WEBSITE_TIME_ZONE unset),
  // as every other timer in this repo assumes.
  schedule: '0 0 19 * * 0',
  handler: async (_timer: Timer, ctx: InvocationContext): Promise<void> => {
    try {
      await runWeeklyIncentives(ctx);
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.error(`runWeeklyIncentives ERROR: ${err instanceof Error ? err.message : String(err)}`);
      throw err; // let the host record a failed invocation
    }
  },
});
```

- [ ] **Step 4: Run test to verify it passes** — Expected: PASS, 3 tests. The schedule assertion is a real guard: a CRON typo is otherwise invisible until a week is silently skipped.

- [ ] **Step 5: Commit**

```bash
git add api/src/functions/trigger-incentive-weekly.ts api/tests/functions/timers/incentive-weekly.test.ts
git commit -m "feat(api): Monday 00:30 IST weekly incentive timer (E23-S01)"
```

---


## Part 2 complete — continue in Part 3

Tasks 7–14 deliver the money application and the full API surface: `applyAward` through the ledger allocator, absolute `appliedPaise` reconciliation across the award and its remainder credit, the weekly orchestrator, all five routes, and the Monday 00:30 IST timer.

At this point `npx tsc --noEmit -p tsconfig.tests.json` still reports **one** expected error — `'INCENTIVE_CONFIG_UPDATED'` and `'INCENTIVE_AWARDED'` are not yet members of the `AuditAction` union. Part 3 Task 16 closes it. Do not work around it here.

**Continue with `plans/e23-s01c-incentive-pnl-gates-rollout.md` (Tasks 15–21)** — the `incentiveCostPaise` P&L line, the audit enum and cross-partition registration, the credit-only Semgrep and static gates with their injection proof, the admin ledger `awards[]` passthrough, OpenAPI, ADR-0035, docs, and the smoke/Codex/`/security-review` gate.
