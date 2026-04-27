# Story E09-S02: Owner Orders Module — paginated table, filters, slide-over, CSV export

Status: shipped (PR #15, merged 2026-04-20, commit 6536fa6) — **retroactive docs**

> **Epic:** E09 — Owner Operations + Finance (`docs/stories/README.md` §E09)
> **Sprint:** S5 (wk 9–10) · **Estimated:** 1.5–2.5h · **Priority:** P1
> **Sub-projects:** `api/` + `admin-web/`
> **Ceremony tier:** Feature (read-only Cosmos query + 1 page + 6 components on existing `requireAdmin` rails)
> **Prerequisite:** E02-S04 admin auth + E09-S01 dashboard scaffolding
> **FR:** FR-7.2 (Owner Orders module)
> **Retroactive note:** Plan file `plans/E09-S02.md` was committed in PR #15 but the story file was never created. Acceptance criteria are reverse-engineered from the merged code (see PR #15 file list).

---

## Story

As **Alok, the solo owner**,
I want a master table of every booking with multi-field filters (status, city, phone, technician, date, amount) that persist in the URL, plus a side-panel detail view and a CSV export of filtered results,
so that **I can answer customer/auditor "what happened to booking X" questions in under 30 seconds without leaving the page** (FR-7.2).

---

## Acceptance Criteria

### AC-1 · `GET /v1/admin/orders` returns a paginated, filtered list
- **Given** a caller with role `super-admin` or `ops-manager`
- **When** they call `GET /v1/admin/orders?status=&city=&phone=&technicianId=&dateFrom=&dateTo=&amountMin=&amountMax=&pageSize=&continuationToken=`
- **Then** the response is `OrderListResponseSchema = { orders: Order[], total, continuationToken? }`
- **And** the response is sorted descending by `createdAt`
- **And** `pageSize` defaults to 20 and accepts up to `10000` (used by the export path)
- **And** filters compose with AND semantics — empty filters are no-ops

### AC-2 · `GET /v1/admin/orders/{id}` returns one booking
- **Given** a valid id and admin role
- **Then** the response is `OrderSchema`
- **And** 404 `NOT_FOUND` is returned when no document exists

### AC-3 · Auth + error contract
- 401 `UNAUTHORIZED` when no Bearer token
- 403 `FORBIDDEN` when role is not in `['super-admin','ops-manager']`
- 502 `UPSTREAM` on Cosmos failure
- 422 on Zod query-validation failure

### AC-4 · `/orders` page renders the table with URL-persisted filter state
- Server Component shell at `app/(dashboard)/orders/page.tsx` renders `<OrdersClient />`
- `OrdersClient` owns URL filter state via `useSearchParams`/`useRouter` — refresh keeps filters; back/forward navigation works
- 9-column `OrdersTable`: bookingId, createdAt, status, customer, city, technicianName, serviceTitle, amount, actions
- Pagination prev/next buttons disable correctly at boundaries

### AC-5 · Filter bar
- Status multi-select, city, phone, technician id, date range, amount range
- All filter changes update the URL (debounced where appropriate)

### AC-6 · Slide-over detail panel
- Clicking a row opens `OrderSlideOver` (right-side panel) without navigating away
- Panel renders customer + tech contact, schedule, amount, status, history
- Close button + Esc dismiss the panel

### AC-7 · Status badge
- `StatusBadge` renders the colour pill per `OrderStatus` enum (matches dashboard convention)

### AC-8 · CSV export
- "Export CSV" button on the toolbar
- Calls `fetchAllOrdersForExport` (paginated fetch with `pageSize=10000`) → `buildOrdersCsv` → browser download
- Exports the *filtered* set, not the full table
- CSV escapes embedded commas / quotes

### AC-9 · Tests + smoke gates
- API: schema tests, repo tests, list + detail handler tests (401/403/404/502/200)
- admin-web: RTL tests for `OrdersTable`, `OrderFilters`, `OrderSlideOver`, `exportCsv`
- TypeScript strict (`exactOptionalPropertyTypes`) green both sides
- `.codex-review-passed` shipped

---

## Tasks / Subtasks (as merged)

- [x] **WS-A — Zod schemas + Cosmos repository (api)** — `api/src/schemas/order.ts`, `api/src/cosmos/orders-repository.ts` with TDD on schema parse + repo behaviour
- [x] **WS-B — Two Azure Functions (api)** — `list.ts` + `detail.ts` with `requireAdmin(['super-admin','ops-manager'])`
- [x] **WS-C — admin-web types + API wrappers** — `src/types/order.ts`, `src/api/orders.ts` (`fetchOrders`, `fetchOrderById`, `fetchAllOrdersForExport`)
- [x] **WS-D — admin-web UI** — `OrdersClient`, `OrdersTable`, `OrderFilters`, `OrderSlideOver`, `StatusBadge`, `exportCsv` + RTL tests
- [x] **WS-E — Pre-Codex smoke gate + Codex review** — `.codex-review-passed` shipped

---

## Dev Notes

### Cosmos read pattern
Cross-partition `bookings` query (partitioned by `/status`); status filter is partition-aligned when present. Repo shape: `queryOrders(filters)` + `getOrderById(id)`. No write paths in this story.

### URL-persisted filter state
`useSearchParams` is the source of truth; setters call `router.replace` with the new query string. This makes filtered views shareable links (e.g. paste a URL into Slack to flag an issue).

### Pagination model
Cosmos continuation-token pagination, not offset. Avoids the "active queue mutates mid-loop and you skip a row" bug we hit in E09-S06.

### What was actually shipped (per PR #15)
- API: `schemas/order.ts`, `cosmos/orders-repository.ts`, `functions/admin/orders/{list,detail}.ts` + matching tests
- admin-web: `app/(dashboard)/orders/page.tsx`, `OrdersClient`, `OrdersTable`, `OrderFilters`, `OrderSlideOver`, `StatusBadge`, `exportCsv` + RTL tests
- `plans/E09-S02.md` (399 lines) shipped in same PR
- 124/124 API tests + 57/57 admin-web tests green

---

## Definition of Done

- [x] `cd api && pnpm typecheck && pnpm lint && pnpm test` green
- [x] `cd admin-web && pnpm typecheck && pnpm lint && pnpm test` green
- [x] All AC pass via test assertions
- [x] Pre-Codex smoke gates exited 0
- [x] `.codex-review-passed` marker present
- [x] PR #15 opened, CI green, merged 2026-04-20

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per PR #15 commit attribution)

### Completion Notes
PR #15 merged 2026-04-20 as commit 6536fa6. Codex review passed.

### File List
See PR #15 — full list above in Tasks/Dev Notes.
