# Story E02-S01: Customer app OTP login — Truecaller + Firebase Phone Auth + persistent session

Status: shipped (PR #9, merged 2026-04-19, commit `0960e88`) — **retroactive docs**

> **Epic:** E02 — Authentication & Onboarding (`docs/stories/README.md` §E02)
> **Sprint:** S1 (wk 1–2) · **Estimated:** ≤ 1 dev-day · **Priority:** **P0 — blocks E03/E04/E06/E07**
> **Sub-project:** `customer-app/`
> **Ceremony tier:** Foundation (auth/security-sensitive — domain + data + DI + UI all touched in one story; reusable BiometricGateUseCase consumed by every subsequent customer-side sensitive action)
> **FR reference:** FR-1.1
> **Retroactive note:** This story file is being written *after* the implementation merged. PR #9 shipped without `docs/stories/E02-S01-*.md` ever landing in main; the implementation `plans/E02-S01.md` and the brainstorm spec `docs/superpowers/specs/2026-04-19-e02-s01-auth-design.md` did land. Acceptance criteria below are reverse-engineered from the merged code under `customer-app/app/src/main/kotlin/com/homeservices/customer/{domain,data,ui,navigation}/auth/**` and the test files under `customer-app/app/src/test/kotlin/...`.

---

## Story

As a **customer opening the homeservices app for the first time** (or returning after the 180-day session window),
I want a one-tap Truecaller login (when the SDK is available on my device) with a clean fallback to Firebase Phone Auth OTP, plus a hidden re-auth checkpoint backed by my device biometric for sensitive actions later in the journey,
so that **I can start booking services in seconds without a username/password, my session persists across app launches for ~6 months, and the app's future payment + dispute flows have a reusable hardware-backed authentication primitive** (FR-1.1; NFR-S-1..S-3, NFR-S-10).

---

## Acceptance Criteria

### AC-1 · Truecaller-first auth path
- **Given** the customer launches the app and Truecaller SDK is initialized successfully on the device
- **When** `AuthOrchestrator.start()` is called
- **Then** it returns `AuthFlowDecision.TruecallerLaunched` and `TruecallerLoginUseCase` triggers the SDK consent screen
- **And** on `onSuccessProfileShared`, `TruecallerAuthResult.Success` is emitted via the SharedFlow (replay=1, so late subscribers in tests catch it)
- **And** `SaveSessionUseCase.saveAnonymousWithPhone(phone)` signs in to Firebase anonymously and persists the session
- **And** `SessionManager.authState` flips to `AuthState.Authenticated`

### AC-2 · Firebase Phone Auth OTP fallback path
- **Given** Truecaller SDK is unavailable (`isAvailable() == false`) OR the user explicitly cancels Truecaller (`onVerificationRequired`)
- **When** the orchestrator falls through
- **Then** `AuthScreen` shows the phone-entry UI
- **And** `FirebaseOtpUseCase.sendOtp(phoneNumber)` returns a `Flow<OtpSendResult>` with `CodeSent(verificationId)` or `AutoVerified(credential)` from `PhoneAuthProvider.verifyPhoneNumber`
- **And** the `awaitClose {}` block in the `callbackFlow` carries a non-empty comment matching `docs/patterns/firebase-callbackflow-lifecycle.md` (no leak on cancellation)
- **And** error mapping uses `FirebaseAuthException.errorCode` strings — never `message.contains(...)` — per `docs/patterns/firebase-errorcode-mapping.md`:
  - `ERROR_INVALID_VERIFICATION_CODE` → `OtpSendResult.WrongCode`
  - `ERROR_SESSION_EXPIRED` / `ERROR_INVALID_VERIFICATION_ID` → `CodeExpired`
  - `ERROR_TOO_MANY_REQUESTS` → `RateLimited`
  - any other code → `General`

### AC-3 · 180-day persistent session in EncryptedSharedPreferences
- **Given** a successful auth (Truecaller or OTP)
- **When** `SaveSessionUseCase.save(...)` runs
- **Then** `SessionManager` writes the session to `EncryptedSharedPreferences` (file `auth_session`, AES256-GCM value scheme + AES256-SIV key scheme via `MasterKeys.AES256_GCM_SPEC`)
- **And** `SessionManager.authState` is a `StateFlow<AuthState>` exposing `Authenticated` until 180 days elapse OR `clearSession()` is called
- **And** after 180 days the state flips to `Unauthenticated` on next app launch (TTL check at read time)

### AC-4 · BiometricGateUseCase is reusable + survives lockout / hardware-absent
- **Given** any future story needs hardware-backed re-auth
- **Then** `BiometricGateUseCase` exposes:
  - `canUseBiometric(): Boolean` — returns false on devices without biometric hardware
  - `suspend fun requestAuth(activity: FragmentActivity, title, subtitle): BiometricResult`
- **And** error mapping covers: `ERROR_LOCKOUT_PERMANENT` → `BiometricResult.Lockout`; `ERROR_HW_NOT_PRESENT` → `HardwareAbsent`; user cancel → `Cancelled`; success → `Authenticated`
- **And** `MainActivity` extends `FragmentActivity` (BiometricPrompt + Truecaller `onActivityResult` both require it)

### AC-5 · AuthOrchestrator sequences Truecaller → OTP fallback with thin delegation
- **Given** the orchestrator's collaborators (`TruecallerLoginUseCase`, `FirebaseOtpUseCase`, `BiometricGateUseCase`, `SaveSessionUseCase`)
- **Then** `start()` returns `TruecallerLaunched` if Truecaller is available, else `FallbackToOtp`
- **And** `observeTruecallerResults()` delegates to `truecallerUseCase.resultFlow`
- **And** `completeWithTruecaller(phone)` delegates to `saveSessionUseCase.saveAnonymousWithPhone(phone)`
- **And** the orchestrator carries no policy decisions — those live in the ViewModel

### AC-6 · `AuthViewModel` maps to UI state with resend safety
- **Given** the auth screen is open
- **When** the user taps "Resend code"
- **Then** `AuthViewModel` cancels the previous `Job` before launching a new `sendOtp()` (no two callbacks racing — per `docs/patterns/firebase-callbackflow-lifecycle.md`)
- **And** the UI state machine handles: `TruecallerLoading`, `OtpEntry(verificationId, retriesLeft)`, `OtpSending`, `OtpVerifying`, `Error(message, retriesLeft)`, `Authenticated` (drives `AppNavigation` transition)
- **And** wrong-code attempts decrement `retriesLeft` from 3 → 2 → 1 → 0; on 0 the UI surfaces `Error(retriesLeft=0)` and disables retry

### AC-7 · `AppNavigation` reactively swaps between auth and main graphs
- **Given** `SessionManager.authState` is the `StateFlow<AuthState>` source of truth
- **When** `AppNavigation` collects the state via `LaunchedEffect(authState)`
- **Then** `AuthState.Unauthenticated` → `navController.navigate("auth")` (clearing back-stack)
- **And** `AuthState.Authenticated` → `navController.navigate("home")` (placeholder `HomeScreen` until later epics)

### AC-8 · Compose UI is fully tested + Paparazzi-snapshot
- **Given** the `AuthScreen` composable
- **Then** Paparazzi golden snapshots cover: idle, phone entry (light + dark), OTP code entry (light), OTP sending (light), OTP verifying (light), error 1-retry (light), error 0-retries (light), error (dark), Truecaller loading (light + dark)
- **And** `AuthViewModelTest` covers the full state-machine via JUnit 5 + MockK + `UnconfinedTestDispatcher` (374 lines)
- **And** `AuthScreenPaparazziTest` (216 lines) renders all states with `RenderingMode.SHRINK`
- **And** explicit-API mode is satisfied — every public symbol has explicit `public` modifier (`-Xexplicit-api=strict` per `docs/patterns/kotlin-explicit-api-public-modifier.md`)

### AC-9 · Pattern documents land alongside the implementation
- **Given** the recurring gotchas discovered while building this story
- **Then** the following pattern files are committed under `docs/patterns/`:
  - `firebase-callbackflow-lifecycle.md` (94 lines) — `awaitClose` non-empty + cancel-previous-job rule
  - `firebase-errorcode-mapping.md` (81 lines) — `errorCode` strings, never `message.contains()`
  - `hilt-module-android-test-scope.md` (94 lines) — JVM unit tests use manual construction; Robolectric for `SessionManager`; `@HiltAndroidTest` only for instrumented
  - `kotlin-explicit-api-public-modifier.md` (65 lines) — every public symbol carries explicit `public` under `-Xexplicit-api=strict`
  - `paparazzi-cross-os-goldens.md` (50 lines) — never record on Windows; `paparazzi-record.yml` workflow_dispatch on Linux CI

### AC-10 · Pre-Codex smoke gate scripts land for repeat use
- **Given** future Foundation-tier Android stories
- **Then** the following scripts ship at repo root:
  - `tools/pre-codex-smoke.sh` (27 lines) — Android per-app smoke (ktlint + detekt + assembleDebug + testDebugUnitTest + lintDebug)
  - `tools/pre-codex-smoke-api.sh` (22 lines)
  - `tools/pre-codex-smoke-web.sh` (22 lines)

---

## Tasks / Subtasks (as actually shipped)

> Implementation merged via PR #9 across ~25 commits (TDD red/green cadence). Final file list in PR.

- [x] **T1 — Build config + dependencies**
  - [x] `gradle/libs.versions.toml` — Firebase BOM 33.9.0, Truecaller SDK 3.2.1 (3.0.3 not on Maven Central; latest stable used), security-crypto 1.0.0, biometric 1.1.0 (alpha05 dropped — resolution issues), navigation-compose 2.8.9, coroutines-test 1.8.1, google-services 4.4.2
  - [x] root `build.gradle.kts` — declare `google-services` plugin
  - [x] `app/build.gradle.kts` — apply `google-services`; add Firebase BOM + auth-ktx + Truecaller + security-crypto + biometric + navigation-compose + coroutines-test
  - [x] `app/google-services.json` — stub placeholder (no real credentials); `.gitignore` exception added
  - [x] `AndroidManifest.xml` — Truecaller `<queries>` block
  - [x] `proguard-rules.pro` — Truecaller + Firebase Auth keep rules
  - [x] `technician-app/gradle/libs.versions.toml` — synced (parity for E02-S02)

- [x] **T2 — Domain models (sealed classes)**
  - [x] `domain/auth/model/AuthResult.kt` — `Success`/`Error` sealed hierarchy
  - [x] `domain/auth/model/AuthState.kt` — `Authenticated`/`Unauthenticated` (public for `SessionManager` exposure)
  - [x] `domain/auth/model/BiometricResult.kt` — `Authenticated`/`Cancelled`/`Lockout`/`HardwareAbsent`
  - [x] `domain/auth/model/OtpSendResult.kt` — `CodeSent`/`AutoVerified`/`WrongCode`/`CodeExpired`/`RateLimited`/`General`
  - [x] `domain/auth/model/TruecallerAuthResult.kt` — `Success`/`Failure`/`Cancelled`
  - [x] `ui/auth/AuthUiState.kt` — sealed UI state for the screen

- [x] **T3 — `SessionManager` (TDD)**
  - [x] RED: `data/auth/SessionManagerTest.kt` (117 lines) — Robolectric; real `SharedPreferences` via `ApplicationProvider`
  - [x] GREEN: `data/auth/SessionManager.kt` — Hilt singleton; `StateFlow<AuthState>`; `EncryptedSharedPreferences` (file `auth_session`); 180-day TTL
  - [x] `data/auth/di/AuthPrefs.kt` — Hilt qualifier
  - [x] `data/auth/di/AuthModule.kt` — `@Binds`/`@Provides` for FirebaseAuth + EncryptedSharedPreferences

- [x] **T4 — Use cases (TDD, parallel fan-out)**
  - [x] RED: `TruecallerLoginUseCaseTest.kt` (63) → GREEN: `TruecallerLoginUseCase.kt` — legacy package wrapper; `SharedFlow` (replay=1)
  - [x] RED: `FirebaseOtpUseCaseTest.kt` (156) → GREEN: `FirebaseOtpUseCase.kt` — `callbackFlow`; injected `Executor` (defaults inline) to bypass Android Handler in tests; `errorCode`-based mapping
  - [x] RED: `BiometricGateUseCaseTest.kt` (63) → GREEN: `BiometricGateUseCase.kt` — wraps `BiometricPrompt`; `canUseBiometric()` + `requestAuth()`
  - [x] RED: `SaveSessionUseCaseTest.kt` (77) → GREEN: `SaveSessionUseCase.kt` — bridges `FirebaseUser`/phone → `SessionManager.saveSession()`; handles null user → `AuthResult.Error.General`
  - [x] RED: `AuthOrchestratorTest.kt` (128) → GREEN: `AuthOrchestrator.kt` — sequences Truecaller → OTP fallback

- [x] **T5 — UI + ViewModel (TDD)**
  - [x] RED: `AuthViewModelTest.kt` (374) → GREEN: `ui/auth/AuthViewModel.kt` (163) — `@HiltViewModel`; resend cancels previous job; retries decrement
  - [x] GREEN: `ui/auth/AuthScreen.kt` (234) — Truecaller loading / phone entry / OTP entry / verifying / error states; explicit `public` symbols
  - [x] GREEN: `ui/home/HomeScreen.kt` (28) — placeholder authenticated destination
  - [x] RED + GREEN: `ui/auth/AuthScreenPaparazziTest.kt` (216) — 13 golden snapshots across light + dark themes
  - [x] Smoke goldens for `SmokeScreen` updated (light + dark) since theme references shifted

- [x] **T6 — Navigation**
  - [x] `navigation/AppNavigation.kt` (46) — `NavHost` + `LaunchedEffect(authState)` reactive swap
  - [x] `navigation/AuthGraph.kt` (39) — `auth_screen` composable
  - [x] `navigation/MainGraph.kt` (14) — `home` composable
  - [x] `MainActivity.kt` — extends `FragmentActivity`; injects `SessionManager`; `setContent { AppNavigation(...) }`; `onActivityResult` forwards to `TruecallerSDK`

- [x] **T7 — Pattern documents extracted**
  - [x] `docs/patterns/firebase-callbackflow-lifecycle.md` (94)
  - [x] `docs/patterns/firebase-errorcode-mapping.md` (81)
  - [x] `docs/patterns/hilt-module-android-test-scope.md` (94)
  - [x] `docs/patterns/kotlin-explicit-api-public-modifier.md` (65)
  - [x] `docs/patterns/paparazzi-cross-os-goldens.md` (50)

- [x] **T8 — Repo-level scripts + Codex review**
  - [x] `tools/pre-codex-smoke.sh` + `tools/pre-codex-smoke-api.sh` + `tools/pre-codex-smoke-web.sh`
  - [x] Codex review (`docs/reviews/codex-pr-E02-S01.md`, 4538 lines) — findings resolved before merge
  - [x] `customer-app/detekt.yml` — 8-line addition for explicit-API rule

---

## Dev Notes

### What was actually shipped (per PR #9 file list)

69 files changed, 7,605 insertions across `customer-app/app/src/main/kotlin/com/homeservices/customer/{domain,data,ui,navigation}/auth/**`, matching test files, Paparazzi PNGs, the 5 pattern documents, the 3 pre-Codex smoke scripts, the Codex review log, and `technician-app/gradle/libs.versions.toml` (synced for E02-S02).

### Why some plan-stated versions were nudged

| Plan dep | Plan version | Shipped version | Reason |
|---|---|---|---|
| Truecaller SDK | 3.0.3 | 3.2.1 | 3.0.3 not published to Maven Central; latest stable used |
| androidx.biometric | 1.2.0-alpha05 | 1.1.0 | alpha05 had dependency-resolution issues; stable 1.1.0 sufficient for the feature surface used |

These deviations were captured in commit messages on PR #9 and posed no functional difference to the AC list.

### Why this story is being written retroactively

The 2026-04-26 audit (`docs/audit/story-completeness-2026-04-26.md`) found that PR #9 landed `plans/E02-S01.md` and the brainstorm spec but never committed the `docs/stories/E02-S01-*.md` companion. This file closes the gap. The implementation, tests, and pattern documents in main are the authoritative truth.

### Patterns established (locked in for every future Android story)

| Pattern | Where | Rule |
|---|---|---|
| Sealed-class result types | `domain/auth/model/*` | Every use case returns a sealed class — never throws |
| `EncryptedSharedPreferences` for sessions | `SessionManager.kt` | AES256-GCM value + AES256-SIV key; per-app file name (`auth_session` for customer; `tech_auth_session` for technician — see E02-S02) |
| Firebase `errorCode` mapping | `FirebaseOtpUseCase.kt` | Always `errorCode` strings; never `message.contains()` |
| `callbackFlow` lifecycle | `FirebaseOtpUseCase.kt` | Non-empty `awaitClose {}` comment; cancel previous job on resend |
| Hilt + JVM unit tests | All use-case tests | Manual construction in JVM tests; `@HiltAndroidTest` only for instrumented |
| Paparazzi cross-OS | `AuthScreenPaparazziTest.kt` | Never record on Windows; `paparazzi-record.yml` on CI Linux |

### References

- [Source: `plans/E02-S01.md` — implementation plan]
- [Source: `docs/superpowers/specs/2026-04-19-e02-s01-auth-design.md` — brainstorm]
- [Source: `docs/prd.md` §FR-1.1, §NFR-S-1..S-3, §NFR-S-10]
- [Source: `docs/threat-model.md` §3.2, §3.5]
- [Source: `docs/stories/README.md` §E02-S01 row]

---

## Definition of Done

- [x] `cd customer-app && ./gradlew testDebugUnitTest ktlintCheck detekt assembleDebug lintDebug` green (verified on PR #9 CI)
- [x] All AC pass via test assertions across 8 test classes (1418+ lines of tests)
- [x] Paparazzi goldens recorded on CI Linux (13 PNGs for AuthScreen states)
- [x] Pre-Codex smoke gate exited 0
- [x] `.codex-review-passed` marker shipped in PR #9; round-trip review log in `docs/reviews/codex-pr-E02-S01.md`
- [x] CI green on `main` after merge (commit `0960e88`)
- [x] No paid SaaS dependencies introduced; ADR-0007 compliance verified

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per PR #9 commit attribution)

### Completion Notes
PR #9 merged 2026-04-19 as commit `0960e88`. Truecaller SDK version pinned to 3.2.1 (not plan's 3.0.3) due to Maven Central availability; androidx.biometric pinned to stable 1.1.0 (not plan's alpha05). Both deviations are documented in commit messages and have no AC impact. The 5 pattern documents now serve as required reading for every subsequent Android story (per project CLAUDE.md §"Pattern library").

### File List
See PR #9: 69 files. Highlights — domain models (5 sealed classes), use cases (5 + orchestrator), SessionManager + Hilt module, AuthScreen + AuthViewModel + 13 Paparazzi golden PNGs, AppNavigation + AuthGraph + MainGraph, `MainActivity` upgraded to `FragmentActivity`, 5 pattern docs, 3 pre-Codex scripts, `technician-app` libs.versions.toml synced.
