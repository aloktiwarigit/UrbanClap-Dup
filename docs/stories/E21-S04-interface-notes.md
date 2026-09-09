# E21-S04 — Dues-gated dispatch: interface notes and rulings

Extracted from the E21-S04 SDD decision ledger
(`.superpowers/sdd/2026-09-08-e21-s04-dues-gated-dispatch/progress.md`, git-ignored) so the
contracts and decisions survive the worktree. Written for **E21-S05** (technician wallet, cash
confirm, dues banner), which consumes this story's accept contract directly.

Source of truth for the design: `docs/adr/0032-commission-hold-is-an-eligibility-gate.md` and
`docs/runbook.md` → "Dues-gated dispatch (E21-S04)". This file records the interface surface and
the decisions that live nowhere else.

Inclusion test applied: *would a future story be wrong without this?* — not *was this hard-won?*

---

## The contract E21-S05 consumes

`PATCH /v1/technicians/job-offers/{bookingId}/accept`

```
403 { "code": "COMMISSION_HOLD_BLOCKED",
      "outstandingPaise": <int>, "blockThresholdPaise": <int> }
```
The technician owes at or above the block threshold and enforcement is on. **The offer has
already been declined server-side and the booking has moved on to the next candidate — the client
must NOT retry this booking.** Render `JobOfferUiState.BlockedByDues(outstandingPaise)` with a
wallet CTA.

```
503 { "code": "HOLD_CHECK_UNAVAILABLE" }
```
The hold could not be determined. **The offer is still PENDING and the technician may retry inside
the 90-second window.** Do not show a dues message — this is a transient server condition, not a
balance. The body deliberately carries **no `reason` field**: `AcceptGateResult.reason` holds raw
Cosmos error text (account, container, activity id, query fragments) and must never reach a
client.

This route is **not** in `api/src/openapi/registry.ts` and `api/openapi.json` is untouched by this
story, so the contract is pinned only by `api/tests/functions/job-offers-hold-gate.test.ts`.
Android DTOs are hand-written; there is no generated client to regenerate.

## Interfaces this story added

- `assertCanAccept(technicianId)` → `{ decision: 'ALLOW' } | { decision: 'BLOCKED', outstandingPaise, blockThresholdPaise } | { decision: 'INDETERMINATE', reason }` (`services/commission-hold.service.ts`). Read-only; never writes.
- `computeCommissionHold(id)` now returns **`{ hold, readStartedAt, cfg }`** — `cfg` was added so the reported threshold is provably the one the verdict was computed against. If you consume it, destructure; do not positional-match.
- `getTechniciansWithinRadius(lat, lng, radiusKm, serviceId, opts?)` where `opts` is `{ excludeBlockedHolds?, requireKyc? }`.
- `countBlockedInRadius(...)`, `readTechnicianGateState(id)` → `{ exists, hold, suspended }` (`cosmos/technician-repository.ts`).
- `buildHoldRoster(allWithHold, dueGroups)` → `{ rows, totalOutstandingPaise, unreconciledTechnicianCount }` (`services/commission-dashboard.service.ts`), pure.
- `systemDocsRepo.{getHoldReconciliationSummary, putHoldReconciliationSummary}`; doc type in `schemas/hold-reconciliation-summary.ts`.
- `loadDispatchGates()`, `gatesToPredicateOptions()`, `logShadowExclusions()` (`services/dispatch-eligibility.ts`) — the only hold-aware module in dispatch.

## Things a future story will get wrong without this

**1. This story does NOT ship dark, despite the flag.** Two things went live on merge regardless
of `holdEnforcementEnabled`: the reconciler runs every 15 minutes and moves admin dashboard
figures, and the accept path carries an awaited Cosmos round-trip (the price of the accept-side
shadow readout). Do not repeat the "nothing changes until the flag flips" claim.

**2. Cosmos `!=` against an undefined path evaluates to `undefined`, which DROPS the row.** Every
dispatch predicate is therefore written `(NOT IS_DEFINED(x) OR x != bad)`. The `NOT IS_DEFINED`
disjunct **is** the fail-open; removing it is a silent, total dispatch outage, not a syntax error.

**3. Cosmos `IS_DEFINED` is TRUE for a present-but-`null` property.** This cost a whole review
round. `upsertKycStatus` defaults `panHash: null` into every write and `submit-pan-ocr` nulls it
on rejection, so `IS_DEFINED(c.kyc.panHash)` alone admits every PAN-*rejected* technician. Use
`IS_DEFINED(...) AND NOT IS_NULL(...)` — the halves guard opposite directions.

**4. `kyc.kycStatus` is not a verification fact and must not be read as one.** It is a single
scalar progress marker for a two-step process completable in **either order**, so it cannot
express "both done"; `COMPLETE` — the only value that could — has no writer. Three consecutive
Codex rounds each found a real defect in a status-based predicate, in *opposite* directions
(dead branch → admits half-verified → excludes fully-verified). Dispatch now reads two
independent facts: `aadhaarVerified = true AND panHash present-and-non-null`.

**5. 🚫 `enforceKycInDispatch` must NOT be flipped until the KYC flow is completable in both
orderings.** This is a blocker, not a caution, and it is aimed at you specifically if you are
building the technician app. `upsertKycStatus` reconstructs the `kyc` sub-object with defaults on
the **first** write, so a technician stops failing open the moment they touch either KYC endpoint
and stays excluded until both facts land — while `submit-pan-ocr` writes `PAN_DONE` without
checking Aadhaar and nothing writes a terminal status. A PAN-first technician is excluded with no
path to finish, and flipping the flag in that state strands them silently.

**The specific trap for a client story:** the technician app can easily make this flow *look*
completable — a two-step wizard that reports success after each call, and a status screen that
reads `kyc.kycStatus` — without the backend having gained a terminal state or any step-order
enforcement. A green UI over an incompletable flow is worse than a visibly broken one, because it
removes the pressure to fix the backend. If you surface KYC progress at all, derive it from the
same two facts dispatch uses (`aadhaarVerified` and `panHash` present-and-non-null), not from
`kyc.kycStatus` — see item 4. See also the runbook's blocking precondition.

**6. A blocked accept must not stall the booking.** Attempts are single-technician. The blocked
path must `declineAttempt` **and** `continueDispatchAfterOfferOutcome(bookingId, attempt.technicianIds)`.
The fallback latency is **~120 seconds, not 30** — and the naive reading really does give 30, so
here is the term you are missing. `expireStaleOffers` is *scheduled* every 30 seconds, which is
where 30 comes from. But its predicate is `status = 'PENDING' AND expiresAt < now`, so it cannot
act on an offer until that offer's **90-second window has already elapsed**. The 30-second tick
is only the granularity *after* the 90 seconds, not the whole wait: 90 + ≤30 ≈ 120. If you
recompute this and get 30, you have counted the schedule and missed the predicate.

A second trap in the same area: once an attempt is declined it is `EXPIRED`, so `expireStaleOffers`
— which matches `PENDING` — can **never** see it again. Any comment claiming "the expiry timer is
the backstop" after a decline is false; this story shipped that exact wrong comment once and had
to correct it. Recovery from a failed dispatch hand-off is instead a reset to `PAID`, which
`retryAwaitingDispatch` sweeps every 5 minutes (it selects `PAID`/`UNFULFILLED` with no
`technicianId`).

**7. `.codex-review-passed` is tracked on `main` and rewritten by every merging PR.** Its presence
proves nothing about any branch. Read its `commit` field. E21-S04 wrote no marker.

## Parked, with rulings

- **Guard read and `PAID` reset are not atomic** (tens of ms). A re-dispatch landing between them still gets the reset → recoverable spurious `403 FORBIDDEN` for a second technician, not a stall. Closing it needs an ETag-conditional write `updateBookingFields` does not expose.
- **`sumDueGroupedByTechnician` uses an unvalidated `query<T>` cast.** A Cosmos `SUM` over an undefined field is projected out, so `outstandingPaise` could arrive `undefined` and NaN the summary total. Pre-existing (E21-S02 surface); self-healing on the next sweep.
- **`listTechniciansWithHold` is an unused export** left from E21-S02 — the dashboard uses `listAllTechniciansWithHold`. Not deleted: removing an exported function is a behaviour change on another story's surface.
- **`patchTechnicianServiceProfile` copies `kyc.kycStatus` to top-level `c.kycStatus` untranslated** — still propagating the marker this story stopped trusting. That is how a retired field comes back.
- **RU/p95 not measured** — no Cosmos endpoint was reachable from the implementing session. ADR-0032 carries the TODO gating the flag flip.
- **Shadow data gathered before this story's telemetry fix must be discarded**, not reasoned from: exclusions were logged against the raw bounding-box result before the real filters (~4× inflation observed on one booking).

## Not extracted — and where to find it instead

- **The design rationale, alternatives considered, and negative consequences** → `docs/adr/0032-commission-hold-is-an-eligibility-gate.md`. Read it before changing any predicate here.
- **Operational procedures** — "technician says he is blocked", the shadow-mode readout, the flag-flip preconditions, the timers table → `docs/runbook.md` → "Dues-gated dispatch (E21-S04)".
- **The public/compliance statement of what filters dispatch and what ranks it** → `docs/dispatch-algorithm.md` §4 and §7 (Karnataka Platform Workers Act artifact; ADR-0011 points at it).
- **The Karnataka invariant's mechanical enforcement** → `api/.semgrep.yml` rule `no-commission-hold-in-ranking` plus `api/tests/unit/dispatch-ranking-invariance.test.ts`. The rule misses an indirect helper; the runtime test is what catches that, and only because its rating-tie fixtures differ on balance *and* due count. Do not "simplify" those fixtures.
- **Per-task implementation detail, the 12 rulings with their cost-if-wrong, and the full Codex round history** → the SDD ledger named at the top, which does not survive the worktree. If you need it, ask before `wt-e21-s04` is removed.
