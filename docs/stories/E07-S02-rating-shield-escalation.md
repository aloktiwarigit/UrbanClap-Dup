# Story E07-S02: Rating Shield — pre-review escalation for low ratings

Status: ready-for-dev

> **Epic:** E07 — Ratings, Complaints & Safety (`docs/stories/README.md` §E07)
> **Sprint:** S4 (wk 7–8) · **Estimated:** ≤ 1.5 dev-days · **Priority:** P1
> **Sub-projects:** `api/` + `customer-app/`
> **Ceremony tier:** Feature (builds on E07-S01a's rating contract + E09-S06's complaint Cosmos collection; new customer-auth API endpoint + bottom-sheet UI; Codex + CI; no /security-review unless Codex flags PII on draft comment field)
> **Prerequisite:** E07-S01a merged to main (`POST /v1/ratings` live; `RatingViewModel`/`RatingScreen` live in customer-app). E09-S06 merged to main (`complaints` Cosmos container provisioned; owner FCM infra in place).

---

## Story

As a **customer who wants to give a low rating (≤2★)**,
I want the app to ask if I'd like to notify the owner first before the rating is posted,
so that **the owner gets a chance to resolve my complaint within 2 hours, while I retain full control to post my rating at any time**.

---

## Acceptance Criteria

### AC-1 · Shield intercept on ≤2★ submit
- **Given** the customer taps Submit on RatingScreen with overall ≤ 2 stars
- **And** the shield state is `Idle` (first attempt)
- **When** the submit gesture fires
- **Then** the API is NOT called
- **And** a bottom sheet appears with text "क्या आप मालिक को पहले बताना चाहते हैं?"
- **And** two actions are presented: **हाँ** (escalate to owner) | **नहीं, सीधे post करें** (post directly)

### AC-2 · Customer chooses "नहीं" — rating posts immediately
- **Given** the shield bottom sheet is showing
- **When** the customer taps "नहीं, सीधे post करें"
- **Then** `POST /v1/ratings` fires with the original rating body
- **And** the flow continues as per E07-S01a AC-2

### AC-3 · Customer chooses "हाँ" — complaint created, 2h countdown shown
- **Given** the shield bottom sheet is showing
- **When** the customer taps "हाँ"
- **Then** `POST /v1/ratings/{bookingId}/escalate` is called with `{ draftOverall, draftComment? }`
- **And** the API creates a complaint doc with `type: "RATING_SHIELD"`, `expiresAt = now + 2h`, `status: "NEW"`, and fires an FCM data message of type `OWNER_RATING_SHIELD_ALERT` to topic `owner_alerts` with `{ bookingId, draftOverall, technicianId }`
- **And** the API returns `{ complaintId, expiresAt }` (201)
- **And** the bottom sheet dismisses; a countdown chip appears on RatingScreen showing "मालिक को 2 घंटे बचे हैं · [Post anyway]"
- **And** the shield state is `Escalated(expiresAt)`

### AC-4 · "Post anyway" always available after escalation
- **Given** shield state is `Escalated`
- **When** the customer taps "Post anyway" (or the countdown chip expires)
- **Then** `POST /v1/ratings` fires immediately with the original draft rating
- **And** the complaint doc is NOT deleted (it remains open for the owner to review)

### AC-5 · Countdown chip shows live 2h timer
- **Given** shield state is `Escalated(expiresAt)`
- **When** the customer returns to RatingScreen within the 2h window
- **Then** the chip displays remaining time (h:mm format), updating each minute
- **When** the 2h window expires while the app is in foreground
- **Then** `POST /v1/ratings` fires automatically (same as "Post anyway")

### AC-6 · Shield fires at most once per booking-side
- A second low-rating attempt on the same booking after escalation goes straight to `POST /v1/ratings` — no second bottom sheet.
- The escalate endpoint returns 409 `SHIELD_ALREADY_ESCALATED` if called again for the same `bookingId` + customer.

### AC-7 · Escalate endpoint authorization
- 401 `UNAUTHORIZED` — missing/invalid Bearer token
- 403 `FORBIDDEN` — caller uid ≠ `booking.customerId`
- 404 `BOOKING_NOT_FOUND` — bookingId doesn't exist
- 409 `BOOKING_NOT_CLOSED` — booking not in CLOSED state
- 409 `SHIELD_ALREADY_ESCALATED` — duplicate call

### AC-8 · Ratings ≥ 3★ are unaffected
- Shield intercept is never triggered for overall ≥ 3; submit goes directly to `POST /v1/ratings`.

---

## Tasks / Subtasks

> TDD: test file committed before implementation file per CLAUDE.md.

- [ ] **T1 — API: extend complaint schema + escalate endpoint (api/, TDD)**
  - [ ] Extend `api/src/schemas/complaint.ts`:
    - Add `ComplaintTypeEnum = z.enum(['RATING_SHIELD', 'STANDARD'])` with default `'STANDARD'`
    - Add optional fields to `ComplaintDocSchema`: `type`, `draftOverall: z.number().int().min(1).max(5).optional()`, `draftComment: z.string().max(500).optional()`, `expiresAt: z.string().optional()`
    - Add `EscalateRatingBodySchema = z.object({ draftOverall: z.number().int().min(1).max(2), draftComment: z.string().max(500).optional() })`
    - Add `EscalateRatingResponseSchema = z.object({ complaintId: z.string(), expiresAt: z.string() })`
  - [ ] Create `api/src/functions/ratings/escalate.ts` — route `POST /v1/ratings/{bookingId}/escalate`; customer auth via `requireCustomer`; 401/403/404/409 guards; builds complaint doc (type RATING_SHIELD, expiresAt +2h, slaDeadlineAt +2h); writes to Cosmos via `createComplaint()`; fires FCM `OWNER_RATING_SHIELD_ALERT` to topic `owner_alerts`; returns `{ complaintId, expiresAt }` 201
  - [ ] Create `api/tests/functions/ratings/escalate.test.ts` — all 7 AC-7 error paths + happy path

- [ ] **T2 — customer-app domain layer (TDD)**
  - [ ] Add `RatingShieldState` sealed class to `ui/rating/RatingViewModel.kt` (or a companion `RatingShieldState.kt` if ViewModel file is large)
  - [ ] Create `domain/rating/EscalateRatingUseCase.kt` — calls `RatingApiService.escalateRating(bookingId, body)`, returns `EscalateRatingResult(complaintId, expiresAt: Long)`
  - [ ] Create `data/rating/dto/EscalateRatingDto.kt` — request/response Moshi data classes
  - [ ] Add `escalateRating()` to `RatingApiService.kt` Retrofit interface
  - [ ] Create `domain/rating/EscalateRatingUseCaseTest.kt` — success + network error + 409 conflict

- [ ] **T3 — customer-app ViewModel shield logic (TDD)**
  - [ ] Extend `RatingViewModel` UiState to include `shieldState: RatingShieldState` (default `Idle`)
  - [ ] `onSubmit()`: if `overall ≤ 2 && shieldState == Idle` → set `shieldState = ShowDialog`, return without API call
  - [ ] `onEscalate()`: calls `EscalateRatingUseCase`; on success sets `shieldState = Escalated(expiresAt)` + stores `draftRating` in ViewModel; on failure surfaces error snackbar
  - [ ] `onSkipShield()` / `onPostAnyway()`: calls existing `submitRating()` with stored draft; resets shield state to `Idle` after
  - [ ] `startCountdown()`: `viewModelScope.launch` with 1-min ticker; when `System.currentTimeMillis() >= expiresAt` triggers `onPostAnyway()`
  - [ ] Add `RatingViewModelShieldTest.kt` covering: Idle→ShowDialog on ≤2★, Idle stays on ≥3★, onSkipShield posts immediately, onEscalate sets Escalated, countdown auto-posts at expiry

- [ ] **T4 — customer-app UI: shield bottom sheet (Compose)**
  - [ ] Add `ShieldBottomSheet` composable inside `RatingScreen.kt` — shown when `shieldState == ShowDialog`; Hindi copy as specified; "हाँ" / "नहीं, सीधे post करें" buttons
  - [ ] Add countdown chip to `RatingScreen` — visible when `shieldState is Escalated`; format `h:mm` remaining; "Post anyway" button
  - [ ] No new navigation route; no new Paparazzi test file needed (existing `@Ignored` stub covers the screen)

- [ ] **T5 — Hilt: bind EscalateRatingUseCase**
  - [ ] Add `@Binds` or `@Provides` for `EscalateRatingUseCase` in existing `RatingModule.kt`
  - [ ] No new Hilt module

- [ ] **T6 — Pre-Codex smoke gates + Codex review**
  - [ ] `bash tools/pre-codex-smoke-api.sh` — must exit 0
  - [ ] `bash tools/pre-codex-smoke.sh customer-app` — must exit 0
  - [ ] `codex review --base main` → `.codex-review-passed`

---

## Dev Notes

### API endpoint placement
The escalate endpoint lives under `api/src/functions/ratings/escalate.ts` (sibling of the existing `ratings.ts`), not under `admin/complaints/`. This is a customer-callable path authenticated by `requireCustomer` middleware, which differs from `POST /v1/admin/complaints` (admin-only). Both ultimately write to the same `complaints` Cosmos container.

### Schema extension strategy
Rather than a breaking change to `CreateComplaintBodySchema`, add `type`, `draftOverall`, `draftComment`, and `expiresAt` as optional fields on `ComplaintDocSchema`. Existing admin-create flow continues to work; `type` defaults to `'STANDARD'` when absent. The `slaDeadlineAt` field is reused as-is (set to `expiresAt` for RATING_SHIELD complaints = 2h, not 48h).

### FCM owner topic
`owner_alerts` is the FCM topic the admin app subscribes to for operational alerts. Pattern mirrors `sendPriceApprovalPush` in `api/src/services/fcm.service.ts`. Payload: `{ type: "OWNER_RATING_SHIELD_ALERT", bookingId, draftOverall, technicianId }`. Fire-and-forget; log error but do not fail the 201 response if FCM dispatch throws.

### Customer-app: RatingShieldState persistence
`shieldState` lives in ViewModel memory only — not persisted to Room or SharedPreferences. If the customer kills the app mid-countdown, the countdown is lost; they can still post the rating from the existing post-submit screen (the draft overall/comment are in the standard `RatingUiState` which follows standard ViewModel restoration rules).

### libs.versions.toml sync
No technician-app changes in this story — skip the sync step.

### Patterns referenced
- `docs/patterns/firebase-callbackflow-lifecycle.md` — FCM dispatch pattern (api side)
- `docs/patterns/hilt-module-android-test-scope.md` — EscalateRatingUseCase injection in test
- `docs/patterns/kotlin-explicit-api-public-modifier.md` — new public Kotlin files

---

## Definition of Done

- [ ] `cd api && pnpm typecheck && pnpm lint && pnpm test:coverage` green (≥80%)
- [ ] `cd customer-app && ./gradlew testDebugUnitTest ktlintCheck assembleDebug` green
- [ ] All AC pass via test assertions
- [ ] Pre-Codex smoke gates exit 0 (api + customer-app)
- [ ] `.codex-review-passed` marker present
- [ ] PR opened; CI green on `main`

---

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes
_To be filled by dev agent_

### File List
_To be filled by dev agent_
