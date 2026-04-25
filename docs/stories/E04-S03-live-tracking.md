# Story E04-S03: Live tracking screen + FCM status updates

Status: shipped (PR #37, merged 2026-04-24, commit a52219c) — **retroactive docs**

> **Epic:** E04 — Trust Layer (Customer) (`docs/stories/README.md` §E04)
> **Sprint:** S2 (wk 3–4) · **Estimated:** ≤ 1 dev-day · **Priority:** P1
> **Sub-project:** `customer-app/`
> **Ceremony tier:** Feature (single sub-project, builds on existing FCM infrastructure)
> **Prerequisite:** E06-S01 active-job state machine (so the technician-app emits `LOCATION_UPDATE` and `BOOKING_STATUS_UPDATE` FCM data messages during an active job).
> **Retroactive note:** This story file is being written *after* the implementation merged. PR #37 shipped without `docs/stories/E04-S03-*.md` or its plan file ever landing in main. The accompanying plan file `docs/superpowers/plans/2026-04-24-e04-s03-live-tracking.md` was preserved in the working tree and is being added in the same PR. Acceptance criteria below are reverse-engineered from the merged code (see PR #37 file list and `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/LiveTrackingScreen.kt` for the canonical implementation).

---

## Story

As a **customer who has just paid for a service** and is awaiting the technician,
I want to see the technician's live location on a map plus a real-time timeline of booking status (Searching → Assigned → En-route → Reached → InProgress → Complete) plus an ETA chip,
so that **I have full visibility into when help is arriving and never wonder whether anything is happening behind the scenes** (FR-3.5: "never > 5-min silent window").

---

## Acceptance Criteria

### AC-1 · FCM `LOCATION_UPDATE` updates the technician marker
- **Given** the customer is on `LiveTrackingScreen` for an active booking
- **When** the technician-app emits a Cloud Messaging data message of type `LOCATION_UPDATE` with `bookingId` + `lat` + `lng` (+ optional `etaMinutes`)
- **Then** `CustomerFirebaseMessagingService.onMessageReceived` decodes and posts a `TrackingEvent.LocationUpdate` to `TrackingEventBus`
- **And** `TrackingRepositoryImpl` integrates the event into the `Flow<TrackingState>` for that bookingId via `scan`
- **And** the Compose `GoogleMap` marker re-positions to the new coordinates without a full screen recompose

### AC-2 · FCM `BOOKING_STATUS_UPDATE` updates the timeline
- **Given** the customer is on `LiveTrackingScreen`
- **When** an FCM data message of type `BOOKING_STATUS_UPDATE` arrives with `bookingId` + `status` (one of: `SEARCHING`, `ASSIGNED`, `EN_ROUTE`, `REACHED`, `IN_PROGRESS`, `COMPLETED`)
- **Then** `TrackingEventBus` emits a `TrackingEvent.StatusChanged`
- **And** the `BookingStatusTimeline` composable advances to highlight the new status
- **And** the timeline never goes backward (status transitions are monotonic in the state machine; out-of-order messages are tolerated by the `scan` accumulator picking the higher index)

### AC-3 · ETA chip
- **Given** the most recent `LocationUpdate` carries `etaMinutes`
- **Then** the `EtaChip` composable displays "ETA <N> min"
- **And** when no ETA has yet been received the chip shows a placeholder ("Calculating ETA…")

### AC-4 · Navigation entry from BookingConfirmedScreen
- **Given** the customer is on `BookingConfirmedScreen` after payment
- **When** they tap "Track service"
- **Then** `navController.navigate(BookingRoutes.tracking(bookingId))` routes to `LiveTrackingScreen`

### AC-5 · State is per-booking and reactive
- The `TrackingRepository.observe(bookingId)` returns a `Flow<TrackingState>` that filters bus events to only this booking's id
- Multiple concurrent screens (theoretical) for different bookings see only their own updates
- `LiveTrackingViewModel` uses `combine(getLocationFlow, getStatusFlow)` to merge both streams into a single `LiveTrackingUiState`
- ViewModel exposes the state via `stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), initialState)`

### AC-6 · Resilience to no-data window
- **Given** no FCM message has arrived yet for the bookingId
- **Then** `LiveTrackingScreen` shows a "Waiting for technician location…" placeholder
- **And** the map centers on a sensible default (booking address LatLng if present in saved state, otherwise the city center)

### AC-7 · Foreground-only — no notification posting
- The FCM data messages are silent (`data` payload only, no `notification` payload), so they do not appear in the system tray
- `CustomerFirebaseMessagingService` does not post an Android notification for tracking events — it only forwards to the EventBus
- (System-tray notifications are reserved for higher-priority events like `ADDON_APPROVAL_REQUESTED` and `RATING_PROMPT_*`)

---

## Tasks / Subtasks (as actually shipped — see plan for original TDD breakdown)

> Implementation merged via PR #37. The TDD ordering and test files below match what's present in main today.

- [x] **T1 — Domain models** (`domain/tracking/model/`)
  - [x] T1.1 `LiveLocation.kt` — `data class LiveLocation(lat, lng, etaMinutes?)`
  - [x] T1.2 `BookingStatus.kt` — enum (SEARCHING / ASSIGNED / EN_ROUTE / REACHED / IN_PROGRESS / COMPLETED)
  - [x] T1.3 `TrackingState.kt` — sealed class hierarchy (Initial / WithLocation / WithStatus / WithBoth)

- [x] **T2 — Tracking domain interfaces + use cases (TDD)**
  - [x] T2.1 `TrackingRepository.kt` interface
  - [x] T2.2 `GetLiveLocationUseCase.kt` + test
  - [x] T2.3 `TrackBookingStatusUseCase.kt` + test

- [x] **T3 — Data layer (TDD)**
  - [x] T3.1 `data/tracking/TrackingEvent.kt` — sealed class (LocationUpdate / StatusChanged)
  - [x] T3.2 `data/tracking/TrackingEventBus.kt` — Hilt singleton wrapping `MutableSharedFlow`
  - [x] T3.3 `data/tracking/TrackingRepositoryImpl.kt` + `TrackingRepositoryImplTest.kt` — implements `observe(bookingId)` via `bus.events.filter { it.bookingId == id }.scan(initial) { acc, e -> ... }`

- [x] **T4 — Hilt DI module**
  - [x] T4.1 `data/tracking/di/TrackingModule.kt` — `@Binds TrackingRepository ↔ TrackingRepositoryImpl`

- [x] **T5 — Extend `CustomerFirebaseMessagingService`** to dispatch on `LOCATION_UPDATE` + `BOOKING_STATUS_UPDATE`

- [x] **T6 — UI**
  - [x] T6.1 `ui/tracking/LiveTrackingUiState.kt`
  - [x] T6.2 `ui/tracking/LiveTrackingViewModel.kt` + test
  - [x] T6.3 `ui/tracking/LiveTrackingScreen.kt` (Google Maps Compose marker + timeline + ETA chip) + test

- [x] **T7 — Navigation**
  - [x] T7.1 `BookingRoutes.kt` — add `TRACKING_ROUTE` + `tracking(bookingId)` helper
  - [x] T7.2 `MainGraph.kt` — register `composable(BookingRoutes.TRACKING_ROUTE) { LiveTrackingScreen(...) }`
  - [x] T7.3 `BookingConfirmedScreen.kt` — add "Track service" CTA navigating to tracking route + Paparazzi test

- [x] **T8 — Build config**
  - [x] T8.1 `customer-app/app/build.gradle.kts` — add Google Maps Compose 4.3.3 dependency
  - [x] T8.2 `customer-app/gradle/libs.versions.toml` + `technician-app/gradle/libs.versions.toml` — version sync

- [x] **T9 — Pre-Codex smoke gate + Codex review** (passed; `.codex-review-passed` shipped in PR #37)

---

## Dev Notes

### What was actually shipped (per PR #37 file list)
- 11 main-source files, 5 test files, 2 Paparazzi golden PNGs (recorded on CI), 2 build files
- `BookingConfirmedScreenPaparazziTest` goldens were the only ones recorded successfully — `LiveTrackingScreenPaparazziTest` was not added (live map content is non-deterministic; pixel-locking would be flaky). The Paparazzi backlog tracked in `project_homeservices_sprint_state.md` does NOT need a goldens entry for live-tracking.

### Why this story is being written retroactively
- During the E07-S01 docs split work, a session audit found that PR #37 (E04-S03) and PR #38 (E06-S04) had both shipped without their `docs/stories/` + `docs/superpowers/plans/` files ever landing in main.
- PR #41 rescued E06-S04 docs (story already existed on a stale branch). E04-S03 had no story file anywhere — only this plan file as an untracked artifact in the working tree.
- This PR adds both files to keep the BMAD trail complete. Going forward, every implementation PR must include its `docs/stories/<id>.md` + `docs/superpowers/plans/<date>-<id>.md` (lesson #6 added to `project_homeservices_sprint_state.md`).

### Patterns referenced (per plan)
- `docs/patterns/paparazzi-cross-os-goldens.md` — `BookingConfirmedScreen` goldens recorded on CI; `LiveTrackingScreen` not pixel-tested (non-deterministic content)
- `docs/patterns/firebase-callbackflow-lifecycle.md` — EventBus pattern (no callbackFlow needed; FCM service is short-lived per message)
- `docs/patterns/hilt-module-android-test-scope.md` — JVM unit tests use manual constructor injection; no `@HiltAndroidTest`
- `docs/patterns/kotlin-explicit-api-public-modifier.md` — every new public symbol carries explicit `public`

---

## Definition of Done

- [x] `cd customer-app && ./gradlew testDebugUnitTest ktlintCheck assembleDebug` green (verified on PR #37 CI)
- [x] All AC pass via test assertions (`LiveTrackingViewModelTest`, `TrackingRepositoryImplTest`, use-case tests)
- [x] Pre-Codex smoke gate exited 0 (PR #37 CI)
- [x] `.codex-review-passed` marker shipped in PR #37
- [x] CI green on `main` after merge (commit a52219c)

---

## Dev Agent Record

### Agent Model Used
Claude (per PR #37 commit attribution)

### Completion Notes
PR #37 merged 2026-04-24 as commit a52219c. Codex review passed; no P1 findings.

### File List
See PR #37: 11 main-source Kotlin files, 5 test files, 2 Paparazzi golden PNGs, build.gradle.kts + libs.versions.toml updates in both apps.
