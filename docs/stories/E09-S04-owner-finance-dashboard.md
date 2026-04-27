# Story E09-S04: Owner Finance Dashboard — P&L, Payout Queue, Approve-All

Status: shipped (PR #21, merged 2026-04-22, commit 07c3d60) — **retroactive docs**

> **Epic:** E09 — Owner Operations + Finance (`docs/stories/README.md` §E09)
> **Sprint:** S5 (wk 9–10) · **Estimated:** 3.5–4.5h · **Priority:** P1
> **Sub-projects:** `api/` + `admin-web/`
> **Ceremony tier:** Foundation (Razorpay Route real money movement; new Cosmos containers; weekly timer trigger; auth/payment surface ⇒ /security-review trigger)
> **Prerequisite:** E02-S04 admin auth; E06-S04 Razorpay Route split-payment foundation merged
> **Implementation split:** Plan was split across `plans/E09-S04a.md` (API layer — schemas, repo, service, 3 HTTP handlers, weekly cron) and `plans/E09-S04b.md` (admin-web `/finance` page — recharts P&L, payout queue table, approve-all modal). Both shipped in PR #21.
> **FR / NFR:** FR-8.1 (P&L), FR-8.2 (Payout queue + approve-all)
> **Retroactive note:** Both plan files were committed in PR #21 but the story file was never created. Acceptance criteria are reverse-engineered from the merged code (see PR #21 file list).

---

## Story

As **Alok, the solo owner**,
I want a finance page that shows daily P&L over a date range as a bar chart, the current week's per-tech payout queue, and a one-click "Approve All" action that runs Razorpay Route batch transfers,
so that **every Monday at 06:00 IST I can settle the previous week in under 2 minutes** (FR-8.1, FR-8.2) **without touching the Razorpay dashboard or a spreadsheet**.

---

## Acceptance Criteria

### AC-1 · `GET /v1/admin/finance/summary?from=&to=` — daily P&L
- **Given** a `super-admin` or `ops-manager` caller
- **And** a date range
- **When** they call the endpoint
- **Then** the response is `FinanceSummarySchema = { entries: DailyPnLEntry[], totals: { grossRevenue, commission, netToOwner } }`
- **And** each entry is `{ date, grossRevenue, commission, netToOwner }` in **paise integers**
- **And** the aggregation queries `bookings` cross-partition where `status = COMPLETED` and `completedAt ∈ [from, to]`
- **And** commission per booking uses the booking's denormalised `commissionBps` (not env-default)

### AC-2 · `GET /v1/admin/finance/payout-queue` — current week, snapshot or live
- Response is `PayoutQueueSchema = { weekStartIso, entries: PayoutQueueEntry[] }`
- Each entry: `{ technicianId, name, jobsCount, grossPaise, commissionPaise, netPayablePaise, alreadyTransferred }`
- Tries to read the prior week's `payout_snapshots` doc first (pre-cached by Monday 00:30 UTC timer)
- Falls back to live aggregation if the snapshot doesn't exist
- Excludes techs whose `wallet_ledger` already has a `TRANSFER` entry for this week (idempotency)
- Prior-week bounds are computed in IST (Codex P1 fix in `508112a`)

### AC-3 · `POST /v1/admin/finance/payouts/approve-all` — Razorpay Route batch
- **Super-admin only** (not ops-manager)
- Iterates the payout queue
- For each tech: calls `RazorpayRouteService.transfer(linkedAccountId, amount, idempotencyKey)`
- Writes a `wallet_ledger` `TRANSFER` entry on success
- **Zero-amount guard:** skips entries where `netPayablePaise === 0` (Codex P1)
- **Per-entry error capture:** one tech failing does not abort the batch; failures are returned in the response
- Writes an audit-log entry `finance.approve-all` per request via `auditLog()` service
- Response: `ApprovePayoutsResponseSchema = { transferred: [...], skipped: [...], failed: [...] }`

### AC-4 · Auth + error contract
- 401 / 403 envelope as elsewhere
- 502 `UPSTREAM` on Razorpay or Cosmos failure
- 422 on Zod validation
- Approve-all `idempotency-key` per call so an Azure Function retry does not double-transfer

### AC-5 · Monday 00:30 UTC timer pre-caches prior-week snapshot
- Azure Timer Trigger CRON `0 30 0 * * 1` (Monday 00:30 UTC = 06:00 IST)
- Aggregates the *prior* week's payout queue into `payout_snapshots`
- Idempotent — re-running the timer for an existing week reuses the doc

### AC-6 · `/finance` page renders P&L + payout queue + approve-all flow
- Server Component shell at `admin-web/app/(dashboard)/finance/page.tsx`, `dynamic = 'force-dynamic'`
- `FinanceClient` (`'use client'`) owns date-range state, fetches summary + queue in parallel
- `PnLChart` is a recharts `BarChart` with three series (grossRevenue, commission, netToOwner)
- `PayoutQueueTable` shows tech, jobs, gross, commission, net payable
- `ApproveAllModal` is `role="dialog"`, shows formatted total, Confirm calls `approveAllPayouts`, Cancel dismisses; loading state disables Confirm
- "Approve All" button is disabled when the queue is empty
- Money formatting: server returns paise integers; `formatPaise()` divides by 100 and renders `₹` with thousands separators

### AC-7 · No paid SaaS introduced
- recharts (OSS) added as the chart library — no Highcharts/Tableau/etc.
- razorpay npm SDK is the existing payments dependency

### AC-8 · Tests + smoke gates + Codex
- API: schema tests, repo tests, service tests (mocked razorpay SDK), 4 handler tests, timer-trigger test (265/265 green)
- admin-web: 3 component RTL tests + ApproveAllModal interaction test (104/104 green)
- TypeScript strict (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) green both sides
- Pre-Codex smoke gates exit 0
- `codex review --base main` clean — all P1/P2 findings resolved (prior-week IST bounds, audit-log API base URL, pre-commit hook coverage); `.codex-review-passed` shipped
- `/security-review` passed (auth + Razorpay surface)

---

## Tasks / Subtasks (as merged — split across S04a + S04b)

### S04a — API layer (`plans/E09-S04a.md`)
- [x] WS-A: install `razorpay` package + create `api/src/schemas/finance.ts`
- [x] WS-B: `api/src/cosmos/finance-repository.ts` — `getDailyPnL`, `getPayoutQueue`, `getLedgerTransfer`, `writeLedgerEntry`, `getTechnicianLinkedAccount`, `getWeekSnapshot`, `upsertWeekSnapshot`
- [x] WS-C: `api/src/services/razorpayRoute.service.ts` — `IRazorpayRouteService` interface + class (TDD with mocked SDK)
- [x] WS-D: 3 HTTP handlers — `summary.ts`, `payout-queue.ts`, `approve-payouts.ts` with `requireAdmin` + Zod validation + audit log call
- [x] WS-E: Timer trigger `weekly-aggregate.ts` (`0 30 0 * * 1`)

### S04b — admin-web (`plans/E09-S04b.md`, depends on S04a)
- [x] `admin-web/src/api/finance.ts` — `fetchFinanceSummary`, `fetchPayoutQueue`, `approveAllPayouts`, `formatPaise`
- [x] `PnLChart` (recharts), `PayoutQueueTable`, `ApproveAllModal`, `FinanceClient`
- [x] `app/(dashboard)/finance/page.tsx` shell
- [x] RTL tests for chart (renders container + 3 Bar series), table (rows, callback, disabled-when-empty), modal (formatted total, callbacks, loading)

### Cross-cutting
- [x] WS-F: Pre-Codex smoke gates (api + web) → Codex review → `/security-review` → `.codex-review-passed`

---

## Dev Notes

### Why split into S04a / S04b
Original plan exceeded the size gate. S04a is the API layer (no UI dependency); S04b consumes S04a's endpoints. Both committed in the same PR #21 because they shipped in lockstep but were planned independently.

### Idempotency strategy on approve-all
Two layers:
1. **Per-tech ledger check** — the queue itself excludes techs with an existing weekly `wallet_ledger` `TRANSFER`. So even calling approve-all twice in the same week is safe — second call sees an empty queue.
2. **Per-call idempotency key** — passed to Razorpay Route; protects against Azure Function retry storms within a single request.

### Two-phase error handling on approve-all
Pre-transfer failures (validation, missing linked account) → marked `failed` in the response, no money moved. Post-transfer failures (ledger write fails after Razorpay returns success) → return 500 *without* rolling back the transfer (money already moved; operator reconciles via the SSC-levy pattern from E10-S02). This is the same shape used by E10-S02's quarterly transfer.

### Codex review (key resolved findings)
- **P1 — prior-week bounds:** original code used UTC for the week boundary; corrected to IST so "previous week" matches the operator's mental model of "last week's bookings."
- **P1 — audit-log API base URL:** admin-web client used a stale base URL constant; corrected and pre-commit hook coverage extended.

### Patterns referenced
- `docs/patterns/firebase-errorcode-mapping.md` — Razorpay error mapping mirrors Firebase Auth error mapping (`razorpay-error-mapping.md` to be authored if not present)

---

## Definition of Done

- [x] `cd api && pnpm typecheck && pnpm lint && pnpm test:coverage` green (≥80%)
- [x] `cd admin-web && pnpm typecheck && pnpm lint && pnpm test` green
- [x] All AC pass via test assertions
- [x] Pre-Codex smoke gates exit 0 (api + web)
- [x] `.codex-review-passed` marker present
- [x] `/security-review` ran clean (auth + payment surface)
- [x] PR #21 opened, CI green, merged 2026-04-22

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per PR #21 commit attribution)

### Completion Notes
PR #21 merged 2026-04-22 as commit 07c3d60. PR also incidentally bundled E09-S05 audit-log scaffolding and E05-S01 technician geospatial repo (cross-cutting work that landed in the same window). The Codex review covered all of it.

### File List
See PR #21 — finance API (`schemas/finance.ts`, `cosmos/finance-repository.ts`, `services/razorpayRoute.service.ts`, `functions/admin/finance/{summary,payout-queue,approve-payouts,weekly-aggregate}.ts`), admin-web (`app/(dashboard)/finance/page.tsx`, `src/api/finance.ts`, `src/components/finance/{PnLChart,PayoutQueueTable,ApproveAllModal,FinanceClient}.tsx`), plus test files for each.
