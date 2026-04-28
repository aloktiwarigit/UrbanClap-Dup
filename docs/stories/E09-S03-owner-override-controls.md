# Story E09-S03: Owner Override Controls — re-assign, complete, refund, waive-fee, escalate, note

Status: shipped (PR #25, merged 2026-04-22, commit 10a2962) — **retroactive docs**

> **Epic:** E09 — Owner Operations + Finance (`docs/stories/README.md` §E09)
> **Sprint:** S5 (wk 9–10) · **Estimated:** 1.5–2.5h · **Priority:** P1
> **Sub-projects:** `api/` + `admin-web/`
> **Ceremony tier:** Feature (6 new POST endpoints, all behind existing `requireAdmin` rails; every action audited via E09-S05)
> **Prerequisite:** E09-S02 (orders module — slide-over to attach the panel to) **and** E09-S05 (audit log — every override writes one entry)
> **FR:** FR-7.3 (Owner override controls)
> **Retroactive note:** Both story and plan files were never created. Reverse-engineered from PR #25 (file list above) and from `api/src/functions/admin/orders/overrides.ts` + `admin-web/src/components/orders/OverridePanel.tsx`.

---

## Story

As **Alok, the solo owner**,
I want six override actions on every order detail (re-assign, mark complete, refund, waive fee, escalate, internal note), each requiring a reason, each writing a tamper-proof audit-log entry,
so that **when something goes sideways at 22:00 I can fix the booking in three clicks** (FR-7.3) **and so the audit trail makes my decisions defensible to a customer, regulator, or insurer**.

---

## Acceptance Criteria

### AC-1 · Six new admin POST endpoints
- `POST /v1/admin/orders/{id}/reassign` — body `{ technicianId, reason }`
- `POST /v1/admin/orders/{id}/complete` — body `{ reason }`
- `POST /v1/admin/orders/{id}/refund` — body `{ reason, amountPaise? }`
- `POST /v1/admin/orders/{id}/waive-fee` — body `{ reason }`
- `POST /v1/admin/orders/{id}/escalate` — body `{ reason, priority: 'HIGH' | 'CRITICAL' }`
- `POST /v1/admin/orders/{id}/note` — body `{ note }`

### AC-2 · `reason` is mandatory and ≥ 5 chars on all five reason-bearing actions
- Zod `z.string().min(5)` on `reason`
- 422 `VALIDATION_ERROR` with `details: parsed.error.flatten()` when violated
- `note` body uses `note` field with `min(1)` (operator can save a one-word note)

### AC-3 · Auth via `requireAdmin(['super-admin', 'ops-manager'])` on every endpoint
- 401 `UNAUTHORIZED` without Bearer token
- 403 `FORBIDDEN` for any other role
- Functions registered with `authLevel: 'anonymous'` (auth handled in middleware HOF, not in the Functions runtime)

### AC-4 · Side effects — minimal, documented, reversible-where-possible
- **reassign** — sets `booking.technicianId`
- **complete** — sets `booking.status = 'COMPLETED'`
- **refund** — **stub**: logs `REFUND_INITIATED` to console; no Razorpay refund call yet (deferred); returns 202
- **waive-fee** — sets `booking.feesWaived = true`
- **escalate** — sets `booking.escalated = true`
- **note** — appends to `booking.internalNotes: string[]` (uses `bookingRepo.getById` to read current array, then `updateBookingFields`)

### AC-5 · Every override writes one audit-log entry via `appendAuditEntry()`
- `id = randomUUID()`
- `action ∈ { 'REASSIGN', 'COMPLETE', 'REFUND', 'WAIVE_FEE', 'ESCALATE', 'ADD_NOTE' }`
- `resourceType: 'booking'`, `resourceId: <orderId>`
- `payload` carries the action's reason + scoped data (e.g. `technicianId` on reassign, `priority` on escalate, `amountPaise` on refund, `note` on add-note)
- `timestamp = new Date().toISOString()`, `partitionKey = timestamp.slice(0,7)`
- Audit write happens **after** the booking mutation succeeds, so a 404 booking does not pollute the audit log

> Note: this story uses `appendAuditEntry()` directly rather than the higher-level `auditLog()` service introduced in E09-S05. This is consistent with the merged code (PR #25 predates the auditLog-service migration on these handlers). Future override additions should prefer `auditLog()` for fire-and-forget semantics.

### AC-6 · 404 / 422 / 400 envelopes
- Missing path id → 400 `MISSING_ID`
- Order not found → 404 `ORDER_NOT_FOUND`
- Body validation fail → 422 `VALIDATION_ERROR` with `details`

### AC-7 · `OverridePanel` component is wired into `OrderSlideOver`
- 6 grid buttons (Re-assign Tech, Mark Complete, Issue Refund, Waive Fee, Escalate, Add Note)
- Reassign opens a `ConfirmModal` with an extra "New Technician ID" text input
- Escalate exposes a `HIGH | CRITICAL` priority selector above the buttons
- Note uses `min length 1` for the reason input (note text is the reason)
- All other actions require `reason ≥ 5` (matches API)
- On success the panel calls `onActionComplete(updatedOrder)` and `OrdersClient` propagates the optimistic update so the row in the master table reflects the new state without a full refetch

### AC-8 · Lint cleanup — pre-existing `as Route` / `as SqlQuerySpec` casts removed
- Removed across `admin-web/app/(dashboard)/catalogue/...` and api orders/dashboard handlers
- Removal unblocks the pre-push lint hook (no functional change)

### AC-9 · Tests + smoke gates
- `api/tests/functions/admin/orders/overrides.test.ts` — 18 tests (happy path × 6, 422 validation × 6, 404 not found × 6) all green
- `admin-web/tests/OverridePanel.test.tsx` — 8 RTL tests
- `admin-web/tests/api-orders-overrides.test.ts` — 7 fetch-wrapper tests
- `admin-web/tests/OrderSlideOver.test.tsx` — adds OverridePanel mock
- Pre-push smoke gate: API 305 tests ✓, web 119 tests ✓
- `.codex-review-passed` shipped

---

## Tasks / Subtasks (as merged)

- [x] **WS-A — Zod schemas (`api/src/schemas/order-overrides.ts`)** — six body schemas
- [x] **WS-B — Booking repo extension (`api/src/cosmos/booking-repository.ts`)** — `updateBookingFields()` helper
- [x] **WS-C — Six handlers (`api/src/functions/admin/orders/overrides.ts`)** — registered with `app.http(...)`, audit-write after mutation
- [x] **WS-D — admin-web fetch wrappers (`admin-web/src/api/orders.ts`)** — six per-action fetchers
- [x] **WS-E — admin-web UI (`OverridePanel.tsx`, `ConfirmModal.tsx`)** — wired into `OrderSlideOver`, propagates `onActionComplete` up to `OrdersClient`
- [x] **WS-F — Lint cleanup** — strip stale `as Route` / `as SqlQuerySpec` casts across catalogue + orders + dashboard
- [x] **WS-G — Pre-Codex smoke + Codex review** — `.codex-review-passed`

---

## Dev Notes

### Why six endpoints instead of one polymorphic
A single `POST /orders/{id}/action` with `actionType` would have been smaller code-wise but worse for:
- **OpenAPI** — clean per-action schemas + RBAC clarity
- **Audit log** — one URL = one action keeps log filtering simple (`resourceType=booking, action=REFUND`)
- **Ops-manager / super-admin RBAC** — currently both can invoke all six; future story may restrict refund/waive-fee to super-admin only, easier to gate per-route than per-actionType

### Refund stub
Refund returns 202 + audits the intent but does NOT call Razorpay. A follow-up story (deferred — not yet on the sprint plan) will wire the actual `razorpay.payments.refund()` call. Until then the audit-log entry is the operator's record that they tried.

### Optimistic UI propagation
`OverridePanel` → `OrderSlideOver` → `OrdersClient.onOrderUpdated` → `OrdersClient` patches the order in its `orders[]` array. No refetch needed. If the API fails, the panel surfaces an error toast and the optimistic patch never happens.

### Patterns referenced
- `docs/patterns/firebase-errorcode-mapping.md` (general 422/404 envelope shape — same as catalogue handlers)

---

## Definition of Done

- [x] `cd api && pnpm typecheck && pnpm lint && pnpm test` green (305 tests)
- [x] `cd admin-web && pnpm typecheck && pnpm lint && pnpm test` green (119 tests)
- [x] All AC pass via test assertions
- [x] Pre-push smoke gates exit 0
- [x] `.codex-review-passed` marker present (committed in story branch)
- [x] PR #25 opened, CI green, merged 2026-04-22

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per PR #25 commit attribution)

### Completion Notes
PR #25 merged 2026-04-22 as commit 10a2962. Codex review clean.

### File List
See PR #25 — full list:
- API: `schemas/order-overrides.ts`, `functions/admin/orders/overrides.ts`, modifications to `booking-repository.ts`, `audit-log-repository.ts`, `orders/detail.ts`, `schemas/booking.ts`, `schemas/order.ts`
- admin-web: `src/api/orders.ts` (extended), `src/components/orders/OverridePanel.tsx`, `ConfirmModal.tsx`, `OrderSlideOver.tsx` (modified), `OrdersClient.tsx` (modified), `types/order.ts` (extended)
- Tests: `api/tests/functions/admin/orders/overrides.test.ts`, `admin-web/tests/OverridePanel.test.tsx`, `admin-web/tests/api-orders-overrides.test.ts`, `admin-web/tests/OrderSlideOver.test.tsx` (modified)
