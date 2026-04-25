# Story E07-S01b: Rating flow — technician side

Status: ready-for-dev

> **Epic:** E07 — Ratings, Complaints & Safety (`docs/stories/README.md` §E07)
> **Sprint:** S4 (wk 7–8) · **Estimated:** ≤ 0.5 dev-day · **Priority:** P1
> **Sub-project:** `technician-app/`
> **Ceremony tier:** Feature (single sub-project, mirrors a shipped contract — Codex + CI; no /security-review)
> **Prerequisite:** **E07-S01a merged to main** (api endpoints + FCM trigger + customer-side reference patterns must exist).
> **Splits from original E07-S01** (size-gate violation). S01a shipped the API + customer side; S01b adds the technician handler and consumes the existing `RATING_PROMPT_TECHNICIAN` FCM that the server is already firing.

---

## Story

As a **technician who just finished a service**,
I want to rate the customer on overall stars + 2 sub-scores after the booking closes, **without seeing the customer's rating until I have submitted my own**,
so that **my feedback is honest and uncoloured by tit-for-tat retaliation**, and so that **the platform can build accurate trust signals from day one** (mutual reveal becomes observable end-to-end after this story).

---

## Acceptance Criteria

### AC-1 · Technician-app receives `RATING_PROMPT_TECHNICIAN` FCM and routes to RatingScreen
- **Given** the api has fired `RATING_PROMPT_TECHNICIAN` for a CLOSED booking
- **And** the authenticated technician's app is subscribed to topic `technician_{uid}`
- **When** the FCM data message arrives
- **Then** the app navigates to `RatingScreen` with the booking context

### AC-2 · Technician rates customer — overall + 2 sub-scores + optional comment
- **Given** the technician is on the rating prompt screen for a `CLOSED` booking they served
- **When** they submit `POST /v1/ratings` with body `{ side: "TECH_TO_CUSTOMER", bookingId, overall: 1-5, subScores: { behaviour, communication }, comment?: ≤500 chars }`
- **Then** the API returns 201 (handled by S01a's endpoint, no api work in this story)
- **And** the technician-side fields are set on the same `ratings/{bookingId}` document

### AC-3 · Mutual reveal becomes observable end-to-end
- **Given** the customer rated first (S01a flow), the technician now rates
- **When** the technician's submission completes
- **Then** subsequent `GET /v1/ratings/{bookingId}` calls from either party return `{ status: "REVEALED", revealedAt, customerSide: SUBMITTED, techSide: SUBMITTED }`

### AC-4 · Technician screen renders prompt + submit + post-submit waiting state
- **And** the screen exposes overall ★ (1-5), two sub-score ★ inputs (Behaviour, Communication), and a 500-char comment field
- **And** Submit is enabled only when overall + both sub-scores are non-zero
- **And** after submit the screen shows the technician's own rating + an "Awaiting partner's rating" placeholder OR (if customer already submitted) the customer's rating

### AC-5 · Authorization
The endpoints already enforce 401/403 (S01a). Technician-app must send the Firebase ID token via the existing `@AuthOkHttpClient` interceptor.

### AC-6 · One rating per side
Already enforced server-side in S01a (409 `RATING_ALREADY_SUBMITTED`).

---

## Tasks / Subtasks

> TDD: test file committed before implementation file per CLAUDE.md.

- [ ] **T1 — libs.versions.toml sync (codemod, no tests)**
  - [ ] `cp customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml`
  - [ ] `cd technician-app && ./gradlew help -q`

- [ ] **T2 — Domain + data layer (TDD)** — Mirror S01a's customer-side artifacts in the technician package, with `TechSubScores(behaviour, communication)` instead of `CustomerSubScores`. New files: `domain/rating/model/Rating.kt`, `domain/rating/SubmitTechRatingUseCase.kt`, `domain/rating/GetTechRatingUseCase.kt`, `data/rating/RatingRepository.kt`, `RatingRepositoryImpl.kt`, `RatingPromptEventBus.kt`, `remote/RatingApiService.kt`, `remote/dto/RatingDtos.kt`, `data/rating/di/RatingModule.kt` + use-case tests.

- [ ] **T3 — UI + ViewModel + Paparazzi stub (TDD)** — `RatingViewModel`, `RatingScreen`, `RatingRoutes`, `RatingViewModelTest`, `RatingScreenPaparazziTest` (`@Ignore`).

- [ ] **T4 — Create first FCM service in technician-app**
  - [ ] Create `technician-app/.../firebase/TechnicianFirebaseMessagingService.kt`
  - [ ] Register `<service>` in `AndroidManifest.xml` with `MESSAGING_EVENT` intent-filter

- [ ] **T5 — Wire `AppNavigation.kt` + `MainActivity.kt`**
  - [ ] Add `ratingPromptEventBus: RatingPromptEventBus` parameter
  - [ ] In `LaunchedEffect(authState)` Authenticated branch, add `FirebaseMessaging.getInstance().subscribeToTopic("technician_${uid}")`
  - [ ] Add `LaunchedEffect(ratingPromptEventBus)` to navigate to `rating/{bookingId}`
  - [ ] Register `composable("rating/{bookingId}")` in `homeGraph`
  - [ ] In `MainActivity.kt`, `@Inject lateinit var ratingPromptEventBus: RatingPromptEventBus` and pass to `AppNavigation(...)`

- [ ] **T6 — Pre-Codex smoke gate + Paparazzi cleanup + Codex review**
  - [ ] `bash tools/pre-codex-smoke.sh technician-app` — must exit 0
  - [ ] `git rm -r technician-app/app/src/test/snapshots/images/ 2>/dev/null || true`
  - [ ] `codex review --base main` → `.codex-review-passed`
  - [ ] After PR merge: trigger `paparazzi-record.yml` workflow_dispatch (technician-app), commit goldens, remove `@Ignore` in chore branch

---

## Dev Notes

### Reference S01a patterns directly
The customer-side files written in S01a are the canonical reference. Most tech-side files are 1:1 mirrors with these substitutions:
| Customer artifact | Technician analog |
|---|---|
| `CustomerSubScores(punctuality, skill, behaviour)` | `TechSubScores(behaviour, communication)` |
| `submitCustomerRating(...)` | `submitTechRating(...)` |
| `SubmitRatingRequestDto.side = "CUSTOMER_TO_TECH"` | `"TECH_TO_CUSTOMER"` |
| Subscribe to `customer_${uid}` | Subscribe to `technician_${uid}` |
| FCM type `RATING_PROMPT_CUSTOMER` | `RATING_PROMPT_TECHNICIAN` |
| `CustomerFirebaseMessagingService` (existing, modified) | `TechnicianFirebaseMessagingService` (NEW file) |

### `@AuthOkHttpClient` qualifier
Check whether technician-app already has an `@AuthOkHttpClient` qualifier defined (likely in `technician-app/.../data/auth/di/` or `data/jobOffer/di/`). If yes, reuse. If no, define it in the new `RatingModule` (mirror customer's `BookingModule.kt:24-25`) and have other modules consume it.

### AppNavigation.kt pattern
Follow customer-app's existing pattern (after S01a lands): `LaunchedEffect(authState)` does the topic subscribe + nav redirect; a sibling `LaunchedEffect(ratingPromptEventBus)` handles the rating prompt navigation. The technician-app currently has *no* topic subscribe — this story adds it. Confirm the property name on `AuthState.Authenticated` (likely `uid`).

### First FCM service in technician-app
This story introduces the first `FirebaseMessagingService` in the tech-app. The Manifest registration is required:
```xml
<service
    android:name=".firebase.TechnicianFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```
No google-services.json change is needed — the file is already in place from the auth/onboarding stories.

### Patterns referenced
- `docs/patterns/paparazzi-cross-os-goldens.md`
- `docs/patterns/hilt-module-android-test-scope.md`
- `docs/patterns/kotlin-explicit-api-public-modifier.md`
- `docs/patterns/firebase-callbackflow-lifecycle.md` — only relevant if introducing callback-based async (not used here; direct EventBus.post is sufficient)

---

## Definition of Done

- [ ] `cd technician-app && ./gradlew testDebugUnitTest ktlintCheck assembleDebug` green
- [ ] All AC pass via test assertions (AC-3 mutual-reveal verifiable manually OR via integration test against deployed S01a)
- [ ] Pre-Codex smoke gate exits 0 (technician-app)
- [ ] Technician-app Paparazzi snapshot dir deleted; `@Ignore` on `RatingScreenPaparazziTest`
- [ ] `.codex-review-passed` marker present
- [ ] PR opened; CI green on `main`
- [ ] Post-merge: technician-app `paparazzi-record.yml` triggered; goldens committed; `@Ignore` removed (chore branch)

---

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes
_To be filled by dev agent_

### File List
_To be filled by dev agent_
