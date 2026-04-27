# Story E07-S01a: Rating flow — API + customer side

Status: merged

> **Epic:** E07 — Ratings, Complaints & Safety (`docs/stories/README.md` §E07)
> **Sprint:** S4 (wk 7–8) · **Estimated:** ≤ 1 dev-day · **Priority:** P1
> **Sub-projects:** `api/` + `customer-app/`
> **Ceremony tier:** Foundation-leaning Feature (introduces a new Cosmos collection + new FCM trigger + first cross-app rating contract — substantive but bounded; Codex + CI; no /security-review unless Codex flags PII handling on the comment field)
> **Prerequisite:** E06-S04 implementation merged to main (the `PAID → CLOSED` transition + Cosmos change-feed lease pattern that this story's rating-prompt trigger consumes).
> **Splits from original E07-S01** (size-gate violation): S01a delivers the API contract end-to-end + customer side; **S01b** delivers the technician-app side and depends on S01a's PR being merged.

---

## Story

As a **customer who just had a service completed**,
I want to rate my technician on overall stars + 3 sub-scores after the booking closes, **without seeing the technician's rating until they have submitted theirs**,
so that **my feedback is honest and uncoloured by tit-for-tat retaliation**, and so that **the platform can build accurate trust signals from day one**.

---

## Acceptance Criteria

### AC-1 · Rating prompt fires when booking transitions to CLOSED
- **Given** a booking transitions from `PAID` to `CLOSED` (write happens in E06-S04's Razorpay-Route reconciliation)
- **When** the change-feed trigger fires
- **Then** an FCM data message of type `RATING_PROMPT_CUSTOMER` is sent to the topic `customer_{customerId}` with `bookingId` payload
- **And** an FCM data message of type `RATING_PROMPT_TECHNICIAN` is sent to the topic `technician_{technicianId}` with `bookingId` payload
- **And** both messages fire exactly once even if the change-feed re-delivers the same document (idempotency via `ratings/{bookingId}` doc existence check)

> Note: in S01a the technician-app does not yet handle `RATING_PROMPT_TECHNICIAN`. The push lands harmlessly until S01b adds the handler. The API contract is fully shipped here.

### AC-2 · Customer rates technician — overall + 3 sub-scores + optional comment
- **Given** the customer is on the rating prompt screen for a `CLOSED` booking they own
- **When** they submit `POST /v1/ratings` with body `{ side: "CUSTOMER_TO_TECH", bookingId, overall: 1-5, subScores: { punctuality, skill, behaviour }, comment?: ≤500 chars }`
- **Then** the API returns 201
- **And** the rating is stored in the `ratings` Cosmos container — composite id = `bookingId`, partition key `/bookingId`
- **And** the customer-side fields are set on that document

### AC-3 · Authorization — only booking participants can call the endpoints
- 401 `UNAUTHORIZED` when no Bearer token / token invalid
- 403 `FORBIDDEN` when caller's uid is neither `booking.customerId` nor `booking.technicianId`
- 403 `FORBIDDEN` when a customer caller submits `side: "TECH_TO_CUSTOMER"` (or vice versa)

### AC-4 · One rating per side — duplicate submission rejected
- **Given** the customer has already submitted their rating for the booking
- **When** they submit again with the same side
- **Then** the API returns 409 `RATING_ALREADY_SUBMITTED` (matches E06-S03 idempotency pattern)

### AC-5 · Rating only valid on CLOSED bookings
- 409 `BOOKING_NOT_CLOSED` when booking status is anything other than `CLOSED`

### AC-6 · Mutual-reveal projection in `GET /v1/ratings/{bookingId}`
- **Given** only the customer has submitted
- **When** the customer calls `GET /v1/ratings/{bookingId}`
- **Then** the response carries `{ status: "PARTIALLY_SUBMITTED", customerSide: {status:"SUBMITTED", overall, subScores, comment, submittedAt}, techSide: {status:"PENDING"} }`
- **Given** both sides have submitted
- **When** either party calls GET
- **Then** the response carries `{ status: "REVEALED", revealedAt, customerSide: SUBMITTED, techSide: SUBMITTED }`
- **Given** no rating doc exists
- **Then** the response carries `{ status: "PENDING", customerSide: PENDING, techSide: PENDING }`

> The reveal logic is implemented and unit-tested in S01a even though the technician side of the GET response cannot be exercised end-to-end until S01b ships the tech-app rating submission. The api unit tests for the `REVEALED` branch use a hand-crafted Cosmos doc that simulates both sides present.

### AC-7 · Customer screen renders prompt + submit + post-submit waiting state
- **Given** the customer-app receives `RATING_PROMPT_CUSTOMER` FCM
- **Then** the app navigates to `RatingScreen` with the booking context
- **And** the screen exposes overall ★ (1-5), three sub-score ★ inputs (Punctuality, Skill, Behaviour), and a 500-char comment field
- **And** Submit is enabled only when overall + all three sub-scores are non-zero
- **And** after submit the screen shows the customer's own rating + an "Awaiting partner's rating" placeholder

### AC-8 · Tip chip surface for ≥4★ ratings (deferred placeholder)
Out of scope — only a `// TODO(C-19)` marker in the post-submit ViewModel state.

---

## Tasks / Subtasks

> TDD: test file committed before implementation file per CLAUDE.md.

- [x] **T1 — `ratings` Cosmos schema + Zod types (api/, no tests)**
  - [x] Create `api/src/schemas/rating.ts`
  - [x] Add `getRatingsContainer()` getter in `api/src/cosmos/client.ts`

- [x] **T2 — `ratingRepository` (api/, TDD)** — `submitSide()`, `getByBookingId()`, mutual-reveal `revealedAt`, idempotency

- [x] **T3 — `POST /v1/ratings` + `GET /v1/ratings/{bookingId}` (api/, TDD)** — auth + booking-participation + side-matches-role + status-CLOSED + delegate to repo + reveal projection

- [x] **T4 — FCM rating-prompt trigger (api/, TDD)** — change-feed on `bookings`, lease `booking_rating_prompt_leases`, fires both pushes on CLOSED, idempotent

- [x] **T5 — customer-app domain + data layer (TDD)** — Rating models, RatingRepository(+Impl), RatingApiService(Retrofit), RatingDtos(Moshi), RatingPromptEventBus, Hilt RatingModule reusing `@AuthOkHttpClient`, SubmitRatingUseCase, GetRatingUseCase, use-case tests

- [x] **T6 — customer-app UI + nav + FCM dispatch (TDD where applicable)** — RatingViewModel + Test, RatingScreen, RatingRoutes, `RatingScreenPaparazziTest` with `@Ignore`, extend `CustomerFirebaseMessagingService` for `RATING_PROMPT_CUSTOMER`, wire `LaunchedEffect(ratingPromptEventBus)` in `AppNavigation.kt`, register `rating/{bookingId}` route in mainGraph, pass EventBus through `MainActivity`

- [x] **T7 — Pre-Codex smoke gates + Paparazzi cleanup + Codex review**
  - [x] `bash tools/pre-codex-smoke-api.sh` — must exit 0
  - [x] `bash tools/pre-codex-smoke.sh customer-app` — must exit 0
  - [x] `git rm -r customer-app/app/src/test/snapshots/images/ 2>/dev/null || true`
  - [x] `codex review --base main` → `.codex-review-passed`
  - [x] After PR merge: trigger `paparazzi-record.yml` workflow_dispatch (customer-app), commit goldens, remove `@Ignore` in chore branch

---

## Dev Notes

### Auth pattern
The api already has `requireCustomer` HOF (`api/src/middleware/requireCustomer.ts`) and `verifyTechnicianToken` low-level (`api/src/middleware/verifyTechnicianToken.ts`). Both use `verifyFirebaseIdToken` under the hood. Because rating endpoints accept calls from BOTH sides on the same route, do not use either wrapper directly — instead verify the Bearer token, fetch the booking, then derive role from `booking.customerId === uid` vs `booking.technicianId === uid`. See plan Task 3 for the exact handler shape.

### FCM topic pattern
Mirrors E06-S03's `sendPriceApprovalPush` (api/src/services/fcm.service.ts:3) — topic `customer_${uid}` or `technician_${uid}` with `data: { type, bookingId }`. Server-side fires both pushes always; the tech app simply ignores `RATING_PROMPT_TECHNICIAN` until S01b lands.

### Mutual-reveal policy
- Aggregate use of ratings is immediate (tech rolling avg updates on customer submit). Mutual reveal is purely UX-visibility.
- No TTL on the unrevealed side — if tech never rates, customer's rating still counts; tech side stays `PENDING`.

### CLOSED transition dependency
The `PAID → CLOSED` write is part of **E06-S04** (Razorpay Route reconciliation), not yet merged at plan time. T4 (the change-feed trigger) is fully unit-testable today; full smoke verification waits on E06-S04.

### AppNavigation.kt — customer-app only changes here
S01a does **not** touch `technician-app/.../AppNavigation.kt`. S01b owns that change. Per `project_homeservices_sprint_state.md` conflict rule #2, S01a should not run concurrently with any other customer-app story; S01b should not run concurrently with any other technician-app story.

### Patterns referenced
- `docs/patterns/paparazzi-cross-os-goldens.md`
- `docs/patterns/hilt-module-android-test-scope.md` (RatingViewModelTest = JVM unit test, manual constructor injection)
- `docs/patterns/kotlin-explicit-api-public-modifier.md`

---

## Definition of Done

- [x] `cd api && pnpm typecheck && pnpm lint && pnpm test:coverage` green (≥80%)
- [x] `cd customer-app && ./gradlew testDebugUnitTest ktlintCheck assembleDebug` green
- [x] All AC pass via test assertions
- [x] Pre-Codex smoke gates exit 0 (api + customer-app)
- [x] Customer-app Paparazzi snapshot dir deleted; `@Ignore` on `RatingScreenPaparazziTest`
- [x] `.codex-review-passed` marker present
- [x] PR opened; CI green on `main`
- [x] Post-merge: customer-app `paparazzi-record.yml` triggered; goldens committed; `@Ignore` removed (chore branch)

---

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes
_To be filled by dev agent_

### File List
_To be filled by dev agent_
