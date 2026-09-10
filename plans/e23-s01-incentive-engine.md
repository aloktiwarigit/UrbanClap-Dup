# E23-S01 Weekly Incentive Milestones — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Award technicians a weekly job-count milestone bonus, credited against their outstanding commission dues — never paid out as cash — capped at a configurable fraction of the commission they actually generated that week.

**Architecture:** The award is an `INCENTIVE_AWARD` document in the **existing** `commission_receivables` container (pk `/technicianId`), discriminated by `docType` alongside the existing `RECEIVABLE`/`REMITTANCE`/`CREDIT` docs. It is applied by passing that document to the **existing** E21-S02 `applyCredit` allocator as its `anchor` — same single-partition `TransactionalBatch`, same deterministic-id replay detection, same oldest-first allocation, same leftover→`CREDIT`. Credit-only is structural: the write schema is `.strict()` with no payout field, backed by a static test and two Semgrep rules.

**Tech Stack:** Node 22, TypeScript strict, Zod, `@azure/cosmos@4.9.2` transactional batches, Azure Functions v4 (`app.http` / `app.timer`), Vitest, `@asteasolutions/zod-to-openapi`, Semgrep.

**Spec:** `C:/Users/alokt/.claude/plans/validated-frolicking-mochi.md` — §2 item 4 (owner decision), §3 (architecture invariants, **all ten apply**), §5.1, §5.3, §5.5, §6 "E23-S01 — Incentives", §7.8, §8, §9 item 6, §10.
**Companion (reasoning only, not build authority):** `C:/Users/alokt/.claude/plans/act-as-a-principal-ticklish-fern.md` → "Wave 5 — R5 + R6" — the anti-gaming margin analysis and the snapshot-immutability rationale.

## Pattern library check (mandatory citation)

`docs/patterns/` was read before this plan was written. All five files (`paparazzi-cross-os-goldens`, `firebase-callbackflow-lifecycle`, `firebase-errorcode-mapping`, `hilt-module-android-test-scope`, `kotlin-explicit-api-public-modifier`) are Android/Compose-specific. **None applies** — this story touches only `api/` and `docs/`. Checked and not applicable; do not open them.

## Four corrections to the spec, verified against this worktree at plan time

1. **Container.** The companion doc proposes a separate `technician_incentives` container. **Superseded** by invariant #1 (one money container per technician partition) and #10 (zero new containers), and by §5.5's own header ("in the ledger container"). Use `commission_receivables`, `docType: 'INCENTIVE_AWARD'`, `id = inc:${technicianId}:${weekKey}`.
2. **ADR number.** §8 predicts `0032`; that is taken (E21-S04). `docs/adr/README.md` line 7 requires monotonic numbering, no gap-filling. Verified against a freshly-fetched `origin/main` at plan-writing time: highest is **`0034`**, so this story uses **`0035`**. Task 20 re-verifies before creating the file.
3. **`api/src/lib/ist-time.ts` already exists.** §7.8 asks for an extraction that E21-S02 already did — `IST_OFFSET_MS`, `istDateStr`, `istWeekStart` are there and tested. What is genuinely missing is the ISO **week-key** layer (Task 1). Do not re-extract, and do not touch `src/functions/earnings.ts` — its private rolling-7-day helpers are deliberately separate (see the `ist-time.ts` module docstring).
4. **`appliedPaise` must sum TWO refIds, not one.** §5.5 says "Σ receivable allocations with `refId = awardId`". That undercounts: an unapplied remainder becomes a `CREDIT` with id `cr:${awardId}`, and `consumePendingCredits` stamps the allocations it later writes with `refId: <that credit's id>` (`commission-allocator.service.ts:194-199`). Sum `refId ∈ {awardId, creditDocId(awardId)}`. Task 8 proves this with a fixture carrying both shapes.

## Global Constraints

- **One money container per technician partition.** Every money mutation is one Cosmos `TransactionalBatch` on `commission_receivables` keyed by `technicianId`, ≤100 ops. No cross-container money writes. Zero new containers.
- **Absolute recomputation, never increments.** `appliedPaise` is recomputed, never `+=`. Semgrep `no-increment-on-ledger` already enforces the shape repo-wide.
- **Read-path schemas only widen.** New stored fields `.optional()`; enums widen only; `.strict()` on write bodies only. Deploy functions **before** seeds.
- **Integer paise; the server recomputes every amount.**
- **Snapshot rates onto records.** Milestone table, `capFractionBps` and `minCountableBookingPaise` are copied onto the award. Config edits never re-price a past week.
- **Every admin money action is audit-logged** via `auditLog.service.ts`; the closed action enum lives on the write helper (`api/src/types/admin.ts`) only.
- **Contracts before clients.** `openapi:build` + `openapi:lint` + committed `api/openapi.json` end this story.
- **₹0 infra.** No new SaaS, containers or Azure resources.
- **TDD every task.** Test file committed before implementation. The TDD cycle **is** the verification — no separate verify step.
- **Prove every new guard against a realistic failing input.** Four guards carry a `PROOF:` test that constructs a real failing case: the anti-gaming cap and the `minCountableBookingPaise` filter (Task 5), the corrected `appliedPaise` refId rule (Task 8), the idempotent rerun (Task 9), and the credit-only static gate (Task 17). Reasoning about code is not proof.
- **Cosmos aggregate pages return `resources: undefined`, not `[]`.** Any mock of a cross-partition `GROUP BY` page must use `{ resources: undefined }` for the empty case, with a test asserting the code survives it. This took out the admin commission dashboard in production once (see `commission-receivable-repository.ts:235-238`).
- **Work streams (api shape, per project CLAUDE.md):** WS-A schema+types (T1–4) · WS-B repo+service+controller (T5–15) · WS-C Semgrep+auth (T16–17) · **WS-D skipped, no client** · WS-E `bash tools/pre-codex-smoke-api.sh` then `codex review --base main` **and** `/security-review` in parallel (money-adjacent Foundation story), both local, before push (T18–21).

**Fan-out:** T10–13 (the four handler files) are mutually independent once T9 lands; T16–17 are independent from T8 onward. Dispatch those as parallel Sonnet subagents. Keep T5–9 (the money core) in one agent.

## File Structure

**Created:** `api/src/schemas/incentive.ts` (all incentive Zod types) · `api/src/services/incentive.service.ts` (pure `computeWeek`/`deriveAwardStatus`; I/O `applyAward`/`reconcileAwardApplied`/`runIncentiveWeek` — the only module that builds an award doc) · `api/src/cosmos/incentive-repository.ts` (award reads; kept out of `finance-repository.ts` so the payout-path Semgrep rule can name payout files precisely, since that file hosts both `getPayoutQueue` and `getDailyPnL`) · `api/src/functions/admin/incentives/{config,awards,run}.ts` · `api/src/functions/technicians/me-incentives.ts` · `api/src/functions/trigger-incentive-weekly.ts` · `docs/adr/0035-incentives-are-credit-only-and-capped.md` · `docs/stories/E23-S01-incentive-engine.md`

**Modified:** `api/src/lib/ist-time.ts` (+week-key layer) · `api/src/schemas/commission-ledger.ts` (real `INCENTIVE_AWARD` branch) · `api/src/cosmos/commission-receivable-repository.ts` (`listLedger` +`awards`; +roster query) · `api/src/cosmos/system-docs-repository.ts` (+config read/patch) · `api/src/cosmos/finance-repository.ts` + `api/src/schemas/finance.ts` (P&L incentive line) · `api/src/functions/admin/finance/commission-receivables.ts` (+`awards[]`) · `api/src/types/admin.ts` (+2 audit actions) · `api/src/openapi/registry.ts` · `api/.semgrep.yml` · `api/tests/cosmos/cross-partition-tenant-filter.test.ts` · `api/openapi.json` · `docs/runbook.md` · `docs/threat-model.md`

**Test files created:** `tests/lib/ist-week.test.ts`, `tests/schemas/incentive.test.ts`, `tests/services/incentive.{compute,apply,run}.test.ts`, `tests/cosmos/incentive-repository.test.ts`, `tests/cosmos/system-docs-incentive.test.ts`, `tests/cosmos/finance-incentive-cost.test.ts`, `tests/functions/admin/incentives/{config,awards,run}.test.ts`, `tests/functions/technicians/me-incentives.test.ts`, `tests/functions/timers/incentive-weekly.test.ts`, `tests/static/incentives-credit-only.test.ts`.

---

# WS-A — Cosmos schema + Zod types

### Task 1: IST week-key helpers

**Files:** Modify `api/src/lib/ist-time.ts` · Test `api/tests/lib/ist-week.test.ts` (new; leave `ist-time.test.ts` untouched)

**Interfaces:**
- Consumes: existing `IST_OFFSET_MS`, `istDateStr(d: Date): string`, `istWeekStart(d: Date): Date`.
- Produces: `IST_WEEK_KEY_RE: RegExp` · `istWeekKey(d: Date): string` (e.g. `'2026-W37'`) · `istWeekBounds(weekKey: string): { weekStart: string; weekEnd: string; startUtc: Date; endUtc: Date }` — IST dates Mon/Sun, and a **half-open** `[startUtc, endUtc)` UTC interval · `previousIstWeekKey(d: Date): string`.

- [ ] **Step 1: Write the failing test**

```typescript
// api/tests/lib/ist-week.test.ts
import { describe, it, expect } from 'vitest';
import { IST_WEEK_KEY_RE, istWeekKey, istWeekBounds, previousIstWeekKey } from '../../src/lib/ist-time.js';

describe('istWeekKey', () => {
  it('Monday 00:30 IST is the new week; 30 minutes earlier is still the old one', () => {
    // Sun 18:00Z = Sun 23:30 IST (week 36); Sun 19:00Z = Mon 00:30 IST (week 37).
    expect(istWeekKey(new Date('2026-09-06T18:00:00.000Z'))).toBe('2026-W36');
    expect(istWeekKey(new Date('2026-09-06T19:00:00.000Z'))).toBe('2026-W37');
  });
  it('a UTC instant already in the next IST day resolves into the right week', () => {
    expect(istWeekKey(new Date('2026-09-08T19:30:00.000Z'))).toBe('2026-W37'); // Wed 01:00 IST
  });
  it('handles the ISO year boundary in both directions', () => {
    expect(istWeekKey(new Date('2027-01-01T06:30:00.000Z'))).toBe('2026-W53');
    expect(istWeekKey(new Date('2027-01-04T06:30:00.000Z'))).toBe('2027-W01');
  });
  it('every emitted key matches IST_WEEK_KEY_RE', () => {
    for (let i = 0; i < 400; i++) {
      expect(istWeekKey(new Date(Date.UTC(2026, 0, 1) + i * 86_400_000))).toMatch(IST_WEEK_KEY_RE);
    }
  });
});

describe('istWeekBounds', () => {
  it('returns Mon..Sun IST dates and a half-open 7-day UTC interval', () => {
    const b = istWeekBounds('2026-W37');
    expect(b.weekStart).toBe('2026-09-07');
    expect(b.weekEnd).toBe('2026-09-13');
    expect(b.startUtc.toISOString()).toBe('2026-09-06T18:30:00.000Z'); // Mon 00:00 IST
    expect(b.endUtc.toISOString()).toBe('2026-09-13T18:30:00.000Z');   // next Mon 00:00 IST
  });
  it('round-trips with istWeekKey for every week of 2026 and 2027', () => {
    for (const y of [2026, 2027]) {
      for (let w = 1; w <= 52; w++) {
        const key = `${y}-W${String(w).padStart(2, '0')}`;
        expect(istWeekKey(istWeekBounds(key).startUtc)).toBe(key);
      }
    }
  });
  it('rejects malformed keys', () => {
    for (const bad of ['2026-37', '2026-W00', '2026-W54']) {
      expect(() => istWeekBounds(bad)).toThrow(/invalid IST week key/);
    }
  });
  it('rejects a syntactically valid but nonexistent ISO week (2027 has no week 53)', () => {
    expect(() => istWeekBounds('2027-W53')).toThrow(/nonexistent ISO week/);
  });
});

describe('previousIstWeekKey', () => {
  it('Monday 00:30 IST returns the week that just ended, across the year boundary too', () => {
    expect(previousIstWeekKey(new Date('2026-09-06T19:00:00.000Z'))).toBe('2026-W36');
    expect(previousIstWeekKey(new Date('2027-01-03T19:00:00.000Z'))).toBe('2026-W53');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npx vitest run tests/lib/ist-week.test.ts`
Expected: FAIL — `istWeekKey is not a function`.

- [ ] **Step 3: Write minimal implementation**

Append to `api/src/lib/ist-time.ts` (do not modify the three existing exports):

```typescript
const DAY_MS = 86_400_000;

/** `YYYY-Www`, ISO-8601 week-of-year. Weeks 01–53 only. */
export const IST_WEEK_KEY_RE = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;

/**
 * ISO-8601 week key of the IST calendar week containing `d`.
 * All arithmetic runs on UTC-midnight Dates rebuilt from the IST calendar date string, so the
 * +05:30 shift is applied exactly once (inside istWeekStart) and day maths cannot drift.
 */
export function istWeekKey(d: Date): string {
  const monday = new Date(`${istDateStr(istWeekStart(d))}T00:00:00.000Z`);
  const thursday = new Date(monday.getTime() + 3 * DAY_MS); // ISO week-year = year of the Thursday
  const isoYear = thursday.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));           // ISO week 1 contains 4 January
  const week1Monday = new Date(jan4.getTime() - ((jan4.getUTCDay() + 6) % 7) * DAY_MS);
  const week = Math.round((monday.getTime() - week1Monday.getTime()) / (7 * DAY_MS)) + 1;
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

/**
 * Inverse of `istWeekKey`. The UTC interval is HALF-OPEN — `[startUtc, endUtc)` — so a
 * receivable created at exactly Monday 00:00:00.000 IST belongs to the new week only, and no
 * instant is ever counted in two weeks.
 */
export function istWeekBounds(weekKey: string): {
  weekStart: string; weekEnd: string; startUtc: Date; endUtc: Date;
} {
  if (!IST_WEEK_KEY_RE.test(weekKey)) throw new Error(`invalid IST week key: ${weekKey}`);
  const isoYear = Number(weekKey.slice(0, 4));
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const week1Monday = new Date(jan4.getTime() - ((jan4.getUTCDay() + 6) % 7) * DAY_MS);
  const monday = new Date(week1Monday.getTime() + (Number(weekKey.slice(6)) - 1) * 7 * DAY_MS);

  const weekStart = monday.toISOString().slice(0, 10);
  const weekEnd = new Date(monday.getTime() + 6 * DAY_MS).toISOString().slice(0, 10);
  const startUtc = new Date(new Date(`${weekStart}T00:00:00.000Z`).getTime() - IST_OFFSET_MS);
  const endUtc = new Date(startUtc.getTime() + 7 * DAY_MS);

  // Not every ISO year has 53 weeks; `2027-W53` parses but names no week. Round-tripping is
  // the only honest existence check.
  if (istWeekKey(startUtc) !== weekKey) throw new Error(`nonexistent ISO week: ${weekKey}`);
  return { weekStart, weekEnd, startUtc, endUtc };
}

/** The key of the IST week that ended immediately before the one containing `d`. */
export function previousIstWeekKey(d: Date): string {
  return istWeekKey(new Date(istWeekStart(d).getTime() - 1));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && npx vitest run tests/lib/ist-week.test.ts tests/lib/ist-time.test.ts`
Expected: PASS, both files. The pre-existing file staying green proves `istWeekStart` was not disturbed.

- [ ] **Step 5: Commit**

```bash
git add api/src/lib/ist-time.ts api/tests/lib/ist-week.test.ts
git commit -m "feat(api): ISO week-key helpers on ist-time (E23-S01)"
```

---

### Task 2: Incentive schemas

**Files:** Create `api/src/schemas/incentive.ts` · Test `api/tests/schemas/incentive.test.ts`

**Interfaces:**
- Consumes: `IST_WEEK_KEY_RE` (Task 1).
- Produces: `INCENTIVE_CONFIG_DOC_ID = 'incentive-config'` · `DEFAULT_CAP_FRACTION_BPS = 6000` · `DEFAULT_MIN_COUNTABLE_BOOKING_PAISE = 24_900` · `MilestoneSchema`/`Milestone` (`{ jobs: int>0, bonusPaise: int>0 }`) · `IncentiveConfigDocSchema`/`IncentiveConfigDoc` · `EffectiveIncentiveConfigSchema`/`EffectiveIncentiveConfig` · `toEffectiveIncentiveConfig(doc: IncentiveConfigDoc | null): EffectiveIncentiveConfig` · `UpdateIncentiveConfigBodySchema`/`UpdateIncentiveConfigBody` · `IncentiveAwardStatusSchema`/`IncentiveAwardStatus` (`'AWARDED'|'PARTIAL'|'APPLIED'`) · `IncentiveAwardDocSchema`/`IncentiveAwardDoc` (**read path, not strict**) · `IncentiveAwardWriteSchema` (`.strict()`) · `incentiveAwardId(technicianId, weekKey): string`.

- [ ] **Step 1: Write the failing test**

```typescript
// api/tests/schemas/incentive.test.ts
import { describe, it, expect } from 'vitest';
import {
  IncentiveAwardDocSchema, IncentiveAwardWriteSchema, UpdateIncentiveConfigBodySchema,
  toEffectiveIncentiveConfig, incentiveAwardId, INCENTIVE_CONFIG_DOC_ID,
} from '../../src/schemas/incentive.js';

const award = {
  id: 'inc:t1:2026-W37', docType: 'INCENTIVE_AWARD', technicianId: 't1', partitionKey: 't1',
  weekKey: '2026-W37', weekStart: '2026-09-07', weekEnd: '2026-09-13',
  countedJobs: 10, countedCommissionPaise: 220_000,
  milestoneSnapshot: [{ jobs: 10, bonusPaise: 30_000 }],
  capFractionBpsSnapshot: 6000, minCountableBookingPaiseSnapshot: 24_900,
  reachedMilestone: { jobs: 10, bonusPaise: 30_000 },
  grossBonusPaise: 30_000, capPaise: 132_000, awardedPaise: 30_000,
  appliedPaise: 0, status: 'AWARDED', computedAt: '2026-09-14T00:30:00.000Z',
};

describe('IncentiveAwardDocSchema (read path)', () => {
  it('parses a well-formed award', () => {
    expect(IncentiveAwardDocSchema.parse(award).awardedPaise).toBe(30_000);
  });
  it('tolerates the Cosmos system fields present on every stored document', () => {
    // A read-path schema that rejects _etag/_rid/_ts cannot parse anything Cosmos returns.
    const stored = { ...award, _rid: 'x', _etag: '"1"', _ts: 1, _self: 'y', _attachments: 'z' };
    expect(() => IncentiveAwardDocSchema.parse(stored)).not.toThrow();
  });
  it('rejects a malformed week key and a zero award', () => {
    expect(() => IncentiveAwardDocSchema.parse({ ...award, weekKey: '2026-37' })).toThrow();
    expect(() => IncentiveAwardDocSchema.parse({ ...award, awardedPaise: 0 })).toThrow();
  });
});

describe('IncentiveAwardWriteSchema — credit-only is structural', () => {
  it('parses the same well-formed award', () => {
    expect(() => IncentiveAwardWriteSchema.parse(award)).not.toThrow();
  });
  it('REJECTS an award carrying any payout-shaped field', () => {
    // The structural half of "credit-only, not by convention": a future edit that adds a payout
    // amount to the award cannot reach Cosmos, because the write parse throws here.
    for (const extra of [{ payoutPaise: 1 }, { netPayable: 1 }, { razorpayTransferId: 'trf_1' }]) {
      expect(() => IncentiveAwardWriteSchema.parse({ ...award, ...extra })).toThrow();
    }
  });
});

describe('UpdateIncentiveConfigBodySchema', () => {
  const ok = (b: unknown) => UpdateIncentiveConfigBodySchema.safeParse(b).success;
  it('accepts strictly ascending milestones', () => {
    expect(ok({ milestones: [{ jobs: 5, bonusPaise: 10_000 }, { jobs: 10, bonusPaise: 30_000 }] })).toBe(true);
  });
  it('rejects milestones not ascending in jobs, or paying no more for more jobs', () => {
    expect(ok({ milestones: [{ jobs: 10, bonusPaise: 10_000 }, { jobs: 5, bonusPaise: 30_000 }] })).toBe(false);
    expect(ok({ milestones: [{ jobs: 5, bonusPaise: 30_000 }, { jobs: 10, bonusPaise: 30_000 }] })).toBe(false);
  });
  it('bounds the cap to [0, 10000] inclusive', () => {
    expect(ok({ capFractionBps: 0 })).toBe(true);
    expect(ok({ capFractionBps: 10_000 })).toBe(true);
    expect(ok({ capFractionBps: 10_001 })).toBe(false);
  });
  it('rejects an empty patch and unknown fields', () => {
    expect(ok({})).toBe(false);
    expect(ok({ enabled: true, nope: 1 })).toBe(false);
  });
});

describe('toEffectiveIncentiveConfig', () => {
  it('applies every default when the doc has never been written (dark launch)', () => {
    expect(toEffectiveIncentiveConfig(null)).toMatchObject({
      enabled: false, milestones: [], capFractionBps: 6000, minCountableBookingPaise: 24_900,
    });
  });
  it('sorts milestones ascending even if the stored doc is out of order', () => {
    const doc = { id: INCENTIVE_CONFIG_DOC_ID, enabled: true,
      milestones: [{ jobs: 10, bonusPaise: 30_000 }, { jobs: 5, bonusPaise: 10_000 }] };
    expect(toEffectiveIncentiveConfig(doc).milestones.map((m) => m.jobs)).toEqual([5, 10]);
  });
  it('builds the deterministic anchor id the allocator keys replay detection on', () => {
    expect(incentiveAwardId('t1', '2026-W37')).toBe('inc:t1:2026-W37');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npx vitest run tests/schemas/incentive.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/schemas/incentive.js"`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// api/src/schemas/incentive.ts
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { IST_WEEK_KEY_RE } from '../lib/ist-time.js';
extendZodWithOpenApi(z);

/** Singleton id in the `system` container (spec §5.3). */
export const INCENTIVE_CONFIG_DOC_ID = 'incentive-config';
/** Owner decision (spec §2 item 4): bonus ≤ 60% of the week's generated commission. Ships ON. */
export const DEFAULT_CAP_FRACTION_BPS = 6000;
/** Cheapest real service at pilot (₹249) — cheaper "bookings" cannot pad the job count. */
export const DEFAULT_MIN_COUNTABLE_BOOKING_PAISE = 24_900;

export const MilestoneSchema = z.object({
  jobs: z.number().int().positive(),
  bonusPaise: z.number().int().positive(),
});
export type Milestone = z.infer<typeof MilestoneSchema>;

/** Strictly ascending in BOTH dimensions: more jobs must never pay less, and two milestones
 *  must never share a job count (the "highest reached" pick would be ambiguous). */
function isStrictlyAscending(ms: readonly Milestone[]): boolean {
  return ms.every((m, i) => i === 0 || (m.jobs > ms[i - 1]!.jobs && m.bonusPaise > ms[i - 1]!.bonusPaise));
}

/** Stored shape. Every field but `id` optional — the doc is written field-by-field and a
 *  partially-populated doc must always parse (read paths only widen, spec §3.3). */
export const IncentiveConfigDocSchema = z.object({
  id: z.literal(INCENTIVE_CONFIG_DOC_ID),
  enabled: z.boolean().optional(),
  milestones: z.array(MilestoneSchema).optional(),
  capFractionBps: z.number().int().min(0).max(10_000).optional(),
  minCountableBookingPaise: z.number().int().nonnegative().optional(),
  updatedBy: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type IncentiveConfigDoc = z.infer<typeof IncentiveConfigDocSchema>;

export const EffectiveIncentiveConfigSchema = z.object({
  enabled: z.boolean(),
  milestones: z.array(MilestoneSchema),
  capFractionBps: z.number().int().min(0).max(10_000),
  minCountableBookingPaise: z.number().int().nonnegative(),
  updatedBy: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type EffectiveIncentiveConfig = z.infer<typeof EffectiveIncentiveConfigSchema>;

export function toEffectiveIncentiveConfig(doc: IncentiveConfigDoc | null): EffectiveIncentiveConfig {
  return {
    enabled: doc?.enabled ?? false,
    // Sorted once here so every consumer (compute, snapshot, progress card) sees one order.
    milestones: [...(doc?.milestones ?? [])].sort((a, b) => a.jobs - b.jobs),
    capFractionBps: doc?.capFractionBps ?? DEFAULT_CAP_FRACTION_BPS,
    minCountableBookingPaise: doc?.minCountableBookingPaise ?? DEFAULT_MIN_COUNTABLE_BOOKING_PAISE,
    ...(doc?.updatedBy !== undefined ? { updatedBy: doc.updatedBy } : {}),
    ...(doc?.updatedAt !== undefined ? { updatedAt: doc.updatedAt } : {}),
  };
}

export const UpdateIncentiveConfigBodySchema = z.object({
  enabled: z.boolean().optional(),
  milestones: z.array(MilestoneSchema).max(20).optional(),
  capFractionBps: z.number().int().min(0).max(10_000).optional(),
  minCountableBookingPaise: z.number().int().nonnegative().optional(),
})
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: 'empty patch' })
  .refine((b) => b.milestones === undefined || isStrictlyAscending(b.milestones), {
    message: 'milestones must be strictly ascending in both jobs and bonusPaise',
    path: ['milestones'],
  });
export type UpdateIncentiveConfigBody = z.infer<typeof UpdateIncentiveConfigBodySchema>;

/** AWARDED = nothing applied yet · PARTIAL = remainder still sits as a CREDIT · APPLIED = absorbed. */
export const IncentiveAwardStatusSchema = z.enum(['AWARDED', 'PARTIAL', 'APPLIED']);
export type IncentiveAwardStatus = z.infer<typeof IncentiveAwardStatusSchema>;

const awardShape = {
  id: z.string().min(1),
  docType: z.literal('INCENTIVE_AWARD'),
  technicianId: z.string().min(1),
  partitionKey: z.string().min(1),
  weekKey: z.string().regex(IST_WEEK_KEY_RE),
  weekStart: z.string(),
  weekEnd: z.string(),
  countedJobs: z.number().int().nonnegative(),
  countedCommissionPaise: z.number().int().nonnegative(),
  /** Snapshot (spec §3.5) — a later config edit must never re-price this week. */
  milestoneSnapshot: z.array(MilestoneSchema),
  capFractionBpsSnapshot: z.number().int().min(0).max(10_000),
  minCountableBookingPaiseSnapshot: z.number().int().nonnegative(),
  reachedMilestone: MilestoneSchema.optional(),
  grossBonusPaise: z.number().int().nonnegative(),
  capPaise: z.number().int().nonnegative(),
  /** Positive by construction: a zero award is never written at all. */
  awardedPaise: z.number().int().positive(),
  /** ALWAYS recomputed absolutely from allocations. Never incremented (spec §3.2). */
  appliedPaise: z.number().int().nonnegative(),
  status: IncentiveAwardStatusSchema,
  computedAt: z.string(),
  updatedAt: z.string().optional(),
};

/** Read path. Deliberately NOT `.strict()`: Cosmos returns `_rid`/`_etag`/`_ts`/`_self`/
 *  `_attachments` on every stored doc, and zod's default strip mode drops them silently. */
export const IncentiveAwardDocSchema = z.object(awardShape);
export type IncentiveAwardDoc = z.infer<typeof IncentiveAwardDocSchema>;

/**
 * Write path. `.strict()` is the STRUCTURAL half of credit-only (spec §7.8, ADR-0035): a
 * `payoutPaise`/`netPayable`/`razorpayTransferId` field added in a future edit throws here and
 * can never be persisted. The Semgrep rules and the static test are the other two halves.
 * Only `incentive.service.ts` may call this.
 */
export const IncentiveAwardWriteSchema = z.object(awardShape).strict();

export const incentiveAwardId = (technicianId: string, weekKey: string): string =>
  `inc:${technicianId}:${weekKey}`;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && npx vitest run tests/schemas/incentive.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 5: Commit**

```bash
git add api/src/schemas/incentive.ts api/tests/schemas/incentive.test.ts
git commit -m "feat(api): incentive config + award schemas, credit-only by construction (E23-S01)"
```

---

### Task 3: Type the award into the ledger union; surface `awards` from `listLedger`

**Files:** Modify `api/src/schemas/commission-ledger.ts:50` and `api/src/cosmos/commission-receivable-repository.ts` · Test `api/tests/cosmos/incentive-repository.test.ts` (created here, extended in Task 6)

**Interfaces:** Consumes `IncentiveAwardDocSchema`/`IncentiveAwardDoc` (Task 2). Produces `listLedger(technicianId) → { receivables, remittances, credits, awards }`.

- [ ] **Step 1: Write the failing test**

```typescript
// api/tests/cosmos/incentive-repository.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LedgerDocSchema } from '../../src/schemas/commission-ledger.js';

const fetchAll = vi.fn();
const fetchNext = vi.fn();
const hasMoreResults = vi.fn();
const itemRead = vi.fn();
vi.mock('../../src/cosmos/client.js', () => ({
  getCommissionReceivablesContainer: () => ({
    items: { query: () => ({ fetchAll, fetchNext, hasMoreResults }) },
    item: () => ({ read: itemRead }),
  }),
}));
const { commissionReceivableRepo } = await import('../../src/cosmos/commission-receivable-repository.js');

export const awardDoc = {
  id: 'inc:t1:2026-W37', docType: 'INCENTIVE_AWARD', technicianId: 't1', partitionKey: 't1',
  weekKey: '2026-W37', weekStart: '2026-09-07', weekEnd: '2026-09-13',
  countedJobs: 10, countedCommissionPaise: 220_000,
  milestoneSnapshot: [{ jobs: 10, bonusPaise: 30_000 }],
  capFractionBpsSnapshot: 6000, minCountableBookingPaiseSnapshot: 24_900,
  grossBonusPaise: 30_000, capPaise: 132_000, awardedPaise: 30_000, appliedPaise: 30_000,
  status: 'APPLIED', computedAt: '2026-09-14T00:30:00.000Z',
};

beforeEach(() => vi.resetAllMocks());

describe('LedgerDocSchema', () => {
  it('discriminates a real INCENTIVE_AWARD into the typed branch, not a passthrough blob', () => {
    expect((LedgerDocSchema.parse(awardDoc) as typeof awardDoc).awardedPaise).toBe(30_000);
  });
  it('rejects an INCENTIVE_AWARD missing a required field (the placeholder accepted it)', () => {
    const { awardedPaise: _drop, ...broken } = awardDoc;
    expect(() => LedgerDocSchema.parse(broken)).toThrow();
  });
  it('still treats a docType-less document as a RECEIVABLE', () => {
    const legacy = { id: 'b1', bookingId: 'b1', technicianId: 't1', partitionKey: 't1',
      serviceId: 's', categoryId: 'c', bookingAmount: 100_000, commissionBps: 2200,
      commissionDue: 22_000, commissionResolvedFrom: 'GLOBAL', remittanceStatus: 'DUE',
      createdAt: '2026-09-08T10:00:00.000Z' };
    expect((LedgerDocSchema.parse(legacy) as { docType: string }).docType).toBe('RECEIVABLE');
  });
});

describe('listLedger', () => {
  it('separates awards from receivables, remittances and credits', async () => {
    fetchAll.mockResolvedValue({ resources: [
      { id: 'b1', bookingId: 'b1', remittanceStatus: 'DUE' },               // no docType -> RECEIVABLE
      { id: 'rem:k1', docType: 'REMITTANCE', amountPaise: 100 },
      { id: 'cr:inc:t1:2026-W37', docType: 'CREDIT', remainingPaise: 50 },
      awardDoc,
    ] });
    const out = await commissionReceivableRepo.listLedger('t1');
    expect([out.receivables.length, out.remittances.length, out.credits.length, out.awards.length]).toEqual([1, 1, 1, 1]);
    expect(out.awards[0]!.id).toBe('inc:t1:2026-W37');
  });
  it('returns an empty awards array when the technician has never been awarded', async () => {
    fetchAll.mockResolvedValue({ resources: [{ id: 'b1', bookingId: 'b1' }] });
    expect((await commissionReceivableRepo.listLedger('t1')).awards).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npx vitest run tests/cosmos/incentive-repository.test.ts`
Expected: FAIL — the missing-field case does not throw (the `.passthrough()` placeholder accepts anything), and `awards` is undefined.

- [ ] **Step 3: Write minimal implementation**

In `api/src/schemas/commission-ledger.ts` add `import { IncentiveAwardDocSchema } from './incentive.js';` and replace line 50:

```typescript
    // was: z.object({ docType: z.literal('INCENTIVE_AWARD') }).passthrough(), // E23 defines the body
    IncentiveAwardDocSchema.extend({ docType: z.literal('INCENTIVE_AWARD') }),
```

In `api/src/cosmos/commission-receivable-repository.ts` add `import type { IncentiveAwardDoc } from '../schemas/incentive.js';` and extend `listLedger`: add `awards: IncentiveAwardDoc[]` to the return type, declare `const awards: IncentiveAwardDoc[] = [];`, add the branch

```typescript
      else if (t === 'INCENTIVE_AWARD') awards.push(d as unknown as IncentiveAwardDoc);
```

and return `{ receivables, remittances, credits, awards }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && npx vitest run tests/cosmos/incentive-repository.test.ts tests/services/commission-view.service.test.ts && npx tsc --noEmit -p tsconfig.tests.json`
Expected: PASS. The typecheck matters most — `listLedger`'s three existing callers destructure it, and adding a field must not break them.

- [ ] **Step 5: Commit**

```bash
git add api/src/schemas/commission-ledger.ts api/src/cosmos/commission-receivable-repository.ts api/tests/cosmos/incentive-repository.test.ts
git commit -m "feat(api): type the INCENTIVE_AWARD ledger branch, surface awards from listLedger (E23-S01)"
```

---

### Task 4: Incentive config read/patch on the system container

**Files:** Modify `api/src/cosmos/system-docs-repository.ts` · Test `api/tests/cosmos/system-docs-incentive.test.ts`

**Interfaces:**
- Consumes: Task 2 types; the file's existing private `readMergeWrite` and `definedOnly` helpers.
- Produces on `systemDocsRepo`: `getEffectiveIncentiveConfig(): Promise<EffectiveIncentiveConfig>` · `patchIncentiveConfig(body: UpdateIncentiveConfigBody, updatedBy: string): Promise<EffectiveIncentiveConfig>`.
- **Leave the existing raw `getIncentiveConfig()` exactly as it is** — `functions/config/technician.ts` passes its result through untouched, and changing its shape would change the technician client contract, which belongs to E21-S02.

- [ ] **Step 1: Write the failing test**

```typescript
// api/tests/cosmos/system-docs-incentive.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const read = vi.fn();
const replace = vi.fn();
const create = vi.fn();
vi.mock('../../src/cosmos/client.js', () => ({
  getSystemContainer: () => ({ item: () => ({ read, replace }), items: { create } }),
}));
const { systemDocsRepo } = await import('../../src/cosmos/system-docs-repository.js');

beforeEach(() => vi.resetAllMocks());

describe('getEffectiveIncentiveConfig', () => {
  it('returns defaults when the doc has never been written (dark launch)', async () => {
    read.mockResolvedValue({ resource: undefined });
    expect(await systemDocsRepo.getEffectiveIncentiveConfig()).toMatchObject({
      enabled: false, milestones: [], capFractionBps: 6000, minCountableBookingPaise: 24_900,
    });
  });
  it('applies per-field defaults to a partially-populated stored doc', async () => {
    read.mockResolvedValue({ resource: { id: 'incentive-config', enabled: true } });
    const cfg = await systemDocsRepo.getEffectiveIncentiveConfig();
    expect(cfg.enabled).toBe(true);
    expect(cfg.capFractionBps).toBe(6000);
  });
});

describe('patchIncentiveConfig', () => {
  it('merges under IfMatch and never drops a field the patch did not name', async () => {
    // The regression this exists for: upsertCommissionConfig used to rebuild a fixed-field doc
    // and wipe the thresholds (spec §5.3). A patch must never erase what it did not mention.
    read.mockResolvedValue({
      resource: { id: 'incentive-config', enabled: true, capFractionBps: 5000,
        milestones: [{ jobs: 10, bonusPaise: 30_000 }] },
      etag: '"v1"',
    });
    replace.mockResolvedValue({});
    const out = await systemDocsRepo.patchIncentiveConfig({ capFractionBps: 7000 }, 'admin-1');
    expect(out).toMatchObject({ enabled: true, capFractionBps: 7000, updatedBy: 'admin-1',
      milestones: [{ jobs: 10, bonusPaise: 30_000 }] });
    expect(replace.mock.calls[0]![1]).toMatchObject({ accessCondition: { type: 'IfMatch', condition: '"v1"' } });
  });
  it('creates the doc on first write', async () => {
    read.mockResolvedValue({ resource: undefined });
    create.mockResolvedValue({});
    const out = await systemDocsRepo.patchIncentiveConfig({ enabled: true }, 'admin-1');
    expect(create).toHaveBeenCalledTimes(1);
    expect(out).toMatchObject({ enabled: true, capFractionBps: 6000 });
  });
  it('replaces the milestone table wholesale rather than merging element-wise', async () => {
    // The admin editor submits the whole table; an element-wise merge could never express a
    // deletion.
    read.mockResolvedValue({
      resource: { id: 'incentive-config', milestones: [{ jobs: 5, bonusPaise: 10_000 }, { jobs: 10, bonusPaise: 30_000 }] },
      etag: '"v1"',
    });
    replace.mockResolvedValue({});
    const out = await systemDocsRepo.patchIncentiveConfig({ milestones: [{ jobs: 8, bonusPaise: 20_000 }] }, 'a1');
    expect(out.milestones).toEqual([{ jobs: 8, bonusPaise: 20_000 }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npx vitest run tests/cosmos/system-docs-incentive.test.ts`
Expected: FAIL — `systemDocsRepo.getEffectiveIncentiveConfig is not a function`.

- [ ] **Step 3: Write minimal implementation**

Add to the imports of `api/src/cosmos/system-docs-repository.ts`:

```typescript
import {
  INCENTIVE_CONFIG_DOC_ID as INCENTIVE_CONFIG_ID,
  toEffectiveIncentiveConfig,
  type IncentiveConfigDoc, type EffectiveIncentiveConfig, type UpdateIncentiveConfigBody,
} from '../schemas/incentive.js';
```

Add two methods to `systemDocsRepo` (keep `getIncentiveConfig` untouched):

```typescript
  /** Defaults-applied read. Never 404s — an unwritten doc means "incentives are dark". */
  async getEffectiveIncentiveConfig(): Promise<EffectiveIncentiveConfig> {
    const { resource } = await getSystemContainer()
      .item(INCENTIVE_CONFIG_ID, INCENTIVE_CONFIG_ID)
      .read<IncentiveConfigDoc>();
    return toEffectiveIncentiveConfig(resource ?? null);
  },

  /**
   * Field-scoped read-merge under IfMatch — NOT a whole-doc upsert. A PUT naming only
   * `capFractionBps` must leave `enabled` and `milestones` exactly as they were (spec §5.3;
   * this is the bug `upsertCommissionConfig` shipped with). `milestones` is the one exception:
   * replaced wholesale, because the admin editor submits the whole table.
   */
  async patchIncentiveConfig(
    body: UpdateIncentiveConfigBody,
    updatedBy: string,
  ): Promise<EffectiveIncentiveConfig> {
    const merged = await readMergeWrite<IncentiveConfigDoc & { id: typeof INCENTIVE_CONFIG_ID }>(
      INCENTIVE_CONFIG_ID,
      (resource) => ({
        ...(resource ?? { id: INCENTIVE_CONFIG_ID }),
        id: INCENTIVE_CONFIG_ID,
        ...definedOnly(body),
        updatedBy,
        updatedAt: new Date().toISOString(),
      }),
    );
    return toEffectiveIncentiveConfig(merged);
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && npx vitest run tests/cosmos/system-docs-incentive.test.ts tests/cosmos/system-docs-repository.test.ts`
Expected: PASS, both files.

- [ ] **Step 5: Commit**

```bash
git add api/src/cosmos/system-docs-repository.ts api/tests/cosmos/system-docs-incentive.test.ts
git commit -m "feat(api): incentive config read-merge repo methods (E23-S01)"
```

---

# WS-B — service core (the money engine)

### Task 5: `computeWeek` — the pure milestone / cap / min-countable rule

**Files:** Create `api/src/services/incentive.service.ts` (pure exports only in this task) · Test `api/tests/services/incentive.compute.test.ts`

**Interfaces:**
- Consumes: `Milestone`, `EffectiveIncentiveConfig`, `IncentiveAwardStatus` (Task 2); `istWeekBounds` (Task 1, in the test only).
- Produces: `type WeekCountableReceivable = { bookingId: string; bookingAmount: number; commissionDue: number; createdAt: string }` · `type ComputeWeekResult = { countedJobs: number; countedCommissionPaise: number; reachedMilestone?: Milestone; grossBonusPaise: number; capPaise: number; awardedPaise: number }` · `computeWeek(input: { receivables: readonly WeekCountableReceivable[]; startUtc: Date; endUtc: Date; cfg: Pick<EffectiveIncentiveConfig, 'milestones' | 'capFractionBps' | 'minCountableBookingPaise'> }): ComputeWeekResult` · `deriveAwardStatus(awardedPaise: number, appliedPaise: number): IncentiveAwardStatus`

**Counting rule (spec §7.8, verbatim):** a job counts when its receivable's `createdAt` falls in the IST week **and** `bookingAmount >= minCountableBookingPaise`. **`WAIVED` receivables still count** — the technician did the job. Do not filter on `remittanceStatus`.

- [ ] **Step 1: Write the failing test**

```typescript
// api/tests/services/incentive.compute.test.ts
import { describe, it, expect } from 'vitest';
import { computeWeek, deriveAwardStatus } from '../../src/services/incentive.service.js';
import { istWeekBounds } from '../../src/lib/ist-time.js';

const { startUtc, endUtc } = istWeekBounds('2026-W37'); // Mon 2026-09-07 .. Sun 2026-09-13 IST
const cfg = {
  milestones: [{ jobs: 5, bonusPaise: 10_000 }, { jobs: 10, bonusPaise: 30_000 }],
  capFractionBps: 6000, minCountableBookingPaise: 24_900,
};
/** `n` receivables of `amount` paise each, commission at the platform default 22%. */
const jobs = (n: number, amount: number, iso = '2026-09-09T10:00:00.000Z') =>
  Array.from({ length: n }, (_, i) => ({
    bookingId: `b${i}`, bookingAmount: amount, commissionDue: Math.round(amount * 0.22), createdAt: iso,
  }));
const run = (receivables: ReturnType<typeof jobs>, c = cfg) => computeWeek({ receivables, startUtc, endUtc, cfg: c });

describe('computeWeek — milestones', () => {
  it('awards nothing below the lowest milestone', () => {
    expect(run(jobs(4, 100_000))).toMatchObject({ countedJobs: 4, grossBonusPaise: 0, awardedPaise: 0 });
  });
  it('awards the HIGHEST milestone reached, not the sum of all reached', () => {
    expect(run(jobs(12, 100_000))).toMatchObject({
      reachedMilestone: { jobs: 10, bonusPaise: 30_000 }, grossBonusPaise: 30_000,
    });
  });
  it('awards the exact-boundary milestone, and nothing when the table is empty', () => {
    expect(run(jobs(5, 100_000)).grossBonusPaise).toBe(10_000);
    expect(run(jobs(50, 100_000), { ...cfg, milestones: [] }).awardedPaise).toBe(0);
  });
});

describe('computeWeek — the anti-gaming cap (spec §2 item 4, §10)', () => {
  it('PROOF: the all-cheap-jobs attack is capped, not paid in full', () => {
    // 10 x ₹249 -> generated commission 54_780 paise. At 3000 bps the cap is 16_434, well below
    // the ₹300 milestone bonus, so the cap — not the milestone — decides what is paid.
    const r = run(jobs(10, 24_900), { ...cfg, capFractionBps: 3000 });
    expect(r.countedCommissionPaise).toBe(54_780);
    expect(r.grossBonusPaise).toBe(30_000);
    expect(r.capPaise).toBe(16_434);
    expect(r.awardedPaise).toBe(16_434); // capped, NOT 30_000
  });
  it('PROOF: the margin attack from the design doc, priced exactly at the shipped 6000 bps', () => {
    // 7 real ₹1000 jobs + 3 faked ₹249 jobs to cross the 10-job milestone.
    //   generated commission = 7*22_000 + 3*5_478 = 170_434; cap = floor(*0.6) = 102_260
    //   gross bonus 30_000 is UNDER that cap, so 6000 bps does NOT close this specific case.
    // Recorded honestly rather than asserting protection that does not exist; ADR-0035 states
    // the residual and the lever (the next test).
    const attack = [...jobs(7, 100_000), ...jobs(3, 24_900, '2026-09-10T10:00:00.000Z')];
    const r = run(attack);
    expect(r.countedJobs).toBe(10);
    expect(r.countedCommissionPaise).toBe(170_434);
    expect(r.capPaise).toBe(102_260);
    expect(r.awardedPaise).toBe(30_000);
    expect(r.awardedPaise - 3 * 5_478).toBe(13_566); // the residual margin, documented
  });
  it('PROOF: the same attack IS closed at 1500 bps, with no false positive on honest work', () => {
    const attack = [...jobs(7, 100_000), ...jobs(3, 24_900, '2026-09-10T10:00:00.000Z')];
    expect(run(attack, { ...cfg, capFractionBps: 1500 }).awardedPaise).toBe(25_565); // capped
    // An honest 10-job week generates 220_000; floor(*0.15) = 33_000 > 30_000 -> untouched.
    expect(run(jobs(10, 100_000), { ...cfg, capFractionBps: 1500 }).awardedPaise).toBe(30_000);
  });
  it('PROOF: 10 genuine jobs are never capped at the shipped setting', () => {
    expect(run(jobs(10, 100_000))).toMatchObject({ capPaise: 132_000, awardedPaise: 30_000 });
  });
  it('a 0 bps cap awards nothing; a 10000 bps cap never reduces the bonus', () => {
    expect(run(jobs(20, 100_000), { ...cfg, capFractionBps: 0 }).awardedPaise).toBe(0);
    expect(run(jobs(10, 100_000), { ...cfg, capFractionBps: 10_000 }).awardedPaise).toBe(30_000);
  });
  it('rounds the cap DOWN — the platform never over-credits by a rounding paisa', () => {
    const r = computeWeek({
      receivables: [{ bookingId: 'b', bookingAmount: 24_900, commissionDue: 1, createdAt: '2026-09-09T10:00:00.000Z' }],
      startUtc, endUtc, cfg: { ...cfg, milestones: [{ jobs: 1, bonusPaise: 10_000 }] },
    });
    expect(r).toMatchObject({ capPaise: 0, awardedPaise: 0 });
  });
});

describe('computeWeek — the minCountableBookingPaise guard', () => {
  it('PROOF: ₹1 phantom bookings cannot pad the job count', () => {
    // 4 real + 20 x ₹1. Without the guard that is 24 jobs -> ₹300 for ₹4.40 of fake commission.
    expect(run([...jobs(4, 100_000), ...jobs(20, 100, '2026-09-10T10:00:00.000Z')]))
      .toMatchObject({ countedJobs: 4, awardedPaise: 0 });
  });
  it('PROOF: sub-threshold bookings are excluded from the commission base, so they cannot inflate the cap', () => {
    const r = computeWeek({
      receivables: [...jobs(1, 100_000), ...jobs(1, 100, '2026-09-10T10:00:00.000Z')],
      startUtc, endUtc, cfg: { ...cfg, milestones: [{ jobs: 1, bonusPaise: 1 }] },
    });
    expect(r.countedCommissionPaise).toBe(22_000); // the ₹1 job's 22 paise is NOT in the base
  });
  it('counts a booking exactly AT the threshold; a threshold of 0 counts everything', () => {
    expect(run(jobs(1, 24_900)).countedJobs).toBe(1);
    expect(run(jobs(3, 1), { ...cfg, minCountableBookingPaise: 0 }).countedJobs).toBe(3);
  });
});

describe('computeWeek — IST week boundaries', () => {
  it('includes Monday 00:00:00.000 IST and the last ms of Sunday, excludes the next Monday', () => {
    expect(run(jobs(1, 100_000, startUtc.toISOString())).countedJobs).toBe(1);
    expect(run(jobs(1, 100_000, new Date(endUtc.getTime() - 1).toISOString())).countedJobs).toBe(1);
    expect(run(jobs(1, 100_000, endUtc.toISOString())).countedJobs).toBe(0); // half-open
  });
  it('excludes a job done Sunday 23:00 UTC that is already Monday 04:30 IST', () => {
    // The whole reason week maths is done in IST: in UTC this job reads as "last week".
    expect(run(jobs(1, 100_000, '2026-09-13T23:00:00.000Z')).countedJobs).toBe(0);
  });
  it('excludes a job from the previous week', () => {
    expect(run(jobs(1, 100_000, '2026-09-05T10:00:00.000Z')).countedJobs).toBe(0);
  });
  it('counts a WAIVED receivable — enforced structurally, the input type has no status field', () => {
    expect(run(jobs(5, 100_000)).countedJobs).toBe(5);
  });
});

describe('deriveAwardStatus', () => {
  it('maps applied-vs-awarded onto the three states, over-applied included', () => {
    expect(deriveAwardStatus(30_000, 0)).toBe('AWARDED');
    expect(deriveAwardStatus(30_000, 12_000)).toBe('PARTIAL');
    expect(deriveAwardStatus(30_000, 30_000)).toBe('APPLIED');
    expect(deriveAwardStatus(30_000, 31_000)).toBe('APPLIED');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npx vitest run tests/services/incentive.compute.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/services/incentive.service.js"`.

- [ ] **Step 3: Write minimal implementation**

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && npx vitest run tests/services/incentive.compute.test.ts`
Expected: PASS, 17 tests. All six `PROOF:` tests must be green — they are the constructed-realistic-input proofs for the cap and the min-countable guard that the Global Constraints require.

- [ ] **Step 5: Commit**

```bash
git add api/src/services/incentive.service.ts api/tests/services/incentive.compute.test.ts
git commit -m "feat(api): pure weekly milestone computation with cap + min-countable guards (E23-S01)"
```

---

### Task 6: Award repository — single-partition reads plus two cross-partition queries

**Files:** Create `api/src/cosmos/incentive-repository.ts` · Modify `api/src/cosmos/commission-receivable-repository.ts` (append one method) · Test: append to `api/tests/cosmos/incentive-repository.test.ts`

**Interfaces:**
- Consumes: `getCommissionReceivablesContainer`; `IncentiveAwardDoc` (Task 2); `istDateStr`, `IST_OFFSET_MS`.
- Produces on a new `incentiveRepo`: `listAwards(technicianId): Promise<IncentiveAwardDoc[]>` (single-partition, newest first) · `getAwardWithEtag(technicianId, awardId): Promise<{ doc: IncentiveAwardDoc; etag: string } | null>` · `listAwardsCrossPartition(opts: { weekKey?: string; technicianId?: string; continuationToken?: string; maxItemCount?: number }): Promise<{ awards: IncentiveAwardDoc[]; continuationToken?: string }>` · `sumAppliedByIstDay(fromIstDate: string, toIstDate: string): Promise<Map<string, number>>`
- Produces on `commissionReceivableRepo`: `listTechnicianIdsWithReceivablesInWindow(fromIso: string, toIsoExclusive: string): Promise<Array<{ technicianId: string; receivableCount: number }>>`

- [ ] **Step 1: Write the failing test** (append to `api/tests/cosmos/incentive-repository.test.ts`; add `const { incentiveRepo } = await import('../../src/cosmos/incentive-repository.js');` beside the existing repo import)

```typescript
describe('incentiveRepo — single-partition reads', () => {
  it('lists awards newest-first, and [] when there are none', async () => {
    fetchAll.mockResolvedValue({ resources: [
      { ...awardDoc, id: 'inc:t1:2026-W37', weekKey: '2026-W37', computedAt: '2026-09-14T00:30:00.000Z' },
      { ...awardDoc, id: 'inc:t1:2026-W36', weekKey: '2026-W36', computedAt: '2026-09-07T00:30:00.000Z' },
    ] });
    expect((await incentiveRepo.listAwards('t1')).map((a) => a.weekKey)).toEqual(['2026-W37', '2026-W36']);
    fetchAll.mockResolvedValue({ resources: [] });
    expect(await incentiveRepo.listAwards('t1')).toEqual([]);
  });
  it('getAwardWithEtag returns the doc plus the etag the reconciler needs, or null', async () => {
    itemRead.mockResolvedValue({ resource: awardDoc, etag: '"v7"' });
    expect(await incentiveRepo.getAwardWithEtag('t1', 'inc:t1:2026-W37')).toEqual({ doc: awardDoc, etag: '"v7"' });
    itemRead.mockResolvedValue({ resource: undefined });
    expect(await incentiveRepo.getAwardWithEtag('t1', 'inc:t1:2026-W37')).toBeNull();
  });
});

describe('incentiveRepo.listAwardsCrossPartition', () => {
  it('returns one page and passes the continuation token through', async () => {
    hasMoreResults.mockReturnValue(true);
    fetchNext.mockResolvedValue({ resources: [awardDoc], continuationToken: 'ct-2' });
    const out = await incentiveRepo.listAwardsCrossPartition({ weekKey: '2026-W37', technicianId: 't1' });
    expect(out).toMatchObject({ continuationToken: 'ct-2' });
    expect(out.awards).toHaveLength(1);
  });
  it('omits continuationToken on the last page and never calls fetchNext when already done', async () => {
    hasMoreResults.mockReturnValue(true);
    fetchNext.mockResolvedValue({ resources: [awardDoc], continuationToken: undefined });
    expect(await incentiveRepo.listAwardsCrossPartition({})).not.toHaveProperty('continuationToken');
    vi.mocked(fetchNext).mockClear();
    hasMoreResults.mockReturnValue(false);
    expect(await incentiveRepo.listAwardsCrossPartition({})).toEqual({ awards: [] });
    expect(fetchNext).not.toHaveBeenCalled();
  });
});

describe('incentiveRepo.sumAppliedByIstDay', () => {
  it('buckets appliedPaise by the IST calendar day of computedAt', async () => {
    fetchAll.mockResolvedValue({ resources: [
      { appliedPaise: 30_000, computedAt: '2026-09-13T19:00:00.000Z' }, // Mon 2026-09-14 00:30 IST
      { appliedPaise: 10_000, computedAt: '2026-09-13T19:05:00.000Z' },
      { appliedPaise: 5_000,  computedAt: '2026-09-06T19:00:00.000Z' }, // Mon 2026-09-07 00:30 IST
    ] });
    const m = await incentiveRepo.sumAppliedByIstDay('2026-09-01', '2026-09-30');
    expect([m.get('2026-09-14'), m.get('2026-09-07'), m.size]).toEqual([40_000, 5_000, 2]);
  });
  it('skips a malformed row rather than putting NaN on the owner P&L', async () => {
    fetchAll.mockResolvedValue({ resources: [
      { appliedPaise: null, computedAt: '2026-09-13T19:00:00.000Z' },
      { appliedPaise: 100, computedAt: undefined },
      { appliedPaise: 700, computedAt: '2026-09-13T19:00:00.000Z' },
    ] });
    const m = await incentiveRepo.sumAppliedByIstDay('2026-09-01', '2026-09-30');
    expect(m.get('2026-09-14')).toBe(700);
    expect([...m.values()].every(Number.isFinite)).toBe(true);
  });
});

describe('commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow', () => {
  it('drains every page of the GROUP BY aggregate', async () => {
    hasMoreResults.mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValue(false);
    fetchNext
      .mockResolvedValueOnce({ resources: [{ technicianId: 't1', receivableCount: 3 }] })
      .mockResolvedValueOnce({ resources: [{ technicianId: 't2', receivableCount: 1 }] });
    expect(await commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow(
      '2026-09-06T18:30:00.000Z', '2026-09-13T18:30:00.000Z',
    )).toEqual([{ technicianId: 't1', receivableCount: 3 }, { technicianId: 't2', receivableCount: 1 }]);
  });
  it('SURVIVES a page whose resources is undefined, not []', async () => {
    // Cosmos returns `resources: undefined` on aggregate GROUP BY pages while hasMoreResults()
    // stays true. An idealised mock returning [] hid exactly this as a production 500 behind
    // 1,935 green tests; spreading it unguarded throws "page.resources is not iterable".
    hasMoreResults.mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValue(false);
    fetchNext
      .mockResolvedValueOnce({ resources: undefined })
      .mockResolvedValueOnce({ resources: [{ technicianId: 't1', receivableCount: 2 }] });
    expect(await commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow('a', 'b'))
      .toEqual([{ technicianId: 't1', receivableCount: 2 }]);
  });
  it('returns [] when every page is undefined', async () => {
    hasMoreResults.mockReturnValueOnce(true).mockReturnValue(false);
    fetchNext.mockResolvedValueOnce({ resources: undefined });
    expect(await commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow('a', 'b')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npx vitest run tests/cosmos/incentive-repository.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/cosmos/incentive-repository.js"`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// api/src/cosmos/incentive-repository.ts
import { getCommissionReceivablesContainer } from './client.js';
import { istDateStr, IST_OFFSET_MS } from '../lib/ist-time.js';
import type { IncentiveAwardDoc } from '../schemas/incentive.js';

const AWARD_FILTER = `c.docType = 'INCENTIVE_AWARD'`;
const DEFAULT_PAGE_SIZE = 50;

export const incentiveRepo = {
  /** Single-partition (pk = /technicianId): cheap and safe per request. Newest week first. */
  async listAwards(technicianId: string): Promise<IncentiveAwardDoc[]> {
    const { resources } = await getCommissionReceivablesContainer()
      .items.query<IncentiveAwardDoc>(
        { query: `SELECT * FROM c WHERE ${AWARD_FILTER} ORDER BY c.computedAt DESC` },
        { partitionKey: technicianId },
      ).fetchAll();
    return resources ?? [];
  },

  /** The reconciler's conditional Replace needs the etag, which a plain point read discards. */
  async getAwardWithEtag(
    technicianId: string, awardId: string,
  ): Promise<{ doc: IncentiveAwardDoc; etag: string } | null> {
    const { resource, etag } = await getCommissionReceivablesContainer()
      .item(awardId, technicianId).read<IncentiveAwardDoc>();
    return resource ? { doc: resource, etag: etag ?? '' } : null;
  },

  // SEMGREP-JUSTIFIED: cross-partition by design — the admin-wide award listing. Sole callers
  // are requireAdmin handlers; both filters are bound as query parameters and never reach the
  // query text.
  async listAwardsCrossPartition(opts: {
    weekKey?: string; technicianId?: string; continuationToken?: string; maxItemCount?: number;
  }): Promise<{ awards: IncentiveAwardDoc[]; continuationToken?: string }> {
    const where: string[] = [AWARD_FILTER];
    const parameters: Array<{ name: string; value: string }> = [];
    if (opts.weekKey !== undefined) {
      where.push('c.weekKey = @weekKey');
      parameters.push({ name: '@weekKey', value: opts.weekKey });
    }
    if (opts.technicianId !== undefined) {
      where.push('c.technicianId = @technicianId');
      parameters.push({ name: '@technicianId', value: opts.technicianId });
    }
    const iterator = getCommissionReceivablesContainer().items.query<IncentiveAwardDoc>(
      { query: `SELECT * FROM c WHERE ${where.join(' AND ')} ORDER BY c.computedAt DESC`, parameters },
      {
        maxItemCount: opts.maxItemCount ?? DEFAULT_PAGE_SIZE,
        ...(opts.continuationToken !== undefined ? { continuationToken: opts.continuationToken } : {}),
      },
    );
    // NOT an aggregate, so one fetchNext is a real page and the continuation token is meaningful
    // — unlike sumDueGroupedByTechnician, which must be drained in full.
    if (!iterator.hasMoreResults()) return { awards: [] };
    const page = await iterator.fetchNext();
    return {
      awards: page.resources ?? [],
      ...(page.continuationToken !== undefined ? { continuationToken: page.continuationToken } : {}),
    };
  },

  // SEMGREP-JUSTIFIED: cross-partition by design — the platform-wide incentive cost line on the
  // owner P&L. Sole caller is getDailyPnL, behind requireAdmin; both bounds are server-derived
  // from a validated YYYY-MM-DD range and bound as query parameters.
  /**
   * `appliedPaise` per IST calendar day, keyed on the award's `computedAt`.
   *
   * Deliberate asymmetry with the rest of `getDailyPnL`, which buckets bookings by the UTC day
   * of `completedAt`: spec §7.8 asks for the incentive line in IST days, and re-bucketing
   * bookings to match is out of scope — it would silently move every historical number on the
   * owner's P&L. Recorded in ADR-0035 as an accepted seam.
   */
  async sumAppliedByIstDay(fromIstDate: string, toIstDate: string): Promise<Map<string, number>> {
    const fromUtc = new Date(new Date(`${fromIstDate}T00:00:00.000Z`).getTime() - IST_OFFSET_MS).toISOString();
    const toUtc = new Date(new Date(`${toIstDate}T23:59:59.999Z`).getTime() - IST_OFFSET_MS).toISOString();
    const { resources } = await getCommissionReceivablesContainer()
      .items.query<{ appliedPaise: number; computedAt: string }>({
        query: `SELECT c.appliedPaise, c.computedAt FROM c WHERE ${AWARD_FILTER} AND c.computedAt >= @from AND c.computedAt <= @to`,
        parameters: [{ name: '@from', value: fromUtc }, { name: '@to', value: toUtc }],
      }).fetchAll();
    const byDay = new Map<string, number>();
    for (const r of resources ?? []) {
      // A malformed row must never turn the owner's netToOwner into NaN.
      if (typeof r?.appliedPaise !== 'number' || typeof r?.computedAt !== 'string') continue;
      const day = istDateStr(new Date(r.computedAt));
      byDay.set(day, (byDay.get(day) ?? 0) + r.appliedPaise);
    }
    return byDay;
  },
};
```

Append to `commissionReceivableRepo` in `api/src/cosmos/commission-receivable-repository.ts`:

```typescript
  /**
   * Every technician who booked at least one receivable in `[fromIso, toIsoExclusive)` — the
   * roster the weekly incentive run iterates. Same drain-the-iterator shape, and the same
   * `resources ?? []` guard, as `sumDueGroupedByTechnician` above: Cosmos cannot page a
   * cross-partition GROUP BY with continuation tokens, and its pages come back with
   * `resources: undefined` rather than `[]` while `hasMoreResults()` stays true.
   */
  // SEMGREP-JUSTIFIED: cross-partition GROUP BY by design — the weekly incentive roster.
  // Callers are the requireAdmin run handler and the app.timer; both bounds are server-derived
  // from a regex-validated ISO week key and bound as query parameters.
  async listTechnicianIdsWithReceivablesInWindow(
    fromIso: string, toIsoExclusive: string,
  ): Promise<Array<{ technicianId: string; receivableCount: number }>> {
    const iterator = getCommissionReceivablesContainer()
      .items.query<{ technicianId: string; receivableCount: number }>(
        {
          query:
            `SELECT c.technicianId, COUNT(1) AS receivableCount FROM c ` +
            `WHERE ${RECEIVABLE_FILTER} AND c.createdAt >= @from AND c.createdAt < @to ` +
            `GROUP BY c.technicianId`,
          parameters: [{ name: '@from', value: fromIso }, { name: '@to', value: toIsoExclusive }],
        },
        { maxItemCount: 100 },
      );
    const groups: Array<{ technicianId: string; receivableCount: number }> = [];
    while (iterator.hasMoreResults()) {
      const page = await iterator.fetchNext();
      groups.push(...(page.resources ?? []));
    }
    return groups;
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && npx vitest run tests/cosmos/incentive-repository.test.ts`
Expected: PASS. `SURVIVES a page whose resources is undefined` is the mandated aggregate-mock proof: written without `?? []` the implementation fails it with `page.resources is not iterable` — exactly the production 500 the guard prevents.

- [ ] **Step 5: Commit**

```bash
git add api/src/cosmos/incentive-repository.ts api/src/cosmos/commission-receivable-repository.ts api/tests/cosmos/incentive-repository.test.ts
git commit -m "feat(api): incentive award repository + weekly technician roster query (E23-S01)"
```

---


## Part 1 complete — continue in Part 2

Tasks 1–6 deliver the schema and data layer: IST week keys, every incentive Zod type, the typed `INCENTIVE_AWARD` branch of the ledger union, config read/patch on the `system` container, the pure weekly rule with both anti-gaming guards proven, and the award repository including the two cross-partition queries. Nothing writes money yet and there is no HTTP surface.

**This story is three plan documents. Execute them in order:**

| Part | File | Tasks | Delivers |
|---|---|---|---|
| 1 | `plans/e23-s01-incentive-engine.md` (this file) | 1–6 | WS-A schemas + types; the pure rule and the award repository |
| 2 | `plans/e23-s01b-incentive-application.md` | 7–14 | `applyAward` via the ledger allocator, absolute reconciliation, the orchestrator, the five routes, the Monday timer |
| 3 | `plans/e23-s01c-incentive-pnl-gates-rollout.md` | 15–21 | The P&L line, the credit-only Semgrep + static gates, OpenAPI, ADR-0035, docs, smoke gate, Codex + `/security-review`, rollout |

**Why three documents.** Written as one it measured ~3,270 lines; the project's Foundation-tier story size gate warns past 1,200 and **requires** a split past 1,500. Each part now clears 1,500 (1,186 / 1,353 / 737). The boundaries are the layer split the project CLAUDE.md prescribes for this case — WS-A plus the data/pure half of WS-B here, the money-writing and controller half next, WS-C and WS-E last. Each part depends on its predecessors only through the exported interfaces its tasks name, and **this file's Global Constraints section governs all three** — read this header before executing any of them.

This is one story and one branch (`feat/e23-s01-incentive-engine`), one PR, one review gate. The split is a document-size measure, not three stories.

Before moving on, confirm the whole engine layer is green:

```bash
cd api && npx vitest run tests/lib/ tests/schemas/incentive.test.ts tests/cosmos/ && npx tsc --noEmit -p tsconfig.tests.json
```
