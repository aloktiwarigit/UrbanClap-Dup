# Dispatch Algorithm — Public Transparency Document

**Owner:** Alok Tiwari
**Last reviewed:** 2026-09-09
**Authority:** Karnataka Platform Based Gig Workers (Social Security and Welfare) Act 2025, FR-9.1, NFR-C-1.
**Companion artifacts:** `docs/adr/0006-dispatch-algorithm.md`, `docs/adr/0011-karnataka-decline-history-isolation.md`, `docs/adr/0032-commission-hold-is-an-eligibility-gate.md`, `api/src/services/dispatcher.service.ts`, `api/src/services/dispatch-eligibility.ts`, `api/.semgrep.yml`, `api/tests/integration/dispatcher-up-ranking.test.ts`, `api/tests/integration/dispatcher-data-isolation.test.ts`, `api/tests/unit/dispatch-ranking-invariance.test.ts`.

## 1. Purpose

The Karnataka Act of 2025 grants platform technicians the **right to refuse** offered tasks without consequence. The Karnataka Labour Department may audit the platform's dispatch algorithm with **one week's notice** to confirm compliance.

This document is the artifact handed to such an auditor. It describes — with no abstraction — every input the dispatcher uses to rank technicians for a booking offer, and lists features deliberately **not** used.

## 2. Algorithm Overview

`rankTechnicians(candidates, bookingLat, bookingLng)` is a pure function in `api/src/services/dispatcher.service.ts`. It is invoked by `dispatchBookingToTechs` after Cosmos has returned a candidate set within the active dispatch radius (10 km, expanding to 15 km on no-show redispatch).

Only the single nearest-ranked eligible technician receives the job offer, as a 90-second push notification. If that technician declines, or the offer expires without a response, the booking moves on to the next-nearest eligible technician on the ranked list, and so on until someone accepts or the candidate set is exhausted. No two technicians are ever offered the same booking at the same time. This document covers the **ranking** step only.

## 3. Input features actually used by `rankTechnicians`

| Feature | Source field | Role |
|---|---|---|
| Distance to booking | `tech.location.coordinates` (haversine to `bookingLat`/`bookingLng`) | **Primary sort key** (ascending) |
| Tech rating | `tech.rating` (range 0–5, optional) | **Secondary sort key, tie-break only** (descending) |

That is the complete list. No other field on `TechnicianProfile` is read by the ranking function.

## 4. Eligibility filters (not ranking inputs)

Before `rankTechnicians` ever runs, the candidate set for a booking is narrowed down to
technicians who are actually eligible for the job. None of these checks influence a
technician's **position** within the ranked list — they only decide whether a technician
appears in it at all. A technician is either offered the job in their normal ranked position,
or not offered it at all; there is no "offered, but lower down" outcome for any of these filters.

The candidate set is filtered by:

- **Service area and radius** — the booking's location must fall within the technician's
  service-area polygon and the active dispatch radius (10 km, expanding to 15 km on a no-show
  redispatch).
- **Skill match** — `tech.skills` must contain the booking's `serviceId`.
- **Online and available** — `tech.isOnline` and `tech.isAvailable` must both be `true`.
- **Not suspended** — an admin-suspended technician (`tech.suspended`) is excluded
  unconditionally, regardless of their online/available status. (Suspension previously only took
  effect as a side effect of an admin action also setting the technician offline; a technician
  who later toggled themselves back online could silently re-enter the candidate pool. Fixed as
  part of E21-S04; see ADR-0032.)
- **Not blocked by the customer** — a technician on that customer's `blockedCustomerIds` list for
  the booking's customer is excluded.
- **Not already attempted for this booking** — a technician who already held (and lost, declined,
  or timed out on) an offer attempt for the same booking is excluded from a redispatch.
- **KYC-verified — only when the operator has this enabled.** When enabled
  (`enforceKycInDispatch` on the `system/commission-config` document), a technician whose KYC
  flow has not reached full completion is excluded from the candidate set. "Full completion"
  means the nested KYC record's status has reached the terminal state of the Aadhaar-then-PAN
  DigiLocker/OCR flow described in FR-1.2, and the technician's Aadhaar step is not on record as
  explicitly failed or never done. **This filter is off by default**, so today it excludes
  nobody — KYC currently plays no part in dispatch. A technician who has never had any KYC
  information recorded at all is never excluded by this check, whether the flag is on or off;
  only a technician with an explicit, not-yet-complete KYC status is affected once the flag is
  switched on. (This bullet was corrected after an external review caught the original
  implementation reading a different, unmaintained field — see ADR-0032's "Corrected after Codex
  review" note.)
  This check reads only the status the system has recorded for each step; it does not itself
  confirm the two verification steps happened in the correct order. The system's Aadhaar and PAN
  submission endpoints do not currently enforce that the identity step must be completed before
  the tax-ID step is accepted, so in principle a technician could reach the PAN-recorded state
  without the Aadhaar step ever having succeeded. This filter is written to still exclude that
  specific case — an on-record Aadhaar failure blocks the technician even if the PAN step
  separately succeeded — but it relies on how today's data happens to be written, not on an
  enforced order of operations. See ADR-0032 (Consequences — negative) and the runbook for the
  residual risk and the operational precondition that must be verified before this filter is
  switched on in production.
- **Not currently blocked by an unpaid commission balance — only when the operator has this
  enabled.** When enabled (`holdEnforcementEnabled` on the `system/commission-config` document),
  a technician whose cached `commissionHold.state` is `BLOCKED` is excluded from the candidate
  set for new job offers. **This filter is off by default and is a per-deployment operator
  setting** — see §7 and ADR-0032 for the enforcement mechanics, the shadow-mode readout
  procedure, and why the underlying predicate is written to fail open on a technician document
  that has never had a hold computed.
- Geographic bounding-box predicate `ST_WITHIN` (a square, refined to the true circular radius by
  an in-process haversine filter after the Cosmos query returns).

**The ranked order is distance, then rating. Nothing else.** Neither decline history (ADR-0011)
nor commission-hold state (ADR-0032) may influence a technician's position within the candidate
list — both are eligibility filters applied before ranking, never ranking inputs. A technician
who owes money above the block threshold, like a technician with a large but compliant decline
history, is either offered the job in their normal position or excluded from the candidate set
entirely; neither is ever sorted lower within it. This is enforced structurally, mechanically
(Semgrep), and at runtime (an invariance test) for both fields — see §7.

## 5. Input features deliberately NOT used

The following are **forbidden by design** and **enforced at four layers** (see §7):

- Decline count (any window)
- Decline ratio
- Declines in the last N days/hours
- **Acceptance rate** (mathematically equivalent to `1 − declineRate`, hence decline-derived even when positively framed)
- Response time / time-to-accept
- Online hours per week
- Geographic preference history
- Per-customer relationship history (the `rating` field is platform-wide, not per-customer)

`completedJobCount` exists on the schema for settlement and onboarding purposes but is currently **not** read by `rankTechnicians`. ADR-0011 explicitly carves out that future ranking improvements built on `completedJobCount` (or other non-decline signals) do **not** require revising ADR-0011 — only decline-derived features do.

## 6. Pseudocode (transcribed verbatim from `dispatcher.service.ts`)

```ts
export function rankTechnicians(
  techs: TechnicianProfile[],
  bookingLat: number,
  bookingLng: number,
): TechnicianProfile[] {
  return techs
    .map((t) => ({
      tech: t,
      // GeoJSON coordinates: [longitude, latitude]
      distanceKm: haversine(
        bookingLat, bookingLng,
        t.location.coordinates[1], t.location.coordinates[0],
      ),
    }))
    .sort((a, b) => {
      // Primary: distance, ascending
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      // Secondary tie-break: rating, descending. Decline history MUST NEVER appear here.
      return (b.tech.rating ?? 0) - (a.tech.rating ?? 0);
    })
    .map((x) => x.tech);
}
```

## 7. Enforcement layers

The compliance invariant is enforced at four independent layers so that any single oversight is caught:

1. **Schema layer.** `TechnicianProfileSchema` and `DispatchAttemptDocSchema` (`api/src/schemas/`) define no decline-derived fields. The dispatcher cannot read what does not exist.
2. **Source-code lint layer.** `api/.semgrep.yml` rule `karnataka-no-decline-in-dispatcher` blocks merges that introduce `declineCount`, `declineHistory`, `declineRatio`, `pastDeclines`, `rejectionCount`, `rejectionHistory`, or `acceptRate` into the dispatcher read-path source files.
3. **Runtime test layer.** Two CI-enforced tests:
   - `dispatcher-up-ranking.test.ts` — asserts ranking is invariant to phantom decline fields and stable across all input permutations.
   - `dispatcher-data-isolation.test.ts` — file-scans the dispatcher source for forbidden tokens and inspects schema shapes.
4. **Process layer.** ADR-0011 requires explicit owner approval to relax this invariant.

**Commission-hold state is held to the same gate-not-ranking standard (ADR-0032), enforced at
three layers** (no schema layer is needed here — the risk is an existing field, `commissionHold`,
leaking into the wrong function, not a new field needing to be kept off a schema):

1. **Structural layer.** `api/src/services/dispatch-eligibility.ts` is the only module allowed to
   turn hold/config state into anything the dispatcher acts on, and it only ever produces a
   boolean pair of predicate options or a logging side effect — never an ordering.
2. **Source-code lint layer.** `api/.semgrep.yml` rule `no-commission-hold-in-ranking` blocks
   merges that reference `commissionHold`, `outstandingPaise`, `dueCount`, or `holdState` inside a
   `.sort()` comparator or the body of `rankTechnicians`.
3. **Runtime test layer.** `api/tests/unit/dispatch-ranking-invariance.test.ts` asserts
   `rankTechnicians`'s output order is unchanged under arbitrary mutation of `commissionHold`
   across the candidate set.

## 8. Audit response procedure

On request from the Karnataka Labour Department:

1. **Within 24 hours:** send this document (`docs/dispatch-algorithm.md`) and `docs/adr/0011-karnataka-decline-history-isolation.md` at the SHA of the most recent production release.
2. **Within 1 week:** extract `api/src/services/dispatcher.service.ts`, `api/src/cosmos/technician-repository.ts`, `api/src/schemas/technician.ts`, and the two test files at the same SHA, and append to the audit response.
3. **On request:** demonstrate the CI failure mode by adding `pastDeclines` to `dispatcher.service.ts` in a sandbox branch — both the Semgrep rule and the data-isolation test will fail before merge.

## 9. Document maintenance

- Reviewed at every minor release of the API package.
- Any change to `rankTechnicians` requires updating §3 and §6 of this document **in the same commit**.
- Owner contact: Alok Tiwari (per project root `CLAUDE.md`).
