---
status: in_progress
epic: E18
story: S02
tier: Feature
security: false
dependencies: ["E11-S01b-2"]
---

# E18-S02 — Complaint SLA Countdown + History List + Reopen

## Context

Customers currently have no visibility into how long until their complaint SLA deadline. Once a complaint is resolved, there is no self-service path to reopen it if the resolution was unsatisfactory. Additionally, there is no discovery path to find past complaints without navigating through individual bookings.

## Acceptance Criteria

- **AC-1** `ComplaintScreen` in its "submitted/acknowledged" success state renders a `CountdownChip` composable showing time remaining until SLA deadline. Data source: `acknowledgeDeadlineAt` field on the complaint response (if present and complaint status == ACKNOWLEDGED).
- **AC-2** `CountdownChip` updates every second (using a `LaunchedEffect` with a 1-second delay loop). Formats as "HH:MM:SS remaining" in EN, appropriate HI equivalent.
- **AC-3** When `status == RESOLVED`, `ComplaintScreen` shows a "Reopen" button. Tapping calls `POST /v1/complaints/{id}/reopen`. On success, status resets to OPEN.
- **AC-4** New `ComplaintListScreen` composable at route `ComplaintRoutes.LIST`:
  - Lists all complaints for the current customer (calls `GET /v1/complaints?page=1&limit=20`)
  - Each entry shows: serviceType, status chip (color-coded), createdAt date
  - Tap → navigates to `ComplaintScreen` for that complaint
  - Reachable from: `SettingsScreen` via a new "My Complaints" row
- **AC-5** Hindi + EN strings for all new UI text.
- **AC-6** Paparazzi tests with `@org.junit.Ignore` for: `ComplaintScreen` with countdown, `ComplaintScreen` with reopen button, `ComplaintListScreen` list state, empty state.
- **AC-7** Unit tests: countdown chip ticks correctly, reopen API call triggered, complaint list pagination.
- **AC-8** ≥80% coverage on new code.

## Work Streams

### WS-A: Domain + Data Layer
- Add `reopen` method to `ComplaintRepository` + `ComplaintApiService`
- Add `getComplaints` (customer-scoped, paginated) to `ComplaintRepository` + `ComplaintApiService`
- Domain use cases: `ReopenComplaintUseCase`, `GetComplaintListUseCase`
- TDD: test `ComplaintRepositoryImpl` reopen + list paths

### WS-B: ViewModel Extensions
- Extend `ComplaintViewModel` with `onReopen(complaintId)` action
- New `ComplaintListViewModel` with complaint list state + pagination
- TDD: unit tests for reopen action, list loading, countdown tick logic

### WS-C: Compose UI
- `CountdownChip` standalone composable in `ui/components/`
- Extend `ComplaintScreen` / `SuccessState` to show `CountdownChip` (ACKNOWLEDGED) or Reopen button (RESOLVED)
- New `ComplaintListScreen` composable
- Wire `ComplaintRoutes.LIST` into `SettingsGraph` and `SettingsScreen`
- Paparazzi stubs (all `@Ignore`)

### WS-D: Strings
- EN strings for countdown, reopen, list screen
- HI strings for same

## Out of Scope
- BookingCard (E18-S01)
- RatingShieldBottomSheet (E18-S03)
- Push notification for SLA breach

## Technical Notes

- Countdown chip uses `LaunchedEffect` with a 1s `delay` loop and `ISO-8601` parsing via `java.time.Instant`
- `ComplaintApiService` already has `getComplaintsForBooking` (booking-scoped); the new endpoint is customer-scoped: `GET /v1/complaints?page={page}&limit={limit}`
- Reopen endpoint: `POST /v1/complaints/{id}/reopen` (returns updated `ComplaintResponseDto`)
- `ComplaintListResponseDto` DTO already exists; reuse for the paginated list response
- All new public Kotlin symbols need explicit `public` modifier (explicit API mode)
- No Paparazzi goldens committed locally (Windows CI drift); all Paparazzi tests annotated `@org.junit.Ignore`
