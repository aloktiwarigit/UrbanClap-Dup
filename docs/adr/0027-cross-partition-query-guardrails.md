# ADR-0027: Cross-Partition Cosmos Query Guardrails

**Status:** Accepted  
**Date:** 2026-05-18  
**Story:** E19-S03  
**Threat model:** I-A3 (cross-partition data exposure via unbounded queries)

## Context

Several Cosmos helpers in `api/src/cosmos/` run cross-partition fan-outs without an explicit
`partitionKey` option:

- `complaints-repository.ts` — `getRepeatOffenders`, `getOverdueComplaints`, `queryComplaints`,
  `findRatingShieldEscalation`, and related helpers
- `audit-log-repository.ts` — `queryAuditLog`
- `rating-repository.ts` — `ratingRepo.getAllByTechnicianId`

These are intentional today: pilot scale (≤5,000 bookings) makes per-partition reads impractical,
and the calling Azure Functions all enforce authentication middleware. The risk is not the current
code but a future endpoint that forwards user-controlled query filters into one of these helpers
without the caller-claim check — silently exposing another tenant's data.

This ADR applies the **Karnataka isolation pattern** (introduced in ADR-0011) to cross-partition
queries: a Semgrep gate that makes the risk visible at code-review time, paired with a static
coverage test that locks the caller-scope contract.

## Decision

Three-layer defence-in-depth:

### Layer 1 — `no-user-controlled-cosmos-query` (Semgrep ERROR)

Added to `api/.semgrep.yml`. Fires on any `.items.query()` call where the `query` string is a
template literal with `${...}` interpolation. Forces all filter values through the parameterised
`parameters: [{ name: '@param', value: ... }]` array.

Fires at ERROR severity — blocks CI on any new violation.

### Layer 2 — `cross-partition-query-must-have-tenant-filter` (Semgrep WARNING)

Added to `api/.semgrep.yml`, scoped to the three repository files. Fires on any `.items.query()`
call without an explicit `{ partitionKey: ... }` option. Existing helpers fire this warning by
design and carry `// SEMGREP-JUSTIFIED:` comments documenting the caller-scope guarantee.

Fires at WARNING severity — visible as PR annotations; does not break CI for justified helpers.

### Layer 3 — Caller-scope coverage test

`api/tests/cosmos/cross-partition-tenant-filter.test.ts` reads `api/src/functions/` statically
and asserts that every file importing a flagged cross-partition helper also imports at least one
of: `requireAdmin`, `requireSuperAdmin`, `requireCustomer`, `verifyTechnicianToken`, or uses
`app.timer` (system trigger). The test also verifies rule presence in `.semgrep.yml` and
`// SEMGREP-JUSTIFIED:` comments above each cross-partition function.

## Consequences

- Any new cross-partition query in the three repository files fires a WARNING PR annotation.
- Any attempt to interpolate user input directly into a Cosmos query string fails CI with ERROR.
- Adding a new caller of a cross-partition helper without an auth middleware causes the coverage
  test to fail.
- Existing helpers remain unchanged at the data layer; RBAC is the enforcing layer.

## Future work

- Phase 2: assign a dedicated Cosmos read-only Managed Identity per tenant partition to enforce
  partitioning at the storage layer, making the RBAC-only guarantee unnecessary.
- Phase 2: migrate `getRepeatOffenders` and `queryComplaints` to a serverless read-replica or
  materialized view so full-partition scans no longer hit the write-path RU budget.
