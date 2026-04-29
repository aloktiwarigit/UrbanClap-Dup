# ADR-0011: Karnataka decline-history isolation enforced at four layers

- **Status:** accepted
- **Date:** 2026-04-26
- **Deciders:** Alok Tiwari
- **Supersedes:** the compliance section (§"Compliance enforcement") of ADR-0006, which contemplated `acceptance_rate_30d` as a candidate filter and ranking input. The implementation in `api/src/services/dispatcher.service.ts` never adopted that field, and this ADR ratifies the stricter actual behavior.

## Context

The **Karnataka Platform Based Gig Workers (Social Security and Welfare) Act 2025** came into force in May 2025 with implementing rules notified in November 2025. FR-9.1 of our PRD and NFR-C-1 of our architecture both reflect its core obligation: **technician declines must not be used, directly or indirectly, in algorithmic decisions that affect a technician's earnings**. The Central Social Security Code 2025 (Chapter IX) reinforces this for platform workers nationally.

The Karnataka Labour Department may **audit the platform's dispatch algorithm with one week's notice**. The acceptable audit response is not "we trust developers not to add decline-derived features"; it is a demonstrable, multi-layer technical isolation that no individual code change can circumvent.

ADR-0006 already named this constraint, but its "Compliance enforcement" section relied on (a) the absence of decline fields on the technician read-model and (b) a planned integration test. Since ADR-0006 was written:

- The implementation diverged in the strict direction — even `acceptance_rate_30d` (which ADR-0006 proposed) was never added, because it is mathematically `1 − declineRate` and therefore decline-derived.
- E08-S04 added a block-list filter to the dispatcher path, increasing the surface area of code that must remain compliant.
- The actual `dispatcher-up-ranking.test.ts` test passes, but it does not on its own assert *which* fields the function is allowed to read — it only asserts ranking invariance for a single phantom field. A motivated developer could add an `acceptRate` term and the existing test could still pass given specific inputs.

E10-S01 closes that gap.

## Decision

Enforce decline-history isolation at **four independent layers**:

### a. Schema layer

`TechnicianProfile` (`api/src/schemas/technician.ts`) and `DispatchAttemptDoc` (`api/src/schemas/dispatch-attempt.ts`) define **no decline-derived fields**. The dispatch attempt status set is exactly `'PENDING' | 'ACCEPTED' | 'EXPIRED'` — a tech who fails to accept within 30 s causes the attempt to **EXPIRE** for them; the system records no per-tech decline event for ranking purposes.

### b. Source-code lint layer (Semgrep)

`api/.semgrep.yml` defines rule `karnataka-no-decline-in-dispatcher` which fails with severity `ERROR` on any occurrence of `declineCount`, `declineHistory`, `declineRatio`, `pastDeclines`, `rejectionCount`, `rejectionHistory`, `acceptRate`, or `acceptanceRate` in:

- `api/src/services/dispatcher.service.ts`
- `api/src/cosmos/technician-repository.ts`
- `api/src/cosmos/dispatch-attempt-repository.ts`
- `api/src/schemas/technician.ts`
- `api/src/schemas/dispatch-attempt.ts`

`api-ship.yml` loads `api/.semgrep.yml` alongside the public Semgrep rule packs.

### c. Runtime test layer (Vitest)

Two tests in the API integration suite enforce the invariant on every CI run:

- `api/tests/integration/dispatcher-up-ranking.test.ts` — asserts `rankTechnicians` is invariant to phantom decline fields and stable across all input permutations.
- `api/tests/integration/dispatcher-data-isolation.test.ts` — file-scans the dispatcher source files for forbidden tokens and inspects the Zod schema `.shape` to assert no decline- or rejection-prefixed field exists.

### d. Process layer

This ADR + explicit owner approval are required to relax the invariant. Any future ranking improvement that genuinely benefits from decline-derived data must:

1. Open an ADR superseding this one.
2. Receive explicit written owner approval (per `CLAUDE.md` "Forbidden" section).
3. Demonstrate a separate code path that is structurally unable to feed `dispatcher.service.ts` (separate file, separate import graph) for analytics/dashboard use cases.

## Consequences

**Positive:**
- The compliance posture is auditable in source — a Karnataka Labour Department auditor can be handed `docs/dispatch-algorithm.md` plus the four enforcement files and verify the property end-to-end.
- The four layers are independent: schema removal alone is insufficient, lint alone is insufficient, runtime test alone is insufficient. All four would have to be subverted for a violation to ship.
- Future ranking improvements based on **non-decline** signals (`completedJobCount`, distance, rating) are explicitly allowed without revising this ADR.

**Negative:**
- Adds a Semgrep configuration dependency to the API CI pipeline (~5 s extra step).
- Adds two integration tests to the API suite (~20 ms total).
- Future legitimate analytics features that need decline data must live in a separate code path with no import line-of-sight to `dispatcher.service.ts` — this constrains module organization.

**Neutral:**
- The forbidden-token list is finite and may need to grow if future code introduces synonyms (e.g., `noShowRate`). The lint rule and the data-isolation test should be extended together when that happens.

## Alternatives considered

- **Source-code review only.** Rejected — not auditable, depends on reviewer vigilance, fails the "one week's notice" audit standard.
- **Runtime test only (existing `dispatcher-up-ranking.test.ts`).** Rejected — invariance for one phantom field does not prove the function reads no decline-derived field at all. A developer could add `acceptRate` and craft test inputs that still pass.
- **Schema-only enforcement.** Rejected — the field could be added to the schema later, or read from a sibling collection (`booking_events`) without a schema change to `TechnicianProfile`.
- **Centralizing all dispatch features in a single allowlist module.** Considered for future work; the four-layer approach is the minimum viable enforcement for the launch gate. A typed allowlist could supplement (not replace) these layers in a later refactor.

## References

- `docs/prd.md` — FR-9.1, NFR-C-1
- `docs/adr/0006-dispatch-algorithm.md` — original dispatch architecture (this ADR tightens its compliance section)
- `docs/dispatch-algorithm.md` — public-facing algorithm transparency document
- `api/src/services/dispatcher.service.ts`
- `api/src/cosmos/technician-repository.ts`
- `api/src/schemas/technician.ts`
- `api/src/schemas/dispatch-attempt.ts`
- `api/.semgrep.yml`
- `api/tests/integration/dispatcher-up-ranking.test.ts`
- `api/tests/integration/dispatcher-data-isolation.test.ts`
- Karnataka Platform Based Gig Workers (Social Security and Welfare) Act 2025 (in force May 2025; rules notified Nov 2025)
- Central Social Security Code 2025, Chapter IX — Platform Workers
- DLA Piper analysis: *"Karnataka's new platform-based gig worker protection"* (Apr 2025)
