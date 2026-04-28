# Story E10-S02: SSC levy quarterly automation — cron + owner approval + Razorpay transfer

Status: shipped (PR #32, merged 2026-04-25, commit 22e99a7) — **retroactive docs**

> **Epic:** E10 — Compliance, Audit & Launch Readiness (`docs/stories/README.md` §E10)
> **Sprint:** S6 (wk 11–12) · **Estimated:** 3.5–4.5h · **Priority:** P1 (compliance gate for B2B contracts)
> **Sub-projects:** `api/` only
> **Ceremony tier:** Foundation (real-money quarterly transfer to a fund account; complex idempotency story; auth/payment surface ⇒ /security-review trigger)
> **Prerequisite:** E09-S05 audit log; E09-S04 Razorpay Route service wrapper
> **FR / NFR:** FR-9.2 (SSC levy automation), NFR-C-2 (compliance audit trail)
> **Retroactive note:** Both story and plan files were never created. Reverse-engineered from PR #32 (file list above) and from `api/src/functions/admin/compliance/ssc-levy.ts`. Codex review on this story ran **7 rounds** before clean — many of the AC below capture invariants that were tightened during review.

---

## Story

As **Alok, the solo owner subject to Sector Skills Council levy reporting on B2B contracts**,
I want a quarterly Azure Functions timer to compute 1 % of the prior quarter's completed-booking GMV, file a `PENDING_APPROVAL` levy doc, alert me via FCM + email, then move the money to the SSC fund account on a single super-admin approval — with all the idempotency, retry, and reconciliation safety I'd want from a banker,
so that **I never miss a quarterly filing**, **I never double-pay**, and **the audit trail stands up to a regulator's inspection** (NFR-C-2).

---

## Acceptance Criteria

### AC-1 · Quarterly timer on `0 0 0 1 1,4,7,10 *`
- Fires at 00:00 on Jan 1, Apr 1, Jul 1, Oct 1 (UTC)
- Computes the *prior* quarter via `getPriorQuarter(new Date())` (e.g. fired on 2026-04-01 → "2026-Q1")
- **Known limitation (documented):** if the host is down on a trigger date and Azure replays the missed run more than ~24h later, `new Date()` may be in a different month. The Timer SDK does not expose the originally-scheduled occurrence time. At pilot scale (≤5k bookings/mo) the combination of `isPastDue` AND a cross-day drift on a quarterly boundary is implausible. If it ever occurs, the operator can re-run the timer manually or invoke the approve endpoint with a manually-constructed levy. This limitation lives as a comment block in `sscLevyTimerHandler`.

### AC-2 · GMV calculation queries `bookings` on `completedAt`, not `createdAt`
- "Realized revenue" semantics — a booking created in Q1 but completed in Q2 belongs to Q2's levy
- Status filter: completed bookings only

### AC-3 · Levy amount = floor(GMV × 0.01) in paise
- `levyRate` field on the doc is `0.01 | 0.02` literal — schema rejects other values
- `gmv` and `levyAmount` are integer paise

### AC-4 · `ssc_levies` Cosmos container — deterministic id, partition key `/quarter`
- `id = quarter` string (e.g. `"2026-Q1"`) — deterministic id prevents duplicate docs at the DB level
- Partition key `/quarter` — point reads dominate (one per timer fire + one per approve)
- Provisioned in `api/scripts/setup-cosmos.ts`

### AC-5 · Timer is idempotent at three layers
1. **Pre-creation read** — if a levy doc already exists for the quarter:
   - status `PENDING_APPROVAL` → re-attempt notifications (replay-safe; covers "previous run crashed before notifying owner")
   - any other status → log skip and return
2. **Cosmos 409 on create race** — if two parallel invocations both pass step 1, the second hits 409. The handler then reads the winner's doc and retries notifications if it's still `PENDING_APPROVAL`.
3. **Deterministic id** — even without the read, `id = quarter` makes the second create a 409 by construction.

### AC-6 · Notification fan-out is replay-safe
- `sendOwnerFcmNotification(levy)` — FCM topic `owner-alerts`
- `sendOwnerEmail(levy)` — Azure Communication Services email
- Run via `Promise.allSettled([fcm, acs])`
- Per-channel failure logs but does NOT throw
- **All-fail throws** — if both channels reject, the timer throws so Azure retries the invocation. On retry, the levy already exists in `PENDING_APPROVAL`, so the early-exit branch (AC-5.1) attempts notifications again without re-creating the doc

### AC-7 · `POST /v1/admin/compliance/ssc-levy/{id}/approve` — **super-admin only**
- 403 with `{ code: 'FORBIDDEN', requiredRoles: ['super-admin'] }` for any other role (tighter than other admin endpoints)
- 404 `LEVY_NOT_FOUND` if id missing
- 500 `CONFIGURATION_ERROR` if `SSC_FUND_ACCOUNT_ID` env var unset

### AC-8 · Approve flow — two-phase error handling
- **Pre-flight status gate** — accepts levies in status `PENDING_APPROVAL | FAILED | APPROVED`
  - `APPROVED` is retryable: a previous run wrote `APPROVED` then crashed before `createTransfer()` returned. Razorpay's `idempotencyKey` prevents double-charging.
  - Any other status → 409 `INVALID_STATUS` with `{ currentStatus }`
- **Status update to `APPROVED`** — written before the transfer
- **Phase 1: Razorpay transfer**
  - `createTransfer({ accountId: fundAccountId, amount: levy.levyAmount, notes: { quarter, levyId, initiatedBy }, idempotencyKey: 'ssc-levy-<id>' })`
  - **On failure** — mark `FAILED` (retryable), return 502 `TRANSFER_FAILED`. Money did NOT move; safe to retry.
- **Phase 2: persist transferred state**
  - `status: 'TRANSFERRED'`, `razorpayTransferId`, `transferredAt`
  - Audit log via `auditLog()` service: action `SSC_LEVY_TRANSFER`, resourceType `ssc_levy`, payload `{ quarter, levyAmount, razorpayTransferId }`, ip from `x-forwarded-for`
  - **On failure** — return 500 `POST_TRANSFER_RECORD_FAILED` with `{ transferId }`. **Do NOT mark FAILED** — money already moved; that would be a lie on the ledger. Operator reconciles manually.

### AC-9 · `idempotencyKey = 'ssc-levy-<levyId>'` prevents double-charging on retry
- Same key on every retry of the same levy
- Razorpay deduplicates server-side

### AC-10 · `SSC_LEVY_TRANSFER` added to `AuditAction` union
- Type-level addition in `api/src/types/admin.ts`
- Required env vars (`SSC_FUND_ACCOUNT_ID`) documented in `local.settings.example.json`

### AC-11 · Tests
- 16 Vitest assertions covering: timer happy path, idempotency skip, notifications, PENDING_APPROVAL retry, all-fail throw, FAILED retry, APPROVED retry, post-transfer 500, 404, 403, 409 (INVALID_STATUS), 502 (TRANSFER_FAILED), 409-idempotent create race, isPastDue documented limitation
- Pre-Codex smoke gate: 398 tests green, 0 lint warnings, 0 typecheck errors
- Codex review **7 rounds**, all P1/P2 resolved
- `.codex-review-passed` shipped
- `/security-review` ran clean (auth + payment surface)

---

## Tasks / Subtasks (as merged)

- [x] **WS-A — Schema + repo + container provisioning**
- [x] **WS-B — Notification + GMV services**
- [x] **WS-C — Timer + approve handler with two-phase error handling**
- [x] **WS-D — Razorpay service: `createTransfer({ idempotencyKey })`**
- [x] **WS-E — `SSC_LEVY_TRANSFER` audit action; env vars documented**
- [x] **WS-F — 16 test assertions; smoke gate; 7-round Codex review**

---

## Dev Notes

### Why three idempotency layers
Quarterly cron + real money + 1M-execution Azure free tier where retries are common = paranoia is mandatory. Layers compound:
- **Layer 1 (timer pre-read)** catches "previous run crashed after creating doc but before notifying"
- **Layer 2 (Cosmos 409 on create)** catches the rare "two timer invocations race" (Azure does sometimes invoke twice on cluster restart)
- **Layer 3 (deterministic id)** catches both above without any read at all

### Why APPROVED is retryable
The `APPROVED` status is set *before* `createTransfer()`. If the process dies between those two steps (host eviction, OOM, network hiccup), the next operator click would normally fail because the levy is no longer `PENDING_APPROVAL`. Adding `APPROVED` to the retryable gate, combined with Razorpay's `idempotencyKey`, makes the retry safe: if the transfer already happened on the first attempt, Razorpay returns the existing transfer; if it didn't, it happens now.

### Why two-phase error handling
A `FAILED` status means "no money moved; safe to retry." A `TRANSFERRED` status means "money moved; reconcile via Razorpay dashboard if state recording fails." Conflating the two would lie on the ledger and cause double-payment if the operator retries based on the misleading `FAILED`.

### Why notifications get an all-fail throw
A successful timer that nobody hears about is operationally indistinguishable from a failed timer. The owner needs to know to approve. So we treat "all notification channels failed" as "the timer didn't really succeed" — throw → Azure retries. The retry hits the early-exit branch (levy already exists in `PENDING_APPROVAL`) and re-attempts notifications without re-creating the doc.

### Why super-admin only on approve
Real money out the door. Even ops-manager (who can refund individual bookings) cannot approve a quarterly levy — that decision sits with the owner.

### Patterns referenced
- Razorpay idempotency-key pattern same as E09-S04 approve-all
- Cosmos repo conventions match `bookings-repository.ts` and `complaints-repository.ts`
- The two-phase error pattern is the same shape used in E09-S04's approve-all

---

## Definition of Done

- [x] `cd api && pnpm typecheck && pnpm lint && pnpm test` green (398 tests)
- [x] All AC pass via test assertions (16 SSC-levy specific)
- [x] Pre-Codex smoke gate exit 0
- [x] `.codex-review-passed` marker present (7 rounds clean)
- [x] `/security-review` ran clean (auth + payment surface)
- [x] PR #32 opened, CI green, merged 2026-04-25

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per PR #32 commit attribution)

### Completion Notes
PR #32 merged 2026-04-25 as commit 22e99a7. Codex review took 7 rounds; the resolved findings list is in the PR description. Notable: P1 round 1 (FAILED state trap), P1 round 2 (post-transfer DB error masked as FAILED), P2 round 2 (duplicate levy doc race — fixed via deterministic id), P1 round 3 (APPROVED state trap), P1 rounds 4–7 (`scheduleStatus` anchor oscillation — accepted as documented limitation).

### File List
- API: `schemas/ssc-levy.ts`, `cosmos/ssc-levy-repository.ts`, `services/ssc-levy.service.ts`, `functions/admin/compliance/ssc-levy.ts` (timer + approve handler co-located)
- Modified: `services/razorpay.service.ts` (added `createTransfer` with idempotencyKey), `types/admin.ts` (`SSC_LEVY_TRANSFER` audit action), `cosmos/client.ts`, `scripts/setup-cosmos.ts` (provision `ssc_levies`), `local.settings.example.json` (`SSC_FUND_ACCOUNT_ID`)
- Tests: `tests/functions/admin/compliance/ssc-levy.test.ts` (16 assertions)
- Bonus (incidental): `plans/E04-S01-trust-dossier.md` (unrelated planning artifact bundled into the same PR)
