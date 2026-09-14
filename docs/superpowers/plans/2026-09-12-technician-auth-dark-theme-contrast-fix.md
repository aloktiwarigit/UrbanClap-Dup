# Technician Auth Dark-Theme Contrast Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix technician-app's Auth flow (`AuthScreen.kt`) so it renders correctly under dark mode (system-wide or per-app forced), eliminating the black-floating-card / near-invisible-text visual bug that most likely caused a technician to report they "couldn't register."

**Architecture:** One-line source fix — `AuthFrame`'s form-card `Surface` currently hardcodes `color = Color.White`, which desyncs from the active `MaterialTheme` color scheme under dark mode. Change it to `color = MaterialTheme.colorScheme.surface`, matching the pattern customer-app's `AuthFrame` already uses correctly. This lets the ambient `LocalContentColor` correctly pair with whichever scheme is active for all unstyled `Text` inside, and eliminates the mismatch against `HsSectionCard` (which already reads `colorScheme.surface`). A new Paparazzi dark-theme golden is added for the MethodSelection state (the most visibly broken screen), and both it and the existing OtpEntry dark-theme golden are re-recorded on CI with the fix applied.

**Tech Stack:** Kotlin, Jetpack Compose, Material3, Paparazzi (JUnit4 + layoutlib), Gradle.

**Spec:** None — this is a defect fix identified via live device reproduction (Moto G Power 5G, Android per-app dark-theme override), not a new feature. The root-cause section below stands in for a spec.

## Global Constraints

- No paid SaaS; zero-cost infra unaffected (UI-only fix, no new dependencies).
- Kotlin `-Werror`, explicit API mode — `AuthFrame`/`AuthScreen` are `internal`/`private`, unaffected.
- Paparazzi goldens are recorded on CI (Linux) only, never locally on Windows — `docs/patterns/paparazzi-cross-os-goldens.md`.
- Only the two goldens this fix touches are re-recorded — never bulk-delete or bulk-re-record `snapshots/images/`.
- TDD + Codex review + CI are non-negotiable regardless of ceremony tier (this is Feature-tier: lean flow, no `/security-review` — no auth-logic, credential, or PII surface is touched).

---

## Root Cause (recap for the implementer)

- Confirmed via live reproduction on a physical Moto G Power 5G (2024): the Android per-app dark-theme override was active for `in.homeheroo.technician` (`adb shell dumpsys activity in.homeheroo.technician` showed `night` in `mCurrentConfig`, even though the system-wide `adb shell cmd uimode night` reported "no").
- `AuthScreen.kt`'s `AuthFrame` (technician-app) hardcodes the form-card `Surface`'s `color` param to `Color.White` (`technician-app/app/src/main/kotlin/com/homeservices/technician/ui/auth/AuthScreen.kt:251`). This diverges from customer-app's `AuthFrame` (`customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthScreen.kt:246`), which correctly uses `color = MaterialTheme.colorScheme.surface`.
- Because `Color.White` doesn't match any role in the active dark `ColorScheme`, Compose's `Surface` content-color resolution falls back to the ambient `LocalContentColor` — inherited from the outer, theme-aware `Surface(color = MaterialTheme.colorScheme.background)` at `AuthScreen.kt:96` — for any child `Text` without an explicit `color`. In dark mode that ambient color is `TextStrongDark`, a pale color meant for a *dark* background, so titles like "Start earning with verified jobs" render nearly invisible on the hardcoded-white card.
- Independently, `HsSectionCard` (`design-system/src/main/kotlin/com/homeservices/designsystem/components/HsComponents.kt:166`) correctly reads `MaterialTheme.colorScheme.surface`, so in dark mode it renders as a black box floating inside the hardcoded-white card — a second visual mismatch from the same root cause.
- Phone-number normalization and OTP-send logic are unaffected and already verified correct: 13/13 `PhoneNumberNormalizerTest` unit tests pass, and live device reproduction with `9198765432` correctly enabled "Get OTP" in the brand color. This is a pure rendering/contrast bug, not a validation or Firebase bug.
- A Paparazzi dark-theme golden (`authScreen_otpEntry_darkTheme`, `AuthScreenPaparazziTest.kt:82`) already exists and has been passing — because Paparazzi's pixel diff only catches *changes* from a recorded baseline, and the broken rendering was itself what got recorded as that baseline. No one visually inspected the rendered PNG. Task 2 below adds a second dark-theme golden (MethodSelection, the most visibly broken screen), and Task 3 re-records both with the fix applied and a manual visual check — closing that blind spot going forward.

## File Map

- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/auth/AuthScreen.kt` — the one-line fix.
- Modify: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/auth/AuthScreenPaparazziTest.kt` — add `authScreen_methodSelection_darkTheme`.
- Re-recorded on CI (not hand-edited): `technician-app/app/src/test/snapshots/images/*authScreen_otpEntry_darkTheme*.png`, new `*authScreen_methodSelection_darkTheme*.png`.

---

### Task 1: Fix the hardcoded card color

**Files:**
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/auth/AuthScreen.kt:251`

**Interfaces:**
- Consumes: `MaterialTheme.colorScheme.surface` (`MaterialTheme` is already imported in this file).
- Produces: no new public API — `AuthFrame`'s form-card `Surface` now resolves its color the same way `HsSectionCard` and customer-app's `AuthFrame` already do.

- [ ] **Step 1: Note the existing evidence of the bug**

The existing `authScreen_otpEntry_darkTheme` test at `AuthScreenPaparazziTest.kt:82` already renders this exact broken state under `HomeservicesTheme(darkTheme = true)` — its currently-committed golden PNG *is* the broken appearance. No new failing test is needed to prove the bug exists; it's already proven by live device reproduction (screenshots taken this session) plus that golden. Proceed straight to the fix; Task 2 adds the additional golden this fix needs to also cover (MethodSelection).

- [ ] **Step 2: Apply the one-line fix**

In `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/auth/AuthScreen.kt`, change:

```kotlin
        Surface(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .fillMaxHeight(AUTH_FORM_FRACTION),
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            color = Color.White,
            shadowElevation = 8.dp,
        ) {
```

to:

```kotlin
        Surface(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .fillMaxHeight(AUTH_FORM_FRACTION),
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            color = MaterialTheme.colorScheme.surface,
            shadowElevation = 8.dp,
        ) {
```

- [ ] **Step 3: Leave the `Color` import untouched**

`Color.White` is also used elsewhere in this file (hero title/subtitle text colors, decorative circle overlays, `GoogleMark`'s letter tint). Do not remove `import androidx.compose.ui.graphics.Color` — those usages still need it.

- [ ] **Step 4: Compile and run the existing non-Paparazzi test suite**

Run: `cd technician-app && ./gradlew :app:testDebugUnitTest -PexcludePaparazzi --quiet`
Expected: BUILD SUCCESSFUL. This change touches only the `AuthScreen` Composable, not `AuthViewModel`/`AuthOrchestrator`, so `AuthViewModelTest.kt` and `AuthOrchestratorTest.kt` must remain green unchanged.

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/auth/AuthScreen.kt
git commit -m "fix(technician-app): use theme-aware surface color for Auth form card

Auth screens rendered with a hardcoded Color.White card, which desyncs from
the active MaterialTheme color scheme under dark mode: unstyled Text inside
inherits a pale dark-mode content color meant for a dark background, and
HsSectionCard (which correctly reads colorScheme.surface) renders as a
black box floating inside the white card. Matches customer-app's AuthFrame,
which already uses MaterialTheme.colorScheme.surface here.

Verified root cause via live reproduction on a physical device with the
per-app dark-theme override active."
```

---

### Task 2: Add a MethodSelection dark-theme golden

**Files:**
- Modify: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/auth/AuthScreenPaparazziTest.kt`

**Interfaces:**
- Consumes: `AuthUiState.MethodSelection` (existing sealed state, no changes needed), `HomeservicesTheme` (already imported in this test file).
- Produces: a new golden image path under `technician-app/app/src/test/snapshots/images/` once recorded on CI in Task 3.

- [ ] **Step 1: Add the test**

Add this test function to `AuthScreenPaparazziTest.kt`, next to `authScreen_otpEntry_darkTheme`:

```kotlin
    @Test
    public fun authScreen_methodSelection_darkTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                AuthScreen(
                    uiState = AuthUiState.MethodSelection,
                    onPhoneSubmitted = {},
                    onOtpEntered = {},
                    onResendRequested = {},
                    onRetry = {},
                )
            }
        }
    }
```

This is the screen most visibly broken in the live repro (the three-button card rendering black inside a white sheet) — it's the one worth locking in as a permanent regression guard, since `authScreen_otpEntry_darkTheme` alone would not catch a regression that only affected MethodSelection.

- [ ] **Step 2: Confirm the test compiles**

Run: `cd technician-app && ./gradlew :app:compileDebugUnitTestKotlin --quiet`
Expected: BUILD SUCCESSFUL. Do not run this Paparazzi test locally on Windows — per `docs/patterns/paparazzi-cross-os-goldens.md`, local Windows rendering diverges from CI Linux rendering by 3-5%, well past Paparazzi's 0.1% threshold, and there is no golden yet for this test to compare against locally anyway.

- [ ] **Step 3: Commit**

```bash
git add technician-app/app/src/test/kotlin/com/homeservices/technician/ui/auth/AuthScreenPaparazziTest.kt
git commit -m "test(technician-app): add MethodSelection dark-theme Paparazzi golden

Covers the screen most visibly broken by the Color.White contrast bug
(three-button card rendering black inside a hardcoded-white sheet).
No golden recorded yet - see paparazzi-record.yml dispatch in the PR."
```

---

### Task 3: Record the updated/new goldens on CI

**Files:** none directly (CI-only; produces committed binary snapshot files)

**Interfaces:**
- Consumes: the code change from Task 1 and the new test from Task 2, both pushed to the branch.
- Produces: updated `technician-app/app/src/test/snapshots/images/*authScreen_otpEntry_darkTheme*.png` and new `*authScreen_methodSelection_darkTheme*.png`.

- [ ] **Step 1: Push the branch so the workflow can check it out**

```bash
git push -u origin <branch-name>
```

- [ ] **Step 2: Dispatch the recording workflow**

```bash
gh workflow run paparazzi-record.yml \
  -f gradle_root=technician-app \
  -f gradle_task=:app:recordPaparazziDebug
```

- [ ] **Step 3: Wait for the run, then download the artifact**

```bash
gh run watch --exit-status
gh run download <run-id> -n paparazzi-snapshots-technician-app -D /tmp/paparazzi-technician
```

- [ ] **Step 4: Unzip inside `technician-app/` and visually inspect the two changed/new PNGs before committing**

```bash
cd technician-app && unzip -o /tmp/paparazzi-technician/*.zip
```

`actions/upload-artifact@v4` strips the common prefix, so entries are relative to `technician-app/` — unzip there, not at repo root (see `paparazzi-record.yml` header comment). Open `authScreen_otpEntry_darkTheme*.png` and `authScreen_methodSelection_darkTheme*.png` and confirm by eye: the card is now a coherent dark surface color (not black-on-white), and title/body text is legible against it. This manual look is the actual regression check for this bug class — the whole point of this fix is that automated pixel-diffing alone missed it once already.

- [ ] **Step 5: Commit the recorded goldens**

```bash
git add technician-app/app/src/test/snapshots/images/*authScreen_otpEntry_darkTheme* \
        technician-app/app/src/test/snapshots/images/*authScreen_methodSelection_darkTheme*
git commit -m "test(technician-app): record dark-theme Paparazzi goldens for Auth fix

Recorded on CI per docs/patterns/paparazzi-cross-os-goldens.md. Visually
confirmed both screens render with a coherent dark card and legible text."
```

---

### Task 4: Smoke gate, Codex review, push

**Files:** none (verification only)

- [ ] **Step 1: Run the full pre-Codex smoke gate**

```bash
bash tools/pre-codex-smoke.sh technician-app
```

Expected: exits 0 (all six steps pass). Non-zero exit = stop and fix before continuing.

- [ ] **Step 2: Codex review**

```bash
codex review --base main
```

No `/security-review` needed — this is a UI-only contrast fix; it does not touch `AuthViewModel`, `AuthOrchestrator`, `FirebaseOtpUseCase`, or any credential/PII/auth-logic path.

- [ ] **Step 3: Push and open PR**

Per repo convention: push (already done as part of Task 3, Step 1), open PR, CI (lint + tests + Semgrep) gates auto-merge.

---

## Self-Review

**Spec coverage:** No formal spec doc (defect fix). The root-cause section enumerates every observed symptom (pale title text, black nested card, both MethodSelection and OtpEntry screens) and Tasks 1-2 address the shared root cause plus both observed screens; Task 3 proves the fix visually, not just via pixel-diff; Task 4 is the standard project gate.

**Placeholder scan:** No TBDs — every step has literal code or commands. `<branch-name>` and `<run-id>` are the only bracketed placeholders, and both are genuinely only known at execution time (current branch name, workflow run ID from `gh run list`).

**Type consistency:** N/A — no new types or function signatures introduced; a single existing `Surface` parameter's value changes from a literal to a theme lookup.
