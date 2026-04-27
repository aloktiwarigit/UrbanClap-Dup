# Story E09-S06: Owner Complaints Inbox — Kanban with optimistic mutations + SLA escalation

Status: shipped (PR #27, merged 2026-04-22, commit 0fea0c3) — **retroactive docs**

> **Epic:** E09 — Owner Operations + Finance (`docs/stories/README.md` §E09)
> **Sprint:** S5 (wk 9–10) · **Estimated:** 3.5–4.5h · **Priority:** P1
> **Sub-projects:** `api/` + `admin-web/`
> **Ceremony tier:** Foundation (new Cosmos collection with custom indexing policy + ETag CAS concurrency + 5 admin endpoints + SLA timer trigger + complex Kanban UI with optimistic mutations)
> **Prerequisite:** E02-S04 admin auth, E09-S05 audit log
> **FR:** FR-6.3 (owner side of complaints), references E07-S03 customer/tech filing
> **Retroactive note:** Both story and plan files were never created. Reverse-engineered from PR #27 (file list above) and from the merged Cosmos repo + handlers + Kanban code.

---

## Story

As **Alok, the solo owner**,
I want a Kanban board at `/complaints` showing every complaint as a card across NEW → INVESTIGATING → RESOLVED columns, where I can drag a card to change status, assign it to myself, add an internal note, or resolve it with a category — and the system auto-escalates anything past its SLA deadline,
so that **no complaint ever rots in the inbox** (FR-6.3) **and so I can clear the day's queue in 22 minutes without losing my place when two windows are open at once**.

---

## Acceptance Criteria

### AC-1 · `complaints` Cosmos container provisioned with payload-aware indexing
- Container: `complaints`, partition key `/id` (single-doc point reads), `excludedPaths: ['/internalNotes/*']`
- Excluding internal-note bodies from the index keeps RU cost flat as notes accumulate (notes are not query targets — only the resolved category, status, and timestamps are)
- Provisioned via `api/scripts/setup-cosmos.ts`

### AC-2 · `ComplaintDoc` Zod schema with full lifecycle fields
- Required: `id`, `orderId`, `customerId`, `technicianId`, `description`, `type` (default `STANDARD`), `status` (∈ `NEW | INVESTIGATING | RESOLVED`), `slaDeadlineAt`, `createdAt`, `updatedAt`
- Defaulted booleans: `escalated: false`, `ackBreached: false`
- Defaulted arrays: `internalNotes: []`
- Optional: `assigneeAdminId`, `resolutionCategory` (∈ `TECHNICIAN_MISCONDUCT | SERVICE_QUALITY | BILLING_DISPUTE | LATE_ARRIVAL | NO_SHOW | OTHER`), `filedBy`, `reasonCode`, `photoStoragePath`, `acknowledgeDeadlineAt`, `resolvedAt`, `expiresAt`
- `RATING_SHIELD` complaint type carries `draftOverall` (1–2) + optional `draftComment` (≤500) for E07-S02 integration

### AC-3 · `POST /v1/admin/complaints` — create
- `requireAdmin(['super-admin','ops-manager'])`
- Body validated by `CreateComplaintBodySchema` (description 10–2000 chars)
- 503 if Cosmos container missing (`err.code === 404` from setup-cosmos not yet run)

### AC-4 · `GET /v1/admin/complaints?status=&assigneeAdminId=&dateFrom=&dateTo=&page=&pageSize=&sortDir=` — paginated list
- Status filter accepts comma-separated list (`status=NEW,INVESTIGATING`) → splits to array
- pageSize defaults 50, capped at 200
- Returns `{ items, total, page, pageSize, totalPages }`
- 200 + empty result on Cosmos 404 (container not provisioned) — list path is fail-soft

### AC-5 · `PATCH /v1/admin/complaints/{id}` — partial update with ETag CAS
- Updatable fields: `status`, `assigneeAdminId` (`null` clears, `undefined` leaves unchanged), `resolutionCategory`, `note` (appends to `internalNotes`)
- Optional `expectedStatus` field — if provided and differs from server's current status, **409 STATUS_CONFLICT** (CAS guard)
- ETag from the read used as `IfMatch` on replace; on 412 the handler can retry up to 3 times with `expectedStatus` dropped on retries (operator's latest intent wins on retry)
- Resolving (`status: RESOLVED` + `resolutionCategory`) writes `resolvedAt = now`

### AC-6 · `GET /v1/admin/complaints/repeat-offenders?since=` — operator helper
- Returns `{ offenders: [{ technicianId, count }] }` for techs with ≥ N complaints in the window
- Empty result on Cosmos 404 (fail-soft)

### AC-7 · SLA escalation timer (`*/15 * * * *`)
- Two parallel queries every 15 min:
  - `getOverdueComplaints()` — `slaDeadlineAt <= now AND status != RESOLVED AND escalated = false`
  - `getUnacknowledgedPastDueComplaints()` — `acknowledgeDeadlineAt <= now AND assigneeAdminId IS NULL AND ackBreached = false`
- For each overdue complaint: set `escalated = true`, write audit `SLA_BREACH`, FCM `sendOwnerComplaintSlaBreach`
- For each ACK-overdue (and not already in resolve-overdue set): set `ackBreached = true, escalated = true`, audit `SLA_BREACH_ACK`, FCM
- **De-duplication:** complaints in both sets get a single `SLA_BREACH` audit + a same-ETag-safe atomic update setting both `escalated` and `ackBreached`
- 412 on Cosmos replace → log + skip (concurrent operator update wins)
- 404 on container → log + early return (fresh deployment)
- All-fail on FCM/audit → individual catch + log; timer never throws (the next tick will retry)

### AC-8 · Auth + error contract on every endpoint
- 401 / 403 standard envelope
- 422 on Zod failure
- 409 `STATUS_CONFLICT` on `expectedStatus` mismatch (operator-visible)
- 412 from Cosmos handled internally on PATCH (retry loop)

### AC-9 · `/complaints` Kanban page
- Server Component shell at `admin-web/app/(dashboard)/complaints/page.tsx`
- Two-query SSR load: active page (`status=NEW,INVESTIGATING`, pageSize 200) + 30-day RESOLVED page (`resolvedSince=now-30d`); de-dupe by `id` keeping the higher `updatedAt`
- 3 columns: NEW, INVESTIGATING, RESOLVED
- Drag-and-drop or status-button to move cards
- Card click → `ComplaintSlideOver` (right panel) with assignee picker, note input, resolve picker, history

### AC-10 · Optimistic mutations with generation-counter rollback safety
- `mutGenRef` keyed by `${id}:${field}` increments on each mutation; stale rollbacks (gen mismatch) `return` silently — prevents two parallel edits to the same field stomping on each other
- `complaintsRef` synchronous read of the latest list state — used so optimistic patches build on the freshest data, not a closure-captured stale snapshot
- ETag 409 retry loop (up to 3×): first attempt sends `expectedStatus`; subsequent retries drop it (operator's latest intent overrides)

### AC-11 · Single-page active fetch (pageSize 200)
- Active queue (`NEW + INVESTIGATING`) is fetched as one page, not paginated
- **Why:** offset-pagination over a mutating dataset risks dropping active tickets when one resolves mid-loop (OFFSET shifts past the item). At pilot scale (≤5 k bookings/mo) the active queue never approaches 200 — one page is always sufficient. Cursor pagination deferred to post-pilot.

### AC-12 · Tests + smoke gates + Codex
- API: 5 handler test files + sla-timer test (12-rounds Codex hardening)
- admin-web: API client test, KanbanBoard, ComplaintCard, ComplaintSlideOver RTL tests
- Pre-Codex smoke gates exit 0
- `.codex-review-passed` shipped

---

## Tasks / Subtasks (as merged)

- [x] **WS-A — Cosmos schema, indexing policy, repository (`api/`)**
- [x] **WS-B — 5 HTTP handlers + 1 timer (`api/src/functions/admin/complaints/`)**
- [x] **WS-C — OpenAPI registry + admin-web typed client regen**
- [x] **WS-D — admin-web Kanban + slide-over + optimistic mutation infra**
- [x] **WS-E — Pre-Codex smoke + Codex review** — `.codex-review-passed`

---

## Dev Notes

### `excludedPaths: ['/internalNotes/*']` — why
Internal notes can be long-form ("operator chat with technician summarised here"). Indexing them costs RUs proportional to text length on every write. We never query *by* note content (only by status, assigneeAdminId, resolutionCategory, dates). Exclude the path → index cost flat as notes grow.

### Why ETag CAS + `expectedStatus` belt-and-braces
ETag CAS catches *any* concurrent write (e.g. parallel SLA-timer escalation while operator drags a card). `expectedStatus` is the *operator-visible* form — it lets the UI surface a 409 with a "another window changed this status" message rather than silently retry over the operator's stale intent. They serve different audiences.

### Why timer is 15-min, not 1-min
SLA breach detection doesn't need sub-minute granularity. 15-min ticks keep Azure Functions invocation count < 3000/day (well under the 1M free-tier limit). At higher tiers we may tighten to 5 min.

### Why the timer never throws
Throwing in a Timer Trigger schedules an Azure retry which runs at the same time as the next 15-min tick — duplicating work. Per-complaint catch + log lets the next tick pick up the survivors cleanly.

### Why Cosmos 404 is fail-soft on list/timer but 503 on create
- **List** — empty array is a sane "nothing to show" UX; an error is jarring on a fresh staging deploy
- **Timer** — see above; can't escalate what can't be queried, but next tick will succeed
- **Create** — failing silently hides a real provisioning bug; 503 surfaces it

### Codex review (highlights from PR #27)
- ETag race between two parallel `escalateBatch` calls handled by single-update with both flags when a complaint is in both overdue sets
- 412 retry loop in PATCH handler (3-attempt limit; subsequent attempts drop `expectedStatus`)
- `mutGenRef` + `complaintsRef` pattern hardened across 7 review rounds (PR description has the full list)

### Patterns referenced
- Cosmos repo conventions match `bookings-repository.ts` and `audit-log-repository.ts`
- ETag CAS pattern is the same shape as E06-S03 idempotency

---

## Definition of Done

- [x] `cd api && pnpm typecheck && pnpm lint && pnpm test:coverage` green (≥80%)
- [x] `cd admin-web && pnpm typecheck && pnpm lint && pnpm test` green
- [x] All AC pass via test assertions
- [x] Pre-Codex smoke gates exit 0 (api + web)
- [x] `.codex-review-passed` marker present
- [x] PR #27 opened, CI green, merged 2026-04-22

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per PR #27 commit attribution)

### Completion Notes
PR #27 merged 2026-04-22 as commit 0fea0c3. Codex hardening took multiple rounds (ETag races, 412 retry, generation counters). Result is the most adversarially-tested admin module in the codebase as of E09 close-out.

### File List
See PR #27 — full list:
- API: `schemas/complaint.ts`, `cosmos/complaints-repository.ts`, `cosmos/seeds/complaints.ts`, `functions/admin/complaints/{create,list,patch,repeat-offenders,sla-timer}.ts`, `setup-cosmos.ts` (modified), `openapi/registry.ts` (modified), `dashboard/summary.ts` (modified), `orders/detail.ts` (modified)
- admin-web: `app/(dashboard)/complaints/{page,ComplaintsClient}.tsx`, `src/api/complaints.ts`, `src/components/complaints/{KanbanBoard,ComplaintCard,ComplaintSlideOver}.tsx`, `src/types/complaint.ts`, `Rail.tsx` (modified), `lib/serverApi.ts` (modified), `api/client.ts` (modified)
- Tests: 5 API handler test files + admin-web `api/complaints.test.ts`, `KanbanBoard.test.tsx`, `ComplaintCard.test.tsx`, `ComplaintSlideOver.test.tsx`
