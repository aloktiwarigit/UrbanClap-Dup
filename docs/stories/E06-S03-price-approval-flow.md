# Story E06-S03: Price approval flow — per-add-on customer approval with FCM push

Status: shipped (PR #36, merged 2026-04-23 · SHA `7f9ba79`)

> **Epic:** E06 — Service Execution + Payment (`docs/stories/README.md` §E06)
> **Sprint:** S3 (wk 5–6) · **Estimated:** ≤ 1 dev-day · **Priority:** **P0 — blocks E06-S04 (Razorpay Route uses `finalAmount`)**
> **Sub-projects:** `customer-app/`, `api/`
> **Ceremony tier:** Foundation (money path — server-side price-lock; Codex required, `/security-review` triggered for money-handling)
> **Implementation plan:** `plans/E06-S03.md`
>
> **Rescue note (2026-04-26):** This story file was generated retroactively from PR #36 + the existing `plans/E06-S03.md`. The implementation has been live on `main` since 2026-04-23; this document closes the BMAD audit gap (#118).

---

## Story

As the **customer** whose technician encounters an unexpected condition mid-service (e.g. needs a gas refill, replacement part, or extra cleaning agent),
I want to be notified instantly with each proposed add-on, see exactly what each line costs, and Approve or Decline each one independently,
so that **I never get a surprise charge, the technician can quote transparently, and the system charges me only for the line items I actually approved — with the original booking price always preserved as the price-lock floor.**

---

## Acceptance Criteria

### AC-1 · Tech can request an add-on only while `IN_PROGRESS`
- **Given** a booking in status `IN_PROGRESS` assigned to the calling technician
- **When** the technician calls `POST /v1/bookings/{id}/request-addon` with `{ name, price, triggerDescription }`
- **Then** the booking transitions to `AWAITING_PRICE_APPROVAL`
- **And** the add-on is appended to `pendingAddOns[]`
- **And** an FCM data message of `type: 'ADDON_APPROVAL_REQUESTED'` is published to topic `customer_{customerId}` with the booking ID
- **Given** the booking is in any other status, the API returns **409**
- **Given** the technician does not match `booking.technicianId`, the API returns **403**

### AC-2 · Customer sees pending add-ons and approves/declines per line
- **Given** the customer app receives the FCM push (foreground or background)
- **Then** `CustomerFirebaseMessagingService` posts the booking ID to `PriceApprovalEventBus`
- **And** `AppNavigation` routes to `PriceApprovalScreen` for that booking
- **Then** the screen calls `GET /v1/bookings/{id}` and renders one card per `pendingAddOn` with **Approve** + **Decline** buttons
- **And** the customer can approve and decline different items in the same submission

### AC-3 · Server-side price-lock — base `amount` never modified
- **Given** the customer submits decisions via `POST /v1/bookings/{id}/approve-final-price`
- **Then** only items with `approved: true` are appended to `approvedAddOns[]`
- **And** `finalAmount = (existing.finalAmount ?? booking.amount) + sum(approvedItems.price)`
- **And** the original `amount` field is **never modified**
- **And** the booking returns to status `IN_PROGRESS`

### AC-4 · Customer auth and ownership enforced on approve endpoint
- **Given** the caller is not the booking's `customerId`, the API returns **403**
- **Given** the booking is not in `AWAITING_PRICE_APPROVAL`, the API returns **409**
- **Given** the request body fails Zod validation, the API returns **400**

### AC-5 · `GET /v1/bookings/{id}` returns the customer-visible projection
- **Given** the customer requests `GET /v1/bookings/{id}` with their own `customerId`
- **Then** the response includes `bookingId`, `status`, `amount`, `pendingAddOns`, `approvedAddOns`, `finalAmount`
- **And** mismatched callers receive **403**

### AC-6 · FCM topic subscription on login
- **Given** the customer is authenticated
- **Then** the app subscribes to topic `customer_{uid}` on app start
- **And** unsubscribes on logout

### AC-7 · Compose screen behaviour
- **Given** the screen has loaded `pendingAddOns`
- **Then** each card shows the add-on name, price (₹ formatted from paise), and trigger description
- **And** the **Submit** CTA is disabled until every line has a decision
- **And** on success the screen pops back to the active booking screen

---

## Tasks / Subtasks

> Implementation followed `plans/E06-S03.md` (full work-stream plan). Recap below — granular checklists live in the plan.

- [x] **T1 — libs.versions.toml sync** · `cp customer-app/gradle/libs.versions.toml technician-app/...` (Android invariant)
- [x] **T2 — API: schemas + repo + FCM service + endpoints (WS-A, TDD)**
  - Create `api/src/schemas/addon-approval.ts` (`PendingAddOn`, `RequestAddOnBody`, `ApproveAddOnsBody`)
  - Extend `api/src/schemas/booking.ts` with `AWAITING_PRICE_APPROVAL` status + `pendingAddOns` / `approvedAddOns` / `finalAmount` fields
  - Add `requestAddOn()` + `applyAddOnDecisions()` to `booking-repository.ts`
  - Create `api/src/services/fcm.service.ts` → `sendPriceApprovalPush()` (firebase-admin, topic `customer_{uid}`)
  - Add `getBookingHandler`, `requestAddonHandler`, `approveFinalPriceHandler` to `api/src/functions/bookings.ts`
  - 9 Vitest cases in `tests/bookings/price-approval.test.ts` (200/403/409 per endpoint + event metadata)
- [x] **T3 — Customer app domain + data (WS-B, TDD)**
  - `domain/booking/model/PendingAddOn.kt`, `AddOnDecision.kt`
  - `ApproveFinalPriceUseCase`, `GetPendingAddOnsUseCase` (TDD)
  - Extend `BookingRepository` + `BookingRepositoryImpl` with `getBooking()` + `approveFinalPrice()`
  - `BookingApiService` + DTOs (`BookingDto`, `PendingAddOnDto`, `ApproveFinalPriceRequestDto`, `ApproveFinalPriceResponseDto`)
- [x] **T4 — FCM bridge (WS-C)**
  - `CustomerFirebaseMessagingService` (`@AndroidEntryPoint`)
  - `PriceApprovalEventBus` (singleton `MutableSharedFlow`)
  - Manifest registration of FCM service
  - `MainActivity` injects + passes `priceApprovalEventBus` to navigation
- [x] **T5 — Compose UI + nav (WS-D)**
  - `PriceApprovalUiState` sealed
  - `PriceApprovalViewModel` (manual constructor, no `@HiltAndroidTest`)
  - `PriceApprovalScreen` with Approve/Decline cards + submit CTA
  - `BookingRoutes.PRICE_APPROVAL`; `MainGraph` composable
  - `AppNavigation` subscribes to `customer_{uid}` topic + observes event bus
  - `PriceApprovalScreenPaparazziTest` `@Ignored` (CI workflow_dispatch)
- [x] **T6 — Smoke gate + review** · `pre-codex-smoke.sh customer-app` + `pre-codex-smoke-api.sh` PASSED; Codex review PASSED; `/security-review` triggered (money path) — 0 P1; CI green; merged

---

## Dev Notes

### Context from previous stories
- **E06-S01** introduced `BookingEvent.metadata` (widened to `Record<string, unknown>`) and the active-job state machine. This story adds `AWAITING_PRICE_APPROVAL` between `IN_PROGRESS` and `COMPLETED` to that machine.
- **E03-S04** webhook-handler already maintains `paymentId` on `PAID` — we don't touch payment state here. `finalAmount` becomes the input to **E06-S04** Razorpay Route settlement.
- **E03-S03** booking-creation flow seeds `amount` (base price). This story keeps `amount` immutable.

### Security invariants (non-negotiable)
1. **Price-lock floor**: base `amount` is never written to after booking creation.
2. **Per-line authorisation**: only items with `approved: true` enter `approvedAddOns[]`. A maliciously edited request body cannot inflate `finalAmount` because the server reads `pendingAddOns` from Cosmos, not from the request.
3. **Ownership**: every endpoint asserts `customerId` (customer routes) or `technicianId` (tech routes).
4. **Idempotency**: re-submitting decisions when status ≠ `AWAITING_PRICE_APPROVAL` is rejected with **409** — a double-submission cannot double-charge.

### FCM topic naming
- `customer_{uid}` is reserved across the platform. E06-S04 introduces `technician_{uid}` and `owner_ops_alerts`. Topic naming convention: snake_case, role-scoped, never PII-bearing.

### Paparazzi
- Per `docs/patterns/paparazzi-cross-os-goldens.md`, the screenshot test is `@Ignored` and goldens are recorded on CI Linux only.

---

## Definition of Done

- [x] `pnpm vitest run` (api) — 433 tests pass including 9 new
- [x] `./gradlew testDebugUnitTest` (customer-app) — green including `ApproveFinalPriceUseCaseTest`, `GetPendingAddOnsUseCaseTest`, `PriceApprovalViewModelTest`
- [x] Pre-Codex smoke gates exit 0
- [x] `.codex-review-passed` marker present
- [x] `/security-review` complete (money-path trigger)
- [x] PR #36 opened; CI green; merged 2026-04-23 (SHA `7f9ba79`)

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (executing-plans).

### Completion Notes
- Server-side price-lock invariant validated by 3 dedicated Vitest cases (decline-only, approve-only, mixed).
- FCM topic subscription tested via instrumented test path; unit test covers the event-bus bridge.
- 0 P1 findings on first Codex round.

### File List
See PR #36 (full file inventory). Authoritative file map in `plans/E06-S03.md` §"File Map".
