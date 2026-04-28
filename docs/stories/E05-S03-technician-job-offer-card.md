# Story E05-S03: Technician-app FCM job offer card with countdown

Status: shipped (PR #29, merged 2026-04-23, commit d162932) — **retroactive docs**

> **Epic:** E05 — Dispatch Engine + Job Offers (`docs/stories/README.md` §E05)
> **Sprint:** S3 (wk 5–6) · **Estimated:** ≤ 1.5 dev-days · **Priority:** P0 (technician value loop)
> **Sub-project:** `technician-app/`
> **Ceremony tier:** Foundation (new module: FCM service + Hilt + Compose overlay + 3 use cases)
> **Plan file:** `plans/E05-S03.md` (retroactively authored — see issue #100)
> **Prerequisites:** E05-S02 (FCM `JOB_OFFER` payload contract + `PATCH .../fcm-token` endpoint)
> **Retroactive note:** PR #29 shipped without `docs/stories/E05-S03-*.md` or its plan file. Both are being added retroactively (issue #100). Acceptance criteria are reverse-engineered from `technician-app/.../HomeservicesFcmService.kt`, `JobOfferEventBus.kt`, `JobOfferViewModel.kt`, `JobOfferScreen.kt`, the three use cases, and `AppNavigation.kt`.

---

## Story

As a **technician using Home Heroo who has just received a dispatched booking**,
I want a full-screen card to wake my phone with the service name, address, slot, distance, earnings, and a 30-second countdown ring (with haptic feedback in the last 5 seconds), plus large Accept (green) and Decline (outline) buttons,
so that **I can decide quickly without scrolling, hit Accept before someone else does, and trust that my decline doesn't quietly count against me** (FR-5.1, FR-4.1, FR-9.1).

---

## Acceptance Criteria

### AC-1 · `HomeservicesFcmService` intercepts `JOB_OFFER` data messages
- `@AndroidEntryPoint` Firebase service registered in `AndroidManifest.xml` with `MESSAGING_EVENT` intent filter
- Field-injected `eventBus: JobOfferEventBus`, `fcmTokenSyncUseCase: FcmTokenSyncUseCase`, `ratingPromptEventBus: RatingPromptEventBus`
- `onMessageReceived(message)` switches on `data["type"]`:
  - `"JOB_OFFER"` → `parseJobOffer(data)` then `eventBus.tryEmit(offer)`
  - `"RATING_PROMPT_TECHNICIAN"` → forward `bookingId` to `ratingPromptEventBus.post(bookingId)` (preserved — added by E07-S01)
- `parseJobOffer` returns `null` on missing required field; catches `Instant.parse` failures silently

### AC-2 · `JobOfferEventBus` (`@Singleton` SharedFlow)
- `MutableSharedFlow<JobOffer>(replay = 0, extraBufferCapacity = 1)` — buffer one offer so a tap-through-to-accept while another offer arrives doesn't drop both
- `tryEmit(offer)` non-blocking; called from FCM service thread

### AC-3 · `JobOfferViewModel` countdown lifecycle
- Initial state `Idle`
- New offer arrives → cancels any prior `countdownJob`, computes initial seconds from `expiresAtMs - currentTimeMillis()`, transitions to `Offering(offer, initialSeconds)`
- Per-second decrement via local `delay(1_000L)` loop (no real-time drift across the 30s window)
- Reaching 0 → `Expired` + `scheduleReset(2_000L)` back to `Idle`
- Receiving an already-expired offer → `Expired` immediately + reset

### AC-4 · Accept button flow
- `accept()` cancels `countdownJob`; calls `acceptUseCase(bookingId)` on `viewModelScope`
- `Accepted(bookingId)` → state transitions; `AppNavigation` `LaunchedEffect(jobOfferState)` navigates to `activeJob/{bookingId}`
- `410` response → `Expired` (someone else won the race)
- Network/other exception → caught and mapped to `Expired` (avoid getting stuck on `Offering`)
- Auto-reset to `Idle` after 2s

### AC-5 · Decline button flow
- `decline()` cancels `countdownJob`; calls `declineUseCase(bookingId)` on `viewModelScope`
- **Always** transitions to `Declined`, even if the API call throws an `IOException` — user intention is the source of truth (FR-9.1 Karnataka invariant)
- Decline-related response code is intentionally ignored — server-side log to `booking_events` is opaque to the UI
- Auto-reset to `Idle` after 2s

### AC-6 · Karnataka FR-9.1 enforcement (Android side)
- `DeclineJobOfferUseCase` returns `Declined` regardless of HTTP outcome (test asserts this for IOException case)
- File-level comment in `DeclineJobOfferUseCase.kt`: declines are logged server-side but never fed to ranking
- No "decline count" / "acceptance rate" / "rejection score" UI element anywhere in the screen
- No analytics event named `*_decline_count` / `*_acceptance_rate`

### AC-7 · `JobOfferScreen` Compose overlay
- `Surface(fillMaxSize, color = MaterialTheme.colorScheme.background)` — covers the entire app while a job is offered
- `Offering` layout (top to bottom): centred 96 dp `CircularProgressIndicator` with `progress = remainingSeconds / 30f`; large `remainingSeconds` text; service name (`headlineSmall`); address (`bodyLarge`); `slotDate slotWindow` (`bodyMedium`); `"%.1f km away"` chip; `"Earnings: ₹{amount/100}"` (`titleLarge primary`); large green Accept (`Color(0xFF2E7D32)`, 56 dp height) + large outline Decline (56 dp height)
- Countdown ring + number turn `MaterialTheme.colorScheme.error` when `remainingSeconds ≤ 5`
- `Accepted | Declined | Expired` → `JobOfferResultContent` centred message + 2s auto-dismiss

### AC-8 · Haptic feedback in last 5 seconds
- `LaunchedEffect(uiState)` — when `Offering` and `remainingSeconds in 1..5`, trigger `VibrationEffect.EFFECT_TICK`
- Guarded: `Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q` (API 29+) AND wrapped in `try/catch` (haptic unavailable on emulator/test)
- Uses `androidx.core.content.getSystemService<Vibrator>()` extension

### AC-9 · `AppNavigation` overlay wiring
- `JobOfferScreen` is overlaid on top of the existing `NavHost` (auth / onboarding / home graphs) when `jobOfferState !is Idle && jobOfferState !is Accepted`
- `Accepted` triggers nav to `activeJob/{bookingId}` (route added later by E06-S01) and dismisses the overlay
- Existing rating-prompt routing (E07-S01) is preserved — both event buses coexist on the same `AppNavigation`

### AC-10 · `FcmTokenSyncUseCase` (login + onNewToken)
- `invoke()` fetches token via `FirebaseMessaging.getInstance().token.await()`, then delegates to `invokeWithFcmToken`
- `invokeWithFcmToken(token)` is the testable seam — unit tests bypass static `FirebaseMessaging` access
- Calls `PATCH /v1/technicians/fcm-token` with Bearer Firebase ID token + `{ fcmToken: <token> }` body
- Best-effort: `IOException` swallowed (token re-syncs on next app open or `onNewToken`)
- Triggered from app startup / login flow AND from `HomeservicesFcmService.onNewToken`

### AC-11 · `JobOfferApiService` Retrofit interface (internal)
- Three suspend functions: `acceptOffer`, `declineOffer`, `syncFcmToken`
- All take `Authorization` header explicitly (no interceptor — keeps `JobOfferModule` interceptor-free)
- `acceptOffer` returns `Response<Unit>` so the use case can read HTTP status (410 detection)
- `declineOffer` returns `Response<Unit>` but the use case ignores the code (FR-9.1)
- `syncFcmToken` body: `FcmTokenRequest(fcmToken: String)` data class

### AC-12 · `JobOfferModule` Hilt DI
- `@Module @InstallIn(SingletonComponent::class) public object`
- Provides `JobOfferApiService` from a Retrofit `Builder` with `MoshiConverterFactory` and an `OkHttpClient` carrying `HttpLoggingInterceptor(BODY)`
- Base URL: `https://homeservices-api.azurewebsites.net/api/`
- No qualifier — this is the technician-app's first auth-required client; `@AuthOkHttpClient` qualifier is introduced by E07-S01b's `RatingModule` and *reused* by E08-S01 onwards

### AC-13 · libs.versions.toml sync (first task)
- `technician-app/gradle/libs.versions.toml` is identical to `customer-app/gradle/libs.versions.toml` after the `firebase-messaging-ktx` line is added
- This is the FIRST commit of the story (CLAUDE.md invariant)

### AC-14 · Test coverage (128 tests in suite)
- `AcceptJobOfferUseCaseTest` — 200/410/500/no-user (4 tests)
- `DeclineJobOfferUseCaseTest` — success/IOException/non-2xx all return `Declined` (3 tests)
- `FcmTokenSyncUseCaseTest` — success/IOException-swallowed (2 tests)
- `JobOfferViewModelTest` — initial Idle, offer arrival, countdown decrement, expiry, accept/decline, already-expired offer (~6 tests)
- `JobOfferScreenPaparazziTest` — 4 `@Ignore`d snapshot stubs (Idle/Offering/Accepted/Expired); recorded on CI Linux only
- Smoke gate: `bash tools/pre-codex-smoke.sh technician-app` exited 0; Kover ≥ 80% with FCM service + DI module excluded

---

## Tasks / Subtasks (as actually shipped)

> Plan file `plans/E05-S03.md` is canonical. Below mirrors the work-stream table in PR #29's body.

| Stream | Commits | Contents |
|--------|---------|----------|
| WS-E init | 1 | libs.versions.toml sync + firebase-messaging-ktx |
| WS-A | 1 | `JobOffer` + `JobOfferResult` domain models |
| WS-B | 3 | FCM service + 3 use cases (TDD red→green→Codex fixes) |
| WS-C | 1 | `JobOfferModule` Hilt DI + Kover exclusions |
| WS-D | 3 | `JobOfferViewModel` + `JobOfferScreen` overlay + Paparazzi stubs (TDD red→green→Codex fixes) |
| Smoke fixes | 7 | Compiler errors, ktlint, nested `runTest`, rebase onto main |

---

## Dev Notes

### Why a `@Singleton` SharedFlow instead of a per-screen Channel
A `@Singleton` `MutableSharedFlow` survives ViewModel recreation. If the technician backgrounds the app while an offer is in-flight, the FCM service still posts to the bus; when the app resumes the (possibly-recreated) `JobOfferViewModel.init` block re-collects from the bus and finds the buffered event. `extraBufferCapacity = 1` is enough because at most one offer can be live (the dispatcher holds a single `DispatchAttemptDoc` per booking) — and a second offer arriving while the first is still showing should kick out the stale one cleanly (the ViewModel cancels its prior `countdownJob`).

### Why the haptic is API 29+ only
`VibrationEffect.EFFECT_TICK` is the right "subtle pulse" the design wants — it's not the heavy `EFFECT_DOUBLE_CLICK` and it's available since Android 10. Pre-API-29 fallback to `vibrator.vibrate(pattern)` would require `VIBRATE` permission and a custom pattern; the design team explicitly accepted "no haptic on Android 9 and below" as a tradeoff. The try/catch additionally guards against emulator devices that report SDK ≥ 29 but have no vibrator service.

### Why `accept()` maps any non-2xx to `Expired`
The Accept call is fire-and-forget from the user's perspective — once they tap the button, the only outcomes that matter are "you got it" (Accepted) or "too late" (Expired). Returning `Error("Server failure")` would leave the user staring at a useless error dialog while the booking goes to someone else; `Expired` is honest about the outcome from the tech's POV. The actual error (5xx, network) is logged via Sentry but not surfaced.

### Why `decline()` ignores the HTTP outcome entirely
Karnataka FR-9.1: a tech who *intends* to decline must be treated as having declined, regardless of whether the API call succeeded. If the network is dead, the UI must NOT say "decline failed, please retry" — that would pressure the tech into accepting a job they didn't want. Instead, the UI flips to `Declined`, shows the confirmation message, and auto-resets to Idle. Server-side reconciliation (the offer expiring naturally after 30s) handles the rare network-fail case from the system's POV.

### Why `accept` uses `getIdToken(false)` and `decline` uses `.orEmpty()`
- Accept call MUST be authenticated — server-side this triggers a Cosmos write that assigns the booking to the tech. `getIdToken(false)` returns a cached token (fast); the use case throws `IllegalStateException` if no user is signed in (won't happen at runtime — the FCM service only fires for logged-in techs).
- Decline call is *advisory* — server records the event but doesn't act on it. Treating the token as best-effort (`orEmpty()`) means a logged-out tech receiving a stale push can still decline cleanly.

### Why `HttpLoggingInterceptor.Level.BODY` in production
Job offer payloads contain no PII (just bookingId, address text, slot times, money in paise). Logging them at BODY level helps debug FCM payload mismatches in the field without needing to ship a debug build. This was a deliberate deviation from the customer-app pattern (which uses `Level.NONE`) — the customer-app handles PII (phone numbers, addresses); the technician-app's FCM payloads do not.

### Why this story does not add a navigation route
The `Accepted` state is the only one that triggers navigation, and it routes to `activeJob/{bookingId}` — a route that *doesn't exist yet* until E06-S01 lands. The `LaunchedEffect` wires up the navigation call now (so the integration is complete on the technician-app side), and E06-S01 adds the destination. If E06-S01 is delayed, the worst case is a navigation no-op; the app does not crash because `composable("activeJob/{bookingId}")` lookup returns null cleanly in NavController.

---

## Definition of Done

- [x] `cd technician-app && ./gradlew assembleDebug ktlintCheck testDebugUnitTest koverVerify` — all green
- [x] Smoke gate exited 0
- [x] `.codex-review-passed` marker shipped in PR #29
- [x] All Codex P1/P2 findings resolved in 7 follow-up commits ("Smoke fixes" stream)
- [x] CI green on `main` after merge (commit d162932)
- [ ] Paparazzi goldens recorded on CI Linux post-merge (manual `paparazzi-record.yml` workflow_dispatch — non-blocking for ship; tests are `@Ignore`d until then)

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per PR #29 commit attribution)

### Completion Notes
PR #29 merged 2026-04-23 19:57 UTC as commit d162932. Six work streams: WS-E init / WS-A / WS-B / WS-C / WS-D / Smoke fixes. The "Smoke fixes" stream covers seven follow-up commits addressing compiler errors, ktlint, nested `runTest` test issues, and a rebase onto main. Karnataka FR-9.1 invariance is enforced both in code (DeclineUseCase always returns Declined) and in test (asserts behaviour under IOException).

### File List
See PR #29: 16 added Kotlin files (FCM service, EventBus, ApiService, Module, 3 use cases, 2 domain models, ViewModel, UiState, Screen, 5 test files), 3 modified (`build.gradle.kts`, `AndroidManifest.xml`, `AppNavigation.kt`, `strings.xml`, `libs.versions.toml`).
