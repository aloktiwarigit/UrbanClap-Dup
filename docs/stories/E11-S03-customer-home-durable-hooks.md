# E11-S03 — Customer Home Durable Hooks (CustomerHomeScreen)

**Epic:** E11 — Durable Screen Hooks
**Ceremony tier:** Feature (lean plan, same session execute)
**Status:** In progress
**Author:** Alok Tiwari
**Date:** 2026-05-14

---

## Context

E11-S03 adds state-driven sections **above** the existing catalogue grid on the customer home screen (tab 0).
These sections surface unresolved workflow state (pending actions, active booking, recent bookings) so the
customer can pick up where they left off without relying on push notifications alone.

Pre-req: `PendingActionStore` exists (E11-S01a shipped). `BookingRepository.getMyBookings()` exists.

---

## Scope

Extend `CatalogueHomeScreen` (tab 0 / `CatalogueTab`) by adding three state-driven sections above the
`PromoSlider`, driven by a new `CustomerHomeViewModel`:

1. **Pending Actions Stack** — top 3 ACTIVE actions for role="customer", ordered by priority.
   Hidden when list is empty. Each card taps to the action's `routeUri`.
2. **Active Booking Card** — first booking with status ∈
   {SEARCHING, ASSIGNED, EN_ROUTE, REACHED, IN_PROGRESS, AWAITING_PRICE_APPROVAL}.
   Hidden when none. Tap → LiveTracking or PriceApproval depending on status.
3. **Recent Bookings List** — last 5 COMPLETED bookings. Hidden when empty.
   Tap → rating/complaint navigation.
4. `WalletBalanceChip` stays in `StickyHero` (E13-S02 — do not remove).
5. Catalogue grid stays as the lowest section (existing, no changes).

---

## Acceptance Criteria

| # | Criterion |
|---|---|
| AC-1 | CustomerHomeScreen is the home tab destination; catalogue is still visible below state-driven sections |
| AC-2 | Pending actions section shows when PendingActionStore has items; hidden when empty |
| AC-3 | Active booking card navigates correctly per status (tracking vs price-approval) |
| AC-4 | Recent bookings section shows up to 5 COMPLETED bookings; hidden when empty |
| AC-5 | WalletBalanceChip remains in StickyHero — not removed |
| AC-6 | Skeleton loading (shimmer placeholders) for all three dynamic sections |
| AC-7 | EN + HI strings for all new UI text |
| AC-8 | Paparazzi `@Ignored` tests exist for: empty state, pending-actions state, active-booking state |
| AC-9 | ViewModel unit tests cover state composition from 3 merged flows |

---

## Work Streams

### WS-A: Domain model + ViewModel

- New `CustomerHomeUiState` sealed class with `Loading`, `Ready` (containing 3 optional sub-states)
- New `CustomerHomeViewModel` (HiltViewModel):
  - `pendingActionsFlow` from `PendingActionStore.observeActive(userId)`
  - `activeBookingFlow` from `BookingRepository.getMyBookings()` filtered to active statuses
  - `recentBookingsFlow` from `BookingRepository.getMyBookings()` filtered to COMPLETED, take last 5
  - Merges 3 flows into `CustomerHomeUiState`
  - Implements `isDirty() = false` (home is read-only)

### WS-B: Compose UI (sections in CatalogueTab)

- `PendingActionsSection` — shows top 3 action cards
- `ActiveBookingSection` — shows one card; routes to tracking or price-approval
- `RecentBookingsSection` — shows up to 5 completed bookings
- `SkeletonSection` — shimmer placeholder for loading state
- Integrate into existing `CatalogueTab` LazyColumn above `PromoSlider`

### WS-C: Strings + Paparazzi stubs

- EN + HI string resources for all new text
- Paparazzi tests with `@Ignored` annotation (no goldens on Windows)

### WS-D: Wiring in MainGraph

- `CustomerHomeViewModel` injected into `homeDestination` alongside existing `CatalogueHomeViewModel`
- Navigation callbacks passed down

---

## Test Surface

- `CustomerHomeViewModelTest`: 3-flow merge; pending actions list; active booking filter; recent bookings filter and limit
- `CustomerHomeScreenPaparazziTest`: `@Ignored` stubs for empty / pending-actions / active-booking states

---

## Out of Scope

- SOS, trust dossier, confidence score (E11-S05b-1, E11-S05b-2)
- Pull-to-refresh reconciliation (E11-S01b-1)
- NotificationRouter / Ingestor wiring (E11-S01b-1)

---

## Notes

- If `PendingActionStore` is unavailable at injection time, emit `emptyList()` — never block rendering.
- Do NOT add new Hilt modules — provide `CustomerHomeViewModel` via existing `@HiltViewModel` annotation.
- Paparazzi goldens recorded on CI Linux only (see `docs/patterns/paparazzi-cross-os-goldens.md`).
