# ADR-0030: Lower the launch gate to one technician and activate all catalogue services

- **Status:** Accepted
- **Date:** 2026-09-15
- **Deciders:** Alok Tiwari (owner)

## Context

The catalogue carried a launch gate asserted in `api/tests/scripts/seed-technicians.test.ts`:
every active category and service needed >=2 online technicians before it could ship. The
`appliance-repair` category and five services (fridge repair, cooler service, washing-machine
repair, CCTV camera installation, inverter install/service) were held at `isActive: false`
behind that gate.

Two facts about the gate as it stood:

1. It asserted over the fixed 10-technician fixture in `api/scripts/seed-technicians.ts`, never
   over production. It could not and did not measure real coverage.
2. Its failure message claimed "KYC-approved + online" but the filter only checked `isOnline`.

Production state when this decision was taken: 17 technicians, 6 dispatchable, **0** with
`kycStatus === 'APPROVED'`, and only 3 physically inside the Ayodhya pilot region.

## Decision

Lower the gate from >=2 to >=1 eligible technician, and activate all six documents.

The owner was shown the coverage numbers above and directed activation regardless — first
"even if they don't have any technician", then settling on a threshold of one.

The gate's filter is also corrected to check `kycStatus === 'APPROVED'` alongside `isOnline`,
so the assertion now means what its message says.

## Consequences

- A service may ship with exactly one technician. If that technician goes offline the service
  has zero coverage, and bookings stick in dispatch silently with no customer-facing error —
  the same failure shape as the documented radius coverage gap. Accepted.
- The gate still catches a service added with no fixture coverage at all, so it retains value
  for future catalogue additions.
- The gate remains fixture-only. It is not evidence of production coverage and must not be
  cited as such. Measure production coverage by querying Cosmos directly, filtering by
  geography as well as `isOnline` / `isAvailable`.
- Dispatch does not filter on `kycStatus` at all, so this change does not affect the separate,
  unresolved fact that unverified technicians receive jobs.

## Alternatives considered

- **Keep the gate at 2 and onboard technicians first.** Rejected by the owner as too slow for
  the pilot.
- **Delete the gate.** Rejected — it still catches a service added with no coverage whatsoever.
