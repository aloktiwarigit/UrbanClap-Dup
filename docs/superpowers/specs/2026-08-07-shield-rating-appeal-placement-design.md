# ShieldReportSheet + RatingAppealSheet Design Placement — Design Spec

**Date:** 2026-08-07
**Story:** technician-app, unnumbered backlog item (flagged during Phase 3 handoff — "ShieldReportSheet/RatingAppealSheet wiring")
**Tier:** Feature (wiring existing, tested backing logic onto existing screens — no new business logic)
**Status:** Approved — ready for plan

---

## 1. Context and scope

`ShieldReportSheet` and `RatingAppealSheet` (technician-app) have complete, tested backing logic —
`ActiveJobViewModel`'s `showShieldSheet`/`shieldReportInProgress`/`shieldReportSuccess`/`shieldReportError`
state → `FileShieldReportUseCase` → `ShieldRepository` → API, and `MyRatingsViewModel`'s `appealState`
(`Idle`/`Loading`/`Success`/`QuotaExceeded`/`Error`) → `FileRatingAppealUseCase` → `ShieldRepository` → API —
but neither sheet is reachable from any screen. No trigger exists in `ActiveJobScreen.kt` or
`MyRatingsScreen.kt`. This spec covers only the missing UI trigger + feedback wiring; no ViewModel or
backend logic changes.

**Backend confirmation (`api/src/schemas/complaint.ts`, `api/src/functions/shield-report.ts`) — this
was the open question the brainstorm resolved:** Shield reports (`ABUSIVE_CUSTOMER_SHIELD` complaint
type) are NOT redundant with the existing "Report issue" button already reachable from `RatingScreen`
(`STANDARD` complaint type, via `ComplaintScreen`). Filing a shield report **automatically blocks the
customer from future bookings with this technician** (`addBlockedCustomer`) and fires an urgent FCM
alert to ops (`sendAbusiveShieldAlert`); it is one-shot per booking (409 on retry), 48h SLA. This is a
materially heavier action than the general complaint form and needs its own, more prominent entry
point. `RATING_APPEAL` is likewise its own complaint type, distinct from `STANDARD`, and the
`ReceivedRating` domain model already carries an unused `appealDisputed: Boolean` field — clear
evidence the appeal-per-rating-card UI was anticipated but never wired.

**Scope cut:** the backend's shield-report eligibility window spans `ASSIGNED` through
`COMPLETED → PAID → CLOSED`, but this story only surfaces the trigger while `ActiveJobScreen` is in its
`Active` state (covers the overwhelming majority of real reports — mid-job or just after). The wider
post-completion window stays unexposed; no trigger is added to `RatingScreen` or elsewhere for shield
reports.

---

## 2. Shield report wiring (ActiveJobScreen)

**Files:** `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/activeJob/ActiveJobScreen.kt`,
`ShieldReportSheet.kt` (content copy only)

**Precedent followed:** customer-app's SOS button (`LiveTrackingScreen.kt`) — top-bar `TextButton`,
error-tinted, icon + label (the existing code comment there: "icon + text, never icon alone — this is
the one control where guessing wrong has physical consequences"), `defaultMinSize(48.dp, 48.dp)`,
explicit `contentDescription`.

**Changes:**
1. `ActiveJobScreenContent` gains a `Scaffold` + `TopAppBar`, rendered only for the `Active` state
   (`Loading`/`Completed`/`Error` keep their current centered layouts, unchanged). Title =
   `state.job.serviceName` (existing field, no new data). No navigation icon — `ActiveJobScreen`
   deliberately has no way to back out mid-job today; this story does not change that.
2. Top bar `actions`: error-tinted `TextButton` — `Icon(Icons.Filled.Warning)` + `Text(stringResource(R.string.shield_report_trigger))`,
   min 48dp touch target, explicit `contentDescription`. `onClick = viewModel::onShowShieldSheet`
   (already exists, no ViewModel change).
3. `ShieldReportSheetContent`: add one warning line above the submit button —
   `stringResource(R.string.shield_report_block_warning)` ("This will block this customer from future
   bookings with you."). Since submission is irreversible and one-shot, the existing "Submit report" tap
   needs to carry informed consent; this is a copy addition, not a new confirmation step.
4. `shieldReportSuccess`/`shieldReportError` already exist as state but nothing currently consumes them
   (dead state, same shape of gap as the sheet itself). The new `Scaffold` from step 1 takes a
   `snackbarHostState` (created via `remember { SnackbarHostState() }` in `ActiveJobScreenContent`,
   passed to `Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }, ...)`); a `LaunchedEffect`
   keyed on `uiState.shieldReportSuccess`/`uiState.shieldReportError` shows the message and calls
   `consumeShieldReportSuccess`/`consumeShieldReportError` — one Scaffold, one snackbar host, no
   separate composable.

---

## 3. Rating appeal wiring (MyRatingsScreen)

**Files:** `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/myratings/MyRatingsScreen.kt`

**Changes:**
1. `RatingItemCard` gains `onAppealClick: (bookingId: String) -> Unit`. Renders
   `HsActionButton(stringResource(R.string.rating_appeal_action), onClick = { onAppealClick(rating.bookingId) })`
   when `!rating.appealDisputed`; renders `HsTrustBadge(stringResource(R.string.rating_appeal_disputed_badge))`
   instead when `true`. Both components already exist in the design system — no new component.
2. **Sheet-visibility state:** `MyRatingsViewModel` has no "which booking's sheet is open" state today
   (unlike Shield's `showShieldSheet`). Minimal-diff choice: local Compose state in `RatingsSuccess` —
   `var appealSheetFor by rememberSaveable { mutableStateOf<String?>(null) }`. Tapping "Appeal" sets it
   to that rating's `bookingId`; when non-null, render `RatingAppealSheet(bookingId = appealSheetFor, ...)`.
3. `isSubmitting` for the sheet = `appealState is AppealState.Loading && appealState.bookingId == appealSheetFor`
   (`AppealState.Loading` already carries `bookingId` — no ViewModel change needed).
4. **Snackbar hosting:** `MyRatingsScreen`'s existing top-level `Scaffold` (already has `topBar`, no
   `snackbarHost` today) gains `snackbarHostState` (`remember { SnackbarHostState() }` in
   `MyRatingsScreen`, passed to `Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }, ...)`).
   `appealState` (already collected in `MyRatingsScreen`) and `snackbarHostState` are both threaded down
   through `MyRatingsContent` → `RatingsSuccess` as plain parameters — the `LaunchedEffect(appealState)`
   that shows the snackbar lives in `RatingsSuccess`, alongside `appealSheetFor`, since it needs to reset
   that same state on `Success`/`QuotaExceeded`. One Scaffold, one snackbar host, same pattern as
   Section 2.
5. **Outcomes** (each drives the `LaunchedEffect(appealState)` in `RatingsSuccess`):
   - **Success:** dismiss sheet (`appealSheetFor = null`), Snackbar (`rating_appeal_success`), call
     `viewModel.refresh()` so the card's `Disputed` badge reflects server truth on next load — avoids a
     second, locally-duplicated source of truth for `appealDisputed`.
   - **QuotaExceeded:** dismiss sheet, Snackbar with `nextAvailableAt` formatted
     (`rating_appeal_quota_exceeded`, e.g. "You've reached your appeal limit — try again after {date}").
     Further edits to `reason` can't help until the window resets.
   - **Error:** keep sheet open (don't discard the technician's typed reason), Snackbar
     (`rating_appeal_error_generic`), consumed via the existing `consumeAppealState()`.

---

## 4. i18n

All new strings need both `values/strings.xml` and `values-hi/strings.xml` entries, per this project's
bilingual-by-default convention:

| Key | English |
|---|---|
| `shield_report_trigger` | "Report customer" |
| `shield_report_trigger_desc` (content description) | "Report this customer for abusive or unsafe behaviour" |
| `shield_report_block_warning` | "This will block this customer from future bookings with you." |
| `shield_report_snackbar_success` | "Report submitted." |
| `shield_report_snackbar_error` | "Could not submit report. Try again." |
| `rating_appeal_action` | "Appeal" |
| `rating_appeal_disputed_badge` | "Disputed" |
| `rating_appeal_success` | "Appeal submitted." |
| `rating_appeal_quota_exceeded` | "You've reached your appeal limit — try again after %s." |
| `rating_appeal_error_generic` | "Could not submit appeal. Try again." |

---

## 5. Testing

- Existing 4 Shield/RatingAppeal Paparazzi content tests (`ShieldReportSheetPaparazziTest`,
  `ShieldReportSheetHiPaparazziTest`, `RatingAppealSheetPaparazziTest`, `RatingAppealSheetHiPaparazziTest`)
  don't change shape (only trigger surfaces around them change) — no update needed.
- New Paparazzi coverage: `ActiveJobScreen` `Active` state with the new top bar (default + submitting),
  `RatingItemCard` in both `Appeal`-visible and `Disputed`-badge states. Added `@Ignore`d, recorded via
  `paparazzi-record.yml` CI workflow_dispatch, inspected image-by-image, then un-`@Ignore`d — never
  attempted locally on Windows (`docs/patterns/paparazzi-cross-os-goldens.md`).
- Unit/Compose tests: `RatingItemCard`'s conditional render (`appealDisputed` true/false), the
  `appealSheetFor` local-state wiring, and the Snackbar-consumption paths for all four outcomes
  (`shieldReportSuccess`/`shieldReportError`/`AppealState.QuotaExceeded`/`AppealState.Error`).
  `ActiveJobViewModel`/`MyRatingsViewModel` need no new tests beyond what already covers their existing,
  unchanged state machines.
- **Known risk to watch:** adding a `Snackbar`/`LaunchedEffect` to a previously-static Composable has
  previously dropped `koverVerify` below its 80% floor on this project (Compose recomposition-guard
  branches aren't JVM-testable — see S-33's `PendingActionCard` fix). If it recurs here, apply the
  established fix: extract testable pure logic into its own file, add the Composable's `*Kt` wrapper to
  the Kover exclusion precedent block in `build.gradle.kts`. Do not lower the 80% floor itself.

---

## 6. Explicitly out of scope

- Shield-report trigger only surfaces during `ActiveJobScreen`'s `Active` state; the backend's wider
  `COMPLETED → PAID → CLOSED` eligibility window stays unexposed (no trigger added to `RatingScreen`).
- No changes to `ActiveJobViewModel`/`MyRatingsViewModel` business logic, `FileShieldReportUseCase`,
  `FileRatingAppealUseCase`, `ShieldRepository`, or any backend endpoint — all already correct and
  tested.
- No changes to the existing "Report issue" path on `RatingScreen` (`STANDARD` complaint via
  `ComplaintScreen`) — confirmed as a deliberately separate, lower-severity channel, not touched here.
