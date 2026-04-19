# Story E01.S03: Android app skeletons — customer-app + technician-app (Kotlin + Compose + Hilt + Paparazzi + Sentry + green CI)

Status: ready-for-dev

> **Epic:** E01 — Foundations, CI & Design System (`docs/stories/README.md` §E01)
> **Sprint:** S1 (wk 1–2) · **Estimated:** ~1.5 dev-days (two apps, high task overlap) · **Priority:** **P0 / blocks all other `customer-app/` stories (E02-S01, E03-S02, E03-S03, E04-S01..S03, E06-S03, E06-S05, E07-S01, E07-S02, E07-S05) and all `technician-app/` stories (E02-S02, E02-S03, E05-S03, E06-S01, E06-S02, E08-S01..S04) plus E01-S04 (design-system module consumers)**
> **Sub-projects:** `customer-app/` and `technician-app/` (both touched in this one story)

---

## Story

As the **solo founder-operator (Alok)** building homeservices-mvp on Claude Max + Codex,
I want both Android sub-projects — `customer-app/` and `technician-app/` — to be runnable Kotlin 2 + Jetpack Compose + Hilt + Paparazzi + Sentry skeletons, each rendering a trivial "homeservices customer / technician" smoke screen, each producing a debug APK from `./gradlew assembleDebug`, each gated by an independent `customer-ship.yml` / `technician-ship.yml` workflow at the **repo-root** `.github/workflows/`,
so that **every subsequent Android story (auth, service discovery, booking, dispatch, active-job, earnings, complaints, safety) starts from a stable, convention-locked, lint-clean, screenshot-tested, BMAD-gated baseline — not two empty `app/src/main/` directories and two dead workflows at sub-project paths.**

This story turns the placeholder agency-baseline scaffolds (both `customer-app/` and `technician-app/` today are literally `app/src/main/` empty trees + a `ship.yml` at a path GitHub Actions never reads + the `docs/`, `plans/`, `specs/` template residue) into two canonical homeservices-mvp Android skeletons aligned with **ADR-0001** (Kotlin 2 + Compose + two separate apps sharing only a Gradle module in a later story), **ADR-0007** (zero paid SaaS — no Firebase Crashlytics, no Bugsnag, no Firebase Performance, no Detekt Pro), **architecture §5–§7** (Compose theming conventions + Paparazzi gate + NFR-M-5 `-Werror` + NFR-O-2 Sentry), and the two-disaster-fix pattern already proven in E01-S02 (workflow-at-wrong-path + self-referential codex-marker paradox).

The story deliberately **does NOT** create a shared `design-system/` Gradle module — that is E01-S04's job. Each app in this story carries its own minimal placeholder `theme/` package; E01-S04 extracts the shared module and the two apps migrate to it as its first consumers.

---

## Acceptance Criteria

> All acceptance criteria are BDD-formatted (Given/When/Then) and verified by automated tests + the two CI workflows (`customer-ship.yml`, `technician-ship.yml`). Unless otherwise noted, each AC applies **identically** to both apps; where the two diverge, it is called out explicitly.

### AC-1 · `./gradlew assembleDebug` succeeds on both apps and produces runnable debug APKs
- **Given** a developer at repo root runs `./gradlew :app:assembleDebug` inside `customer-app/` and separately inside `technician-app/`
- **Then** each Gradle build exits 0 within ≤ 5 min cold / ≤ 90 s warm on a typical dev machine
- **And** each build emits an APK at `<app>/app/build/outputs/apk/debug/app-debug.apk`
- **And** each APK's `AndroidManifest.xml` declares the correct `applicationId`: `com.homeservices.customer` (customer-app) / `com.homeservices.technician` (technician-app)
- **And** each APK installs (`adb install`) and launches on Android 8.0 (API 26) and Android 15 (API 35) emulators without crashing
- **(NFR-M-5 build-green enforcement; NFR-O-2 Sentry init must not crash on missing DSN)**

### AC-2 · Smoke screen renders on launch with correct copy + token-styled theme
- **Given** the debug APK is installed and launched
- **Then** the single activity (`MainActivity`) renders a Compose screen containing:
  - A top-aligned brand string: `"homeservices customer"` (customer-app) / `"homeservices technician"` (technician-app)
  - A subtitle line: `"skeleton — ready for development"`
  - A footer showing `version` (from `BuildConfig.VERSION_NAME`, expected `0.1.0`) and `commit` (8-char prefix of `BuildConfig.GIT_SHA` — `"dev"` locally, actual commit SHA in CI)
- **And** the screen uses the app's Compose theme (`HomeservicesCustomerTheme` / `HomeservicesTechnicianTheme`) with Material 3 light + dark color schemes that respect the system setting
- **And** no runtime crashes, no Compose recomposition loops, no Sentry events fire during render (verified by Paparazzi snapshot + smoke run)

### AC-3 · Kotlin compiles with `-Werror` + explicit API mode + K2 compiler
- **Given** the codebase
- **When** `./gradlew compileDebugKotlin` runs in either app
- **Then** the Kotlin K2 compiler (`languageVersion = 2.0+`) runs with the following strict settings enabled in the app-level `build.gradle.kts`:
  - `allWarningsAsErrors = true` (Kotlin `-Werror` equivalent)
  - `freeCompilerArgs` includes `-Xexplicit-api=strict` (explicit API mode — every public declaration requires visibility + return-type annotations)
  - `jvmTarget = JvmTarget.JVM_17`
- **And** the build fails on ANY compiler warning including deprecations, unused imports, and API-stability warnings — **not** just errors
- **(NFR-M-5 enforcement for Kotlin, matching the TS `strict: true` + `--max-warnings 0` policy locked for `api/` and `admin-web/`)**

### AC-4 · Detekt + ktlint + Android Lint all report zero issues (warnings fail the build)
- **Given** the codebase
- **When** `./gradlew detekt ktlintCheck lintDebug` runs in either app
- **Then** each of the three checks exits 0 with **zero** findings at severity `warning` or above
- **And** `detekt.yml` is committed at each app's root with: `build.maxIssues: 0`, `style.*` enabled, `complexity.*` enabled, `naming.*` enabled, `comments.*` enabled, `potential-bugs.*` enabled; the baseline file is deliberately absent (no suppressions — skeleton is clean)
- **And** ktlint follows official Kotlin style (no project-specific overrides this early); invocation via the `org.jlleitschuh.gradle.ktlint` plugin (OSS, Apache-2.0)
- **And** Android Lint runs against `lintDebug` (not `lintRelease` — release signing is out of scope) with `warningsAsErrors = true` and `checkDependencies = false`
- **(NFR-M-5 enforcement)**

### AC-5 · Hilt is wired end-to-end and proven by a DI smoke test
- **Given** the codebase
- **When** `./gradlew testDebugUnitTest` runs the Hilt wiring test
- **Then** the test asserts that the `HomeservicesCustomerApplication` / `HomeservicesTechnicianApplication` class is annotated `@HiltAndroidApp` and that a trivial `@Inject`-constructed class (`BuildInfoProvider`) can be resolved by a `@HiltAndroidTest`-annotated test using `HiltAndroidRule` + `launchActivity`
- **And** KSP is the Hilt processor (not KAPT — KSP is ~2× faster and Google's recommended direction per Hilt 2.51+)
- **And** no `@Module` other than the single application `@InstallIn(SingletonComponent::class) object AppModule` exists at skeleton stage — feature modules land in their own stories
- **(Pattern lock for every future Android story — per §Patterns to Reuse)**

### AC-6 · Paparazzi screenshot test passes on the smoke screen
- **Given** the codebase
- **When** `./gradlew verifyPaparazziDebug` runs in either app
- **Then** at minimum one Paparazzi test class exists (`SmokeScreenPaparazziTest`) capturing the smoke screen in both light and dark mode at a pixel-3-default device profile
- **And** golden images are committed under `<app>/app/src/test/snapshots/images/` (Paparazzi's default snapshot dir) — the test passes on first run by recording then verifying
- **And** CI runs `verifyPaparazziDebug` (not `recordPaparazziDebug`) — any pixel drift fails the PR
- **And** Paparazzi version is `^1.3.5` (the first version that officially supports Compose 1.7 + Kotlin 2.0; older versions throw layoutlib classloader errors on the K2 toolchain)
- **(NFR-A-1 / NFR-U-5 visual-regression floor; matches the Lighthouse+axe floor established for admin-web)**

### AC-7 · JUnit 5 + MockK unit tests pass; Kover coverage ≥ 80%
- **Given** the codebase
- **When** `./gradlew testDebugUnitTest koverVerify koverXmlReport` runs in either app
- **Then** unit tests exit 0 with Kover coverage thresholds (in `build.gradle.kts` `kover` block): lines ≥ 80%, branches ≥ 80%, instructions ≥ 80%
- **And** the Kover HTML report is written to `<app>/app/build/reports/kover/html/`
- **And** at least these test files exist and pass in each app: `BuildInfoProviderTest.kt` (pure unit — no Android framework), `SentryInitializerTest.kt` (verifies no-op when DSN is empty, init-once when set — mocks `io.sentry.android.core.SentryAndroid`), `SmokeScreenPaparazziTest.kt` (Paparazzi — counts toward coverage of Compose composables)
- **And** Kover explicitly **excludes** generated code (Hilt `Hilt_*`, Compose `ComposableSingletons$*`, `BuildConfig`, `R`, `R$*`) — the exclusions are declared in the `kover` DSL block, not via raw regex comments
- **(NFR-M-4 enforcement for Android, matching the Vitest 80% floor on api/ and admin-web/)**

### AC-8 · `customer-ship.yml` and `technician-ship.yml` at repo-root `.github/workflows/` are green on a PR to `main`
- **Given** a PR is opened from this story's feature branch (`E01-S03-android-app-skeletons`) to `main`
- **When** GitHub Actions discovers and runs `.github/workflows/customer-ship.yml` and `.github/workflows/technician-ship.yml` (the **two workflows at repo-root** — applying the E01-S02 fix verbatim; **not** at `customer-app/.github/...` or `technician-app/.github/...`)
- **Then** each workflow passes every step: BMAD artifacts gate (`exit 1` on missing), `./gradlew ktlintCheck`, `./gradlew detekt`, `./gradlew lintDebug`, `./gradlew testDebugUnitTest`, `./gradlew koverVerify koverXmlReport`, `./gradlew verifyPaparazziDebug`, `./gradlew assembleDebug`, Semgrep SAST (`p/kotlin p/owasp-top-ten p/secrets`), and codex-review marker ancestor-check
- **And** each workflow has a `paths:` filter tightly scoped to its sub-project: customer-ship.yml → `['customer-app/**', '.github/workflows/customer-ship.yml']`; technician-ship.yml → `['technician-app/**', '.github/workflows/technician-ship.yml']` (so unrelated changes to `api/`, `admin-web/`, or the *other* Android app do not spend CI minutes here)
- **And** each workflow sets `defaults.run.working-directory: customer-app` / `technician-app` so `./gradlew` invocations resolve from the sub-project directory while the BMAD-gate `test -f` lookups still use workspace-root paths
- **And** each workflow uses the **ancestor-check + scope-diff** codex-marker pattern (verbatim copy from `.github/workflows/api-ship.yml`) — **not** a naive `MARKER_SHA == HEAD_SHA` equality check
- **And** each workflow sets `env.GIT_SHA: ${{ github.sha }}` at job scope so the `BuildConfig.GIT_SHA` injection in the Gradle build picks up the real commit (not `"dev"`) during CI builds
- **And** each workflow uses `gradle/actions/setup-gradle@v4` (Gradle Build Cache enabled via its default behaviour) and `actions/setup-java@v4` pinned to `distribution: temurin, java-version: 21`

### AC-9 · Sentry Android SDK initialized with early-return when DSN unset; no OTel in this story
- **Given** the app starts (`Application.onCreate()`)
- **And** `BuildConfig.SENTRY_DSN` (injected from an optional `SENTRY_DSN` env var at build time, empty string default) is the empty string
- **Then** `SentryInitializer.init(application)` returns without calling `SentryAndroid.init { ... }` — verified in `SentryInitializerTest.kt` via MockK
- **Given** `BuildConfig.SENTRY_DSN` is a non-empty DSN
- **Then** `SentryAndroid.init { options -> options.dsn = dsn; options.tracesSampleRate = 0.1 }` is called exactly once
- **And** Sentry Android SDK version is `^7` (current major as of 2026-04; supports Compose + Kotlin 2.0)
- **And** `@opentelemetry/*` / `io.opentelemetry.*` / `io.sentry.opentelemetry.*` packages are **NOT** added in this story — defer entirely, mirroring the E01-S01 + E01-S02 deferrals. A single TODO comment in `SentryInitializer.kt` points at the future observability story
- **(NFR-O-2 enforcement via Sentry only; NFR-O-6 deferred)**

### AC-10 · Project metadata, rename, package ids, README, gitignore hygiene
- **Given** each app's root
- **Then** `<app>/settings.gradle.kts` has `rootProject.name = "homeservices-customer"` / `"homeservices-technician"`
- **And** `<app>/app/build.gradle.kts` defines `namespace = "com.homeservices.customer"` / `"com.homeservices.technician"` and `defaultConfig.applicationId` identical to the namespace (same pattern as the Play Store listing will use)
- **And** `<app>/app/build.gradle.kts` has `defaultConfig.versionCode = 1`, `versionName = "0.1.0"`, `minSdk = 26`, `targetSdk = 35`, `compileSdk = 35`
- **And** `<app>/gradle.properties` has `org.gradle.jvmargs=-Xmx4g -Dfile.encoding=UTF-8`, `org.gradle.caching=true`, `org.gradle.configuration-cache=true`, `android.useAndroidX=true`, `kotlin.code.style=official`
- **And** `<app>/README.md` is rewritten from the template placeholder (`# <Client App> — Android`) to the real skeleton README with: 5-line project description, Quick start (`./gradlew assembleDebug`, `./gradlew installDebug`), Test (`./gradlew testDebugUnitTest koverVerify verifyPaparazziDebug`), Lint (`./gradlew ktlintCheck detekt lintDebug`), Conventions block documenting the Compose-only / Hilt-only / tokens-only / `-Werror` rules
- **And** the template residue (`customer-app/docs/`, `customer-app/plans/`, `customer-app/specs/`, `technician-app/docs/`, `technician-app/plans/`, `technician-app/specs/`) is deleted (matching the E01-S02 N1 cleanup)
- **And** root `.gitignore` gains an explicit `# customer-app/` block and `# technician-app/` block covering `<app>/.gradle/`, `<app>/build/`, `<app>/app/build/`, `<app>/local.properties`, `<app>/.idea/`, `<app>/captures/`, `<app>/app/release/`

### AC-11 · `local.properties` never committed; no secrets, no keystore, no `google-services.json`
- **Given** the repository
- **Then** `<app>/local.properties` (contains the `sdk.dir` path — user-specific) is gitignored for both apps (covered under AC-10 `.gitignore` block)
- **And** **no** signing config block is added to either `app/build.gradle.kts` — release signing + keystore + Play Store wiring is out of scope for this skeleton (belongs in a dedicated deploy story)
- **And** **no** `google-services.json` is added to either app — Firebase SDK wiring belongs in **E02-S01** (customer auth) and **E02-S02** (technician auth); adding it here introduces config-file rot + false negatives in CI
- **And** Semgrep `p/secrets` does not flag any committed file
- **(NFR-S-9 secrets hygiene)**

### AC-12 · Zero paid SaaS dependencies introduced
- **Given** each app's `libs.versions.toml` (Gradle version catalog) + `build.gradle.kts` files + any `settings.gradle.kts` plugin pins
- **Then** every dependency added in this story is OSS (Apache-2.0, MIT, BSD, EPL, or equivalent) and — where applicable — on the approved free-tier list at `docs/adr/0007-zero-paid-saas-constraint.md` §"Known free-tier dependencies"
- **And** the dependency list is documented in §Library/Framework Requirements below
- **And** no paid SDK is present: **no** Firebase Crashlytics paid plan, **no** Bugsnag, **no** Instabug, **no** Braze/Airship/Leanplum messaging, **no** Datadog/New Relic Android, **no** AppsFlyer/Adjust attribution, **no** Sentry paid-tier-only features
- **And** ADR-0007 is amended (or its §"Known free-tier dependencies" table is augmented) to list every new build/test-time dev dependency introduced by this story (matching the E01-S06 pattern where the ADR was amended rather than replaced)

---

## Tasks / Subtasks

> **TDD discipline (per CLAUDE.md):** every task that introduces production code writes the failing test first, then makes it pass, then refactors. Sub-tasks are ordered for that.
>
> **Two-app execution discipline:** every `T<n>.<m>` below applies to **both** apps unless the sub-task is explicitly prefixed `[customer-app]` or `[technician-app]`. Execute the whole task against `customer-app` first, commit, then repeat against `technician-app` and commit — resist the temptation to commit a half-migration. (Per root CLAUDE.md: small commits, no `--amend` on pushed work.)

- [ ] **T1 — Project metadata, configs, README, gitignore, template-residue cleanup** (AC-10, AC-11, AC-12)
  - [ ] T1.1 Rewrite each app's `README.md` per AC-10; delete the `# <Client App>` placeholder
  - [ ] T1.2 Delete template residue: `customer-app/docs/`, `customer-app/plans/`, `customer-app/specs/`; same for `technician-app/`
  - [ ] T1.3 Add `# customer-app/` and `# technician-app/` blocks to root `.gitignore` per AC-10
  - [ ] T1.4 Create each app's `.editorconfig` (2-space, LF, UTF-8, trim trailing ws, except `*.kt` / `*.kts` at 4-space per Kotlin convention)
  - [ ] T1.5 Amend ADR-0007 (or append to its "Known free-tier dependencies" table) for every new dev dep introduced in T3+ (update as a final sweep at the end of this task list)

- [ ] **T2 — Gradle wrapper + version catalog + settings + gradle.properties** (AC-1, AC-3, AC-10)
  - [ ] T2.1 Generate the Gradle wrapper in each app at `gradle/wrapper/gradle-wrapper.properties` pinning Gradle `^8.11` (the first version with stable configuration-cache + K2-compatible AGP handshake)
  - [ ] T2.2 Create each app's `settings.gradle.kts` with `pluginManagement { repositories { gradlePluginPortal(); google(); mavenCentral() } }`, `dependencyResolutionManagement { repositories { google(); mavenCentral() } }`, `rootProject.name = "homeservices-{customer,technician}"`, `include(":app")`
  - [ ] T2.3 Create each app's `gradle/libs.versions.toml` — **identical** in both apps at skeleton stage; content lives in §Library/Framework Requirements below. Deliberately duplicated across both apps; centralization is a cross-app concern to be handled in a later root-Gradle story (not now, not here — stays with two independent Gradle roots)
  - [ ] T2.4 Create each app's `gradle.properties` per AC-10 (jvmargs, caching, configuration-cache, androidx, code.style)
  - [ ] T2.5 Commit (one commit per app)

- [ ] **T3 — App-level build.gradle.kts + plugin wiring** (AC-1, AC-3, AC-4, AC-5, AC-6, AC-7, AC-9, AC-10)
  - [ ] T3.1 Create each app's top-level `build.gradle.kts` (repositories + plugin version declarations via `alias(libs.plugins.*)` — no logic here; AGP quirk means plugins must be declared at root with `apply false`)
  - [ ] T3.2 Create each app's `app/build.gradle.kts`: plugins (AGP, Kotlin 2, Compose, Hilt, KSP, Kover, Detekt, ktlint, Paparazzi), `android { }` block per AC-10, `buildFeatures { compose = true; buildConfig = true }`, `kotlinOptions` with `-Werror` + explicit-api + JVM_17, `buildConfigField("String", "SENTRY_DSN", "\"${System.getenv("SENTRY_DSN") ?: ""}\"")` + `GIT_SHA` (`System.getenv("GIT_SHA") ?: "dev"`)
  - [ ] T3.3 Wire Kover, Detekt, ktlint, Paparazzi blocks — Kover thresholds 80/80/80 with exclusions per AC-7
  - [ ] T3.4 Confirm `./gradlew :app:dependencies` resolves cleanly with **no** unresolved modules — no `google-services` plugin, no Firebase plugins (AC-11)

- [ ] **T4 — Application + MainActivity + Compose theme + smoke screen** (AC-2, AC-5, AC-9)
  - [ ] T4.1 (RED) Write `SmokeScreenPaparazziTest.kt` under `app/src/test/kotlin/com/homeservices/{customer,technician}/ui/` — captures `SmokeScreen()` composable under light + dark themes at `DeviceConfig.PIXEL_5` (or similar); test fails because `SmokeScreen` doesn't exist yet
  - [ ] T4.2 (GREEN) Implement `app/src/main/kotlin/com/homeservices/{customer,technician}/HomeservicesCustomerApplication.kt` / `HomeservicesTechnicianApplication.kt` annotated `@HiltAndroidApp`, `onCreate()` calls `SentryInitializer.init(this)`
  - [ ] T4.3 Implement `MainActivity.kt` (a single `ComponentActivity` annotated `@AndroidEntryPoint`) that `setContent { HomeservicesCustomerTheme { SmokeScreen(buildInfo = viewModel.buildInfo) } }` (technician-app uses `HomeservicesTechnicianTheme` with slightly different copy — the brand word differs; no other divergence)
  - [ ] T4.4 Implement `ui/theme/Color.kt`, `Theme.kt`, `Type.kt` — minimal Material 3 theme with `LightColorScheme` + `DarkColorScheme` and a body/display typography. **Do not** try to match the UX §5 token palette pixel-perfectly here — that's E01-S04's job; use Material 3 defaults + one placeholder `brand = Color(0xFF0B5FEE)` swatch to prove the theming path
  - [ ] T4.5 Implement `ui/SmokeScreen.kt` — a `@Composable` taking `BuildInfo` and rendering the AC-2 copy; uses only Material 3 + the theme; no user input, no navigation
  - [ ] T4.6 (GREEN) Paparazzi test passes; snapshots committed under `app/src/test/snapshots/images/`
  - [ ] T4.7 `AndroidManifest.xml` declares the application class + MainActivity + `INTERNET` permission only (needed by Sentry; nothing else — no FCM, no Firebase, no location, no camera in this story)

- [ ] **T5 — Hilt + BuildInfo provider + DI smoke test** (AC-5, AC-7)
  - [ ] T5.1 (RED) Write `BuildInfoProviderTest.kt` — pure unit test asserting `BuildInfoProvider(version = "0.1.0", gitSha = "abcdef1234").shortSha == "abcdef12"`
  - [ ] T5.2 (GREEN) Implement `di/BuildInfoProvider.kt` as a constructor-injected class
  - [ ] T5.3 Create `di/AppModule.kt` annotated `@Module @InstallIn(SingletonComponent::class)`; `@Provides` `BuildInfo` built from `BuildConfig.VERSION_NAME` + `BuildConfig.GIT_SHA`
  - [ ] T5.4 (RED → GREEN) Write `HiltWiringTest.kt` annotated `@HiltAndroidTest` with `HiltAndroidRule` that injects `BuildInfoProvider` into the test and asserts non-null
  - [ ] T5.5 Add `HiltTestApplication` shim + `HiltAndroidTestRunner` in `app/src/androidTest/kotlin/.../TestRunner.kt` — but run this test under Robolectric so it stays on the JVM and doesn't require an emulator (keep CI cheap; Espresso + real-device tests land in a later story)

- [ ] **T6 — Sentry initializer + unit tests** (AC-9, AC-7)
  - [ ] T6.1 (RED) Write `SentryInitializerTest.kt` — MockK `io.sentry.android.core.SentryAndroid`; two cases: DSN empty → `init` never called; DSN set → `init` called once with `tracesSampleRate = 0.1`
  - [ ] T6.2 (GREEN) Implement `observability/SentryInitializer.kt` reading `BuildConfig.SENTRY_DSN`; early-return on blank; TODO comment pointing at the future observability story (mirrors `api/bootstrap.ts`)
  - [ ] T6.3 Wire `SentryInitializer.init(this)` into `Application.onCreate()` (already done in T4.2)

- [ ] **T7 — Per-app CI workflows at repo-root** (AC-8)
  - [ ] T7.1 `git mv customer-app/.github/workflows/ship.yml .github/workflows/customer-ship.yml` — and a separate `git mv technician-app/.github/workflows/ship.yml .github/workflows/technician-ship.yml` (apply the E01-S02 lesson: GitHub Actions only discovers workflows at the repo-root `.github/workflows/`)
  - [ ] T7.2 Rewrite each workflow: `name:`, `paths:` filter scoped to that app only, `defaults.run.working-directory: <app>`, `env: { GIT_SHA: ${{ github.sha }} }`, full step list per AC-8
  - [ ] T7.3 Replace the template's naive codex-marker `MARKER == HEAD` check with the **ancestor-check + scope-diff** block copied verbatim from `.github/workflows/api-ship.yml` (allowed-scope: `.codex-review-passed` + `docs/reviews/**` — same as the other two workflows)
  - [ ] T7.4 Add `actions/setup-java@v4` (temurin, 21), `gradle/actions/setup-gradle@v4`, Semgrep step with `config: p/kotlin p/owasp-top-ten p/secrets` (drop the template's `p/ci` — it's noisy on GitHub Actions)
  - [ ] T7.5 Delete the now-empty `customer-app/.github/` and `technician-app/.github/` trees (Windows `git mv` may leave empty dirs — explicit `git rm -r <empty-dir>` or `rmdir` as needed)
  - [ ] T7.6 Verify both workflows are discovered by GitHub Actions UI after push (not detected pre-push; first PR proves discovery)

- [ ] **T8 — ADR sweep + final amend of ADR-0007** (AC-12)
  - [ ] T8.1 Update `docs/adr/0007-zero-paid-saas-constraint.md` §"Known free-tier dependencies" table with a new 2026-04-18 "Story E01-S03" amendment block listing every new dev dependency from §Library/Framework Requirements (Detekt, ktlint plugin, Paparazzi, Kover, MockK, Robolectric, Hilt, KSP — all OSS, Apache-2.0 or MIT) — mirror the formatting of the E01-S06 amendment already in that file

- [ ] **T9 — Pre-push 5-layer review gate** (per CLAUDE.md §Per-Story Protocol)
  - [ ] T9.1 `/code-review` (cheap lint + stylistic pass — Claude)
  - [ ] T9.2 `/security-review`
  - [ ] T9.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
  - [ ] T9.4 `/bmad-code-review` (Blind Hunter + Edge Case Hunter + Acceptance Auditor)
  - [ ] T9.5 `/superpowers:requesting-code-review`
  - [ ] T9.6 Only after all 5 layers, `git push`

---

## Dev Notes

### Story Foundation Context

This is the **first Android story and the foundation for both Android apps**. Dependencies: E01-S01 merged (✓ — `33db7bb`); E01-S02 merged (✓ — PR #2 on main); E01-S06 merged (✓ — `1bd0706`, OpenAPI client wiring — not consumed in this story, but sets the pattern for Android API generation in a later story). Phase gate satisfied (`.bmad-readiness-passed` committed at `c360120`). `app/src/main/` edits now unlocked.

**Why this matters strategically (per architecture §2 Boring-Technology Manifesto):** every choice in this story locks in a pattern the next **~20 Android stories** will follow (E02, E03-customer-facing, E04, E05, E06, E07, E08). Getting the Compose theming wrong, the Hilt graph wrong, the Paparazzi wrapper wrong, the Kotlin compile-flags wrong, or either CI workflow location wrong all have 20×-multiplier impact. Get it right and every subsequent Android story moves fast.

**Scope honesty:** this story touches two apps, so it is deliberately larger than E01-S01 or E01-S02. Estimate is **~1.5 dev-days**, not 1. Most sub-tasks apply identically to both apps; executing against `customer-app/` first end-to-end, then repeating the same work in `technician-app/`, is the fastest path — treating them as a matrix or trying to abstract over both simultaneously is premature (E01-S04 handles shared code correctly via the `design-system/` Gradle module).

### Critical Architectural Constraints (READ BEFORE CODING)

| Constraint | Source | Story-level implication |
|---|---|---|
| **Kotlin 2.x + Jetpack Compose + Material 3** | ADR-0001, architecture §6 | K2 compiler on; Compose compiler plugin via `org.jetbrains.kotlin.plugin.compose`; Material 3 only (no Material 2) |
| **Android minSdk 26 / targetSdk 35 / compileSdk 35** | architecture §5.1, PRD §Project-Type Specific Requirements | Covers ~95% of Indian Android devices; targets Android 15 |
| **TWO separate Gradle codebases, no root Gradle** | ADR-0001 Consequences — "Two Android codebases duplicate some scaffolding" | No `settings.gradle.kts` at repo root; each app is its own Gradle root. Version catalogs duplicated deliberately. |
| **No shared `design-system/` Gradle module yet** | `docs/stories/README.md` §E01 — E01-S04 row | Each app carries its own minimal `ui/theme` package in THIS story; E01-S04 extracts to a shared module and migrates both apps as first consumers |
| **Kotlin `-Werror` + explicit API mode** | NFR-M-5, root CLAUDE.md | `allWarningsAsErrors = true` + `freeCompilerArgs += "-Xexplicit-api=strict"` — matches the TS `strict: true` + ESLint `--max-warnings 0` discipline |
| **Hilt for DI (not Koin, not Dagger-only, not manual)** | Template, architecture implied | Google-recommended; KSP (not KAPT) processor for speed |
| **Paparazzi for screenshot tests (not Roborazzi, not Shot)** | Template, architecture §7.1 row NFR-U-5 | CashApp OSS; JVM-only via layoutlib — no emulator needed in CI |
| **Sentry only for observability in this story; OTel deferred** | ADR-0007, E01-S01 + E01-S02 precedents | `@opentelemetry/*` NOT added; single TODO comment; observability story lands later |
| **No Firebase SDKs yet** | Scope, threat-model §3.3 | Firebase Phone Auth + Truecaller + FCM all land in E02 / E03 stories, each introducing exactly the minimal SDK they need |
| **Zero paid SaaS** | ADR-0007 | Every dep on the approved free-tier/OSS list; ADR-0007 amended with the new dev deps this story adds |
| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed`; each workflow enforces via ancestor-check + scope-diff |
| **Android CI at repo-root, one workflow per app** | E01-S02 lesson | Two workflows (`customer-ship.yml`, `technician-ship.yml`) mirroring the per-sub-project pattern already set for `api-ship.yml` + `admin-ship.yml` |

### Why Two Workflows, Not One Matrix Workflow

One `android-ship.yml` with a `strategy.matrix.app: [customer-app, technician-app]` would look DRY, but:

1. **`paths:` filter coupling** — a matrix workflow is one workflow instance per push; GitHub evaluates `paths:` at workflow level, not per-job. Either both app workflows trigger on any Android change, or neither. Two workflows give us independent triggers.
2. **Independent success signal** — a matrix job's overall status is green-iff-all-green. Two workflows give two independent status checks on a PR, which is what the review gate wants (`customer-ship` can pass while `technician-ship` is red and vice versa).
3. **Pattern symmetry** — `api-ship.yml` and `admin-ship.yml` are each one workflow per sub-project. Two Android workflows mirror that shape. Future contributors find what they expect.
4. **Cost** — CI minute delta between matrix and separate workflows is zero when only one app changed; the `paths:` filter skips the untouched workflow entirely.

### Why Paparazzi (Not Roborazzi, Shot, or Compose Preview Screenshots)

- **Paparazzi** (CashApp) renders Compose on the JVM via Android layoutlib — no emulator, no device, no Robolectric. Fastest CI path. Apache-2.0. Template already assumes it. Compose 1.7 + Kotlin 2 supported from `1.3.5+`.
- **Roborazzi** uses Robolectric; slightly richer integration with Compose test APIs but ~2× slower and requires Robolectric classpath management.
- **Shot** (Karumi) is pre-Compose-era; not the right stack.
- **Compose Preview Screenshots (`Compose Preview → Paparazzi`) via AGP 8.5+ new screenshot plugin** — still incubating (`@ExperimentalScreenshotTest`); revisit in a later story once GA.

### Why No Design-System Module Yet

The sprint plan explicitly separates:
- **E01-S03 (this story)**: "Wire up customer-app/ + technician-app/ Kotlin projects with Compose + Paparazzi + Hilt + Sentry SDK + ./gradlew build green"
- **E01-S04 (next)**: "Create shared design-system Gradle module with tokens from UX §5 (color, type, space, motion, elevation, radii) + Compose theme; publish. Import in both Android apps; dark mode toggles correctly"

E01-S04 is the natural place for the `design-system/` Gradle module because (a) the tokens come from UX §5 which is already finalised, (b) both apps will consume it as its first real consumers — proving the extraction, (c) doing it in this story would add a cross-app coupling that the E01-S02-style disaster-fixing premise of the skeleton stories deliberately avoids.

**Implication for this story:** each app gets its own small `ui/theme/{Color,Theme,Type}.kt` files. They can be near-identical between apps — that duplication is intentional and flagged for elimination in E01-S04.

### Source Tree Components to Touch

**Pattern — repeats for both `customer-app/` and `technician-app/` with the obvious substitutions:**

```
customer-app/
├── README.md                                 REWRITE (strip <Client App> placeholder)
├── .editorconfig                             CREATE
├── .gitignore                                (keep template; root .gitignore adds block)
├── settings.gradle.kts                       CREATE (rootProject.name + include :app)
├── build.gradle.kts                          CREATE (plugin declarations, apply false)
├── gradle.properties                         CREATE (jvmargs, caching, configuration-cache)
├── gradle/
│   ├── libs.versions.toml                    CREATE (version catalog)
│   └── wrapper/
│       ├── gradle-wrapper.properties         CREATE (Gradle 8.11)
│       └── gradle-wrapper.jar                CREATE (wrapper binary, committed)
├── gradlew                                   CREATE
├── gradlew.bat                               CREATE
├── detekt.yml                                CREATE (build.maxIssues: 0; full rules enabled)
├── app/
│   ├── build.gradle.kts                      CREATE (android block, plugins, kotlinOptions -Werror, buildFeatures compose/buildConfig, kover, paparazzi)
│   ├── proguard-rules.pro                    CREATE (empty stub — release minification deferred)
│   └── src/
│       ├── main/
│       │   ├── AndroidManifest.xml           CREATE (application class + MainActivity + INTERNET only)
│       │   └── kotlin/com/homeservices/customer/
│       │       ├── HomeservicesCustomerApplication.kt  CREATE (@HiltAndroidApp + Sentry init)
│       │       ├── MainActivity.kt                     CREATE (@AndroidEntryPoint + setContent)
│       │       ├── di/
│       │       │   ├── AppModule.kt                    CREATE (BuildInfo provider)
│       │       │   └── BuildInfoProvider.kt            CREATE (@Inject constructor)
│       │       ├── observability/
│       │       │   └── SentryInitializer.kt            CREATE (early-return on empty DSN)
│       │       └── ui/
│       │           ├── SmokeScreen.kt                  CREATE (@Composable)
│       │           └── theme/
│       │               ├── Color.kt                    CREATE (light + dark schemes)
│       │               ├── Theme.kt                    CREATE (HomeservicesCustomerTheme composable)
│       │               └── Type.kt                     CREATE (Material 3 Typography)
│       ├── test/
│       │   ├── kotlin/com/homeservices/customer/
│       │   │   ├── BuildInfoProviderTest.kt            CREATE (pure JUnit 5 + assertions)
│       │   │   ├── observability/SentryInitializerTest.kt  CREATE (MockK on SentryAndroid)
│       │   │   ├── HiltWiringTest.kt                   CREATE (Robolectric + HiltAndroidRule)
│       │   │   └── ui/SmokeScreenPaparazziTest.kt      CREATE (Paparazzi light + dark)
│       │   └── snapshots/images/                       CREATE (first run records; PR commits)
│       └── androidTest/
│           └── kotlin/com/homeservices/customer/
│               └── TestRunner.kt                       CREATE (HiltAndroidTestRunner shim — no tests yet)
└── (no google-services.json, no keystore, no signing config)
```

`technician-app/` is **structurally identical** with `com.homeservices.customer` → `com.homeservices.technician` + brand-string copy changes only.

**Root-level files touched:**

- `.github/workflows/customer-ship.yml` — CREATE (via `git mv` from `customer-app/.github/workflows/ship.yml` + content rewrite)
- `.github/workflows/technician-ship.yml` — CREATE (same pattern for technician-app)
- `customer-app/.github/workflows/ship.yml` — DELETE (moved)
- `technician-app/.github/workflows/ship.yml` — DELETE (moved)
- `customer-app/.github/` and `technician-app/.github/` — DELETE (empty after move)
- `.gitignore` (root) — MODIFY (add `# customer-app/` and `# technician-app/` blocks per AC-10)
- `docs/adr/0007-zero-paid-saas-constraint.md` — MODIFY (append 2026-04-18 Story E01-S03 amendment to the "Known free-tier dependencies" table — same shape as the E01-S06 amendment)

**Template residue deleted (AC-10, mirroring E01-S02 N1):**

- `customer-app/docs/`, `customer-app/plans/`, `customer-app/specs/`
- `technician-app/docs/`, `technician-app/plans/`, `technician-app/specs/`

### Testing Standards (project-wide, plus Android specifics)

- **JUnit 5 + MockK** for pure unit tests (under `app/src/test/kotlin/`). `@Test`, `assertThat` via `org.assertj.core`, `every/verify` from MockK. No JUnit 4 — Android Gradle Plugin 8+ supports JUnit 5 via `de.mannodermaus.android-junit5` plugin (OSS).
- **Paparazzi** for Compose screenshot tests. One test class per screen at skeleton stage (`SmokeScreenPaparazziTest`). Golden images committed under `app/src/test/snapshots/images/`. Diff failure fails the build.
- **Robolectric 4.14+** for Hilt wiring tests that need an Application context without an emulator. `@RunWith(RobolectricTestRunner::class)` + `@HiltAndroidTest`. The **Espresso** instrumented-test path (`app/src/androidTest/`) is **stubbed** in this story (`TestRunner.kt` only) and gets exercised in a later story when a feature lands that genuinely benefits from instrumentation (e.g., real camera, real biometrics).
- **Kover** for coverage — thresholds 80/80/80 (lines/branches/instructions). `@kotlinx.kover.gradle.plugin.dsl.KoverReportsDSL { filters { excludes { classes("*.Hilt_*", "*.ComposableSingletons*", "*.BuildConfig", "*.R", "*.R$*") } } }`.
- **Test file layout mirrors the source layout** under `app/src/test/kotlin/` and `app/src/androidTest/kotlin/`. No co-located tests.
- **Test names** are full sentences as Kotlin method names with backticks: `` `SentryInitializer does not call SentryAndroid init when DSN is blank`() `` — matches the test-name style already set in `api/` and `admin-web/`.
- **Snapshot tests are Paparazzi-only**; no JVM-level snapshot tests of composables via `assertj` snapshot plugins (brittle + tool-fragmented).

### Patterns to Reuse (LOCK IN — every future Android story must follow)

| Pattern | Where established | Rule |
|---|---|---|
| **Observability bootstrap** | `observability/SentryInitializer.kt` (this story) | Read `BuildConfig.SENTRY_DSN`; early-return when blank. Single entry point. Never call `SentryAndroid.init` directly from a feature-module Application or Activity. |
| **DI entry graph** | `di/AppModule.kt` `@InstallIn(SingletonComponent::class)` | One application-scoped module per app, no more. Feature modules install into their own scopes. `@Inject constructor` preferred over `@Provides` where possible. |
| **Build-info plumbing** | `di/BuildInfoProvider.kt` reading `BuildConfig.VERSION_NAME` + `BuildConfig.GIT_SHA` | Never `readPackageInfo(packageName, 0)` at runtime — `BuildConfig` is the single source of truth, injected at build time via `buildConfigField`. |
| **Theme** | `ui/theme/Theme.kt` — `HomeservicesCustomerTheme` / `HomeservicesTechnicianTheme` composable wrapper | Every screen wraps its content in this. Dark mode respects system. Tokens live in `Color.kt`; typography in `Type.kt`. E01-S04 extracts to `design-system/` module — future stories consume from there. |
| **Route structure** | `MainActivity` + `setContent { ... }` (this story has one screen) | Navigation-Compose (`androidx.navigation:navigation-compose`) introduced in a later story once ≥ 2 destinations exist. YAGNI for this skeleton. |
| **Screenshot tests** | `app/src/test/.../*PaparazziTest.kt`, golden snapshots committed | Every new screen gets a Paparazzi test; PR fails on pixel diff. CI runs `verifyPaparazziDebug`, not `recordPaparazziDebug`. |
| **Coverage gate** | `./gradlew koverVerify` — 80/80/80 | Adding code without tests breaks the build. Exclusions are minimal + explicit. |
| **CI workflow location** | `.github/workflows/<app>-ship.yml` (repo-root) | GitHub Actions only discovers root-level workflows. (Lesson from E01-S02 + E01-S01.) |
| **Codex-marker CI gate** | each Android workflow's codex step (matches `api-ship.yml`) | Ancestor-check + scope-diff, NOT naive SHA-equality. |
| **Naming** | architecture §6.2 | Kotlin: PascalCase types + composables + files-containing-types; camelCase functions/properties; `SCREAMING_SNAKE_CASE` constants. Package names lowercase no-underscore. |

### Project Structure Notes

- **Alignment with monorepo (architecture §6):** This story creates each app's independent Gradle root (two independent `settings.gradle.kts`, no repo-root `settings.gradle.kts`). Architecture §6 explicitly notes "intentionally no root package.json — each sub-project is independent"; the same "no root Gradle" discipline applies to Android.
- **No cross-package imports:** `customer-app/` does NOT import from `technician-app/`, `admin-web/`, or `api/`. Shared types come via OpenAPI-generated Kotlin client (pattern set by E01-S06, but Kotlin generation lands in a later story — this story has no API dependency, so no client is generated yet).
- **Detected variance vs template:** baseline `customer-app/` + `technician-app/` are both literally an empty `app/src/main/` + a ship.yml at the wrong path + template-residue dirs (`docs/`, `plans/`, `specs/`). The template's CLAUDE.md promises Kotlin + Compose + Hilt + Room + Ktor + Sentry + GrowthBook + PostHog + Detekt + ktlint + Android Lint + JUnit 5 + MockK + Espresso + Paparazzi — this story installs the first four layers (Kotlin + Compose + Hilt + Sentry) + the first three test layers (JUnit 5 + MockK + Paparazzi) and defers Room + Ktor + GrowthBook + PostHog + Espresso to stories where they're first used.

### Previous Story Intelligence (from E01-S01, E01-S02, E01-S06 — all merged on `main`)

**Direct lessons that apply to this story (confirmed from merged PR bodies and plan precedents):**

1. **Workflow location (E01-S02):** GitHub Actions discovers workflows only at repo-root `.github/workflows/`. Same fix applies here → two workflows, one per app, at repo-root.
2. **Codex-marker gate paradox (E01-S01):** naive `MARKER_SHA == HEAD_SHA` is unsatisfiable because committing the marker moves HEAD. Use ancestor-check + scope-diff (copy verbatim from `.github/workflows/api-ship.yml`).
3. **Build-before-dev (E01-S01):** if the dev loop relies on a build step, make it explicit. Irrelevant for `./gradlew` (Gradle handles compile in `./gradlew assembleDebug`), but re-applicable when a future story introduces Ktor client generation from OpenAPI.
4. **OTel is not a clean no-op (E01-S01, E01-S02):** defer entirely; do NOT add `io.opentelemetry.*` or Sentry's OTel bridge. Single TODO comment in `SentryInitializer.kt`.
5. **Template-residue cleanup (E01-S02 N1):** delete `<app>/docs/`, `<app>/plans/`, `<app>/specs/` — they shadow the project-level `docs/` and create false trails for future dev agents.
6. **Corepack / toolchain reproducibility (E01-S02):** Android equivalent is the Gradle wrapper + `distributionSha256Sum` + `.nvmrc`-equivalent pin of Java (Temurin 21 in CI; `java.toolchain.languageVersion = 21` in Gradle). Commit the wrapper binary (`gradle-wrapper.jar`).
7. **Don't use `readFileSync` at runtime (E01-S02 lesson adapted):** the Android equivalent is `PackageInfo`/`Resources` — use `BuildConfig` instead, injected at build time via `buildConfigField`.
8. **One commit per task, no `--amend` on pushed work (all three precedents):** expect 15–20 commits for this story (roughly 2× E01-S02's 10–14, because two apps).
9. **ADR-0007 amendment pattern (E01-S06):** append a date + story-ID section to the "Known free-tier dependencies" table for every new dev dep — don't replace, amend.

### Git Intelligence (last 5 commits on `main`, for context)

```
1bd0706 E01-S06: Cross-sub-project OpenAPI client generator wiring (#3)
1236d4c E01-S02: admin-web skeleton + landing page (#2)
33db7bb Merge pull request #1 from aloktiwarigit/E01-S01-api-skeleton
5ca1d4e chore: codex review passed (round 2) — mark 71c61bf as reviewed
71c61bf fix(api,ci): address Codex review — dev script must build first + marker gate chicken-egg fix
```

**Patterns observed:** TDD-ordered commits; each commit does one thing; commit messages include the "why"; review-gate fixes are clearly marked; per-story branches named `E##-S##-<kebab-slug>`. This story follows the same cadence.

### Library / Framework Requirements (exact versions, all OSS approved)

> **All listed plugins and libraries are OSS (Apache-2.0 / MIT / BSD) and will be added to `docs/adr/0007-zero-paid-saas-constraint.md` §"Known free-tier dependencies" as a 2026-04-18 Story E01-S03 amendment per T8.1. Adding any other dep requires a new ADR + owner approval.**

**Plugins (declared in each app's top-level `build.gradle.kts` via `libs.plugins.*`):**

- `com.android.application` (AGP) — `^8.6.0`
- `org.jetbrains.kotlin.android` — `^2.0.21`
- `org.jetbrains.kotlin.plugin.compose` — `^2.0.21` (Kotlin 2 bundles the Compose Compiler plugin; no separate version pin needed)
- `com.google.dagger.hilt.android` — `^2.52`
- `com.google.devtools.ksp` — `^2.0.21-1.0.28` (matches Kotlin version)
- `org.jlleitschuh.gradle.ktlint` — `^12.1.1` (OSS, Apache-2.0)
- `io.gitlab.arturbosch.detekt` — `^1.23.7` (OSS, Apache-2.0)
- `app.cash.paparazzi` — `^1.3.5` (OSS, Apache-2.0 — first version Compose 1.7 + Kotlin 2 compatible)
- `org.jetbrains.kotlinx.kover` — `^0.9.0` (OSS, Apache-2.0)
- `de.mannodermaus.android-junit5` — `^1.11.2.0` (OSS, Apache-2.0 — JUnit 5 on Android)

**Dependencies (`app/build.gradle.kts` `dependencies { }` + `libs.versions.toml`):**

- `androidx.core:core-ktx` — `^1.15.0`
- `androidx.activity:activity-compose` — `^1.9.3`
- `androidx.compose:compose-bom` — `^2024.11.00` (BOM pins every `androidx.compose.*` artifact; latest as of 2026-04)
  - `androidx.compose.material3:material3` (version via BOM)
  - `androidx.compose.ui:ui` (via BOM)
  - `androidx.compose.ui:ui-tooling-preview` (via BOM)
  - `androidx.compose.ui:ui-tooling` — debug only (via BOM)
- `androidx.lifecycle:lifecycle-viewmodel-compose` — `^2.8.7`
- `com.google.dagger:hilt-android` — `^2.52`
- `com.google.dagger:hilt-compiler` — `^2.52` (KSP)
- `androidx.hilt:hilt-navigation-compose` — `^1.2.0` (NOT used in this story — skeleton has one screen — but keep in the catalog for E01-S04/S05 consumers)
- `io.sentry:sentry-android` — `^7.17.0` (NOT `sentry-android-core` + `sentry-android-okhttp` — one unified artifact at this layer)

**Test dependencies:**

- `org.junit.jupiter:junit-jupiter` — `^5.11.3`
- `io.mockk:mockk` — `^1.13.13`
- `io.mockk:mockk-android` — `^1.13.13`
- `org.assertj:assertj-core` — `^3.26.3`
- `org.robolectric:robolectric` — `^4.14.1`
- `com.google.dagger:hilt-android-testing` — `^2.52`
- `app.cash.paparazzi` (plugin provides the runtime; no separate test dep) + `androidx.test:core` — `^1.6.1` (Paparazzi transitively needs it)

**Forbidden in this story (and generally, without ADR):** `com.google.firebase:*` (belongs in E02/E03 stories where used), `com.google.android.gms:*` except Play Services Auth when used (not here), `com.squareup.okhttp3:okhttp` (no network yet — Ktor lands with API integration), `androidx.room:*` (no local DB yet — Room lands with offline job-queue in E06), `com.chuckerteam.chucker:chucker` (dev-only network inspector — add when network lands), paid Sentry add-ons, paid Bugsnag, paid Instabug, paid attribution SDKs (AppsFlyer/Adjust/Branch), KAPT (use KSP).

### Latest Tech Specifics (verified against current stable versions as of 2026-04)

- **AGP 8.6+** supports Kotlin 2.0 + Compose Compiler plugin natively; older AGP needs the legacy Compose Compiler Gradle plugin.
- **Kotlin 2.0 K2 compiler** is the default; explicit-api-mode supported via `-Xexplicit-api=strict`.
- **Compose BOM `2024.11.00`** bundles Compose Material 3 `1.3.1`, Compose UI `1.7.5`, Compose Foundation `1.7.5`.
- **Hilt 2.52** supports KSP out of the box (add `alias(libs.plugins.ksp)` + `ksp("com.google.dagger:hilt-compiler:2.52")`).
- **Paparazzi `1.3.5+`** is the first version compatible with Compose Compiler on Kotlin 2.0 (earlier versions throw `layoutlib` classloader errors).
- **Sentry Android `7.x`** is the current major; `SentryAndroid.init { options -> ... }` is the canonical entry point.
- **Gradle 8.11** supports configuration cache + isolated projects (experimental); configuration cache ON by default is stable at 8.11.
- **Robolectric 4.14** supports Android SDK 35.
- **JUnit 5 on Android** requires the `de.mannodermaus.android-junit5` Gradle plugin; pure JUnit 5 runner does not work with AGP test runner.

### Performance Note (informational)

Target APK sizes at skeleton stage:
- debug APK: < 15 MB per app (Compose + Hilt + Sentry base is ~10 MB; skeleton adds ~2 MB)
- Cold build time: < 5 min on a mid-range dev machine with empty Gradle cache; < 90 s warm
- `verifyPaparazziDebug`: < 60 s per app on CI

These are guidance only; no CI gate. Real perf SLOs (cold-start < 2 s per NFR-P-4, APK size < 20 MB release per NFR-P-5) land in a later instrumentation story.

### References

- [Source: `docs/architecture.md` §2 Boring-Technology Manifesto, §4.1 ADR-0001 (Kotlin + Compose × 2), §5 Architectural Patterns, §6 Code structure, §6.2 Naming conventions, §7.1 NFR traceability]
- [Source: `docs/adr/0001-primary-stack-choice.md` — Kotlin + Compose lock + two-separate-codebase trade-off]
- [Source: `docs/adr/0007-zero-paid-saas-constraint.md` — OSS-only floor + approved free-tier list; amended by T8.1 of this story]
- [Source: `docs/prd.md` §NFR-A-1 (accessibility AA), §NFR-M-4 (coverage ≥80%), §NFR-M-5 (Kotlin `-Werror`), §NFR-O-2 (Sentry), §NFR-P-4 (cold-start), §NFR-P-5 (APK size), §NFR-S-9 (secrets only in Key Vault)]
- [Source: `docs/ux-design.md` §5 Design system — tokens NOT extracted in this story; E01-S04 scope]
- [Source: `docs/threat-model.md` §3.3 Mobile Apps STRIDE — informs later permission hardening; scope in this skeleton story is limited to `INTERNET`]
- [Source: `docs/runbook.md` §5 Deploy Procedure — deploy path out of scope; this story keeps builds Play-Store-compatible]
- [Source: `docs/stories/README.md` §E01 — this story's row + sprint allocation + dependency graph; NFR references]
- [Source: `CLAUDE.md` (root) — phase gate, model routing, per-story protocol, 5-layer review]
- [Source: `customer-app/CLAUDE.md` + `technician-app/CLAUDE.md` — sub-project stack rules + CI gates]
- [Source: `customer-app/.claude/settings.json` + `technician-app/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
- [Source: `.github/workflows/api-ship.yml` — template for the codex-marker ancestor-check pattern to copy verbatim]
- [Source: `.github/workflows/admin-ship.yml` — template for the `paths:` filter + `defaults.run.working-directory:` pattern]
- [Source: `docs/stories/E01-S01-api-skeleton-health-endpoint.md` — structural and disciplinary template]
- [Source: `docs/stories/E01-S02-admin-web-skeleton-landing-page.md` — the two-disaster-fix pattern (workflow location + marker paradox) directly applicable here]
- [Source: `docs/superpowers/specs/2026-04-17-e01-s01-api-skeleton-design.md` + `docs/superpowers/specs/2026-04-18-e01-s02-admin-web-skeleton-design.md` — brainstorm precedents]
- [Source: `plans/E01-S01.md` + `plans/E01-S02.md` + `plans/E01-S06.md` — plan-format precedents]
- [Source: merged PRs #1 (E01-S01), #2 (E01-S02), #3 (E01-S06) — for exact workflow-location + marker-paradox fixes and their rationale]

---

## Anti-patterns to AVOID (Disaster Prevention)

> Each item here corresponds to a real risk for the dev agent — flagged in advance to prevent rework.

1. **Do NOT place either workflow at `<app>/.github/workflows/ship.yml`.** GitHub Actions only discovers workflows at the repo-root `.github/workflows/` directory. The current baseline location is dead code for both apps. This is the single most impactful fix in the story — `git mv` both workflows in T7.1.
2. **Do NOT use a naive `MARKER_SHA == HEAD_SHA` codex-marker check.** Committing the marker moves HEAD, so that check is unsatisfiable. Use ancestor-check + scope-diff (copy from `.github/workflows/api-ship.yml`) — same fix applied to both new workflows.
3. **Do NOT create a `design-system/` Gradle module in this story.** That is E01-S04's explicit scope. Duplicating `ui/theme/*.kt` files between the two apps is deliberate and flagged for elimination in E01-S04 — premature abstraction here multiplies rework.
4. **Do NOT add Firebase SDKs (`com.google.firebase:*`), `google-services.json`, or the `com.google.gms.google-services` Gradle plugin.** Firebase Phone Auth + Truecaller fallback + FCM all belong in E02/E03 stories. Adding them here pollutes the skeleton and creates false negatives on auth flows that don't exist yet.
5. **Do NOT add Room, Ktor, OkHttp, or Retrofit.** No network calls in this story. Networking stack lands with the first real API consumer (likely E02-S01 for auth).
6. **Do NOT introduce Espresso or any instrumented Android test (`app/src/androidTest/`) that actually runs on an emulator in this story.** CI runs headless Ubuntu — emulator startup is 2–4 min per job, multiplied by two apps. Keep instrumentation deferred to the first story that genuinely needs it. `TestRunner.kt` is stubbed only so future stories don't invent conventions.
7. **Do NOT use KAPT.** Use KSP for Hilt + any future annotation processor. KSP is ~2× faster and Google's recommended direction.
8. **Do NOT introduce OpenTelemetry (`io.opentelemetry.*` or `io.sentry.opentelemetry.*`).** Defer entirely, matching the E01-S01 + E01-S02 precedents. Single TODO comment in `SentryInitializer.kt`.
9. **Do NOT create a root-of-repo `settings.gradle.kts`, `build.gradle.kts`, or `buildSrc/`.** Two independent Gradle roots are explicitly the ADR-0001 decision. A root Gradle layer is a future ADR, not a skeleton story scope.
10. **Do NOT commit `local.properties`, a `keystore.jks`, a `keystore.properties`, or a `release.keystore`.** Signing + Play Store wiring lives in a dedicated deploy story.
11. **Do NOT introduce a client-side state library (Redux-like patterns — Orbit, MVIKotlin, Mobius).** Compose state + `ViewModel` + Kotlin Flow cover the needs until ≥ 3 screens share complex orchestration.
12. **Do NOT use Material 2 (`androidx.compose.material:material`).** Material 3 (`androidx.compose.material3:material3`) is locked (ADR-0001 + UX §5).
13. **Do NOT add comments explaining what code does.** Per root CLAUDE.md: only comment when WHY is non-obvious.
14. **Do NOT commit `gradle/` caches, `.gradle/` directories, or `build/` outputs.** All gitignored via the root `.gitignore` block added in T1.3. `gradle/wrapper/gradle-wrapper.jar` IS committed (it's the wrapper binary, not a cache).
15. **Do NOT amend an earlier commit on this branch after it's pushed.** Per root CLAUDE.md: always create new commits.
16. **Do NOT bypass Detekt / ktlint / Android-Lint warnings with `@Suppress` or baselines.** The skeleton is clean; every suppression sets a precedent future stories will copy. If a rule fires on generated Compose/Hilt code, prefer the Kover/detekt exclusion DSL; if that's not enough, disable the rule in `detekt.yml` with a rationale comment — not per-file.
17. **Do NOT skip Paparazzi snapshots on the premise "it's just a skeleton".** The smoke screen IS the first snapshot — it proves the Paparazzi path end-to-end and catches a whole class of future regressions (theme drift, Typography-scale changes, density handling).
18. **Do NOT bypass the codex-review-gate.** The pre-push hook in each app's `.claude/settings.json` will block; do not set `CLAUDE_OVERRIDE_REASON` for routine work.
19. **Do NOT add `PostHog` or `GrowthBook` SDKs in this story.** Both are approved OSS but neither is exercised yet; adding them here forces config decisions (API key plumbing, opt-in gating) that belong with the first real event / flag story.
20. **Do NOT wire the `app/src/main/kotlin` layout at `app/src/main/java`.** Kotlin-first: `app/src/main/kotlin/` for production, `app/src/test/kotlin/` for tests, `app/src/androidTest/kotlin/` for instrumented stubs. Both apps use this layout consistently.
21. **Do NOT commit the Gradle build scan URL or any `gradle.com` auth tokens.** Scans are opt-in and irrelevant for the skeleton. The Gradle wrapper is enough.

---

## Definition of Done

- [ ] All 12 acceptance criteria pass (verified by tests + manual smoke launch + green CI)
- [ ] All 9 task groups (T1–T9) checked off, with both apps covered for each two-app task
- [ ] `./gradlew ktlintCheck detekt lintDebug testDebugUnitTest koverVerify verifyPaparazziDebug assembleDebug` all green locally in **both** `customer-app/` and `technician-app/`
- [ ] `adb install` + manual launch of the debug APK succeeds on an Android 8 emulator (API 26) and an Android 15 emulator (API 35) for both apps
- [ ] Coverage ≥ 80% on lines/branches/instructions per app (Kover HTML report)
- [ ] Paparazzi golden images committed under `<app>/app/src/test/snapshots/images/` for both apps; `verifyPaparazziDebug` green
- [ ] PR opened against `main`; `.github/workflows/customer-ship.yml` AND `.github/workflows/technician-ship.yml` both GREEN end-to-end
- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
- [ ] PR description includes: summary, test plan, Paparazzi diff summary (none expected), Kover coverage % per app, deliberate-deviations list
- [ ] `docs/stories/README.md` Phase 5 Status Tracker row for E01 (may already be "Started: ✅" from E01-S01)
- [ ] `customer-app/.github/workflows/ship.yml` + `technician-app/.github/workflows/ship.yml` deleted; two new workflows at `.github/workflows/` present and correct
- [ ] `docs/adr/0007-zero-paid-saas-constraint.md` amended with the Story E01-S03 dev-dependency block (per T8.1)
- [ ] No new `.md` files created beyond this story file and the two rewritten `<app>/README.md`s
- [ ] No paid-SaaS dependencies introduced (verified by grepping `libs.versions.toml` + `build.gradle.kts` against ADR-0007 forbidden list + §Anti-patterns item #19)

---

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent on first edit._

### Debug Log References

_To be filled by dev agent._

### Completion Notes List

_To be filled by dev agent — capture: any deviation from the plan and why; any deferred sub-task with rationale; CI run URL per workflow; Kover coverage % per app; Paparazzi snapshot counts; any new pattern not anticipated above (which becomes locked-in for every future Android story)._

### File List

_To be filled by dev agent — final list of created/modified files for the PR, separated by app._

---

## Open Questions for Dev Agent (resolve during brainstorm)

1. **Build tool** — Gradle Kotlin DSL + version catalog (current Android standard) vs JetBrains **Amper** (promising simpler YAML-based config)? **Recommendation:** Gradle KTS. Amper is pre-1.0 and has no stable Compose + Hilt + Paparazzi + Kover story as of 2026-04. Confirm in brainstorm.
2. **Compose version strategy** — Compose BOM `2024.11.00` pin-all vs direct per-artifact versions? **Recommendation:** BOM (single point of version truth; one line change for Compose bumps). Confirm.
3. **Hilt vs Koin** — Koin is simpler and avoids KSP but costs compile-time safety. **Recommendation:** Hilt (Google-standard; compile-time validation; template already says Hilt; matches every production Android marketplace app). Confirm.
4. **Paparazzi vs Roborazzi** — both OSS, similar ergonomics. **Recommendation:** Paparazzi (JVM-only via layoutlib → fastest CI; template already says Paparazzi; no Robolectric classpath). Confirm.
5. **Sentry init location** — `Application.onCreate()` (standard) vs `@HiltAndroidApp` + an `ApplicationInitializer` pattern via `androidx.startup:startup-runtime`? **Recommendation:** plain `Application.onCreate()` call to `SentryInitializer.init(this)`. AndroidX App Startup is overkill for one initializer; introduces without benefit. Confirm.
6. **CI workflow split** — two workflows (`customer-ship.yml` + `technician-ship.yml`) vs one matrixed `android-ship.yml`? **Recommendation:** two workflows per §"Why Two Workflows, Not One Matrix Workflow". Confirm.
7. **Package / applicationId** — `com.homeservices.customer` + `com.homeservices.technician` vs `com.homeservices.mvp.customer` + `com.homeservices.mvp.technician` (keeping "mvp" out of the user-visible id)? **Recommendation:** drop "mvp" — Play Store listings don't show "MVP" branding. Lock `com.homeservices.customer` + `com.homeservices.technician`. Confirm.
8. **JVM target** — JVM 17 (AGP 8.x default) vs JVM 21 (matches CI Java)? **Recommendation:** JVM 17 for the library target (broadest library compatibility), Java 21 toolchain for Gradle execution. Confirm.
9. **Version catalog location** — two duplicated `libs.versions.toml` (one per app) vs a third shared copy symlinked/copied at build time? **Recommendation:** two duplicated catalogs at skeleton stage; convergence is a later root-Gradle story. Duplication is ~100 lines and zero runtime cost. Confirm.
10. **Robolectric for HiltWiringTest** — Robolectric JVM test vs instrumented-test (emulator) for the wiring check? **Recommendation:** Robolectric — keeps CI cheap; the wiring path (Application → Hilt graph → `@Inject` resolution) is exactly what Robolectric tests well. Confirm.
