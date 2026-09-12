# E23-S01 Weekly Incentive Milestones — Implementation Plan, Part 3

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisites:** `plans/e23-s01-incentive-engine.md` (Part 1, Tasks 1–6) and `plans/e23-s01b-incentive-application.md` (Part 2, Tasks 7–14) complete and committed. **Read Part 1's header before starting** — its Goal, Architecture, Spec references, the four corrections to the spec, and its **Global Constraints** govern all three documents.

**Goal (this part):** Put the incentive cost on the owner P&L, lock credit-only behind static gates proven against real violations, register the contract, write ADR-0035 and the operational docs, and take the story through the smoke gate and the Codex + `/security-review` review gate.

**Tasks:** 15 finishes WS-B (the P&L line). 16–17 are WS-C (audit enum, cross-partition registration, Semgrep + static gate). **WS-D is skipped — no client in this story.** 18–21 are WS-E (ledger passthrough, OpenAPI, docs, review gate). Tasks 15, 16 and 17 are mutually independent and can run in parallel; 18–21 are sequential and last.

**Inherited open item:** Part 2 left `npx tsc --noEmit` with one expected error — the two new audit action strings are not yet in the `AuditAction` union. Task 16 closes it; everything from Task 16 onward must typecheck clean.

# WS-B (concluded) — the owner P&L line

### Task 15: `incentiveCostPaise` on the owner P&L

**Files:** Modify `api/src/schemas/finance.ts` and `api/src/cosmos/finance-repository.ts` · Test `api/tests/cosmos/finance-incentive-cost.test.ts`

**Interfaces:** Consumes `incentiveRepo.sumAppliedByIstDay` (Part 1 Task 6). Produces `DailyPnLEntry.incentiveCostPaise?: number` and `FinanceSummary.totalIncentiveCost?: number`.

**Two read-path widenings are required, not optional.** `DailyPnLEntrySchema.netToOwner` and `FinanceSummarySchema.totalNet` are currently `z.number().nonnegative()`. An award applied on a Monday with no completed bookings that day produces `gross 0 − commission 0 − incentiveCost > 0` — a legitimately negative net. Widening `.nonnegative()` off is a widening (spec §3.3 permits it; tightening would not be).

- [ ] **Step 1: Write the failing test**

```typescript
// api/tests/cosmos/finance-incentive-cost.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DailyPnLEntrySchema, FinanceSummarySchema } from '../../src/schemas/finance.js';

describe('finance schemas widen for the incentive line', () => {
  it('accepts a negative netToOwner — an award on a day with no bookings', () => {
    expect(() => DailyPnLEntrySchema.parse({ date: '2026-09-14', grossRevenue: 0, commission: 0,
      netToOwner: -30_000, incentiveCostPaise: 30_000 })).not.toThrow();
  });
  it('still accepts an entry with no incentiveCostPaise at all (optional, additive)', () => {
    expect(() => DailyPnLEntrySchema.parse({ date: '2026-09-14', grossRevenue: 100, commission: 22,
      netToOwner: 78 })).not.toThrow();
  });
  it('accepts a negative totalNet', () => {
    expect(() => FinanceSummarySchema.parse({ dailyPnL: [], totalGross: 0, totalCommission: 0,
      totalNet: -30_000, totalIncentiveCost: 30_000 })).not.toThrow();
  });
});
```

Then, in the same file, cover `getDailyPnL` itself. The container-mock helpers are the same shape as `api/tests/cosmos/finance-pnl-truth.test.ts` uses:

```typescript
vi.mock('../../src/cosmos/client.js', () => ({ getCosmosClient: vi.fn(), DB_NAME: 'homeservices' }));
vi.mock('../../src/cosmos/incentive-repository.js');
import { getCosmosClient } from '../../src/cosmos/client.js';
import { incentiveRepo } from '../../src/cosmos/incentive-repository.js';
import { getDailyPnL } from '../../src/cosmos/finance-repository.js';

const makeContainer = (items: unknown[] = []) => ({
  items: { query: vi.fn().mockReturnValue({ fetchAll: async () => ({ resources: items }) }),
    create: vi.fn().mockResolvedValue({}), upsert: vi.fn().mockResolvedValue({}) },
  item: vi.fn().mockReturnValue({ read: async () => ({ resource: undefined }) }),
});
const makeClient = (c: Record<string, ReturnType<typeof makeContainer>>) => ({
  database: () => ({ container: (n: string) => c[n] ?? makeContainer() }),
});
/** One ₹1000 job completed 2026-09-14 with 22_000 of commission recorded against it. */
const arrangeBookings = (bookings: unknown[], receivables: unknown[]) =>
  vi.mocked(getCosmosClient).mockReturnValue(makeClient({
    bookings: makeContainer(bookings), commission_receivables: makeContainer(receivables),
  }) as never);
const job = { id: 'bk-1', technicianId: 't1', technicianName: 'Ravi', amount: 100_000,
  completedAt: '2026-09-14T10:00:00.000Z', status: 'COMPLETED' };

beforeEach(() => vi.clearAllMocks());

describe('getDailyPnL', () => {
  it('subtracts the incentive cost from netToOwner on a day that has bookings', async () => {
    arrangeBookings([job], [{ bookingId: 'bk-1', commissionDue: 22_000 }]);
    vi.mocked(incentiveRepo.sumAppliedByIstDay).mockResolvedValue(new Map([['2026-09-14', 30_000]]));
    const r = await getDailyPnL('2026-09-14', '2026-09-14');
    expect(r.dailyPnL[0]).toMatchObject({
      date: '2026-09-14', grossRevenue: 100_000, commission: 22_000,
      incentiveCostPaise: 30_000, netToOwner: 48_000,
    });
    expect(r).toMatchObject({ totalIncentiveCost: 30_000, totalNet: 48_000 });
  });

  it('creates a row for a day with an award but NO bookings, with a negative net', async () => {
    // Without this the cost silently vanishes on exactly the day it is most likely to land:
    // Monday 00:30 IST, before anyone has completed a job.
    arrangeBookings([], []);
    vi.mocked(incentiveRepo.sumAppliedByIstDay).mockResolvedValue(new Map([['2026-09-14', 30_000]]));
    const r = await getDailyPnL('2026-09-14', '2026-09-14');
    expect(r.dailyPnL).toHaveLength(1);
    expect(r.dailyPnL[0]).toMatchObject({
      date: '2026-09-14', grossRevenue: 0, commission: 0,
      incentiveCostPaise: 30_000, netToOwner: -30_000,
    });
    expect(r.totalNet).toBe(-30_000);
  });

  it('omits the field entirely on a day with no incentive cost', async () => {
    arrangeBookings([job], [{ bookingId: 'bk-1', commissionDue: 22_000 }]);
    vi.mocked(incentiveRepo.sumAppliedByIstDay).mockResolvedValue(new Map());
    const r = await getDailyPnL('2026-09-14', '2026-09-14');
    expect(r.dailyPnL[0]).not.toHaveProperty('incentiveCostPaise');
    expect(r).not.toHaveProperty('totalIncentiveCost');
    expect(r.dailyPnL[0]!.netToOwner).toBe(78_000);
  });

  it('never lets an incentive read failure take down the P&L — the cost degrades to 0', async () => {
    // Reporting endpoint: a cross-partition award query failing must degrade this one line,
    // not 502 the owner's whole dashboard.
    arrangeBookings([job], [{ bookingId: 'bk-1', commissionDue: 22_000 }]);
    vi.mocked(incentiveRepo.sumAppliedByIstDay).mockRejectedValue(new Error('cosmos down'));
    const r = await getDailyPnL('2026-09-14', '2026-09-14');
    expect(r.dailyPnL[0]!.netToOwner).toBe(78_000);
    expect(r.totalNet).toBe(78_000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npx vitest run tests/cosmos/finance-incentive-cost.test.ts`
Expected: FAIL — the negative-`netToOwner` parses throw (`Number must be greater than or equal to 0`).

- [ ] **Step 3: Write minimal implementation**

In `api/src/schemas/finance.ts`:

```typescript
  // WIDENED (E23-S01): an incentive applied on a day with no completed bookings makes the day's
  // net legitimately negative. Read paths only widen (spec §3.3), so `.nonnegative()` comes off
  // rather than the value being clamped and the owner shown a wrong zero.
  netToOwner: z.number(),
  /** Additive: commission offset by incentive credits that IST day. Optional so the
   *  Cosmos-derived FinanceSummary still satisfies this type before the field is set. */
  incentiveCostPaise: z.number().int().nonnegative().optional(),
```

and on `FinanceSummarySchema`: `totalNet: z.number(),` plus `totalIncentiveCost: z.number().nonnegative().optional(),`.

In `api/src/cosmos/finance-repository.ts`, inside `getDailyPnL`:

```typescript
import { incentiveRepo } from './incentive-repository.js';
```

```typescript
  // Reporting endpoint: a failure in the incentive query must degrade this line to zero, never
  // take down the owner's whole dashboard.
  const incentiveByDay = await incentiveRepo.sumAppliedByIstDay(from, to).catch(() => new Map<string, number>());

  // Union of booking days and award days. An award landing on a Monday 00:30, before anyone has
  // completed a job, would otherwise have no row at all and its cost would silently vanish.
  for (const day of incentiveByDay.keys()) {
    if (!byDate.has(day)) byDate.set(day, { gross: 0, commission: 0 });
  }

  for (const [date, { gross, commission }] of [...byDate.entries()].sort()) {
    const incentiveCostPaise = incentiveByDay.get(date) ?? 0;
    dailyPnL.push({
      date, grossRevenue: gross, commission,
      ...(incentiveCostPaise > 0 ? { incentiveCostPaise } : {}),
      netToOwner: gross - commission - incentiveCostPaise,
    });
    totalGross += gross;
    totalCommission += commission;
    totalIncentiveCost += incentiveCostPaise;
  }

  return {
    dailyPnL, totalGross, totalCommission,
    ...(totalIncentiveCost > 0 ? { totalIncentiveCost } : {}),
    totalNet: totalGross - totalCommission - totalIncentiveCost,
  };
```

(declare `let totalIncentiveCost = 0;` beside the existing `totalGross`/`totalCommission`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && npx vitest run tests/cosmos/finance-incentive-cost.test.ts tests/functions/admin/ && npx tsc --noEmit -p tsconfig.tests.json`
Expected: PASS. Existing finance tests must stay green — the field is additive and the widening only accepts more.

- [ ] **Step 5: Commit**

```bash
git add api/src/schemas/finance.ts api/src/cosmos/finance-repository.ts api/tests/cosmos/finance-incentive-cost.test.ts
git commit -m "feat(api): incentiveCostPaise line on the owner P&L (E23-S01)"
```

---

# WS-C — static gates, audit enum, cross-partition registration

### Task 16: Audit actions and cross-partition helper registration

**Files:** Modify `api/src/types/admin.ts` and `api/tests/cosmos/cross-partition-tenant-filter.test.ts`

**Interfaces:** Produces the `AuditAction` members `'INCENTIVE_AWARDED'` and `'INCENTIVE_CONFIG_UPDATED'` (spec §8). Registers the three new cross-partition helpers with the existing three-layer guard test.

This task closes the `tsc` error Task 10 knowingly left open.

- [ ] **Step 1: Write the failing test**

In `api/tests/cosmos/cross-partition-tenant-filter.test.ts`, add three entries to `CROSS_PARTITION_IMPORT_TOKENS` (Layer 2):

```typescript
  // E23-S01: the three cross-partition helpers the incentive engine added.
  { helper: 'commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow',
    importPattern: /commissionReceivableRepo\.listTechnicianIdsWithReceivablesInWindow\b/ },
  { helper: 'incentiveRepo.listAwardsCrossPartition', importPattern: /incentiveRepo\.listAwardsCrossPartition\b/ },
  { helper: 'incentiveRepo.sumAppliedByIstDay',       importPattern: /incentiveRepo\.sumAppliedByIstDay\b/ },
```

and two entries to `FILES_AND_HELPERS` (Layer 3):

```typescript
    { file: resolve(COSMOS_ROOT, 'incentive-repository.ts'),
      helpers: ['listAwardsCrossPartition', 'sumAppliedByIstDay'] },
```

plus `'listTechnicianIdsWithReceivablesInWindow'` appended to the existing `commission-receivable-repository.ts` helper list.

Add a Layer-1 block asserting the two new Semgrep rules are present (they land in Task 17, so this test is red until then — that is the intended ordering):

```typescript
  it('api/.semgrep.yml contains the incentives-credit-only rule id at ERROR severity (E23-S01)', () => {
    expect(semgrepSrc).toMatch(/^\s*-\s+id:\s+incentives-credit-only\s*$/m);
    const start = semgrepSrc.indexOf('id: incentives-credit-only');
    const next = semgrepSrc.indexOf('\n  - id:', start + 1);
    expect(next === -1 ? semgrepSrc.slice(start) : semgrepSrc.slice(start, next)).toMatch(/severity:\s+ERROR/);
  });
  it('api/.semgrep.yml contains the incentives-not-in-payout-path rule id (E23-S01)', () => {
    expect(semgrepSrc).toMatch(/^\s*-\s+id:\s+incentives-not-in-payout-path\s*$/m);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npx vitest run tests/cosmos/cross-partition-tenant-filter.test.ts`
Expected: FAIL on the two Semgrep-presence cases (Task 17 adds the rules) and on Layer 3 for `incentive-repository.ts` if a `SEMGREP-JUSTIFIED` comment is missing above either helper. **The Layer-3 failure is a real finding — fix it by adding the comment, not by relaxing the test.** Layer 2 should already pass: `run.ts` and `awards.ts` use `requireAdmin`, `trigger-incentive-weekly.ts` uses `app.timer`, and `me-incentives.ts` uses `verifyTechnicianToken`. If any fails, that endpoint genuinely lacks auth.

- [ ] **Step 3: Write minimal implementation**

In `api/src/types/admin.ts`, add to the `AuditAction` union under the existing "Booking & commission lifecycle" group:

```typescript
  | 'INCENTIVE_AWARDED'
  | 'INCENTIVE_CONFIG_UPDATED'
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && npx tsc --noEmit -p tsconfig.tests.json && npx vitest run tests/cosmos/cross-partition-tenant-filter.test.ts`
Expected: typecheck clean (Task 10's `auditLog` call now resolves); the cross-partition test still fails only on the two Semgrep-presence cases until Task 17.

- [ ] **Step 5: Commit**

```bash
git add api/src/types/admin.ts api/tests/cosmos/cross-partition-tenant-filter.test.ts
git commit -m "feat(api): incentive audit actions + register the new cross-partition helpers (E23-S01)"
```

---

### Task 17: `incentives-credit-only` — Semgrep rules and the static gate, proven

**Files:** Modify `api/.semgrep.yml` · Create `api/tests/static/incentives-credit-only.test.ts`

**Interfaces:** No exports. Produces two Semgrep rule ids (`incentives-credit-only`, `incentives-not-in-payout-path`) and a portable static test.

**Why two rules and not one.** Credit-only has two failure directions, and one Semgrep rule cannot carry two `paths` blocks. Rule A bans payout-shaped identifiers **inside** the incentive module. Rule B bans incentive identifiers **inside** the money-out files. Merging them into one id would mean listing payout files under a rule that also flags `netPayable` — which legitimately appears in `payout-queue.ts` — producing a permanent false positive. Spec §8 names only `incentives-credit-only`; `incentives-not-in-payout-path` is its sibling, and both are asserted present by Task 16.

**The static test is the primary gate.** `semgrep-action@v1` treats every finding as blocking regardless of severity, and Semgrep is not installed on every dev machine; the Vitest static test runs in the smoke gate and CI unconditionally. It also carries §7.8's "no `payout*` field on award docs" requirement.

- [ ] **Step 1: Write the failing test**

```typescript
// api/tests/static/incentives-credit-only.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
/** Identifiers that mean "money leaves the platform". None may appear in the incentive module. */
export const PAYOUT_TOKENS = /\b(payoutPaise|payoutAmount|payablePaise|netPayable|transferPaise|razorpayTransferId|RazorpayRouteService|createRouteTransfer)\b/;
/** Identifiers that mean "an incentive award". None may appear in a money-out file. */
export const INCENTIVE_TOKENS = /\b(IncentiveAwardDoc|IncentiveAwardWriteSchema|incentiveAwardId|INCENTIVE_AWARD|applyAward|listAwards|incentiveRepo)\b/;

const INCENTIVE_FILES = [
  'src/services/incentive.service.ts',
  'src/schemas/incentive.ts',
  'src/cosmos/incentive-repository.ts',
  'src/functions/trigger-incentive-weekly.ts',
];
/** Files that actually move money out of the platform. */
const PAYOUT_FILES = [
  'src/functions/admin/finance/approve-payouts.ts',
  'src/functions/admin/finance/payout-queue.ts',
  'src/functions/admin/finance/weekly-aggregate.ts',
  'src/functions/trigger-next-day-payout.ts',
  'src/services/razorpayRoute.service.ts',
];

const read = (rel: string) => readFileSync(resolve(API_ROOT, rel), 'utf8');
const scan = (rel: string, re: RegExp) =>
  read(rel).split('\n')
    .map((line, i) => ({ line: line.trim(), n: i + 1 }))
    // A comment naming the forbidden concept is documentation, not a payout path.
    .filter(({ line }) => !line.startsWith('//') && !line.startsWith('*') && !line.startsWith('/*'))
    .filter(({ line }) => re.test(line))
    .map(({ line, n }) => `${rel}:${n}: ${line}`);

describe('incentives are credit-only (spec §7.8, ADR-0035)', () => {
  it('no payout-shaped identifier appears anywhere in the incentive module', () => {
    const v = INCENTIVE_FILES.flatMap((f) => scan(f, PAYOUT_TOKENS));
    expect(v, `Payout identifiers in the incentive module:\n${v.join('\n')}`).toEqual([]);
  });

  it('no incentive identifier appears in any file that moves money out', () => {
    const v = PAYOUT_FILES.flatMap((f) => scan(f, INCENTIVE_TOKENS));
    expect(v, `Incentive identifiers in a payout path:\n${v.join('\n')}`).toEqual([]);
  });

  it('the award schema declares no payout-shaped field', () => {
    // §7.8's "static test: no payout* field on award docs", checked against the schema
    // declaration itself rather than a sample document.
    const src = read('src/schemas/incentive.ts');
    const block = src.slice(src.indexOf('const awardShape'), src.indexOf('IncentiveAwardWriteSchema'));
    expect(block.match(/^\s*(\w*payout\w*|\w*payable\w*|\w*transfer\w*)\s*:/gim) ?? []).toEqual([]);
  });

  it('the award WRITE schema is strict, so an unknown field cannot be persisted', () => {
    expect(read('src/schemas/incentive.ts'))
      .toMatch(/export const IncentiveAwardWriteSchema = z\.object\(awardShape\)\.strict\(\)/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails, then PROVE the guard catches its class**

Run: `cd api && npx vitest run tests/static/incentives-credit-only.test.ts`
Expected: PASS immediately (the code is already clean). **A guard that passes on a clean tree proves nothing.** Prove it catches a real violation before trusting it:

```bash
cd api
# 1. Payout identifier inside the incentive module.
printf '\nconst payoutPaise = 0; void payoutPaise;\n' >> src/services/incentive.service.ts
npx vitest run tests/static/incentives-credit-only.test.ts   # MUST FAIL, naming that line
git checkout -- src/services/incentive.service.ts

# 2. Incentive identifier inside a payout path.
printf '\n// eslint-disable-next-line\nconst x: unknown = null as unknown as IncentiveAwardDoc; void x;\n' >> src/functions/admin/finance/approve-payouts.ts
npx vitest run tests/static/incentives-credit-only.test.ts   # MUST FAIL, naming that line
git checkout -- src/functions/admin/finance/approve-payouts.ts

# 3. Payout field on the award schema.
#    Insert `  payoutPaise: z.number().int(),` inside `awardShape` in src/schemas/incentive.ts
npx vitest run tests/static/incentives-credit-only.test.ts   # MUST FAIL on tests 1 AND 3
git checkout -- src/schemas/incentive.ts

npx vitest run tests/static/incentives-credit-only.test.ts   # green again
```

Record in the commit message that all three injections were run and each failed. If any injection passes, the guard does not cover its class — widen the token regex until it does. Three guards in this repo shipped covering zero real cases; this step is why.

- [ ] **Step 3: Write minimal implementation**

Append to `api/.semgrep.yml`:

```yaml
  # E23-S01 / ADR-0035 — incentives are CREDIT-ONLY.
  #
  # An incentive award offsets commission the technician owes. It is never a payment TO the
  # technician. That is enforced in three independent layers:
  #   1. IncentiveAwardWriteSchema is `.strict()` — an unknown field cannot be persisted.
  #   2. api/tests/static/incentives-credit-only.test.ts (the portable gate; runs in the smoke
  #      gate and CI, and is proven against injected violations — see the story doc).
  #   3. These two rules.
  #
  # Two rule ids, not one, because a single rule cannot carry two `paths` blocks and the two
  # failure directions need different file sets. Merging them would flag `netPayable` inside
  # payout-queue.ts, where it is correct, and become a permanent false positive.
  - id: incentives-credit-only
    message: |
      Payout-shaped identifier in the incentive module. An incentive award is a CREDIT against
      commission owed, never a payment to the technician (ADR-0035, spec §7.8). If money must
      genuinely leave the platform for a technician, that is a payout story, not this one.
    severity: ERROR
    languages: [typescript]
    paths:
      include:
        - "api/src/services/incentive.service.ts"
        - "api/src/schemas/incentive.ts"
        - "api/src/cosmos/incentive-repository.ts"
        - "api/src/functions/trigger-incentive-weekly.ts"
        - "api/src/functions/admin/incentives/*.ts"
    pattern-either:
      - pattern: payoutPaise
      - pattern: payoutAmount
      - pattern: payablePaise
      - pattern: netPayable
      - pattern: transferPaise
      - pattern: razorpayTransferId
      - pattern: new RazorpayRouteService()
      - pattern: $X["payoutPaise"]
      - pattern: $X['payoutPaise']
      - pattern: $X["netPayable"]
      - pattern: $X['netPayable']

  # E23-S01 / ADR-0035 — the mirror direction: no payout path may read an incentive award.
  - id: incentives-not-in-payout-path
    message: |
      Incentive award identifier inside a file that moves money OUT of the platform. An award
      must never reach a transfer, payout queue or settlement path (ADR-0035). The award's cost
      belongs on the P&L (cosmos/incentive-repository.ts#sumAppliedByIstDay), nowhere else.
    severity: ERROR
    languages: [typescript]
    paths:
      include:
        - "api/src/functions/admin/finance/approve-payouts.ts"
        - "api/src/functions/admin/finance/payout-queue.ts"
        - "api/src/functions/admin/finance/weekly-aggregate.ts"
        - "api/src/functions/trigger-next-day-payout.ts"
        - "api/src/services/razorpayRoute.service.ts"
    pattern-either:
      - pattern: IncentiveAwardDoc
      - pattern: IncentiveAwardWriteSchema
      - pattern: incentiveAwardId
      - pattern: applyAward
      - pattern: incentiveRepo
      - pattern: $X.docType == "INCENTIVE_AWARD"
      - pattern: $X.docType === "INCENTIVE_AWARD"
```

- [ ] **Step 4: Verify Semgrep agrees, then re-run the suite**

```bash
cd api && pnpm semgrep:scan   # expect 0 findings against the current tree
```

If Semgrep is unavailable locally, say so in the commit message and rely on CI plus the static test — but do **not** skip Step 2's injection proof, which needs no Semgrep.

Run: `cd api && npx vitest run tests/static/ tests/cosmos/cross-partition-tenant-filter.test.ts`
Expected: PASS, including the two rule-presence cases Task 16 left red.

- [ ] **Step 5: Commit**

```bash
git add api/.semgrep.yml api/tests/static/incentives-credit-only.test.ts
git commit -m "feat(api): incentives-credit-only static gate + Semgrep rules, proven against 3 injected violations (E23-S01)"
```

---

# WS-E — contract, docs, review gate

### Task 18: Surface `awards[]` on the admin ledger detail

**Files:** Modify `api/src/functions/admin/finance/commission-receivables.ts` · Test: extend `api/tests/functions/admin/finance/commission-receivables.test.ts`

Spec §6 requires the per-technician ledger detail response to carry `awards[]` alongside `receivables`, `remittances` and `credits`. `listLedger` already returns it (Part 1 Task 3); the handler just has to pass it through, and `creditAppliedPaise` must stay a separate figure from `cashCollectedPaise` (§6: "reported separately, never summed").

- [ ] **Step 1: Write the failing test** — append to the existing file:

```typescript
  it('passes awards through and keeps credit applied separate from cash collected', async () => {
    // Arrange listLedger (mocked as the sibling cases in this file already do) to return one
    // award plus a receivable carrying a 30_000 INCENTIVE allocation.
    const res = await adminCommissionReceivablesPerTechHandler(req('t1'), {} as never, admin) as
      { jsonBody: { awards: unknown[]; creditAppliedPaise: number; cashCollectedPaise: number } };
    expect(res.jsonBody.awards).toHaveLength(1);
    expect(res.jsonBody.creditAppliedPaise).toBe(30_000);
    // Never summed with cash: cash changed hands at the door, credit is commission offset.
    expect(res.jsonBody.cashCollectedPaise).not.toBe(res.jsonBody.creditAppliedPaise);
  });
```

- [ ] **Step 2: Run test to verify it fails** — `awards` is undefined on the response.

- [ ] **Step 3: Write minimal implementation** — destructure `awards` from the `listLedger` result and add `awards` to the `jsonBody`. Leave the existing `creditAppliedPaise` reduction (which already filters `a.source === 'INCENTIVE'`) untouched.

- [ ] **Step 4: Run test to verify it passes** — `cd api && npx vitest run tests/functions/admin/finance/`

- [ ] **Step 5: Commit**

```bash
git add api/src/functions/admin/finance/commission-receivables.ts api/tests/functions/admin/finance/commission-receivables.test.ts
git commit -m "feat(api): surface incentive awards on the admin ledger detail (E23-S01)"
```

---

### Task 19: OpenAPI registry and regenerated contract

**Files:** Modify `api/src/openapi/registry.ts` · Regenerate `api/openapi.json`

Register the schemas and the five paths, following the block that already registers the commission routes (`registry.ts` around line 626).

- [ ] **Step 1: Register schemas and paths**

Import `EffectiveIncentiveConfigSchema`, `UpdateIncentiveConfigBodySchema`, `IncentiveAwardDocSchema`, `MilestoneSchema`, `TechnicianIncentivesResponseSchema` from `../schemas/incentive.js`, then:

```typescript
registry.register('Milestone', MilestoneSchema.openapi('Milestone'));
registry.register('EffectiveIncentiveConfig', EffectiveIncentiveConfigSchema.openapi('EffectiveIncentiveConfig'));
registry.register('UpdateIncentiveConfigBody', UpdateIncentiveConfigBodySchema.openapi('UpdateIncentiveConfigBody'));
registry.register('IncentiveAwardDoc', IncentiveAwardDocSchema.openapi('IncentiveAwardDoc'));
registry.register('TechnicianIncentivesResponse', TechnicianIncentivesResponseSchema.openapi('TechnicianIncentivesResponse'));

const IncentiveAwardsPageSchema = z.object({
  awards: z.array(IncentiveAwardDocSchema),
  continuationToken: z.string().optional(),
}).openapi('IncentiveAwardsPage');

const IncentiveRunSummarySchema = z.object({
  weekKey: z.string(), enabled: z.boolean(),
  technicianCount: z.number().int().nonnegative(),
  awarded: z.number().int().nonnegative(),
  replayed: z.number().int().nonnegative(),
  noAward: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  totalAwardedPaise: z.number().int().nonnegative(),
}).openapi('IncentiveRunSummary');

registry.registerPath({
  method: 'get', path: '/v1/admin/incentives/config', operationId: 'getIncentiveConfig',
  tags: ['admin-incentives'], summary: 'Get the effective weekly incentive config (defaults applied, never 404)',
  security: [{ cookieAuth: [] }],
  responses: {
    200: { description: 'Effective incentive config', content: { 'application/json': { schema: EffectiveIncentiveConfigSchema } } },
    401: { description: 'Unauthenticated' }, 403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'put', path: '/v1/admin/incentives/config', operationId: 'putIncentiveConfig',
  tags: ['admin-incentives'], summary: 'Update the incentive milestones, cap and minimum countable booking (super-admin only)',
  security: [{ cookieAuth: [] }],
  request: { body: { content: { 'application/json': { schema: UpdateIncentiveConfigBodySchema } } } },
  responses: {
    200: { description: 'Updated config', content: { 'application/json': { schema: EffectiveIncentiveConfigSchema } } },
    400: { description: 'Validation error (empty patch, unknown field, cap outside 0–10000, or non-ascending milestones)' },
    401: { description: 'Unauthenticated' }, 403: { description: 'Forbidden (requires super-admin)' },
  },
});

registry.registerPath({
  method: 'get', path: '/v1/admin/incentives/awards', operationId: 'listIncentiveAwards',
  tags: ['admin-incentives'], summary: 'List incentive awards, optionally filtered by IST week and technician',
  security: [{ cookieAuth: [] }],
  request: { query: z.object({
    week: z.string().optional().openapi({ example: '2026-W37' }),
    technicianId: z.string().optional(),
    continuationToken: z.string().optional(),
  }) },
  responses: {
    200: { description: 'One page of awards', content: { 'application/json': { schema: IncentiveAwardsPageSchema } } },
    400: { description: 'Validation error (week must be YYYY-Www)' },
    401: { description: 'Unauthenticated' }, 403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'post', path: '/v1/admin/incentives/run', operationId: 'runIncentives',
  tags: ['admin-incentives'], summary: 'Run the weekly incentive award for one IST week (super-admin only)',
  description:
    'Idempotent. Award ids are deterministic (`inc:<technicianId>:<weekKey>`), so re-running a ' +
    'week that already awarded replays per technician and grants nothing twice — the response ' +
    "`replayed` count reports how much was already done. Defaults to the previous IST week, so " +
    'an argument-less call can never award a week still in progress. Returns `enabled: false` ' +
    'with zeroed counts when the programme is dark; that is a 200, not an error.',
  security: [{ cookieAuth: [] }],
  request: { query: z.object({ week: z.string().optional().openapi({ example: '2026-W37' }) }) },
  responses: {
    200: { description: 'Run summary', content: { 'application/json': { schema: IncentiveRunSummarySchema } } },
    400: { description: 'Validation error (week must be YYYY-Www)' },
    401: { description: 'Unauthenticated' }, 403: { description: 'Forbidden (requires super-admin)' },
  },
});

registry.registerPath({
  method: 'get', path: '/v1/technicians/me/incentives', operationId: 'getTechnicianIncentives',
  tags: ['technicians'], summary: 'Live current-week milestone progress plus the technician\'s last 8 awards',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Progress and recent awards', content: { 'application/json': { schema: TechnicianIncentivesResponseSchema } } },
    401: { description: 'Unauthenticated' },
  },
});
```

Match the `security` scheme name used by the other technician routes in this file — copy it from the `commission-due` registration rather than assuming `bearerAuth`.

- [ ] **Step 2: Build and lint the contract**

```bash
cd api && pnpm openapi:build && pnpm openapi:lint && npx vitest run tests/openapi-build.test.ts tests/openapi/
```
Expected: `openapi.json` regenerates, Spectral reports no errors, the build test validates OpenAPI 3.1.

- [ ] **Step 3: Commit**

```bash
git add api/src/openapi/registry.ts api/openapi.json
git commit -m "feat(api): register the incentive routes in the OpenAPI contract (E23-S01)"
```

> **Paired-PR note for the review gate.** No client consumes these routes in this story — E23-S02 (admin incentive settings + the technician milestone card) is the paired client story. Codex will otherwise raise "no caller for these endpoints" every round. State this in the PR body and in `.codex-review-passed`.

---

### Task 20: ADR-0035, story doc, runbook, threat model

**Files:** Create `docs/adr/0035-incentives-are-credit-only-and-capped.md` and `docs/stories/E23-S01-incentive-engine.md` · Modify `docs/runbook.md` and `docs/threat-model.md`

- [ ] **Step 1: Re-verify the ADR number is still free**

```bash
cd "C:/Alok/Business Projects/wt-e23-s01" && git fetch origin main -q && git ls-tree --name-only origin/main docs/adr/ | sort | tail -5 && ls docs/adr/
```
`0035` was free against `origin/main` when this plan was written (highest `0034`). **If another story has claimed it since, take the next free number** and update every reference in this plan, `api/.semgrep.yml`, `api/src/schemas/incentive.ts` and `api/src/services/incentive.service.ts`. `docs/adr/README.md` forbids gap-filling, so never reuse a number below the current maximum.

- [ ] **Step 2: Write the ADR**

Use `docs/adr/TEMPLATE.md`. Status `accepted`, dated the day of execution. It must state:

- **Context:** owner requirement R5. A bonus that pays cash would need a payout rail the ₹0 pilot does not have, and would let a technician profit from self-booking.
- **Decision:** the award is credit-only, applied through the E21-S02 allocator with the award document as the anchor, capped at `capFractionBps` of the commission generated that week, with a `minCountableBookingPaise` floor. Credit-only is enforced in three layers (`.strict()` write schema, static test, two Semgrep rules). The milestone table, cap and floor are snapshotted onto every award.
- **Consequences — and state all four of these plainly:**
  1. **The shipped 6000 bps cap does not close the 7-real-plus-3-cheap margin case** (Task 5's second `PROOF` test prices it at +13,566 paise). It closes the cheaper variants, and 1500 bps closes the margin case with no false positive on honest work. The lever is one admin config value. Do not claim the cap makes gaming impossible.
  2. **`appliedPaise` sums two refIds** (`awardId` and `cr:${awardId}`) because a remainder credit's allocations carry the credit's id. Spec §5.5's single-refId wording is wrong.
  3. **A rerun after a config edit is a no-op, not a re-price** — `anchor.matches` compares `(technicianId, weekKey)` and deliberately not the amount.
  4. **The P&L buckets the incentive line by IST day while bookings bucket by UTC day.** Spec §7.8 asks for IST; re-bucketing bookings was out of scope and would have moved every historical number. An accepted seam, not an oversight.
- **Alternatives considered:** a separate `technician_incentives` container (rejected — violates invariants #1 and #10; the ledger's `docType` discriminator already exists); `markRemitted(..., 'ADJUSTMENT')` (rejected — E21-S02 deleted that method, and mixing a bonus into remittance destroys the P&L distinction between commission *forgiven* and commission *settled by incentive*); a `WAIVE` allocation (rejected for the same reason).

- [ ] **Step 3: Write the story doc and update runbook + threat model**

`docs/stories/E23-S01-incentive-engine.md`: scope, the five routes with roles, the award document shape, the counting rule, both guards, and the record that Task 17's three injected violations were each confirmed to fail the static gate. Add the row for it to `docs/stories/README.md` — that index currently has no E23 entry at all.

`docs/runbook.md` — add an "Incentives" section covering: enabling the programme (`PUT /v1/admin/incentives/config` with `enabled: true` **after** the milestone table is set — an enabled programme with an empty table awards nothing but does run the roster query); re-running a week after a failed timer (`POST /v1/admin/incentives/run?week=YYYY-Www`, idempotent, check `replayed` vs `awarded`); reading a partial failure (`failed > 0` in the run summary, Sentry has the per-technician exceptions, re-running is safe); what a technician sees when an award lands on a week with no dues (a `CREDIT` that the next completed job consumes); and how to turn the cap down if gaming is observed.

`docs/threat-model.md` — extend the incentive-gaming entry with the priced economics from Task 5's `PROOF` tests and the mitigation (cap + minimum countable booking, both admin-editable; residual margin case documented in ADR-0035).

- [ ] **Step 4: Verify**

```bash
cd "C:/Alok/Business Projects/wt-e23-s01" && ls docs/adr/ | tail -3 && npx --yes markdownlint-cli2 "docs/adr/0035-*.md" 2>/dev/null || true
```
Confirm the ADR number is unique and every claim in it matches a test that actually passes.

- [ ] **Step 5: Commit**

```bash
git add docs/adr/0035-incentives-are-credit-only-and-capped.md docs/stories/E23-S01-incentive-engine.md docs/runbook.md docs/threat-model.md
git commit -m "docs: ADR-0035 incentives are credit-only and capped, plus story/runbook/threat-model (E23-S01)"
```

---

### Task 21: Smoke gate, Codex + `/security-review`, push

- [ ] **Step 1: Run the full API smoke gate**

```bash
cd "C:/Alok/Business Projects/wt-e23-s01" && bash tools/pre-codex-smoke-api.sh
```
Three steps: `tsc --noEmit -p tsconfig.tests.json`, `eslint . --max-warnings 0`, `vitest run`. **Non-zero exit means stop and fix — do not invoke Codex.**

- [ ] **Step 2: Confirm the verification scenario end to end**

Spec §9 item 6: *"Incentive run on a fixture week → cap applied; allocations `source:'INCENTIVE'`; no remittance doc; P&L shows `incentiveCostPaise`; rerun no-op."* Every clause has a test; confirm all five are green and name them in the PR body:

| Clause | Test |
|---|---|
| cap applied | `incentive.compute.test.ts` → the four `PROOF:` cap tests |
| allocations `source:'INCENTIVE'` | `incentive.apply.test.ts` → "passes source INCENTIVE, refId = awardId…" |
| no remittance doc | same test, the `not.toContain('REMITTANCE')` assertion |
| P&L shows `incentiveCostPaise` | `finance-incentive-cost.test.ts` → "subtracts the incentive cost…" |
| rerun no-op | `incentive.run.test.ts` → `PROOF: a rerun of an already-awarded week is a NO-OP` |

```bash
cd api && npx vitest run tests/services/incentive.compute.test.ts tests/services/incentive.apply.test.ts tests/services/incentive.run.test.ts tests/cosmos/finance-incentive-cost.test.ts
```

- [ ] **Step 3: Merge `main` before the first push**

The pre-push hook diffs against `@{u}`, and a worktree branch created from `origin/main` tracks `main` — so unrelated sub-project gates run as `main` advances. Merge first:

```bash
cd "C:/Alok/Business Projects/wt-e23-s01" && git fetch origin main && git merge origin/main
```
Re-run Step 1 if the merge brought changes.

- [ ] **Step 4: Review gate — Codex and `/security-review` in parallel**

Money-adjacent Foundation story, so both run, both local, both before push:

```bash
cd "C:/Alok/Business Projects/wt-e23-s01" && codex review --base main
```
Use the `disk-full-read-access` sandbox permission — this is a git worktree. Run `/security-review` concurrently in a second session.

Write `.codex-review-passed` with the reviewed **commit sha** in its `commit` field (its existence proves nothing — it is a rolling file on `main` that every merging PR rewrites, so a branch always inherits some other story's marker). Include in it:

> Paired PR: E23-S02 (admin incentive settings + technician milestone card) is the client for these five routes. No client consumes them in this PR by design — the API ships dark, `enabled: false`, ahead of the batched APK. Acknowledged; not a finding.

**If a Codex round fails, fix in Claude and re-run Codex once.** Do not iterate rounds.

- [ ] **Step 5: Review the diff's file manifest, then push**

```bash
cd "C:/Alok/Business Projects/wt-e23-s01" && git diff --stat origin/main...HEAD && git status --porcelain
```
Check the **file list**, not just the code: no Codex transcripts, no `docs/reviews/` dumps, no scratch files, no `.bak`. A fix-round `git add -A` once landed 2.58 MiB of transcript past two reviewers, a pre-push hook and CI.

```bash
git push -u origin feat/e23-s01-incentive-engine
gh pr create --title "feat(api): E23-S01 weekly incentive milestones, credited against dues" --body "..."
```

PR body must carry: the §9 item 6 clause→test table from Step 2; the four ADR-0035 consequences (especially that the shipped cap does not close the margin case); the paired-PR note; and the record that Task 17's static gate was proven against three injected violations.

PR auto-merges on CI green (lint + tests + Semgrep; no approval gate, solo project).

---

## Rollout order (spec §3.3, §7.12)

**Functions before seeds, always.** Deploy the API first, then write the config doc — never the reverse, or a stored doc gets read by a parser that predates it (the #320 lesson).

**No seed script is added, deliberately.** `api/scripts/setup-cosmos.ts` seeds `technician-client-config` but this story adds nothing there. `getEffectiveIncentiveConfig` never 404s and applies every default (`enabled: false`, empty milestone table, 6000 bps, ₹249), so an absent `incentive-config` document is a fully-defined dark state, and `functions/config/technician.ts` already falls back the same way. Seeding a disabled doc would buy nothing and add a second place for the defaults to drift. The document is created by the owner's first `PUT`.

1. Deploy `func-homeservices-prod`.
2. Confirm dark: `GET /v1/admin/incentives/config` returns `enabled: false` with defaults, and the Monday timer's first run logs `enabled=false technicians=0`.
3. Owner sets the milestone table via `PUT /v1/admin/incentives/config` — **milestones first, `enabled: true` second**, as two calls. An enabled programme with an empty table awards nothing but still runs the cross-partition roster query every Monday.
4. Verify on a past week before trusting the timer: `POST /v1/admin/incentives/run?week=<last week>`, read the summary, inspect one award via `GET /v1/admin/incentives/awards?week=...`, then re-run the same week and confirm `awarded: 0, replayed: N`.
5. The technician-facing `incentives` client flag stays off until E23-S02 ships (spec §7.12 flip order: `wallet` → `duesBanner` → `holdEnforcement` → `addOnRequests` → `upiQr` → `incentives`).
