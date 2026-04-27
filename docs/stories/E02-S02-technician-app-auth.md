# Story E02-S02: Technician app auth — Truecaller + Firebase OTP + biometric + 180-day session

Status: shipped (PR #14, merged 2026-04-19, commit `2f6cfa6`) — **retroactive docs**

> **Epic:** E02 — Authentication & Onboarding (`docs/stories/README.md` §E02)
> **Sprint:** S1 (wk 1–2) · **Estimated:** ≤ 1 dev-day · **Priority:** **P0 — blocks E05/E06/E07/E08 technician-side work**
> **Sub-project:** `technician-app/`
> **Ceremony tier:** Foundation (auth-sensitive; same blast radius as E02-S01 — domain + data + DI + UI all touched)
> **FR reference:** FR-1.1
> **Prerequisite:** E02-S01 customer-app auth merged (the entire flow is ported from there)
> **Retroactive note:** This story file is being written *after* the implementation merged. PR #14 shipped `plans/E02-S02.md` but never committed `docs/stories/E02-S02-*.md`. Acceptance criteria below are reverse-engineered from the merged code under `technician-app/app/src/main/kotlin/com/homeservices/technician/{domain,data,ui,navigation}/auth/**`.

---

## Story

As a **service partner installing the technician app**,
I want the same one-tap Truecaller + Firebase OTP fallback + biometric gate + 180-day session as the customer app, with service-provider framing in the copy and an `OnboardingScreen` placeholder as the post-auth destination,
so that **partners can sign up in seconds, the codebase has zero auth duplication risk (the technician flow is a strict port of customer with package + branding deltas), and KYC + dispatch (E02-S03 + E05) have a stable identity primitive to build on**.

---

## Acceptance Criteria

### AC-1 · Direct port of customer-app auth modules with package rename
- **Given** every domain model + use case + SessionManager + DI module from E02-S01
- **When** ported to `com.homeservices.technician`
- **Then** semantics match customer-app exactly:
  - 5 sealed classes (`AuthResult`, `AuthState`, `BiometricResult`, `OtpSendResult`, `TruecallerAuthResult`)
  - 5 use cases (`TruecallerLoginUseCase`, `FirebaseOtpUseCase`, `BiometricGateUseCase`, `SaveSessionUseCase`, `AuthOrchestrator`)
  - `SessionManager` with `StateFlow<AuthState>`
  - `AuthModule` (Hilt) for `FirebaseAuth` + `EncryptedSharedPreferences`
- **And** zero references to `com.homeservices.customer` remain in any technician-app file
- **And** explicit-API mode is satisfied across the new files (per `docs/patterns/kotlin-explicit-api-public-modifier.md`)

### AC-2 · `EncryptedSharedPreferences` file name differs from customer-app
- **Given** both apps may be installed on the same test device
- **Then** `SessionManager` writes to `tech_auth_session` (NOT `auth_session`)
- **And** `AuthModule.provideAuthPrefs` returns the file with that name + AES256-GCM value scheme + AES256-SIV key scheme
- **And** the file-name change is the only behavioural delta from customer-app's `SessionManager` (TTL, save/load, clear, StateFlow plumbing identical)

### AC-3 · `MainActivity` upgraded from `ComponentActivity` to `FragmentActivity`
- **Given** Truecaller SDK + BiometricPrompt both require `FragmentActivity`
- **Then** `technician-app/.../MainActivity.kt` extends `FragmentActivity` (was `ComponentActivity` per E01-S03 skeleton)
- **And** `MainActivity` `@Inject`s `SessionManager` and `BuildInfoProvider`
- **And** `setContent { HomeservicesTheme { AppNavigation(sessionManager, activity = this) } }`
- **And** `onActivityResult` forwards to `TruecallerSDK.getInstance().onActivityResultObtained(...)` for `SHARE_PROFILE_REQUEST_CODE`

### AC-4 · Service-provider framing in copy (only delta from customer-app)
- **Given** the ported `AuthScreen.kt`
- **Then** the following strings differ from customer-app:
  - "Enter your mobile number" → **"Register as a service partner"**
  - "We'll send a one-time code to verify your number" → **"We'll verify your mobile number to get you started"**
  - "By continuing, you agree to our Terms…" → **"By continuing, you agree to our Partner Terms…"**
  - "Verifying with Truecaller…" → **"Verifying your identity with Truecaller…"**
- **And** every other string ("Get OTP", "Verify", "Resend code", error messages) is identical to customer-app

### AC-5 · `OnboardingScreen` stub + `OnboardingGraph` replace `MainGraph`
- **Given** technicians need a different post-auth destination than customers
- **When** `AuthState.Authenticated` fires
- **Then** `AppNavigation` routes to `"main"` graph, `startDestination = "onboarding_home"`
- **And** `OnboardingScreen` renders "Onboarding — coming soon" placeholder (replaced by E02-S03 KYC flow)
- **And** `OnboardingGraph.kt` exposes `onboardingGraph()` as the technician-side `mainGraph()` equivalent

### AC-6 · `libs.versions.toml` synced from customer-app (mandatory pre-task)
- **Given** the project CLAUDE.md §"Android story invariants" rule
- **Then** `technician-app/gradle/libs.versions.toml` is byte-for-byte synced with `customer-app/gradle/libs.versions.toml` for Truecaller SDK, Firebase BOM, security-crypto, biometric, hilt-navigation-compose, Paparazzi
- **And** the sync is the first commit on the story branch

### AC-7 · `AndroidManifest.xml` + ProGuard rules ported
- **Given** Truecaller SDK 3.x uses the legacy `onActivityResult` path
- **Then** `AndroidManifest.xml` has the `<queries><package android:name="com.truecaller" /></queries>` block
- **And** `proguard-rules.pro` keeps Truecaller, Firebase Auth, and `androidx.security.crypto` reflective surfaces

### AC-8 · Tests ported with package rename (TDD)
- **Given** every test from customer-app
- **Then** the technician-app mirrors the same 9 test files:
  - `data/auth/SessionManagerTest.kt` (117) — Robolectric
  - `domain/auth/{Truecaller,FirebaseOtp,BiometricGate,SaveSession,AuthOrchestrator}UseCaseTest.kt` (~507 lines combined) — JUnit 5 + MockK
  - `ui/auth/AuthViewModelTest.kt` (374)
  - `ui/auth/AuthScreenPaparazziTest.kt` (144)
- **And** all tests pass via `./gradlew :technician-app:app:testDebugUnitTest`
- **And** `FirebaseOtpUseCaseTest` carries the `ExperimentalCoroutinesApi` opt-in fix that was missing pre-port (compilation blocker under `-Werror`)

### AC-9 · Paparazzi goldens land on CI Linux (8 PNGs for AuthScreen states)
- **Given** `AuthScreenPaparazziTest` writes goldens
- **Then** the 8 golden PNGs (`authScreen_idle`, `authScreen_otpEntry` light + dark, `authScreen_otpCodeEntry`, `authScreen_otpSending`, `authScreen_otpVerifying`, `authScreen_error`, `authScreen_truecallerLoading`) are committed
- **And** they were recorded on CI Linux via `paparazzi-record.yml` (NOT on Windows — per `docs/patterns/paparazzi-cross-os-goldens.md`)
- **And** the existing `SmokeScreenPaparazziTest` goldens are updated (theme reference shifted)

---

## Tasks / Subtasks (as actually shipped)

> Implementation merged via PR #14. The work-stream order in `plans/E02-S02.md` was followed exactly (WS-A → WS-B fan-out → WS-C parallel WS-D → WS-E smoke gate).

- [x] **Pre-task — `libs.versions.toml` sync** — `cp customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml`

- [x] **WS-A — Domain models + data layer**
  - [x] Port 5 sealed classes under `domain/auth/model/`
  - [x] `data/auth/di/AuthPrefs.kt` qualifier
  - [x] `data/auth/SessionManager.kt` — prefs file `tech_auth_session`
  - [x] RED: `data/auth/SessionManagerTest.kt` (117 lines) — 7 cases pass

- [x] **WS-B — Use cases + orchestrator (TDD, parallel fan-out per use case)**
  - [x] `SaveSessionUseCase.kt` + 4-case test (save, saveAnonymousWithPhone success, null-user error, FirebaseException error)
  - [x] `TruecallerLoginUseCase.kt` + test
  - [x] `FirebaseOtpUseCase.kt` + 9/9-case test (errorCode mapping, `awaitClose` non-empty comment, sendOtp cancellation safety)
  - [x] `BiometricGateUseCase.kt` + test
  - [x] `AuthOrchestrator.kt` + 128-line test

- [x] **WS-C — Hilt DI module + Manifest + ProGuard**
  - [x] `data/auth/di/AuthModule.kt` (37 lines) — `tech_auth_session` prefs file
  - [x] `AndroidManifest.xml` — Truecaller `<queries>` block
  - [x] `proguard-rules.pro` — Truecaller + Firebase Auth + security-crypto keep rules

- [x] **WS-D — Compose UI + ViewModel + Navigation + Paparazzi (parallel with WS-C)**
  - [x] `ui/auth/AuthUiState.kt` (21)
  - [x] RED + GREEN: `ui/auth/AuthViewModel.kt` (166) + `AuthViewModelTest.kt` (374)
  - [x] `ui/auth/AuthScreen.kt` (235) — service-provider framing copy
  - [x] `ui/onboarding/OnboardingScreen.kt` (19) — placeholder
  - [x] `navigation/AppNavigation.kt` (46), `AuthGraph.kt` (39), `OnboardingGraph.kt` (12 — new, replaces `MainGraph`)
  - [x] `MainActivity.kt` — `ComponentActivity` → `FragmentActivity`; `@Inject SessionManager`; `onActivityResult` forwards
  - [x] `AuthScreenPaparazziTest.kt` (144) — 8 golden PNGs recorded on CI Linux
  - [x] Existing `SmokeScreenPaparazziTest` light + dark goldens updated

- [x] **WS-E — Pre-Codex smoke gate + Codex review**
  - [x] `bash tools/pre-codex-smoke.sh technician-app` exit 0
  - [x] `codex review --base main` — findings resolved
  - [x] `.codex-review-passed` marker shipped
  - [x] PR opened → CI green → merged

---

## Dev Notes

### What was actually shipped (per PR #14 file list)

44 files changed, 2,942 insertions:

```
plans/E02-S02.md                                 +537 lines (Foundation-tier plan)
technician-app/gradle/libs.versions.toml         synced from customer-app
technician-app/app/build.gradle.kts              +52 lines (Firebase/Truecaller deps applied)
technician-app/app/google-services.json          +29 lines (stub)
technician-app/app/proguard-rules.pro            +11 lines
technician-app/app/src/main/AndroidManifest.xml  +5 lines (Truecaller queries)
20 new Kotlin source files under com/homeservices/technician/{domain,data,ui,navigation}/auth + ui/onboarding
9 new test files
8 new Paparazzi golden PNGs for AuthScreen states
SmokeScreenPaparazziTest goldens updated (light + dark)
MainActivity.kt: ComponentActivity → FragmentActivity (40 net lines)
```

### Why this story is being written retroactively

The 2026-04-26 audit (`docs/audit/story-completeness-2026-04-26.md`) found that PR #14 landed `plans/E02-S02.md` but never committed `docs/stories/E02-S02-*.md`. This file closes the gap.

### Why the work was split across only two Foundation deltas (no further sub-stories)

`plans/E02-S02.md` §"Story size check" evaluated a split (3 of 4 split-rule triggers fired: new files >20, all 4 Android layers touched, ≥2 SDK integrations) but explicitly chose NOT to split. Rationale: every file is a 1:1 port from customer-app with zero new design decisions; splitting would add ceremony without reducing risk. The single Foundation-tier session with parallel subagent dispatch per use case was the right shape.

### Pattern adherence

This story consumed (did not author) the patterns established in E02-S01:

| Pattern doc | Used in this story |
|---|---|
| `firebase-callbackflow-lifecycle.md` | `FirebaseOtpUseCase.kt` `awaitClose {}` non-empty + cancel-prev-job rule on resend |
| `firebase-errorcode-mapping.md` | `FirebaseOtpUseCase.kt` `errorCode`-based mapping |
| `hilt-module-android-test-scope.md` | All JVM use-case tests use manual construction; Robolectric only for `SessionManager` |
| `kotlin-explicit-api-public-modifier.md` | Every public symbol carries explicit `public` modifier |
| `paparazzi-cross-os-goldens.md` | 8 goldens recorded on CI Linux, never committed from Windows |

### References

- [Source: `plans/E02-S02.md` — implementation plan (537 lines, Foundation tier)]
- [Source: `docs/stories/E02-S01-customer-app-otp-login.md` — sibling story; same flow, customer framing]
- [Source: `docs/prd.md` §FR-1.1]
- [Source: `docs/stories/README.md` §E02-S02 row]

---

## Definition of Done

- [x] `cd technician-app && ./gradlew testDebugUnitTest ktlintCheck detekt assembleDebug lintDebug` green (verified on PR #14 CI)
- [x] `diff customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml` is empty (parity)
- [x] All AC pass via 9 test classes (~1100 lines of tests)
- [x] 8 Paparazzi goldens for AuthScreen states + 2 updated SmokeScreen goldens (recorded on CI Linux)
- [x] `MainActivity` extends `FragmentActivity`; `onActivityResult` forwards to TruecallerSDK
- [x] Pre-Codex smoke gate exited 0
- [x] `.codex-review-passed` marker shipped in PR #14
- [x] CI green on `main` after merge (commit `2f6cfa6`)
- [x] Both apps installable on the same device without prefs collision (`auth_session` vs `tech_auth_session`)

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per PR #14 commit attribution)

### Completion Notes
PR #14 merged 2026-04-19 as commit `2f6cfa6`. Work-stream parallel dispatch (4 subagents in WS-B, parallel WS-C/WS-D after WS-B) executed cleanly. Encountered one cross-cutting fix while porting `FirebaseOtpUseCaseTest`: the `ExperimentalCoroutinesApi` opt-in was missing pre-port and unblocked compilation under `-Werror` once added.

### File List
See PR #14: 44 files. 20 new Kotlin source files (5 models, 5 use cases, AuthOrchestrator, SessionManager, AuthModule, AuthUiState, AuthViewModel, AuthScreen, OnboardingScreen, AppNavigation, AuthGraph, OnboardingGraph) + 9 test files + 8 new Paparazzi PNGs + 2 updated SmokeScreen PNGs + manifest + proguard + build.gradle.kts + google-services.json stub + libs.versions.toml sync + MainActivity upgrade + plans/E02-S02.md.
