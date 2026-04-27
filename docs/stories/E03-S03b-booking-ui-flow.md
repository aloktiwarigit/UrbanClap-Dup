# Story E03-S03b: Booking UI flow — SlotPicker, Address, Summary, Confirmed + Razorpay integration

Status: shipped (PR #23, merged 2026-04-20, commit 1d5eb88) — **retroactive docs**

> **Epic:** E03 — Service Discovery + Booking Flow (`docs/stories/README.md` §E03)
> **Sprint:** S2 (wk 3–4) · **Estimated:** ≤ 1 dev-day · **Priority:** P0
> **Sub-project:** `customer-app/`
> **Ceremony tier:** Foundation (4-screen booking funnel + Razorpay Checkout SDK + nested nav graph + 4 Paparazzi screens)
> **Prerequisite:** E03-S03a must be merged (domain models, `BookingRepository`, `PaymentResultBus`, `BookingApiService`).
> **Story split:** This is **part B** of the 2-part E03-S03 split. Part A (`E03-S03a`) lands the API + Android data layer.
> **Retroactive note:** This story file is being written *after* the implementation merged. PR #23 shipped without `docs/stories/E03-S03b-*.md` ever landing in main. The accompanying plan `plans/E03-S03b.md` was committed at PR #19 (alongside its sibling) and is unchanged. Acceptance criteria below are reverse-engineered from the merged code (see `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/SlotPickerScreen.kt`, `AddressScreen.kt`, `BookingSummaryScreen.kt`, `BookingConfirmedScreen.kt`, `BookingViewModel.kt`, `domain/booking/RazorpayPaymentUseCase.kt` for the canonical implementation).

---

## Story

As a **customer who has tapped "Book Now" on a service detail page**,
I want a 4-step UI flow (slot → address → review summary → pay → confirmed) that opens Razorpay Checkout and shows confirmation,
so that **I can complete a booking in 3 taps with the booking transitioning to `SEARCHING` server-side** (FR-3.3, NFR-U-3 3-tap target; UX §7.2).

---

## Acceptance Criteria

### AC-1 · 4-screen booking funnel
- **Given** the customer has tapped Book Now on `ServiceDetailScreen`
- **When** the booking nested nav graph starts
- **Then** screens are reached in order: `SlotPickerScreen` → `AddressScreen` → `BookingSummaryScreen` → (Razorpay Checkout activity) → `BookingConfirmedScreen`
- **And** the back button at any step returns to the previous step without losing entered state

### AC-2 · Shared ViewModel scoped to nested graph
- **Given** the booking nav graph is a nested `navigation(...)` block in `MainGraph`
- **When** any of the 4 screens calls `hiltViewModel(backStackEntry)` for the parent route
- **Then** the same `BookingViewModel` instance is shared across all 4 screens (so SlotPicker selections survive into Summary)
- **And** the ViewModel exposes `StateFlow<BookingUiState>`

### AC-3 · BookingUiState (sealed)
- **Given** the new state model
- **Then** `BookingUiState` is a sealed class with at least: `Idle`, `Ready`, `CreatingBooking`, `AwaitingPayment`, `ConfirmingPayment`, `BookingConfirmed`, `Error`
- **And** the ViewModel transitions cleanly: Ready → CreatingBooking (on Confirm tap) → AwaitingPayment (on /v1/bookings response) → ConfirmingPayment (on Razorpay success) → BookingConfirmed (on /v1/bookings/:id/confirm 200)
- **And** the ViewModel has 6 unit tests covering every transition

### AC-4 · Razorpay Checkout SDK integration via MainActivity bridge
- **Given** the Razorpay Checkout SDK runs from an Activity (it returns its result via `onPaymentSuccess` / `onPaymentError` Activity callbacks)
- **When** `BookingViewModel` enters `AwaitingPayment` state
- **Then** the screen triggers `MainActivity` to open Razorpay Checkout with the order id
- **And** `MainActivity` implements `PaymentResultListener` and forwards results into `PaymentResultBus.post(...)`
- **And** `RazorpayPaymentUseCase` exposes `resultFlow()` over the bus and the ViewModel `collect`s it
- **And** the SDK callback is bridged through the bus (singleton SharedFlow) — never via direct Activity reference passed to the ViewModel

### AC-5 · SlotPickerScreen
- **Given** the customer is on SlotPicker
- **Then** they can pick a date + time slot from a horizontal/vertical chooser
- **And** the chosen `BookingSlot(start, end)` is stored on the ViewModel
- **And** there is a Paparazzi golden for `slotPickerInitial`

### AC-6 · AddressScreen
- **Given** the customer is on Address
- **Then** they can enter or pick an address (text-entry MVP per plan; Maps Places autocomplete deferred per WS-D notes)
- **And** the address is stored on the ViewModel
- **And** there is a Paparazzi golden for `addressScreenEmpty`

### AC-7 · BookingSummaryScreen
- **Given** the customer is on Summary
- **When** they tap Confirm
- **Then** the ViewModel calls `CreateBookingUseCase` → API → Razorpay Checkout
- **And** while in flight the UI shows a busy state from `BookingUiState.CreatingBooking` / `AwaitingPayment` / `ConfirmingPayment`
- **And** `BookingSummaryContent` is a stateless composable so the Paparazzi test can render without `Dispatchers.Main` (avoids ViewModel crash in JVM tests)
- **And** there is a Paparazzi golden for `bookingSummaryReady`

### AC-8 · BookingConfirmedScreen
- **Given** the booking has transitioned to `SEARCHING`
- **Then** the customer sees the confirmation card with bookingId and "We're searching for a technician" message
- **And** there is a Paparazzi golden for `bookingConfirmed`
- **And** the "Track service" CTA shipped in E04-S03 lives on this screen (cross-reference; not in this story's scope)

### AC-9 · Navigation wiring + Book Now CTA enabled
- **Given** the booking flow exists
- **Then** `BookingRoutes` defines `BOOKING_GRAPH_ROUTE`, `SLOT_ROUTE`, `ADDRESS_ROUTE`, `SUMMARY_ROUTE`, `CONFIRMED_ROUTE`
- **And** `MainGraph` registers a `navigation(startDestination=…, route=…)` block with the shared ViewModel obtained via parent backStackEntry
- **And** `ServiceDetailScreen` enables its previously disabled "Book Now" CTA, navigating into the booking graph with the chosen `serviceId` + `categoryId` as nav args (stored as `pendingServiceId`/`pendingCategoryId` `public var` on the ViewModel — simplest MVP approach)

### AC-10 · TDD + Paparazzi
- **Given** the implementation
- **Then** tests exist for: `RazorpayPaymentUseCaseTest` (callbackFlow), `BookingViewModelTest` (6 cases), and 4 Paparazzi snapshot tests
- **And** Paparazzi goldens are recorded on Ubuntu CI via `paparazzi-record.yml` workflow_dispatch (NOT on Windows — per `docs/patterns/paparazzi-cross-os-goldens.md`)
- **And** Kover thresholds pass after Compose `*Kt` wrapper exclusions

### AC-11 · admin-web orders query already targets bookings container
- **Given** verification that admin-web does not need a follow-up
- **Then** D1 confirms `admin-web` orders/list already queries the `bookings` Cosmos container — no admin-web change required by this story

---

## Tasks / Subtasks (as actually shipped)

> Implementation merged via PR #23. Tasks below match the work-stream plan at `plans/E03-S03b.md` and the code in main.

- [x] **WS-C1 — RazorpayPaymentUseCase + PaymentResultBus (TDD)**
  - [x] `domain/booking/RazorpayPaymentUseCase.kt` (resultFlow over the bus)
  - [x] `RazorpayPaymentUseCaseTest.kt`

- [x] **WS-C2 — BookingUiState + BookingViewModel (TDD, 6 tests)**
  - [x] `ui/booking/BookingUiState.kt` (sealed)
  - [x] `ui/booking/BookingViewModel.kt`
  - [x] `BookingViewModelTest.kt`

- [x] **WS-C3..C5 — Compose screens + Paparazzi stubs**
  - [x] `ui/booking/SlotPickerScreen.kt` + `SlotPickerScreenPaparazziTest.kt`
  - [x] `ui/booking/AddressScreen.kt` + `AddressScreenPaparazziTest.kt`
  - [x] `ui/booking/BookingSummaryScreen.kt` + `BookingSummaryScreenPaparazziTest.kt`
  - [x] `ui/booking/BookingConfirmedScreen.kt` + `BookingConfirmedScreenPaparazziTest.kt`

- [x] **WS-C6 — Navigation wiring**
  - [x] `navigation/BookingRoutes.kt` (5 route constants)
  - [x] `navigation/MainGraph.kt` — booking nested graph; `hiltViewModel(backStackEntry)` for shared VM
  - [x] `ui/catalogue/ServiceDetailScreen.kt` — Book Now CTA enabled; navigate into booking graph

- [x] **WS-MainActivity — Razorpay Activity bridge**
  - [x] `MainActivity.kt` — implement `PaymentResultListener` and forward to `PaymentResultBus`
  - [x] Razorpay Checkout SDK 1.6.40 dependency added to `build.gradle.kts` + `libs.versions.toml`

- [x] **WS-D1 — admin-web verification (no change needed)**
  - [x] Verified existing admin-web orders query targets `bookings` Cosmos container

- [x] **WS-Strings**
  - [x] `res/values/strings.xml` — 16 keys for booking screens

- [x] **WS-E — Smoke gate + Codex**
  - [x] Pre-Codex smoke gate green
  - [x] Codex review passed; `.codex-review-passed` marker shipped
  - [x] Paparazzi goldens recorded on Ubuntu CI post-merge

---

## Dev Notes

### What was actually shipped (per PR #23 file list)
- 7 main-source Kotlin files (1 use case, 1 UiState, 1 ViewModel, 4 screens) + `BookingRoutes.kt` + 2 modified files (`MainActivity.kt`, `MainGraph.kt`, `ServiceDetailScreen.kt`)
- 6 test files (RazorpayPaymentUseCaseTest, BookingViewModelTest, 4 Paparazzi snapshot tests, ServiceDetailScreenTest patched)
- 8 Paparazzi golden PNGs (light + dark for each of 4 screens) committed at merge — recorded via Ubuntu CI workflow_dispatch
- `customer-app/build.gradle.kts` (Razorpay SDK + Maps Places SDK) + `res/values/strings.xml` (16 keys)

### Key design decisions (from PR #23 description)
- **Stateless `BookingSummaryContent` composable** — extracted so the Paparazzi test renders the screen without instantiating a ViewModel that would crash on `Dispatchers.Main` in JVM tests.
- **`pendingServiceId` / `pendingCategoryId` as `public var`** on the ViewModel — simplest MVP approach; nav args are set from SlotPicker. This is a deliberate trade-off (would normally use SavedStateHandle or nav-arg passing) chosen for fewest moving parts.
- **Goldens NOT pixel-locked on Windows** — recorded once on Ubuntu CI via the `paparazzi-record.yml` workflow_dispatch.

### Why this story is being written retroactively
- During the 2026-04-26 story-completeness audit, PR #23 was found to have shipped without `docs/stories/E03-S03b-*.md` ever in main (the plan landed in PR #19 alongside S03a's plan).
- This rescue PR closes the audit hole.

### Patterns referenced (per plan)
- `docs/patterns/firebase-callbackflow-lifecycle.md` — `RazorpayPaymentUseCase` exposes a `Flow` over the bus; bus is the singleton (no callbackFlow lifecycle gotchas because `MainActivity` always exists when the SDK fires)
- `docs/patterns/kotlin-explicit-api-public-modifier.md` — all new public Kotlin
- `docs/patterns/paparazzi-cross-os-goldens.md` — recorded on Ubuntu CI; never on Windows
- `docs/patterns/hilt-module-android-test-scope.md` — `BookingViewModelTest` uses `mockk()`, not `@HiltAndroidTest`

---

## Definition of Done

- [x] `cd customer-app && ./gradlew :app:testDebugUnitTest :app:ktlintCheck :app:assembleDebug :app:koverVerify` green (PR #23 CI)
- [x] All AC pass via test assertions; 6 ViewModel tests + 4 Paparazzi tests
- [x] Pre-Codex smoke gate exited 0
- [x] `.codex-review-passed` marker shipped
- [x] Ubuntu Paparazzi goldens committed
- [x] CI green on `main` after merge (commit 1d5eb88)

---

## Dev Agent Record

### Agent Model Used
Claude (per PR #23 commit attribution)

### Completion Notes
PR #23 merged 2026-04-20 at 22:58 UTC as commit 1d5eb88. Codex review passed.

### File List
See PR #23: 7 new + 3 modified main-source Kotlin files; 6 test files; 8 Paparazzi PNGs; build.gradle.kts + strings.xml updates.
