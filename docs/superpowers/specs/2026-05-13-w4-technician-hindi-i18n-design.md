# Design Spec: W4 — Technician-app Hindi i18n Parity (E12-S03c)

**Date:** 2026-05-13  
**Author:** Alok Tiwari  
**Status:** Approved  
**Wave:** W4 of technician-app remediation program (`plans/adaptive-growing-mochi.md` §4)  
**Ceremony tier:** Feature  

---

## 1. Context & Goal

Admin-web is fully bilingual (PRs #186 + #194, merged). Customer-app Hindi sweep is complete (PR #202, E12-S02a). Technician-app has a `values-hi/strings.xml` (59 lines) but lacks a runtime locale switcher and has ~56 hardcoded English `Text("…")` literals in its UI layer plus 2 `Locale.ENGLISH` formatter calls. This spec closes that gap.

**Success criteria:**
1. Technician can switch app language between English and Hindi from the Profile tab at runtime — no restart required.
2. Zero hardcoded `Text("...")` English literals remain in `ui/` (enforced by Detekt `ForbiddenComment` or Grep CI check).
3. All number/date formatters use device-selected locale, not `Locale.ENGLISH`.
4. All new strings have ≥95% Hindi translations (count parity on keys).

---

## 2. Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| First-launch language picker | **Skip** | Technicians are repeat users on Hindi-default UP devices (Jio/Xiaomi). Auto-detect device locale + Settings switcher covers the Ayodhya pilot population. Avoids ~150 LOC + extra Paparazzi golden in this wave. |
| Activity recreate on locale change | **AppCompatDelegate only** | `androidx.appcompat:1.7.0` (already in libs) handles transparent recreate on API <33. API 33+ framework handles it. No manual `recreate()`. |
| Persistence layer | **DataStore** | `datastore-preferences:1.1.1` already in libs. Matches customer-app pattern exactly — no drift. |
| Literal sweep execution | **6 parallel Haiku subagents** | One per UI feature dir. Mechanical codemod; fan-out halves wall-clock vs sequential. |
| Hindi font (Noto Sans Devanagari) | **Skip (W5 backlog)** | Roboto Devanagari is acceptable at pilot scale on 5" low-DPI screens. Post-PMF refinement. |
| Paparazzi hi-locale goldens | **Skip (W5-A)** | Paparazzi hi-locale golden recording belongs in the W5-A Paparazzi expansion wave (all golden management in one wave). W4 ships with en goldens passing; CI CI stays green. |

---

## 3. Architecture

### 3.1 New files

```
technician-app/app/src/main/kotlin/com/homeservices/technician/
├── data/locale/
│   ├── LocaleRepositoryImpl.kt        # DataStore-backed; currentLocale: Flow<String>; setLocale()
│   └── di/
│       ├── LocaleModule.kt            # @Provides @LocalePrefs DataStore; @Binds LocaleRepository
│       └── LocalePrefs.kt             # @Qualifier annotation
├── domain/locale/
│   ├── LocaleRepository.kt            # interface: currentLocale: Flow<String>; setLocale(tag: String)
│   └── SetAppLocaleUseCase.kt         # persist → AppCompatDelegate.setApplicationLocales (same order as customer-app)
└── ui/settings/
    ├── LanguageSettingsScreen.kt      # Compose screen: EN / हिंदी toggle list
    └── LanguageSettingsViewModel.kt   # currentLocale: StateFlow; setLocale() → SetAppLocaleUseCase
```

### 3.2 Modified files

| File | Change |
|---|---|
| `HomeservicesTechnicianApplication.kt` | Add `LocaleEntryPoint` + apply persisted locale in `onCreate()` before first Activity |
| `navigation/AppNavigation.kt` | Add `composable("settings/language")` route; thread `onLanguageSettings: () -> Unit` down to home |
| `ui/home/TechnicianHomeScreen.kt` | Add `onLanguageSettings: () -> Unit` param; add "App language" row in Profile tab (same style as "Payout settings" row) |
| `app/src/main/res/values/strings.xml` | Add all 56 new en string keys |
| `app/src/main/res/values-hi/strings.xml` | Add Hindi translations for all 56 keys |
| `ui/auth/AuthScreen.kt` | Replace ~6 `Text("...")` → `stringResource(R.string.*)` |
| `ui/activeJob/PhotoCaptureScreen.kt` + `ActiveJobScreen.kt` | Replace ~14 `Text("...")` → `stringResource(...)` |
| `ui/myratings/MyRatingsScreen.kt` + `ui/rating/RatingScreen.kt` | Replace ~12 `Text("...")` → `stringResource(...)`; fix `DATE_FORMATTER` locale |
| `ui/complaint/ComplaintScreen.kt` | Replace ~6 `Text("...")` → `stringResource(...)` |
| `ui/earnings/EarningsScreen.kt` | Replace ~3 `Text("...")` → `stringResource(...)`; fix `Locale.ENGLISH` day-of-week call |
| `ui/home/TechnicianHomeScreen.kt` | Replace remaining `Text("...")` in tabs + labels → `stringResource(...)` |
| `ui/kyc/KycScreen.kt` + `ui/onboarding/OnboardingScreen.kt` | Sweep for any additional hardcoded literals |

### 3.3 Key implementation notes

**Application.onCreate locale apply:**
```kotlin
// Port from HomeservicesCustomerApplication verbatim; rename package
@EntryPoint
@InstallIn(SingletonComponent::class)
interface LocaleEntryPoint {
    fun localeRepository(): LocaleRepository
}

override fun onCreate() {
    super.onCreate()
    // ... existing Sentry + NotificationChannelInitializer calls ...
    val ep = EntryPointAccessors.fromApplication(this, LocaleEntryPoint::class.java)
    CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate).launch {
        val tag = ep.localeRepository().currentLocale.first()
        AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))
    }
}
```

**SetAppLocaleUseCase — persist before apply:**
```kotlin
// Order matters: DataStore write completes before setApplicationLocales triggers Activity recreate
repo.setLocale(tag)
AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))
```
Technician-app's `LocaleRepository` interface omits `markFirstLaunchCompleted()` (no first-launch flow).

**LocaleRepository default — auto-detect device locale:**
```kotlin
private fun deviceSupportedLocale(): String =
    when (Locale.getDefault().language) {
        "hi" -> "hi"
        else -> "en"
    }
```

**LanguageSettingsScreen entry point:**  
Profile tab of `TechnicianHomeScreen` → add an `AppLanguage` row (same `SettingsRow` composable pattern as "Payout settings") that calls `onLanguageSettings()`. Both Earnings and Profile tabs already thread `onPayoutSettings` via the same pattern.

**Formatter residuals:**
- `EarningsScreen.kt:359` — `Locale.ENGLISH` → `Locale.getDefault()`
- `MyRatingsScreen.kt:182` — `Locale.ENGLISH` → `Locale.getDefault()`

---

## 4. Work Streams

### WS-A — Data + domain layer (Sonnet inline, prerequisite)
Create `data/locale/` + `domain/locale/` packages.  
**TDD:** `LocaleRepositoryImplTest.kt` (DataStore fake; assert `currentLocale` emits stored tag; assert default → device locale detection). `SetAppLocaleUseCaseTest.kt` (mock repo; assert `setLocale` called before `setApplicationLocales`).  
Modify `HomeservicesTechnicianApplication.kt`.

### WS-B — UI: LanguageSettingsScreen + wiring (Sonnet inline, after WS-A)
**frontend-design skill invoked BEFORE writing any Compose code** (per `memory/feedback_frontend_design_skill.md`).  
Create `ui/settings/LanguageSettingsScreen.kt` + `LanguageSettingsViewModel.kt`.  
**TDD:** `LanguageSettingsViewModelTest.kt` — `initialState = device locale`; `setLocale("hi")` calls use case + emits `"hi"` via StateFlow.  
Modify `TechnicianHomeScreen` (add param + Profile tab row).  
Modify `AppNavigation` (add route + threading).  
**UI/UX visual-audit checkpoint after WS-B** (per `memory/feedback_uiux_review_gate.md`).

### WS-C — Literal sweep (6 parallel Haiku subagents)
One subagent per UI dir. Each subagent:
1. Grep `Text("` in its assigned dir.
2. Classify each hit as translatable (→ `strings.xml`) or non-translatable (format pattern `"%.1f"`, Unicode glyphs `"★"`, empty strings — leave as-is).
3. Add en key to `res/values/strings.xml`.
4. Add Hindi translation to `res/values-hi/strings.xml`.
5. Replace `Text("Foo")` → `Text(stringResource(R.string.foo))` in the source file.

**Subagent assignments:**
- Agent 1: `ui/auth/`
- Agent 2: `ui/activeJob/`
- Agent 3: `ui/myratings/` + `ui/rating/`
- Agent 4: `ui/complaint/`
- Agent 5: `ui/earnings/` (includes `Locale.ENGLISH` → `Locale.getDefault()` formatter fix)
- Agent 6: `ui/home/` + `ui/kyc/` + `ui/onboarding/`

**Subagent invariant:** strings.xml keys use `snake_case`; never duplicate an existing key. Each subagent writes its proposed keys to a temp sidecar file (`/tmp/strings-wsc-<N>.xml`) rather than directly to `values/strings.xml` — a consolidation pass by the parent Sonnet agent merges all sidecars into `strings.xml` and `strings-hi.xml` at once, avoiding parallel write conflicts.

### WS-D — libs.versions.toml mirror
After WS-A: copy `technician-app/gradle/libs.versions.toml` → `customer-app/gradle/libs.versions.toml` (per project CLAUDE.md invariant). W4 adds no new deps, so this is a byte-identity check only — confirm they are already in sync; if not, merge the diff.

### WS-E — Smoke gate + Codex review
```bash
bash tools/pre-codex-smoke.sh technician-app
```
Then: `codex review --base main` (max 2 rounds). Skip `/security-review` — locale change is not auth/payment/PII adjacent.

---

## 5. String Key Inventory (for WS-A + WS-C)

### Non-translatable (leave as `Text("...")` — no string resource needed)
- `"%.1f"` — printf format pattern
- `"★"` — star glyph (Unicode literal)
- `"${state.description.length}/2000"` — consider `stringResource(R.string.char_count_fmt, n, 2000)` → **translatable**

### Translatable — sample (full list surfaced during WS-C grep)

| Screen dir | Example literals |
|---|---|
| auth | "Back to sign-in options", "Forgot password?", "Mobile number", "6-digit code", "Resend code", "Email" |
| activeJob | "Camera permission required", "No back camera available on this device", "Grant Permission", "Capture", "Retake", "Retake Photo", "Retry Upload", "Confirm & Upload", "Continue job", "Upload failed: …" |
| myratings/rating | "My ratings", "No ratings yet", "Could not load ratings", "Overall: …", "Behaviour: …", "Skill: …", "Communication: …", "Punctuality: …" |
| complaint | "Describe the issue", "Issue type", "Issue received", "Submitting issue", "Report an issue" |
| earnings | "Finding your current area", "Open job" + day-of-week formatter |
| home / kyc / onboarding | "Something went wrong", "Retry", "Cancel", "Go back", "Comment (optional, <=500 chars)" |

Actual count: **~50 translatable literals** (56 raw `Text("...")` hits; ~6 are non-translatable format patterns/glyphs).

---

## 6. Testing Plan

| Layer | Test | Where |
|---|---|---|
| Domain | `LocaleRepositoryImplTest` — DataStore fake; default detection | `src/test/` |
| Domain | `SetAppLocaleUseCaseTest` — persist-before-apply order | `src/test/` |
| ViewModel | `LanguageSettingsViewModelTest` — state flip; use case called | `src/test/` |
| Strings parity | `StringsParityTest` — assert `values/strings.xml` and `values-hi/strings.xml` have identical key sets | `src/test/` (Robolectric) |
| CI grep gate | `grep -r 'Text("' ui/ && exit 1 || exit 0` — zero hardcoded literals | `.github/workflows/technician-ship.yml` |

---

## 7. Out of Scope (explicit exclusions)

- First-launch language picker screen — deferred indefinitely (auto-detect covers pilot)
- Noto Sans Devanagari font — W5 quality floor
- Paparazzi hi-locale goldens — W5-A
- RTL layout flips — Hindi is LTR; not needed
- Admin-web / api/ changes — unaffected

---

## 8. Branching

Branch off `origin/main`: `feat/w4-technician-hindi-i18n`.  
W1 (PR #213) verified UNSTABLE; zero file overlap with W4 except potential `libs.versions.toml` minor merge (WS-D handles it). Rebase onto main after W1 merges if needed.

**W3-3D risk:** PR #205 modifies `HomeservicesTechnicianApplication.kt` and `MainActivity.kt`. If W3-3D merges before W4's WS-A completes, pull `origin/main` and merge-resolve the Application.onCreate delta (3-4 lines, manual).
