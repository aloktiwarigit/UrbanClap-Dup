# Story E03-S03a: Booking creation — API + Android data layer

Status: shipped (PR #19, merged 2026-04-20, commit 29d8c6b) — **retroactive docs**

> **Epic:** E03 — Service Discovery + Booking Flow (`docs/stories/README.md` §E03)
> **Sprint:** S2 (wk 3–4) · **Estimated:** ≤ 1 dev-day · **Priority:** P0
> **Sub-projects:** `api/`, `customer-app/`
> **Ceremony tier:** Foundation (introduces the `bookings` Cosmos container, the `requireCustomer` Firebase ID-token middleware, the Razorpay SDK service wrapper, and the customer-app's first authenticated repository)
> **Prerequisite:** E03-S01 (catalogue API), E03-S02 (customer catalogue UI). E02-S01 (customer auth) is logically prior; the implementation accepts a Firebase ID token, so the auth middleware works once E02-S01 ships its login flow.
> **Story split:** This is **part A** of the 2-part E03-S03 split. Part B (`E03-S03b`) lands the customer-app UI flow and Razorpay Checkout integration. They were split because the combined story exceeded the 1500-line plan cap.
> **Retroactive note:** This story file is being written *after* the implementation merged. PR #19 shipped without `docs/stories/E03-S03a-*.md` ever landing in main. The accompanying plan `plans/E03-S03a.md` was committed in PR #19 and is unchanged. Acceptance criteria below are reverse-engineered from the merged code (see `api/src/functions/bookings.ts`, `api/src/middleware/requireCustomer.ts`, `api/src/services/razorpay.service.ts`, and `customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/` for the canonical implementation).

---

## Story

As a **customer who has chosen a service in the catalogue**,
I want to create a booking by sending my chosen slot, address, and add-ons to the API and to receive a Razorpay order ready for checkout,
so that **the booking flow has a server-backed two-phase create + confirm contract** (FR-3.3; booking state machine in architecture §5.2).

---

## Acceptance Criteria

### AC-1 · Two-phase booking endpoints
- **Given** a Firebase-authenticated customer
- **When** they call `POST /v1/bookings` with body `{serviceId, slot, address, addOns?}`
- **Then** the API creates a booking document in Cosmos `bookings` container with status `PENDING_PAYMENT`
- **And** the API creates a Razorpay order via the SDK and returns `201 {bookingId, razorpayOrderId, amount}`
- **When** the customer (after Razorpay Checkout) calls `POST /v1/bookings/:id/confirm` with `{razorpayPaymentId, razorpayOrderId, razorpaySignature}`
- **Then** the API verifies HMAC-SHA256 of `orderId|paymentId` against `RAZORPAY_KEY_SECRET`
- **And** on valid signature transitions the booking from `PENDING_PAYMENT` → `SEARCHING` and returns `200 {bookingId, status: SEARCHING}`
- **And** on invalid signature returns `400` with code `INVALID_SIGNATURE`

### AC-2 · `requireCustomer` Firebase ID-token middleware
- **Given** every customer-scoped endpoint
- **When** the `Authorization: Bearer <token>` header is present
- **Then** `verifyFirebaseIdToken(token)` is called and the `uid` is attached to the request context
- **And** missing or invalid tokens return `401` with code `UNAUTHENTICATED`
- **And** the middleware shape mirrors `requireAdmin` for consistency

### AC-3 · Cosmos `bookings` schema
- **Given** the new container
- **Then** `api/src/cosmos/client.ts` exposes `getBookingsContainer()` and the container is partitioned for booking-by-id reads
- **And** `api/src/schemas/booking.ts` defines the `Booking` Zod schema with `id`, `customerId`, `serviceId`, `slot {start, end}`, `address`, `addOns[]`, `amount`, `status` (enum: PENDING_PAYMENT / SEARCHING / …), `razorpayOrderId`, `razorpayPaymentId?`, `createdAt`
- **And** the create + confirm bodies have their own input schemas

### AC-4 · Razorpay SDK service wrapper
- **Given** new service `api/src/services/razorpay.service.ts`
- **Then** `createOrder(amount, currency, receiptId)` wraps the `razorpay` npm SDK and returns `{ orderId, amount }`
- **And** `verifyPaymentSignature(orderId, paymentId, signature)` returns boolean using HMAC-SHA256 with the `RAZORPAY_KEY_SECRET` env var
- **And** unit tests cover both happy path and bad-signature path

### AC-5 · Android domain models (sealed)
- **Given** the Android side
- **Then** `domain/booking/model/BookingSlot.kt`, `BookingRequest.kt`, `BookingResult.kt`, `PaymentResult.kt` exist
- **And** `PaymentResult` is a sealed class with `Success(paymentId, orderId, signature)` and `Failure(code, description)` variants
- **And** all use cases sit in `domain/booking/`: `CreateBookingUseCase`, `ConfirmBookingUseCase` — each thin mappers over the repository

### AC-6 · Android data layer
- **Given** `BookingRepository` interface and `BookingRepositoryImpl`
- **Then** the impl calls `BookingApiService` (Retrofit) and maps `BookingDtos` → domain models
- **And** the OkHttp pipeline includes a Firebase-ID-token interceptor that injects `Authorization: Bearer <currentIdToken>` for all booking calls
- **And** `data/booking/PaymentResultBus.kt` is a Hilt singleton wrapping `MutableSharedFlow<PaymentResult>` — the bridge from the Razorpay Activity callback (set up in E03-S03b) to the `BookingViewModel`
- **And** `BookingModule` (Hilt) provides Retrofit, the API service, and binds the repository

### AC-7 · TDD coverage
- **Given** the implementation
- **Then** API tests cover: schema validation, repository CRUD, the `requireCustomer` middleware, and both create + confirm handlers (185 tests passing in PR description)
- **And** Android tests cover both use cases (`CreateBookingUseCaseTest`, `ConfirmBookingUseCaseTest`)
- **And** smoke gates pass for both `api/` and `customer-app/`

### AC-8 · libs.versions.toml synced across both apps
- **Given** new Android deps (e.g. `kotlinx-coroutines-play-services` for Firebase ID-token Task→suspend)
- **Then** both `customer-app/gradle/libs.versions.toml` and `technician-app/gradle/libs.versions.toml` are updated identically (per CLAUDE.md Android-story invariant)

### AC-9 · AndroidManifest update
- **Given** customer-app needs to launch Razorpay Checkout (in E03-S03b) and resolve Firebase ID-token
- **Then** AndroidManifest declares the necessary permissions / activity entries that PR #19 added

---

## Tasks / Subtasks (as actually shipped)

> Implementation merged via PR #19. Tasks below match the work-stream plan at `plans/E03-S03a.md`.

- [x] **WS-A — API**
  - [x] `api/src/types/customer.ts` — typed request augmentation
  - [x] `api/src/middleware/requireCustomer.ts` + `api/tests/unit/requireCustomer.test.ts`
  - [x] `api/src/schemas/booking.ts` + `api/tests/schemas/booking.test.ts`
  - [x] `api/src/cosmos/client.ts` — add `getBookingsContainer()`
  - [x] `api/src/cosmos/booking-repository.ts`
  - [x] `api/src/services/razorpay.service.ts` + `api/tests/unit/razorpay.service.test.ts`
  - [x] `api/src/functions/bookings.ts` (POST /v1/bookings, POST /v1/bookings/:id/confirm)
  - [x] `api/tests/bookings/create.test.ts` + `confirm.test.ts`

- [x] **WS-B — Android domain (TDD)**
  - [x] `domain/booking/model/BookingSlot.kt`, `BookingRequest.kt`, `BookingResult.kt`, `PaymentResult.kt`
  - [x] `domain/booking/CreateBookingUseCase.kt` + test
  - [x] `domain/booking/ConfirmBookingUseCase.kt` + test

- [x] **WS-C — Android data layer**
  - [x] `data/booking/BookingRepository.kt` + `BookingRepositoryImpl.kt`
  - [x] `data/booking/remote/BookingApiService.kt`
  - [x] `data/booking/remote/dto/BookingDtos.kt`
  - [x] `data/booking/PaymentResultBus.kt` (Hilt singleton)
  - [x] `data/booking/di/BookingModule.kt`

- [x] **WS-D — Build + manifest**
  - [x] `customer-app/gradle/libs.versions.toml` + technician-app sync
  - [x] `customer-app/app/build.gradle.kts` (16 deps added)
  - [x] `customer-app/app/src/main/AndroidManifest.xml` (4-line permission/activity additions)

- [x] **WS-E — Smoke gate + Codex**
  - [x] Pre-Codex smoke gate green for both api/ and customer-app/
  - [x] Codex review passed (round 2)

---

## Dev Notes

### What was actually shipped (per PR #19 file list)
- 14 API files (5 src, 5 tests, schema + repository + middleware + service + bookings function), `api/package.json` + lockfile
- 14 customer-app files (4 domain models, 2 use cases + tests, 5 data-layer files, 2 build files)
- `plans/E03-S03a.md` (1266 L) + `plans/E03-S03b.md` (1133 L) — the split plan was committed in this PR even though E03-S03b's code didn't ship until PR #23
- Both `libs.versions.toml` files synced (10 lines each)

### Why this story is being written retroactively
- During the 2026-04-26 story-completeness audit, PR #19 was found to have shipped with both plans (S03a + S03b) but no story file ever in main.
- This rescue PR (and the sibling rescue for E03-S03b) closes the audit hole.

### Two-phase create+confirm rationale
- Razorpay client-side checkout flow: client calls `/v1/bookings` to obtain a `razorpayOrderId`, opens Razorpay Checkout, then calls `/v1/bookings/:id/confirm` with the signed payment result.
- Server-side webhook (E03-S04) closes the loop in case the client's `/confirm` call drops — webhook upgrades to `PAID` and triggers dispatch.

### Patterns referenced (per plan)
- `docs/patterns/kotlin-explicit-api-public-modifier.md` — every new public Kotlin file
- `docs/patterns/hilt-module-android-test-scope.md` — `BookingModule` + tests use `mockk()`, not `@HiltAndroidTest`

---

## Definition of Done

- [x] `cd api && pnpm test` green (185 tests at merge per PR description)
- [x] `cd customer-app && ./gradlew :app:testDebugUnitTest :app:ktlintCheck :app:assembleDebug` green
- [x] Pre-Codex smoke gates exited 0 (api + customer-app)
- [x] `.codex-review-passed` marker shipped
- [x] CI green on `main` after merge (commit 29d8c6b)

---

## Dev Agent Record

### Agent Model Used
Claude (per PR #19 commit attribution)

### Completion Notes
PR #19 merged 2026-04-20 at 21:54 UTC as commit 29d8c6b. Codex review passed.

### File List
See PR #19: 14 API files + 14 customer-app files + 2 plan files + 2 build/version files.
