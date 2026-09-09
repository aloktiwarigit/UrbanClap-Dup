# ADR-0032: Commission hold is a dispatch/accept eligibility gate, never a ranking input

- **Status:** accepted
- **Date:** 2026-09-08
- **Deciders:** Alok Tiwari (owner), implementing session (E21-S04)
- **Extends:** ADR-0031 (the ledger and the `commissionHold` cache this ADR reads),
  ADR-0011 (the Karnataka gate-not-ranking principle this ADR applies to a second field).

## Why 0032, not the spec's 0030

The E21-S04 spec allocated `0030` to this decision. By the time this story landed, `0030` had
already been claimed by `wt-api36` (`0030-compilesdk-36-on-agp-8-6-suppression.md`) and `0031` by
E21-S02 (the ledger ADR above). `0025` is a genuine hole in the sequence — two files were both
numbered `0024` (`0024-rating-shield-threshold.md` and `0024-sos-audio-e2e-encryption.md`) — but
`docs/adr/README.md`'s rule is to number monotonically, and backfilling a hole created by one
collision would only reproduce the ambiguity that caused it. So this ADR takes the next free
number, **0032**, and every downstream allocation the spec made relative to 0030 shifts by one:
E23 incentives moves from 0031 to **0033**, `collectionMethod` vs `paymentMethod` from 0032 to
**0034**, and PII masking from 0033 to **0035**. Recorded here explicitly so the next story does
not have to re-derive it from a stale spec reference.

## Context

E21-S01/S02 built the commission ledger (ADR-0031) and a per-technician `commissionHold` cache
(`CLEAR | WARN | BLOCKED`), computed from the live single-partition outstanding sum against
configurable thresholds. Nothing consumed it — a technician could accumulate an unpaid balance
past the block threshold and dispatch and job acceptance behaved exactly as if they owed nothing.
This story wires the hold into the two places money actually changes hands going forward:

1. **Dispatch** — should a `BLOCKED` technician be offered a new job at all?
2. **Accept** — if one somehow receives an offer (a race, a stale cache, an admin override that
   lapsed), can they accept it?

Both are gated behind one flag, `holdEnforcementEnabled`, which defaults `false`. No technician is
excluded from dispatch and no accept is refused until the owner flips it after a shadow-mode
readout — see the runbook.

**This story does not, however, ship entirely dark.** Earlier drafts of this ADR and of the story
said "nothing changes until the flag flips"; that was wrong, and is corrected here. Two things go
live the moment this merges, with the flag still `false`:

1. **The 15-minute reconciler** (`trigger-reconcile-commission-holds.ts`) runs unconditionally —
   it is not behind `holdEnforcementEnabled` at all. It sweeps expired admin overrides, drains the
   hold-repair queue, recomputes holds on a ~90-minute full pass, and writes
   `system/hold-reconciliation-summary`. Hold states and the figures the admin commission dashboard
   renders therefore start moving on merge, before any flip. This is intended (the readout the flip
   is decided on has to be current to be worth anything), but it is a live change to what an admin
   sees, not a no-op.
2. **An awaited Cosmos round-trip on every job accept.** `assertCanAccept` calls
   `computeCommissionHold(technicianId)` even when enforcement is off, because that is what
   produces the accept-side `ACCEPT_HOLD_SHADOW_BLOCK` readout. The decision returned is always
   `ALLOW` while the flag is off, but the latency is real and it lands on the hottest path in the
   product. It also widened a pre-existing TOCTOU on offer expiry — see "Offer expiry across the
   gate" below.

The central design tension is that dispatch and accept sit at opposite ends of the same booking's
lifecycle and have opposite failure economics. Dispatch runs early, over many candidates, and a
wrong exclusion just means one technician among several is skipped — cheap to be wrong about, and
being wrong in the "still gets offered work" direction risks nothing worse than an uncollected
debt getting slightly larger. Accept is the last checkpoint before a job is actually committed to
a technician; being wrong there in the "let them through" direction is the one outcome the whole
feature exists to prevent. That asymmetry drives most of the decisions below.

## Decision

### The gate-not-ranking rule (same principle as ADR-0011, different field)

Hold state is an **eligibility filter** — it decides who is in the candidate set — and never a
**ranking input** — it must never decide where a technician sits within that set once they're in
it. `rankTechnicians(techs, bookingLat, bookingLng)` in `dispatcher.service.ts` keeps its existing
signature unchanged and is never given a config object, a gates struct, or anything shaped like a
hold. The ranked order remains **distance, then rating. Nothing else.** A technician with an
unpaid balance over the threshold is either offered the job in their normal position, or not
offered it at all — they are never demoted within the list.

Three independent enforcement layers, mirroring ADR-0011's four-layer structure minus the schema
layer (there is no new decline-shaped field to keep off a schema here — the risk is an existing
field, `commissionHold`, leaking into the wrong function):

1. **Structural.** `dispatch-eligibility.ts` is the only module in the codebase that is allowed to
   turn hold/config state into anything the dispatcher acts on, and everything it produces is
   either a boolean pair (`DispatchPredicateOptions`) consumed by the Cosmos query layer, or a
   side-effecting logger (`logShadowExclusions`) that returns a count, never an ordering.
2. **Semgrep.** `api/.semgrep.yml` rule `no-commission-hold-in-ranking` (`severity: ERROR`,
   cross-referenced from and to `karnataka-no-decline-in-dispatcher`) flags `commissionHold`,
   `outstandingPaise`, `dueCount`, `holdState` — and their bracket-index forms — anywhere inside a
   `.sort()` comparator or the body of `rankTechnicians`, scoped to `dispatcher.service.ts`,
   `dispatch-eligibility.ts`, and `technician-repository.ts`. `semgrep-action@v1` treats every
   finding as blocking regardless of declared severity (see the comment in
   `cross-partition-tenant-filter.test.ts`), which is exactly the behaviour wanted here.
3. **Runtime.** `tests/unit/dispatch-ranking-invariance.test.ts` builds a candidate set, captures
   `rankTechnicians(...)`'s output, then mutates `commissionHold` across the set — every state,
   wildly different `outstandingPaise` values, some entries missing the field entirely — and
   asserts the output order is byte-identical. Distance and rating are the only inputs allowed to
   move a technician.

Getting the Semgrep rule to actually cover the risk took two implementation iterations, recorded
in the rule's own comments: a single-line pattern form is rejected by this Semgrep version's
TypeScript parser (a full parse failure fails the whole rule, not just the pattern); a multi-line
block form initially only matched a hold reference at the top level of a comparator body, missing
the far more natural "hold check buried inside an `if`" shape a future tiebreaker would actually
be written as. Both gaps were closed and verified against synthetic violations before this story
shipped — see the rule's own history comment in `api/.semgrep.yml` for the exact forms tried.

### The asymmetric fail directions, and the Cosmos trap that makes them work

**Dispatch fails OPEN.** Every new SQL predicate — the unconditional `suspended` bug fix, the
flagged hold predicate, the flagged KYC predicate — is written as a disjunction with an
`IS_DEFINED` guard:

```sql
(NOT IS_DEFINED(c.suspended) OR c.suspended != true)
(NOT IS_DEFINED(c.commissionHold.state) OR c.commissionHold.state != 'BLOCKED')
(NOT IS_DEFINED(c.kyc)
  OR (c.kyc.aadhaarVerified = true
      AND IS_DEFINED(c.kyc.panHash) AND NOT IS_NULL(c.kyc.panHash)))
```

**Corrected three times, then replaced.** The KYC predicate went through three consecutive
external review rounds, each of which found a real defect, and the defects pointed in *opposite*
directions:

1. **Round 1 — dead branch.** The predicate read the top-level `c.kycStatus` field for
   `= 'APPROVED'`. No code path in this codebase ever writes `'APPROVED'` to that field. The real
   KYC flow (`upsertKycStatus`, called only from `POST /v1/kyc/aadhaar` and
   `POST /v1/kyc/pan-ocr`) writes exclusively to the nested `kyc` sub-object; the top-level field
   is set only incidentally by `patchTechnicianServiceProfile`, which mirrors whatever the nested
   value happens to be without translating it. Once enabled, the predicate would have silently
   excluded every technician who had made real KYC progress and ever patched their profile, while
   admitting anyone who simply never touched their profile.
2. **Round 2 — admitted the half-verified.** Fixed to read the nested
   `kyc.kycStatus IN ('PAN_DONE', 'COMPLETE')`. But `submit-pan-ocr.ts` writes `PAN_DONE` on a
   successful OCR read *unconditionally* — it never checks that the Aadhaar step ran — so a
   technician who only ever submitted a PAN reached `PAN_DONE`.
3. **Round 3 — excluded the fully-verified.** Tightened with
   `AND (NOT IS_DEFINED(c.kyc.aadhaarVerified) OR c.kyc.aadhaarVerified = true)`. But the two KYC
   endpoints may be called in either order, and a *successful* Aadhaar submission overwrites
   `kycStatus` to `AADHAAR_DONE` while leaving the PAN fields intact. A technician who did PAN
   first and Aadhaar second — fully verified — therefore ends on `AADHAAR_DONE` and was excluded.

**The root cause is not any of the three predicates; it is the field they all read.**
`kyc.kycStatus` is a *single scalar used as a progress marker for a two-step process completable
in either order*. A scalar cannot express "both done": whichever step ran last wins. `COMPLETE` —
the one value in `KycStatusSchema` that could carry that meaning — has no writer anywhere in the
system. Every predicate reading that scalar is guessing, and each guess is wrong in one direction
or the other.

**The replacement reads two independent per-step facts instead of a progress marker**, each
written by exactly one endpoint, on success only:

- `kyc.aadhaarVerified = true` — `submit-aadhaar.ts` writes `true` only after DigiLocker returns a
  result, and explicitly `false` on failure.
- `kyc.panHash` defined and non-null — `submit-pan-ocr.ts` writes `panHash` only when Form
  Recognizer succeeds, and explicitly nulls it back out on rejection (so a later failed
  submission revokes an earlier pass). `panHash`, not `panMaskedNumber`, because it is a hash of a
  successfully extracted PAN with no legacy predecessor; the legacy fields are `panNumber` /
  `panNumberEncrypted`, which the predicate deliberately does not accept as proof.

Neither endpoint's patch carries the other's keys, and `upsertKycStatus()` merges
`defaults → existing kyc → patch`, so each step's fields survive the other's write. That is what
makes the predicate order-independent *by construction* rather than by luck: it is true iff both
steps have succeeded, in either order, across retries, and it goes false again if either step is
later rejected.

Two Cosmos details in that predicate are load-bearing and must not be "simplified" away.
`IS_DEFINED(c.kyc.panHash)` alone is insufficient, because `upsertKycStatus()` defaults
`panHash: null` into every write and `IS_DEFINED` is *true* for a null-valued property — so
`NOT IS_NULL(...)` is the clause that actually tests "a PAN was successfully read". Conversely
`NOT IS_NULL(...)` alone is insufficient, because `IS_NULL` is false for an *undefined* path too.
And the fail-open disjunct keys on the absence of the whole `kyc` sub-object, not on the absence
of the two fields: `upsertKycStatus()` is the only writer of `c.kyc` and always defaults both keys
in, so a document carrying a `kyc` object written any other way is holding *partial* KYC
information, which must fail closed. See the `KYC_VERIFIED_PREDICATE` comment in
`api/src/cosmos/technician-repository.ts` for the full hand-traced case table.

**This is the single most important sentence in this ADR: Cosmos evaluates `!=` (and most other
comparison operators) against an undefined path as `undefined`, and `undefined` is falsy in a
`WHERE` clause — so a bare `c.commissionHold.state != 'BLOCKED'`, with no `IS_DEFINED` disjunct,
silently drops every row that lacks the field.** A legacy technician document — of which there
are many, since `commissionHold`, `suspended`, and the whole `kyc` sub-object were all added
after technicians already existed in production — has none of these fields. Without the `NOT IS_DEFINED` disjunct,
the predicate does not "fail open" by matching such a document; it silently excludes it, which is
the opposite of fail-open and looks, from the outside, exactly like the query working correctly
with a much smaller result set. **The single most likely way a future edit turns this feature into
a silent dispatch outage is someone "simplifying" one of these predicates by dropping the
`IS_DEFINED` disjunct** — the query still runs, still returns rows, and nothing errors; entire
segments of the technician fleet just stop being dispatched to, and the only visible symptom is
bookings quietly going `UNFULFILLED` at a rate nobody can immediately explain, because the
predicate causing it isn't in any obviously-broken code path.

`loadDispatchGates()` extends the same fail-open posture one layer up: it wraps
`getCommissionConfig()` in a try/catch and returns both gates `false` on any error, including a
config document that fails to parse. Dispatch is the revenue path; a config read failing should
degrade to "no new gating," never to "no dispatch."

**Accept fails CLOSED.** `assertCanAccept(technicianId)` is the last checkpoint before a job is
actually committed to a technician, and once accepted, undoing an acceptance means calling a
technician to tell them the job they thought they had is gone — a support cost dispatch never
pays. So the same absent-data condition that makes dispatch admit a technician makes accept refuse
one: enforcement on plus a technician document that cannot be read, or a Cosmos call that throws,
resolves to a refusal (see "Three outcomes" below), not an `ALLOW`.

The two directions are not a contradiction to reconcile — they are the correct response to two
different costs. Dispatch's wrong-exclusion cost is silent lost revenue on one candidate among
several; a wrong dispatch inclusion costs nothing since accept is still downstream. Accept's
wrong-inclusion cost is the thing the entire feature exists to prevent (a technician who owes
money above the threshold actually starts a job), and its wrong-exclusion cost is bounded and
recoverable (a 503 the client can retry inside the offer window, versus a permanently lost slot).

### Three outcomes at accept, not two

`assertCanAccept` returns one of three decisions, not a boolean:

| Enforcement | Hold read | Result |
|---|---|---|
| off | any | `ALLOW`. If the (unread) hold would have been `BLOCKED`, log `ACCEPT_HOLD_SHADOW_BLOCK` and swallow the underlying read error if there was one. |
| on | `BLOCKED` | `403 { code: 'COMMISSION_HOLD_BLOCKED', outstandingPaise, blockThresholdPaise }`. The attempt is declined server-side and dispatch continues to the next candidate — see I4 below. |
| on | technician doc unreadable, or Cosmos throws | `503 { code: 'HOLD_CHECK_UNAVAILABLE' }`. The attempt is left `PENDING`; no audit is written. |
| on | `CLEAR` / `WARN`, or an active override | `ALLOW` |

**Why `INDETERMINATE` is its own outcome and not folded into `BLOCKED`.** Fail-closed means the
accept must not succeed; it does not follow that an infra hiccup should be reported to the
technician as debt, or that the attempt should be torn down. Returning the `BLOCKED` 403 on a
Cosmos read failure would tell a solvent technician they owe money they may not owe — a false and
specific accusation, not a vague error — and declining the attempt would permanently remove them
from a booking they were entitled to, over a transient condition that has nothing to do with their
standing. So `INDETERMINATE` gets a distinct `503 HOLD_CHECK_UNAVAILABLE`, with two properties the
`BLOCKED` path does not have: the attempt stays `PENDING` (the technician's client can retry
inside the remaining offer window), and **the response body carries no `reason` field** —
`AcceptGateResult`'s `reason` on the `INDETERMINATE` branch is raw Cosmos error text (an
implementation detail, occasionally containing internal identifiers), and it is logged
server-side (`ACCEPT_HOLD_INDETERMINATE`) but must never reach a client. This was flagged and
fixed during Task 5's review round before it could ship as a leak.

### `I4` — a blocked accept must not stall the booking, and the timer that was supposed to save it doesn't

Dispatch attempts are single-technician: only one candidate holds a `PENDING` attempt for a
booking at a time. If a blocked accept simply returned `403` and left that attempt `PENDING`, the
booking would sit dark until the attempt's own expiry, which is **not** the 30 seconds a first
draft of this feature assumed. `expireStaleOffers` runs on a `*/30 * * * * *` timer and matches
`status = 'PENDING' AND expiresAt < now`; the offer window itself
(`OFFER_WINDOW_MS`) is 90 seconds. So the real stall is the 90-second offer window **plus** up to
one 30-second tick before the sweep even looks at it — **roughly 120 seconds**, not 30. This
matters because 120 seconds is long enough that a customer refreshing a tracking screen notices.

The fix calls both `dispatchAttemptRepo.declineAttempt(attempt.id, bookingId)` **and**
`dispatcherService.continueDispatchAfterOfferOutcome(bookingId, attempt.technicianIds)` on the
`BLOCKED` path, so the booking walks to the next-nearest candidate immediately instead of waiting
on the timer at all.

**A second, sharper bug was found and fixed during review: "the expiry timer is the backstop" is
false once `declineAttempt` has already run.** `declineAttempt` marks the attempt `EXPIRED`.
`expireStaleOffers`'s query matches `status = 'PENDING'` — an `EXPIRED` attempt can never match it
again. So if `continueDispatchAfterOfferOutcome` itself then throws (a Cosmos hiccup on the very
next write), there is no timer watching this booking at all: `retryAwaitingDispatch` only selects
bookings in `PAID`/`UNFULFILLED` with no assigned technician, and `reconcileStaleBookings` only
*logs* a booking stuck in `SEARCHING`, once a day, after 24 hours. Left alone, the booking sits in
`SEARCHING` **permanently** — not for two minutes, forever. A code comment asserting "the expiry
timer is the backstop" was worse than no comment at all here, because it told the next reader not
to look further.

The implemented recovery: on a `continueDispatchAfterOfferOutcome` failure, best-effort reset the
booking to `status: 'PAID'` — the same idiom `dispatchBookingToTechs` already uses when a booking
has no eligible candidates — so `retryAwaitingDispatch`'s own query (`PAID`/`UNFULFILLED`, no
`technicianId`) picks it back up on its next 5-minute pass, with the blocked technician excluded
via the existing attempted-technicians mechanism. This reset is itself guarded: it is skipped when
a live `PENDING` attempt already exists, because `continueDispatchAfterOfferOutcome` can throw
*after* it has already created the next attempt (the failure is on a later write), and a
concurrent `expireStaleOffers` tick could also have already re-dispatched the booking in the same
window. Resetting to `PAID` in either of those interleavings would let `retryAwaitingDispatch`
mint a *second* attempt while a first one is still live; since attempt lookup returns only the
newest, the technician holding the first (legitimate) attempt would then receive a spurious `403
FORBIDDEN` on an offer they were correctly pushed. The guard is on the attempt's existence, not on
booking status, because a status check cannot distinguish "genuinely stuck" `SEARCHING` from
"dispatch already moved on and is fine" `SEARCHING` — both look identical on the booking document
alone.

That guard read and the `PAID` write are two sequential Cosmos round-trips — **tens of
milliseconds, not microseconds** — and are not wrapped in a single atomic operation
(`updateBookingFields` exposes no ETag-conditional write for this path). A re-dispatch landing in
that window still gets the `PAID` reset applied underneath it. The consequence of that residual
race is bounded and already described above: a second technician sees a recoverable, confusing
`403 FORBIDDEN` on an offer they were legitimately given — not a stall, and no money or booking is
lost. Accepted as a known, parked gap rather than closed, because closing it needs an atomic
primitive the repository layer does not currently expose.

### Offer expiry across the gate

Because `assertCanAccept` awaits a Cosmos read between the handler's expiry check and
`acceptAttempt`, the 90-second offer window can lapse *inside* the gate. `expireStaleOffers` sweeps
only every 30 seconds, so the attempt still reads `PENDING` for up to a tick after it has really
expired, and `acceptAttempt` checked only `status === 'PENDING'` — never expiry — while
`declineAttempt` had always checked both. The race predates this story (the checks used to be
synchronous, so the window was microseconds); the awaited gate widened it to the latency of a
ledger read, which is the point at which it becomes reachable in practice. Codex round 2 caught it.

Closed at two layers:

- **Repository (authoritative).** `acceptAttempt` now refuses an attempt whose `expiresAt` has
  passed, exactly as `declineAttempt` does. The window is shut at the write, not merely at one
  caller, so any future caller inherits the guard.
- **Handler (response shape).** After the gate returns, `acceptJobOfferHandler` re-evaluates the
  `expiresAt` it already holds and answers `410 OFFER_EXPIRED` — the same shape as the early
  check. `expiresAt` is immutable on the attempt document, so this needs no second read; re-reading
  would cost a round-trip and open a fresh window of its own.

The recheck sits **after** the `BLOCKED` and `INDETERMINATE` branches, deliberately. A blocked
technician's audit trail and the decline that walks the booking to the next candidate must happen
whatever the clock says; letting a 410 pre-empt them would lose the record of a real block and
leave the attempt for the sweeper instead of moving dispatch on. So the block path is byte-for-byte
unchanged, and only the `ALLOW` path can now answer 410.

One residual remains and is accepted: the repository does its own read, so an attempt can lapse in
the sub-millisecond between the handler's recheck and that read. `acceptAttempt` then returns
`null`, which historically mapped to `409 OFFER_ALREADY_TAKEN`. The handler re-checks the same
immutable `expiresAt` on the null branch and answers 410 when it has passed, 409 otherwise — so the
technician's answer stays accurate without any extra read. Either way the attempt is untouched and
the booking is recovered by `expireStaleOffers`; the distinction is about telling the technician the
truth, not about state.

### The enforcement flag and shadow mode

`holdEnforcementEnabled` (on `system/commission-config`, default `false`) is read through
`loadDispatchGates()`, which wraps the existing 5-minute in-process config cache. A flag flip
therefore takes **up to five minutes** to propagate to a running dispatch instance — an accepted,
intentional cost for a staged rollout, not a bug.

With enforcement off, the dispatch query runs unfiltered (`SELECT *` already returns
`commissionHold`), and every candidate that would have been excluded is logged. The log runs
against the **filtered** candidate set — after the true circular-radius haversine refinement, the
already-attempted/assigned exclusions, and the customer-block filter, and before ranking. An
earlier draft logged the raw bounding-box rows instead, which counted technicians who were never
eligible candidates and so overstated the enforcement impact; since this readout is the entire
evidential basis for the flip, an inflated count would have argued for a flip the data did not
support. Corrected after Codex round 2 — see the runbook for what that means for shadow data
already collected.

```
DISPATCH_HOLD_SHADOW_EXCLUSION bookingId=<id> technicianId=<id> state=BLOCKED outstandingPaise=<n> evaluatedAt=<iso>
```

The accept path logs the symmetric `ACCEPT_HOLD_SHADOW_BLOCK` when a would-be-blocked technician
accepts anyway while enforcement is off. A week of both log lines is the readout the owner reviews
before flipping the flag — see the runbook's shadow-mode procedure.

**The enforce-mode blind spot.** Once the hold predicate is in the SQL, excluded rows never come
back from Cosmos at all — there is nothing left in the result set to log a shadow exclusion for.
A booking that ends `UNFULFILLED` because every nearby technician happens to be `BLOCKED` is then
indistinguishable, from the logs alone, from a booking with genuinely no coverage in that area —
exactly the kind of on-call trap that turns a five-minute diagnosis into an hour of guessing. The
fix: **only on the zero-candidate path**, and only when enforcement is on, issue one
`SELECT VALUE COUNT(1)` (`countBlockedInRadius`) with the same geo/skill/online/suspended
predicates but an inverted hold condition, and log `DISPATCH_NO_TECHS bookingId=<id>
blockedByHold=<n>`. Zero extra cost on the common path (a booking that finds candidates); on the
dead-end path it converts a mystery into a number.

### The reconciler

`trigger-reconcile-commission-holds.ts`, timer `0 */15 * * * *` (every 15 minutes), does four
things in order, each independently guarded so one failure does not prevent the next:

1. **Drains `system/hold-repair`.** An `all: true` flag triggers a `FULL` sweep; specific ids get
   a per-id `recomputeCommissionHold`. A per-id failure re-enqueues that id (via
   `enqueueHoldRepair`) rather than losing it, and — after a review-round fix — a `FULL`-sweep
   failure on an `all: true` drain also re-enqueues `'ALL'`, since draining the queue already
   discarded the flag before the sweep itself could fail; without that fix an admin's explicit
   "recompute everything" request was silently lost for up to 90 minutes.
2. **`sweepAllHolds({ scope: 'EXPIRED_OVERRIDES' })` — every run, unconditionally, including a run
   where the repair queue was empty.** This is an E21-S02 carry-forward (that story's Task 6 /
   Ruling C): a lapsed admin override otherwise sits inert until something unrelated happens to
   touch that technician's receivables, leaving a technician who should be re-`BLOCKED` reading
   `CLEAR` indefinitely. This is the one step in the reconciler that must never be skipped, and it
   has a dedicated test asserting it runs on every invocation.
3. **`sweepAllHolds({ scope: 'FULL' })`, clock-gated to roughly every 90 minutes** —
   `Math.floor(Date.now() / 900_000) % 6 === 0`, i.e. every 6th 15-minute slot. **Deliberately
   derived from the wall clock, not a module-level counter**, because Azure Functions Consumption
   cold-starts constantly; a counter would reset to zero on every cold start, which either fires a
   full cross-partition sweep on nearly every invocation (if the reset default is "due") or drifts
   arbitrarily between concurrently-alive instances that each hold their own counter. The
   clock-derived slot number is stateless and identical across every instance regardless of when
   it last cold-started. This same clock-gated code path doubles as the rollout backfill.
4. **Writes `system/hold-reconciliation-summary`** — an E21-S02 carry-forward (that story's Task
   10 parked item): the admin dashboard previously drained every hold document plus a
   cross-partition `GROUP BY` on **every request**. The reconciler now does that drain once per
   15-minute run and writes the result to one document in the existing `system` container; the
   dashboard reads the summary and falls back to a live drain only when the summary is missing,
   older than 45 minutes (3 reconciler cycles), or the requested page extends past the summary's
   `topN` (100). Both paths route through the same pure `buildHoldRoster` function so they can
   never disagree about the numbers shown — verified during review by diffing the extracted
   function character-for-character against the original inline handler logic it replaced.

**The `HOLD_STALE_AFTER_MS` correction.** E21-S02's dashboard hardcoded this constant at 6 hours,
with a comment asserting the sweep ran on a 6-hourly cadence. The E21-S04 spec is binding and puts
the full-sweep cadence at 90 minutes — the two could not both be true, and the spec's binding
authority resolves the conflict. `HOLD_STALE_AFTER_MS` is corrected to `90 * 60 * 1000`, so the
`staleAfter` timestamp the admin console renders now describes a real recompute cadence instead of
a figure that was never true even before this story shipped.

### The `suspended` bug fix

`patchTechnicianAdminFields` sets `suspended: true` and `isOnline: false` in the same admin action,
so a suspended technician was previously excluded from dispatch only as a *side effect* of also
being marked offline. Any path that later flips `isOnline` back to `true` — including the
technician's own availability toggle, which an admin action does not lock — silently re-admitted a
suspended technician to the candidate pool. The fix adds an unconditional
`(NOT IS_DEFINED(c.suspended) OR c.suspended != true)` predicate to the base dispatch query (not
gated behind any flag — this is a correctness fix, not a rollout), matching the same predicate two
other admin-facing queries already carried (`admin/dashboard/summary.ts`,
`admin/dashboard/tech-locations.ts`). The dispatcher was the one query that mattered most and had
lacked it.

## Consequences

**Positive:**
- Enforcement, once flipped, is genuinely a single flag with a single blast radius: `dispatch-
  eligibility.ts` plus `assertCanAccept`. No other code path needs to change, and rollback is the
  same flag with no data migration (see the runbook).
- The Karnataka compliance posture extends cleanly to a second protected-from-ranking field using
  the exact same three-layer pattern ADR-0011 established, rather than inventing a new mechanism.
- The zero-candidate diagnostic (`DISPATCH_NO_TECHS ... blockedByHold=N`) converts what would
  otherwise be an opaque coverage failure into an immediately actionable number.
- The `suspended` predicate fix closes a real, previously-shipped dispatch-eligibility bug
  independent of anything else in this story.

**Negative:**
- **The accept path carries an extra Cosmos round-trip while the flag is off, and that is not
  free.** `assertCanAccept` calls `computeCommissionHold` unconditionally — even with
  `holdEnforcementEnabled: false`, where the answer is always `ALLOW` — because that read is what
  produces the accept-side `ACCEPT_HOLD_SHADOW_BLOCK` line. This is the price of having an
  accept-side shadow readout at all: without it the owner would be deciding the flip on dispatch
  data alone, blind to how often a blocked technician actually reaches the accept button. It is
  paid on the hottest path in the product, on every accept, from merge onward rather than from the
  flip. It also lengthened the offer-expiry TOCTOU described above from microseconds to a real
  Cosmos read, which had to be closed at the repository layer as a direct consequence. If the
  readout is ever judged complete, this round-trip should be put behind the flag rather than left
  standing.
- **The story is not fully dark on merge.** The 15-minute reconciler is not flag-gated, so hold
  states and the admin commission dashboard's figures begin moving as soon as this merges. Nothing
  a technician or customer sees changes, but an admin's numbers do, and any rollback story that
  assumes "flip the flag back and everything is as it was" is only true of the gating, not of the
  reconciliation.
- **The SQL predicate makes enforce-mode exclusions invisible except on the zero-candidate path.**
  A booking that finds at least one eligible (non-blocked) candidate produces no signal at all
  about how many nearby technicians were excluded by the hold — the shadow-log mechanism only
  works while enforcement is off. Once flipped, ongoing visibility into "how much is this gate
  actually filtering, day to day" is materially reduced from the shadow-mode readout that preceded
  the flip.
- **The reconciliation summary is up to 15 minutes stale, and technician display names inside it
  up to 45 minutes stale** (`SUMMARY_MAX_AGE_MS`, three reconciler cycles) — an admin can see a
  hold state, or a name, that lagged a recent remittance or a recent rename.
- **The summary caps at top-100 technicians** (`HOLD_SUMMARY_TOP_N`); beyond that the dashboard
  falls back to a live drain for the requested page. `hasMore` is deliberately computed from
  `totalTechnicianCount` (the true roster size), not from the served row count — an earlier draft
  of this story computed it from the served count, which silently truncated the admin console at
  exactly 100 held technicians (no `continuationToken`, no error, 50 technicians would simply
  vanish from the list at pilot-adjacent scale). Caught in review before it shipped.
- **A `commissionHold` write that never lands leaves a technician wrongly dispatchable for up to
  90 minutes** — the interval between full sweeps, absent an explicit repair-queue entry catching
  it sooner.
- **The guard read and the `PAID` reset in the accept-failure recovery path are not atomic** (a
  window of tens of milliseconds, two sequential Cosmos calls). A re-dispatch landing inside that
  window still receives the reset, producing a recoverable spurious `403 FORBIDDEN` for a second
  technician rather than the permanent stall the guard exists to prevent. Accepted; closing it
  needs an ETag-conditional write the repository layer does not currently expose.
- **`sumDueGroupedByTechnician` types its rows via an unvalidated `query<T>` cast.** A Cosmos
  aggregate `SUM` that evaluates over an `undefined` field is projected *out* of the result rather
  than returned as `0`, so `outstandingPaise` on a summary row could in principle arrive
  `undefined` and NaN the dashboard's total. Pre-existing — this is E21-S02's surface, not
  introduced here — and self-healing on the next sweep, but left un-fixed because no mock in this
  codebase can currently exercise real Cosmos's aggregate-page shape (see
  `feedback_cosmos_iterator_mocks`).
- **`listTechniciansWithHold` is an unused export** left over from E21-S02 — added "for the admin
  dashboard," which in fact uses `listAllTechniciansWithHold`. Not removed here: deleting an
  exported function is a behaviour change on E21-S02's surface and out of this story's scope.
- **Dispatch is the component that ends up *defining* what "KYC verified" means for this system,
  because nothing else does.** The PRD asserts "no half-verified dispatches" (FR-1.2/FR-3.1) but
  the system has no authoritative, single-field statement of KYC completion: `kyc.kycStatus` is a
  progress marker whose terminal `COMPLETE` value nothing writes, and the two KYC endpoints do not
  enforce step order (`submit-pan-ocr.ts` accepts a PAN submission regardless of whether
  `submit-aadhaar.ts` was ever called). This ADR therefore takes the definition on itself:
  **KYC-verified, for dispatch purposes, means both automated steps succeeded** — DigiLocker
  Aadhaar (`aadhaarVerified = true`) and PAN OCR (`panHash` present and non-null). That is a
  narrower definition than "the operator considers this technician verified": it makes no room for
  a manual override, an offline verification, or a `PENDING_MANUAL`/`MANUAL_REVIEW` record that an
  admin has since cleared. Any of those technicians will be excluded from dispatch while
  `enforceKycInDispatch` is on, and there is currently no admin surface to admit them. If a manual
  KYC path is ever added, the correct fix is to give the system a real completion fact for the
  predicate to read — not to loosen the predicate back toward the status scalar, which is what
  produced three consecutive review findings.
- **The two-fact predicate is a data-shape check, not an ordering guarantee.** It is correct in
  either completion order precisely because it does not depend on order, so the missing
  step-ordering enforcement in `submit-pan-ocr.ts` no longer produces a wrong dispatch decision.
  But it does mean an attacker or a bug that could write `kyc.aadhaarVerified` or `kyc.panHash`
  outside the two endpoints would defeat the gate directly. Adding step-order enforcement inside
  `submit-pan-ocr.ts` (rejecting a PAN submission unless `aadhaarVerified === true`) remains an
  open follow-up — it is a behaviour change to a different endpoint and was ruled out of scope for
  this story.
- **Legacy `kyc` sub-objects fail CLOSED, by design.** A technician document carrying a `kyc`
  object written before E19-S01 (holding `panNumber` / `panNumberEncrypted` but no `panHash`) is
  excluded once the flag is on, even if that technician was in fact fully verified under the old
  shape. This is deliberate — partial information must not be read as completion — but it means
  the flag flip needs a per-environment data check first. See `docs/runbook.md`, "Precondition
  before flipping `enforceKycInDispatch`"; as of 2026-09-09 production holds zero such documents.

**Neutral:**
- `enforceKycInDispatch` ships fully implemented (a `requireKyc` predicate option, same fail-open
  intent but a two-fact predicate rather than the hold predicate's single `!=` shape) but stays `false` and is not part of this rollout — turning it on is a separate
  owner decision with its own readout, not bundled with the commission-hold flip.
- Admin reassign (`reassignOrderHandler`) is deliberately **not** gated. An owner reassigning a job
  to a technician who owes money is a sanctioned override, not a bug; the requirement is that it
  is recorded (`readTechnicianGateState` feeds the audit payload), not prevented.

## Alternatives considered

- **In-memory filtering instead of an SQL predicate.** Fetch the same candidate set the query
  fetches today and filter blocked technicians out in application code, symmetric with how
  `blockedCustomerIds` is already filtered post-query. Rejected: it does not reduce RU at all (the
  same rows are read from Cosmos regardless of where the filter is applied) and buys only
  code-shape symmetry with the customer-block filter — it does not fix the scaling problem an SQL
  predicate fixes (fewer rows returned, fewer rows to rank), and it does not resolve the
  enforce-mode blind spot either way, since an in-memory filter still discards the same
  information before it reaches a log line unless it is explicitly logged, which is exactly what
  the SQL-predicate design already does via the shadow-mode/zero-candidate mechanisms.
- **Blocking the admin reassign path.** Rejected: an owner override must remain possible by
  design — the whole point of a manual reassignment is that a human is making a judgment call the
  algorithm should not veto. Recording the decision (via `readTechnicianGateState`'s
  best-effort audit enrichment) is the correct control; refusing it is not.
- **A module-level counter for the full-sweep cadence** instead of the clock-derived slot number.
  Rejected: Azure Functions Consumption cold-starts on essentially every invocation at pilot
  traffic, so an in-memory counter resets constantly and cannot reliably count to 6 — it either
  full-sweeps far more often than intended or drifts unpredictably between whichever instance
  happens to be warm. The clock-derived `floor(now / interval) % 6` needs no state and gives every
  instance, cold or warm, the identical answer for the identical wall-clock minute.
- **Failing the accept closed with a 403 on infra errors**, i.e. folding `INDETERMINATE` into
  `BLOCKED`. Rejected: it reports phantom debt to a technician whose actual balance was never
  read, and it declines an attempt (permanently losing that booking slot for them) over a
  transient condition unrelated to their standing. The chosen `503 HOLD_CHECK_UNAVAILABLE` still
  fails closed on the *accept* (nothing is committed) while failing open on the *technician's
  reputation* (no accusation is made, and the attempt survives for a retry).

## RU / p95 measurements

**Not measured — no Cosmos endpoint reachable from the implementing session.** This worktree has
no `COSMOS_ENDPOINT` (or equivalent connection) configured and no local emulator running, so
neither the baseline `getTechniciansWithinRadius` call nor the gated
(`{ excludeBlockedHolds: true, requireKyc: true }`) variant could be exercised against a real
Cosmos account to read `x-ms-request-charge` or measure p95 latency. No numbers are fabricated
here.

**TODO (blocking, before `holdEnforcementEnabled` is flipped in any environment with real data):**
someone with production or staging Cosmos access must run both predicate shapes ten times each
against a realistic technician-partition size, record baseline RU, gated RU, the delta, and p95
latency for both, and update this section with the measured numbers before the flag is turned on
anywhere the extra `AND` clauses' cost matters. At pilot scale (tens of technicians per query) the
expectation is the delta is small — an extra `AND` on an already-filtered, already-indexed set of
fields — but that expectation has not been verified and should not be treated as a measurement.

## References

- Spec: `docs/superpowers/specs/2026-09-08-e21-s04-dues-gated-dispatch-design.md`
- `docs/adr/0031-single-partition-commission-ledger.md` — the ledger and cache this ADR consumes
- `docs/adr/0011-karnataka-decline-history-isolation.md` — the gate-not-ranking pattern this ADR
  applies to a second field
- `docs/adr/0027-cross-partition-query-guardrails.md` — the cross-partition helper registration
  discipline the reconciler's new helpers follow
- `api/.semgrep.yml` — `no-commission-hold-in-ranking`, `karnataka-no-decline-in-dispatcher`
- `api/src/services/dispatch-eligibility.ts` — the only hold-aware dispatch module
- `api/src/cosmos/technician-repository.ts` — `getTechniciansWithinRadius`, `countBlockedInRadius`,
  `readTechnicianGateState`
- `api/src/services/commission-hold.service.ts` — `assertCanAccept`
- `api/src/functions/job-offers.ts` — the accept-handler wiring and the booking-reset recovery path
- `api/src/functions/trigger-reconcile-commission-holds.ts` — the reconciler
- `api/src/functions/admin/finance/commission-receivables.ts` — the summary-first dashboard read
- `docs/stories/E21-S04-dues-gated-dispatch.md` — the story record and the accept contract E21-S05
  consumes
- `docs/dispatch-algorithm.md` §4 — the public transparency document this ADR's eligibility filter
  is reflected in
- `docs/runbook.md` — "Technician says he is blocked from accepting jobs", "Shadow-mode readout
  before flipping `holdEnforcementEnabled`"
