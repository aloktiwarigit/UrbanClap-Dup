# E21-S04 Dues-Gated Dispatch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make an unpaid commission balance actually gate work — a `BLOCKED` technician is neither offered new jobs nor able to accept one — shipping entirely dark behind `holdEnforcementEnabled`, with a 15-minute reconciler that keeps the hold cache honest.

**Architecture:** Hold state enters dispatch only as two boolean predicate options composed into the existing radius query, and enters the accept path only through one three-way gate function. All hold-awareness lives in one new service module so the ranking function can never see it. A new 15-minute timer drains the hold-repair queue, sweeps expired overrides, clock-gates a full sweep, and writes a pre-computed dashboard summary that replaces a per-request full drain.

**Tech Stack:** Node 22, TypeScript (strict, ESM with `.js` import specifiers), Azure Functions v4 programming model, `@azure/cosmos` 4.9.2, Zod, Vitest, Sentry, Semgrep.

**Spec:** `docs/superpowers/specs/2026-09-08-e21-s04-dues-gated-dispatch-design.md`

## Global Constraints

- **Sub-project: `api/` only.** Do not create or modify any file under `admin-web/`, `customer-app/`, or `technician-app/`.
- **Ships dark.** `holdEnforcementEnabled` and `enforceKycInDispatch` both default `false` (`toEffectiveConfig`, `src/schemas/commission-config.ts`). No task may change those defaults.
- **Never hand-merge `api/openapi.json`.** This story should not touch it. If a conflict ever appears, take either side and regenerate with `pnpm run openapi:build`. `api/src/openapi/registry.ts` conflicts resolve by keeping **both** route registrations.
- **Fail-open in dispatch, fail-closed at accept.** Every dispatch SQL predicate is written `(NOT IS_DEFINED(<path>) OR <path> != <bad>)`. Cosmos `!=` against an undefined path yields undefined and drops the row — the `NOT IS_DEFINED` disjunct is the fail-open and is never optional.
- **Karnataka rule.** Hold state is an eligibility filter, never a ranking input. `rankTechnicians` keeps the signature `(techs: TechnicianProfile[], bookingLat: number, bookingLng: number)` and is never given hold data, config, or gates.
- **Read-path schemas only widen.** New stored fields are `.optional()`. No write-body schema is tightened in this story.
- **No money document is ever written.** This story reads the ledger and patches only the `commissionHold` cache.
- **TDD.** In every task, the test file is written and committed together with (never after) the implementation, and the test is run and observed failing before the implementation exists.
- **Never use `--no-verify`.**
- **ESM imports.** Every relative import ends in `.js`, even for `.ts` sources.
- **Run tests from `api/`:** `node_modules/.bin/vitest run <path>`. `pnpm` spawns `cmd.exe` on Windows and does not inherit the bash PATH.

---

## File Structure

**Created**

| File | Responsibility |
|---|---|
| `api/src/services/dispatch-eligibility.ts` | Config → predicate options; shadow-mode logging. The only place dispatch learns about holds. |
| `api/src/services/commission-dashboard.service.ts` | Pure `buildHoldRoster` — rows + totals + unreconciled count. Shared by the timer (writes the summary) and the dashboard (fallback path), so they cannot drift. |
| `api/src/schemas/hold-reconciliation-summary.ts` | `HoldReconciliationSummaryDoc` type + `HOLD_RECONCILIATION_SUMMARY_DOC_ID` + `TOP_N`. |
| `api/src/functions/trigger-reconcile-commission-holds.ts` | The 15-minute timer. |
| `api/tests/unit/dispatch-eligibility.test.ts` | Gates loading + shadow logging. |
| `api/tests/unit/dispatch-ranking-invariance.test.ts` | Karnataka runtime guard. |
| `api/tests/unit/trigger-reconcile-commission-holds.test.ts` | Reconciler ordering + cadence + summary. |
| `api/tests/services/commission-dashboard.service.test.ts` | `buildHoldRoster` purity + aggregates. |
| `api/tests/services/commission-hold.accept-gate.test.ts` | `assertCanAccept` three-way decision. |
| `api/tests/functions/job-offers-hold-gate.test.ts` | Accept handler wiring. |
| `docs/adr/0032-commission-hold-is-an-eligibility-gate.md` | The ADR. |
| `docs/stories/E21-S04-dues-gated-dispatch.md` | Story record + accept contract for E21-S05. |

**Modified**

| File | Change |
|---|---|
| `api/src/schemas/technician.ts` | `suspended?: boolean` (optional). |
| `api/src/types/admin.ts` | `AuditAction` gains `JOB_ACCEPT_BLOCKED_BY_HOLD`. |
| `api/src/cosmos/technician-repository.ts` | Predicate options on `getTechniciansWithinRadius`; new `countBlockedInRadius`, `readTechnicianGateState`; `SEMGREP-JUSTIFIED` comments on three helpers. |
| `api/src/cosmos/commission-receivable-repository.ts` | `SEMGREP-JUSTIFIED` comment on `sumDueGroupedByTechnician`. |
| `api/src/cosmos/system-docs-repository.ts` | `getHoldReconciliationSummary` / `putHoldReconciliationSummary`. |
| `api/src/services/dispatcher.service.ts` | Loads gates, passes options, shadow-logs, diagnoses the zero-candidate path. |
| `api/src/services/commission-hold.service.ts` | `assertCanAccept`. |
| `api/src/functions/job-offers.ts` | The accept gate. |
| `api/src/functions/admin/orders/overrides.ts` | Reassign audit enrichment. |
| `api/src/functions/admin/finance/commission-receivables.ts` | Reads the summary; `HOLD_STALE_AFTER_MS` corrected to 90 min; roster logic extracted. |
| `api/.semgrep.yml` | `no-commission-hold-in-ranking`. |
| `api/tests/cosmos/cross-partition-tenant-filter.test.ts` | Register four helpers (Layer 2 + Layer 3) + assert the new Semgrep rule. |
| `api/tests/unit/dispatcher.service.test.ts` | Existing tests updated for the new mock surface. |
| `api/tests/functions/admin/finance/commission-receivables.test.ts` | Summary path + fallback. |
| `docs/adr/README.md`, `docs/dispatch-algorithm.md`, `docs/runbook.md` | Documentation. |

**Task order and model tier**

| Task | Title | Model | Depends on |
|---|---|---|---|
| 1 | Schema widening + audit action | haiku | — |
| 2 | Dispatch predicates + two new repo reads | sonnet | 1 |
| 3 | Eligibility module + dispatcher wiring | sonnet | 2 |
| 4 | Karnataka: Semgrep rule + invariance test | sonnet | 3 |
| 5 | `assertCanAccept` | **opus** | 1 |
| 6 | Accept handler wiring | **opus** | 5 |
| 7 | Reassign audit enrichment | haiku | 2 |
| 8 | Summary schema + roster extraction + repo helpers | sonnet | 1 |
| 9 | Reconciler timer | **opus** | 8 |
| 10 | Dashboard reads the summary | sonnet | 8, 9 |
| 11 | Cross-partition helper registration | haiku | 4, 9 |
| 12 | Documentation | sonnet | all |

Tasks 2/5 and 3/7 and 8 are independent once 1 lands and may be dispatched in parallel.

**Story size gate (root `CLAUDE.md`).** This plan is ~3,280 lines, over the Foundation-tier
1,500-line split threshold. The threshold's own split rule scores **0 of 4**: new files 13
(not >20), Android layers N/A (api-only), external SDK integrations 0 (not ≥2), new test files
6 (not ≥10). The length is inline test and implementation code — which the writing-plans skill
requires verbatim rather than as prose — not story scope. Splitting was considered and rejected
on substance: the reconciler is what keeps the gate honest, so shipping the gate without it
would leave a lapsed admin override silently unenforced, which is precisely the E21-S02
carry-forward this story exists to discharge. Recorded rather than silently overridden.

---

### Task 1: Schema widening and the audit action

**Files:**
- Modify: `api/src/schemas/technician.ts`
- Modify: `api/src/types/admin.ts`
- Test: `api/tests/schemas/technician-suspended.test.ts` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `TechnicianProfile.suspended?: boolean`; `AuditAction` member `'JOB_ACCEPT_BLOCKED_BY_HOLD'`.

- [ ] **Step 1: Write the failing test**

Create `api/tests/schemas/technician-suspended.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { TechnicianProfileSchema } from '../../src/schemas/technician.js';

const base = {
  id: 'tech-1',
  technicianId: 'tech-1',
  location: { type: 'Point' as const, coordinates: [77.5946, 12.9716] as [number, number] },
  skills: ['svc-plumbing'],
  availabilityWindows: [],
  isOnline: true,
  isAvailable: true,
  kycStatus: 'APPROVED' as const,
};

describe('TechnicianProfileSchema.suspended', () => {
  it('accepts a document with no suspended field (every stored doc today)', () => {
    const parsed = TechnicianProfileSchema.parse(base);
    expect(parsed.suspended).toBeUndefined();
  });

  it('parses suspended:true and preserves it', () => {
    expect(TechnicianProfileSchema.parse({ ...base, suspended: true }).suspended).toBe(true);
  });

  it('parses suspended:false and preserves it', () => {
    expect(TechnicianProfileSchema.parse({ ...base, suspended: false }).suspended).toBe(false);
  });

  it('rejects a non-boolean suspended (write-path strictness is unchanged)', () => {
    expect(() => TechnicianProfileSchema.parse({ ...base, suspended: 'yes' })).toThrow();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
cd api && node_modules/.bin/vitest run tests/schemas/technician-suspended.test.ts
```

Expected: the `suspended:true` and `suspended:false` cases fail — Zod strips unknown keys, so `parsed.suspended` is `undefined`.

- [ ] **Step 3: Add the field**

In `api/src/schemas/technician.ts`, inside `TechnicianProfileSchema`, add immediately after the `blockedCustomerIds` line:

```ts
  /**
   * Set by patchTechnicianAdminFields when an admin suspends a technician. Absent on every
   * document written before E21-S04, which is why every predicate that reads it must be written
   * `(NOT IS_DEFINED(c.suspended) OR c.suspended != true)` — a bare `!=` drops undefined rows.
   */
  suspended: z.boolean().optional(),
```

- [ ] **Step 4: Add the audit action**

In `api/src/types/admin.ts`, in the `// Booking & commission lifecycle` group of the `AuditAction` union, add after `| 'COMMISSION_WAIVED'`:

```ts
  | 'JOB_ACCEPT_BLOCKED_BY_HOLD'
```

- [ ] **Step 5: Run the test and the type-check**

```bash
cd api && node_modules/.bin/vitest run tests/schemas/technician-suspended.test.ts
cd api && node_modules/.bin/tsc --noEmit -p tsconfig.tests.json
```

Expected: 4 passing, type-check clean.

- [ ] **Step 6: Commit**

```bash
git add api/src/schemas/technician.ts api/src/types/admin.ts api/tests/schemas/technician-suspended.test.ts
git commit -m "feat(api): widen TechnicianProfile with optional suspended; add JOB_ACCEPT_BLOCKED_BY_HOLD audit action

Read-path widening only (optional field), per the #320 rule. The audit action
is added to the closed enum on the write helper, per spec 3.8."
```

---

### Task 2: Dispatch predicates and two new repository reads

**Files:**
- Modify: `api/src/cosmos/technician-repository.ts` (`getTechniciansWithinRadius` at ~line 221; append two new functions)
- Test: `api/tests/cosmos/technician-repository-dispatch-predicates.test.ts` (create)

**Interfaces:**
- Consumes: `TechnicianProfile.suspended` (Task 1); `boundingBoxPolygon` from `./geo.js`; `CommissionHold` from `../schemas/technician.js`.
- Produces:
  ```ts
  export interface DispatchPredicateOptions { excludeBlockedHolds?: boolean; requireKyc?: boolean }
  export async function getTechniciansWithinRadius(
    lat: number, lng: number, radiusKm: number, serviceId: string,
    opts?: DispatchPredicateOptions,
  ): Promise<TechnicianProfile[]>
  export async function countBlockedInRadius(
    lat: number, lng: number, radiusKm: number, serviceId: string,
  ): Promise<number>
  export async function readTechnicianGateState(
    technicianId: string,
  ): Promise<{ exists: boolean; hold: CommissionHold | null; suspended: boolean }>
  ```

- [ ] **Step 1: Write the failing test**

Create `api/tests/cosmos/technician-repository-dispatch-predicates.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import { getCosmosClient } from '../../src/cosmos/client.js';
import {
  countBlockedInRadius,
  getTechniciansWithinRadius,
  readTechnicianGateState,
} from '../../src/cosmos/technician-repository.js';

/** Captures the SQL text and parameters of the single query the call issues. */
function mockQuery(resources: unknown[]) {
  const captured: { query?: string; parameters?: Array<{ name: string; value: unknown }> } = {};
  const fetchAll = vi.fn().mockResolvedValue({ resources });
  (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
    database: () => ({
      container: () => ({
        items: {
          query: (spec: { query: string; parameters: Array<{ name: string; value: unknown }> }) => {
            captured.query = spec.query;
            captured.parameters = spec.parameters;
            return { fetchAll };
          },
        },
      }),
    }),
  });
  return captured;
}

beforeEach(() => vi.resetAllMocks());

describe('getTechniciansWithinRadius predicates', () => {
  it('ALWAYS excludes suspended technicians, with a fail-open IS_DEFINED disjunct', async () => {
    const c = mockQuery([]);
    await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing');
    expect(c.query).toContain('NOT IS_DEFINED(c.suspended) OR c.suspended != true');
  });

  it('omits the hold predicate when excludeBlockedHolds is not set (dark launch)', async () => {
    const c = mockQuery([]);
    await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing');
    expect(c.query).not.toContain('commissionHold');
  });

  it('adds a fail-open hold predicate when excludeBlockedHolds is set', async () => {
    const c = mockQuery([]);
    await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing', { excludeBlockedHolds: true });
    expect(c.query).toContain(
      "NOT IS_DEFINED(c.commissionHold.state) OR c.commissionHold.state != 'BLOCKED'",
    );
  });

  it('omits the kyc predicate by default and adds a fail-open one when requireKyc is set', async () => {
    const off = mockQuery([]);
    await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing');
    expect(off.query).not.toContain('kycStatus');

    const on = mockQuery([]);
    await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing', { requireKyc: true });
    expect(on.query).toContain("NOT IS_DEFINED(c.kycStatus) OR c.kycStatus = 'APPROVED'");
  });

  it('composes both optional predicates together', async () => {
    const c = mockQuery([]);
    await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing', {
      excludeBlockedHolds: true,
      requireKyc: true,
    });
    expect(c.query).toContain('commissionHold.state');
    expect(c.query).toContain('kycStatus');
    expect(c.query).toContain('c.suspended');
  });

  it('keeps the original geo/skill/online/available predicates and parameters', async () => {
    const c = mockQuery([]);
    await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing', { excludeBlockedHolds: true });
    expect(c.query).toContain('ST_WITHIN(c.location, @polygon)');
    expect(c.query).toContain('ARRAY_CONTAINS(c.skills, @serviceId)');
    expect(c.query).toContain('c.isOnline = true');
    expect(c.query).toContain('c.isAvailable = true');
    expect(c.parameters?.map((p) => p.name).sort()).toEqual(['@polygon', '@serviceId']);
  });

  it('returns the rows the query produced', async () => {
    mockQuery([{ id: 'tech-1' }, { id: 'tech-2' }]);
    const rows = await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing');
    expect(rows.map((r) => r.id)).toEqual(['tech-1', 'tech-2']);
  });
});

describe('countBlockedInRadius', () => {
  it('counts only BLOCKED technicians inside the same geo/skill/online/available set', async () => {
    const c = mockQuery([7]);
    const n = await countBlockedInRadius(12.97, 77.59, 10, 'svc-plumbing');
    expect(n).toBe(7);
    expect(c.query).toContain('SELECT VALUE COUNT(1)');
    expect(c.query).toContain("c.commissionHold.state = 'BLOCKED'");
    expect(c.query).toContain('ST_WITHIN(c.location, @polygon)');
    expect(c.query).toContain('NOT IS_DEFINED(c.suspended) OR c.suspended != true');
  });

  it('returns 0 when the aggregate page comes back empty', async () => {
    mockQuery([]);
    expect(await countBlockedInRadius(12.97, 77.59, 10, 'svc-plumbing')).toBe(0);
  });
});

describe('readTechnicianGateState', () => {
  function mockPointRead(resource: unknown) {
    const read = vi.fn().mockResolvedValue({ resource });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ read }) }) }),
    });
  }

  it('returns exists:false with null hold when the technician doc is absent', async () => {
    mockPointRead(undefined);
    expect(await readTechnicianGateState('tech-x')).toEqual({ exists: false, hold: null, suspended: false });
  });

  it('returns the hold and suspended flag when present', async () => {
    const hold = {
      outstandingPaise: 600000, dueCount: 3, state: 'BLOCKED' as const,
      evaluatedAt: '2026-09-08T00:00:00.000Z',
    };
    mockPointRead({ id: 'tech-1', commissionHold: hold, suspended: true });
    expect(await readTechnicianGateState('tech-1')).toEqual({ exists: true, hold, suspended: true });
  });

  it('reads a legacy doc with neither field as exists:true, hold null, suspended false', async () => {
    mockPointRead({ id: 'tech-1' });
    expect(await readTechnicianGateState('tech-1')).toEqual({ exists: true, hold: null, suspended: false });
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
cd api && node_modules/.bin/vitest run tests/cosmos/technician-repository-dispatch-predicates.test.ts
```

Expected: FAIL — `countBlockedInRadius` and `readTechnicianGateState` are not exported, and the predicate assertions do not match.

- [ ] **Step 3: Replace `getTechniciansWithinRadius`**

In `api/src/cosmos/technician-repository.ts`, replace the whole existing `getTechniciansWithinRadius` function (starting at the `export async function getTechniciansWithinRadius(` line) with:

```ts
export interface DispatchPredicateOptions {
  /**
   * Exclude technicians whose commissionHold.state is BLOCKED. Driven by
   * `holdEnforcementEnabled`; off = dark launch, in which case the caller runs unfiltered and
   * shadow-logs the would-be exclusions instead (see services/dispatch-eligibility.ts).
   */
  excludeBlockedHolds?: boolean;
  /** Require kycStatus APPROVED. Driven by `enforceKycInDispatch`; off = today's behaviour. */
  requireKyc?: boolean;
}

/**
 * The always-on predicates. `suspended` is a BUG FIX (E21-S04): patchTechnicianAdminFields sets
 * `suspended:true` and `isOnline:false` together, so a suspended technician was excluded only as
 * a side effect of being offline — any path that flips isOnline back on silently re-admitted
 * them to dispatch.
 *
 * Every predicate here and below is written `(NOT IS_DEFINED(x) OR x != bad)`. Cosmos evaluates
 * `!=` against an undefined path to undefined, which drops the row — so a bare `!=` would
 * silently exclude every legacy document that lacks the field. The IS_DEFINED disjunct IS the
 * fail-open, and removing it is a dispatch outage.
 */
const DISPATCH_BASE_PREDICATES = `ST_WITHIN(c.location, @polygon)
            AND ARRAY_CONTAINS(c.skills, @serviceId)
            AND c.isOnline = true
            AND c.isAvailable = true
            AND (NOT IS_DEFINED(c.suspended) OR c.suspended != true)`;

const HOLD_NOT_BLOCKED_PREDICATE =
  `(NOT IS_DEFINED(c.commissionHold.state) OR c.commissionHold.state != 'BLOCKED')`;

const KYC_APPROVED_PREDICATE =
  `(NOT IS_DEFINED(c.kycStatus) OR c.kycStatus = 'APPROVED')`;

export async function getTechniciansWithinRadius(
  lat: number,
  lng: number,
  radiusKm: number,
  serviceId: string,
  opts: DispatchPredicateOptions = {},
): Promise<TechnicianProfile[]> {
  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);
  const polygon = boundingBoxPolygon(lat, lng, radiusKm);

  const extra: string[] = [];
  if (opts.excludeBlockedHolds) extra.push(HOLD_NOT_BLOCKED_PREDICATE);
  if (opts.requireKyc) extra.push(KYC_APPROVED_PREDICATE);

  const query = {
    query: `SELECT * FROM c
            WHERE ${DISPATCH_BASE_PREDICATES}${extra.map((p) => `\n            AND ${p}`).join('')}`,
    parameters: [
      { name: '@polygon', value: polygon as unknown as string },
      { name: '@serviceId', value: serviceId },
    ],
  };
  const { resources } = await container.items
    .query<TechnicianProfile>(query)
    .fetchAll();
  return resources;
}

/**
 * How many technicians inside the same geo/skill/online/available/not-suspended set are currently
 * BLOCKED by a commission hold. Called ONLY on the zero-candidate dispatch path, and only when
 * enforcement is on, so that `DISPATCH_NO_TECHS` can distinguish "nobody covers this area" from
 * "everyone who covers it owes us money" — with the predicate in the SQL, the excluded rows never
 * come back and the two are otherwise indistinguishable in the logs.
 */
export async function countBlockedInRadius(
  lat: number,
  lng: number,
  radiusKm: number,
  serviceId: string,
): Promise<number> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const polygon = boundingBoxPolygon(lat, lng, radiusKm);
  const { resources } = await container.items
    .query<number>({
      query: `SELECT VALUE COUNT(1) FROM c
              WHERE ${DISPATCH_BASE_PREDICATES}
              AND c.commissionHold.state = 'BLOCKED'`,
      parameters: [
        { name: '@polygon', value: polygon as unknown as string },
        { name: '@serviceId', value: serviceId },
      ],
    })
    .fetchAll();
  return resources[0] ?? 0;
}

/**
 * Point read (single partition) of the two fields an admin reassign audit entry records about
 * its target: the commission hold and the suspension flag. Both are absent on legacy documents,
 * which reads as `hold: null, suspended: false` — the audit entry then records "no hold known",
 * which is exactly true.
 */
export async function readTechnicianGateState(
  technicianId: string,
): Promise<{ exists: boolean; hold: CommissionHold | null; suspended: boolean }> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const { resource } = await container
    .item(technicianId, technicianId)
    .read<{ commissionHold?: CommissionHold; suspended?: boolean }>();
  if (!resource) return { exists: false, hold: null, suspended: false };
  return {
    exists: true,
    hold: resource.commissionHold ?? null,
    suspended: resource.suspended === true,
  };
}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
cd api && node_modules/.bin/vitest run tests/cosmos/technician-repository-dispatch-predicates.test.ts tests/cosmos/technician-repository.test.ts
```

Expected: PASS, and the pre-existing `technician-repository.test.ts` still passes (the new parameter is optional).

- [ ] **Step 5: Commit**

```bash
git add api/src/cosmos/technician-repository.ts api/tests/cosmos/technician-repository-dispatch-predicates.test.ts
git commit -m "feat(api): fail-open dispatch predicates for hold, kyc and suspended

Adds optional DispatchPredicateOptions to getTechniciansWithinRadius plus
countBlockedInRadius (zero-candidate diagnosis) and readTechnicianGateState
(reassign audit enrichment). The suspended predicate is unconditional and is a
bug fix: suspension previously relied on isOnline being false."
```

---

### Task 3: Eligibility module and dispatcher wiring

**Files:**
- Create: `api/src/services/dispatch-eligibility.ts`
- Modify: `api/src/services/dispatcher.service.ts`
- Test: `api/tests/unit/dispatch-eligibility.test.ts` (create)
- Test: `api/tests/unit/dispatcher.service.test.ts` (modify — mocks only)

**Interfaces:**
- Consumes: `DispatchPredicateOptions`, `countBlockedInRadius` (Task 2); `getCommissionConfig` from `../services/commission-config.service.js`.
- Produces:
  ```ts
  export interface DispatchGates { holdEnforcementEnabled: boolean; enforceKycInDispatch: boolean }
  export async function loadDispatchGates(): Promise<DispatchGates>
  export function gatesToPredicateOptions(g: DispatchGates): DispatchPredicateOptions
  export function logShadowExclusions(bookingId: string, candidates: TechnicianProfile[]): number
  ```

- [ ] **Step 1: Write the failing test**

Create `api/tests/unit/dispatch-eligibility.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/services/commission-config.service.js', () => ({
  getCommissionConfig: vi.fn(),
}));

import { getCommissionConfig } from '../../src/services/commission-config.service.js';
import {
  gatesToPredicateOptions,
  loadDispatchGates,
  logShadowExclusions,
} from '../../src/services/dispatch-eligibility.js';
import type { EffectiveCommissionConfig } from '../../src/schemas/commission-config.js';
import type { TechnicianProfile } from '../../src/schemas/technician.js';

const cfg = (over: Partial<EffectiveCommissionConfig> = {}): EffectiveCommissionConfig => ({
  defaultCommissionBps: 2200,
  warnThresholdPaise: 250000,
  blockThresholdPaise: 500000,
  holdEnforcementEnabled: false,
  enforceKycInDispatch: false,
  updatedBy: 'system',
  updatedAt: new Date(0).toISOString(),
  ...over,
});

const tech = (id: string, hold?: TechnicianProfile['commissionHold']): TechnicianProfile => ({
  id,
  technicianId: id,
  location: { type: 'Point', coordinates: [77.59, 12.97] },
  skills: ['svc-plumbing'],
  availabilityWindows: [],
  isOnline: true,
  isAvailable: true,
  kycStatus: 'APPROVED',
  ...(hold ? { commissionHold: hold } : {}),
});

const blocked = {
  outstandingPaise: 600000, dueCount: 3, state: 'BLOCKED' as const,
  evaluatedAt: '2026-09-08T00:00:00.000Z',
};

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.restoreAllMocks());

describe('loadDispatchGates', () => {
  it('maps the config flags through', async () => {
    vi.mocked(getCommissionConfig).mockResolvedValue(
      cfg({ holdEnforcementEnabled: true, enforceKycInDispatch: true }),
    );
    expect(await loadDispatchGates()).toEqual({
      holdEnforcementEnabled: true,
      enforceKycInDispatch: true,
    });
  });

  it('FAILS OPEN: a config read failure yields both gates off and never throws', async () => {
    vi.mocked(getCommissionConfig).mockRejectedValue(new Error('cosmos down'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await loadDispatchGates()).toEqual({
      holdEnforcementEnabled: false,
      enforceKycInDispatch: false,
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('DISPATCH_GATES_UNAVAILABLE'));
  });
});

describe('gatesToPredicateOptions', () => {
  it('is a pure rename with no ranking-relevant output', () => {
    expect(gatesToPredicateOptions({ holdEnforcementEnabled: true, enforceKycInDispatch: false }))
      .toEqual({ excludeBlockedHolds: true, requireKyc: false });
  });
});

describe('logShadowExclusions', () => {
  it('logs one line per BLOCKED candidate and returns the count', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const n = logShadowExclusions('bk-1', [tech('t1'), tech('t2', blocked), tech('t3', blocked)]);
    expect(n).toBe(2);
    expect(log).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith(
      'DISPATCH_HOLD_SHADOW_EXCLUSION bookingId=bk-1 technicianId=t2 state=BLOCKED outstandingPaise=600000 evaluatedAt=2026-09-08T00:00:00.000Z',
    );
  });

  it('logs nothing when no candidate is blocked, including candidates with no hold at all', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(logShadowExclusions('bk-1', [tech('t1'), tech('t2', { ...blocked, state: 'WARN' })])).toBe(0);
    expect(log).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
cd api && node_modules/.bin/vitest run tests/unit/dispatch-eligibility.test.ts
```

Expected: FAIL — module `dispatch-eligibility.js` does not exist.

- [ ] **Step 3: Create the module**

Create `api/src/services/dispatch-eligibility.ts`:

```ts
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
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
cd api && node_modules/.bin/vitest run tests/unit/dispatch-eligibility.test.ts
```

Expected: PASS (7 tests).

- [ ] **Step 5: Wire the dispatcher**

In `api/src/services/dispatcher.service.ts`:

Add to the imports:

```ts
import { getTechniciansWithinRadius, countBlockedInRadius } from '../cosmos/technician-repository.js';
import { gatesToPredicateOptions, loadDispatchGates, logShadowExclusions } from './dispatch-eligibility.js';
```

(replacing the existing `getTechniciansWithinRadius` import line).

Inside `dispatchBookingToTechs`, replace the candidate-fetch block

```ts
  const candidates = (await getTechniciansWithinRadius(lat, lng, radiusKm, booking.serviceId))
```

...through the end of the `if (candidates.length === 0) { ... }` block with:

```ts
  // E21-S04: hold/kyc gating. Both flags default off; with enforcement off the query runs
  // unfiltered and we shadow-log what it WOULD have excluded. Nothing here reaches
  // rankTechnicians — see ADR-0032 and dispatch-eligibility.ts.
  const gates = await loadDispatchGates();
  const rawCandidates = await getTechniciansWithinRadius(
    lat, lng, radiusKm, booking.serviceId, gatesToPredicateOptions(gates),
  );
  if (!gates.holdEnforcementEnabled) {
    logShadowExclusions(bookingId, rawCandidates);
  }

  const candidates = rawCandidates
    .filter((t) => haversine(lat, lng, t.location.coordinates[1], t.location.coordinates[0]) <= radiusKm)
    .filter((t) => !excluded.has(t.id) && !excluded.has(t.technicianId))
    .filter((t) => !(t.blockedCustomerIds ?? []).includes(booking.customerId));

  if (candidates.length === 0) {
    if (isStillDispatchable(booking)) {
      console.log(`DISPATCH_WAITING_FOR_TECHS bookingId=${bookingId}`);
      if (booking.status !== 'PAID') {
        await updateBookingFields(bookingId, { status: 'PAID' });
      }
      return false;
    }
    // With the hold predicate in the SQL the excluded rows never come back, so "no coverage"
    // and "everyone nearby is blocked" look identical in the logs. One extra count query, only
    // on this dead-end path and only when enforcement is on, turns that into a diagnosis.
    let blockedByHold = 0;
    if (gates.holdEnforcementEnabled) {
      try {
        blockedByHold = await countBlockedInRadius(lat, lng, radiusKm, booking.serviceId);
      } catch (err: unknown) {
        console.error('DISPATCH_BLOCKED_COUNT_FAILED', err);
      }
    }
    console.log(`DISPATCH_NO_TECHS bookingId=${bookingId} blockedByHold=${blockedByHold}`);
    await updateBookingFields(bookingId, { status: 'UNFULFILLED' });
    return false;
  }
```

- [ ] **Step 6: Update the existing dispatcher test's mock surface**

In `api/tests/unit/dispatcher.service.test.ts`, change the technician-repository mock to:

```ts
vi.mock('../../src/cosmos/technician-repository.js', () => ({
  getTechniciansWithinRadius: vi.fn(),
  countBlockedInRadius: vi.fn().mockResolvedValue(0),
}));
```

and add, after it:

```ts
vi.mock('../../src/services/dispatch-eligibility.js', async (importOriginal) => {
  // Keep the real pure helpers; stub only the config read so tests stay hermetic.
  const actual = await importOriginal<typeof import('../../src/services/dispatch-eligibility.js')>();
  return {
    ...actual,
    loadDispatchGates: vi.fn().mockResolvedValue({
      holdEnforcementEnabled: false,
      enforceKycInDispatch: false,
    }),
  };
});
```

Then append this block at the end of the file:

```ts
// ── E21-S04 hold gating ───────────────────────────────────────────────────────

import { countBlockedInRadius } from '../../src/cosmos/technician-repository.js';
import { loadDispatchGates } from '../../src/services/dispatch-eligibility.js';

describe('dispatch hold gating', () => {
  const blockedHold = {
    outstandingPaise: 600000, dueCount: 3, state: 'BLOCKED' as const,
    evaluatedAt: '2026-09-08T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.mocked(bookingRepo.getById).mockResolvedValue({ ...BASE_BOOKING });
    vi.mocked(updateBookingFields).mockResolvedValue(undefined as never);
    vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue(null as never);
    vi.mocked(getDispatchAttemptsContainer).mockReturnValue(makeDispatchContainer() as never);
    vi.mocked(getMessaging).mockReturnValue(makeMessaging() as never);
    vi.mocked(loadDispatchGates).mockResolvedValue({
      holdEnforcementEnabled: false,
      enforceKycInDispatch: false,
    });
  });

  it('enforcement OFF: queries with excludeBlockedHolds false and shadow-logs the blocked candidate', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const t = makeTech('tech-blocked', 0.001);
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([{ ...t, commissionHold: blockedHold }]);

    await dispatcherService.triggerDispatch('bk-1');

    expect(getTechniciansWithinRadius).toHaveBeenCalledWith(
      expect.any(Number), expect.any(Number), expect.any(Number), 'svc-plumbing',
      { excludeBlockedHolds: false, requireKyc: false },
    );
    expect(log).toHaveBeenCalledWith(expect.stringContaining('DISPATCH_HOLD_SHADOW_EXCLUSION'));
    log.mockRestore();
  });

  it('enforcement ON: queries with excludeBlockedHolds true and emits no shadow line', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(loadDispatchGates).mockResolvedValue({
      holdEnforcementEnabled: true, enforceKycInDispatch: false,
    });
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([makeTech('tech-ok', 0.001)]);

    await dispatcherService.triggerDispatch('bk-1');

    expect(getTechniciansWithinRadius).toHaveBeenCalledWith(
      expect.any(Number), expect.any(Number), expect.any(Number), 'svc-plumbing',
      { excludeBlockedHolds: true, requireKyc: false },
    );
    expect(log).not.toHaveBeenCalledWith(expect.stringContaining('DISPATCH_HOLD_SHADOW_EXCLUSION'));
    log.mockRestore();
  });

  it('zero candidates + enforcement ON + past the slot: counts blocked technicians and logs it', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(loadDispatchGates).mockResolvedValue({
      holdEnforcementEnabled: true, enforceKycInDispatch: false,
    });
    vi.mocked(bookingRepo.getById).mockResolvedValue({ ...BASE_BOOKING, slotDate: '2020-01-01' });
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([]);
    vi.mocked(countBlockedInRadius).mockResolvedValue(4);

    await dispatcherService.triggerDispatch('bk-1');

    expect(countBlockedInRadius).toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('DISPATCH_NO_TECHS bookingId=bk-1 blockedByHold=4');
    log.mockRestore();
  });

  it('zero candidates + enforcement OFF: does not issue the extra count query', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue({ ...BASE_BOOKING, slotDate: '2020-01-01' });
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([]);

    await dispatcherService.triggerDispatch('bk-1');

    expect(countBlockedInRadius).not.toHaveBeenCalled();
  });

  it('a count-query failure does not break dispatch', async () => {
    vi.mocked(loadDispatchGates).mockResolvedValue({
      holdEnforcementEnabled: true, enforceKycInDispatch: false,
    });
    vi.mocked(bookingRepo.getById).mockResolvedValue({ ...BASE_BOOKING, slotDate: '2020-01-01' });
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([]);
    vi.mocked(countBlockedInRadius).mockRejectedValue(new Error('cosmos down'));

    await expect(dispatcherService.triggerDispatch('bk-1')).resolves.toBeUndefined();
    expect(updateBookingFields).toHaveBeenCalledWith('bk-1', { status: 'UNFULFILLED' });
  });
});
```

- [ ] **Step 7: Run the full dispatcher suite**

```bash
cd api && node_modules/.bin/vitest run tests/unit/dispatch-eligibility.test.ts tests/unit/dispatcher.service.test.ts tests/services/dispatcher.service.test.ts tests/integration/dispatcher-data-isolation.test.ts tests/integration/dispatcher-up-ranking.test.ts
```

Expected: all PASS. If `tests/services/dispatcher.service.test.ts` or either integration test fails on the new `loadDispatchGates` call, add the same `dispatch-eligibility` mock block to that file — do not weaken the production code.

- [ ] **Step 8: Commit**

```bash
git add api/src/services/dispatch-eligibility.ts api/src/services/dispatcher.service.ts api/tests/unit/dispatch-eligibility.test.ts api/tests/unit/dispatcher.service.test.ts
git commit -m "feat(api): gate dispatch on commission hold behind holdEnforcementEnabled

Off (default): the radius query runs unfiltered and shadow-logs every candidate
enforcement would have excluded. On: the predicate moves into the SQL, and the
zero-candidate path issues one count query so DISPATCH_NO_TECHS distinguishes
no coverage from everyone-blocked. Config read failures fail open."
```

---

### Task 4: Karnataka enforcement — Semgrep rule and ranking-invariance test

**Files:**
- Modify: `api/.semgrep.yml`
- Create: `api/tests/unit/dispatch-ranking-invariance.test.ts`

**Interfaces:**
- Consumes: `rankTechnicians` from `../../src/services/dispatcher.service.js` (unchanged signature).
- Produces: Semgrep rule id `no-commission-hold-in-ranking` (asserted present in Task 11).

- [ ] **Step 1: Write the failing test**

Create `api/tests/unit/dispatch-ranking-invariance.test.ts`:

```ts
/**
 * E21-S04 / ADR-0032 — the runtime half of the Karnataka rule.
 *
 * Hold state is an ELIGIBILITY FILTER, never a ranking input. The Semgrep rule
 * `no-commission-hold-in-ranking` catches the field appearing in a comparator; this test catches
 * the behaviour, including any indirect route (a helper, a derived score, a stable-sort side
 * effect) that Semgrep could not see.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rankTechnicians } from '../../src/services/dispatcher.service.js';
import type { CommissionHold, TechnicianProfile } from '../../src/schemas/technician.js';

const LAT = 12.9716;
const LNG = 77.5946;

function tech(id: string, lngOffset: number, rating: number, hold?: CommissionHold): TechnicianProfile {
  return {
    id,
    technicianId: id,
    location: { type: 'Point', coordinates: [LNG + lngOffset, LAT] },
    skills: ['svc-plumbing'],
    availabilityWindows: [],
    isOnline: true,
    isAvailable: true,
    kycStatus: 'APPROVED',
    rating,
    ...(hold ? { commissionHold: hold } : {}),
  };
}

const hold = (state: CommissionHold['state'], outstandingPaise: number): CommissionHold => ({
  outstandingPaise,
  dueCount: 3,
  state,
  evaluatedAt: '2026-09-08T00:00:00.000Z',
});

describe('rankTechnicians is invariant under commission hold state', () => {
  const baseline = [
    tech('near-low-rating', 0.001, 3.0),
    tech('far-high-rating', 0.050, 5.0),
    tech('mid', 0.010, 4.0),
  ];

  const expectedOrder = ['near-low-rating', 'mid', 'far-high-rating'];

  it('ranks by distance then rating with no holds present', () => {
    expect(rankTechnicians(baseline, LAT, LNG).map((t) => t.id)).toEqual(expectedOrder);
  });

  it('produces the identical order when the nearest technician is BLOCKED with a huge balance', () => {
    const mutated = [
      tech('near-low-rating', 0.001, 3.0, hold('BLOCKED', 9_999_900)),
      tech('far-high-rating', 0.050, 5.0),
      tech('mid', 0.010, 4.0),
    ];
    expect(rankTechnicians(mutated, LAT, LNG).map((t) => t.id)).toEqual(expectedOrder);
  });

  it('produces the identical order across every combination of hold states', () => {
    const states: Array<CommissionHold['state']> = ['CLEAR', 'WARN', 'BLOCKED'];
    for (const a of states) {
      for (const b of states) {
        for (const c of states) {
          const mutated = [
            tech('near-low-rating', 0.001, 3.0, hold(a, 100)),
            tech('far-high-rating', 0.050, 5.0, hold(b, 500_000)),
            tech('mid', 0.010, 4.0, hold(c, 250_000)),
          ];
          expect(rankTechnicians(mutated, LAT, LNG).map((t) => t.id)).toEqual(expectedOrder);
        }
      }
    }
  });

  it('produces the identical order when some technicians have no commissionHold at all', () => {
    const mutated = [
      tech('near-low-rating', 0.001, 3.0),
      tech('far-high-rating', 0.050, 5.0, hold('BLOCKED', 800_000)),
      tech('mid', 0.010, 4.0),
    ];
    expect(rankTechnicians(mutated, LAT, LNG).map((t) => t.id)).toEqual(expectedOrder);
  });

  it('CLEAR-with-zero-balance never outranks a nearer technician', () => {
    const mutated = [
      tech('far-high-rating', 0.050, 5.0, hold('CLEAR', 0)),
      tech('near-low-rating', 0.001, 3.0, hold('BLOCKED', 999_999)),
      tech('mid', 0.010, 4.0, hold('WARN', 300_000)),
    ];
    expect(rankTechnicians(mutated, LAT, LNG)[0]!.id).toBe('near-low-rating');
  });
});

describe('rankTechnicians source contains no hold reference', () => {
  it('the function body mentions neither commissionHold nor outstandingPaise', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(
      resolve(here, '..', '..', 'src', 'services', 'dispatcher.service.ts'),
      'utf8',
    );
    const start = src.indexOf('export function rankTechnicians');
    expect(start, 'rankTechnicians not found — was it renamed?').toBeGreaterThanOrEqual(0);
    const end = src.indexOf('\n}', start);
    const body = src.slice(start, end);
    expect(body).not.toMatch(/commissionHold|outstandingPaise|dueCount|holdState/);
  });
});
```

- [ ] **Step 2: Run the test and verify it passes**

```bash
cd api && node_modules/.bin/vitest run tests/unit/dispatch-ranking-invariance.test.ts
```

Expected: PASS. This is a **guard test**, not a red-green test — it must be green against Task 3's implementation. If it fails, Task 3 leaked hold data into ranking and that is the bug to fix.

- [ ] **Step 3: Add the Semgrep rule**

In `api/.semgrep.yml`, immediately after the closing `severity: ERROR` of the `karnataka-no-decline-in-dispatcher` rule, insert:

```yaml
  # E21-S04 / ADR-0032 — commission hold is an ELIGIBILITY FILTER, never a ranking input.
  #
  # Same principle as karnataka-no-decline-in-dispatcher above, different field. A technician
  # who owes commission may be excluded from the candidate set; they must never be sorted
  # lower within it. Ranking is distance, then rating. Nothing else.
  #
  # Companion enforcement:
  #   - api/tests/unit/dispatch-ranking-invariance.test.ts (runtime gate)
  #   - api/src/services/dispatch-eligibility.ts (structural: the only hold-aware module)
  #   - docs/adr/0032-commission-hold-is-an-eligibility-gate.md
  #
  # Note: semgrep-action@v1 treats every finding as blocking regardless of declared severity
  # (see the comment in api/tests/cosmos/cross-partition-tenant-filter.test.ts). That is the
  # intended behaviour for this rule.
  - id: no-commission-hold-in-ranking
    pattern-either:
      - pattern: |
          function rankTechnicians(...) { ... $X.commissionHold ... }
      - pattern: |
          function rankTechnicians(...) { ... $X.outstandingPaise ... }
      - pattern: |
          function rankTechnicians(...) { ... $X.dueCount ... }
      - pattern: $A.sort((...) => { ... $X.commissionHold ... })
      - pattern: $A.sort((...) => { ... $X.outstandingPaise ... })
      - pattern: $A.sort((...) => { ... $X.dueCount ... })
      - pattern: $A.sort(function (...) { ... $X.commissionHold ... })
      - pattern: $A.sort(function (...) { ... $X.outstandingPaise ... })
      - pattern: $A.sort(function (...) { ... $X.dueCount ... })
      - pattern: $A.sort((...) => ... $X.commissionHold ...)
      - pattern: $A.sort((...) => ... $X.outstandingPaise ...)
      - pattern: $A.sort((...) => ... $X.dueCount ...)
    paths:
      include:
        - "api/src/services/dispatcher.service.ts"
        - "api/src/services/dispatch-eligibility.ts"
        - "api/src/cosmos/technician-repository.ts"
    message: |
      Commission hold state must not influence dispatch ranking — it is an eligibility
      filter only (ADR-0032, and the same principle as ADR-0011 for decline history).
      Exclude the technician from the candidate set if they are BLOCKED; never sort,
      score or order by hold state, outstanding balance or due count.
    languages: [typescript]
    severity: ERROR
```

- [ ] **Step 4: Verify the YAML parses and the rule does not fire on current code**

```bash
cd api && node -e "const y=require('js-yaml');const f=require('fs');const d=y.load(f.readFileSync('.semgrep.yml','utf8'));const ids=d.rules.map(r=>r.id);console.log(ids.join('\n'));if(!ids.includes('no-commission-hold-in-ranking'))process.exit(1)"
```

Expected: the rule id list includes `no-commission-hold-in-ranking`.

If `js-yaml` is not installed, fall back to `python -c "import yaml,sys; d=yaml.safe_load(open('.semgrep.yml')); print([r['id'] for r in d['rules']])"`. If neither is available, run `node_modules/.bin/vitest run tests/unit/semgrep-fcm-ordering.test.ts` — it parses the same file and will fail on malformed YAML.

Then, if `semgrep` is on PATH, confirm the rule is clean against the current tree:

```bash
cd .. && semgrep --config api/.semgrep.yml --include 'api/src/**' --error 2>&1 | tail -20
```

Expected: no findings. Skip this sub-step if `semgrep` is not installed locally — CI runs it.

- [ ] **Step 5: Commit**

```bash
git add api/.semgrep.yml api/tests/unit/dispatch-ranking-invariance.test.ts
git commit -m "test(api): lock the Karnataka rule for commission holds

Semgrep no-commission-hold-in-ranking plus a runtime invariance test: mutating
hold state across the candidate set must never reorder rankTechnicians."
```

---

### Task 5: `assertCanAccept` — the accept gate

**Files:**
- Modify: `api/src/services/commission-hold.service.ts` (append)
- Test: `api/tests/services/commission-hold.accept-gate.test.ts` (create)

**Interfaces:**
- Consumes: `computeCommissionHold`, `getCommissionConfig` (both already in that module's scope).
- Produces:
  ```ts
  export type AcceptGateResult =
    | { decision: 'ALLOW' }
    | { decision: 'BLOCKED'; outstandingPaise: number; blockThresholdPaise: number }
    | { decision: 'INDETERMINATE'; reason: string };
  export async function assertCanAccept(technicianId: string): Promise<AcceptGateResult>
  ```

- [ ] **Step 1: Write the failing test**

Create `api/tests/services/commission-hold.accept-gate.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/cosmos/commission-receivable-repository.js');
vi.mock('../../src/services/commission-config.service.js');
vi.mock('../../src/cosmos/technician-repository.js');

import { commissionReceivableRepo } from '../../src/cosmos/commission-receivable-repository.js';
import * as configSvc from '../../src/services/commission-config.service.js';
import * as techRepo from '../../src/cosmos/technician-repository.js';
import { assertCanAccept } from '../../src/services/commission-hold.service.js';
import type { EffectiveCommissionConfig } from '../../src/schemas/commission-config.js';
import type { CommissionHold } from '../../src/schemas/technician.js';

const cfg = (over: Partial<EffectiveCommissionConfig> = {}): EffectiveCommissionConfig => ({
  defaultCommissionBps: 2200,
  warnThresholdPaise: 250000,
  blockThresholdPaise: 500000,
  holdEnforcementEnabled: false,
  enforceKycInDispatch: false,
  updatedBy: 'system',
  updatedAt: new Date(0).toISOString(),
  ...over,
});

const row = (id: string, due: number) => ({
  entry: {
    id, bookingId: id, technicianId: 't1', partitionKey: 't1', serviceId: 's', categoryId: 'c',
    bookingAmount: 1, commissionBps: 2000, commissionDue: due,
    commissionResolvedFrom: 'GLOBAL' as const, remittanceStatus: 'DUE' as const,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  etag: `"${id}"`,
  outstandingPaise: due,
});

const existingHold = (over: Partial<CommissionHold> = {}): CommissionHold => ({
  outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt: '2026-09-01T00:00:00.000Z', ...over,
});

/** Wire the three reads computeCommissionHold performs. */
function arrange(opts: {
  enforcement: boolean;
  outstanding: number;
  hold?: CommissionHold;
  exists?: boolean;
}) {
  vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(
    cfg({ holdEnforcementEnabled: opts.enforcement }),
  );
  vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue(
    opts.outstanding > 0 ? [row('bk-1', opts.outstanding)] : [],
  );
  vi.mocked(techRepo.readCommissionHold).mockResolvedValue({
    exists: opts.exists ?? true,
    ...(opts.hold ? { hold: opts.hold } : { hold: existingHold() }),
  } as never);
}

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.restoreAllMocks());

describe('assertCanAccept — enforcement OFF (dark launch)', () => {
  it('ALLOWS a technician far over the block threshold', async () => {
    arrange({ enforcement: false, outstanding: 900000 });
    expect(await assertCanAccept('t1')).toEqual({ decision: 'ALLOW' });
  });

  it('logs a shadow line when it would have blocked', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    arrange({ enforcement: false, outstanding: 900000 });
    await assertCanAccept('t1');
    expect(log).toHaveBeenCalledWith(
      'ACCEPT_HOLD_SHADOW_BLOCK technicianId=t1 outstandingPaise=900000 blockThresholdPaise=500000',
    );
  });

  it('logs nothing when the technician is under the threshold', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    arrange({ enforcement: false, outstanding: 1000 });
    await assertCanAccept('t1');
    expect(log).not.toHaveBeenCalled();
  });

  it('ALLOWS and swallows the error when the ledger read throws', async () => {
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(cfg({ holdEnforcementEnabled: false }));
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockRejectedValue(new Error('boom'));
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: existingHold() } as never);
    expect(await assertCanAccept('t1')).toEqual({ decision: 'ALLOW' });
  });

  it('ALLOWS when the config read itself throws', async () => {
    vi.mocked(configSvc.getCommissionConfig).mockRejectedValue(new Error('cosmos down'));
    expect(await assertCanAccept('t1')).toEqual({ decision: 'ALLOW' });
  });
});

describe('assertCanAccept — enforcement ON', () => {
  it('BLOCKS at exactly the block threshold and reports both numbers', async () => {
    arrange({ enforcement: true, outstanding: 500000 });
    expect(await assertCanAccept('t1')).toEqual({
      decision: 'BLOCKED', outstandingPaise: 500000, blockThresholdPaise: 500000,
    });
  });

  it('ALLOWS one paise under the block threshold (WARN is not a block)', async () => {
    arrange({ enforcement: true, outstanding: 499999 });
    expect(await assertCanAccept('t1')).toEqual({ decision: 'ALLOW' });
  });

  it('ALLOWS a CLEAR technician', async () => {
    arrange({ enforcement: true, outstanding: 0 });
    expect(await assertCanAccept('t1')).toEqual({ decision: 'ALLOW' });
  });

  it('honours an ACTIVE admin override and allows despite a large balance', async () => {
    arrange({
      enforcement: true,
      outstanding: 900000,
      hold: existingHold({
        override: { until: '2999-01-01T00:00:00.000Z', byAdminId: 'a1', reason: 'pilot' },
      }),
    });
    expect(await assertCanAccept('t1')).toEqual({ decision: 'ALLOW' });
  });

  it('BLOCKS once the override has expired', async () => {
    arrange({
      enforcement: true,
      outstanding: 900000,
      hold: existingHold({
        override: { until: '2000-01-01T00:00:00.000Z', byAdminId: 'a1', reason: 'lapsed' },
      }),
    });
    expect(await assertCanAccept('t1')).toMatchObject({ decision: 'BLOCKED' });
  });

  it('FAILS CLOSED as INDETERMINATE when the ledger read throws', async () => {
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(cfg({ holdEnforcementEnabled: true }));
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockRejectedValue(new Error('boom'));
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: existingHold() } as never);
    const res = await assertCanAccept('t1');
    expect(res.decision).toBe('INDETERMINATE');
  });

  it('FAILS CLOSED as INDETERMINATE when the technician doc does not exist', async () => {
    arrange({ enforcement: true, outstanding: 0, exists: false });
    expect(await assertCanAccept('t1')).toEqual({
      decision: 'INDETERMINATE', reason: 'TECHNICIAN_NOT_FOUND',
    });
  });

  it('uses the LIVE single-partition sum, not the cached hold', async () => {
    // Cached hold says CLEAR/0; the live ledger says 900000. The live number must win.
    arrange({ enforcement: true, outstanding: 900000, hold: existingHold({ state: 'CLEAR' }) });
    expect(await assertCanAccept('t1')).toMatchObject({ decision: 'BLOCKED', outstandingPaise: 900000 });
    expect(commissionReceivableRepo.getOutstandingByTechnician).toHaveBeenCalledWith('t1');
  });

  it('never writes: no patchCommissionHold on any path', async () => {
    arrange({ enforcement: true, outstanding: 900000 });
    await assertCanAccept('t1');
    expect(techRepo.patchCommissionHold).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
cd api && node_modules/.bin/vitest run tests/services/commission-hold.accept-gate.test.ts
```

Expected: FAIL — `assertCanAccept` is not exported.

- [ ] **Step 3: Implement**

Append to `api/src/services/commission-hold.service.ts`:

```ts
/**
 * Outcome of the job-accept commission gate (E21-S04).
 *
 * `INDETERMINATE` is deliberately distinct from `BLOCKED`. Fail-closed means the accept must not
 * succeed; it does NOT mean the technician should be told they owe money, nor that their offer
 * should be destroyed. The handler maps INDETERMINATE to 503 and leaves the dispatch attempt
 * PENDING so the technician can retry inside the offer window — see ADR-0032.
 */
export type AcceptGateResult =
  | { decision: 'ALLOW' }
  | { decision: 'BLOCKED'; outstandingPaise: number; blockThresholdPaise: number }
  | { decision: 'INDETERMINATE'; reason: string };

/**
 * The job-accept commission gate. Read-only: it never writes the hold cache.
 *
 * Uses `computeCommissionHold`, which performs the LIVE single-partition sum of outstanding
 * receivables (not the cached `commissionHold`, which may lag by up to the reconciler cadence),
 * reads the config, reads the current hold for its override, and evaluates state against one
 * consistent `now`. Reusing it is deliberate: the gate and the reconciler can then never
 * disagree about what BLOCKED means.
 *
 * Fail direction (spec 3.6, ADR-0032):
 *   - enforcement OFF → always ALLOW. Nothing user-visible may change while the flag is off, so
 *     even a total failure of the ledger read is swallowed. A would-be block is shadow-logged.
 *   - enforcement ON  → fail CLOSED. BLOCKED blocks; anything indeterminate also refuses, but as
 *     INDETERMINATE rather than as a false accusation of debt.
 */
export async function assertCanAccept(technicianId: string): Promise<AcceptGateResult> {
  let enforcementEnabled = false;
  try {
    enforcementEnabled = (await getCommissionConfig()).holdEnforcementEnabled;
  } catch {
    // Config unreadable: treat as the dark-launch default. Enforcement can only be ON if we
    // positively read that it is ON.
    return { decision: 'ALLOW' };
  }

  let computed: Awaited<ReturnType<typeof computeCommissionHold>>;
  try {
    computed = await computeCommissionHold(technicianId);
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err);
    if (!enforcementEnabled) return { decision: 'ALLOW' };
    console.error(`ACCEPT_HOLD_CHECK_FAILED technicianId=${technicianId} reason=${reason}`);
    return { decision: 'INDETERMINATE', reason };
  }

  if (!computed) {
    if (!enforcementEnabled) return { decision: 'ALLOW' };
    return { decision: 'INDETERMINATE', reason: 'TECHNICIAN_NOT_FOUND' };
  }

  const { hold } = computed;
  const cfg = await getCommissionConfig();

  if (!enforcementEnabled) {
    if (hold.state === 'BLOCKED') {
      console.log(
        `ACCEPT_HOLD_SHADOW_BLOCK technicianId=${technicianId} outstandingPaise=${hold.outstandingPaise} ` +
          `blockThresholdPaise=${cfg.blockThresholdPaise}`,
      );
    }
    return { decision: 'ALLOW' };
  }

  if (hold.state === 'BLOCKED') {
    return {
      decision: 'BLOCKED',
      outstandingPaise: hold.outstandingPaise,
      blockThresholdPaise: cfg.blockThresholdPaise,
    };
  }
  return { decision: 'ALLOW' };
}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
cd api && node_modules/.bin/vitest run tests/services/commission-hold.accept-gate.test.ts tests/services/commission-hold.service.test.ts
```

Expected: all PASS, including the pre-existing hold-service suite.

- [ ] **Step 5: Commit**

```bash
git add api/src/services/commission-hold.service.ts api/tests/services/commission-hold.accept-gate.test.ts
git commit -m "feat(api): assertCanAccept — read-only job-accept commission gate

Live single-partition sum via computeCommissionHold, override honoured. Fails
closed when enforcement is on, with INDETERMINATE kept distinct from BLOCKED so
an infra error never reports phantom debt."
```

---

### Task 6: Accept handler wiring

**Files:**
- Modify: `api/src/functions/job-offers.ts` (`acceptJobOfferHandler`)
- Test: `api/tests/functions/job-offers-hold-gate.test.ts` (create)

**Interfaces:**
- Consumes: `assertCanAccept` (Task 5); `dispatcherService.continueDispatchAfterOfferOutcome`; `dispatchAttemptRepo.declineAttempt`; `systemAudit` from `../services/auditLog.service.js`.
- Produces: `403 { code:'COMMISSION_HOLD_BLOCKED', outstandingPaise, blockThresholdPaise }` and `503 { code:'HOLD_CHECK_UNAVAILABLE' }` on `PATCH /v1/technicians/job-offers/{bookingId}/accept`. This is the contract E21-S05 consumes.

- [ ] **Step 1: Write the failing test**

Create `api/tests/functions/job-offers-hold-gate.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest } from '@azure/functions';

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));
vi.mock('../../src/cosmos/dispatch-attempt-repository.js', () => ({
  dispatchAttemptRepo: {
    getByBookingId: vi.fn(),
    acceptAttempt: vi.fn(),
    declineAttempt: vi.fn(),
  },
}));
vi.mock('../../src/cosmos/booking-event-repository.js', () => ({
  bookingEventRepo: { append: vi.fn() },
}));
vi.mock('../../src/cosmos/booking-repository.js', () => ({
  updateBookingFields: vi.fn(),
}));
vi.mock('../../src/cosmos/client.js', () => ({
  getDispatchAttemptsContainer: vi.fn(),
}));
vi.mock('../../src/services/dispatcher.service.js', () => ({
  dispatcherService: { continueDispatchAfterOfferOutcome: vi.fn() },
}));
vi.mock('../../src/services/fcm.service.js', () => ({
  sendBookingStatusUpdatePush: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../src/services/commission-hold.service.js', () => ({
  assertCanAccept: vi.fn(),
}));
vi.mock('../../src/services/auditLog.service.js', () => ({
  systemAudit: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('firebase-admin/messaging', () => ({
  getMessaging: vi.fn(() => ({ send: vi.fn().mockResolvedValue('m') })),
}));

import { verifyTechnicianToken } from '../../src/middleware/verifyTechnicianToken.js';
import { dispatchAttemptRepo } from '../../src/cosmos/dispatch-attempt-repository.js';
import { bookingEventRepo } from '../../src/cosmos/booking-event-repository.js';
import { updateBookingFields } from '../../src/cosmos/booking-repository.js';
import { dispatcherService } from '../../src/services/dispatcher.service.js';
import { assertCanAccept } from '../../src/services/commission-hold.service.js';
import { systemAudit } from '../../src/services/auditLog.service.js';
import { acceptJobOfferHandler } from '../../src/functions/job-offers.js';

const ctx = { error: vi.fn(), log: vi.fn() } as never;

function req(bookingId = 'bk-1') {
  const r = new HttpRequest({
    url: `http://localhost/api/v1/technicians/job-offers/${bookingId}/accept`,
    method: 'PATCH',
  });
  (r as unknown as { params: Record<string, string> }).params = { bookingId };
  return r;
}

const pendingAttempt = {
  id: 'att-1',
  bookingId: 'bk-1',
  technicianIds: ['tech-1'],
  sentAt: '2026-09-08T00:00:00.000Z',
  expiresAt: '2999-01-01T00:00:00.000Z',
  status: 'PENDING' as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-1' } as never);
  vi.mocked(dispatchAttemptRepo.getByBookingId).mockResolvedValue(pendingAttempt as never);
  vi.mocked(dispatchAttemptRepo.declineAttempt).mockResolvedValue(pendingAttempt as never);
  vi.mocked(dispatchAttemptRepo.acceptAttempt).mockResolvedValue(pendingAttempt as never);
  vi.mocked(updateBookingFields).mockResolvedValue({
    id: 'bk-1', customerId: 'cust-1', status: 'ASSIGNED',
  } as never);
  vi.mocked(dispatcherService.continueDispatchAfterOfferOutcome).mockResolvedValue(true);
  vi.mocked(assertCanAccept).mockResolvedValue({ decision: 'ALLOW' });
});

describe('acceptJobOfferHandler — commission hold gate', () => {
  it('ALLOW: accepts normally and assigns the booking', async () => {
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(res.status).toBe(200);
    expect(dispatchAttemptRepo.acceptAttempt).toHaveBeenCalledWith('att-1', 'bk-1');
  });

  it('BLOCKED: returns 403 COMMISSION_HOLD_BLOCKED with both figures', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(res.status).toBe(403);
    expect(res.jsonBody).toEqual({
      code: 'COMMISSION_HOLD_BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
  });

  it('BLOCKED: never marks the attempt accepted', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    await acceptJobOfferHandler(req(), ctx);
    expect(dispatchAttemptRepo.acceptAttempt).not.toHaveBeenCalled();
    expect(updateBookingFields).not.toHaveBeenCalled();
  });

  it('BLOCKED: declines the attempt AND continues dispatch with the technician excluded', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    await acceptJobOfferHandler(req(), ctx);
    expect(dispatchAttemptRepo.declineAttempt).toHaveBeenCalledWith('att-1', 'bk-1');
    expect(dispatcherService.continueDispatchAfterOfferOutcome).toHaveBeenCalledWith('bk-1', ['tech-1']);
  });

  it('BLOCKED: writes the booking event and the audit entry', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    await acceptJobOfferHandler(req(), ctx);
    expect(bookingEventRepo.append).toHaveBeenCalledWith({
      event: 'TECH_ACCEPT_BLOCKED_BY_HOLD', technicianId: 'tech-1', bookingId: 'bk-1',
    });
    expect(systemAudit).toHaveBeenCalledWith(
      'JOB_ACCEPT_BLOCKED_BY_HOLD', 'booking', 'bk-1',
      { technicianId: 'tech-1', outstandingPaise: 620000, blockThresholdPaise: 500000 },
    );
  });

  it('BLOCKED: still returns 403 when continueDispatch throws', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    vi.mocked(dispatcherService.continueDispatchAfterOfferOutcome).mockRejectedValue(new Error('boom'));
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(res.status).toBe(403);
  });

  it('BLOCKED: still continues dispatch when declineAttempt returns null (already terminal)', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    vi.mocked(dispatchAttemptRepo.declineAttempt).mockResolvedValue(null);
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(dispatcherService.continueDispatchAfterOfferOutcome).toHaveBeenCalledWith('bk-1', ['tech-1']);
    expect(res.status).toBe(403);
  });

  it('INDETERMINATE: returns 503 and leaves the attempt PENDING', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({ decision: 'INDETERMINATE', reason: 'boom' });
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(res.status).toBe(503);
    expect(res.jsonBody).toEqual({ code: 'HOLD_CHECK_UNAVAILABLE' });
    expect(dispatchAttemptRepo.acceptAttempt).not.toHaveBeenCalled();
    expect(dispatchAttemptRepo.declineAttempt).not.toHaveBeenCalled();
    expect(dispatcherService.continueDispatchAfterOfferOutcome).not.toHaveBeenCalled();
  });

  it('INDETERMINATE: writes no audit entry (nothing was decided about the technician)', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({ decision: 'INDETERMINATE', reason: 'boom' });
    await acceptJobOfferHandler(req(), ctx);
    expect(systemAudit).not.toHaveBeenCalled();
  });

  it('the gate runs only after the ownership and expiry checks', async () => {
    vi.mocked(dispatchAttemptRepo.getByBookingId).mockResolvedValue({
      ...pendingAttempt, technicianIds: ['someone-else'],
    } as never);
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(res.status).toBe(403);
    expect(res.jsonBody).toEqual({ code: 'FORBIDDEN' });
    expect(assertCanAccept).not.toHaveBeenCalled();
  });

  it('an expired offer short-circuits before the gate', async () => {
    vi.mocked(dispatchAttemptRepo.getByBookingId).mockResolvedValue({
      ...pendingAttempt, expiresAt: '2000-01-01T00:00:00.000Z',
    } as never);
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(res.status).toBe(410);
    expect(assertCanAccept).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
cd api && node_modules/.bin/vitest run tests/functions/job-offers-hold-gate.test.ts
```

Expected: FAIL — the handler has no gate; the BLOCKED and INDETERMINATE cases return 200.

- [ ] **Step 3: Implement**

In `api/src/functions/job-offers.ts`, add to the imports:

```ts
import { assertCanAccept } from '../services/commission-hold.service.js';
import { systemAudit } from '../services/auditLog.service.js';
```

In `acceptJobOfferHandler`, insert this block immediately after the `if (!attempt.technicianIds.includes(technicianId))` FORBIDDEN check and immediately before `const accepted = await dispatchAttemptRepo.acceptAttempt(...)`:

```ts
  // E21-S04 dues gate. Runs AFTER ownership/expiry so a stranger's request is rejected on
  // identity, not on someone else's balance — and BEFORE acceptAttempt so a blocked accept
  // never transiently marks the attempt ACCEPTED. No-op while holdEnforcementEnabled is off.
  const gate = await assertCanAccept(technicianId);

  if (gate.decision === 'INDETERMINATE') {
    // Fail closed: the accept does not succeed. But the attempt stays PENDING — the technician
    // can retry inside the 90s offer window, and expireStaleOffers (every 30s) is the backstop.
    // Declining here would permanently exclude a possibly-solvent technician over an infra blip.
    ctx.error(`ACCEPT_HOLD_INDETERMINATE bookingId=${bookingId} technicianId=${technicianId} reason=${gate.reason}`);
    return { status: 503, jsonBody: { code: 'HOLD_CHECK_UNAVAILABLE' } };
  }

  if (gate.decision === 'BLOCKED') {
    // Attempts are single-technician: leaving this one PENDING would stall the booking for the
    // full 30s expiry cycle. Decline it and immediately walk to the next-nearest candidate.
    await dispatchAttemptRepo.declineAttempt(attempt.id, bookingId);
    try {
      await dispatcherService.continueDispatchAfterOfferOutcome(bookingId, attempt.technicianIds);
    } catch (err: unknown) {
      // The expiry timer will pick the booking up; the technician still gets a truthful 403.
      ctx.error('ACCEPT_HOLD_CONTINUE_DISPATCH_FAILED', err);
    }
    await bookingEventRepo.append({
      event: 'TECH_ACCEPT_BLOCKED_BY_HOLD',
      technicianId,
      bookingId,
    });
    await systemAudit('JOB_ACCEPT_BLOCKED_BY_HOLD', 'booking', bookingId, {
      technicianId,
      outstandingPaise: gate.outstandingPaise,
      blockThresholdPaise: gate.blockThresholdPaise,
    });
    return {
      status: 403,
      jsonBody: {
        code: 'COMMISSION_HOLD_BLOCKED',
        outstandingPaise: gate.outstandingPaise,
        blockThresholdPaise: gate.blockThresholdPaise,
      },
    };
  }
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
cd api && node_modules/.bin/vitest run tests/functions/job-offers-hold-gate.test.ts
```

Expected: PASS (11 tests).

- [ ] **Step 5: Verify no existing job-offer test regressed**

```bash
cd api && node_modules/.bin/vitest run tests/ --reporter=dot 2>&1 | tail -20
```

Expected: no new failures. If a pre-existing job-offers test now fails because `assertCanAccept` is unmocked, add `vi.mock('../../src/services/commission-hold.service.js', () => ({ assertCanAccept: vi.fn().mockResolvedValue({ decision: 'ALLOW' }) }))` to that file — do not weaken the handler.

- [ ] **Step 6: Commit**

```bash
git add api/src/functions/job-offers.ts api/tests/functions/job-offers-hold-gate.test.ts
git commit -m "feat(api): block job accept on a commission hold, and keep the booking moving

BLOCKED declines the attempt and immediately continues dispatch with the
technician excluded — attempts are single-technician, so leaving it PENDING
would stall the booking for 30s. INDETERMINATE returns 503 and leaves the
attempt PENDING for the technician to retry."
```

---

### Task 7: Reassign audit enrichment

**Files:**
- Modify: `api/src/functions/admin/orders/overrides.ts` (`reassignOrderHandler`)
- Test: `api/tests/functions/admin/orders/reassign-hold-audit.test.ts` (create)

**Interfaces:**
- Consumes: `readTechnicianGateState` (Task 2).
- Produces: reassign audit payload gains `targetHoldState`, `targetOutstandingPaise`, `targetSuspended`.

- [ ] **Step 1: Write the failing test**

Create `api/tests/functions/admin/orders/reassign-hold-audit.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest } from '@azure/functions';

vi.mock('../../../../src/cosmos/booking-repository.js', () => ({
  updateBookingFields: vi.fn(),
  bookingRepo: { getById: vi.fn() },
}));
vi.mock('../../../../src/cosmos/orders-repository.js', () => ({ getOrderById: vi.fn() }));
vi.mock('../../../../src/cosmos/audit-log-repository.js', () => ({ appendAuditEntry: vi.fn() }));
vi.mock('../../../../src/cosmos/technician-repository.js', () => ({
  readTechnicianGateState: vi.fn(),
}));

import { updateBookingFields } from '../../../../src/cosmos/booking-repository.js';
import { getOrderById } from '../../../../src/cosmos/orders-repository.js';
import { appendAuditEntry } from '../../../../src/cosmos/audit-log-repository.js';
import { readTechnicianGateState } from '../../../../src/cosmos/technician-repository.js';
import { reassignOrderHandler } from '../../../../src/functions/admin/orders/overrides.js';

const admin = { adminId: 'a1', role: 'super-admin' as const, sessionId: 's1' };

function req(body: unknown) {
  const r = new HttpRequest({
    url: 'http://localhost/api/v1/admin/orders/bk-1/reassign',
    method: 'POST',
  });
  (r as unknown as { params: Record<string, string> }).params = { id: 'bk-1' };
  r.json = vi.fn().mockResolvedValue(body) as never;
  return r;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(updateBookingFields).mockResolvedValue({ id: 'bk-1' } as never);
  vi.mocked(getOrderById).mockResolvedValue({ id: 'bk-1' } as never);
  vi.mocked(appendAuditEntry).mockResolvedValue(undefined as never);
});

describe('reassignOrderHandler hold enrichment', () => {
  it('records the target technician hold state, balance and suspension in the audit payload', async () => {
    vi.mocked(readTechnicianGateState).mockResolvedValue({
      exists: true,
      hold: {
        outstandingPaise: 620000, dueCount: 4, state: 'BLOCKED',
        evaluatedAt: '2026-09-08T00:00:00.000Z',
      },
      suspended: false,
    });

    const res = await reassignOrderHandler(req({ technicianId: 'tech-9', reason: 'customer request' }), {} as never, admin);

    expect(res.status).toBe(200);
    expect(appendAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REASSIGN',
        payload: {
          technicianId: 'tech-9',
          reason: 'customer request',
          targetHoldState: 'BLOCKED',
          targetOutstandingPaise: 620000,
          targetSuspended: false,
        },
      }),
    );
  });

  it('does NOT block the reassign when the target is BLOCKED (sanctioned override)', async () => {
    vi.mocked(readTechnicianGateState).mockResolvedValue({
      exists: true,
      hold: {
        outstandingPaise: 999999, dueCount: 9, state: 'BLOCKED',
        evaluatedAt: '2026-09-08T00:00:00.000Z',
      },
      suspended: true,
    });
    const res = await reassignOrderHandler(req({ technicianId: 'tech-9', reason: 'r' }), {} as never, admin);
    expect(res.status).toBe(200);
    expect(updateBookingFields).toHaveBeenCalledWith('bk-1', { technicianId: 'tech-9' });
  });

  it('records a legacy technician with no hold as CLEAR/0', async () => {
    vi.mocked(readTechnicianGateState).mockResolvedValue({ exists: true, hold: null, suspended: false });
    await reassignOrderHandler(req({ technicianId: 'tech-legacy', reason: 'r' }), {} as never, admin);
    expect(appendAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ targetHoldState: 'CLEAR', targetOutstandingPaise: 0 }),
      }),
    );
  });

  it('still completes the reassign and writes the audit entry when the gate-state read throws', async () => {
    vi.mocked(readTechnicianGateState).mockRejectedValue(new Error('cosmos down'));
    const res = await reassignOrderHandler(req({ technicianId: 'tech-9', reason: 'r' }), {} as never, admin);
    expect(res.status).toBe(200);
    expect(appendAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ technicianId: 'tech-9', targetHoldState: 'UNKNOWN' }),
      }),
    );
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
cd api && node_modules/.bin/vitest run tests/functions/admin/orders/reassign-hold-audit.test.ts
```

Expected: FAIL — the payload has only `technicianId` and `reason`.

- [ ] **Step 3: Implement**

In `api/src/functions/admin/orders/overrides.ts`, add to the imports:

```ts
import { readTechnicianGateState } from '../../../cosmos/technician-repository.js';
```

In `reassignOrderHandler`, replace the `await appendAuditEntry({ ... })` call with:

```ts
  // E21-S04: reassignment is a SANCTIONED bypass of the dues gate — an owner may deliberately
  // send work to a technician who owes money. It is never blocked, only recorded, so the audit
  // trail shows what the owner was overriding at the time. Best-effort: an enrichment failure
  // must not fail the reassign.
  let targetHoldState = 'UNKNOWN';
  let targetOutstandingPaise: number | null = null;
  let targetSuspended: boolean | null = null;
  try {
    const gateState = await readTechnicianGateState(parsed.data.technicianId);
    targetHoldState = gateState.hold?.state ?? 'CLEAR';
    targetOutstandingPaise = gateState.hold?.outstandingPaise ?? 0;
    targetSuspended = gateState.suspended;
  } catch (err: unknown) {
    console.error('REASSIGN_GATE_STATE_READ_FAILED', err);
  }

  const order = await getOrderById(id);
  await appendAuditEntry({
    id: randomUUID(),
    adminId: admin.adminId,
    role: admin.role,
    action: 'REASSIGN',
    resourceType: 'booking',
    resourceId: id,
    payload: {
      technicianId: parsed.data.technicianId,
      reason: parsed.data.reason,
      targetHoldState,
      ...(targetOutstandingPaise !== null ? { targetOutstandingPaise } : {}),
      ...(targetSuspended !== null ? { targetSuspended } : {}),
    },
    timestamp: new Date().toISOString(),
    partitionKey: new Date().toISOString().slice(0, 7),
  });
```

Delete the now-duplicated `const order = await getOrderById(id);` line that preceded the original audit call.

- [ ] **Step 4: Run the test and verify it passes**

```bash
cd api && node_modules/.bin/vitest run tests/functions/admin/orders/reassign-hold-audit.test.ts
cd api && node_modules/.bin/vitest run tests/ --reporter=dot 2>&1 | tail -10
```

Expected: PASS, no regressions in existing overrides tests.

- [ ] **Step 5: Commit**

```bash
git add api/src/functions/admin/orders/overrides.ts api/tests/functions/admin/orders/reassign-hold-audit.test.ts
git commit -m "feat(api): record the target's hold state and suspension on admin reassign

Reassign stays a sanctioned bypass of the dues gate; it is never blocked, only
audited, so the trail shows what was overridden."
```

---

### Task 8: Summary schema, roster extraction, and repository helpers

**Files:**
- Create: `api/src/schemas/hold-reconciliation-summary.ts`
- Create: `api/src/services/commission-dashboard.service.ts`
- Modify: `api/src/cosmos/system-docs-repository.ts`
- Test: `api/tests/services/commission-dashboard.service.test.ts` (create)
- Test: `api/tests/cosmos/system-docs-repository.test.ts` (modify — append)

**Interfaces:**
- Consumes: `CommissionHold`, `HoldState` from `../schemas/technician.js`; `getSystemContainer` from `./client.js`.
- Produces:
  ```ts
  // schemas/hold-reconciliation-summary.ts
  export const HOLD_RECONCILIATION_SUMMARY_DOC_ID = 'hold-reconciliation-summary';
  export const HOLD_SUMMARY_TOP_N = 100;
  export interface HoldSummaryRow {
    technicianId: string; technicianName?: string; outstandingPaise: number; dueCount: number;
    oldestDueAt?: string; state: HoldState; evaluatedAt: string;
    override?: { until: string; byAdminId: string; reason: string };
  }
  export interface HoldReconciliationSummaryDoc {
    id: typeof HOLD_RECONCILIATION_SUMMARY_DOC_ID;
    computedAt: string; totalTechnicianCount: number; totalOutstandingPaise: number;
    unreconciledTechnicianCount: number; topN: number; top: HoldSummaryRow[];
  }

  // services/commission-dashboard.service.ts
  export interface HoldRosterInput { id: string; name?: string; commissionHold: CommissionHold }
  export function buildHoldRoster(
    allWithHold: HoldRosterInput[],
    dueGroups: Array<{ technicianId: string; outstandingPaise: number }>,
  ): { rows: HoldSummaryRow[]; totalOutstandingPaise: number; unreconciledTechnicianCount: number }

  // cosmos/system-docs-repository.ts — systemDocsRepo gains:
  getHoldReconciliationSummary(): Promise<HoldReconciliationSummaryDoc | null>
  putHoldReconciliationSummary(doc: HoldReconciliationSummaryDoc): Promise<void>
  ```

- [ ] **Step 1: Write the failing test for the roster builder**

Create `api/tests/services/commission-dashboard.service.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildHoldRoster } from '../../src/services/commission-dashboard.service.js';
import type { CommissionHold } from '../../src/schemas/technician.js';

const hold = (over: Partial<CommissionHold> = {}): CommissionHold => ({
  outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt: '2026-09-08T00:00:00.000Z', ...over,
});

describe('buildHoldRoster', () => {
  it('returns empty aggregates for an empty roster', () => {
    expect(buildHoldRoster([], [])).toEqual({
      rows: [], totalOutstandingPaise: 0, unreconciledTechnicianCount: 0,
    });
  });

  it('sorts rows by outstandingPaise descending', () => {
    const rows = buildHoldRoster(
      [
        { id: 't1', name: 'A', commissionHold: hold({ outstandingPaise: 100, state: 'WARN' }) },
        { id: 't2', name: 'B', commissionHold: hold({ outstandingPaise: 900, state: 'BLOCKED' }) },
        { id: 't3', name: 'C', commissionHold: hold({ outstandingPaise: 500, state: 'WARN' }) },
      ],
      [],
    ).rows;
    expect(rows.map((r) => r.technicianId)).toEqual(['t2', 't3', 't1']);
  });

  it('carries name, dueCount, oldestDueAt, state, evaluatedAt and override onto the row', () => {
    const override = { until: '2999-01-01T00:00:00.000Z', byAdminId: 'a1', reason: 'pilot' };
    const [row] = buildHoldRoster(
      [{
        id: 't1', name: 'Ravi',
        commissionHold: hold({
          outstandingPaise: 700, dueCount: 3, oldestDueAt: '2026-09-01T00:00:00.000Z',
          state: 'BLOCKED', override,
        }),
      }],
      [],
    ).rows;
    expect(row).toEqual({
      technicianId: 't1', technicianName: 'Ravi', outstandingPaise: 700, dueCount: 3,
      oldestDueAt: '2026-09-01T00:00:00.000Z', state: 'BLOCKED',
      evaluatedAt: '2026-09-08T00:00:00.000Z', override,
    });
  });

  it('omits technicianName, oldestDueAt and override when absent', () => {
    const [row] = buildHoldRoster(
      [{ id: 't1', commissionHold: hold({ outstandingPaise: 700, state: 'BLOCKED' }) }],
      [],
    ).rows;
    expect(Object.keys(row!).sort()).toEqual(
      ['dueCount', 'evaluatedAt', 'outstandingPaise', 'state', 'technicianId'],
    );
  });

  it('totals one contribution per technician, preferring the cached hold', () => {
    const { totalOutstandingPaise } = buildHoldRoster(
      [{ id: 't1', commissionHold: hold({ outstandingPaise: 100, state: 'WARN' }) }],
      [{ technicianId: 't1', outstandingPaise: 999 }],
    );
    expect(totalOutstandingPaise).toBe(100);
  });

  it('falls back to the DUE aggregate for a technician with no cached hold yet', () => {
    const { totalOutstandingPaise } = buildHoldRoster(
      [{ id: 't1', commissionHold: hold({ outstandingPaise: 100, state: 'WARN' }) }],
      [{ technicianId: 't1', outstandingPaise: 100 }, { technicianId: 't2', outstandingPaise: 250 }],
    );
    expect(totalOutstandingPaise).toBe(350);
  });

  it('counts a DUE group whose cached hold disagrees as unreconciled', () => {
    const { unreconciledTechnicianCount } = buildHoldRoster(
      [{ id: 't1', commissionHold: hold({ outstandingPaise: 100, state: 'WARN' }) }],
      [{ technicianId: 't1', outstandingPaise: 250 }],
    );
    expect(unreconciledTechnicianCount).toBe(1);
  });

  it('counts a DUE group with no cached hold at all as unreconciled', () => {
    const { unreconciledTechnicianCount } = buildHoldRoster(
      [], [{ technicianId: 't9', outstandingPaise: 250 }],
    );
    expect(unreconciledTechnicianCount).toBe(1);
  });

  it('counts a non-zero cached hold with no DUE group as unreconciled (the other direction)', () => {
    const { unreconciledTechnicianCount } = buildHoldRoster(
      [{ id: 't1', commissionHold: hold({ outstandingPaise: 100, state: 'WARN' }) }], [],
    );
    expect(unreconciledTechnicianCount).toBe(1);
  });

  it('does not count a zero cached hold with no DUE group', () => {
    const { unreconciledTechnicianCount } = buildHoldRoster(
      [{ id: 't1', commissionHold: hold({ outstandingPaise: 0, state: 'CLEAR' }) }], [],
    );
    expect(unreconciledTechnicianCount).toBe(0);
  });

  it('is pure — calling twice on the same inputs gives deep-equal output and no mutation', () => {
    const input = [{ id: 't1', commissionHold: hold({ outstandingPaise: 100, state: 'WARN' as const }) }];
    const snapshot = JSON.stringify(input);
    expect(buildHoldRoster(input, [])).toEqual(buildHoldRoster(input, []));
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
cd api && node_modules/.bin/vitest run tests/services/commission-dashboard.service.test.ts
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Create the schema module**

Create `api/src/schemas/hold-reconciliation-summary.ts`:

```ts
/**
 * E21-S04 — `system/hold-reconciliation-summary`, written by the 15-minute reconciler and read
 * by the admin commission dashboard.
 *
 * Exists to close a parked Codex P2 from E21-S02 Task 10: the dashboard drained EVERY technician
 * hold document plus a cross-partition GROUP BY on every single request. Precomputing the same
 * aggregates on a fixed schedule is both cheaper and far more predictable.
 *
 * Not a Zod schema on the read path by design: this document is written by exactly one system
 * writer and the dashboard falls back to a live drain whenever it is missing, stale, or too
 * short — so a shape change degrades to the old behaviour rather than throwing (read-path
 * schemas only widen; see the #320 lesson).
 */
import type { HoldState } from './technician.js';

export const HOLD_RECONCILIATION_SUMMARY_DOC_ID = 'hold-reconciliation-summary';

/** Two dashboard pages at DASHBOARD_PAGE_SIZE = 50. Beyond this the dashboard drains live. */
export const HOLD_SUMMARY_TOP_N = 100;

export interface HoldSummaryRow {
  technicianId: string;
  technicianName?: string;
  outstandingPaise: number;
  dueCount: number;
  oldestDueAt?: string;
  state: HoldState;
  evaluatedAt: string;
  override?: { until: string; byAdminId: string; reason: string };
}

export interface HoldReconciliationSummaryDoc {
  id: typeof HOLD_RECONCILIATION_SUMMARY_DOC_ID;
  /** ISO. The dashboard treats the document as unusable once this is older than 45 minutes. */
  computedAt: string;
  /** Size of the FULL roster carrying a hold, not of `top`. */
  totalTechnicianCount: number;
  /** Dashboard-wide, page-independent total across the FULL roster. */
  totalOutstandingPaise: number;
  unreconciledTechnicianCount: number;
  topN: number;
  /** Sorted outstandingPaise DESC. The ordering IS the payload. */
  top: HoldSummaryRow[];
}
```

- [ ] **Step 4: Create the roster service**

Create `api/src/services/commission-dashboard.service.ts`:

```ts
/**
 * E21-S04 — the roster/aggregate computation shared by the reconciler (which writes
 * `system/hold-reconciliation-summary`) and the admin dashboard (which falls back to computing
 * it live). Extracted verbatim from the E21-S02 dashboard handler so the two paths cannot drift:
 * a divergence here would show the owner different money on consecutive page loads.
 *
 * Pure. No I/O, no mutation of its inputs.
 */
import type { HoldSummaryRow } from '../schemas/hold-reconciliation-summary.js';
import type { CommissionHold } from '../schemas/technician.js';

export interface HoldRosterInput {
  id: string;
  name?: string;
  commissionHold: CommissionHold;
}

export function buildHoldRoster(
  allWithHold: HoldRosterInput[],
  dueGroups: Array<{ technicianId: string; outstandingPaise: number }>,
): { rows: HoldSummaryRow[]; totalOutstandingPaise: number; unreconciledTechnicianCount: number } {
  const dueById = new Map(dueGroups.map((g) => [g.technicianId, g.outstandingPaise]));
  const holdById = new Map(allWithHold.map((t) => [t.id, t.commissionHold]));

  // Two-direction union: a DUE group whose cached hold disagrees (or is missing entirely), AND a
  // non-zero cached hold with no DUE group left (e.g. every row was waived or remitted elsewhere
  // and the hold write never landed).
  const unreconciled = new Set<string>();
  for (const g of dueGroups) {
    const h = holdById.get(g.technicianId);
    if (!h || h.outstandingPaise !== g.outstandingPaise) unreconciled.add(g.technicianId);
  }
  for (const t of allWithHold) {
    if (!dueById.has(t.id) && t.commissionHold.outstandingPaise !== 0) unreconciled.add(t.id);
  }

  // One contribution per technician. The cached hold is preferred because it is the same source
  // the rows display; a technician present only in the DUE aggregate (hold write not landed yet)
  // falls back to that aggregate so their balance is not silently dropped from the headline.
  const seen = new Set<string>();
  let totalOutstandingPaise = 0;
  for (const t of allWithHold) {
    seen.add(t.id);
    totalOutstandingPaise += t.commissionHold.outstandingPaise;
  }
  for (const g of dueGroups) {
    if (!seen.has(g.technicianId)) totalOutstandingPaise += g.outstandingPaise;
  }

  const rows: HoldSummaryRow[] = [...allWithHold]
    .sort((a, b) => b.commissionHold.outstandingPaise - a.commissionHold.outstandingPaise)
    .map((t) => ({
      technicianId: t.id,
      ...(t.name !== undefined ? { technicianName: t.name } : {}),
      outstandingPaise: t.commissionHold.outstandingPaise,
      dueCount: t.commissionHold.dueCount,
      ...(t.commissionHold.oldestDueAt !== undefined ? { oldestDueAt: t.commissionHold.oldestDueAt } : {}),
      state: t.commissionHold.state,
      evaluatedAt: t.commissionHold.evaluatedAt,
      ...(t.commissionHold.override !== undefined ? { override: t.commissionHold.override } : {}),
    }));

  return { rows, totalOutstandingPaise, unreconciledTechnicianCount: unreconciled.size };
}
```

- [ ] **Step 5: Run the roster test and verify it passes**

```bash
cd api && node_modules/.bin/vitest run tests/services/commission-dashboard.service.test.ts
```

Expected: PASS (11 tests).

- [ ] **Step 6: Write the failing test for the repository helpers**

Append to `api/tests/cosmos/system-docs-repository.test.ts` (match the file's existing mocking style for `getSystemContainer`; if it mocks `../../src/cosmos/client.js`, reuse that mock):

```ts
// ── E21-S04 hold reconciliation summary ──────────────────────────────────────

import {
  HOLD_RECONCILIATION_SUMMARY_DOC_ID,
  type HoldReconciliationSummaryDoc,
} from '../../src/schemas/hold-reconciliation-summary.js';

describe('hold reconciliation summary', () => {
  const doc: HoldReconciliationSummaryDoc = {
    id: HOLD_RECONCILIATION_SUMMARY_DOC_ID,
    computedAt: '2026-09-08T12:00:00.000Z',
    totalTechnicianCount: 3,
    totalOutstandingPaise: 1234,
    unreconciledTechnicianCount: 1,
    topN: 100,
    top: [{
      technicianId: 't1', outstandingPaise: 1234, dueCount: 2,
      state: 'BLOCKED', evaluatedAt: '2026-09-08T11:59:00.000Z',
    }],
  };

  it('getHoldReconciliationSummary returns null when the document is absent', async () => {
    const read = vi.fn().mockResolvedValue({ resource: undefined });
    vi.mocked(getSystemContainer).mockReturnValue({ item: () => ({ read }) } as never);
    expect(await systemDocsRepo.getHoldReconciliationSummary()).toBeNull();
  });

  it('getHoldReconciliationSummary returns the stored document', async () => {
    const read = vi.fn().mockResolvedValue({ resource: doc });
    vi.mocked(getSystemContainer).mockReturnValue({ item: () => ({ read }) } as never);
    expect(await systemDocsRepo.getHoldReconciliationSummary()).toEqual(doc);
  });

  it('putHoldReconciliationSummary upserts by id (last writer wins — one system writer)', async () => {
    const upsert = vi.fn().mockResolvedValue({});
    vi.mocked(getSystemContainer).mockReturnValue({ items: { upsert } } as never);
    await systemDocsRepo.putHoldReconciliationSummary(doc);
    expect(upsert).toHaveBeenCalledWith(doc);
  });
});
```

- [ ] **Step 7: Run it and verify it fails, then implement**

```bash
cd api && node_modules/.bin/vitest run tests/cosmos/system-docs-repository.test.ts
```

Expected: FAIL — the two methods do not exist.

In `api/src/cosmos/system-docs-repository.ts`, add to the imports:

```ts
import {
  HOLD_RECONCILIATION_SUMMARY_DOC_ID,
  type HoldReconciliationSummaryDoc,
} from '../schemas/hold-reconciliation-summary.js';
```

and add these two methods to the `systemDocsRepo` object:

```ts
  /**
   * Point read of `system/hold-reconciliation-summary`. Returns null when the document has never
   * been written (first deploy, before the reconciler's first run) — the dashboard then falls
   * back to a live drain, so a null here is a degraded path, never an error.
   */
  async getHoldReconciliationSummary(): Promise<HoldReconciliationSummaryDoc | null> {
    const { resource } = await getSystemContainer()
      .item(HOLD_RECONCILIATION_SUMMARY_DOC_ID, HOLD_RECONCILIATION_SUMMARY_DOC_ID)
      .read<HoldReconciliationSummaryDoc>();
    return resource ?? null;
  },

  /**
   * Blind upsert. Unlike hold-repair and technician-client-config there is no read-merge-under-
   * IfMatch loop here: this document has exactly one writer (the 15-minute reconciler timer),
   * it is derived state that is fully recomputed on every run, and it is disposable — a lost
   * write costs at most one cycle of dashboard freshness, after which the dashboard falls back
   * to draining live. An ETag loop would add contention and buy nothing.
   */
  async putHoldReconciliationSummary(doc: HoldReconciliationSummaryDoc): Promise<void> {
    await getSystemContainer().items.upsert(doc);
  },
```

- [ ] **Step 8: Run both tests and the type-check**

```bash
cd api && node_modules/.bin/vitest run tests/cosmos/system-docs-repository.test.ts tests/services/commission-dashboard.service.test.ts
cd api && node_modules/.bin/tsc --noEmit -p tsconfig.tests.json
```

Expected: all PASS, type-check clean.

- [ ] **Step 9: Commit**

```bash
git add api/src/schemas/hold-reconciliation-summary.ts api/src/services/commission-dashboard.service.ts api/src/cosmos/system-docs-repository.ts api/tests/services/commission-dashboard.service.test.ts api/tests/cosmos/system-docs-repository.test.ts
git commit -m "feat(api): hold reconciliation summary document and shared roster builder

buildHoldRoster is extracted verbatim from the E21-S02 dashboard so the
precomputed summary and the live-drain fallback cannot report different money."
```

---

### Task 9: The reconciler timer

**Files:**
- Create: `api/src/functions/trigger-reconcile-commission-holds.ts`
- Test: `api/tests/unit/trigger-reconcile-commission-holds.test.ts` (create)

**Interfaces:**
- Consumes: `systemDocsRepo.{drainHoldRepair, enqueueHoldRepair, putHoldReconciliationSummary}` (Task 8); `sweepAllHolds`, `recomputeCommissionHold` (`commission-hold.service.ts`); `listAllTechniciansWithHold`, `getTechniciansByIds` (`technician-repository.ts`); `commissionReceivableRepo.sumDueGroupedByTechnician`; `buildHoldRoster` (Task 8).
- Produces: `export async function reconcileCommissionHolds(ctx: InvocationContext): Promise<void>` and the registered timer `triggerReconcileCommissionHolds`.

- [ ] **Step 1: Write the failing test**

Create `api/tests/unit/trigger-reconcile-commission-holds.test.ts`:

```ts
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
  getTechniciansByIds: vi.fn(),
}));
vi.mock('../../src/cosmos/commission-receivable-repository.js', () => ({
  commissionReceivableRepo: { sumDueGroupedByTechnician: vi.fn() },
}));

import * as Sentry from '@sentry/node';
import { systemDocsRepo } from '../../src/cosmos/system-docs-repository.js';
import { sweepAllHolds, recomputeCommissionHold } from '../../src/services/commission-hold.service.js';
import { listAllTechniciansWithHold, getTechniciansByIds } from '../../src/cosmos/technician-repository.js';
import { commissionReceivableRepo } from '../../src/cosmos/commission-receivable-repository.js';
import { reconcileCommissionHolds } from '../../src/functions/trigger-reconcile-commission-holds.js';

const ctx = { log: vi.fn(), error: vi.fn() } as never;

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
  vi.mocked(getTechniciansByIds).mockResolvedValue([]);
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
      { technicianId: 't1', outstandingPaise: 100 },
      { technicianId: 't2', outstandingPaise: 900 },
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

  it('a summary write failure is captured but does not fail the run', async () => {
    vi.mocked(systemDocsRepo.putHoldReconciliationSummary).mockRejectedValue(new Error('boom'));
    await expect(reconcileCommissionHolds(ctx)).resolves.toBeUndefined();
    expect(Sentry.captureException).toHaveBeenCalled();
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
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
cd api && node_modules/.bin/vitest run tests/unit/trigger-reconcile-commission-holds.test.ts
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement**

Create `api/src/functions/trigger-reconcile-commission-holds.ts`:

```ts
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
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
cd api && node_modules/.bin/vitest run tests/unit/trigger-reconcile-commission-holds.test.ts
```

Expected: PASS (15 tests).

- [ ] **Step 5: Confirm the function is discovered**

```bash
cd api && grep -rn "trigger-reconcile-payouts" --include='*.json' --include='*.ts' . --exclude-dir=node_modules --exclude-dir=dist | grep -v tests/
```

If the sibling timer appears in an explicit entry-point list (e.g. a `main` glob in `package.json` or an index that imports every function file), add `trigger-reconcile-commission-holds.ts` there the same way. If the sibling is only discovered by a glob such as `dist/functions/**/*.js`, nothing more is needed.

- [ ] **Step 6: Commit**

```bash
git add api/src/functions/trigger-reconcile-commission-holds.ts api/tests/unit/trigger-reconcile-commission-holds.test.ts
git commit -m "feat(api): 15-minute commission-hold reconciler

Drains the repair queue, sweeps EXPIRED_OVERRIDES on every run (E21-S02
carry-forward), clock-gates a 90-minute FULL sweep, and writes
system/hold-reconciliation-summary with top-N ordering so the admin dashboard
stops draining every hold document per request."
```

---

### Task 10: Dashboard reads the summary

**Files:**
- Modify: `api/src/functions/admin/finance/commission-receivables.ts`
- Test: `api/tests/functions/admin/finance/commission-receivables.test.ts` (append)

**Interfaces:**
- Consumes: `systemDocsRepo.getHoldReconciliationSummary` (Task 8), `buildHoldRoster` (Task 8).
- Produces: no contract change. `GET /v1/admin/finance/commission-receivables` returns exactly the same JSON shape as before.

- [ ] **Step 1: Write the failing test**

Append to `api/tests/functions/admin/finance/commission-receivables.test.ts`:

```ts
// ── E21-S04: summary-backed dashboard ────────────────────────────────────────

import {
  HOLD_RECONCILIATION_SUMMARY_DOC_ID,
  type HoldReconciliationSummaryDoc,
} from '../../../../src/schemas/hold-reconciliation-summary.js';

const freshSummary = (over: Partial<HoldReconciliationSummaryDoc> = {}): HoldReconciliationSummaryDoc => ({
  id: HOLD_RECONCILIATION_SUMMARY_DOC_ID,
  computedAt: new Date().toISOString(),
  totalTechnicianCount: 1,
  totalOutstandingPaise: 5000,
  unreconciledTechnicianCount: 0,
  topN: 100,
  top: [{
    technicianId: 'tech-1', technicianName: 'Ravi Kumar', outstandingPaise: 5000,
    dueCount: 1, state: 'WARN', evaluatedAt: '2026-09-08T00:00:00.000Z',
  }],
  ...over,
});

describe('dashboard summary fast path', () => {
  it('serves from the summary and performs NO drain', async () => {
    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockResolvedValue(freshSummary());

    const res = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(techRepo.listAllTechniciansWithHold).not.toHaveBeenCalled();
    expect(commissionReceivableRepo.sumDueGroupedByTechnician).not.toHaveBeenCalled();
    expect(res.jsonBody).toMatchObject({
      totalOutstanding: 5000,
      unreconciledTechnicianCount: 0,
      technicians: [expect.objectContaining({ technicianId: 'tech-1', technicianName: 'Ravi Kumar' })],
    });
  });

  it('falls back to the live drain when the summary is absent', async () => {
    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockResolvedValue(null);
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([]);
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([]);

    const res = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(techRepo.listAllTechniciansWithHold).toHaveBeenCalled();
  });

  it('falls back when the summary is older than 45 minutes', async () => {
    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockResolvedValue(
      freshSummary({ computedAt: new Date(Date.now() - 46 * 60 * 1000).toISOString() }),
    );
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([]);
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([]);

    await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx);

    expect(techRepo.listAllTechniciansWithHold).toHaveBeenCalled();
  });

  it('falls back when the requested page runs past topN', async () => {
    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockResolvedValue(
      freshSummary({ topN: 100, totalTechnicianCount: 500 }),
    );
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([]);
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([]);
    const token = Buffer.from('100').toString('base64');

    await adminCommissionReceivablesDashboardHandler(
      getReq(`http://localhost/api/v1/admin/finance/commission-receivables?continuationToken=${token}`),
      {} as never, ctx,
    );

    expect(techRepo.listAllTechniciansWithHold).toHaveBeenCalled();
  });

  it('falls back when reading the summary throws', async () => {
    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockRejectedValue(new Error('boom'));
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([]);
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([]);

    const res = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(techRepo.listAllTechniciansWithHold).toHaveBeenCalled();
  });

  it('summary path and drain path produce identical JSON for the same underlying data', async () => {
    const hold = {
      outstandingPaise: 5000, dueCount: 1, state: 'WARN' as const,
      evaluatedAt: '2026-09-08T00:00:00.000Z',
    };

    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockResolvedValue(null);
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([
      { id: 'tech-1', name: 'Ravi Kumar', commissionHold: hold },
    ]);
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([
      { technicianId: 'tech-1', outstandingPaise: 5000 },
    ]);
    vi.mocked(techRepo.getTechniciansByIds).mockResolvedValue([
      { id: 'tech-1', technicianId: 'tech-1', displayName: 'Ravi Kumar' },
    ]);
    const drained = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    vi.clearAllMocks();
    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockResolvedValue(freshSummary());
    const fromSummary = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    expect(fromSummary.jsonBody).toEqual(drained.jsonBody);
  });
});

describe('HOLD_STALE_AFTER_MS matches the reconciler cadence', () => {
  it('staleAfter is 90 minutes after evaluatedAt, not 6 hours', async () => {
    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockResolvedValue(freshSummary());
    const res = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;
    const row = (res.jsonBody as { technicians: Array<{ evaluatedAt: string; staleAfter: string }> }).technicians[0]!;
    expect(new Date(row.staleAfter).getTime() - new Date(row.evaluatedAt).getTime()).toBe(90 * 60 * 1000);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
cd api && node_modules/.bin/vitest run tests/functions/admin/finance/commission-receivables.test.ts
```

Expected: FAIL — the handler always drains, and `staleAfter` is 6 hours out.

- [ ] **Step 3: Implement**

In `api/src/functions/admin/finance/commission-receivables.ts`:

Add to the imports:

```ts
import { buildHoldRoster } from '../../../services/commission-dashboard.service.js';
import { HOLD_SUMMARY_TOP_N, type HoldSummaryRow } from '../../../schemas/hold-reconciliation-summary.js';
```

Replace the `HOLD_STALE_AFTER_MS` constant and its comment with:

```ts
/** Full-sweep cadence: the E21-S04 reconciler re-evaluates every hold every 6th 15-minute run,
 *  i.e. every 90 minutes (trigger-reconcile-commission-holds.ts). A row's cached commissionHold
 *  should be treated as possibly-stale once this much time has elapsed since `evaluatedAt`. */
const HOLD_STALE_AFTER_MS = 90 * 60 * 1000;

/** The precomputed summary is unusable once it is older than 3 reconciler cycles. */
const SUMMARY_MAX_AGE_MS = 45 * 60 * 1000;
```

Replace the body of the `try { ... }` block inside `adminCommissionReceivablesDashboardHandler` (from `const [allWithHold, dueGroups] = await Promise.all([` down to and including the `return { status: 200, jsonBody: {...} };`) with:

```ts
    // E21-S04: prefer the precomputed summary the reconciler writes every 15 minutes. The
    // fallback below is the original E21-S02 behaviour and still runs whenever the summary is
    // missing, stale, or too short for the requested page — so this is a pure cost optimisation
    // with no change to the response shape.
    let rows: HoldSummaryRow[] | null = null;
    let totalOutstanding = 0;
    let unreconciledTechnicianCount = 0;

    try {
      const summary = await systemDocsRepo.getHoldReconciliationSummary();
      const fresh =
        summary !== null && Date.now() - new Date(summary.computedAt).getTime() <= SUMMARY_MAX_AGE_MS;
      const coversPage =
        summary !== null && offset + DASHBOARD_PAGE_SIZE <= (summary.topN ?? HOLD_SUMMARY_TOP_N);
      if (summary && fresh && coversPage) {
        rows = summary.top;
        totalOutstanding = summary.totalOutstandingPaise;
        unreconciledTechnicianCount = summary.unreconciledTechnicianCount;
      }
    } catch {
      // Fall through to the live drain.
    }

    if (rows === null) {
      const [allWithHold, dueGroups] = await Promise.all([
        listAllTechniciansWithHold(),
        commissionReceivableRepo.sumDueGroupedByTechnician(),
      ]);
      const roster = buildHoldRoster(allWithHold, dueGroups);
      rows = roster.rows;
      totalOutstanding = roster.totalOutstandingPaise;
      unreconciledTechnicianCount = roster.unreconciledTechnicianCount;
    }

    const pageItems = rows.slice(offset, offset + DASHBOARD_PAGE_SIZE);
    const nextOffset = offset + DASHBOARD_PAGE_SIZE;
    const hasMore = nextOffset < rows.length;

    const relevant = pageItems.filter((r) => r.outstandingPaise > 0 || r.state !== 'CLEAR');

    const missingName = relevant.filter((r) => r.technicianName === undefined).map((r) => r.technicianId);
    const techProfiles = missingName.length > 0 ? await getTechniciansByIds(missingName) : [];
    const nameById = new Map(
      techProfiles.map((t) => [t.technicianId || t.id, t.displayName || t.name]),
    );

    const technicians = relevant.map((r) => ({
      technicianId: r.technicianId,
      technicianName: r.technicianName ?? nameById.get(r.technicianId) ?? r.technicianId,
      outstandingPaise: r.outstandingPaise,
      dueCount: r.dueCount,
      ...(r.oldestDueAt !== undefined ? { oldestDueAt: r.oldestDueAt } : {}),
      state: r.state,
      evaluatedAt: r.evaluatedAt,
      staleAfter: new Date(new Date(r.evaluatedAt).getTime() + HOLD_STALE_AFTER_MS).toISOString(),
      ...(r.override !== undefined ? { override: r.override } : {}),
    }));

    return {
      status: 200,
      jsonBody: {
        technicians,
        totalOutstanding,
        unreconciledTechnicianCount,
        ...(hasMore ? { continuationToken: Buffer.from(String(nextOffset)).toString('base64') } : {}),
      },
    };
```

Update the handler's JSDoc block to describe the summary-first read path and the three fallback conditions.

- [ ] **Step 4: Run the test and verify it passes**

```bash
cd api && node_modules/.bin/vitest run tests/functions/admin/finance/commission-receivables.test.ts
```

Expected: all PASS, including every pre-existing test in the file — the response shape must be unchanged.

- [ ] **Step 5: Commit**

```bash
git add api/src/functions/admin/finance/commission-receivables.ts api/tests/functions/admin/finance/commission-receivables.test.ts
git commit -m "perf(api): serve the commission dashboard from the reconciliation summary

Closes the parked E21-S02 Codex P2: the dashboard drained every hold document
plus a cross-partition GROUP BY per request. Falls back to that drain when the
summary is missing, older than 45 minutes, or shorter than the requested page.
Response shape is unchanged. HOLD_STALE_AFTER_MS corrected to the real 90-minute
sweep cadence."
```

---

### Task 11: Cross-partition helper registration (ADR-0027)

**Files:**
- Modify: `api/tests/cosmos/cross-partition-tenant-filter.test.ts`
- Modify: `api/src/cosmos/technician-repository.ts` (comments only)
- Modify: `api/src/cosmos/commission-receivable-repository.ts` (comment only)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new. This task locks in an invariant that already holds.

- [ ] **Step 1: Extend the test's registration tables**

In `api/tests/cosmos/cross-partition-tenant-filter.test.ts`, add these four entries to the end of the `CROSS_PARTITION_IMPORT_TOKENS` array:

```ts
  // E21-S04: the four cross-partition helpers E21-S02 added and never registered.
  { helper: 'listTechniciansWithHold',           importPattern: /\blistTechniciansWithHold\b/ },
  { helper: 'listAllTechniciansWithHold',        importPattern: /\blistAllTechniciansWithHold\b/ },
  { helper: 'listTechniciansWithExpiredOverride', importPattern: /\blistTechniciansWithExpiredOverride\b/ },
  { helper: 'commissionReceivableRepo.sumDueGroupedByTechnician', importPattern: /commissionReceivableRepo\.sumDueGroupedByTechnician\b/ },
```

and add these two entries to the `FILES_AND_HELPERS` array:

```ts
    {
      file: resolve(COSMOS_ROOT, 'technician-repository.ts'),
      helpers: [
        'listTechniciansWithHold',
        'listAllTechniciansWithHold',
        'listTechniciansWithExpiredOverride',
      ],
    },
    {
      file: resolve(COSMOS_ROOT, 'commission-receivable-repository.ts'),
      helpers: ['sumDueGroupedByTechnician'],
    },
```

Then, inside the `describe('Semgrep rule presence (E19-S03)')` block, add:

```ts
  it('api/.semgrep.yml contains the no-commission-hold-in-ranking rule id (E21-S04)', () => {
    expect(semgrepSrc).toMatch(/^\s*-\s+id:\s+no-commission-hold-in-ranking\s*$/m);
  });

  it('no-commission-hold-in-ranking rule has ERROR severity', () => {
    const ruleStart = semgrepSrc.indexOf('id: no-commission-hold-in-ranking');
    const nextRule = semgrepSrc.indexOf('\n  - id:', ruleStart + 1);
    const block = nextRule === -1 ? semgrepSrc.slice(ruleStart) : semgrepSrc.slice(ruleStart, nextRule);
    expect(block).toMatch(/severity:\s+ERROR/);
  });
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
cd api && node_modules/.bin/vitest run tests/cosmos/cross-partition-tenant-filter.test.ts
```

Expected: FAIL on Layer 3 — no `SEMGREP-JUSTIFIED` comment above any of the four helpers. Layer 2 and the Semgrep-presence assertions should already pass (Task 4 added the rule; both callers already carry an approved scope token).

- [ ] **Step 3: Add the SEMGREP-JUSTIFIED comments**

In `api/src/cosmos/technician-repository.ts`, add as the **last line of the existing JSDoc block** above each of the three helpers (inside the `*/`-terminated comment is not enough — Layer 3 looks for a `//` line in the five lines preceding the declaration, so put it on its own line directly above `export async function`):

Above `listTechniciansWithHold`:
```ts
// SEMGREP-JUSTIFIED: cross-partition by design — an admin-only roster view. Callers are gated by
// requireAdmin (admin/finance/commission-receivables.ts); no user-controlled filter reaches the query.
```

Above `listAllTechniciansWithHold`:
```ts
// SEMGREP-JUSTIFIED: cross-partition by design — the hold sweep and the reconciliation summary
// need the whole roster. Callers are requireAdmin handlers or the app.timer reconciler; the query
// takes no parameters at all, so no user input can reach it.
```

Above `listTechniciansWithExpiredOverride`:
```ts
// SEMGREP-JUSTIFIED: cross-partition by design — drives the reconciler's EXPIRED_OVERRIDES sweep.
// Sole caller is the app.timer reconciler; the only parameter is a server-generated timestamp.
```

In `api/src/cosmos/commission-receivable-repository.ts`, directly above the `async sumDueGroupedByTechnician(` method line:

```ts
  // SEMGREP-JUSTIFIED: cross-partition GROUP BY by design — the platform-wide DUE aggregate.
  // Callers are requireAdmin handlers and the app.timer reconciler; the query takes no parameters.
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
cd api && node_modules/.bin/vitest run tests/cosmos/cross-partition-tenant-filter.test.ts
```

Expected: all PASS. If a Layer-3 assertion still fails, the comment is more than five lines above the declaration — move it immediately adjacent.

- [ ] **Step 5: Commit**

```bash
git add api/tests/cosmos/cross-partition-tenant-filter.test.ts api/src/cosmos/technician-repository.ts api/src/cosmos/commission-receivable-repository.ts
git commit -m "test(api): register the four E21-S02 cross-partition helpers per ADR-0027

Closes the third E21-S02 carry-forward. Layer 2 (caller scope) and Layer 3
(SEMGREP-JUSTIFIED) now cover listTechniciansWithHold,
listAllTechniciansWithHold, listTechniciansWithExpiredOverride and
sumDueGroupedByTechnician. Also asserts the new ranking rule is present."
```

---

### Task 12: Documentation

**Files:**
- Create: `docs/adr/0032-commission-hold-is-an-eligibility-gate.md`
- Create: `docs/stories/E21-S04-dues-gated-dispatch.md`
- Modify: `docs/adr/README.md`, `docs/dispatch-algorithm.md`, `docs/runbook.md`

**Interfaces:** none — documentation only.

- [ ] **Step 1: Write the ADR**

Create `docs/adr/0032-commission-hold-is-an-eligibility-gate.md` following `docs/adr/TEMPLATE.md` and modelled on the depth of `0031-single-partition-commission-ledger.md`. It must cover:

- **Status/Date/Deciders/Extends:** accepted, 2026-09-08, Alok Tiwari + the E21-S04 session, extends ADR-0031 and ADR-0011.
- **Why 0032, not the spec's 0030:** 0030 is taken by `wt-api36`, 0031 by E21-S02; 0025 is a hole left by two files both numbered 0024, and the README rule is to number monotonically. The spec's downstream allocations each shift by one (E23 incentives → 0033, `collectionMethod` vs `paymentMethod` → 0034, PII masking → 0035).
- **The gate-not-ranking rule**, tied to ADR-0011: same principle, different field. Three enforcement layers — structural (`dispatch-eligibility.ts` is the only hold-aware module), Semgrep (`no-commission-hold-in-ranking`), runtime (`dispatch-ranking-invariance.test.ts`).
- **The asymmetric fail directions and why they differ:** dispatch fails open because a legacy document must still be dispatched and a wrong exclusion costs revenue silently; accept fails closed because it is the last checkpoint before work is committed. Include the Cosmos `!=`-on-undefined gotcha explicitly — it is the single most likely way a future edit turns this into a dispatch outage.
- **Why `INDETERMINATE` is distinct from `BLOCKED`** (503 + attempt left PENDING).
- **The enforcement flag and shadow mode**, including the 5-minute config-cache propagation delay.
- **The reconciler:** 15-minute cadence, the unconditional EXPIRED_OVERRIDES sweep, the clock-derived 90-minute FULL sweep and why a module counter fails under Consumption cold starts, the summary document, and the correction of `HOLD_STALE_AFTER_MS` from 6h to 90 min.
- **The `suspended` bug fix** — suspension previously relied on `isOnline: false`.
- **Consequences,** positive and negative. Negatives to name: the SQL predicate makes enforce-mode exclusions invisible except on the zero-candidate path; the summary is up to 15 minutes stale and caps at top-100; a `commissionHold` write that never lands leaves a technician wrongly dispatchable for up to 90 minutes.
- **Alternatives considered:** (a) in-memory filtering instead of an SQL predicate — rejected, does not scale in RU and buys only symmetry; (b) blocking admin reassign — rejected, an owner override must remain possible; (c) a module-level counter for the sweep cadence — rejected, cold starts; (d) failing the accept closed with a 403 on infra errors — rejected, reports phantom debt.
- **RU / p95 measurements** — see Step 2.
- **References:** the spec, ADR-0031, ADR-0011, ADR-0027, `api/.semgrep.yml`, the four source files, `docs/stories/E21-S04-dues-gated-dispatch.md`.

- [ ] **Step 2: Measure and record RU and p95**

The ADR requires real numbers. Run against production (read-only) using the credential recipe in `~/.claude/memory/project_sentry_dsn_empty.md`, or against the local emulator if configured:

```bash
cd api && node --experimental-strip-types scripts/measure-dispatch-ru.ts 2>/dev/null || true
```

If no such script exists, measure inline: issue `getTechniciansWithinRadius` with and without `{ excludeBlockedHolds: true, requireKyc: true }` ten times each against a real Cosmos endpoint, reading `x-ms-request-charge` from `response.headers` and timing each call. Record in the ADR: baseline RU, gated RU, the delta, and p95 latency for both. If production access is unavailable in this session, record the measurement as **"not measured — [reason]"** with an explicit TODO naming who measures it before `holdEnforcementEnabled` is flipped. Do not invent numbers.

- [ ] **Step 3: Add the ADR index entry**

In `docs/adr/README.md`, add to the `## Index` list:

```markdown
- [0032](0032-commission-hold-is-an-eligibility-gate.md) — Commission hold is a dispatch eligibility filter, never a ranking input
```

- [ ] **Step 4: Update `docs/dispatch-algorithm.md`**

Add a `## 4. Eligibility filters` section (or extend the existing §4 if one is present) stating, in the same plain-language register the rest of that public transparency document uses:

- The candidate set is filtered by: service area and radius, skill match, online and available, not suspended, not blocked by the customer, not already attempted for this booking, and — when the operator has enabled it — not currently blocked by an unpaid commission balance.
- The ranked order is **distance, then rating. Nothing else.** Neither decline history (ADR-0011) nor commission hold state (ADR-0032) may influence position within the candidate list. A technician with an unpaid balance is either offered the job in their normal position or not offered it at all; they are never ranked lower.
- Hold enforcement is off by default and is a per-deployment operator setting.

- [ ] **Step 5: Update `docs/runbook.md`**

Add two entries.

**"Technician says he is blocked from accepting jobs"** — the diagnosis and remedy path:
1. Confirm enforcement is actually on: `GET /v1/admin/catalogue/commission-config` → `holdEnforcementEnabled`. If false, the block is not coming from this feature.
2. Read the technician's live position: `GET /v1/admin/finance/commission-receivables/{technicianId}` → `hold.state`, `hold.outstandingPaise`, and the receivable rows.
3. If they have paid: record the remittance (`POST /v1/admin/finance/commission-remittances`). The hold clears on the next recompute, which the remittance itself triggers — no waiting for the timer.
4. If they have not paid but must work now: `POST /v1/admin/finance/commission-hold/{technicianId}/override` with an expiry and a reason. Audited as `COMMISSION_HOLD_OVERRIDDEN`. It lapses automatically; the reconciler's EXPIRED_OVERRIDES sweep re-blocks them within 15 minutes.
5. If the console shows CLEAR but the technician still gets 403: the cached hold and the live sum disagree — the accept gate uses the live sum. Force a repair with `POST /v1/admin/finance/commission-receivables/recompute` and check `unreconciledTechnicianCount` on the dashboard.
6. If the technician sees `HOLD_CHECK_UNAVAILABLE` (503) rather than a 403, this is not a dues problem — the hold could not be read. Check Sentry for `ACCEPT_HOLD_CHECK_FAILED` and Cosmos health. The offer stays live; retrying inside the offer window usually succeeds.

**"Shadow-mode readout before flipping `holdEnforcementEnabled`"**:
1. With the flag off, dispatch logs one `DISPATCH_HOLD_SHADOW_EXCLUSION` line per candidate that enforcement would have excluded, and the accept path logs `ACCEPT_HOLD_SHADOW_BLOCK`.
2. Collect at least seven days. Count distinct `technicianId` values and total lines.
3. Cross-check each distinct technician against the commission dashboard: is the balance real, or an unreconciled cache?
4. Flip only when: every shadow-blocked technician has a genuinely unpaid balance over the threshold; no booking in the window would have gone `UNFULFILLED` for lack of an unblocked candidate; and the technician APK carrying the dues banner (E21-S05) has ≥90% adoption.
5. After flipping, watch `DISPATCH_NO_TECHS ... blockedByHold=` — a non-zero count there means a booking failed *because* of the gate, and is the signal to reconsider the threshold.
6. Rollback is the flag, nothing else. No data migration.

Also add a line to the timers/schedules section: `triggerReconcileCommissionHolds` — every 15 minutes; repairs queued holds, sweeps expired overrides every run, full sweep every 90 minutes, writes `system/hold-reconciliation-summary`.

- [ ] **Step 6: Write the story document**

Create `docs/stories/E21-S04-dues-gated-dispatch.md` covering: what shipped, the flag and its default, the three E21-S02 carry-forwards and where each is discharged, the ADR-number decision, and — most importantly for the next story — the **accept contract E21-S05 consumes**, verbatim:

```
PATCH /v1/technicians/job-offers/{bookingId}/accept

403 { "code": "COMMISSION_HOLD_BLOCKED",
      "outstandingPaise": <int>, "blockThresholdPaise": <int> }
    The technician owes at or above the block threshold and enforcement is on.
    The offer has already been declined server-side and the booking has moved on
    to the next candidate — the client must NOT retry this booking.
    Render JobOfferUiState.BlockedByDues(outstandingPaise) with a wallet CTA.

503 { "code": "HOLD_CHECK_UNAVAILABLE" }
    The hold could not be determined. The offer is STILL PENDING and the
    technician may retry inside the 90-second offer window. Do not show a dues
    message — this is a transient server condition, not a balance.
```

Also record the parked/known limitations: the summary caps at top-100 and is up to 15 minutes stale; enforce-mode exclusions are only counted on the zero-candidate path; `enforceKycInDispatch` is implemented but not part of this rollout.

- [ ] **Step 7: Verify no OpenAPI drift**

```bash
cd api && pnpm run openapi:build && cd .. && git status --porcelain api/openapi.json
```

Expected: `api/openapi.json` unchanged (empty output). The accept route was never registered, so this story adds no contract surface. If it *did* change, another session's registry edit came in with a merge — commit the regenerated file as-is and never hand-merge it.

- [ ] **Step 8: Commit**

```bash
git add docs/adr/0032-commission-hold-is-an-eligibility-gate.md docs/adr/README.md docs/dispatch-algorithm.md docs/runbook.md docs/stories/E21-S04-dues-gated-dispatch.md
git commit -m "docs(e21-s04): ADR-0032, dispatch algorithm section 4, runbook and story

ADR-0032 records the gate-not-ranking rule, the asymmetric fail directions and
the Cosmos !=-on-undefined trap behind them, the enforcement flag and shadow
mode, and the reconciler cadence. Uses 0032 because 0030 is claimed by wt-api36
and 0031 by E21-S02; downstream spec numbers shift by one."
```

---

## Final gate (run after Task 12, before any push)

- [ ] **Step 1: Full smoke gate**

```bash
cd "C:/Alok/Business Projects/wt-e21-s04" && bash tools/pre-codex-smoke-api.sh
```

Must exit 0 — typecheck, ESLint at `--max-warnings 0`, and the whole vitest suite green. A non-zero exit means stop and fix; do not proceed to Codex.

- [ ] **Step 2: Merge `main` before the first push**

The pre-push hook diffs against `@{u}`, and this branch tracks `origin/main`, so unrelated sub-project gates run as main advances. Merge first:

```bash
cd "C:/Alok/Business Projects/wt-e21-s04" && git fetch origin && git merge origin/main
```

If `api/openapi.json` conflicts: take either side, run `cd api && pnpm run openapi:build`, and commit the regenerated file. Never hand-merge it.
If `api/src/openapi/registry.ts` conflicts: keep **both** route registrations.

- [ ] **Step 3: Codex review gate**

Invoke the `codex-review-gate` skill (`codex review --base main`). Use the `disk-full-read-access` sandbox permission — this is a git worktree. If a round fails, fix once and re-run once; do not iterate further. Write `.codex-review-passed` only for a review that actually ran clean, recording the reviewed SHA.

- [ ] **Step 4: Push**

```bash
cd "C:/Alok/Business Projects/wt-e21-s04" && git push -u origin feat/e21-s04-dues-gate
```

Never `--no-verify`.
