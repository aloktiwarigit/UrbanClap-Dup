# E19-S03 — Cross-Partition Query Guardrails (Threat I-A3 Mitigation)

**Tier:** Feature security-sensitive | **Deps:** none | **Threat:** I-A3 (`docs/threat-model.md` §A.4)
**Goal:** Prevent future endpoints from accidentally exposing cross-partition data via
unbounded queries that forward user-controlled filters.

---

## Problem statement

Several Cosmos query helpers execute without an explicit `partitionKey` option, fanning
out across all partitions:

- `complaintRepo.getRepeatOffenders` (`api/src/cosmos/complaints-repository.ts:80-95`)
- `complaintRepo.getOverdueComplaints` (`:109-127`)
- `complaintRepo.queryComplaints` without `assigneeAdminId` (`:130-155`)
- `ratingRepo.findRatingShieldEscalation` (`:161-173`)
- `auditLogRepo.queryAuditLog` (`api/src/cosmos/audit-log-repository.ts:43-65`)

**Current bounding:** Calling RBAC layer (admin only; customer only on their own
`bookingId`) restricts these queries today. **The risk is in the future:** a new
endpoint that forwards user-controlled filters into one of these helpers without
first checking the caller's claim would expose other partitions' data.

**Status:** `not-yet-mitigated`. **Impact:** Latent multi-tenant data exposure surface.

---

## Approach (chosen)

Two complementary controls:

1. **Semgrep rule** — ban any Cosmos `query` string interpolated with a non-validated
   request field. Force the call site to either (a) pass a literal/constant string, or
   (b) call a helper that validates the input against an allow-list first.
2. **Coverage tests** — for each cross-partition helper, assert via unit test that at
   least one tenant filter (`customerId =`, `technicianId =`, `adminId =`, or an
   explicit allow-list of admin-scope filters) is baked into the query string.

---

## Pattern citations

- `api/.semgrep.yml` — existing Semgrep rules (e.g., `karnataka-no-decline-in-dispatcher`)
- `api/src/cosmos/booking-repository.ts:getById` — gold-standard partition-key read
- `docs/threat-model.md` §I-A3 — threat detail
- `docs/threat-model.md` §A.7 — Karnataka isolation pattern (4-layer defence-in-depth)

---

## Architecture overview

```
                     ┌─────────────────────────────────┐
                     │  Semgrep (lint-time / CI)      │
                     │  bans: query string + req.body │
                     └────────────┬────────────────────┘
                                  │
                     ┌────────────▼────────────────────┐
                     │  Coverage tests (unit)          │
                     │  assert: tenant filter present  │
                     └────────────┬────────────────────┘
                                  │
                     ┌────────────▼────────────────────┐
                     │  Helper function (existing)     │
                     │  with locked tenant filter      │
                     └─────────────────────────────────┘
```

Defence-in-depth: a future bad endpoint that bypasses the lint trips a coverage test;
one that bypasses both trips a code review. Three independent layers like the
Karnataka pattern.

---

## Work streams

### WS-A: Semgrep rule

**File:** `api/.semgrep.yml` (MODIFY)

```yaml
rules:
  - id: no-user-controlled-cosmos-query
    pattern-either:
      - pattern: |
          $CONTAINER.items.query({ query: `... ${$REQ.body.$FIELD} ...` })
      - pattern: |
          $CONTAINER.items.query({ query: `... ${$REQ.query.get($FIELD)} ...` })
      - pattern: |
          $CONTAINER.items.query({ query: `... ${$REQ.params.$FIELD} ...` })
    message: |
      Do not interpolate request fields into Cosmos query strings. Use a parameterised
      query with @paramName placeholders + parameters array, OR validate the field
      against an allow-list before constructing the query. See
      api/src/cosmos/booking-repository.ts:getByCustomerId for the pattern.
    severity: ERROR
    languages: [typescript]

  - id: cross-partition-query-must-have-tenant-filter
    pattern: |
      $CONTAINER.items.query({ query: $Q })
    pattern-not-regex: |
      (customerId|technicianId|adminId|assigneeAdminId|tenantId)\s*=\s*@
    message: |
      Cross-partition query detected without a tenant filter. If this is admin-scope,
      add an explicit comment justifying it AND add a coverage test in
      api/tests/cosmos/cross-partition-tenant-filter.test.ts asserting the calling
      Function checks admin role before reaching this helper.
    severity: WARNING
    languages: [typescript]
    paths:
      include:
        - api/src/cosmos/**
```

The WARNING rule is intentional: existing helpers fire it. The fix isn't to rewrite
the helpers but to add justifying comments + coverage tests (WS-B).

### WS-B: Coverage tests

**File:** `api/tests/cosmos/cross-partition-tenant-filter.test.ts` (NEW)

For each helper that fires the WARNING rule:

```typescript
describe('cross-partition queries — tenant filter coverage', () => {
  it('complaintRepo.getRepeatOffenders only callable from admin Function', () => {
    // grep src/functions/ for callers; assert each caller invokes
    // requireAdmin / requireSuperAdmin middleware before reaching this helper
  });

  it('complaintRepo.queryComplaints without assigneeAdminId only callable from super-admin Function', () => {
    // same pattern
  });

  it('auditLogRepo.queryAuditLog only callable from super-admin Function', () => {
    // same
  });

  it('ratingRepo.findRatingShieldEscalation only callable from admin Function', () => {
    // same
  });
});
```

The test is a static grep — uses `fs.readdirSync` on `api/src/functions/` and asserts
caller files include the matching `require*` middleware import. Brittle but catches
the exact regression we care about.

### WS-C: Annotate existing helpers

Add a `// SEMGREP-JUSTIFIED: admin-scope query; caller MUST require* middleware` comment
above each existing cross-partition helper so the WARNING is explicit-by-design rather
than accidental.

### WS-D: Threat-model + ADR

- `docs/threat-model.md` §I-A3: status → `mitigated`
- `docs/adr/0027-cross-partition-query-guardrails.md` (NEW) — documents the 3-layer
  pattern (Semgrep + coverage tests + caller-side middleware)

### WS-E: Smoke gate

```bash
bash tools/pre-codex-smoke-api.sh
```

Plus an explicit Semgrep run to confirm the new rules fire on the seeded test case:

```bash
cd api && pnpm semgrep:scan 2>&1 | grep -E "no-user-controlled|cross-partition-query"
```

---

## File manifest

| Path | Action |
|---|---|
| `api/.semgrep.yml` | MODIFY (add 2 rules) |
| `api/tests/cosmos/cross-partition-tenant-filter.test.ts` | NEW |
| `api/src/cosmos/complaints-repository.ts` | MODIFY (justification comments) |
| `api/src/cosmos/audit-log-repository.ts` | MODIFY (justification comments) |
| `api/src/cosmos/rating-repository.ts` | MODIFY (justification comments) |
| `docs/threat-model.md` | MODIFY (§I-A3 status) |
| `docs/adr/0027-cross-partition-query-guardrails.md` | NEW |

---

## Out of scope

- Refactoring existing cross-partition helpers to add tenant filters (they ARE admin-scope
  by design; the goal is to prevent FUTURE accidents, not break existing flows)
- D-A1 RU exhaustion (separate concern; covered by admin pagination caps already)
- Migrating to a separate admin Cosmos region via change-feed (Phase 2 work)

---

## Execution order

1. WS-A Semgrep rule — verify fires on a seeded bad-case test fixture
2. WS-B coverage tests — write red first, then add caller-grep assertions
3. WS-C justification comments
4. WS-D threat-model + ADR
5. Pre-Codex smoke gate
6. Codex review → push → PR
