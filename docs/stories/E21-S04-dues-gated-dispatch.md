# E21-S04 — Dues-gated dispatch

- **Tier:** Foundation (dispatch + money + concurrency)
- **Sub-project:** `api/` only. `admin-web/`, `customer-app/`, `technician-app/` untouched.
- **Branch / worktree:** `feat/e21-s04-dues-gate` in `C:/Alok/Business Projects/wt-e21-s04`, cut
  from `origin/main` @ `7e3fdef4`.
- **Builds on:** `docs/adr/0031-single-partition-commission-ledger.md`, `docs/adr/0011-karnataka-
  decline-history-isolation.md`, `docs/stories/E21-S02-interface-notes.md`.
- **Design:** `docs/superpowers/specs/2026-09-08-e21-s04-dues-gated-dispatch-design.md`
- **Decision record:** `docs/adr/0032-commission-hold-is-an-eligibility-gate.md`

## Ships dark — with two exceptions

No technician is excluded from dispatch and no accept is refused until an owner sets
`holdEnforcementEnabled: true` on the `system/commission-config` document. That flag defaults
`false`. See `docs/runbook.md` → "Dues-gated dispatch (E21-S04)" for the shadow-mode readout
procedure that should precede flipping it, and the diagnosis path for a technician who reports
being blocked once it is on.

**"Nothing changes until the flag flips" is not accurate, and earlier drafts of this story said
so.** Two things go live on merge, with the flag still `false`:

1. **The 15-minute reconciler is not flag-gated.** `trigger-reconcile-commission-holds.ts` runs
   from merge: hold states move, expired overrides are swept, and
   `system/hold-reconciliation-summary` — the figures the admin commission dashboard renders —
   starts changing every 15 minutes. Nothing technician- or customer-visible, but an admin's
   numbers do move.
2. **Every job accept gains an awaited Cosmos round-trip.** `assertCanAccept` calls
   `computeCommissionHold` even with enforcement off, because that read is what produces the
   accept-side `ACCEPT_HOLD_SHADOW_BLOCK` log line. The decision is always `ALLOW` while the flag
   is off, but the latency is real and it is on the hottest path in the product. It also widened a
   latent TOCTOU on offer expiry, closed in Codex round 2 — see ADR-0032, "Offer expiry across the
   gate".

## What shipped

E21-S01/S02 built the commission ledger and the per-technician `commissionHold` cache
(`CLEAR | WARN | BLOCKED`), but nothing consumed it — an unpaid technician dispatched and accepted
jobs exactly as if they owed nothing. This story makes the hold actually gate work, in two places,
both behind the one flag:

1. **Dispatch.** `getTechniciansWithinRadius` gained an optional `DispatchPredicateOptions`
   (`excludeBlockedHolds`, `requireKyc`). A new module, `dispatch-eligibility.ts`, is the only
   place dispatch reads commission/config state: `loadDispatchGates()` (never throws — a config
   read failure resolves to both gates off) and `logShadowExclusions()` (the shadow-mode log
   emitted while enforcement is off). A `BLOCKED` technician is excluded from the candidate set
   for new offers; a `BLOCKED` technician's ranked *position*, if included, never changes —
   ranking stays distance-then-rating, exactly as ADR-0011 already requires for decline history.
   A genuine bug fix rode along: `suspended` technicians are now excluded unconditionally (they
   previously relied on also being `isOnline: false`, which a technician's own availability
   toggle could silently undo).
2. **Accept.** `assertCanAccept(technicianId)` in `commission-hold.service.ts` is a three-outcome
   gate (`ALLOW | BLOCKED | INDETERMINATE`) wired into `PATCH
   /v1/technicians/job-offers/{bookingId}/accept`, after the ownership/expiry checks and before
   `acceptAttempt` — a blocked accept never transiently marks the attempt `ACCEPTED`. See "Accept
   contract" below for the exact response shapes.
3. **The reconciler.** `trigger-reconcile-commission-holds.ts`, new, runs every 15 minutes:
   drains the hold-repair queue, sweeps expired admin overrides on every run, runs a full
   cross-partition hold sweep on roughly every 6th run (~90 minutes, clock-derived), and writes
   `system/hold-reconciliation-summary` so the admin dashboard stops draining the whole fleet on
   every page view.
4. **Compliance enforcement for the new field.** `no-commission-hold-in-ranking` (Semgrep,
   `severity: ERROR`) plus `tests/unit/dispatch-ranking-invariance.test.ts` extend the ADR-0011
   pattern to `commissionHold`, alongside the structural constraint that `dispatch-eligibility.ts`
   is the only hold-aware dispatch module.
5. **Documentation.** ADR-0032, this story record, `docs/dispatch-algorithm.md` §4, and two new
   `docs/runbook.md` entries.

## The ADR-number decision

The spec allocated `0030` to the design ADR. By the time this story landed, `0030` had already
been claimed by `wt-api36` and `0031` by E21-S02, so this story's ADR is **0032**. `0025` is a
real hole (two files were both numbered `0024`) but is deliberately not backfilled, per
`docs/adr/README.md`'s "number monotonically" rule. Every spec-relative downstream allocation
shifts by one: E23 incentives → 0033, `collectionMethod` vs `paymentMethod` → 0034, PII masking →
0035. See ADR-0032's own header section for the full reasoning — record it there so no future
story has to re-derive it from a spec that names the wrong number.

## The three E21-S02 carry-forwards, and where each is discharged

E21-S02's interface notes and review ledger flagged three items as owed to this story. All three
are now closed:

| Carry-forward | E21-S02 origin | Discharged by |
|---|---|---|
| The `EXPIRED_OVERRIDES` sweep must run on **every** reconciler invocation, not just when the repair queue has entries | Task 6 / Ruling C | `trigger-reconcile-commission-holds.ts` step 2 — unconditional, with a dedicated test asserting it fires on an empty-queue run |
| The admin dashboard draining every hold document plus a cross-partition `GROUP BY` on every request | Task 10 parked item | `system/hold-reconciliation-summary`, written every reconciler run; the dashboard reads it first and falls back to a live drain only when missing, stale (>45 min), or the requested page exceeds the summary's `topN` |
| Four E21-S02 cross-partition helpers (`listTechniciansWithHold`, `listAllTechniciansWithHold`, `listTechniciansWithExpiredOverride`, `sumDueGroupedByTechnician`) were never registered against ADR-0027's guardrail test | ADR-0027 registration gap | All four registered in `cross-partition-tenant-filter.test.ts` Layers 2 and 3, with `SEMGREP-JUSTIFIED` comments above each declaration |

## Accept contract — E21-S05 consumes this verbatim

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

Two details worth restating for the client implementer, because they are easy to get backwards:

- The **403** body never needs a retry of the same booking — the server has already moved the
  booking on to another candidate by the time the response is sent. A client that retries the
  accept call on 403 will get `404`/`410`, not a second chance.
- The **503** body carries no `reason` field on purpose (it would otherwise be raw Cosmos error
  text) and the offer is genuinely still live — a client that treats 503 the same as 403 (showing
  a dues message, or abandoning the offer) will incorrectly cost the technician a job they were
  still entitled to accept.

## Known limitations, parked deliberately (not bugs to fix in E21-S05)

- The reconciliation summary caps at the top 100 technicians by outstanding balance
  (`HOLD_SUMMARY_TOP_N`) and is up to 15 minutes stale; technician display names inside it up to
  45 minutes stale. Beyond the cap, the dashboard falls back to a live drain for that page.
- Once enforcement is on, enforce-mode exclusions are only ever counted (not itemised) on the
  zero-candidate dispatch path (`DISPATCH_NO_TECHS ... blockedByHold=N`) — there is no ongoing,
  per-booking visibility into how many candidates the hold filtered out on a booking that still
  found coverage.
- `enforceKycInDispatch` is fully implemented (an identical fail-open `requireKyc` predicate
  option) but is **not part of this rollout** — it stays `false` and needs its own owner decision
  and readout, independent of the commission-hold flag.
- A `commissionHold` write that never lands leaves a technician wrongly dispatchable for up to 90
  minutes (the full-sweep interval), absent an explicit repair-queue entry catching it sooner.
- The guard read and the booking's `PAID`-reset write in the accept-failure recovery path (see
  ADR-0032, "I4") are two sequential, non-atomic Cosmos calls; a re-dispatch landing in that
  tens-of-milliseconds window still receives the reset, producing a recoverable spurious `403
  FORBIDDEN` for a second technician rather than a stall. Accepted; would need an ETag-conditional
  write the repository layer does not currently expose to close fully.
- `sumDueGroupedByTechnician` types rows via an unvalidated `query<T>` cast; a Cosmos aggregate
  `SUM` over an `undefined` field is projected out rather than returned as `0`, so
  `outstandingPaise` could in principle arrive `undefined` and NaN the dashboard total.
  Pre-existing (E21-S02's surface), not introduced by this story, and self-healing on the next
  sweep.
- `listTechniciansWithHold` (the paged variant) is an unused export left over from E21-S02 — the
  dashboard uses `listAllTechniciansWithHold` instead. Not removed here; deleting an exported
  function is a behaviour change on E21-S02's surface, out of this story's scope.

## RU / p95 measurement

**Not measured — no Cosmos endpoint reachable from the implementing session.** See ADR-0032's
"RU / p95 measurements" section for the explicit TODO: someone with production or staging Cosmos
access must measure baseline vs. gated `getTechniciansWithinRadius` RU and p95 before
`holdEnforcementEnabled` is flipped in an environment where that cost matters.

## References

- `docs/adr/0032-commission-hold-is-an-eligibility-gate.md`
- `docs/adr/0031-single-partition-commission-ledger.md`
- `docs/adr/0011-karnataka-decline-history-isolation.md`
- `docs/adr/0027-cross-partition-query-guardrails.md`
- `docs/dispatch-algorithm.md` §4, §7
- `docs/runbook.md` → "Dues-gated dispatch (E21-S04)"
- `docs/stories/E21-S02-interface-notes.md`
- `api/src/services/dispatch-eligibility.ts`
- `api/src/services/commission-hold.service.ts`
- `api/src/functions/job-offers.ts`
- `api/src/functions/trigger-reconcile-commission-holds.ts`
- `api/src/functions/admin/finance/commission-receivables.ts`
- `api/src/cosmos/technician-repository.ts`
