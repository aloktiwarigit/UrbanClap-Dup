---
status: in_progress
epic: E13
story: S03
tier: Feature
security: false
dependencies: ["E13-S02", "E11-S01b-1"]
---

# E13-S03 — No-Show Banner + FCM Branch Handler

## Summary

Handle `NO_SHOW_CREDIT_ISSUED` FCM messages in `CustomerFirebaseMessagingService`, post a
system-tray notification using the existing `CHANNEL_CREDITS` channel, emit an in-process
event via a new `NoShowCreditEventBus`, show a dismissible `NoShowCreditBanner` composable
on `CustomerBookingsScreen` and `LiveTrackingScreen`, and trigger `WalletViewModel.retry()`
on the home destination so the `WalletBalanceChip` balance refreshes.

## Acceptance Criteria

| AC | Description |
|----|-------------|
| AC-1 | `CustomerFirebaseMessagingService` handles `NO_SHOW_CREDIT_ISSUED`: posts system-tray notification on `CHANNEL_CREDITS` + emits event via `NoShowCreditEventBus` |
| AC-2 | `NoShowCreditBanner` appears at top of `CustomerBookingsScreen` with localised credit message; auto-dismisses after 5 s or on tap |
| AC-3 | Same banner at top of `LiveTrackingScreen` |
| AC-4 | After `NO_SHOW_CREDIT_ISSUED`, `WalletBalanceChip` on HomeScreen refreshes balance via `WalletViewModel.retry()` triggered by the event bus |
| AC-5 | Payload `creditAmountPaise` parsed and formatted amount shown in banner |
| AC-6 | EN + HI strings in `res/values/strings.xml` and `res/values-hi/strings.xml` |
| AC-7 | Paparazzi test for `NoShowCreditBanner` (EN + HI, `@Ignored`) |
| AC-8 | Unit test: FCM handler dispatches notification + event for `NO_SHOW_CREDIT_ISSUED`; mock `NoShowCreditEventBus` |
| AC-9 | ≥ 80 % coverage on new code paths |

## Constraints

- Do NOT touch BookingCard rating/complaint buttons (E18-S01)
- Do NOT touch ComplaintScreen (E18-S02)
- Do NOT touch Razorpay credit-apply logic (E13-S04)
- Banner is a standalone composable; screens observe the event bus — no embedding logic
- No hardcoded string literals in Compose

## Out of scope

- E13-S04 credit redemption at checkout
- Backend projector changes
