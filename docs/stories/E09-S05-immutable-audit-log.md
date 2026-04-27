# Story E09-S05: Immutable Audit Log — append-only Cosmos collection + viewer UI

Status: shipped (direct commits, no single PR; final commit e1dfd5e on 2026-04-22) — **retroactive docs**

> **Epic:** E09 — Owner Operations + Finance (`docs/stories/README.md` §E09)
> **Sprint:** S5 (wk 9–10) · **Estimated:** 1.5–2.5h · **Priority:** P0 (blocks E09-S03 override audit trail)
> **Sub-projects:** `api/` + `admin-web/`
> **Ceremony tier:** Foundation (introduces a new compliance-grade Cosmos collection + immutability invariant; touches every admin write path)
> **Prerequisite:** E02-S04 admin auth
> **FR / NFR:** FR-7.4 (Searchable audit log), NFR-S-6 (immutable audit trail for compliance)
> **Retroactive note:** Plan file `plans/E09-S05.md` already exists. This story file was never created. Source code shipped via a chain of direct commits (c4d0ba3 → d1e573d → 02c2c70 → 4a119e9 → 9f043ac → bbab3a2 → 0d290af → 508112a) instead of a single PR. AC are reverse-engineered from the merged code.

---

## Story

As **Alok, the solo owner subject to consumer-protection and tax compliance scrutiny**,
I want every admin action (login, logout, override, approve-all, complaint resolution, levy approval, …) to land in an append-only Cosmos collection that no operator can edit or delete, and a `/audit-log` viewer page that lets me filter by admin, action, resource type, and date range,
so that **a regulator or insurer can never accuse us of tampering with our own records** (NFR-S-6) **and so I can answer "who did what when" questions in 30 seconds** (FR-7.4).

---

## Acceptance Criteria

### AC-1 · `AuditLogEntry` Zod schema is the public contract
- `id` (UUID), `adminId`, `role` (∈ `super-admin | ops-manager | finance | support-agent | system`), `action` (dot-notation string e.g. `admin.login`, `order.refund`), `resourceType`, `resourceId`, `payload` (unstructured `Record<string, unknown>`), `timestamp` (ISO string), optional `ip`, optional `userAgent`
- Schema strips unknown keys (e.g. `partitionKey`, `_etag`) so the wire shape stays clean
- `AuditLogQuerySchema` accepts `adminId`, `action`, `resourceType`, `resourceId`, `dateFrom`, `dateTo`, `continuationToken`, `pageSize` (default 20, max 100)

### AC-2 · `audit_log` Cosmos container, append-only by construction
- Container name `audit_log`, partition key `/partitionKey` (value = `timestamp.slice(0,7)` → `yyyy-mm`)
- The repository exposes **only** `appendAuditEntry()` and `queryAuditLog()` — no update, no delete, no patch
- The `auditLog()` service exposes **only** the write path
- The list endpoint exposes **only** read
- **Immutability invariant:** there is no code path in the repository, service, or HTTP surface that mutates an existing audit-log document. Future stories that add audit-log writes MUST go through `auditLog()` and MUST NOT add update/delete handlers.

### AC-3 · `auditLog()` service is fire-and-forget
- Signature: `auditLog(ctx, action, resourceType, resourceId, payload, extras?)`
- Generates UUID + ISO timestamp + partition key internally
- On Cosmos failure: catches the error and reports to Sentry — **never throws to the caller**
- This means `auditLog()` calls are safe to `await` inside business handlers without error-handling boilerplate; a transient Cosmos hiccup doesn't break a successful refund/login/transfer

### AC-4 · Old `middleware/auditLog.ts` is deleted; callers migrated
- Pre-existing `src/middleware/auditLog.ts` (uses old `entityType/entityId` field names) is removed
- `api/src/functions/admin/auth/login.ts` + `logout.ts` now call the new `auditLog()` service
- `api/vitest.config.ts` coverage exclude no longer references the deleted middleware
- Integration test (`api/tests/integration/auth.integration.test.ts`) updated to mock the new service rather than the old middleware

### AC-5 · `GET /v1/admin/audit-log` — paginated query, **super-admin only**
- 401 without token, 403 if role is anything other than `super-admin` (ops-manager and below CANNOT see the audit log; tighter than other admin endpoints by design)
- Query params validated by `AuditLogQuerySchema`
- Response: `{ entries: AuditLogEntry[], continuationToken? }`
- Cosmos pagination via `FeedIterator.fetchNext()` — **never** offset-based
- `ORDER BY c.timestamp DESC`
- `pageSize` capped at 100 (Zod `.max(100)`)

### AC-6 · `/audit-log` page (admin-web)
- Server Component shell at `admin-web/app/(dashboard)/audit-log/page.tsx`
- Client component `AuditLogClient` owns filter state + pagination (continuation token in client state)
- `AuditLogTable` — 5 columns (timestamp, admin, action, resource, payload-preview); row click expands to render the full `payload` JSON
- `AuditLogFilters` — date range, action, resourceType, resourceId
- **No edit / delete actions surfaced anywhere** in the UI (matches the immutability invariant)
- API base URL is read from environment (Codex P1 fix in `508112a` — earlier code hardcoded the wrong base)

### AC-7 · Backfill plan for already-merged + upcoming admin writes
- E09-S01 (`dashboard/feed.ts`) and E09-S02 (`orders/list.ts`, `orders/detail.ts`) — read-only, no audit calls needed
- E09-S03 override controls — every override calls `auditLog()` (delivered in E09-S03)
- E09-S04 approve-all — calls `auditLog()` per request (delivered in E09-S04)
- E10-S02 SSC levy — every approve calls `auditLog()` (delivered in E10-S02)
- Future admin write paths MUST call `auditLog()` (enforced via Codex review and `/security-review`)

### AC-8 · Tests + smoke gates
- Schema acceptance + rejection tests
- Repository tests (mocked Cosmos)
- Service tests — verifies fire-and-forget (Sentry called, no throw)
- List handler tests — 401, 403, 200, filter combinations, pagination
- admin-web RTL tests — `AuditLogTable` renders rows + expand payload + no edit/delete actions; `AuditLogFilters` onChange
- TypeScript strict (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) green both sides

---

## Tasks / Subtasks (as merged via direct commits)

- [x] **WS-A — schemas + repo (commits c4d0ba3, d1e573d)**
  - [x] `api/src/schemas/audit-log.ts` (`AuditLogEntrySchema`, `AuditLogQuerySchema`, `AuditLogDoc`)
  - [x] `api/src/cosmos/audit-log-repository.ts` (`appendAuditEntry`, `queryAuditLog`)
- [x] **WS-B — service + caller migration (commits 02c2c70, 4a119e9)**
  - [x] `api/src/services/auditLog.service.ts` — fire-and-forget wrapper, Sentry on failure
  - [x] Delete `api/src/middleware/auditLog.ts`
  - [x] Migrate `login.ts`, `logout.ts`, `setup-totp.ts` to the new service
  - [x] Update integration test mock target
- [x] **WS-C — list endpoint (commit 0d290af)**
  - [x] `api/src/functions/admin/audit-log/list.ts` with `requireAdmin(['super-admin'])`
- [x] **WS-D — admin-web viewer (commits 9f043ac, bbab3a2)**
  - [x] `admin-web/src/types/audit-log.ts`
  - [x] `admin-web/src/components/audit-log/{AuditLogTable,AuditLogFilters,AuditLogClient}.tsx` + RTL tests
  - [x] `admin-web/app/(dashboard)/audit-log/page.tsx`
- [x] **WS-E — Codex follow-up (commit 508112a)**
  - [x] API base URL fix in admin-web client
  - [x] Pre-commit hook coverage extended

---

## Dev Notes

### Why "no PR" — direct commits to main
This story shipped as a chain of direct commits on the `feature/E09-S04` branch which then landed via PR #21. The audit-log work was scoped under E09-S05 in commit messages but did not have its own PR. For traceability, the source-of-truth is the commit-message `feat(E09-S05): …` prefix — see `git log --grep "E09-S05"`.

### Why super-admin-only on read
The audit log itself contains PII (admin emails, IPs, payloads with customer phone/email). Surfacing it to ops-manager would defeat its purpose as a "watch the watchers" trail. Only super-admin (currently the owner) can read; everyone else writes via the service but cannot read.

### Why fire-and-forget on write
A successful login that fails to audit-log should still log the operator in (otherwise an audit-store outage would lock everyone out). The trade-off is acceptable because (a) audit-log misses are rare and Sentry-captured, and (b) the audit log is an *evidentiary* trail, not a transactional one — we don't gate business logic on it.

### Why offset pagination is forbidden
Audit log can grow unboundedly. Offset queries on a 25 GB Cosmos serverless container are O(n) — they read every preceding row. Continuation tokens are O(pageSize). All callers (UI, future export jobs) must use `continuationToken`.

### Patterns referenced
- Cosmos repo conventions match `bookings-repository.ts` and `orders-repository.ts`
- The fire-and-forget service pattern is reused in `complaints-repository.ts` (E09-S06) for the SLA timer

---

## Definition of Done

- [x] `cd api && pnpm typecheck && pnpm lint && pnpm test:coverage` green (≥80%)
- [x] `cd admin-web && pnpm typecheck && pnpm lint && pnpm test` green
- [x] All AC pass via test assertions
- [x] Pre-Codex smoke gates exit 0 (api + web)
- [x] `.codex-review-passed` shipped with the bundling PR (#21)

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per commit attributions on the E09-S05 chain)

### Completion Notes
Direct-commit ship pattern was a one-off; subsequent stories (E09-S03, E09-S06, E10-S02) all landed via dedicated PRs. The E09-S05 commits were eventually rolled into PR #21 along with E09-S04 work — see PR #21 description for the full scope.

### File List
- `api/src/schemas/audit-log.ts`
- `api/src/cosmos/audit-log-repository.ts`
- `api/src/services/auditLog.service.ts`
- `api/src/functions/admin/audit-log/list.ts`
- `api/src/functions/admin/auth/login.ts` (modified)
- `api/src/functions/admin/auth/logout.ts` (modified)
- `api/src/middleware/auditLog.ts` (DELETED)
- `api/vitest.config.ts` (modified)
- `api/tests/schemas/audit-log.test.ts`
- `api/tests/cosmos/audit-log-repository.test.ts`
- `api/tests/unit/auditLog.service.test.ts`
- `api/tests/integration/auth.integration.test.ts` (modified)
- `api/tests/functions/admin/audit-log/list.test.ts`
- `admin-web/app/(dashboard)/audit-log/page.tsx`
- `admin-web/src/components/audit-log/{AuditLogClient,AuditLogTable,AuditLogFilters}.tsx`
- `admin-web/src/types/audit-log.ts`
- `admin-web/tests/components/audit-log/{AuditLogTable,AuditLogFilters}.test.tsx`
