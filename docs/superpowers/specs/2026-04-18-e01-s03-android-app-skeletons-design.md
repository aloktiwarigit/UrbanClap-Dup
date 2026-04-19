# E01-S03 Design — Android app skeletons (customer-app + technician-app)

**Date:** 2026-04-18
**Story:** `docs/stories/E01-S03-android-app-skeletons.md`
**Branch:** `E01-S03-android-app-skeletons` (local; 1 commit ahead of `main`)
**Status:** brainstorm complete — ready for `/superpowers:writing-plans`

This overlay resolves the ten Open Questions at the bottom of the story and slots eleven disaster fixes that a direct read of the two Android baselines (not the story) exposed. The story remains the primary source of truth for acceptance criteria.

Decisions already locked by E01-S01 / E01-S02 and not re-debated: workflow at repo-root `.github/workflows/<app>-ship.yml`; ancestor-check + scope-diff codex marker gate; OTel deferred; no paid SaaS; no Firebase SDKs yet; no root-of-repo Gradle layer; template residue (`docs/`, `plans/`, `specs/`) deleted per sub-project.

Scope confirmed with owner 2026-04-18 (Option A): E01-S03 remains a pure skeleton — two apps launch and render a smoke screen — end-user features land in E02/E03 stories per the sprint plan. No scope widening.

---

## 1. Decisions locked

| # | Question | Decision | Rationale |
|---|---|---|---|
| Q1 | Build tool — Gradle KTS vs JetBrains Amper | **Gradle Kotlin DSL + version catalog** | Amper is pre-1.0 and has no stable Compose + Hilt + Paparazzi + Kover story as of 2026-04. Gradle is the Google-recommended Android path, is what the E01-S01/E01-S02 CI patterns assume, and is what every agency-baseline example we copy from uses. Amper can be reconsidered once it hits 1.0 and has Paparazzi support; revisit criterion: Amper + Paparazzi + Hilt + Kover all at stable-release + Compose 1.9+ support. |
| Q2 | Compose version strategy — BOM vs per-artifact pins | **Compose BOM** (`androidx.compose:compose-bom`) | Single point of version truth; bumping Compose = one line change. Per-artifact pins drift trivially. Pin the BOM to the latest stable at implementation time — minimum `2024.11.00` (first BOM that ships Compose 1.7 + Kotlin 2 compatibility). If a newer stable BOM exists when the dev agent starts, use it; any change to the Compose Compiler plugin version must track `kotlin.plugin.compose` in the version catalog. |
| Q3 | DI — Hilt vs Koin | **Hilt** with **KSP** (not KAPT) | Google-standard; compile-time validation (Koin fails at first `get()`); template CLAUDE.md already says Hilt; every production Indian marketplace app (Swiggy, Zomato, CRED) uses Hilt or its precursor Dagger. KSP is 2× faster than KAPT and Google's recommended direction from Hilt 2.51+. |
| Q4 | Screenshot framework — Paparazzi vs Roborazzi vs AGP screenshot plugin | **Paparazzi `^1.3.5`** | JVM-only via layoutlib → fastest CI (no emulator, no Robolectric classpath). Template already assumes Paparazzi. `1.3.5` is the first version compatible with Compose Compiler on Kotlin 2 K2 (earlier versions throw layoutlib classloader errors). Roborazzi is slightly richer for Compose test APIs but ~2× slower and needs Robolectric. AGP's built-in `@ExperimentalScreenshotTest` plugin (AGP 8.5+) is still incubating — revisit when GA. |
| Q5 | Sentry init location — `Application.onCreate()` vs AndroidX App Startup | **`Application.onCreate()`** calling `SentryInitializer.init(this)` | One initializer — App Startup is overkill; introduces a `ContentProvider` + manifest entry + initializer-graph-ordering concerns for no benefit. The direct call matches the api/ `bootstrap.ts` single-line-import pattern. If we ever gain ≥ 3 init paths that need deterministic ordering, App Startup becomes the right answer and we'll introduce it in a dedicated observability-stack story. |
| Q6 | CI workflow split — two `<app>-ship.yml` vs one matrixed `android-ship.yml` | **Two workflows** (`customer-ship.yml` + `technician-ship.yml`) | `paths:` filters are evaluated at workflow scope, not per-matrix-job — a matrix workflow runs for any Android change. Two workflows give us independent PR status checks + symmetric shape with `api-ship.yml` + `admin-ship.yml` already on main. CI-minute delta is zero (the untouched workflow's `paths:` filter skips it). |
| Q7 | Package / applicationId | **`com.homeservices.customer`** + **`com.homeservices.technician`** | Play Store listings don't show "MVP" branding; the brand name `homeservices` is the placeholder committed in root CLAUDE.md ("will be renamed once brand-name is locked in Phase 2"). When the final brand lands, the applicationId is a Play-Store-lifecycle decision (can't rename published apps silently) — but both apps carry the `homeservices` prefix consistently so a single rename in a later phase changes both at once. |
| Q8 | JVM target | **Kotlin jvmTarget `JVM_17`** + **Gradle toolchain `21`** | Kotlin compiles bytecode at `JVM_17` (broadest AGP + library compatibility — Android's Kotlin runtime targets 17). Gradle itself runs under Java 21 (AGP 8.6 supports it, CI Temurin-21 is already the baseline in `ship.yml`). Setting the Gradle toolchain explicitly (`kotlin { jvmToolchain(21) }`) avoids local dev flakiness when the developer's `JAVA_HOME` is 17 or 22. |
| Q9 | Version catalog location | **Two duplicated `gradle/libs.versions.toml`** (one per app) | Skeleton stage; ~100 lines duplicated; zero runtime cost; fully independent Gradle builds (ADR-0001 discipline). Convergence is a later root-Gradle story (not scoped here — premature). Both catalogs MUST stay bit-identical at skeleton stage — a diff check between them is added to both CI workflows (see §3 disaster fix A11). |
| Q10 | Robolectric vs emulator for Hilt wiring test | **Robolectric** (JVM) | Keeps CI cheap — emulator startup is 2–4 min per job × two apps. The wiring path (Application → Hilt graph → `@Inject` resolution) is exactly what Robolectric tests well. Instrumented tests (Espresso + real emulator) get introduced in the first story that genuinely needs device-level surface (likely E02-S01 for biometrics or E03-S03 for maps). `TestRunner.kt` is stubbed in `app/src/androidTest/` so future stories don't reinvent conventions. |

---

## 2. AC revisions

**AC-4 (Detekt + ktlint + Android Lint) — fix Lint task to `lintDebug`, not `lintRelease`.**
The baseline ship.yml runs `./gradlew lintRelease` but release variants need a signing config, a ProGuard ruleset, and a keystore — none of which this story creates (AC-11 is explicit: no signing, no keystore, no release wiring). `lintRelease` would fail with "Release signing config not found" before Lint even runs. Change the story task + both CI workflows to invoke `lintDebug` consistently. AC-4 wording already says `lintDebug` — the baseline ship.yml is the stale one; the fix lands in T7.2.

**AC-6 (Paparazzi) — lock the `TESTING_AGAINST_LAYOUTLIB_MATCHING_COMPOSE_COMPILER` build flag off by default.**
Paparazzi 1.3.5 is compatible with Kotlin 2 K2, but on some AGP 8.6 + Compose BOM 2024.11 combinations it emits a "Compose Compiler version mismatch" warning that `allWarningsAsErrors = true` escalates to a build failure. The known fix (documented in Paparazzi #1623) is to suppress the specific Compose Compiler metadata check for the test classpath only via `kotlinOptions` scoped to `testDebug`. If the warning does NOT fire on the picked BOM version, skip this. The plan reserves a sub-task for this check and flags it as a 10-minute-spike risk.

**AC-8 (CI workflows) — replace `assembleRelease` + `lintRelease` + the naive marker check** as captured in §3 disaster fixes A1 + A2 + A5. AC-8 wording already correctly says `assembleDebug` — the fix is in the workflow file, not the AC text.

**AC-9 (Sentry init) — `installIn` the Application, not a standalone object.**
The story describes `SentryInitializer` as a callable `init(application)` helper. To match Hilt-world idioms (and to make the test simpler), implement it as a top-level `object SentryInitializer` with a single `init(app: Application)` function that reads `BuildConfig.SENTRY_DSN`. The test mocks `io.sentry.android.core.SentryAndroid.init` via MockK `mockkStatic(SentryAndroid::class)`. No change to the AC text; design clarification for the plan.

---

## 3. Disaster fixes (11 items → task slots)

> Items A1–A11 come from direct inspection of `customer-app/` + `technician-app/` (as they exist on `main`) — not from the story. They're gaps where the template / baseline is wrong or missing.

| # | Gap | Fix | Lands in |
|---|---|---|---|
| A1 | Baseline `ship.yml` runs `./gradlew lintRelease` — release lint needs signing + R8 config; this skeleton creates neither | Change every CI Lint invocation to `./gradlew lintDebug`. Story AC-4 already says this; the ship.yml is the stale source. | **T7.2** (both workflows) |
| A2 | Baseline `ship.yml` runs `./gradlew assembleRelease` — release APK assembly requires signing config + keystore | Change to `./gradlew assembleDebug`. Note in PR description that release assembly + signing + R8 land in a dedicated deploy story. | **T7.2** |
| A3 | Baseline codex step uses the naive `MARKER_SHA == HEAD_SHA` pattern — the exact chicken-and-egg paradox E01-S01 + E01-S02 already fixed | Replace verbatim with the **ancestor-check + scope-diff** block copied from `.github/workflows/api-ship.yml` (lines 73–98). Allowed scope: `.codex-review-passed` + `docs/reviews/**`. | **T7.3** |
| A4 | Baseline codex step is `::warning::` on missing marker + `exit 0` — contradicts CLAUDE.md "CI is the real gate" | Change to `::error::` + `exit 1` on missing marker. Same fix as E01-S01 D4. | **T7.3** |
| A5 | Baseline `ship.yml` has **no `paths:` filter** — every push/PR on any sub-project triggers both Android workflows, burning CI minutes | Add `paths:` filter on both `pull_request` and `push`: customer-ship.yml → `['customer-app/**', '.github/workflows/customer-ship.yml', '.codex-review-passed']`; technician-ship.yml mirrors. Including `.codex-review-passed` mirrors admin-ship.yml + api-ship.yml precedent so the codex step re-runs when the marker moves. | **T7.2** |
| A6 | Baseline `ship.yml` has **no `defaults.run.working-directory`** — `./gradlew` invoked from repo root will fail (gradlew lives in `<app>/gradlew`) | Add `defaults.run.working-directory: customer-app` / `technician-app` at job scope. BMAD-gate `test -f` lookups override with `working-directory: ${{ github.workspace }}` per-step, identical to admin-ship.yml pattern. | **T7.2** |
| A7 | Baseline `ship.yml` has **no `env.GIT_SHA`** — so CI-built APKs stamp `BuildConfig.GIT_SHA = "dev"` in the smoke screen footer | Add `env: { GIT_SHA: ${{ github.sha }} }` at job scope. The Kotlin build reads via `System.getenv("GIT_SHA") ?: "dev"` in `buildConfigField`. | **T7.2** |
| A8 | Baseline Semgrep config uses `p/ci` — noisy on GitHub-Actions-standard idioms (~15 false positives) | Replace with `config: p/kotlin p/owasp-top-ten p/secrets`. Matches api/ pattern minus `p/typescript`/`p/nodejs`. | **T7.4** |
| A9 | **Gradle wrapper is not committed** in either baseline — no `gradlew`, no `gradlew.bat`, no `gradle-wrapper.jar`, no `gradle-wrapper.properties`. CI would fail immediately on `./gradlew` not found | Generate the wrapper in each app via `gradle wrapper --gradle-version=8.11 --distribution-type=bin` and commit the four files (`gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.jar`, `gradle/wrapper/gradle-wrapper.properties`). Set `distributionSha256Sum` in the properties file for reproducibility. | **T2.1** (extend) |
| A10 | Template residue is more than `docs/` + `plans/` + `specs/` — each app also has `docs/stories/.gitkeep`, `plans/.gitkeep`, `specs/.gitkeep`, and empty `docs/adr/` + `docs/stories/` subdirs. `git rm -rf` on the parent dirs catches the `.gitkeep` but Windows git may leave the empty tree | Explicit `git rm` the `.gitkeep` files + `git rm -r --cached` the parent dirs; confirm with `git status` showing the dirs gone. | **T1.2** (extend) |
| A11 | `libs.versions.toml` is duplicated between the two apps (Q9 decision); drift is inevitable unless enforced | Add a **drift check** step in each CI workflow: `diff customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml` — exits 0 only if the two files are byte-identical. On intentional divergence in a future story, delete the check in the same PR with a rationale. | **T7.2** (new sub-step T7.2a) |

**Net task-list delta from the story:** three new sub-tasks (T2.1 extended to cover wrapper generation + sha; T1.2 extended to cover `.gitkeep` + empty dirs; T7.2a — catalog-drift check). Five revisions inside T7 (lintDebug, assembleDebug, paths filter, working-directory, GIT_SHA env). One revision inside T7.3 (ancestor-check + hard-error codex step). One Semgrep rule-set change (T7.4). No new top-level tasks.

---

## 4. Source-tree delta from story §Source Tree Components to Touch

**Add to planned creation per app** (not in the story's source-tree block):

- `<app>/gradlew` (Linux/macOS wrapper script)
- `<app>/gradlew.bat` (Windows wrapper script)
- `<app>/gradle/wrapper/gradle-wrapper.jar` (wrapper binary — committed, not gitignored)
- `<app>/gradle/wrapper/gradle-wrapper.properties` (pin Gradle 8.11 + `distributionSha256Sum`)

**Confirm as CREATE (story says CREATE; restated here for the plan):**

- `<app>/detekt.yml` — full rule set, `build.maxIssues: 0`, no baseline

**Delete (template residue beyond story T1.2):**

- `customer-app/docs/stories/.gitkeep`, `customer-app/plans/.gitkeep`, `customer-app/specs/.gitkeep`
- `customer-app/docs/adr/` (empty), `customer-app/docs/stories/` (empty after .gitkeep removal)
- Same set under `technician-app/`

**No change to story's file list otherwise.**

---

## 5. Paparazzi wiring specifics (Q4 locked; capturing the gotchas)

- Apply the plugin at app-module level only: `alias(libs.plugins.paparazzi)` inside `app/build.gradle.kts`. Do NOT apply at root.
- Snapshot images live at `app/src/test/snapshots/images/` (Paparazzi default — do not override).
- `SmokeScreenPaparazziTest.kt` uses `@get:Rule val paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)` for the default; a second test method switches `deviceConfig` mid-test for dark mode via `Paparazzi.apply { prepare(description); ... }` OR uses two separate `@Test` methods that each set `composable = { HomeservicesCustomerTheme(darkTheme = true) { SmokeScreen(...) } }`. The plan picks the two-methods approach — simpler, more diff-able.
- `./gradlew verifyPaparazziDebug` (not `record`) is the CI invocation. First-time local run uses `recordPaparazziDebug` to emit the PNGs which are then committed.
- Kotlin 2 + Compose Compiler plugin may emit a Compose Compiler metadata warning under Paparazzi's classloader; if it does, the fix is a scoped `suppressWarnings` for `testDebug` only (not globally — globally would mask real warnings elsewhere). Plan reserves a 10-minute verification spike with a concrete fallback.

---

## 6. Hilt + KSP + Kotlin 2 wiring specifics (Q3 locked)

- KSP version pin MUST match Kotlin version: `libs.plugins.ksp = "2.0.21-1.0.28"` if Kotlin is `2.0.21`. A mismatch (e.g. KSP `2.0.20-X`) errors out with "KSP requires Kotlin 2.0.21".
- Hilt Gradle plugin: `libs.plugins.hilt = "com.google.dagger.hilt.android:2.52"` — apply at app-module level.
- Hilt compiler via KSP: `ksp("com.google.dagger:hilt-android-compiler:2.52")`. Do NOT use `kapt(...)` — the template's CLAUDE.md was written pre-KSP-default and may need a line refresh later; out of scope for this story.
- `@HiltAndroidApp` on the Application class; `@AndroidEntryPoint` on `MainActivity`.
- `HiltWiringTest.kt` uses `@RunWith(RobolectricTestRunner::class)` + `@HiltAndroidTest` + `@Config(application = HiltTestApplication::class)`. No `@Config(sdk = ...)` — let Robolectric pick the default SDK level (matches compileSdk).

---

## 7. Kotlin compiler flag specifics (AC-3 locked)

Each app's `app/build.gradle.kts` `kotlin { compilerOptions { ... } }` block (using the new `compilerOptions` DSL — **not** the legacy `kotlinOptions` DSL which is deprecated in AGP 8.6+):

```kotlin
kotlin {
    jvmToolchain(21)
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
        allWarningsAsErrors.set(true)
        freeCompilerArgs.addAll(
            "-Xexplicit-api=strict",
            "-Xjsr305=strict",
        )
    }
}
```

The `kotlinOptions` block is explicitly avoided (it works but is deprecated). Plan Task 3 adopts the new DSL.

---

## 8. Test plan clarifications

- `BuildInfoProviderTest.kt` — pure JUnit 5 (`@Test` from `org.junit.jupiter.api`). No Android framework; no Robolectric. Fastest tests stay fastest.
- `SentryInitializerTest.kt` — JUnit 5 + MockK. Two cases: DSN blank → `SentryAndroid.init` never invoked; DSN non-blank → invoked once with `tracesSampleRate = 0.1`. Uses `mockkStatic(SentryAndroid::class)` + `verify(exactly = 1)`.
- `HiltWiringTest.kt` — Robolectric + `@HiltAndroidTest` + injects `BuildInfoProvider` into the test class, asserts non-null. One test method only.
- `SmokeScreenPaparazziTest.kt` — Paparazzi. Two methods: `smokeScreen_lightTheme_matchesSnapshot` + `smokeScreen_darkTheme_matchesSnapshot`. Both at `DeviceConfig.PIXEL_5`.
- Coverage exclusions (Kover DSL — not raw regex): `*.Hilt_*`, `*.*_Factory`, `*.*_HiltModules*`, `*.ComposableSingletons*`, `*.BuildConfig`, `*.R`, `*.R$*`, `*.Application` (the `@HiltAndroidApp` class body is trivial wiring), `*.MainActivity` (the `setContent { ... }` body is trivial and covered implicitly by the Paparazzi test's render).
- **Do not exclude** `SmokeScreen.kt`, `SentryInitializer.kt`, `BuildInfoProvider.kt`, `AppModule.kt` — these are the actual testable surface.
- Kover XML report (`koverXmlReport`) is written to `app/build/reports/kover/report.xml` — CI can upload as an artifact in a later story; not wired in this one.

---

## 9. Explicitly out of scope (deferred to later stories)

- OpenTelemetry instrumentation on Android — future observability story (likely E07 or a dedicated obs story in E01 overflow).
- Firebase SDKs (Phone Auth, FCM, Storage, Crashlytics) — first introduced in E02-S01 (customer auth) with only the auth SDK; FCM lands in E04-S03 (live tracking subscription); Storage in E06-S02 (guided photos); Crashlytics **never** (Sentry is the error-tracking choice per ADR-0007).
- Truecaller SDK — E02-S01 customer auth.
- Ktor networking + OpenAPI-generated Kotlin client — first introduced when the first real API call is made from Android (likely E02-S01 login-status fetch).
- Room (local DB) — first introduced in E06-S01 (technician active-job offline queue).
- GrowthBook Android SDK + PostHog Android SDK — introduced with the first feature flag / first event, respectively.
- Espresso + real-device/emulator instrumented tests — E02-S01 biometrics + E03-S03 Google Maps.
- Release signing config, keystore, ProGuard/R8 rules, Play Store wiring — dedicated deploy story.
- `baselineprofile` for cold-start perf — dedicated perf story.
- Android Accessibility Scanner CI integration — dedicated a11y story (CI runs Lint a11y checks only in this skeleton).
- Shared `design-system/` Gradle module — E01-S04 (with both apps as first consumers).
- Cross-app convergence of `libs.versions.toml` (central catalog via composite build or repo-root Gradle) — later root-Gradle story.
- Update to each app's `.claude/settings.json` pre-push hook to use the ancestor-check pattern — CI is the real gate (per CLAUDE.md); local hook stays naive until a later tooling story tunes it.
- Update to each app's `CLAUDE.md` to reflect KSP-not-KAPT + the current dep subset — template refresh; out of skeleton scope.

---

## 10. Risk register (known, accepted)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Paparazzi 1.3.5 + Compose Compiler metadata warning escalates to build error under `allWarningsAsErrors = true` | M | M (blocks PR) | 10-min verification spike in T4.6; scoped suppression for `testDebug` only if the warning fires |
| Gradle wrapper generation locks Gradle `8.11` but AGP 8.6 has a minimum Gradle of 8.7 — pin must stay ≥ 8.7 | L | L | Pin is 8.11; upper bound not reached; document in catalog comment |
| KSP version drift with Kotlin version during a future dep bump | M | L | Plan Task 8 adds a note to ADR-0007 amendment; CI catches at compile-time anyway |
| Two `libs.versions.toml` drift between apps | H | M (inconsistency debt) | CI drift check (A11); explicitly named as tech debt to resolve in a root-Gradle story |
| Robolectric 4.14 + Android SDK 35 edge cases | L | M (flaky Hilt tests) | Single trivial wiring test at skeleton stage; if flaky, fall back to `@Config(sdk = 34)` |
| Sentry Android 7.x API changes in minor bumps | L | L | Pin minor in catalog; CI catches breakage |
| `./gradlew assembleDebug` cold-build > 10 min on a GitHub-hosted runner | M | L | `gradle/actions/setup-gradle@v4` enables Build Cache by default; first PR is the worst case |
| Detekt fresh-config flags Compose `@Composable` function-name conventions (PascalCase) as `FunctionNaming` violations | H | L (false positive) | Add the standard Compose exclusion in `detekt.yml`: allow PascalCase function names if annotated `@Composable` — copy the published Compose-Detekt config fragment |
| Windows `git mv` on a directory leaves an empty tree | M | L | Explicit `git rm -r <dir>` + `rmdir` follow-up in T7.5; mirrors E01-S02 N10 |
| Hilt Gradle plugin + Kotlin 2.0.21 version handshake | L | M | Pin Hilt to `2.52` (known-good); verify in T3.4; fallback is `2.51.1` |

---

## 11. Definition of "plan-ready"

- Resolves the 10 open questions in the story — ✅
- Revises AC-4 (lintDebug), AC-6 (Paparazzi + Kotlin 2 edge), AC-8 (CI fixes batched), AC-9 (Sentry init shape) — ✅
- Slots 11 disaster fixes (A1–A11) into named task slots — ✅
- Lists explicit out-of-scope items (12 items) — ✅
- Target commit count for implementation (extrapolating from E01-S01: 10 commits, E01-S02: 12 commits, E01-S06: 16 commits): **~18 TDD-ordered commits** (two apps × the E01-S02 cadence minus cross-app duplication savings).
- Committed to git — _pending_

---

## 12. Next step

Fresh session → `/superpowers:writing-plans` using this design + the story spec. Commit the plan to `plans/E01-S03.md`. Then fresh session → `/superpowers:executing-plans` (TDD).
