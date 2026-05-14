---
status: in_progress
epic: E18
story: S01
tier: Feature
security: false
dependencies: []
---

# E18-S01 — Rating + Complaint Entry Points on Bookings List

## Context

The customer bookings list shows cards for all bookings regardless of status. Post-service
actions (rate the service, file a complaint) are only reachable via deep-link or push
notification today. This story surfaces direct action buttons on `BookingCard` for
COMPLETED/CLOSED bookings so customers can initiate these flows without waiting for a push.

`RatingRoutes.route(bookingId)` and `ComplaintRoutes.route(bookingId)` are already registered
in `MainGraph.bookingGraph`. The navigation plumbing exists — this story wires the UI entry
points and propagates the `ratingSubmitted` field from the API DTO through to the card.

## Scope

**In scope:**
- `CustomerBooking` domain model: add `ratingSubmitted: Boolean` (default `false`)
- `CustomerBookingDto`: add `ratingSubmitted: Boolean` (default `false`), wire through `toDomain()`
- `CustomerBookingsScreen` / `BookingCard`: add "Rate Booking" + "File Complaint" buttons for COMPLETED/CLOSED bookings; hide Rate button when `ratingSubmitted == true`
- `CustomerBookingsScreen` / `CustomerBookingsContent`: add `onRateBooking` + `onFileComplaint` callback params
- `CatalogueHomeScreen` + `HomeTabs`: propagate new callbacks through to `CustomerBookingsScreen`
- `MainGraph.homeDestination`: wire callbacks to `navController` navigation
- `res/values/strings.xml` + `res/values-hi/strings.xml`: new strings for both buttons
- Unit tests: `CustomerBookingsViewModelTest` extended; `CustomerBookingDtoTest` for `ratingSubmitted` mapping
- Paparazzi: `BookingCardPaparazziTest` with `@Ignored`

**Out of scope:** RatingScreen, ComplaintScreen, SLA logic, FCM deep-links, any other story's files.

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC-1 | `BookingCard` for CLOSED or COMPLETED status shows "बुकिंग को रेट करें" and "शिकायत दर्ज करें" buttons |
| AC-2 | Rate Booking button hidden when `ratingSubmitted == true` |
| AC-3 | `CustomerBooking` DTO gains `ratingSubmitted: Boolean` (default `false`); wired from API response |
| AC-4 | Buttons use `HsPrimaryButton` / `HsSecondaryButton` design-system tokens |
| AC-5 | Hindi strings in both `values/strings.xml` and `values-hi/strings.xml` |
| AC-6 | Paparazzi test with `@Ignore` covers both button-visibility states |
| AC-7 | Unit test verifies `ratingSubmitted` field round-trips correctly in ViewModel state |
| AC-8 | ≥80% coverage on new code paths (kover) |

## Files Created

| File | Purpose |
|------|---------|
| `app/src/test/kotlin/.../ui/bookings/BookingCardPaparazziTest.kt` | Paparazzi screenshots (ignored, CI only) |
| `app/src/test/kotlin/.../data/booking/remote/dto/CustomerBookingDtoTest.kt` | DTO `ratingSubmitted` mapping unit test |

## Files Modified

| File | Change |
|------|--------|
| `domain/booking/model/CustomerBooking.kt` | Add `ratingSubmitted: Boolean = false` |
| `data/booking/remote/dto/BookingDtos.kt` | Add `ratingSubmitted: Boolean = false` to `CustomerBookingDto`; wire through `toDomain()` |
| `ui/bookings/CustomerBookingsScreen.kt` | Add callbacks + action buttons in `BookingCard` |
| `ui/catalogue/CatalogueHomeScreen.kt` | Propagate new callbacks through `CatalogueHomeScreen` / `HomeTabs` |
| `navigation/MainGraph.kt` | Wire `onRateBooking` + `onFileComplaint` to navController in `homeDestination` |
| `res/values/strings.xml` | `bookings_rate_booking`, `bookings_file_complaint` |
| `res/values-hi/strings.xml` | Same keys in Hindi |
| `app/src/test/kotlin/.../ui/bookings/CustomerBookingsViewModelTest.kt` | Add `ratingSubmitted` assertions |

## Work Streams

### WS-A: Domain + DTO (test-first)
1. Write `CustomerBookingDtoTest` (ratingSubmitted round-trip)
2. Add `ratingSubmitted` to `CustomerBooking`
3. Add `ratingSubmitted` to `CustomerBookingDto.toDomain()`

### WS-B: Strings
4. Add strings to `values/strings.xml` and `values-hi/strings.xml`

### WS-C: UI + Navigation (test-first)
5. Extend `CustomerBookingsViewModelTest` (ratingSubmitted in state)
6. Modify `CustomerBookingsScreen`: callbacks + BookingCard action buttons
7. Propagate callbacks through `CatalogueHomeScreen` + `HomeTabs`
8. Wire navigation in `MainGraph.homeDestination`

### WS-D: Paparazzi
9. Write `BookingCardPaparazziTest` with `@Ignore`

### WS-E: Smoke gate
10. Run `./gradlew assembleDebug ktlintCheck detekt lintDebug testDebugUnitTest koverVerify`
