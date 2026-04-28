# Story E03-S04: Razorpay webhook → PAID + dispatcher stub + reconciliation timer

Status: shipped (PR #24, merged 2026-04-21, commit 06b879d) — **retroactive docs**

> **Epic:** E03 — Service Discovery + Booking Flow (`docs/stories/README.md` §E03)
> **Sprint:** S2 (wk 3–4) · **Estimated:** ≤ 1 dev-day · **Priority:** P0
> **Sub-project:** `api/`
> **Ceremony tier:** Foundation (introduces server-side payment webhooks, the booking `PAID` state, the dispatcher seam, and the daily reconciliation cron)
> **Prerequisite:** E03-S03a (booking schema + create/confirm endpoints exist and the Razorpay order id is stored on the booking).
> **Retroactive note:** This story file AND its plan file (`plans/E03-S04.md`) are both being written *after* the implementation merged — this is the only Class-A rescue in the E03 batch (per `docs/audit/story-completeness-2026-04-26.md` §Class A). PR #24 shipped without either artifact ever in main. Acceptance criteria below are reverse-engineered from the merged code (see `api/src/functions/webhooks.ts`, `api/src/schemas/webhook.ts`, `api/src/services/dispatcher.service.ts` at commit 06b879d, plus the booking-repository diff `markPaid` / `getByPaymentOrderId` / `getStaleSearching`). Codex reviews `docs/reviews/codex-e03-s04*.md` were committed in the same PR and document the 2 P1 fixes applied + 3 pushbacks.

---

## Story

As **the platform**,
I want a Razorpay-signed `payment.captured` webhook that authoritatively transitions a booking to `PAID` and triggers dispatch (even if the customer's `/v1/bookings/:id/confirm` call drops),
so that **paid bookings always reach a technician without depending on the client roundtrip succeeding** (FR-3.3, FR-3.4; threat-model INC-2 HMAC verification; NFR-C correctness).

---

## Acceptance Criteria

### AC-1 · Webhook endpoint with HMAC signature verification
- **Given** Razorpay POSTs `/v1/webhooks/razorpay` with header `x-razorpay-signature: <hex>`
- **When** the handler runs
- **Then** it computes `createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex')` over the **raw** request body
- **And** if the computed HMAC does not match the header, returns `400 { code: 'SIGNATURE_INVALID' }`
- **And** the verification uses the raw body bytes, never a re-stringified JSON object

### AC-2 · Fail-closed on missing secret
- **Given** the env var `RAZORPAY_WEBHOOK_SECRET` is unset (mis-configured deploy)
- **When** the handler runs
- **Then** it returns `500 { code: 'CONFIGURATION_ERROR' }` and never marks any booking PAID
- **And** the operator's runbook covers this state under "INC-2 webhook misconfig"

### AC-3 · Body validation via Zod
- **Given** the request body parses as JSON but is malformed for Razorpay
- **Then** the handler returns `400 { code: 'VALIDATION_ERROR', issues: [...] }` from the Zod schema
- **Given** the request body fails JSON parse entirely
- **Then** the handler returns `400 { code: 'PARSE_ERROR' }`
- **And** the schema (`RazorpayWebhookPayloadSchema`) requires only `event` + `payload.payment.entity.{id, order_id}` and `passthrough()`s every other field (Razorpay adds new fields over time)

### AC-4 · Only `payment.captured` triggers state change
- **Given** an event other than `payment.captured` (e.g. `payment.failed`, `order.paid`)
- **Then** the handler returns `200 { received: true }` and does NOT call `markPaid` or `triggerDispatch`
- **And** unknown events are silently acked (Razorpay must not see a non-200 or it will retry storm)

### AC-5 · Booking lookup by payment order id
- **Given** a valid `payment.captured` event with `payload.payment.entity.order_id`
- **When** `bookingRepo.getByPaymentOrderId(orderId)` is queried
- **Then** the matching booking is returned (or `null`)
- **And** when no booking matches, the handler returns `200 { received: true }` (idempotent — webhook may arrive for a deleted/rolled-back booking)

### AC-6 · Idempotency: replay returns 200 with no side effects
- **Given** a booking already in status `PAID`
- **When** the same webhook is replayed
- **Then** the handler returns `200 { received: true }` without calling `markPaid` again and without firing dispatch a second time

### AC-7 · State machine extended with `PAID`
- **Given** the booking schema's status enum
- **Then** `PAID` is a valid status
- **And** `markPaid(id, paymentId)` accepts source state `PENDING_PAYMENT` OR `SEARCHING` and transitions to `PAID`
- **And** `markPaid` returns `null` for any other source state (including the already-PAID idempotent case, which the handler short-circuits before calling)

### AC-8 · Race resolution — webhook arrives before client `/confirm`
- **Given** the webhook beats the client's `/v1/bookings/:id/confirm` call
- **Then** `markPaid(PENDING_PAYMENT)` succeeds → booking is `PAID`
- **And** when the client's `/confirm` then arrives, `confirmPayment(...)` finds the booking is already `PAID` and returns `200` with the existing PAID booking (idempotent — no `409`)
- **And** this matches Codex P1v2 fix in PR #24

### AC-9 · Dispatch triggered fire-and-forget
- **Given** `markPaid` returned an updated booking
- **Then** the handler calls `dispatcherService.triggerDispatch(bookingId)` without awaiting
- **And** any error in the dispatcher is swallowed (`.catch(() => {})`) so it does not fail the webhook ack
- **And** the handler returns `200` immediately so Razorpay does not retry on dispatch latency

### AC-10 · Dispatcher stub
- **Given** the dispatcher service
- **Then** `triggerDispatch(bookingId)` logs `DISPATCH_TRIGGERED bookingId=<id>` and returns `Promise<void>`
- **And** the stub is a single 6-line export — replaced by the real geo-rank + FCM dispatcher in E05-S02
- **And** unit tests assert the stub returns a resolved Promise and produces the expected log line

### AC-11 · Reconciliation timer (daily 02:00 UTC)
- **Given** the Azure Functions Timer trigger
- **Then** schedule is `0 0 2 * * *` (daily at 02:00 UTC)
- **And** the handler computes a 24-hour-ago ISO cutoff and calls `bookingRepo.getStaleSearching(cutoff)`
- **And** for each stale booking it logs `STALE_BOOKING bookingId=<id> createdAt=<iso>` via `context.log`
- **And** the handler does NOT auto-cancel — owner action via logs only (auto-cancel is a follow-up story)

### AC-12 · Test coverage (Vitest)
- **Given** the implementation
- **Then** unit tests cover: webhook payload schema (4 cases), `getByPaymentOrderId` (2 cases), `markPaid` (5 cases — both source states + already-PAID + bad state + not-found), `getStaleSearching` (4 cases), dispatcher stub (1 case), the HTTP handler (9 cases incl. all error paths + happy path + race), and the timer handler
- **And** total test count after the P1 Codex fixes is 315 (per PR #24 description)
- **And** `pnpm test` exits 0 with coverage above the project ≥ 80% threshold

### AC-13 · Codex review with documented pushbacks
- **Given** Codex flagged 5 findings across 3 review rounds
- **Then** 2 P1s were fixed (fail-closed secret + accept PENDING_PAYMENT in `markPaid`)
- **And** 3 findings were pushed back with documented reasoning in `docs/reviews/codex-e03-s04*.md`:
  - P1 "bypass SEARCHING" — dispatch is called directly, not change-feed-driven; SEARCHING is post-dispatch state, not load-bearing here
  - P1 "await dispatch" — fire-and-forget is the spec ("Returns 200 immediately"); avoids Razorpay retry storm on dispatch latency
  - P2 "use searchStartedAt" — field doesn't exist on the schema; out-of-scope schema change; `createdAt` is sufficient approximation

### AC-14 · No paid SaaS dependency added
- **Given** the ₹0 infra constraint (CLAUDE.md zero-cost stack)
- **Then** the implementation uses only `node:crypto`, `@azure/functions`, `@azure/cosmos`, and `zod` — all already in `api/package.json`
- **And** no new SaaS dependency was introduced

---

## Tasks / Subtasks (as actually shipped)

> Implementation merged via PR #24. Tasks below match the squashed commit's per-WS sequencing.

- [x] **WS-A — Schema + repository query (TDD)**
  - [x] `api/tests/schemas/webhook.test.ts` (4 cases)
  - [x] `api/src/schemas/webhook.ts` — `RazorpayWebhookPayloadSchema` with `passthrough()`
  - [x] `api/tests/cosmos/booking-repository-getByPaymentOrderId.test.ts` (2 cases)
  - [x] `api/src/cosmos/booking-repository.ts` — append `getByPaymentOrderId`

- [x] **WS-B — markPaid + getStaleSearching + dispatcher stub (TDD)**
  - [x] `api/tests/cosmos/booking-repository-markPaid.test.ts` (5 cases — incl. PENDING_PAYMENT path after Codex P1 fix)
  - [x] `api/src/cosmos/booking-repository.ts` — `markPaid` + `confirmPayment` idempotent-on-PAID (Codex P1v2)
  - [x] `api/tests/cosmos/booking-repository-getStaleSearching.test.ts` (4 cases)
  - [x] `api/src/cosmos/booking-repository.ts` — `getStaleSearching`
  - [x] `api/tests/services/dispatcher.service.test.ts` (1 case)
  - [x] `api/src/services/dispatcher.service.ts` — 6-line stub

- [x] **WS-C — Webhook handler + reconciliation timer (TDD)**
  - [x] `api/tests/webhooks/razorpay-webhook.test.ts` (9 cases incl. all error paths + happy + race)
  - [x] `api/src/functions/webhooks.ts` — `razorpayWebhookHandler` + `reconcileStaleBookingsHandler` + `app.http(...)` + `app.timer(...)` registrations

- [x] **WS-D — Smoke gate + Codex review** (3 rounds)
  - [x] Pre-Codex smoke gate green (`tools/pre-codex-smoke-api.sh`)
  - [x] Codex round 1 → P1: fail-closed on missing secret
  - [x] Codex round 1 → P1: accept PENDING_PAYMENT in markPaid (webhook-before-confirm race)
  - [x] Codex round 2 → P1v2: confirmPayment idempotent on PAID
  - [x] 3 pushbacks documented in `docs/reviews/codex-e03-s04*.md`
  - [x] `.codex-review-passed` marker shipped

- [x] **WS-E — Razorpay dashboard config** (out of code; ops runbook entry)

---

## Dev Notes

### What was actually shipped (per PR #24 file list)
- 3 new API src files: `schemas/webhook.ts`, `services/dispatcher.service.ts`, `functions/webhooks.ts`
- 1 modified API src file: `cosmos/booking-repository.ts` (+29 lines: `getByPaymentOrderId`, `markPaid`, `getStaleSearching`, idempotent-PAID branch in `confirmPayment`)
- 1 modified API src file: `functions/admin/orders/detail.ts` (+1 line — incidental)
- 6 new test files (25 new test cases at merge → 315 total tests after P1 fixes)
- 3 Codex review transcripts: `docs/reviews/codex-e03-s04.md` (1694 L), `codex-e03-s04-v2.md` (1308 L), `codex-e03-s04-v3.md` (1646 L)
- Incidental admin-web fixes: `Rail.tsx`, `CatalogueCategoryList.tsx`, `[categoryId]/page.tsx` (lint-fix passes that pulled in `Route` type re-imports for Next.js typed-route hrefs — not behavioural changes)

### Why this story (and its plan) are being written retroactively
- During the 2026-04-26 story-completeness audit (`docs/audit/story-completeness-2026-04-26.md`), PR #24 was found to have shipped without either `docs/stories/E03-S04-*.md` or `plans/E03-S04.md` ever in main.
- This is the only **Class A** gap (both artifacts missing) in the E03 batch.
- Both files are reverse-engineered from the merged code at commit 06b879d. Code is the source of truth; the docs follow.

### Key state-machine and security decisions
- **HMAC over raw body, not parsed JSON** — every webhook handler that uses `JSON.stringify(req.body)` for verification is broken (whitespace + key-order drift). The implementation uses `await req.text()` once, computes HMAC, then `JSON.parse(rawBody)` so the same string is used for both purposes.
- **Fail-closed on missing secret** — never accept a webhook in a misconfigured-secret state. Returning 500 (not 200) ensures Razorpay's retry queue surfaces the misconfig in their dashboard rather than silently swallowing payments.
- **markPaid accepts both PENDING_PAYMENT and SEARCHING** — the webhook can arrive in either order relative to the client `/confirm` call. Both paths must converge on `PAID`.
- **Fire-and-forget dispatch** — Razorpay retries non-200s aggressively; awaiting the dispatcher would couple webhook latency to dispatch latency. The dispatcher service has its own resilience (E05-S02).
- **Stale-booking reconciler is log-only** — auto-cancel/refund is too sharp a tool for the MVP; ops review via log tail until an owner UI lands.

### Patterns referenced
- N/A — this is an API-only story; no Android `docs/patterns/` files apply.

### Operator runbook impact
- New env var: `RAZORPAY_WEBHOOK_SECRET`. Must match the secret entered into the Razorpay dashboard webhook configuration.
- New log lines: `DISPATCH_TRIGGERED bookingId=<id>` and `STALE_BOOKING bookingId=<id> createdAt=<iso>`. The stale-booking line is the daily 02:00 UTC trigger; ops may need to investigate.
- New 500 condition: `CONFIGURATION_ERROR` from `/v1/webhooks/razorpay` indicates the secret is unset on the deployed Functions app.

---

## Definition of Done

- [x] `cd api && pnpm typecheck && pnpm lint && pnpm test` green (315 tests at merge)
- [x] All AC pass via test assertions
- [x] Pre-Codex smoke gate exited 0
- [x] `.codex-review-passed` marker shipped in PR #24 (3 Codex rounds)
- [x] Razorpay dashboard webhook configured (URL + event filter + secret) — verified by ops post-merge
- [x] `RAZORPAY_WEBHOOK_SECRET` env var set on the Azure Functions app
- [x] CI green on `main` after merge (commit 06b879d)

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per PR #24 commit attribution)

### Completion Notes
PR #24 merged 2026-04-21 at 12:28 UTC as commit 06b879d. Codex review took 3 rounds; 2 P1 fixes applied, 3 findings pushed back with documented reasoning. Coverage stayed above the ≥ 80% threshold.

### File List
See PR #24:
- New: `api/src/schemas/webhook.ts`, `api/src/services/dispatcher.service.ts`, `api/src/functions/webhooks.ts`
- Modified: `api/src/cosmos/booking-repository.ts` (+29), `api/src/functions/admin/orders/detail.ts` (+1)
- Tests (6): `tests/schemas/webhook.test.ts`, `tests/cosmos/booking-repository-{getByPaymentOrderId,markPaid,getStaleSearching}.test.ts`, `tests/services/dispatcher.service.test.ts`, `tests/webhooks/razorpay-webhook.test.ts`
- Codex transcripts: `docs/reviews/codex-e03-s04.md`, `codex-e03-s04-v2.md`, `codex-e03-s04-v3.md`
- Incidental admin-web lint cleanups: `Rail.tsx`, `CatalogueCategoryList.tsx`, `[categoryId]/page.tsx`
