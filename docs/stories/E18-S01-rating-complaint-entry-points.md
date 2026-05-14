---
status: smoke_pending
epic: E18
story: S01
tier: Feature
security: false
dependencies: []
---

# E18-S01 — Rating + Complaint Entry Points on Bookings List

## Context

CLOSED/COMPLETED bookings on CustomerBookingsScreen only show a status pill and amount — no action buttons. This story surfaces Rating and Complaint CTAs directly on BookingCard.

## Acceptance Criteria

- [x] AC-1: BookingCard for COMPLETED/CLOSED shows Rate Booking + File Complaint buttons
- [x] AC-2: Rate Booking hidden when ratingSubmitted == true
- [x] AC-3: CustomerBooking and CustomerBookingDto have ratingSubmitted: Boolean = false
- [x] AC-4: Buttons use HsPrimaryButton / HsSecondaryButton design-system tokens
- [x] AC-5: EN + HI strings in strings.xml and values-hi/strings.xml
- [x] AC-6: Paparazzi tests with @Ignore for both rating-pending and rating-submitted states
- [x] AC-7: Unit test for DTO mapping of ratingSubmitted

## Files Modified

- CustomerBooking.kt — ratingSubmitted field
- BookingDtos.kt — ratingSubmitted field + toDomain()
- CustomerBookingsScreen.kt — callbacks + action buttons + isPostService()
- CatalogueHomeScreen.kt — propagate callbacks
- MainGraph.kt — wire navigation
- strings.xml + values-hi/strings.xml — EN + HI strings

## New Files

- CustomerBookingDtoTest.kt
- CustomerBookingsScreenPaparazziTest.kt (Paparazzi, @Ignored)
