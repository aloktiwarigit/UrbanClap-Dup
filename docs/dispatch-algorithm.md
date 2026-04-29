# Dispatch Algorithm — Public Transparency Document

**Owner:** Alok Tiwari
**Last reviewed:** 2026-04-26
**Authority:** Karnataka Platform Based Gig Workers (Social Security and Welfare) Act 2025, FR-9.1, NFR-C-1.
**Companion artifacts:** `docs/adr/0006-dispatch-algorithm.md`, `docs/adr/0011-karnataka-decline-history-isolation.md`, `api/src/services/dispatcher.service.ts`, `api/.semgrep.yml`, `api/tests/integration/dispatcher-up-ranking.test.ts`, `api/tests/integration/dispatcher-data-isolation.test.ts`.

## 1. Purpose

The Karnataka Act of 2025 grants platform technicians the **right to refuse** offered tasks without consequence. The Karnataka Labour Department may audit the platform's dispatch algorithm with **one week's notice** to confirm compliance.

This document is the artifact handed to such an auditor. It describes — with no abstraction — every input the dispatcher uses to rank technicians for a booking offer, and lists features deliberately **not** used.

## 2. Algorithm Overview

`rankTechnicians(candidates, bookingLat, bookingLng)` is a pure function in `api/src/services/dispatcher.service.ts`. It is invoked by `dispatchBookingToTechs` after Cosmos has returned a candidate set within the active dispatch radius (10 km, expanding to 15 km on no-show redispatch).

The top-3 ranked technicians receive a 30-second FCM job offer simultaneously. The first to accept wins; the others receive a "no longer available" message. This document covers the **ranking** step only.

## 3. Input features actually used by `rankTechnicians`

| Feature | Source field | Role |
|---|---|---|
| Distance to booking | `tech.location.coordinates` (haversine to `bookingLat`/`bookingLng`) | **Primary sort key** (ascending) |
| Tech rating | `tech.rating` (range 0–5, optional) | **Secondary sort key, tie-break only** (descending) |

That is the complete list. No other field on `TechnicianProfile` is read by the ranking function.

## 4. Implicit prerequisite filters (not ranking inputs)

These are applied by the Cosmos query in `getTechniciansWithinRadius` **before** ranking, so they never participate in scoring:

- `tech.skills` — must contain the booking's `serviceId`
- `tech.kycStatus` — must equal `'APPROVED'`
- `tech.isOnline` — must be `true`
- `tech.isAvailable` — must be `true`
- Geographic bounding-box predicate `ST_WITHIN`

Plus a service-side circle filter on the haversine distance (square → circle), and exclusion of the no-show technician on redispatch.

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

## 8. Audit response procedure

On request from the Karnataka Labour Department:

1. **Within 24 hours:** send this document (`docs/dispatch-algorithm.md`) and `docs/adr/0011-karnataka-decline-history-isolation.md` at the SHA of the most recent production release.
2. **Within 1 week:** extract `api/src/services/dispatcher.service.ts`, `api/src/cosmos/technician-repository.ts`, `api/src/schemas/technician.ts`, and the two test files at the same SHA, and append to the audit response.
3. **On request:** demonstrate the CI failure mode by adding `pastDeclines` to `dispatcher.service.ts` in a sandbox branch — both the Semgrep rule and the data-isolation test will fail before merge.

## 9. Document maintenance

- Reviewed at every minor release of the API package.
- Any change to `rankTechnicians` requires updating §3 and §6 of this document **in the same commit**.
- Owner contact: Alok Tiwari (per project root `CLAUDE.md`).
