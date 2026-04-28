# Story E05-S04: Accept/decline job-offer API with `_etag` optimistic concurrency

Status: shipped (PR #28, merged 2026-04-23, commit 8d47ec0) — **retroactive docs**

> **Epic:** E05 — Dispatch Engine + Job Offers (`docs/stories/README.md` §E05)
> **Sprint:** S3 (wk 5–6) · **Estimated:** ≤ 1 dev-day · **Priority:** P0 (closes the dispatch loop; blocks E06-S01 active-job state machine)
> **Sub-project:** `api/`
> **Ceremony tier:** Foundation (concurrency-critical, FR-9.1 audit-log boundary)
> **Plan file:** `plans/E05-S04.md` (retroactively authored — see issue #101)
> **Prerequisites:** E05-S02 (DispatchAttemptDoc / BookingEventDoc schemas + container accessors + `verifyTechnicianToken`)
> **Retroactive note:** PR #28 shipped without `docs/stories/E05-S04-*.md` or its plan file. Both are being added retroactively (issue #101). Acceptance criteria are reverse-engineered from `api/src/cosmos/dispatch-attempt-repository.ts`, `api/src/cosmos/booking-event-repository.ts`, `api/src/functions/job-offers.ts`, and `api/tests/bookings/accept-decline.test.ts`.

---

## Story

As **the platform** running a 30-second job-offer race between three technicians,
I want exactly one technician to win via Cosmos `_etag` optimistic concurrency, the losers to be cleanly notified, declines to be a pure audit-trail event (never feeding ranking), and a timer to reap stale offers,
so that **simultaneous accepts can't double-assign a booking, declined offers can't quietly count against techs, and unanswered offers don't leave bookings stuck in `SEARCHING` indefinitely** (FR-4.1, FR-5.1, FR-9.1).

---

## Acceptance Criteria

### AC-1 · `dispatchAttemptRepo.acceptAttempt(id, bookingId)` is the first-write-wins lock
- Point-reads the doc, asserts `status === 'PENDING'` and `expiresAt > now`
- Calls `container.item(id, bookingId).replace(updated, { accessCondition: { type: 'IfMatch', condition: resource._etag } })`
- Returns the updated doc on success
- Returns `null` when:
  - Doc missing
  - Status not PENDING (already ACCEPTED or EXPIRED)
  - `expiresAt <= now`
  - Cosmos throws 412 PreconditionFailed (`_etag` mismatch — concurrent caller won)
- Re-throws any non-412 Cosmos error

### AC-2 · `bookingEventRepo.append(event)` is append-only
- Auto-generates `id` (uuid) and `ts` (ISO datetime); caller passes only `bookingId`, `event`, optional `technicianId`/`adminId`/`metadata`
- **No update or delete methods exist on the repo.** Audit log entries are immutable by API design.
- Container partition key: `/bookingId`

### AC-3 · Accept handler — full state machine
- `PATCH /v1/technicians/job-offers/{bookingId}/accept`, `authLevel: 'anonymous'` (Firebase auth via `verifyTechnicianToken` in handler)
- Response codes:
  - 401 `UNAUTHORIZED` — missing/invalid Bearer token
  - 404 `OFFER_NOT_FOUND` — no `DispatchAttemptDoc` for this bookingId
  - 410 `OFFER_EXPIRED` — `attempt.status !== 'PENDING'` OR `expiresAt <= now`
  - 403 `FORBIDDEN` — `technicianId` not in `attempt.technicianIds`
  - 409 `OFFER_ALREADY_TAKEN` — `acceptAttempt` returned null (etag race)
  - 200 `{ bookingId, status: 'ASSIGNED' }` — winner
- Order matters: 404 → 410 → 403 → 409. Off-pool techs never reach the optimistic-concurrency step.

### AC-4 · On-win side effects
- `updateBookingFields(bookingId, { status: 'ASSIGNED', technicianId })`
- `bookingEventRepo.append({ event: 'TECH_ACCEPTED', technicianId, bookingId })`
- Loser FCM fan-out: `notifyLosingTechs(losingTechs, bookingId)` runs as a fire-and-forget `void`

### AC-5 · Loser FCM is topic-based, best-effort
- Sends `OFFER_CANCELLED` data payload to `topic: tech_${techId}` for each losing tech
- Wrapped in `Promise.allSettled` — one failed send doesn't abort the others
- Topic-based (not token) because at the time of dispatch a losing tech may have a stale token on file but still be subscribed to their topic; topic is the more durable channel

### AC-6 · Decline handler — pure audit, never affects state
- `PATCH /v1/technicians/job-offers/{bookingId}/decline`, `authLevel: 'anonymous'`
- 401 on missing/invalid token; 200 `{ bookingId, status: 'DECLINED' }` otherwise
- **Side effects:** writes ONLY `bookingEventRepo.append({ event: 'TECH_DECLINED', technicianId, bookingId })`
- Does **NOT** call `acceptAttempt`. Does **NOT** modify booking. Does **NOT** modify the `DispatchAttemptDoc`. Other techs in the pool can still accept; the offer expires naturally.
- The `TECH_DECLINED` event has **no ranking-related metadata field** — no `declineCount`, no `priorAcceptances`, no rate. Pure audit.

### AC-7 · FR-9.1 invariant preserved across the API surface
- Decline endpoint writes to `booking_events` only — never to `technicians`
- The `TECH_DECLINED` event shape (`{ event, technicianId, bookingId, ts }`) carries no ranking signal
- The dispatcher (E05-S02) reads only `TechnicianProfile` — it doesn't read `booking_events`. So even though declines are recorded for audit, they're physically unreachable from the ranking code path.
- Test asserts: `expect(declineEvent).not.toHaveProperty('rankingScore')`, `expect(declineEvent).not.toHaveProperty('declineCount')`

### AC-8 · `expireStaleOffers` timer (`*/30 * * * * *`)
- Queries `DispatchAttemptDoc` where `status='PENDING' AND expiresAt < now`
- For each: conditional replace to `EXPIRED` (with `_etag`), update booking to `UNFULFILLED`, append `OFFER_EXPIRED` event
- 412 PreconditionFailed is silently swallowed (a concurrent process — typically the accept handler — already mutated the doc; safe to skip)
- All work in `Promise.allSettled` so one stuck attempt doesn't block others

### AC-9 · Test matrix (10 explicit cases, all green)
- accept: 200 first caller, 409 etag race, 410 expired by time, 410 status not PENDING, 403 not in pool, 401 no auth, 404 no attempt
- decline: 200 ok, event written with no ranking field, 401 no auth
- All in `tests/bookings/accept-decline.test.ts`; 360 tests in suite green

### AC-10 · Codex + smoke green
- `bash tools/pre-codex-smoke-api.sh` exited 0
- `.codex-review-passed` marker shipped in PR #28

---

## Tasks / Subtasks (as actually shipped)

> Plan file `plans/E05-S04.md` is canonical. Below mirrors the work-stream summary.

- [x] **WS-A — Repositories (TDD)** — `dispatchAttemptRepo` (with `_etag`) + `bookingEventRepo` (append-only)
- [x] **WS-B — HTTP handlers + timer (TDD)** — `acceptJobOfferHandler` + `declineJobOfferHandler` + `notifyLosingTechs` + `expireStaleOffers`
- [x] **WS-C — Smoke gate + Codex review** — `bash tools/pre-codex-smoke-api.sh` PASSED; `.codex-review-passed` shipped at HEAD

---

## Dev Notes

### Why `_etag` + `If-Match` over a Cosmos transactional batch
A Cosmos transactional batch can group multiple operations on a single partition (`bookings` and `dispatch_attempts` share `bookingId` as partition key in this design — though they live in *different containers*, batches are scoped to `(container, partition)`). Even if we co-located, batches don't help with first-write-wins semantics across distributed callers; only `If-Match` does. The pattern here is the canonical Cosmos optimistic-concurrency idiom: read → assert business state → conditional replace by etag.

### Why decline does NOT touch the attempt
Two reasons. First, FR-9.1: a declined offer is purely a tech's intent signal, not a state change for the booking — the booking is still findable by the other techs in the pool. Second, race safety: if Decline mutated `DispatchAttemptDoc.status`, two techs declining simultaneously would race, and the loser would see 412. That's gratuitous error-handling complexity for an operation that doesn't need to succeed atomically.

### Why topic-based loser FCM (not token-based)
The accept handler doesn't have direct access to losing techs' FCM tokens — it has their `technicianId`s from `attempt.technicianIds`. Looking up tokens would require a Cosmos point-read per loser. Topic delivery (`tech_${techId}`) is fire-and-forget: if the tech subscribed via the technician-app's `FcmTopicSubscriber` (which already exists from E05-S03's auth flow), they get the message; if not, the send silently no-ops. The technician-app handles `OFFER_CANCELLED` by clearing its in-flight offer state.

### Why a 30-second timer cadence (and why not 10s or 60s)
Offers expire after 30s (`OFFER_WINDOW_MS` from E05-S02). A 30s cadence means worst-case latency between expiry and reconciliation is 30s — the booking sits in `SEARCHING` for at most 60s total. Faster cadence (10s) would triple the timer-trigger billing on Azure Functions Consumption; slower (60s) would let stale offers leak past the natural expiry. 30s matches the offer window, which is the natural unit. If billing or perceived latency become concerns, this is one constant in `app.timer(...)` — easy to tune.

### Why `authLevel: 'anonymous'` on the HTTP triggers
Azure Functions HTTP triggers default to `function` auth (an Azure-issued key). Setting `anonymous` disables that layer so the handler's own `verifyTechnicianToken` (Firebase Bearer ID token) is the *only* auth check. Two layers of auth would mean we'd need to ship a secret to the technician app *and* configure Firebase — pointless complexity.

### Why the timer's 412 swallow is correct
The timer is *eventually consistent*. A 412 means "someone else already finished the work I was about to do" — almost certainly the accept handler racing with the timer's reconcile. Re-trying is wrong (the work is done); throwing is wrong (this isn't an error). Silently skipping is the right behaviour. The `Promise.allSettled` wrapping ensures one swallowed 412 doesn't block other reconciliations in the same tick.

### What this story does NOT do
- **Re-dispatch** when an offer expires unfulfilled. The booking goes to `UNFULFILLED`; the operator dashboard (E09-S04) surfaces stuck bookings for manual escalation. Automated re-dispatch is out of scope.
- **Loser receipt/ack tracking.** The losing techs receive an FCM that may or may not arrive; we don't track delivery. The technician-app's `JobOfferViewModel` from E05-S03 closes the offer overlay on its own 30s countdown, so the FCM is just a UX nicety.

---

## Definition of Done

- [x] `cd api && pnpm typecheck && pnpm lint && pnpm test` — 360/360 tests green
- [x] `bash tools/pre-codex-smoke-api.sh` exited 0
- [x] All 10 accept/decline test cases asserted in `tests/bookings/accept-decline.test.ts`
- [x] `.codex-review-passed` marker shipped in PR #28
- [x] CI green on `main` after merge (commit 8d47ec0)

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per PR #28 commit attribution)

### Completion Notes
PR #28 merged 2026-04-23 19:28 UTC as commit 8d47ec0. With this story in main, the dispatch loop closes: paid booking → SEARCHING → top-3 FCM offers → first-to-accept wins via `_etag` → losers get OFFER_CANCELLED → unanswered offers EXPIRE in ≤30s → booking goes UNFULFILLED. The Karnataka FR-9.1 boundary holds across the API surface: declines are append-only audit, never ranking input.

### File List
See PR #28: 4 files added — `api/src/cosmos/dispatch-attempt-repository.ts` (48 lines), `api/src/cosmos/booking-event-repository.ts` (14 lines), `api/src/functions/job-offers.ts` (123 lines), `api/tests/bookings/accept-decline.test.ts` (190 lines). Plus 3 unrelated minor admin-web file touches that the merge bundle preserved.
