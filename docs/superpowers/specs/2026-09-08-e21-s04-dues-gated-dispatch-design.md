# E21-S04 — Dues-gated dispatch (design)

- **Date:** 2026-09-08
- **Tier:** Foundation (dispatch + money + concurrency)
- **Sub-project:** `api/` only. `admin-web/`, `customer-app/`, `technician-app/` untouched.
- **Branch / worktree:** `feat/e21-s04-dues-gate` in `C:/Alok/Business Projects/wt-e21-s04`, cut from `origin/main` @ `7e3fdef4`.
- **Binding spec:** `~/.claude/plans/validated-frolicking-mochi.md` §3 (invariants), §6 (E21-S04 table), §7.3.
- **Builds on:** `docs/stories/E21-S02-interface-notes.md`, `docs/adr/0031-single-partition-commission-ledger.md`.
- **Ships dark — the gating only.** No technician is excluded from dispatch and no accept is refused until `holdEnforcementEnabled` is flipped on the `commission-config` doc. That flag defaults `false` (`toEffectiveConfig`).
- **Correction (Codex round 2).** This line originally read "Nothing observable changes for any technician or customer" — that was wrong. Two things go live on merge with the flag still off: the 15-minute reconciler (not flag-gated; it moves hold states and the admin dashboard's figures) and an awaited Cosmos round-trip on every job accept (`assertCanAccept` calls `computeCommissionHold` unconditionally to produce the accept-side shadow log). See ADR-0032, "This story does not, however, ship entirely dark".

---

## 1. What this story is

E21-S01/S02 built the commission ledger and the per-technician `commissionHold` cache
(`CLEAR | WARN | BLOCKED`). Nothing consumes it. This story makes unpaid commission actually
gate work, in two places, both behind one flag:

1. **Dispatch** — a `BLOCKED` technician is not offered new jobs.
2. **Accept** — a `BLOCKED` technician who somehow receives an offer cannot accept it.

Plus the operational machinery that keeps the hold honest: a 15-minute reconciler, a
pre-computed dashboard summary, a Semgrep rule, and an ADR.

### Non-goals

- Any client-visible UI. The technician-facing banner and wallet are E21-S05.
- Changing the ledger, allocator, or any money-mutating path. This story reads the ledger; it
  never writes a money document.
- Flipping the flag. Rollout is REL-1/REL-2, after a week of shadow-mode readout.

---

## 2. Architecture invariants this story is bound by

| # | Invariant | How this story honours it |
|---|---|---|
| I1 | **Karnataka rule.** Hold state is an eligibility filter, never a ranking input. | All hold-awareness lives in `dispatch-eligibility.ts`. `rankTechnicians(techs, lat, lng)` keeps its signature and never receives hold data. Enforced by Semgrep `no-commission-hold-in-ranking` plus a ranking-invariance test. |
| I2 | **Dispatch predicates fail OPEN on absent fields.** A legacy technician document — no `commissionHold`, no `suspended`, no `kycStatus` — must still be dispatched. | Every new SQL predicate is written `(NOT IS_DEFINED(<path>) OR <path> != <bad>)`. Cosmos `!=` against an undefined path evaluates to undefined and silently drops the row; the `NOT IS_DEFINED` disjunct is the fail-open and is not optional. |
| I3 | **The accept gate fails CLOSED.** | Enforcement on plus hold determinable plus `BLOCKED` → refuse. Enforcement on plus hold **indeterminate** → refuse (503), see §5.3. Enforcement off → always allow. |
| I4 | **A blocked accept must not stall the booking.** Attempts are single-technician; leaving the attempt `PENDING` stalls the booking until the 30-second expiry timer. | The blocked path calls `declineAttempt` **and** `continueDispatchAfterOfferOutcome(bookingId, attempt.technicianIds)`. |
| I5 | **Read-path schemas only widen** (the #320 lesson). | The only schema change is `suspended?: boolean` added as `.optional()` to `TechnicianProfileSchema`. No write-body schema is tightened. |
| I6 | **Zero new Cosmos containers.** | The reconciliation summary is one more document in the existing `system` container, alongside `hold-repair`, `technician-client-config`, `incentive-config`. |
| I7 | **No money is written.** | This story calls `computeCommissionHold` (read-only) and `recomputeCommissionHold` / `sweepAllHolds` (which patch the `commissionHold` cache only, never the ledger). |

---

## 3. ADR number

**`docs/adr/0032-commission-hold-is-an-eligibility-gate.md`.**

The spec allocated 0030 to this decision. `0030` is taken by `wt-api36`
(`0030-compilesdk-36-on-agp-8-6-suppression.md`) and `0031` by E21-S02. `0025` is a genuine
hole in the sequence — two files are numbered `0024` (`0024-rating-shield-threshold.md` and
`0024-sos-audio-e2e-encryption.md`) — but `docs/adr/README.md` says *"number monotonically"*,
and backfilling a hole created by a collision reproduces exactly the ambiguity that caused it.

So: **0032**, and the spec's downstream allocations each shift by one (E23 incentives → 0033,
`collectionMethod` vs `paymentMethod` → 0034, PII masking → 0035). Noted in the ADR itself so
the next story does not re-derive it.

---

## 4. Components

```
                 +------------------------------------------+
   dispatch ---->| dispatch-eligibility.ts   (NEW)           |
                 |  loadDispatchGates()  -> predicate opts   |
                 |  logShadowExclusions() -> shadow readout  |
                 +---------------+--------------------------+
                                 | opts { excludeBlockedHolds, requireKyc }
                                 v
                 +------------------------------------------+
                 | technician-repository.ts                  |
                 |  getTechniciansWithinRadius(..., opts?)   |
                 |   + suspended predicate      (ALWAYS)     |
                 |   + hold predicate           (flagged)    |
                 |   + kyc predicate            (flagged)    |
                 |  countBlockedInRadius(...)   (NEW)        |
                 |  readTechnicianGateState(id) (NEW)        |
                 +------------------------------------------+

   accept   ---->+------------------------------------------+
                 | commission-hold.service.ts                |
                 |  assertCanAccept(technicianId)  (NEW)     |
                 |   -> ALLOW | BLOCKED | INDETERMINATE      |
                 +------------------------------------------+

   timer    ---->+------------------------------------------+
                 | trigger-reconcile-commission-holds.ts(NEW)|
                 |  1. drainHoldRepair  -> recompute         |
                 |  2. sweepAllHolds EXPIRED_OVERRIDES   *   |
                 |  3. sweepAllHolds FULL (clock-gated)      |
                 |  4. write system/hold-reconciliation-     |
                 |     summary (top-N ordered)           *   |
                 +---------------+--------------------------+
                                 | reads
                                 v
                 +------------------------------------------+
                 | admin/finance/commission-receivables.ts   |
                 |  dashboard reads the summary,             |
                 |  falls back to the live drain         *   |
                 +------------------------------------------+

   * = a carry-forward owed by E21-S02
```

Each unit has one job and is testable without the others: `dispatch-eligibility` is a pure
config-to-options mapping plus a logger; the repository predicates are SQL; `assertCanAccept` is
a three-way decision over `computeCommissionHold`; the timer is an ordered sequence of calls
whose ordering is the thing under test.

---

## 5. Detailed design

### 5.1 Dispatch predicates — `getTechniciansWithinRadius`

Signature gains an optional fifth parameter; every existing caller keeps working unchanged.

```ts
export interface DispatchPredicateOptions {
  /** Exclude technicians whose commissionHold.state is BLOCKED. Off = dark launch. */
  excludeBlockedHolds?: boolean;
  /** Require kycStatus APPROVED. Off = today's behaviour (no KYC predicate at all). */
  requireKyc?: boolean;
}

export async function getTechniciansWithinRadius(
  lat: number, lng: number, radiusKm: number, serviceId: string,
  opts: DispatchPredicateOptions = {},
): Promise<TechnicianProfile[]>
```

The composed query:

```sql
SELECT * FROM c
WHERE ST_WITHIN(c.location, @polygon)
  AND ARRAY_CONTAINS(c.skills, @serviceId)
  AND c.isOnline = true
  AND c.isAvailable = true
  AND (NOT IS_DEFINED(c.suspended) OR c.suspended != true)              -- ALWAYS (bug fix)
  [ AND (NOT IS_DEFINED(c.commissionHold.state)
         OR c.commissionHold.state != 'BLOCKED') ]                      -- excludeBlockedHolds
  [ AND (NOT IS_DEFINED(c.kycStatus) OR c.kycStatus = 'APPROVED') ]     -- requireKyc
```

**The suspended predicate is a bug fix and is unconditional.** `patchTechnicianAdminFields`
sets `suspended: true` and `isOnline: false` together, so a suspended technician is currently
excluded only as a side effect of being offline — any path that flips `isOnline` back on
(the technician's own availability toggle) silently re-admits them to dispatch. Two other
queries in the codebase already carry this predicate (`admin/dashboard/summary.ts`,
`admin/dashboard/tech-locations.ts`); the dispatcher is the one that matters and the one that
lacked it. Written with the `NOT IS_DEFINED` disjunct like the others so that no existing
technician document — none of which has the field — is dropped.

**`requireKyc` adds a predicate that does not exist today.** The dispatcher currently ignores
`kycStatus` entirely. `enforceKycInDispatch` defaults `false`, so behaviour is unchanged;
turning it on is a separate owner decision, not part of this rollout.

### 5.2 Eligibility module and shadow mode — `dispatch-eligibility.ts` (new)

```ts
export interface DispatchGates {
  holdEnforcementEnabled: boolean;
  enforceKycInDispatch: boolean;
}

/** Never throws. A config-read failure resolves to both gates off (fail-open, I2). */
export async function loadDispatchGates(): Promise<DispatchGates>;

/** Logs what enforcement WOULD have excluded, when it is off. */
export function logShadowExclusions(bookingId: string, candidates: TechnicianProfile[]): void;
```

`loadDispatchGates` wraps `getCommissionConfig()` (5-minute in-process cache, so this costs
nothing on the dispatch hot path) in try/catch and returns `{ false, false }` on any error.
A flag flip therefore takes up to five minutes to propagate — acceptable and intended for a
staged rollout.

**Shadow mode (enforcement off).** The query runs without the hold predicate and `SELECT *`
already returns `commissionHold`, so the would-be exclusions are computed in memory and logged:

```
DISPATCH_HOLD_SHADOW_EXCLUSION bookingId=<id> technicianId=<id> state=BLOCKED outstandingPaise=<n> evaluatedAt=<iso>
```

One line per would-be-excluded candidate, so a week of logs answers "who would this have
stopped, and how often" before anyone flips the flag. This is the readout the runbook
documents.

**Enforce mode blind spot, and its fix.** When the predicate is in the SQL, the excluded rows
never come back, so a booking that ends `UNFULFILLED` because every nearby technician is
blocked is indistinguishable in the logs from one with genuinely no coverage — a nasty
on-call trap. Fix: **only on the zero-candidate path**, and only when enforcement is on, issue
one `SELECT VALUE COUNT(1)` with the same geo/skill predicates but inverted hold state:

```ts
countBlockedInRadius(lat, lng, radiusKm, serviceId): Promise<number>
```

and log `DISPATCH_NO_TECHS bookingId=<id> blockedByHold=<n>`. Zero extra cost on the happy
path; on the failure path it converts a mystery into a diagnosis.

### 5.3 Accept gate — `assertCanAccept`

Added to `commission-hold.service.ts`, next to the code that owns hold semantics.

```ts
export type AcceptGateResult =
  | { decision: 'ALLOW' }
  | { decision: 'BLOCKED'; outstandingPaise: number; blockThresholdPaise: number }
  | { decision: 'INDETERMINATE'; reason: string };

export async function assertCanAccept(technicianId: string): Promise<AcceptGateResult>;
```

Implementation reuses `computeCommissionHold(technicianId)` — which already performs the live
single-partition `getOutstandingByTechnician` sum, reads the config, reads the current hold for
its override, and evaluates state with a single consistent `now`. That is exactly the
"live single-partition SUM vs block threshold, override honoured" the spec asks for, and reusing
it means the gate and the reconciler can never disagree about what `BLOCKED` means.

| Enforcement | Hold | Result |
|---|---|---|
| off | any | `ALLOW`. If the shadow evaluation says `BLOCKED`, log `ACCEPT_HOLD_SHADOW_BLOCK`. Errors are swallowed. |
| on | `BLOCKED` | `BLOCKED` with `outstandingPaise` plus `blockThresholdPaise` |
| on | `CLEAR` / `WARN` | `ALLOW` |
| on | technician doc missing, or Cosmos throws | `INDETERMINATE` |

**Why `INDETERMINATE` is a separate outcome (decision, flagged at design review).** Fail-closed
means the accept must not succeed. It does not follow that it should be reported as debt or
that the offer should be destroyed. Returning `403 COMMISSION_HOLD_BLOCKED` on a Cosmos hiccup
would tell a solvent technician they owe money, and declining the attempt would permanently
remove them from a booking they were entitled to. So `INDETERMINATE` maps to
`503 { code: 'HOLD_CHECK_UNAVAILABLE' }` and **leaves the attempt `PENDING`** — the technician's
client can retry inside the 90-second offer window, and if they do not, the existing 30-second
`expireStaleOffers` timer expires the attempt and continues dispatch on its own. Fail-closed on
the accept, fail-open on the technician's standing.

### 5.4 Accept handler wiring — `job-offers.ts`

The gate sits **after** the ownership/expiry checks and **before** `acceptAttempt`, so a blocked
technician never transiently marks the attempt `ACCEPTED`.

```
verify token -> attempt lookup -> 404 / 410 / 403 FORBIDDEN   (unchanged)
  |
  v
assertCanAccept(technicianId)
  |- INDETERMINATE -> 503 HOLD_CHECK_UNAVAILABLE, attempt stays PENDING, no audit
  |- BLOCKED       -> declineAttempt(attempt.id, bookingId)
  |                   continueDispatchAfterOfferOutcome(bookingId, attempt.technicianIds)  (I4)
  |                   bookingEventRepo.append({ event: 'TECH_ACCEPT_BLOCKED_BY_HOLD', ... })
  |                   systemAudit('JOB_ACCEPT_BLOCKED_BY_HOLD', 'booking', bookingId, {...})
  |                   -> 403 { code:'COMMISSION_HOLD_BLOCKED', outstandingPaise, blockThresholdPaise }
  \- ALLOW         -> acceptAttempt -> ASSIGNED ...            (unchanged)
```

`continueDispatchAfterOfferOutcome` is called with `attempt.technicianIds` so the blocked
technician is added to the exclusion set and the booking walks to the next-nearest candidate
immediately, rather than sitting `SEARCHING` for 30 seconds. The 403 body carries the two
numbers E21-S05's `JobOfferUiState.BlockedByDues` needs.

`BookingEventDoc.event` is a free-form `z.string()`, so `TECH_ACCEPT_BLOCKED_BY_HOLD` needs no
schema change. `JOB_ACCEPT_BLOCKED_BY_HOLD` is added to the `AuditAction` union in
`api/src/types/admin.ts` — the closed enum lives on the write helper only, per §3.8 of the
spec — and written through the existing `systemAudit(...)` helper.

### 5.5 Admin reassign — sanctioned override

`reassignOrderHandler` (`admin/orders/overrides.ts`) does **not** gain a block. An owner
reassigning a job to a technician who owes money is a deliberate act; the requirement is that
it is recorded, not prevented. A new point read

```ts
readTechnicianGateState(technicianId): Promise<{ exists: boolean; hold: CommissionHold | null; suspended: boolean }>
```

feeds the audit payload: `{ technicianId, reason, targetHoldState, targetOutstandingPaise,
targetSuspended }`. Single-partition point read, best-effort — a failure logs and writes the
audit entry without the enrichment rather than failing the reassign.

`getTechnicianCandidatesForBooking` (the admin "who can I reassign to" list) keeps calling
`getTechniciansWithinRadius` with no options, so the admin still sees blocked technicians as
candidates. Hiding them would make the sanctioned override impossible to exercise. It does
inherit the unconditional `suspended` predicate, which is correct — a suspended technician
should not be offered as a reassignment target.

### 5.6 Reconciler — `trigger-reconcile-commission-holds.ts` (new)

Schedule `0 */15 * * * *`. Modelled on `trigger-reconcile-payouts.ts`: `import '../bootstrap.js'`
first, Sentry capture, and the outer handler rethrows so a failure is loud rather than a silent
no-op.

Every run, in this order:

1. **Repair queue.** `systemDocsRepo.drainHoldRepair()`. If `all` → `sweepAllHolds({ scope: 'FULL' })`.
   Otherwise `recomputeCommissionHold(id)` for each drained id. A per-id failure is captured to
   Sentry and the id is re-enqueued via `enqueueHoldRepair([id])`, so a transient error does not
   lose the repair.
2. **`sweepAllHolds({ scope: 'EXPIRED_OVERRIDES' })` — every run, unconditionally.**
   *(Carry-forward #1, E21-S02 Task 6 / Ruling C.)* A lapsed admin override otherwise sits inert
   until something unrelated touches that technician's receivables, leaving a technician who
   should be `BLOCKED` reading `CLEAR`. This is the one step that must never be skipped, and it
   gets its own test asserting it is called on every invocation including runs where the repair
   queue was empty.
3. **Full sweep, clock-gated.** `sweepAllHolds({ scope: 'FULL' })` when
   `Math.floor(Date.now() / 900_000) % 6 === 0` — every 6th 15-minute slot, i.e. every 90
   minutes. Derived from the clock, not a module-level counter, because Azure Functions
   Consumption cold-starts constantly and a counter would reset to zero on every cold start
   (full sweep on nearly every run) or drift arbitrarily. The same code path is the rollout
   backfill.
4. **Summary document.** *(Carry-forward #2.)* See §5.7.

Sentry breadcrumb per drift, sourced from the `log` callback `sweepAllHolds` already accepts.

**Cadence conflict, resolved (decision, flagged at design review).** The spec says
"every 6th run" (90 minutes). E21-S02's dashboard hardcodes `HOLD_STALE_AFTER_MS = 6h` with a
comment asserting the sweep is 6-hourly. Both cannot be true. The spec is binding, so the sweep
is 90 minutes, and `HOLD_STALE_AFTER_MS` is corrected to 90 minutes so the `staleAfter`
timestamp the admin console renders is not a fiction. At pilot scale (tens of technicians) the
extra sweeps are negligible RU.

### 5.7 `system/hold-reconciliation-summary` and the dashboard

*(Carry-forward #2 — a parked Codex P2 from E21-S02 Task 10: the admin dashboard drains every
hold document plus a cross-partition GROUP BY on every request.)*

Document (in the existing `system` container, id = partition key, like its siblings):

```ts
export interface HoldReconciliationSummaryDoc {
  id: 'hold-reconciliation-summary';
  computedAt: string;                 // ISO
  totalTechnicianCount: number;       // full roster carrying a hold
  totalOutstandingPaise: number;      // dashboard-wide, page-independent
  unreconciledTechnicianCount: number;
  topN: number;                       // = TOP_N (100)
  top: Array<{                        // sorted outstandingPaise DESC — the ordering IS the payload
    technicianId: string;
    technicianName?: string;
    outstandingPaise: number;
    dueCount: number;
    oldestDueAt?: string;
    state: HoldState;
    evaluatedAt: string;
    override?: { until: string; byAdminId: string; reason: string };
  }>;
}
```

`TOP_N = 100` = two dashboard pages at `DASHBOARD_PAGE_SIZE = 50`.

**Written every run, not only on full-sweep runs.** It needs `listAllTechniciansWithHold()` plus
`sumDueGroupedByTechnician()` — the same two drains the dashboard performs per request. Doing
them 96 times a day on a fixed schedule is strictly cheaper and far more predictable than
doing them once per admin page view, and it keeps the summary at most 15 minutes stale instead
of 90.

The three aggregates (`totalOutstandingPaise`, `unreconciledTechnicianCount`, the sorted list)
are computed by a **pure function extracted from the existing dashboard handler**, so the
summary and the fallback path cannot drift apart:

```ts
// commission-dashboard.service.ts (new, extracted verbatim from commission-receivables.ts)
export function buildHoldRoster(
  allWithHold: Array<{ id: string; name?: string; commissionHold: CommissionHold }>,
  dueGroups: Array<{ technicianId: string; outstandingPaise: number }>,
): { rows: HoldRosterRow[]; totalOutstanding: number; unreconciledTechnicianCount: number };
```

**Dashboard read path.** `adminCommissionReceivablesDashboardHandler` tries the summary first
and falls back to the live drain when any of these hold:

- the document does not exist (first deploy, before the timer's first run)
- `computedAt` is older than `SUMMARY_MAX_AGE_MS = 45 min` (3x cadence — tolerates two missed runs)
- the requested page offset plus page size exceeds `topN`

**The JSON response shape does not change by one byte.** E21-S03 is being built against this
endpoint in a parallel worktree; only the data source moves. Same fields, same ordering
(`outstandingPaise` desc), same `staleAfter` derivation, same `continuationToken` encoding, same
`relevant` filter (`outstandingPaise > 0 || state !== 'CLEAR'`). A test asserts the summary path
and the fallback path produce identical output for the same underlying data.

Technician display names: the summary stores `technicianName` straight from the same
`listAllTechniciansWithHold()` drain used to build the rest of the summary (it already projects
`c.displayName, c.name` and collapses them to `name`). The write path deliberately does **not**
also call `getTechniciansByIds` as a backfill — that lookup reads the same two fields from the
same container, so it could never resolve a name the roster row already lacks; it would only
cost a cross-partition `ARRAY_CONTAINS` query over up to 100 ids on every 15-minute run for
nothing. Consequently a row can still be written to the summary with no `technicianName`, and
the read path (`commission-receivables.ts`) keeps its own `getTechniciansByIds` lookup for
exactly those name-less rows.

### 5.8 Karnataka enforcement — Semgrep plus invariance test

**Structural.** Hold data enters `dispatcher.service.ts` only as a boolean pair of predicate
options and a shadow-log call. `rankTechnicians` keeps `(techs, lat, lng)` and is not given the
config or the gates.

**Semgrep, `api/.semgrep.yml`, new rule `no-commission-hold-in-ranking`,
`severity: ERROR`, paths scoped to `api/src/services/dispatcher.service.ts`,
`api/src/services/dispatch-eligibility.ts`, `api/src/cosmos/technician-repository.ts`:**
flags `commissionHold`, `outstandingPaise`, `dueCount`, `holdState`, and their bracket-index
forms appearing inside a `.sort(...)` comparator or inside the body of `rankTechnicians`.
Modelled on the existing `karnataka-no-decline-in-dispatcher` rule directly above it, and
cross-referenced from it, because the two encode the same principle for different fields.
Note `semgrep-action@v1` treats every finding as blocking regardless of declared severity
(see the comment in `cross-partition-tenant-filter.test.ts`) — which is the desired behaviour
here.

**Runtime.** `tests/unit/dispatch-ranking-invariance.test.ts`: build a candidate set, capture
`rankTechnicians(...)` output, then re-run with `commissionHold` mutated across the set —
every state, wildly different `outstandingPaise`, some absent entirely — and assert the output
order is byte-identical. Distance and rating are the only inputs that may move a technician.

**Rule presence.** `cross-partition-tenant-filter.test.ts` already asserts Semgrep rule ids
exist so a botched merge cannot drop them; `no-commission-hold-in-ranking` gets the same
treatment.

### 5.9 Cross-partition helper registration

*(Carry-forward #3 — ADR-0027.)* E21-S02 added four cross-partition helpers and registered none
of them:

| Helper | File |
|---|---|
| `listTechniciansWithHold` | `cosmos/technician-repository.ts` |
| `listAllTechniciansWithHold` | `cosmos/technician-repository.ts` |
| `listTechniciansWithExpiredOverride` | `cosmos/technician-repository.ts` |
| `commissionReceivableRepo.sumDueGroupedByTechnician` | `cosmos/commission-receivable-repository.ts` |

Two changes in `tests/cosmos/cross-partition-tenant-filter.test.ts`:

- **Layer 2** (`CROSS_PARTITION_IMPORT_TOKENS`): add all four. The `sumDueGroupedByTechnician`
  entry matches the call-site form `commissionReceivableRepo.sumDueGroupedByTechnician`, the
  same way the existing `ratingRepo.getAllByTechnicianId` entry does. Both current callers
  already satisfy the invariant — `admin/finance/commission-receivables.ts` via `requireAdmin`,
  the new timer via `app.timer` — so this registers an invariant that already holds and locks
  it in.
- **Layer 3** (`FILES_AND_HELPERS`): add `technician-repository.ts` (three helpers) and
  `commission-receivable-repository.ts` (one), then write the `// SEMGREP-JUSTIFIED:` comments
  above each declaration that Layer 3 asserts are present. Layer 3's declaration regex
  `(export\s+)?async\s+(function\s+)?NAME\s*\(` matches both the three exported functions and
  the object-literal method.

### 5.10 Schema and contract surface

- `TechnicianProfileSchema` gains `suspended: z.boolean().optional()` — read-path widening only.
- `AuditAction` gains `JOB_ACCEPT_BLOCKED_BY_HOLD`.
- **No OpenAPI change.** `PATCH /v1/technicians/job-offers/{bookingId}/accept` was never in
  `src/openapi/registry.ts`, so neither `registry.ts` nor `api/openapi.json` is touched, and
  this story cannot collide with the parallel session on either shared file. `pnpm run
  openapi:build` is still run to prove no drift; the regenerated file is committed only if it
  differs.
- The 403/503 accept contract is recorded in `docs/stories/E21-S04-dues-gated-dispatch.md` for
  E21-S05, whose Android DTOs are hand-written.

---

## 6. Error handling summary

| Failure | Direction | Behaviour |
|---|---|---|
| `getCommissionConfig()` throws during dispatch | open | both gates off, dispatch proceeds unfiltered |
| Technician doc has no `commissionHold` | open | dispatched (`NOT IS_DEFINED` disjunct) |
| Technician doc has no `suspended` / `kycStatus` | open | dispatched |
| `countBlockedInRadius` throws | open | logged, zero-candidate log omits the count; dispatch outcome unchanged |
| `assertCanAccept` throws, enforcement **off** | open | `ALLOW`, logged |
| `assertCanAccept` throws, enforcement **on** | closed | `503 HOLD_CHECK_UNAVAILABLE`, attempt stays `PENDING` |
| Technician doc missing at accept, enforcement on | closed | as above |
| `declineAttempt` returns null (already terminal) | — | still call `continueDispatchAfterOfferOutcome`; still return 403 |
| `continueDispatchAfterOfferOutcome` throws | — | captured to Sentry; the 403 is still returned (the expiry timer is the backstop) |
| Audit write fails | — | swallowed inside `auditLog` (existing behaviour) |
| Reconciler step throws | — | Sentry, rethrow from the outer handler; per-id repair failures re-enqueue |
| Summary write fails | — | Sentry, non-fatal; dashboard falls back to the live drain |
| Summary missing / stale / offset beyond topN | — | dashboard falls back to the live drain |

---

## 7. Test plan

Unit tests colocated per the existing convention (`api/tests/unit/`, `api/tests/cosmos/`).
Test file committed before the implementation file in every task.

**Dispatch predicates**
1. enforcement off → hold predicate absent from the SQL; a `BLOCKED` technician is returned
2. enforcement on → hold predicate present; the `BLOCKED` technician is not returned
3. legacy doc (no `commissionHold`, no `suspended`, no `kycStatus`) is dispatched with both flags on
4. `suspended: true` is excluded with both flags off (the unconditional bug fix)
5. `enforceKycInDispatch` on → `PENDING` kyc excluded, absent `kycStatus` still dispatched
6. config read throws → both gates off, dispatch unfiltered
7. shadow mode logs one line per would-be exclusion, and none when enforcement is on
8. zero-candidate path with enforcement on issues `countBlockedInRadius` and logs the count

**Ranking (Karnataka)**
9. ranking invariance under arbitrary hold mutation
10. `no-commission-hold-in-ranking` present in `.semgrep.yml` with `severity: ERROR`

**Accept gate**
11. `BLOCKED` → 403 with `outstandingPaise` plus `blockThresholdPaise`
12. `BLOCKED` → `declineAttempt` called **and** `continueDispatchAfterOfferOutcome` called with `attempt.technicianIds`
13. `BLOCKED` → audit `JOB_ACCEPT_BLOCKED_BY_HOLD` plus booking event written
14. active override → accepts normally despite outstanding over the threshold
15. expired override → blocked
16. enforcement off plus outstanding over threshold → accepts, shadow line logged
17. Cosmos throws plus enforcement on → 503, `acceptAttempt` **not** called, `declineAttempt` **not** called
18. gate runs before `acceptAttempt` (a blocked accept never transiently marks the attempt `ACCEPTED`)

**Reconciler**
19. `sweepAllHolds({scope:'EXPIRED_OVERRIDES'})` called on every run, including an empty-queue run
20. repair queue drained; `all` → FULL sweep; ids → per-id recompute
21. per-id failure re-enqueues that id and does not abort the run
22. full sweep runs on a slot where `floor(now/900000) % 6 === 0` and not otherwise
23. summary document written every run with `top` sorted `outstandingPaise` desc and capped at `topN`
24. summary write failure does not fail the run
25. drift is reported to Sentry as a breadcrumb

**Dashboard**
26. summary present and fresh → served from the summary; no drain performed
27. summary missing → live drain, identical response
28. summary older than 45 min → live drain
29. offset beyond `topN` → live drain
30. summary path and fallback path produce byte-identical JSON for the same data
31. `HOLD_STALE_AFTER_MS` reflects the 90-minute sweep cadence

**Reassign**
32. audit payload carries `targetHoldState`, `targetOutstandingPaise`, `targetSuspended`
33. a blocked technician can still be reassigned to (no gate)
34. gate-state read failure still writes the audit entry and completes the reassign

**Registration**
35. all four cross-partition helpers registered in Layer 2 and Layer 3, with `SEMGREP-JUSTIFIED`
    comments present (the existing test file's own assertions cover this once the tables are extended)

---

## 8. Documentation deliverables

- `docs/adr/0032-commission-hold-is-an-eligibility-gate.md` — the gate-not-ranking rule, the
  fail-open/fail-closed split and why they differ, the enforcement flag and shadow mode, the
  reconciler cadence, the summary document, the ADR-number shift. RU/p95 measured and recorded.
- `docs/adr/README.md` — index entry.
- `docs/dispatch-algorithm.md` §4 — the eligibility filter, stated as a filter and explicitly
  not a ranking input (this file is the public transparency doc referenced by ADR-0011).
- `docs/runbook.md` — "technician says he is blocked" (diagnose → override → clear), and the
  shadow-mode readout procedure (which log lines, over what window, what threshold justifies
  flipping the flag).
- `docs/stories/E21-S04-dues-gated-dispatch.md` — the story record plus the 403/503 accept
  contract E21-S05 consumes.

---

## 9. Out of scope

- Flipping `holdEnforcementEnabled` or `enforceKycInDispatch`.
- Any `admin-web/`, `customer-app/`, or `technician-app/` change.
- Re-architecting the cross-partition drains for multi-city scale (ADR-0031 records this as a
  known pilot-scale limitation; the summary document reduces but does not remove it).
- The `MAX_ALLOCATION_ROWS = 98` ceiling (ADR-0031).
- The dispatch radius coverage gap (accepted pilot limitation, 2026-08-13).
