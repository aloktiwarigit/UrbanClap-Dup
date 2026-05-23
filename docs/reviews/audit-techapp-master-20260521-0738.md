# Tech-App Production-Readiness Audit — Master Backlog

**Date:** 2026-05-21 07:38 IST
**Branch under audit:** `release/0.1.6` (versionCode 10 shipped, vc11 / vn 0.1.10 on main)
**App:** `technician-app/` (Kotlin + Compose, Hilt, Firebase, FCM, Truecaller, Paparazzi, Sentry, PostHog, GrowthBook)
**Pilot:** Ayodhya / Uttar Pradesh (Hindi-first, mid-range Android — Redmi 9A / Realme C class)

---

## Status & methodology

This master backlog rolls up 8 specialist Claude lane audits run in parallel
(2026-05-21 07:38 IST batch). Each lane doc was independently authored. Total:
**24 CRIT/P0 + 53 HIGH/P1 findings across 8 lanes**.

> **NOTE (added 2026-05-22):** The 8 per-lane source docs
> (`audit-techapp-{security,i18n,a11y,reliability,perf,arch,release,design}-20260521-0738.md`)
> existed on local disk in the original audit session but were never committed to git and
> were wiped by a parallel session's working-tree clean before they could be persisted.
> This master backlog is the only durable artifact. The per-lane docs can be regenerated
> by re-running the audit dispatch — see `tools/run-audit-codex-challenges.sh` and the
> Wave-by-Wave history below for the dispatch pattern.

**Phase B (Codex cross-model challenges) was DEFERRED** — 8 parallel `codex exec` processes
hung indefinitely on the original machine (likely shell-quoting + parallel-dispatch interaction;
codex CLI itself works fine for sequential prompts). A recovery script is provided at
`tools/run-audit-codex-challenges.sh` to run them sequentially in a fresh session.

---

## Ship verdict (as of 2026-05-21)

> **BLOCK pilot launch** until the 12 CRIT items below are closed.
> Estimated effort to clear blockers: **2.5–3.5 engineering days** (Sonnet-tier work, no
> design-direction approvals needed for ≥9 of them).

Without these fixes:
- All pilot crashes will be anonymous (no per-technician attribution in Crashlytics/Sentry)
- Language switching will silently revert to English on most pilot devices (per-app language picker won't enumerate supported locales)
- Partner availability toggle silently discards changes (data-integrity defect — visible to support)
- PAN can leak in plaintext to the client during the API migration window
- KYC photo uploads will be denied by Firebase Storage rules (path/rule mismatch)
- Play Console will reject the submission (no privacy policy URL, no account-deletion flow)
- Multiple screens render visually blank during loading (invisible spinner on cream background)

---

## Ship-blocker queue (CRIT)

Sorted by **effort ascending** so a single engineer can knock these out in one focused session.

| # | ID | Title | Effort | Lane | Story |
|---|---|---|---|---|---|
| 1 | L-001 | Commit `locale_config.xml` (atomic with manifest diff) | 5 min | i18n / release | E20-S01 |
| 2 | R-001 | Add `Crashlytics.setUserId(uid)` in `SessionManager.saveSession`/`clearSession` | 15 min | reliability | E20-S02 |
| 3 | R-002 | Add `Sentry.setUser(User(id=uid))` in same commit as R-001 | 10 min | reliability | E20-S02 |
| 4 | Arch-P0-1 | Add `<uses-permission android:name="android.permission.VIBRATE"/>` to manifest | 5 min | architecture | E20-S03 |
| 5 | S-003 | Add `android:permission="android.permission.RECEIVE_BOOT_COMPLETED"` to BootReceiver | 5 min | security | E20-S03 |
| 6 | S-008 | Align `PanOcrUseCase` path `technicians/{uid}/pan_*.jpg` → `kyc/{uid}/pan_*.jpg` (or add storage rule) | 30 min + smoke test | security | E20-S04 |
| 7 | P1-3 | Hoist `AvailabilityCard` `remember` to `AvailabilityViewModel` write-through | 1 h | performance | E20-S05 |
| 8 | L-002 | Read locale synchronously in `Application.onCreate` before first Compose frame (eliminate DataStore race) | 2 h | i18n | E20-S06 |
| 9 | Lane7-C1 | Author & host privacy policy URL covering full PII inventory | 3 h (mostly copy authoring) | release | E20-S07 |
| 10 | Lane7-C2 | Account-deletion flow (in-app settings entry + web form + server soft-delete) | 1–1.5 days (cross-stack) | release | E20-S08 (joint with API) |
| 11 | S-001 | Remove `?? kyc.panNumber` plaintext fallback in `get-kyc-status.ts:34` + Cosmos backfill | 4 h (api + backfill) | security (API) | E20-S09 |
| 12 | D-001 | Loading spinner polish — replace 2-px dot with 64dp branded indicator + status text across 6 affected loading states | 1 day (UI/design lane) | design | E21-S01 (carries into pre-pilot if D-002 deferred) |

**Sub-total: ~3 engineering days** for items 1–11 (item 12 is design-tier; ship can proceed
with a stop-gap if D-001 visual polish is bumped to fast-follow).

---

## Wave-by-Wave shipping history (2026-05-21 → 2026-05-22)

| Wave | PR | Closed | Notes |
|---|---|---|---|
| 1 | #252 | L-001, R-001, R-002, Arch-P0-1, S-003 | 5 quick fixes batched |
| 2 | #253 | S-008, P1-3, L-002 | Storage path + AvailabilityCard hoist + locale race; added `docs/patterns/compose-locale-init-sync.md` |
| 3 | #256 | D-001 (stopgap), D-006, Lane7-C1 | Loading spinner sizing, KYC bg fix, privacy policy MD + Pages workflow. Required Wave-3.5 follow-up to re-record 8 deleted Paparazzi goldens. |
| 3.5 | #264 | (paparazzi recovery) | Re-recorded 8 loading-state goldens via `paparazzi-record.yml` (gradle_root=technician-app) |
| 4 | #262 | S-001 | API plaintext-fallback fix + Cosmos backfill script + Android defensive guard |
| 5 (pending) | — | Lane7-C2 | Account deletion — Foundation-tier story; API endpoint already exists per PR #257 |

**Remaining open from master:** only **Lane7-C2** (account deletion).

**Post-merge actions still required:**
- Run `npx ts-node api/scripts/backfill-pan-mask.ts --apply` (after dry-run review) before pilot launch
- After Lane7-C2 lands, fill Play Console Data Safety form's "Data deletion" section with both URLs

---

## Pre-pilot must-fix (HIGH) — grouped into E20-S10 through E20-S18

These were the recommended HIGH-priority stories at audit time. Most have been folded into
Waves 1–4 or are part of the Wave 5 account-deletion ceremony. The remaining HIGH items below
are tracked for follow-up after the last CRIT lands.

### E20-S10 — Auth field state preservation + Compose lifecycle hardening
- **R-006** Convert `AuthScreen` phone + OTP `remember` → `rememberSaveable` (rotation loses typed values)
- **Arch-P0-2** Replace 6 `collectAsState()` calls in `RatingScreen.kt:43-48` with `collectAsStateWithLifecycle()`
- **R-006** Same fix for `ShieldReportSheet.description`, `RatingAppealSheet.reason`, `PhotoCaptureScreen.capturedPath` (when non-null)

### E20-S11 — Hardcoded English literals + locale propagation
- **L-003** Extract all 62 hardcoded English string literals to `values/strings.xml` + `values-hi/strings.xml`
- **L-004** Convert notification channel names to `R.string.channel_name_*` and re-register channels after locale change
- **L-005** Move `ActiveJobForegroundService.setContentTitle("काम जारी है")` etc. to string resources
- **L-006** Replace `"₹%,.0f".format(...)` with `NumberFormat.getCurrencyInstance(Locale("hi","IN"))`
- **L-008** Convert `earnings_jobs_count` to `<plurals>` resource
- **L-009** FCM notification builder strings → `applicationContext.getString(R.string.fcm_*)` with format args
- **L-010** `PayoutCadenceScreen.CADENCE_OPTIONS` → composable + string resources
- **F-001** `HsPriceText` `"Rs ${pricePaise/100}"` → `"₹${pricePaise/100}"`

### E20-S12 — Accessibility minimum viable (TalkBack + WCAG AA gap)
- **A-001** Add `Modifier.semantics{ liveRegion = Polite }` to retry banners, error states, status cards
- **A-002** Star rating: replace `Text.clickable` with `IconButton(Modifier.size(44.dp))`
- **A-003** Add `stateDescription` to availability switch
- **A-004** Wrap job-offer countdown in `semantics{ liveRegion = Assertive }` with gated announcement at 30/20/10/5/3/2/1
- **A-005** Add `liveRegion = Polite` to `PhotoUploadRetryBanner` (both files)
- **A-006** Wrap `PhotoCaptureScreen` `Box` with semantic description + `clearAndSetSemantics{}` on AndroidView
- **A-007** `Modifier.clickable(role = Role.Button, onClickLabel = "Open $title")` on DashboardNavRow
- **A-008** Replace `SuggestionChip(onClick = {})` with `AssistChip(onClick = null)` in `MyRatingsScreen`
- **A-009** `StatusStepper` semantic grouping per step
- **A-013** Map `KycStatus.name` enum to `stringResource(R.string.kyc_status_*)`
- **A-016** Add `label = { Text(stringResource(...)) }` to `RatingAppealSheet` + `ShieldReportSheet` text fields
- **Contrast** Change inactive `StatusPill` text color from `secondary` (#B68A2C on #F2E7CF = 2.57:1) to `onBackground` (8.5:1)
- **Contrast** Darken `onSurfaceVariant` from `#5F6C66` to `#4A5550` to clear AA for `labelSmall`

### E20-S13 — Observability funnel coverage (PostHog)
- **R-003** Wire 6 highest-priority PostHog funnel events:
  1. `otp_verified` (`AuthViewModel.handleFirebaseAuthResult`)
  2. `signup_completed` (`SaveSessionUseCase.saveAnonymousWithPhone`)
  3. `job_offer_received` (`HomeservicesFcmService.handleMessageData` for `JOB_OFFER`)
  4. `job_offer_accepted` (`AcceptJobOfferUseCase`)
  5. `job_started` (`StartWorkUseCase`)
  6. `job_completed` (`CompleteJobUseCase`)
- Create `AnalyticsTracker` singleton wrapping `PostHog.capture(...)` with null-safety
- **R-010** Add `Crashlytics.recordException(...)` calls in: `AuthOrchestrator` catch blocks, `OutboxSyncWorker.doWork()` permanent-failure path, `FcmTokenSyncUseCase` failure path, `FirebaseStorageUploader` upload failure

### E20-S14 — FCM rotation + outbox reliability
- **R-004** `HomeservicesFcmService.onNewToken` → enqueue `OneTimeWorkRequest<FcmTokenRegisterWorker>` with `NetworkType.CONNECTED` + exponential backoff
- **R-005** `OutboxSyncWorker` enqueue: add `Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED)` + `BackoffPolicy.EXPONENTIAL`; on permanent failure, `recordException` and surface a snackbar signal
- **R-009** Add `CoroutineExceptionHandler` to all foreground service scopes
- **R-011** Wrap `EncryptedSharedPreferences.create(...)` in `withContext(Dispatchers.IO)` inside `provideAuthPrefs` (ANR risk on cold start)
- **R-015** Add explicit `ActiveJobForegroundService.stop(context)` call when state observed as `COMPLETED`

### E20-S15 — Performance baseline + image hot-path
- **P1-1 / P1-2** Convert `tech_field_ac_service.png` (1.8MB) → WebP (~50KB), move out of `drawable-nodpi`, integrate Coil (`AsyncImage`)
- **P1-4** Generate Baseline Profile via Play Console (free, 1–2 day delay) OR via Macrobenchmark module locally
- **P1-5** Add `android.enableR8.fullMode=true` to `gradle.properties`
- **P2-1** Add `key = { it.id }` to `MyRatingsScreen` `items()` call
- **P2-2** Add `.setMinUpdateIntervalMillis(LOCATION_UPDATE_INTERVAL_MS)` to LocationRequest builder
- **P2-4** Move `SentryInitializer.init()` + `PostHogInitializer.init()` off the main thread

### E20-S16 — Release pipeline + Play Console preflight
- **Lane7-H1** Fix `values/strings.xml` app_name from "homeservices technician" → "HomeHeroo Technician"
- **Lane7-H2** Add Sentry Gradle plugin to upload R8 mappings (`io.sentry.android.gradle`)
- **Lane7-H3** Extend `technician-ship.yml` triggers to include `release/**` branches
- **Lane7-H4** Add `bundleRelease` step + `actions/upload-artifact` for signed AAB
- **Lane7-H5** Document keystore backup procedure in `docs/runbook.md`
- **Lane7-H6** Verify Play App Signing enrollment status; opt-in on first upload
- **MED items** `resConfigs("en", "hi")` in defaultConfig; explicit `isDebuggable = false`; fill Data Safety form; complete IARC content rating; enable Pre-launch Report

### E20-S17 — Security hardening (HIGH/MED)
- **S-002** Add `-assumenosideeffects class android.util.Log { ... }` to `proguard-rules.pro`; replace remaining `Log.e` exception captures with `Sentry.captureException`
- **S-004** Migrate `homeservices://action/*` deep-links to `https://` App Links with `autoVerify="true"` + Digital Asset Link
- **S-005** Detect `FirebaseAuthInvalidUserException` in `IdTokenCache.freshToken()` and call `sessionManager.clearSession()`
- **S-006** Encrypt `fcm_topic_state` SharedPreferences
- **S-007** Add `Sentry.captureException(initEx)` in `TruecallerLoginUseCase` catch block
- **S-010** Restrict Maps API key in GCP Console by package + SHA-1
- **S-011** Export Firestore rules to `firebase/firestore.rules`, add to VCS + CI deploy
- **S-012** Add `<exclude domain="database" path="active_job_database"/>` + `pending_actions_database` to `data_extraction_rules.xml`

### E20-S18 — Architecture P0 + P1 cleanup
- **Arch-P0-3** Replace `runBlocking` with `runTest` in `ActiveJobApiServicePostLocationTest.kt:65,111`
- **Arch-P1** Remove Razorpay ProGuard keep block (incl. `JavascriptInterface` global retention — security risk)
- **Arch-P1** Replace wildcard `*ApiService` keep with 13 explicit interface names
- **Arch-P1** Remove `else -> Unit` on sealed `when` in `KycScreen.kt:71` + `PayoutCadenceScreen.kt:70`
- **Arch-P1** Fix `AcceptJobOfferUseCase.kt:20` `throw RuntimeException(...)` → typed sealed error
- **Arch-P1** Change 6 ApiService interfaces from `public` to `internal`
- **Arch-P1** Add minimal instrumented test suite (6 test files: cold-start, FCM, deep-link, permission, foreground service, locale switch)
- **Arch-P3** Detekt: relax `FunctionMaxLength` for `*Test.kt`, raise `maxLineLength` to 140

---

## Post-pilot polish (MED / LOW) — bundle as E21

### E21-S01 — Loading state polish (cross-cutting)
- **D-001** Replace invisible spinner with 64dp branded indicator + status text (Wave 3 was a stopgap; full design remains)
- **D-006** Fix KYC loading screen hardcoded white background (shipped in Wave 3)
- **F-007** Add shimmer animation to `HsSkeletonBlock`
- **F-004** Add `autofillHints = listOf(AutofillType.SmsOtpCode)` to OTP TextField
- **F-003** Rename "Pay" bottom-nav tab → "Earnings" / "Earned"

### E21-S02 — Active Job screen redesign (CRITICAL design debt)
- **D-002** Add static map strip card (Google Maps Static API; ₹0 under $200 credit)
- Distance + ETA row, step indicator with connected horizontal stepper (pulsing ring on current)
- Contact-customer shortcut button
- "What to do at this stage" contextual help collapsible
- Hindi step labels: +4dp vertical padding for Devanagari

### E21-S03 — Terminal/empty state polish
- **D-003** Job-offer expired: illustration, headline, body explainer, "Back to home" button
- **D-004** Earnings error: same pattern; offer "View offline data" if cached

### E21-S04 — KYC completion + upload affordance
- **D-005** Replace raw `KycStatus.name` enum with localized status chip
- Celebration moment, explainer, "Go to home" CTA, "What happens next?" FAQ
- KYC step 2: dashed-border upload zone with thumbnail preview + "Retake"
- Complaint screen: same dashed-border attach pattern

### E21-S05 — Foreground service notification redesign
- **D-007** Custom monochrome icons (replace `android.R.drawable.ic_menu_*`)
- `setColor(brandPrimary)`, LargeIcon, BigTextStyle, action buttons, all strings via R.string

### E21-S06 — Motion choreography
- Job-offer arrival, last-5s color animation, availability toggle, stage transitions, KYC step advance, earnings chart bars, pull-to-refresh
- Respect `LocalInspectionMode` (Paparazzi-safe) and reduced-motion accessibility

### E21-S07 — Dark mode wiring + token cleanup
- Wire `HomeservicesTheme` to `isSystemInDarkTheme()` in `MainActivity`
- Add `warningContainer` / `onWarningContainer` extended tokens for dark mode
- Replace hardcoded `Color.White` references with token references
- Change XML theme parent to `Theme.Material3.DayNight.NoActionBar`

### E21-S08 — Architecture sprint 2 (tech debt cleanup)
- 60+ Detekt `FunctionMaxLength` test suppressions — adopt `@Nested` groupings
- 7 `TooGenericExceptionCaught` refactors; 10 `SwallowedException` → sealed domain error mapping
- 13 `LongMethod` Compose extractions; 42 `MagicNumber` extractions
- LeakCanary + StrictMode (debug-only)
- Merge `LocaleModule` + `LocaleBindings`; split `AuthModule` into Auth + Device
- Kover branch coverage 55% → 69%: ~15 unit tests across `AuthOrchestrator`, `KycOrchestrator`, `AcceptJobOfferUseCase`
- Migrate `SessionManagerTest` from JUnit 4 to JUnit 5

### Post-pilot security follow-ups
- S-009 TLS certificate pinning (GA only)
- F-002 ISO date format → `1 May, 10:00 AM` localized
- F-005, F-006 Add Y-axis labels + bar value annotations to charts
- Icon style audit: standardize bullet style across components
- Bottom-nav `Icons.Default.Tune` for "Slots" → `Icons.Default.CalendarMonth`

---

## Cross-finding cross-references (would be flagged by the deferred Codex synthesis)

- **L-001 (locale_config untracked)** confirmed CRIT by Lane 7 AAB extraction; same untracked file exists in customer-app
- **R-007 (hardcoded Hindi in FCM/foreground notifications)** is the same root cause as **L-005** + **L-009** — fix once
- **A-001 (zero `semantics{}`) + R-006 (`remember` not `rememberSaveable`) + Arch-P0-2 (`collectAsState` not lifecycle-aware)** are three flavors of Compose discipline gap
- **D-007 (foreground notification design) + L-004 (channel names English) + L-005 (notification body hardcoded)** combine into a unified notification-redesign story (E21-S05)
- **R-001 (Crashlytics setUserId) + R-002 (Sentry.setUser)** must ship in the same commit on `SessionManager` (E20-S02)
- **P1-3 (AvailabilityCard data loss) + A-003 (no stateDescription)** both touch the same Switch — fix together
- **S-001 (PAN fallback) + S-008 (storage path)** are both KYC-flow API/contract issues

---

## Pattern library references

| Story area | Pattern files to read |
|---|---|
| E20-S02 (user attribution) | `firebase-callbackflow-lifecycle.md`, `firebase-errorcode-mapping.md` |
| E20-S06 (locale race), E20-S11 (i18n catalog) | `compose-locale-init-sync.md` (created during Wave 2) |
| E20-S14 (FCM/outbox) | `firebase-callbackflow-lifecycle.md`, `firebase-errorcode-mapping.md` |
| E20-S17 (Hilt-touching parts) | `hilt-module-android-test-scope.md` |
| E20-S18 (arch P0/P1) | `kotlin-explicit-api-public-modifier.md`, `paparazzi-cross-os-goldens.md` |
| All E21 design stories | invoke `frontend-design:frontend-design` skill BEFORE writing UI code |

---

## Codex Challenge Recovery — script location

Phase B (cross-model Codex challenges per lane) was deferred because 8 parallel `codex exec`
processes hung indefinitely. Codex CLI itself works fine for sequential prompts.

Helper script at `tools/run-audit-codex-challenges.sh` runs them sequentially. **CAVEAT:**
The script expects the per-lane source docs at `docs/reviews/audit-techapp-<lane>-20260521-0738.md`,
which were lost (see status note at top of this doc). To use the script meaningfully, the audit
would need to be re-run first to regenerate the per-lane docs.

---

## Appendix — original finding count by lane

| Lane | CRIT | HIGH | MED | LOW | Total |
|---|---|---|---|---|---|
| Security & Privacy | 1 | 3 | 4 | 4 | 12 |
| i18n & Localization | 2 | 4 | 4 | 3 | 13 |
| Accessibility | 0 | 9 | 8 | 6 | 23 |
| Reliability & Observability | 2 | 3 | 6 | 4 | 15 (+ 3 positive findings) |
| Performance & Battery | 5 P1 | 8 P2 | 6 P3 | — | 19 |
| Architecture & Code Quality | 3 P0 | 5 P1 | 4 P2 | 4 P3 | 16 |
| Build, Release & Play Console | 3 | 6 | 9 | 4 | 22 |
| UI/UX Design Quality | 2 D | 5 D/F | 7 D/F | — | 14 + design-system gaps |
| **Total** | **18** | **43** | **48** | **25** | **134** |

(CRIT includes P0/P1 from Performance & Architecture lanes which use their own severity tag.)

---

*Original audit produced 2026-05-21 by 8 parallel Claude Sonnet 4.6 specialist lane agents +
Opus 4.7 synthesis. Per-lane source docs subsequently lost (working-tree wipe). This
reconstructed master backlog committed 2026-05-22 as the single durable artifact.*
