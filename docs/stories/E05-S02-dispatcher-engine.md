# Story E05-S02: Dispatcher engine (geo-rank + FCM job offers + dispatch attempts)

Status: shipped (PR #26, merged 2026-04-23, commit 5b9c5ff) — **retroactive docs**

> **Epic:** E05 — Dispatch Engine + Job Offers (`docs/stories/README.md` §E05)
> **Sprint:** S3 (wk 5–6) · **Estimated:** ≤ 1.5 dev-days · **Priority:** P0 (core value loop)
> **Sub-project:** `api/`
> **Ceremony tier:** Foundation (cross-cutting service, Karnataka FR-9.1 compliance gate, FCM integration)
> **Plan file:** `plans/E05-S02.md` (retroactively authored — see issue #99)
> **Prerequisites:** E05-S01 (TechnicianProfile schema + ST_WITHIN repo), E03-S04 (booking PAID transition)
> **Retroactive note:** PR #26 shipped without `docs/stories/E05-S02-*.md` or its plan file. Both are being added retroactively (issue #99). Acceptance criteria below are reverse-engineered from `api/src/services/dispatcher.service.ts`, `api/src/functions/technicians.ts`, `api/src/middleware/verifyTechnicianToken.ts`, and `api/tests/integration/dispatcher-up-ranking.test.ts`. Plan file holds canonical step-by-step.

---

## Story

As **the platform** and as **the operator complying with Karnataka FR-9.1**,
I want the dispatcher service to fan out a paid booking to the top 3 nearest, skilled, KYC-approved, online, available technicians via FCM data messages within ~2 seconds, with rankings that physically cannot incorporate decline history,
so that **the customer's tech is found fast, the operator stays compliant, and the architecture makes future regulatory drift impossible** (FR-4.1, FR-9.1).

---

## Acceptance Criteria

### AC-1 · `dispatcherService.triggerDispatch(bookingId)` orchestrator
- Reads booking by id; **early-returns** if booking is missing or `booking.status !== 'PAID'` (idempotent — accidental re-trigger after `ASSIGNED` is a no-op + log line)
- Calls `getTechniciansWithinRadius(lat, lng, 10, serviceId)` (E05-S01) — bounding-box query
- Post-filters with `haversine(...) <= DISPATCH_RADIUS_KM` to drop bounding-box corner techs that are inside the square but outside the actual 10 km circle (Codex P1 fix in-PR)
- Zero candidates → booking transitions `PAID → UNFULFILLED`, no FCM sent, no `DispatchAttemptDoc` created
- Otherwise: takes `TOP_N = 3` after ranking

### AC-2 · `rankTechnicians(techs, lat, lng)` is a pure, exported, decline-blind function
- **Primary sort:** distance ascending (haversine from booking lat/lng to tech `location.coordinates[1], [0]` — `[lng, lat]` GeoJSON order)
- **Secondary sort:** `tech.rating` descending; treats undefined as `0` so unrated techs sort last among equals
- Exported separately from `dispatcherService` so it can be unit-tested without mocking Cosmos
- **Reads only `location` and `rating`** — `TechnicianProfile` schema (E05-S01) does not expose `declineCount`/`declineHistory`/`declines`, so a decline-aware variant would require a schema regression that the CI gate catches

### AC-3 · `DispatchAttemptDoc` recorded with 30-s expiry
- Schema (`api/src/schemas/dispatch-attempt.ts`): `id`, `bookingId`, `technicianIds[]`, `sentAt`, `expiresAt`, `status: 'PENDING' | 'ACCEPTED' | 'EXPIRED'`
- `expiresAt = sentAt + OFFER_WINDOW_MS (30_000 ms)`
- Created via `getDispatchAttemptsContainer().items.create(attempt)` BEFORE the FCM fan-out — so a tech who accepts before the FCM ack does not race
- Container partitioned by `/bookingId` (one attempt per booking; future re-dispatch creates a new doc with new id)

### AC-4 · Booking transitions `PAID → SEARCHING` after attempt is created
- Codex P2 fix in-PR: do this transition *after* `items.create(attempt)` so the stale-booking reconciler (E05-S04 timer) can find unanswered dispatches by status `SEARCHING` + `expiresAt < now`

### AC-5 · FCM `JOB_OFFER` data messages to top 3
- Silent data-only payload (no `notification` key) — system tray stays clean
- Payload keys (all string-typed because FCM data values must be strings):
  - `type: "JOB_OFFER"`
  - `bookingId`, `serviceId`, `addressText`, `slotDate`, `slotWindow`
  - `amount: String(booking.amount)` (paise integer rendered as string)
  - `distanceKm: String(haversine(...))` (haversine recomputed per-tech for accuracy)
  - `expiresAt: <ISO string>`
  - `dispatchAttemptId: <UUID>`
- Sent via `Promise.allSettled` so a single tech with a stale FCM token does not abort the fan-out
- Techs with no `fcmToken` are still in `DispatchAttemptDoc.technicianIds` (so they could accept via the in-app UI flow if the app polls or syncs offline) — they just don't receive the push

### AC-6 · `PATCH /v1/technicians/fcm-token` endpoint
- Behind `verifyTechnicianToken` (Firebase ID token Bearer)
- Body: `{ fcmToken: string.min(1) }` (Zod-validated)
- Reads existing technician doc (point-read by uid), upserts with new `fcmToken` field
- Returns `200 { ok: true }` on success; `401 UNAUTHORIZED` no/invalid token; `400 VALIDATION_ERROR` invalid body; `400 PARSE_ERROR` malformed JSON
- Wired at `app.http('patchTechnicianFcmToken', { route: 'v1/technicians/fcm-token', methods: ['PATCH'], handler })`

### AC-7 · `verifyTechnicianToken` middleware uses `verifyFirebaseIdToken`
- Codex P1 fix in-PR: use the project's `verifyFirebaseIdToken` wrapper (which initialises Firebase Admin if not already), not the raw `getAuth().verifyIdToken` — guarantees cold-start safety on Azure Functions

### AC-8 · Karnataka FR-9.1 CI gate (`tests/integration/dispatcher-up-ranking.test.ts`)
- 3 tests, **must stay green forever** without an ADR + legal sign-off:
  1. Closer technician with low rating ranks above farther technician with perfect rating, even with simulated heavy decline history
  2. Ranking is stable across all 6 input-order permutations
  3. `TechnicianProfile` schema does not expose `declineCount`, `declineHistory`, or `declines` (defends against future schema additions)
- Test scenario uses Ayodhya, UP coordinates (BOOKING_LAT 26.7922, BOOKING_LNG 82.1998) — the pilot market — so the test reads as a Karnataka-pilot regulatory check

### AC-9 · Geo helper extension
- `haversine(lat1, lng1, lat2, lng2)` added to `api/src/cosmos/geo.ts` — earth radius 6371 km, returns kilometres
- Used both inside `rankTechnicians` and inside the orchestrator's post-filter

### AC-10 · Test coverage (CI green)
- 61 test files / 353 tests passing
- New: `tests/unit/dispatcher.service.test.ts` (orchestrator behaviour, mocked Cosmos + FCM), `tests/unit/technicians.test.ts` (FCM-token endpoint), `tests/integration/dispatcher-up-ranking.test.ts` (Karnataka invariance gate, 3 assertions)
- Modified: existing `tests/services/dispatcher.service.test.ts` (extends old stub tests for new orchestrator behaviour)

---

## Tasks / Subtasks (as actually shipped)

> Plan file `plans/E05-S02.md` is canonical. Below mirrors the work-stream summary.

- [x] **WS-A — Schemas + container accessors** — `dispatch-attempt.ts`, `booking-event.ts`, `getDispatchAttemptsContainer`, `getBookingEventsContainer`, `haversine` in `geo.ts`
- [x] **WS-B — Karnataka FR-9.1 CI gate (TDD red)** — `tests/integration/dispatcher-up-ranking.test.ts` written FIRST so the dispatcher implementation has to satisfy it before any merge
- [x] **WS-C — Dispatcher service (TDD green)** — `tests/unit/dispatcher.service.test.ts` red → `dispatcher.service.ts` rewrite green
- [x] **WS-D — Technician token middleware + FCM-token endpoint (TDD)** — `verifyTechnicianToken.ts` + `tests/unit/technicians.test.ts` red → `patchFcmTokenHandler` in `functions/technicians.ts` green
- [x] **WS-E — Smoke gate + Codex review** — `tools/pre-codex-smoke-api.sh` exit 0; `.codex-review-passed` shipped at HEAD

---

## Dev Notes

### Why `rankTechnicians` is exported
The pure ranking function is the **legal-compliance surface** of this story. Embedding it inside the dispatcher orchestrator would have made the Karnataka invariance test impossible to run without spinning up Cosmos mocks. Exporting `rankTechnicians` lets the test reach in directly with constructed `TechnicianProfile` fixtures and assert behaviour without any infrastructure. This is the *only* reason it's exported — production code should call `triggerDispatch`, not `rankTechnicians` directly.

### Why TOP_N=3 (not 5 or 1)
Three is the minimum that gives the customer redundancy if the closest tech declines or doesn't see the offer. One would mean every decline forces a re-dispatch, doubling p95 latency. Five would saturate the FCM fan-out for marginal gain — the 4th and 5th candidates are typically too far for good service. Three is the operator's pilot recommendation; it can be promoted to a PostHog-controlled variable if the dispatch funnel data justifies tuning.

### Why `OFFER_WINDOW_MS = 30_000`
Empirical from Indian Q-commerce playbooks (Dunzo / Swiggy Genie operate at 30–60s acceptance windows). Less than 30s and a tech who picks up their phone mid-offer can't realistically read + accept; more than 60s and the customer's "find a tech" perceived wait grows past the 2-min FR-4.1 SLA. 30s is a defensible mid-point; the constant lives at the top of `dispatcher.service.ts` so future tuning is one line.

### Why both `SEARCHING` and `UNFULFILLED` transitions matter
- `SEARCHING` is the state E05-S04's stale-offer reconciler queries on (`status='PENDING' AND expiresAt < now`). If the dispatcher transitioned to `ASSIGNED` directly we'd lose visibility into "tech offered, no answer".
- `UNFULFILLED` short-circuits the loop when zero candidates exist — there is no point in setting `SEARCHING` because there is nothing to search; the booking can be refunded immediately.

### Why FCM `Promise.allSettled`, not `Promise.all`
A single technician with a stale FCM token (deleted from Firebase) will throw on `messaging.send`. `Promise.all` would reject the entire promise chain, leaving the other techs un-notified. `Promise.allSettled` lets each fan-out succeed or fail independently — the booking attempt is durable in Cosmos either way.

### Why no decline term — and why the test exists
Karnataka platform-economy regulation (FR-9.1) is being read conservatively for the Ayodhya pilot: ranking that incorporates decline history is treated as a discriminatory practice. Even though the test scenario uses Ayodhya, UP coordinates (the pilot market), the invariance is global. The test exists because *future maintainers will be tempted* to add a `declineCount` term as a "fairness fix" (penalising techs who decline frequently). The CI gate makes that a build break — any such PR has to either justify removing the assertion (with an ADR + legal sign-off) or find another way.

### Why `ARRAY_CONTAINS(skills, @serviceId)` (and not a many-to-many table)
A technician's skills are denormalised onto their profile because the access pattern is overwhelmingly "find techs who can do X near Y". Cosmos `ARRAY_CONTAINS` against a denormalised array is faster than joining against a separate `technician_skills` container at this scale, and `skills[]` is small (typically ≤ 5 items per tech). At scale this could become a concern; for the pilot it's the right shape.

### What this story does NOT do
- **Accept/decline endpoints** — those ship in E05-S04 (PR #28). This story creates the `DispatchAttemptDoc` and sends the FCM, but the technician's response handler lives in `api/src/functions/job-offers.ts` from the next story.
- **Stale-offer reconciler** — also E05-S04 (timer trigger that flips PENDING → EXPIRED after `expiresAt`).
- **Technician app FCM listener** — E05-S03 (PR #29) on the technician-app side.

---

## Definition of Done

- [x] `cd api && pnpm typecheck && pnpm test` — 61 files / 353 tests green
- [x] `bash tools/pre-codex-smoke-api.sh` exited 0
- [x] Karnataka FR-9.1 CI gate (`tests/integration/dispatcher-up-ranking.test.ts`) green
- [x] `.codex-review-passed` marker shipped in PR #26
- [x] Codex P1/P2 findings resolved in-PR: haversine post-filter, `verifyFirebaseIdToken` cold-start, SEARCHING transition timing
- [x] CI green on `main` after merge (commit 5b9c5ff)

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per PR #26 commit attribution)

### Completion Notes
PR #26 merged 2026-04-23 18:34 UTC as commit 5b9c5ff. Three Codex findings addressed in-PR; no blockers reached merge. Karnataka invariance test is now a permanent CI fixture — any change to `rankTechnicians` or `TechnicianProfileSchema` that fails it requires an ADR + explicit override.

### File List
See PR #26:
- Added: `api/src/schemas/dispatch-attempt.ts`, `api/src/schemas/booking-event.ts`, `api/src/middleware/verifyTechnicianToken.ts` (modified existing — switched to `verifyFirebaseIdToken`), `api/tests/integration/dispatcher-up-ranking.test.ts`, `api/tests/unit/dispatcher.service.test.ts`, `api/tests/unit/technicians.test.ts`
- Modified: `api/src/cosmos/client.ts` (container accessors), `api/src/cosmos/geo.ts` (`haversine`), `api/src/schemas/technician.ts` (asserted `fcmToken`/`rating` optional), `api/src/services/dispatcher.service.ts` (replaced stub), `api/src/functions/technicians.ts` (appended `patchFcmTokenHandler`), `api/tests/services/dispatcher.service.test.ts` (extended), `api/tests/webhooks/razorpay-webhook.test.ts` (3 lines dropped — booking transitions changed)
