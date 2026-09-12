# E23-S01 — Weekly incentive engine: interface notes and rulings

Extracted from the E23-S01 SDD decision ledger
(`.superpowers/sdd/e23-s01-incentive-engine/progress.md`, git-ignored) so the contracts and
decisions survive the worktree. Written for **E23-S02** (admin incentive settings UI + technician
milestone card, the paired client story), and for any future `api/` story generally — one finding
here is project-wide, not story-specific.

Source of truth for the design: `docs/adr/0035-incentives-are-credit-only-and-capped.md`,
`docs/stories/E23-S01-incentive-engine.md`, and `docs/runbook.md` → "Incentives (E23-S01)". This
file records the interface surface and the decisions that live nowhere else.

Inclusion test applied: *would a future story be wrong without this?* — not *was this hard-won?*

---

## Project-wide, not story-specific: per-task `tsc` checks in `api/` must use `tsconfig.tests.json`

`api/tsconfig.json`'s `include` is `["src/**/*"]` only — it **never** type-checks anything under
`tests/`. `api/tsconfig.tests.json` (`extends: tsconfig.json`, `include: ["src/**/*",
"tests/**/*"]`) is the actually-authoritative scope: `tools/pre-codex-smoke-api.sh` has always used
it, and so does CI. This was never a gate defect — the gate was correct throughout.

What was wrong: every implementer/reviewer instruction in this story's 21-task build said "run a
full repo typecheck, confirm 0 errors" using `npx tsc --noEmit -p .`, which resolves the **weaker**
config. Twenty tasks' worth of "0 errors" confirmations meant less than they appeared to — a real,
invented-shape type error sat in a Task 18 test fixture undetected until the smoke gate's first
run, at the very last task.

**Rule for any future `api/` story's task dispatches: the per-task typecheck instruction must say
`npx tsc --noEmit -p tsconfig.tests.json`, never bare `-p .`.** A per-task check weaker than the
gate it anticipates gives false confidence for the whole run.

## The award document — where it lives, and how to read `commissionBps`-adjacent fields safely

One document per `(technicianId, weekKey)`, id `inc:${technicianId}:${weekKey}`, `docType:
'INCENTIVE_AWARD'`, in the **existing** `commission_receivables` container (partition
`/technicianId`) — not a new container. If a future story needs its own new financial document
type, this is the pattern: add a `docType` branch to the same container, not a new one (invariants
#1 and #10 — see ADR-0035 "Alternatives considered" for why a separate `technician_incentives`
container was explicitly rejected).

**`appliedPaise` must be summed against TWO `refId` values, not one, if you ever read award
allocations directly.** Spec §5.5 says "allocations with `refId = awardId`" — that undercounts. An
unapplied remainder becomes a `CREDIT` document (`cr:${awardId}`, via `creditDocId`), and
`consumePendingCredits` later stamps ITS allocations with `refId = cr:${awardId}`, not the award's
own id. `reconcileAwardApplied` (`api/src/services/incentive.service.ts`) sums both;
`api/src/schemas/incentive.ts`'s `awardShape` is the shape to parse against, and it's `.strict()`
on the write side (nested too — `milestoneSnapshot`/`reachedMilestone` included) but not on the
read side (Cosmos system fields).

**A replay must reconcile too, not just a fresh award.** `applyAward`'s `REPLAYED` branch calls
`reconcileAwardApplied` before returning (fixed in a Codex round during this story — the original
code returned before reaching it). If you build another allocator-anchor consumer on this pattern,
copy this, not the pre-fix version: a manual rerun is exactly the moment a stale `appliedPaise`
needs repairing, and skipping reconciliation on the replay path silently leaves it wrong.

## Config reads — which function to call, and why it matters

**`systemDocsRepo.getEffectiveIncentiveConfig()`**, not the raw `getIncentiveConfig()`, for any
new consumer of the incentive config doc. The raw reader returns whatever is actually stored — if
an admin has only ever set one field (e.g. `PUT {"enabled":true}` before ever touching
milestones/capFractionBps), the raw doc is missing required fields. `getEffectiveIncentiveConfig()`
applies the same per-field defaults used everywhere else in this feature and **never** returns a
partial shape. A Codex round in this story caught the existing `GET /v1/config/technician` endpoint
(pre-dating E23-S01) using the raw reader and 502ing every technician the moment any partial write
landed — fixed by switching that one caller, but the raw `getIncentiveConfig()` still exists (with
its own pre-existing test suite) for whatever originally-scoped purpose it had; do not reach for it
in new code.

## The anti-gaming cap — a real, documented, admin-tunable gap, not a solved problem

`capFractionBps` (default `6000` = 60%) does **not** close the strongest margin-gaming case at its
shipped setting: a technician doing 7 real ₹1,000 jobs and padding the count to a 10-job milestone
with 3 cheap ₹249 jobs nets **+13,566 paise of real profit**, because 60% of the resulting
₹1,704.34 counted commission is far above the milestone's ₹300 gross bonus. **The same is true of
the pure all-fake variant at the shipped default** (10×₹249 jobs generate 54,780 paise commission;
60% of that is 32,868, still above the 30,000-paise bonus) — an earlier draft of the ADR
misattributed a capped outcome for that case to the wrong `capFractionBps` value; the corrected ADR
states neither variant is capped at 6000 bps. **1500 bps (15%) closes both, with no false positive
on ten genuine jobs** (Task 5's `PROOF` tests price both numbers by hand). This is one admin config
value, no deploy.

**If E23-S02 builds an admin UI for this setting, it must not imply the shipped default is
gaming-proof.** Surface the residual, or at minimum link to ADR-0035's Consequence 1, rather than
presenting "cap: 60%" as a solved anti-gaming control.

## The credit-only guarantee — three layers, one documented residual

`.strict()` write schema (throws on any payout-shaped field, top-level or nested) + a static
Vitest test (`api/tests/static/incentives-credit-only.test.ts`) + two Semgrep rules
(`incentives-credit-only`, `incentives-not-in-payout-path` in `api/.semgrep.yml`). **The Semgrep
layer does not catch a bare generic-wrapped type reference** (`Promise<IncentiveAwardDoc>`,
`IncentiveAwardDoc[]`, `IncentiveAwardDoc | null`) — verified against real Semgrep (Docker,
`semgrep/semgrep:1.159.0`; the native CLI is blocked by this environment's Application Control
policy) that this shape parses without error but matches nothing. Mitigated, not closed: the
`.strict()` schema layer still throws at parse time regardless of what any static tool catches in
source. If a future story extends this static gate, this is the known gap to either close or
re-document, not silently inherit.

## The owner P&L — bucketed by UTC day, not IST, and that is deliberate

`getDailyPnL`'s pre-existing booking loop buckets by raw UTC calendar day
(`completedAt.slice(0,10)`); the new `incentiveCostPaise` line was conformed to match
(`queryIncentiveCostByUtcDay` in `finance-repository.ts`), **not** the reverse, even though spec
§7.8 asks for IST-day bucketing. The first implementation used the genuinely-IST-bucketed
`incentiveRepo.sumAppliedByIstDay` (Task 6) and a review caught a real bug: for any award
`computedAt` between 18:30–23:59:59.999 UTC, the IST calendar day is already the next day, so the
two maps' date-string keys silently diverged and misattributed that window's incentive cost to the
adjacent day-row. Re-bucketing the booking side to IST was out of scope (it would move every
historical P&L number); conforming the new line to the existing convention was the contained fix.
**`sumAppliedByIstDay` is left in place, correctly IST-bucketed, for a future genuinely-IST-facing
caller** (the technician-facing week boundary already is IST) — it currently has no non-test
caller. Do not assume the whole P&L is IST-bucketed because one function's name says so.

## Interfaces a future story consumes by exact name

- `computeWeek(input): ComputeWeekResult`, `deriveAwardStatus(awardedPaise, appliedPaise):
  IncentiveAwardStatus` — pure, no I/O (`api/src/services/incentive.service.ts`).
- `applyAward(input): Promise<ApplyAwardResult>` — the money-moving entry point. `ApplyAwardResult`
  is a 3-way discriminated union (`NO_AWARD` / `AWARDED` / `REPLAYED`).
- `reconcileAwardApplied(technicianId, awardId): Promise<IncentiveAwardDoc | null>` — idempotent,
  safe to call repeatedly; a pure function of the ledger's current state.
- `runIncentiveWeek(weekKey, byId): Promise<IncentiveRunSummary>` — the orchestrator both the
  manual route and the Monday timer call. Per-technician failure isolation: one technician
  throwing does not abort the roster.
- `istWeekKey`, `istWeekBounds`, `previousIstWeekKey`, `IST_WEEK_KEY_RE` (`api/src/lib/ist-time.ts`)
  — the week-key layer added on top of E21-S02's pre-existing `IST_OFFSET_MS`/`istDateStr`/
  `istWeekStart`. `istWeekBounds` returns a **half-open** `[startUtc, endUtc)` UTC interval.
- `incentiveRepo.{listAwards, getAwardWithEtag, listAwardsCrossPartition, sumAppliedByIstDay}`
  (`api/src/cosmos/incentive-repository.ts`) and `commissionReceivableRepo
  .listTechnicianIdsWithReceivablesInWindow` — all cross-partition-shaped methods here are proven
  against `{ resources: undefined }` (the documented Cosmos empty-aggregate-page incident class),
  not just `{ resources: [] }`.

## The weekly timer — cron and its UTC/IST derivation, written out to be re-derivable

Monday 00:30 IST = **Sunday 19:00 UTC**. Azure Functions on Linux Consumption runs NCRONTAB in UTC
unless `WEBSITE_TIME_ZONE` is set (it is not, anywhere in this repo). NCRONTAB field order is
`{second} {minute} {hour} {day} {month} {day-of-week}`, and day-of-week `0` is Sunday (confirmed
against Microsoft's own Azure Functions timer-trigger documentation, not assumed) — so `0 0 19 * *
0` means "second 0, minute 0, hour 19 UTC, any day, any month, Sunday." Sunday 19:00:00 UTC + IST's
+05:30 offset = Sunday 24:30, which rolls to **Monday 00:30 IST**. The handler calls
`previousIstWeekKey(new Date())`, not `istWeekKey`, because at the instant the timer fires IST has
just crossed into the new week — the week needing computation is the one that just closed.

## Five routes, roles as actually enforced (cross-checked against the handler code, not the spec table)

| Method | Route | Roles |
|---|---|---|
| `GET` | `/v1/admin/incentives/config` | `super-admin`, `finance` |
| `PUT` | `/v1/admin/incentives/config` | `super-admin` only |
| `GET` | `/v1/admin/incentives/awards` | `super-admin`, `finance` |
| `POST` | `/v1/admin/incentives/run?week=` | `super-admin` only — it moves money |
| `GET` | `/v1/technicians/me/incentives` | authenticated technician, own record only |

The technician route accepts no client-supplied `technicianId` anywhere (query, body, header) — the
authenticated `uid` from `verifyTechnicianToken` is the only identifier used for every downstream
read. There is no IDOR vector to guard against here because there is nothing to pivot off.

## Open, unowned by this story

- **#340/#341** (admin-web P&L dashboard hard-coding green for `netToOwner` regardless of sign) —
  resolved and live in production (ACA revision `0000032`) as of this story's merge. Not this
  story's own concern going forward; noted here only because this story's schema widening
  (`netToOwner`/`totalNet` off `.nonnegative()`) is what made a negative P&L day reachable for the
  first time.
- **API deploy is a separate, not-yet-done step after this PR merges** — different runbook from
  admin-web's (Linux prod zip → blob storage → `WEBSITE_RUN_FROM_PACKAGE`; never `func publish`,
  `azure/login@v2`, or Windows-built `node_modules`). `api-ship.yml` stamps `GIT_SHA` *after*
  publishing then polls health for it, so a deploy can be genuinely live while the job reads red on
  a stale stamp — check `az functionapp function list` for indexed function names before believing
  a failure.
