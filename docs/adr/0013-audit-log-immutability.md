# ADR-0013: Audit-log immutability — multi-layer defensive enforcement

- **Status:** accepted
- **Date:** 2026-04-27
- **Deciders:** Alok Tiwari

## Context

FR-9.4 (per `docs/prd.md`), the DPDP Act 2023 §8 (Data Fiduciary obligations
to maintain accurate, complete, consistent records of processing activities),
and RBI financial-records retention guidance for payment-flow auditability all
demand an **immutable, append-only audit log**. Auditors (regulators, legal,
internal compliance) must be able to point at the audit log container and rely
on the fact that no entry has ever been mutated or deleted out of band.

Today (W2-4 baseline) immutability of the `audit_log` Cosmos container holds
**only by convention**. The repository
(`api/src/cosmos/audit-log-repository.ts`) exposes only `appendAuditEntry` and
`queryAuditLog`, the service (`api/src/services/auditLog.service.ts`) calls
neither replacement nor deletion methods, and there is no admin handler that
issues a `PUT` or `DELETE` against the container. **No test fails, however,
if a future PR adds an `updateAuditEntry` method, an admin DELETE handler,
or a one-off cleanup script that calls
`container('audit_log').items.delete(...)`.** The critical-path test review
on 2026-04-26 (issue #79) and the threat-model review (issue #80) flagged
this exact gap: **discipline without enforcement is not auditable.**

The dispatcher path solved an analogous problem — Karnataka FR-9.1 forbidding
decline-derived signals — by combining a data-layer file-scan
(`api/tests/integration/dispatcher-data-isolation.test.ts`), a Semgrep rule
(`api/.semgrep.yml :: karnataka-no-decline-in-dispatcher`), and an ADR
(`docs/adr/0011-karnataka-decline-history-isolation.md`). That layered
approach is now the canonical pattern for CI-enforced data invariants in this
repo. This ADR applies that pattern to the `audit_log` container.

## Decision

Enforce `audit_log` append-only semantics at **four merge-time layers**, and
document one **runtime layer** as a deferred follow-up. Discipline alone is
insufficient.

### Layer 1 — Module surface invariant (defensive test)

`api/src/cosmos/audit-log-repository.ts` exports exactly
`{ appendAuditEntry, queryAuditLog }`. The defensive test at
`api/tests/cosmos/audit-log-immutability.test.ts` reads
`Object.keys(module).sort()` and asserts equality. A future PR introducing
`updateAuditEntry`, `deleteAuditEntry`, `purgeAuditLog`, etc., breaks the
test before review.

### Layer 2 — File-scan invariant (defensive test)

The same test file reads the source of `audit-log-repository.ts` and
`auditLog.service.ts` and asserts that none of `.replace(`, `.delete(`,
`.upsert(`, `updateAudit*`, `deleteAudit*`, `mutateAudit*` appear. Mirrors
the dispatcher-data-isolation pattern. Catches regressions even if a future
contributor adds a private helper that the module-surface assertion would
miss (it would still appear inside the source file).

### Layer 3 — Container-name uniqueness invariant (defensive test)

The same test file walks `api/src/**/*.ts` and asserts that the literal
string `'audit_log'` (or `"audit_log"`) appears in **exactly one file** —
`audit-log-repository.ts`. Any other file referencing the container by name
is a likely immutability bypass (an alternate code path that could later add
`.replace(...)` without going through the repository). The repository
remains the single point of contact with the container.

### Layer 4 — Semgrep rule (CI lint gate)

`api/.semgrep.yml :: audit-log-immutable` blocks any PR that introduces
direct mutation / deletion patterns against the `audit_log` container in
`api/src/**/*.ts`. The patterns explicitly cover:

- `container('audit_log').items.{upsert | replace | delete | deleteAllItemsForPartitionKey}`
- `container('audit_log').item(...).{replace | delete | patch}`
- `container('audit_log').items.{batch | bulk | executeBulkOperations}` — the
  Cosmos batch APIs accept `operationType: 'Delete' | 'Replace' | 'Upsert'`
  in their input arrays and would otherwise bypass the per-method patterns.

A complementary defensive test
(`api/tests/cosmos/audit-log-immutability.test.ts § Semgrep-rule-presence`)
asserts that this rule exists in `api/.semgrep.yml` so a botched
merge-conflict resolution that drops the rule fails CI loudly rather than
silently disabling Layer 4.

`CONTAINER`-metavariable patterns are deliberately excluded from this rule
because the `CONTAINER` identifier is reused across other repositories
(`complaints-repository.ts` uses `CONTAINER = 'complaints'`,
`finance-repository.ts` uses `CONTAINER = 'wallet_ledger'`, etc.) — including
them produced false positives during W2-4 development. Lockdown of
`audit-log-repository.ts` itself relies on Layer 2 instead. This trade-off
is acceptable because Layer 2 + Layer 3 already cover the file-scoped case.

The rule is loaded into CI by `.github/workflows/api-ship.yml`'s multiline
`config:` for the `returntocorp/semgrep-action@v1` step (mirroring the
ADR-0011 / E10-S01 pattern).

### Layer 5 — Cosmos RBAC + container-level append-only enforcement (deferred)

Cosmos DB Stored Procedures alone do not actually prevent SDK-level
`.delete(...)` or `.replace(...)` calls — they constrain only the code path
that explicitly invokes the proc. **True runtime immutability requires a
Cosmos custom RBAC role granted to the API's connection string that excludes
the `Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/items/delete`
and `.../write` actions on the `audit_log` container** (write being
allowed only via the `create` operation, which Cosmos does not split out at
the role-action level — so this is partial).

The fully sound runtime enforcement is therefore a combination of:

1. A custom RBAC role with `read` + `create` permissions on `audit_log`,
   no `delete`, no `replace` (enforced at the Azure ARM/Bicep layer).
2. Cosmos point-in-time-restore (PITR) enabled for forensic recovery in
   the event a misconfiguration permits accidental mutation.
3. Periodic cross-check job that compares current entries against an
   append-only S3-style replicated archive (out of scope for ₹0 pilot).

This work is **deferred** to a follow-up issue. Layers 1–4 are sufficient
for launch-readiness because (a) the operator is the only writer at pilot
scale (≤5,000 bookings/mo), (b) the connection string is held only in Azure
Functions configuration, and (c) any code-level regression is caught at
merge time by Layers 1–4 before the connection string ever sees the
mutation call.

## Consequences

- **Positive:**
  - Auditors can point at the four layers as evidence of CI-enforced
    immutability without inspecting code.
  - Future PRs that accidentally introduce mutation paths fail loudly at
    test time AND lint time.
  - The defensive test is fast (~25 ms) — no Cosmos round-trip, no flake.
  - The pattern is now reusable: `wallet_ledger`, `booking_events`, and
    `dispatch_attempts` are also append-only by design and could adopt the
    same four-layer test in follow-up issues.
- **Negative:**
  - Future genuinely-required changes to the audit-log code (e.g. a DPDP
    erasure cascade that hashes `resourceId` rather than deleting the
    entry) require revising both this ADR and the defensive test. This is
    the intended friction.
  - The Semgrep rule is literal-string-scoped to `'audit_log'`; a future
    contributor who introduces a `getAuditLogContainer()` helper would
    need to extend the rule. Documented as a maintenance note here.
- **Neutral:**
  - Container-level Cosmos RBAC (Layer 5) is left for a future
    infrastructure ADR. The architectural decision is made; the
    operationalisation is sequenced.

## Alternatives considered

- **Discipline only (status quo):** rejected — same reasoning as ADR-0011.
  Convention is not auditable.
- **Single-layer defense (Semgrep only, or test-only):** rejected — each
  layer compensates for a gap the others have. Module-surface assertion
  misses private helpers; file-scan misses cross-file aliasing;
  container-name uniqueness misses direct `.upsert` calls embedded in the
  repository file itself; Semgrep misses non-literal container references.
  All four together close every gap we could enumerate during W2-4.
- **Cosmos stored procedure as an append-only checkpoint:** rejected
  (deferred) — does not actually prevent SDK-level mutation, only
  constrains a code path that explicitly invokes the proc. The genuine
  runtime defense is RBAC, which is documented as Layer 5 follow-up.
- **Tightening `AuditLogEntrySchema.action` to `z.enum([...])`:** considered
  and rejected for this PR. The action vocabulary is intentionally broad
  (DPDP rights, finance approvals, dispatch decisions, complaint
  triage, auth events, system events), and enumerating the full set
  requires coordination with W2-2 (audit-log P1 bundle) which is in
  flight. Filed as a separate follow-up. The current `z.string()` is
  sufficient because `action` is a payload field, not an immutability
  anchor.

## Future work

1. **Layer 5 — Cosmos RBAC custom role** for the API connection string,
   excluding `delete` and `replace` actions on the `audit_log` container.
   ARM/Bicep + Azure Functions identity update. Filed as follow-up issue.
2. **Tighten `AuditLogEntrySchema.action` to a closed enum** once W2-2
   audit-log P1 bundle merges and the action vocabulary stabilises.
3. **Apply the four-layer pattern** to other append-only containers:
   `wallet_ledger`, `booking_events`, `dispatch_attempts`. Each gets its
   own defensive test + Semgrep rule + ADR.
4. **Layer-5 partial mitigation:** point-in-time restore (PITR) is enabled
   on the Cosmos account by default; document the recovery runbook in
   `docs/runbook.md` § Audit log forensic recovery.

## References

- `api/src/cosmos/audit-log-repository.ts` — the locked-down module.
- `api/src/services/auditLog.service.ts` — the locked-down service.
- `api/tests/cosmos/audit-log-immutability.test.ts` — Layers 1–3.
- `api/.semgrep.yml :: audit-log-immutable` — Layer 4.
- `docs/adr/0011-karnataka-decline-history-isolation.md` — pattern precedent.
- Wave-2 critical-path test review (issue #79) — the original immutability gap.
- Wave-2 threat-model addendum (issue #80) — Cosmos append-only enforcement.
- DPDP Act 2023 §8 (Data Fiduciary obligations).
- FR-9.4 (`docs/prd.md`).
- RBI Master Directions on payment system audit retention.
