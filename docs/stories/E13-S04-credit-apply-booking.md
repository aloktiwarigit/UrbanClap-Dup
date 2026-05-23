---
status: in_progress
epic: E13
story: S04
tier: Feature
security: true
dependencies: ["E13-S01", "E13-S02"]
---

# E13-S04 — Credit-Apply on Next Booking + Razorpay Route Adjustments

## Context
E13-S01 added the wallet balance API and `applyCredit` field on `POST /v1/bookings`. E13-S02
added the WalletScreen and balance chip on HomeScreen. This story wires the credit-apply toggle
into the booking summary flow so customers can apply available credit before paying, reducing the
Razorpay order amount to (original − credit).

## Acceptance Criteria

- **AC-1** BookingSummaryScreen shows an "Apply ₹500 credit" toggle when wallet balance > 0.
  Toggle is checked by default when credit is available.
- **AC-2** "Total to Pay" reflects original − credit when toggle is on.
  Original amount remains visible as "Original price: ₹X".
- **AC-3** When confirmed with `applyCredit = true`, `POST /v1/bookings` body includes `applyCredit: true`.
- **AC-4** BookingConfirmedScreen shows "₹500 credit applied" when `appliedCreditAmount > 0`.
- **AC-5** Toggle hidden when wallet balance is 0 or negative (no clutter).
- **AC-6** Razorpay order amount = `response.totalAmountPaise - response.appliedCreditAmount`.
- **AC-7** Hindi + EN strings for all new UI text.
- **AC-8** Paparazzi tests `@Ignored`: summary with credit toggle, summary without toggle, confirmed with credit.
- **AC-9** Unit tests: toggle visibility, amount calculation, `applyCredit` in request.
- **AC-10** ≥80% line coverage.

## Security notes
- Credit amount is read-only from API response — never set by the client.
- `applyCredit` is a boolean flag only; the server determines the credit amount applied.
- Client-side `totalToPayPaise` is display-only; actual charge is determined server-side.
- Guard: `totalToPayPaise` displayed = max(0, original - credit) — cannot show negative total.

## Files changed
- `domain/booking/model/BookingRequest.kt` — add `applyCredit: Boolean = false`
- `domain/booking/model/BookingResult.kt` — add `appliedCreditAmount: Int = 0`
- `data/booking/remote/dto/BookingDtos.kt` — add `applyCredit`/`appliedCreditAmount` to DTOs
- `data/booking/BookingRepositoryImpl.kt` — pass `applyCredit` in request DTO
- `ui/booking/BookingUiState.kt` — add `walletBalanceInPaise` to `Ready`, `appliedCreditAmount` to `BookingConfirmed`
- `ui/booking/BookingViewModel.kt` — credit toggle state + adjusted Razorpay amount
- `ui/booking/BookingSummaryScreen.kt` — credit toggle UI
- `ui/booking/BookingConfirmedScreen.kt` — credit-applied banner
- `res/values/strings.xml` — EN strings
- `res/values-hi/strings.xml` — HI strings
- Test files for all of the above
