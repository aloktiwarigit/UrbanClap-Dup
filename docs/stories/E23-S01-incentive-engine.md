# E23-S01 — Weekly technician incentive engine

- **Tier:** Foundation (money + ledger + anti-gaming + static analysis)
- **Sub-project:** `api/` only. `admin-web/`, `customer-app/`, `technician-app/` untouched — the
  admin-web consumer of the two admin routes is a separate, paired story (E23-S02, not yet built).
- **Branch / worktree:** `feat/e23-s01-incentive-engine` in `C:/Alok/Business Projects/wt-e23-s01`.
- **Builds on:** `docs/adr/0031-single-partition-commission-ledger.md` (the ledger container and
  `TransactionalBatch` allocator this story reuses), `docs/adr/0032-commission-hold-is-an-
  eligibility-gate.md`.
- **Decision record:** `docs/adr/0035-incentives-are-credit-only-and-capped.md` — read it before
  touching any of the files below. It states, plainly, what the anti-gaming cap does and does not
  achieve at its shipped default.
- **Plans:** `plans/e23-s01-incentive-engine.md`, `plans/e23-s01b-incentive-application.md`,
  `plans/e23-s01c-incentive-pnl-gates-rollout.md`

## Scope

A weekly milestone bonus (owner requirement R5): a technician who completes enough countable jobs
in an IST calendar week (Monday 00:00 IST through the following Sunday 23:59:59.999 IST) earns a
bonus, paid as **credit against commission owed**, never as cash. The bonus is capped as a fraction
of the commission the counted jobs actually generated that week, and cheap bookings below a floor
price cannot count toward the job total at all. Both guards are admin-editable at runtime; neither
requires a code change or a deploy to retune.

Not in scope: any admin-web UI for configuring or viewing incentives (E23-S02), any technician-app
UI beyond what the existing `GET /v1/technicians/me/incentives` JSON response can already power,
and any change to how the commission ledger itself works (E21-S02's allocator is reused unmodified,
as an anchor consumer).

## What shipped

### The five routes

| Method | Route | Roles | What it does |
|---|---|---|---|
| `GET` | `/v1/admin/incentives/config` | `super-admin`, `finance` | Reads the effective incentive config — live doc merged over defaults (`enabled`, `milestones`, `capFractionBps`, `minCountableBookingPaise`). |
| `PUT` | `/v1/admin/incentives/config` | `super-admin` only | Patches the config. `.strict()` body, rejects an empty patch, and enforces that any submitted `milestones` array is strictly ascending in both `jobs` and `bonusPaise` (a `10 jobs → ₹300` table with a second `10 jobs → ₹200` row, or a `15 jobs → ₹250` row that pays less than an earlier `10 jobs → ₹300` row, is rejected at the schema layer, not silently accepted and misread later). |
| `GET` | `/v1/admin/incentives/awards` | `super-admin`, `finance` | Paginated, cross-partition listing of award documents, optionally filtered by `weekKey` or `technicianId`. |
| `POST` | `/v1/admin/incentives/run?week=YYYY-Www` | `super-admin` only | Manually (re-)runs the weekly award computation for one IST week, across every technician with at least one receivable in that window. Idempotent — see "Re-running a week" in the runbook. |
| `GET` | `/v1/technicians/me/incentives` | Authenticated technician (own record only, via `verifyTechnicianToken`) | Live current-week progress (job count, commission counted so far, next milestone, projected bonus already capped) plus the technician's last 8 awards. |

A sixth entry point is not a route: `trigger-incentive-weekly.ts` is a timer function, Monday 00:30
IST, that calls the same `runIncentiveWeek` orchestrator the manual-run route calls, for the
week that just ended.

### The award document shape

One document per `(technicianId, weekKey)`, id `inc:${technicianId}:${weekKey}`, `docType:
'INCENTIVE_AWARD'`, living in the **existing** `commission_receivables` container (partition
`/technicianId`) — no new container, per architecture invariants #1 and #10 (see ADR-0035
"Alternatives considered"). Key fields:

- `countedJobs`, `countedCommissionPaise` — what the counting rule actually found for the week.
- `milestoneSnapshot`, `capFractionBpsSnapshot`, `minCountableBookingPaiseSnapshot` — the config
  in effect *at award time*, copied onto the document so a later admin edit can never re-price a
  week that has already been awarded (spec §3.5).
- `reachedMilestone`, `grossBonusPaise`, `capPaise`, `awardedPaise` — `awardedPaise =
  min(grossBonusPaise, capPaise)`, positive by construction (a zero award is never written).
- `appliedPaise`, `status` (`AWARDED | PARTIAL | APPLIED`) — always recomputed **absolutely** from
  the ledger's current allocations, never incremented, so a crash-replay or an out-of-order
  credit-consumption run self-heals instead of drifting. See "appliedPaise's two refIds" below.

The **write** schema (`IncentiveAwardWriteSchema`) is `.strict()` at every level, including nested
inside `milestoneSnapshot`/`reachedMilestone`; the **read** schema deliberately is not, because
Cosmos returns `_rid`/`_etag`/`_ts`/`_self`/`_attachments` on every stored document and zod's
default strip mode would otherwise drop them silently on the write side. Only
`incentive.service.ts` constructs a write-schema document.

### The counting rule (spec §7.8)

A receivable counts toward a week's job count and commission base when its `createdAt` falls
inside `[weekStart 00:00 IST, weekEnd+1 00:00 IST)` **and** `bookingAmount >=
minCountableBookingPaise`. `WAIVED` receivables still count — the technician did the job; whether
an admin later forgives that commission is an unrelated fact, and `WeekCountableReceivable`
deliberately carries no `remittanceStatus` field at all, making this a structural guarantee rather
than a comment someone could delete.

### The two guards

1. **`minCountableBookingPaise`** (default ₹249 — the cheapest real service at pilot pricing).
   Keeps a booking cheaper than any real service out of both the job count and the commission
   base, so padding the count is not even free to attempt.
2. **`capFractionBps`** (default 6000 = 60%). Limits the awarded bonus to a fraction of the
   commission the counted jobs actually generated that week. Self-limiting in principle — topping
   up the job count with cheap jobs raises the commission base more slowly than it raises the
   milestone's gross bonus, so the cap is *supposed* to bite exactly where padding would otherwise
   pay.

**In practice, at the shipped 6000 bps default, it does not always bite where it should.**
`docs/adr/0035-incentives-are-credit-only-and-capped.md` Consequence 1 states the numbers: a
technician who does 7 real ₹1,000 jobs and pads the count to a 10-job milestone with 3 cheap ₹249
jobs nets **+13,566 paise of real profit**, because the 60% cap on the resulting ₹1,704.34 of
counted commission (₹1,022.60) sits well above the milestone's ₹300 gross bonus and never
constrains it. A 1500 bps (15%) cap closes this exact case with no false positive against ten
genuine jobs — Task 5's `PROOF` tests price both numbers by hand — but 1500 bps is not what
shipped. The lever is `capFractionBps` alone, adjustable without a deploy; read the ADR before
assuming the shipped default is safe against a mixed-honesty week.

### The credit-only guarantee — three independent layers

Spec §7.8 requires the award to never become a cash payout. This is enforced structurally, not by
convention, and Task 17 proved each layer catches the class of violation it exists to catch, not
just the one example in the brief:

1. **`.strict()` write schema** — a `payoutPaise`/`netPayable`/`razorpayTransferId` field added
   anywhere in the award shape (top-level or nested) throws at `.parse()` time, before it can ever
   reach Cosmos.
2. **A static Vitest test** (`api/tests/static/incentives-credit-only.test.ts`) — scans the
   incentive module and schema for payout-shaped identifiers, and scans every payout/settlement
   file for incentive identifiers. **Confirmed to fail on all three of three injected violations**
   (each appended to the real files, run, confirmed to name the exact injected line, then
   reverted): a value-position declaration (`const payoutPaise = 0;`), a reference from a payout
   file (`IncentiveAwardDoc` used inside `approve-payouts.ts`), and a schema-shape injection
   (`payoutPaise: z.number().int(),` added as a field inside `awardShape` — this one failed *two*
   of the test's assertions simultaneously, exactly as predicted).
3. **Two Semgrep rules** (`incentives-credit-only`, `incentives-not-in-payout-path` in
   `api/.semgrep.yml`). Round 1 of this rule shipped with a real gap — a bare-identifier pattern
   only matches VALUE-position expressions, not the same token in TYPE position (`as
   IncentiveAwardDoc`, a typed parameter, `import type`) or as an object-literal property KEY. A
   reviewer running real Semgrep via Docker (the native CLI is blocked here by this environment's
   Application Control policy) found 2 of the 3 injected shapes silently produced 0 findings under
   round 1. **Round 2 fixed both gaps** with AST patterns for typed casts/params/returns/imports
   and for object-literal keys, then reran real Semgrep (Docker, `semgrep/semgrep:1.159.0`) against
   the clean tree (244 files, 11 rules, 0 findings — including no false positive against the
   schema file's own doc comment that names these tokens in prose) and against all 3 re-injected
   violations (5 findings, all 3 shapes caught), then reverted the injections and confirmed clean
   again. One residual gap remains, documented rather than silently missing: a bare generic-wrapped
   type reference (`Promise<IncentiveAwardDoc>`) is not caught by either rule — Semgrep's pattern
   parser needs an expression/statement/declaration shape, not a bare type-level fragment — and
   this is mitigated by layer 1 (the `.strict()` schema) still throwing regardless of what any
   static tool catches in source.

### Owner P&L line

`getDailyPnL` gained an `incentiveCostPaise` line, bucketed by the **raw UTC calendar day** of each
award's `computedAt` — matching the pre-existing booking loop's UTC-day convention in the same
function, not spec §7.8's literal IST-day ask (see ADR-0035 Consequence 4 for why, and for the
day-boundary bug this conformance fixed). `netToOwner`/`totalNet` widened from `.nonnegative()` to
`z.number()` — a legitimate read-path widening (an award-only day with no completed bookings
produces a real negative net for the first time). This widening is what surfaced GitHub issue #340
(an unrelated admin-web color bug: a loss day renders in the same green as a profit day) — filed,
not fixed, here; it is out of scope for this `api/`-only story.

## Concerns carried forward (see ADR-0035 for the durable record)

1. The anti-gaming cap does not close the 7-real-plus-3-cheap margin case at the shipped 6000 bps
   default. Turning it down to 1500 bps closes it; that is an operational decision for the owner
   to make if gaming is observed, not a code change.
2. `appliedPaise` reconciliation counts allocations against two `refId` values
   (`awardId` and `cr:${awardId}`), which spec §5.5 does not mention — the spec's wording there is
   incomplete, not this story's implementation.
3. The Semgrep credit-only gate does not cover generic-wrapped type references; the `.strict()`
   schema gate is the backstop.
4. GitHub issue #340 (admin-web P&L color bug) is open and unowned by this story.

## References

- `docs/adr/0035-incentives-are-credit-only-and-capped.md`
- `docs/runbook.md` → "Incentives (E23-S01)"
- `docs/threat-model.md` → Addendum 2026-09-10 (weekly incentive milestone gaming)
- `docs/stories/README.md` — E23 row
- `api/src/services/incentive.service.ts`, `api/src/schemas/incentive.ts`,
  `api/src/cosmos/incentive-repository.ts`, `api/.semgrep.yml`
- `api/tests/services/incentive.compute.test.ts`, `api/tests/static/incentives-credit-only.test.ts`
- `.superpowers/sdd/e23-s01-incentive-engine/task-{1..19}-report.md` — the full per-task build
  record this story doc summarizes
