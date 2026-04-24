# Story E06-S04: Razorpay Route split-payment on booking completion

Status: ready-for-dev

> **Epic:** E06 — Service Execution + Payment (`docs/stories/README.md` §E06)
> **Sprint:** S3 (wk 5–6) · **Estimated:** ≤ 1 dev-day · **Priority:** **P0 — blocks E06-S05, E07-S01, all of E08**
> **Sub-project:** `api/`
> **Ceremony tier:** Foundation (payment story — security-sensitive, Codex + /security-review both required)

---

## Story

As the **solo founder-operator (Alok)** building homeservices-mvp,
I want the system to automatically settle payment via Razorpay Route when a booking transitions to `COMPLETED` — splitting commission to the owner and the net amount to the technician's linked bank account,
so that **technicians are paid accurately on every job, the business earns its commission via a ladder tied to tech milestone completions, and every transfer attempt is audited and reconciled daily — without any possibility of a double-transfer or a failed transfer leaving the booking in an inconsistent state.**

---

## Acceptance Criteria

### AC-1 · Commission ladder applies correctly on COMPLETED trigger
- **Given** a booking transitions to `COMPLETED` with `finalAmount` (or `amount` fallback) of `X` paise
- **And** the technician's `completedJobCount` is **below 50** at the time of settlement
- **Then** commission deducted = `round(X × 0.22)` (2200 bps); tech receives `X − commission`
- **And** `commissionBps: 2200` is stored in the `wallet_ledger` entry
- **Given** `completedJobCount` ≥ 50
- **Then** commission = `round(X × 0.25)` (2500 bps); tech receives `X − commission`
- **And** `commissionBps: 2500` is stored in the `wallet_ledger` entry

### AC-2 · Idempotency — double-fire does not double-transfer
- **Given** the Cosmos change-feed fires twice for the same COMPLETED booking (e.g., due to retry)
- **Then** only one `wallet_ledger` entry is created for that booking
- **And** `RazorpayRouteService.transfer()` is called exactly once
- **And** the second invocation returns without error

### AC-3 · Audit log written BEFORE Razorpay call
- **Given** a COMPLETED booking triggers settlement
- **Then** an `audit_log` entry with `action: 'ROUTE_TRANSFER_ATTEMPT'` is written before the Razorpay API call is made
- **And** regardless of transfer success/failure, a `ROUTE_TRANSFER_SUCCESS` or `ROUTE_TRANSFER_FAILED` audit entry is written after

### AC-4 · Route failure leaves booking COMPLETED, entry marked FAILED
- **Given** `RazorpayRouteService.transfer()` throws an error
- **Then** the booking status remains `COMPLETED` (no rollback)
- **And** the `wallet_ledger` entry has `payoutStatus: 'FAILED'` with `failureReason` set
- **And** a `ROUTE_TRANSFER_FAILED` audit entry is written

### AC-5 · Daily reconciliation retries stale PENDING entries
- **Given** a `wallet_ledger` entry has `payoutStatus: 'PENDING'` and is older than 2 hours
- **When** the daily reconciliation cron runs
- **Then** the transfer is retried with the same idempotency key (Razorpay deduplicates)
- **And** on success: entry is marked `PAID`; on failure: entry is marked `FAILED`

### AC-6 · Mismatch FCM alert sent to owner
- **Given** the reconciliation cron finds any FAILED or retry-failed entries
- **Then** an FCM data message is sent to topic `owner_ops_alerts` with `type: 'ROUTE_TRANSFER_MISMATCH'`
- **And** an audit entry `RECON_MISMATCH_ALERT` is written with counts

### AC-7 · Tech receives FCM earnings update on successful transfer
- **Given** the Route transfer succeeds
- **Then** an FCM data message is sent to topic `technician_<technicianId>` with `type: 'EARNINGS_UPDATE'`
- **And** `technician.completedJobCount` is incremented by 1

### AC-8 · No card data in code; idempotency key = bookingId
- **Given** the Route transfer call
- **Then** `idempotencyKey` passed to `RazorpayRouteService.transfer()` equals the booking ID
- **And** no raw card/bank-account data is stored anywhere in our codebase

---

## Tasks / Subtasks

> TDD: test file committed before implementation file per CLAUDE.md.

- [ ] **T1 — Schema + type extensions (no tests needed — pure type changes)**
  - [ ] T1.1 Extend `audit-log.ts` role enum to include `'system'`; extend `types/admin.ts` AuditAction union
  - [ ] T1.2 Create `api/src/schemas/wallet-ledger.ts` (WalletLedgerEntry Zod schema)
  - [ ] T1.3 Extend `api/src/schemas/technician.ts` — add `completedJobCount` optional field
  - [ ] T1.4 Add `getWalletLedgerContainer()` to `api/src/cosmos/client.ts`

- [ ] **T2 — Commission calculator (TDD: RED → GREEN → commit)**
  - [ ] T2.1 (RED) Write `api/tests/unit/commission.service.test.ts` — 22%/25% ladder, rounding
  - [ ] T2.2 (GREEN) Implement `api/src/services/commission.service.ts`
  - [ ] T2.3 Commit

- [ ] **T3 — Wallet ledger repository + tech settlement helpers**
  - [ ] T3.1 Implement `api/src/cosmos/wallet-ledger-repository.ts`
  - [ ] T3.2 Add `getTechnicianForSettlement()`, `incrementCompletedJobCount()` to `technician-repository.ts`
  - [ ] T3.3 Extend `api/src/services/fcm.service.ts` — `sendTechEarningsUpdate()`, `sendOwnerRouteAlert()`
  - [ ] T3.4 Commit

- [ ] **T4 — Route transfer change-feed trigger (TDD)**
  - [ ] T4.1 (RED) Write `api/tests/unit/trigger-booking-completed.test.ts` — idempotency, failure isolation, audit order
  - [ ] T4.2 (GREEN) Implement `api/src/functions/trigger-booking-completed.ts`
  - [ ] T4.3 Commit

- [ ] **T5 — Daily reconciliation cron (TDD)**
  - [ ] T5.1 (RED) Write `api/tests/unit/trigger-reconcile-payouts.test.ts` — retry, alert, no-alert
  - [ ] T5.2 (GREEN) Implement `api/src/functions/trigger-reconcile-payouts.ts`
  - [ ] T5.3 Commit

- [ ] **T6 — Pre-Codex smoke gate + review**
  - [ ] T6.1 `bash tools/pre-codex-smoke-api.sh` — must exit 0
  - [ ] T6.2 `codex review --base main` (authoritative) + `/security-review` in parallel
  - [ ] T6.3 `git push` → CI green → PR

---

## Dev Notes

### Context from previous stories
- **E06-S03** set `finalAmount` on booking docs when add-ons are approved. `finalAmount` takes precedence over `amount` for settlement.
- **E03-S04** wired Razorpay webhook → booking `PAID`. The `paymentId` field is always set by `PAID` state.
- `api/src/services/razorpayRoute.service.ts` already exists with `transfer()` method. Use it — don't reinvent.
- `api/src/cosmos/finance-repository.ts` has batch-payout ledger logic. This story adds per-booking settlement logic in a new repository file to keep concerns separate.

### Security invariants (non-negotiable)
1. `audit_log` entry with `action: 'ROUTE_TRANSFER_ATTEMPT'` written **before** Razorpay API call
2. Route failure → booking stays `COMPLETED`; wallet_ledger marked `FAILED`; reconciliation picks it up
3. Idempotency key = bookingId; never double-transfer
4. No card/account data stored — only Razorpay transfer ID reference

### Partition key note
`wallet_ledger` container: partition key field is `partitionKey` set to `technicianId` (follow existing `finance-repository.ts` pattern). Document `id` = `bookingId` to enforce uniqueness per booking at the storage layer.

### Cosmos change-feed trigger env var
Add `COSMOS_CONNECTION_STRING` (format: `AccountEndpoint=<COSMOS_ENDPOINT>;AccountKey=<COSMOS_KEY>`) to `local.settings.example.json` — required by Azure Functions Cosmos trigger binding.

---

## Definition of Done

- [ ] `pnpm typecheck && pnpm lint && pnpm test:coverage` green
- [ ] All AC pass (test assertions, not manual)
- [ ] Pre-Codex smoke gate exits 0
- [ ] `.codex-review-passed` marker present
- [ ] `/security-review` complete (payment story trigger)
- [ ] PR opened; CI green on `main`

---

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes
_To be filled by dev agent_

### File List
_To be filled by dev agent_
