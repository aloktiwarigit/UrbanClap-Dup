# Story E01.S04: Shared design-system Gradle module — UX §5 tokens (color, type, space, motion, elevation, radii) + Compose theme + Paparazzi gallery + composite-build consumed by both Android apps

Status: ready-for-dev

> **Epic:** E01 — Foundations, CI & Design System (`docs/stories/README.md` §E01)
> **Sprint:** S1 (wk 1–2) · **Estimated:** ~1 dev-day · **Priority:** **P0 / blocks every Android feature story that consumes design tokens (E02-S01..S03 onboarding chrome, E03-S02 service-detail catalogue, E04-S01 Trust Dossier card, E05-S03 Job Offer card, E06-S01 active-job, E07/E08 chrome, etc.) and unblocks E01-S05 Figma library mirroring**
> **Sub-projects:** new top-level `design-system/` Gradle module + thin migrations of `customer-app/` and `technician-app/`

---

## Story

As the **solo founder-operator (Alok)** building three surfaces (customer Android, technician Android, owner web admin) on a single design language locked in `docs/ux-design.md` §5,
I want a top-level `design-system/` Gradle module that publishes UX §5 tokens (color light + dark, typography scale, spacing 4pt grid, radii, elevation, motion) and one `HomeservicesTheme` Compose wrapper, exposed as a composite build via `includeBuild("../design-system")` so both Android apps consume **the same source-of-truth tokens** with no Maven Local publish step,
so that **every subsequent Android feature story renders against one canonical theme — not against per-app placeholder Material 3 defaults — and any UX §5 token tweak is one commit on one file that ripples to both apps automatically (and to the future Figma library + admin-web tokens via the shared spec).**

This story extracts the placeholder `ui/theme/{Color, Theme, Type}.kt` files left in each app by E01-S03 (a deliberate "skeleton-only theme; no shared module yet" choice — see E01-S03 §"Why No Design-System Module Yet"), replaces them with the real UX §5 tokens, deletes the per-app theme files, and migrates both apps to import `HomeservicesTheme` + token objects from `com.homeservices:design-system` resolved via Gradle composite build (NOT via `publishToMavenLocal` — see ADR-0010 below).

The story deliberately **does NOT**:
- Build the Figma library (E01-S05)
- Build a Tailwind/CSS export pipeline for `admin-web/` (deferred — admin-web has its own Tailwind v4 `@theme` block on `main` since E01-S02; cross-stack token sync is a Phase 2 ADR + dedicated story when both surfaces are post-skeleton)
- Add new app-level features, new screens, or new components beyond the SmokeScreen migrations + a `TokenGallery` Paparazzi-only composable
- Bundle Hindi/Tamil fonts (Noto Devanagari etc. land in the i18n story; this story bundles Geist Sans Variable Latin only — sized for ~75 KB AAR delta)

---

## Acceptance Criteria

> All ACs are BDD-formatted and verified by automated tests + the new `design-system-ship.yml` CI workflow + the existing `customer-ship.yml` + `technician-ship.yml` re-recorded Paparazzi goldens.

### AC-1 · `design-system/` builds independently as an Android library producing an AAR
- **Given** a developer at repo root runs `./gradlew :design-system:assembleRelease` inside `design-system/`
- **Then** the build exits 0 within ≤ 3 min cold / ≤ 30 s warm
- **And** an AAR is emitted at `design-system/build/outputs/aar/design-system-release.aar`
- **And** the AAR's `AndroidManifest.xml` declares `package="com.homeservices.designsystem"` with no `<application>` element (library, not application)
- **And** the AAR contains the bundled Geist Sans Variable font under `res/font/geist_sans_variable.ttf` (single file, ≤ 80 KB)
- **(NFR-M-5 build-green enforcement; NFR-M-7 aar size discipline)**

### AC-2 · UX §5 color tokens exactly match the spec — light + dark — verified by unit tests
- **Given** the `com.homeservices.designsystem.theme.HomeservicesColors` object
- **Then** every brand + semantic + neutral + dossier color from `docs/ux-design.md` §5.1 is exposed as a typed `androidx.compose.ui.graphics.Color`:
  - `brand.primary` light `#0E4F47` / dark `#1E8378`
  - `brand.primaryHover` light `#0A3D37` / dark `#2BA08F`
  - `brand.accent` (warm coral, trust-badge color) light `#EF6F4B` / dark `#F78866`
  - `semantic.success` light `#10A85E` / dark `#25C97B`
  - `semantic.warning` light `#EBA53A` / dark `#F5B850`
  - `semantic.danger` light `#D73C3C` / dark `#EC5252`
  - `semantic.info` light `#2E72D9` / dark `#4F90EC`
  - `neutral.0` light `#FFFFFF` / dark `#0A0A0B` (background)
  - `neutral.50, 100, 200, 500, 900` matching UX §5.1
  - `dossier.verified` (matches success palette by spec)
  - `dossier.neighbourhood` (matches accent palette by spec)
- **And** `HomeservicesLightColorScheme` and `HomeservicesDarkColorScheme` (Material 3 `ColorScheme` objects) wire the brand colors into the right Material 3 slots: `primary` ← `brand.primary`, `secondary` ← `brand.accent`, `error` ← `semantic.danger`, `background` ← `neutral.0`, `surface` ← `neutral.50`, `outline` ← `neutral.200`, `onPrimary` ← `Color.White` (light) / brand-readable inverse (dark), etc. — full mapping in §"Color Slot Mapping" below
- **And** `ColorTokensTest.kt` (pure JVM JUnit 5) asserts every token by hex literal — failing the test on any drift between code + UX §5
- **And** axe-equivalent contrast check (`HomeservicesColorsContrastTest.kt`) verifies every `onColor / color` pair satisfies WCAG 2.1 AA ≥ 4.5:1 for body text (≥ 3:1 for large text exceptions called out in UX §11.2 / NFR-A-5)
- **(UX §5.1; NFR-A-5; PRD trust-layer C-1)**

### AC-3 · UX §5 typography scale exposed via Material 3 `Typography` + Geist Sans bundled font
- **Given** the `HomeservicesTheme` is applied
- **Then** `HomeservicesTypography: Typography` exposes the full UX §5.2 scale mapped to Material 3 slots:
  - `displayLarge` ← UX `display.xl` 48 / 56 / 700
  - `displayMedium` ← UX `display.lg` 40 / 48 / 700
  - `headlineLarge` ← UX `title.lg` 28 / 36 / 600
  - `headlineMedium` ← UX `title.md` 22 / 30 / 600
  - `titleLarge` ← UX `title.sm` 18 / 26 / 600
  - `bodyLarge` ← UX `body.lg` 16 / 24 / 400
  - `bodyMedium` ← UX `body.md` 14 / 22 / 400
  - `bodySmall` ← UX `body.sm` 12 / 18 / 500
  - `labelLarge` ← UX `label.lg` 14 / 20 / 600
  - `labelSmall` ← UX `label.sm` 11 / 16 / 600
- **And** every `TextStyle` uses `FontFamily(Font(R.font.geist_sans_variable, ...))` — Geist Sans Variable bundled as a single OFL-1.1 TTF in `design-system/src/main/res/font/`
- **And** the OFL-1.1 license attribution is committed at `design-system/NOTICE.md` per OFL §3 ("the license must be included with all copies of the font software")
- **And** `TypographyTokensTest.kt` (pure JVM JUnit 5) asserts every text-style's `fontSize`, `lineHeight`, and `fontWeight` matches the UX §5.2 spec; `FontFamily` non-null
- **(UX §5.2; PRD §Project-Type Specific Requirements minimum-text-size; NFR-A-4)**

### AC-4 · Spacing, radius, elevation, motion tokens are typed `Dp` / `Duration` / `Easing` objects exposed via `CompositionLocal`
- **Given** the `HomeservicesTheme` is applied
- **Then** the following typed token objects exist and are readable from any `@Composable` via the appropriate `LocalHomeservices*.current` accessor:
  - `HomeservicesSpacing` — `space0..space24` typed as `androidx.compose.ui.unit.Dp` matching UX §5.3 (0, 4, 8, 12, 16, 24, 32, 48, 64, 96 dp)
  - `HomeservicesRadius` — `sm` 4 dp, `md` 8 dp, `lg` 12 dp, `xl` 20 dp, `full` 9999 dp (UX §5.7)
  - `HomeservicesElevation` — `elev0..elev4` exposed as both `Dp` (for Compose `Card.elevation`) AND a `Shadow` data class carrying the UX §5.5 colour + offset + blur for Skia `androidx.compose.ui.draw.shadow` callers (UX §5.5)
  - `HomeservicesMotion` — `fast` 150 ms, `base` 200 ms (Spring 0.8/0.4), `medium` 300 ms (Spring 0.7/0.35), `slow` 500 ms typed as `kotlin.time.Duration` + paired `androidx.compose.animation.core.Easing` per UX §5.4
- **And** each token object is exposed via a `CompositionLocal`: `LocalHomeservicesSpacing`, `LocalHomeservicesRadius`, `LocalHomeservicesElevation`, `LocalHomeservicesMotion` — installed by `HomeservicesTheme { ... }` so consumers write `MaterialTheme.colorScheme.primary` AND `LocalHomeservicesSpacing.current.space4`
- **And** `SpacingTokensTest.kt`, `RadiusTokensTest.kt`, `MotionTokensTest.kt`, `ElevationTokensTest.kt` (pure JVM JUnit 5) assert every value
- **(UX §5.3, §5.4, §5.5, §5.7; design-system-must-be-typed-not-stringly principle)**

### AC-5 · Extended (non-Material 3) brand tokens exposed via `HomeservicesExtendedColors` + its `CompositionLocal`
- **Given** the `HomeservicesTheme` is applied
- **Then** a `data class HomeservicesExtendedColors(val verified: Color, val neighbourhood: Color, val brandAccent: Color, val brandPrimaryHover: Color)` is exposed via `LocalHomeservicesExtendedColors: ProvidableCompositionLocal<HomeservicesExtendedColors>`
- **And** the theme installs the light or dark variant based on the resolved `darkTheme` flag
- **And** `ExtendedColorsTest.kt` asserts both light + dark variants match UX §5.1 dossier rows
- **And** the file's API documentation explains *why* these aren't in `Material 3 ColorScheme` (Material 3 has no slot for "DigiLocker verified badge" or "society-verified badge" semantics)
- **(UX §5.1 dossier rows; PRD C-1 Trust Dossier specs)**

### AC-6 · `HomeservicesTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit)` is the single consumer entry point
- **Given** any consuming `@Composable`
- **When** it wraps content in `HomeservicesTheme { ... }`
- **Then** `MaterialTheme.colorScheme` returns `HomeservicesLightColorScheme` (light) or `HomeservicesDarkColorScheme` (dark)
- **And** `MaterialTheme.typography` returns `HomeservicesTypography`
- **And** `MaterialTheme.shapes` is set with `small`/`medium`/`large` mapped to `HomeservicesRadius.sm/md/lg`
- **And** all four `LocalHomeservices*` `CompositionLocal`s (Spacing, Radius, Elevation, Motion) + `LocalHomeservicesExtendedColors` are installed and resolvable
- **And** dark mode is **system-driven only at this skeleton stage** — a later story (deferred, see §"Out of Scope") wires a `DataStore<Boolean>`-backed user override that swaps the `darkTheme` parameter via a wrapper composable; this story's `HomeservicesTheme` signature explicitly leaves the `darkTheme` flag as a caller-supplied parameter (default = system) so the future override needs zero API change
- **(UX §10.6 dark-mode first-class; ADR-0001 Compose discipline)**

### AC-7 · `TokenGallery` Paparazzi-only composable + light + dark snapshot tests gate the module
- **Given** the design-system module
- **When** `./gradlew :design-system:verifyPaparazziDebug` runs
- **Then** at minimum two Paparazzi tests pass: `TokenGalleryPaparazziTest.tokenGallery_lightTheme_matchesSnapshot` + `TokenGalleryPaparazziTest.tokenGallery_darkTheme_matchesSnapshot`
- **And** the `@Composable fun TokenGallery()` lives at `design-system/src/main/kotlin/com/homeservices/designsystem/gallery/TokenGallery.kt` and renders, in scrollable column form: every brand + semantic + neutral colour swatch (with hex label), every typography style sample (with token name), every spacing increment as a labelled spacer, every radius sample as a rounded rect, the four elevation levels as Cards, the four motion durations as static labels (motion is captured visually by future Compose-Preview animation tests, not Paparazzi static frames)
- **And** golden PNGs are committed under `design-system/src/test/snapshots/images/` (Paparazzi default snapshot dir)
- **And** Paparazzi version is `^1.3.5` matching the apps (catalog drift gate enforces parity)
- **(UX §5 entire spec is visualised; pixel-regression floor parallels the apps)**

### AC-8 · Both Android apps consume design-system via composite build (`includeBuild`); placeholder theme files deleted
- **Given** `customer-app/settings.gradle.kts` and `technician-app/settings.gradle.kts`
- **Then** each contains exactly one new line: `includeBuild("../design-system")` inside the `pluginManagement { ... }` block-adjacent top-level scope (NOT inside `pluginManagement`, NOT inside `dependencyResolutionManagement`)
- **And** each app's `app/build.gradle.kts` `dependencies { }` block adds `implementation("com.homeservices:design-system")` (group + name resolved by Gradle composite-build substitution from `design-system/build.gradle.kts`'s `group = "com.homeservices"` + `rootProject.name = "design-system"`)
- **And** the following files are **deleted**:
  - `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/theme/Color.kt`
  - `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/theme/Theme.kt`
  - `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/theme/Type.kt`
  - `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/theme/Color.kt`
  - `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/theme/Theme.kt`
  - `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/theme/Type.kt`
- **And** each app's `MainActivity.kt` + `SmokeScreen.kt` import `com.homeservices.designsystem.theme.HomeservicesTheme` (directly — no per-app `HomeservicesCustomerTheme` / `HomeservicesTechnicianTheme` thin wrapper, which becomes premature indirection at skeleton stage; app-personality wrappers can land in a later feature story when there is a real customer-vs-technician chrome divergence to encode)
- **And** `./gradlew :app:assembleDebug` succeeds in **both** apps after the migration
- **(ADR-0001 "shared design-system Gradle module" promise made; this AC delivers it)**

### AC-9 · Both apps' Paparazzi goldens re-recorded once and pixel-locked thereafter
- **Given** the migration
- **When** `./gradlew :app:recordPaparazziDebug` runs once locally in each app
- **Then** the existing `SmokeScreenPaparazziTest` snapshot PNGs under `<app>/app/src/test/snapshots/images/` are **replaced** with the new theme-rendered versions and committed in the same commit that switches the import
- **And** subsequent `./gradlew :app:verifyPaparazziDebug` runs (local + CI) pass with zero pixel drift
- **And** the snapshot diff between the old (BrandBlue `#0B5FEE` Material 3 default) and the new (UX §5 deep teal `#0E4F47` brand primary + Geist Sans typography + new background neutral) is committed as a one-time intentional shift — visible in the PR diff for review reassurance, not as a regression
- **(NFR-U-5 visual-regression discipline + intentional one-shot golden refresh discipline)**

### AC-10 · CI workflow at repo-root `.github/workflows/design-system-ship.yml` is green; both app workflows updated to trigger on `design-system/**` changes
- **Given** a PR is opened from this story's feature branch (`E01-S04-design-system-module`) to `main`
- **When** GitHub Actions discovers `.github/workflows/design-system-ship.yml`
- **Then** the workflow passes every step: BMAD artifacts gate (matching the api-/customer-/technician-/admin-ship.yml pattern), `./gradlew ktlintCheck`, `./gradlew detekt`, `./gradlew lintDebug`, `./gradlew testDebugUnitTest`, `./gradlew koverVerify koverXmlReport`, `./gradlew verifyPaparazziDebug`, `./gradlew assembleRelease` (library AAR; release variant is fine for a library — no signing config needed), Semgrep SAST (`p/kotlin p/owasp-top-ten p/secrets`), and the codex-review marker ancestor-check + scope-diff (verbatim from `api-ship.yml`)
- **And** the workflow has `paths:` filter `['design-system/**', '.github/workflows/design-system-ship.yml', '.codex-review-passed']`
- **And** the workflow sets `defaults.run.working-directory: design-system` and `env.GIT_SHA: ${{ github.sha }}` at job scope
- **And** `customer-ship.yml` and `technician-ship.yml` `paths:` filters are extended to also trigger on `design-system/**` (because the apps' builds depend on the included build — a design-system change must re-test both apps)
- **And** the cross-app catalog drift check in customer-/technician-ship.yml continues to enforce byte-identity between the **two app** catalogs; the **third** catalog at `design-system/gradle/libs.versions.toml` is independent (different dependency surface — no Hilt, no Sentry, no Activity, no ViewModel) and is intentionally NOT covered by the drift check
- **(E01-S03 lessons applied verbatim; new module gets its own gate)**

### AC-11 · Zero new paid SaaS dependencies; ADR-0007 amended; ADR-0010 created
- **Given** `design-system/gradle/libs.versions.toml` + `design-system/build.gradle.kts` + the bundled Geist Sans font
- **Then** every new dependency is OSS (Apache-2.0 / MIT / EPL-2.0 / OFL-1.1) and on the approved free-tier list
- **And** Geist Sans Variable is bundled under SIL OFL-1.1 with `design-system/NOTICE.md` carrying the required attribution + reserved-font-name clause; `design-system/LICENSES/OFL-1.1.txt` carries the full license text
- **And** `docs/adr/0007-zero-paid-saas-constraint.md` is amended with a 2026-04-18 "Story E01-S04" block listing: Compose BOM (already approved E01-S03 — restate), Material 3 (already approved — restate), Paparazzi (already approved — restate), Kover (already approved — restate), Detekt + ktlint (already approved — restate), Geist Sans Variable (NEW — OFL-1.1, ₹0)
- **And** a **new** ADR — `docs/adr/0010-design-system-composite-build.md` — is created and committed in this story explaining the composite-build (`includeBuild`) distribution choice over Maven Local publish, with status `accepted`, full context (apps consume design tokens; one-source-of-truth principle; iteration speed; no artifact repository to manage), decision (composite build), consequences (pros: instant ripple; cons: requires both apps to opt-in via `settings.gradle.kts`), alternatives considered (Maven Local — adds publish step; root-of-repo `settings.gradle.kts` `include(":design-system", ":customer-app:app", ...)` — violates ADR-0001 "no root Gradle"; git-submodule + Maven Central publish — overkill at MVP)
- **(ADR-0007; ADR-0001 honoured; ADR-0010 documents new architectural choice)**

### AC-12 · Module README + per-token API docs; `MIGRATION-FROM-PLACEHOLDER.md` for posterity
- **Given** the new module
- **Then** `design-system/README.md` exists with: 5-line module description, Quick start (how the apps consume it via composite build), Token cheat sheet (one-line summary per token group with file pointers), Test (`./gradlew verifyPaparazziDebug` etc.), Lint (`./gradlew ktlintCheck detekt lintDebug`), Conventions (Compose-only, no DI, no networking, no app-level concerns)
- **And** every public Kotlin object in `design-system/src/main/kotlin/com/homeservices/designsystem/theme/*.kt` carries a KDoc comment **referencing the UX §5 sub-section it implements** (e.g. `/** UX §5.1 brand palette — see docs/ux-design.md */`) — so any future contributor opening Color.kt sees the source-of-truth pointer
- **And** `design-system/MIGRATION-FROM-PLACEHOLDER.md` is created (5–10 lines) documenting that the placeholder `BrandBlue #0B5FEE` was deliberately not the UX-spec value (the E01-S03 skeleton used a "prove-the-theming-path" colour) and was replaced with the UX §5.1 deep-teal `#0E4F47` in this story; this file will be `git rm`'d once a real human contributor onboards or 90 days post-merge — whichever comes first — to avoid documentation rot
- **(UX §5 traceability; future-contributor onboarding aid)**

---

## Tasks / Subtasks

> **TDD discipline (per CLAUDE.md):** every task that adds production code writes the failing test first.

- [ ] **T1 — Create `design-system/` module skeleton: settings, root build, gradle.properties, libs.versions.toml, wrapper, detekt.yml, README, NOTICE/LICENSES, .gitignore** (AC-1, AC-11, AC-12)
  - [ ] T1.1 Create `design-system/settings.gradle.kts` with `rootProject.name = "design-system"`, `pluginManagement { repositories { gradlePluginPortal(); google(); mavenCentral() } }`, `dependencyResolutionManagement { repositories { google(); mavenCentral() } }` — single-module composite build (no `include(":foo")`)
  - [ ] T1.2 Create `design-system/build.gradle.kts` (the library module's build directly at design-system root — NOT a nested `library/` directory; `design-system/` IS the module): `plugins { android-library + kotlin-android + kotlin-compose + ktlint + detekt + paparazzi + kover }`, `android { namespace = "com.homeservices.designsystem"; compileSdk = 35; defaultConfig.minSdk = 26; defaultConfig.consumerProguardFiles("proguard-rules.pro") }`, `group = "com.homeservices"`, `kotlin { jvmToolchain(21); compilerOptions { jvmTarget = JVM_17; allWarningsAsErrors = true; freeCompilerArgs += "-Xexplicit-api=strict" } }` (mirrors E01-S03 K2 + explicit-API discipline)
  - [ ] T1.3 Create `design-system/gradle.properties`, `design-system/gradle/libs.versions.toml` (dep subset: Compose BOM 2024.11.00 + Material 3 + Compose UI tooling + Paparazzi 1.3.5 + Kover 0.9.0 + Detekt 1.23.7 + ktlint 12.1.1 + JUnit 5 5.11.3 + AssertJ + Robolectric — no Hilt, no Sentry, no Activity, no Lifecycle, no ViewModel), Gradle wrapper @ 8.11 with `distributionSha256Sum`, `gradlew`, `gradlew.bat`
  - [ ] T1.4 Create `design-system/detekt.yml` matching the apps' (build.maxIssues 0, Compose `@Composable` PascalCase exclusion)
  - [ ] T1.5 Create `design-system/proguard-rules.pro` (consumer rules: `-keep class com.homeservices.designsystem.theme.**` so app shrinking doesn't strip token classes — single line)
  - [ ] T1.6 Create `design-system/README.md`, `design-system/NOTICE.md` (OFL-1.1 attribution stub — final font lands in T3), `design-system/LICENSES/OFL-1.1.txt` (full license text), `design-system/.gitignore` (`build/`, `.gradle/`, `local.properties`, `.idea/`)
  - [ ] T1.7 Create `design-system/src/main/AndroidManifest.xml` (just `<manifest package="com.homeservices.designsystem" />` — no `<application>`, no permissions; library)
  - [ ] T1.8 Verify `./gradlew :design-system:assembleRelease` exits 0 with empty source set (smoke check before tokens)

- [ ] **T2 — Color tokens (UX §5.1) + ColorScheme + ExtendedColors + tests** (AC-2, AC-5)
  - [ ] T2.1 (RED) Write `design-system/src/test/kotlin/com/homeservices/designsystem/theme/ColorTokensTest.kt` (pure JUnit 5 + AssertJ) asserting every UX §5.1 hex value as a typed constant; expect compile error (no `HomeservicesColors` yet)
  - [ ] T2.2 (RED) Write `ExtendedColorsTest.kt` asserting both light + dark variants of `HomeservicesExtendedColors` match UX §5.1 dossier rows
  - [ ] T2.3 (RED) Write `HomeservicesColorsContrastTest.kt` asserting WCAG 2.1 AA contrast (≥ 4.5:1 normal text, ≥ 3:1 large text) for every `(foreground, background)` pair used in `HomeservicesLightColorScheme` and `HomeservicesDarkColorScheme` — implement contrast via WCAG 2.1 relative-luminance formula (no external lib needed; ~30 LoC pure Kotlin helper in `internal object Wcag21Contrast`)
  - [ ] T2.4 (GREEN) Implement `design-system/src/main/kotlin/com/homeservices/designsystem/theme/Color.kt` — top-level `internal` raw colour constants prefixed by token namespace (e.g. `internal val BrandPrimary = Color(0xFF0E4F47)`) + a `public object HomeservicesColors` exposing them grouped (`HomeservicesColors.brand.primary` etc.) + `public val HomeservicesLightColorScheme: ColorScheme` + `public val HomeservicesDarkColorScheme: ColorScheme` per the §"Color Slot Mapping" table
  - [ ] T2.5 (GREEN) Implement `ExtendedColors.kt`: `public data class HomeservicesExtendedColors(...)`, `public val HomeservicesExtendedColorsLight`, `public val HomeservicesExtendedColorsDark`, `public val LocalHomeservicesExtendedColors: ProvidableCompositionLocal<HomeservicesExtendedColors> = staticCompositionLocalOf { HomeservicesExtendedColorsLight }`
  - [ ] T2.6 KDoc every public symbol with the `UX §5.1` pointer

- [ ] **T3 — Typography tokens (UX §5.2) + Geist Sans bundling + tests** (AC-3)
  - [ ] T3.1 Download Geist Sans Variable TTF from the official Vercel/Geist repo (`geist-sans/Geist-Variable.ttf`) — single file, OFL-1.1 — commit at `design-system/src/main/res/font/geist_sans_variable.ttf`. Verify SHA-256 in `NOTICE.md` for tamper-evidence
  - [ ] T3.2 Append OFL-1.1 attribution + reserved font name "Geist" to `NOTICE.md`
  - [ ] T3.3 (RED) Write `TypographyTokensTest.kt` asserting every `TextStyle` in `HomeservicesTypography`'s `fontSize`, `lineHeight`, `fontWeight` matches UX §5.2; expect compile error
  - [ ] T3.4 (GREEN) Implement `design-system/src/main/kotlin/com/homeservices/designsystem/theme/Typography.kt` — `public val HomeservicesFontFamily: FontFamily = FontFamily(Font(R.font.geist_sans_variable, FontWeight.Normal, FontStyle.Normal))` (variable font handles all weights via `FontWeight` axis at runtime — Compose 1.7+ supports this); `public val HomeservicesTypography: Typography` per the AC-3 mapping table

- [ ] **T4 — Spacing + Radius + Elevation + Motion typed tokens + CompositionLocals + tests** (AC-4)
  - [ ] T4.1 (RED) Write `SpacingTokensTest.kt`, `RadiusTokensTest.kt`, `ElevationTokensTest.kt`, `MotionTokensTest.kt` asserting every value
  - [ ] T4.2 (GREEN) Implement `Spacing.kt` (`public object HomeservicesSpacing { val space0 = 0.dp; val space1 = 4.dp; ... val space24 = 96.dp }` + `public val LocalHomeservicesSpacing = staticCompositionLocalOf { HomeservicesSpacing }`)
  - [ ] T4.3 (GREEN) Implement `Radius.kt` (`public object HomeservicesRadius { val sm = 4.dp; val md = 8.dp; val lg = 12.dp; val xl = 20.dp; val full = 9999.dp }` + Local)
  - [ ] T4.4 (GREEN) Implement `Elevation.kt` — typed `Dp` values + a `public data class HomeservicesShadow(val offsetX: Dp, val offsetY: Dp, val blur: Dp, val color: Color)` for the four levels per UX §5.5; expose both `HomeservicesElevation.elev0..elev4` (`Dp` for `Card.elevation`) and `HomeservicesElevationShadows.elev0..elev4` (`HomeservicesShadow` for custom Skia shadows). Light + dark colour variants per UX §5.5
  - [ ] T4.5 (GREEN) Implement `Motion.kt` — `public object HomeservicesMotion { val fast = 150.milliseconds; val base = 200.milliseconds; val medium = 300.milliseconds; val slow = 500.milliseconds }` (using `kotlin.time.Duration`) + `public object HomeservicesEasing { val standard = CubicBezierEasing(0.4f, 0f, 0.2f, 1f); val emphasizedDecelerate = CubicBezierEasing(0.22f, 1f, 0.36f, 1f); val baseSpring = spring<Float>(dampingRatio = 0.8f, stiffness = 0.4f); ... }` per UX §5.4

- [ ] **T5 — `HomeservicesTheme` composable wires it all + Material 3 `Shapes`** (AC-6)
  - [ ] T5.1 Implement `design-system/src/main/kotlin/com/homeservices/designsystem/theme/HomeservicesTheme.kt`:
    ```kotlin
    @Composable
    public fun HomeservicesTheme(
        darkTheme: Boolean = isSystemInDarkTheme(),
        content: @Composable () -> Unit,
    ) {
        val colorScheme = if (darkTheme) HomeservicesDarkColorScheme else HomeservicesLightColorScheme
        val extendedColors = if (darkTheme) HomeservicesExtendedColorsDark else HomeservicesExtendedColorsLight
        CompositionLocalProvider(
            LocalHomeservicesSpacing provides HomeservicesSpacing,
            LocalHomeservicesRadius provides HomeservicesRadius,
            LocalHomeservicesElevation provides HomeservicesElevation,
            LocalHomeservicesMotion provides HomeservicesMotion,
            LocalHomeservicesExtendedColors provides extendedColors,
        ) {
            MaterialTheme(
                colorScheme = colorScheme,
                typography = HomeservicesTypography,
                shapes = Shapes(
                    extraSmall = RoundedCornerShape(HomeservicesRadius.sm),
                    small = RoundedCornerShape(HomeservicesRadius.md),
                    medium = RoundedCornerShape(HomeservicesRadius.lg),
                    large = RoundedCornerShape(HomeservicesRadius.xl),
                    extraLarge = RoundedCornerShape(HomeservicesRadius.full),
                ),
                content = content,
            )
        }
    }
    ```

- [ ] **T6 — `TokenGallery` Composable + Paparazzi tests (light + dark) + first golden record** (AC-7)
  - [ ] T6.1 (RED) Write `TokenGalleryPaparazziTest.kt` with two `@Test` methods (`tokenGallery_lightTheme_matchesSnapshot`, `tokenGallery_darkTheme_matchesSnapshot`); both at `DeviceConfig.PIXEL_5`; both wrap content in `HomeservicesTheme(darkTheme = true|false) { TokenGallery() }`
  - [ ] T6.2 (GREEN) Implement `design-system/src/main/kotlin/com/homeservices/designsystem/gallery/TokenGallery.kt` — scrollable `Column` of: §"Brand colours" swatch row, §"Semantic colours" swatch row, §"Neutrals" swatch grid, §"Typography" sample text per style with token name label, §"Spacing" labelled `Spacer`s 0..24, §"Radius" 5 `Box`es with each radius applied, §"Elevation" 5 `Card`s with each elev level, §"Motion" 4 labelled rows showing duration values (static Paparazzi frames; animated motion testing is a future story)
  - [ ] T6.3 Run `./gradlew :design-system:recordPaparazziDebug` once locally to emit golden PNGs; commit them under `design-system/src/test/snapshots/images/`
  - [ ] T6.4 Run `./gradlew :design-system:verifyPaparazziDebug` to confirm CI-mode passes

- [ ] **T7 — Migrate customer-app: include design-system, delete placeholder theme, switch import, re-record Paparazzi** (AC-8, AC-9)
  - [ ] T7.1 Add `includeBuild("../design-system")` to `customer-app/settings.gradle.kts` (top-level, OUTSIDE `pluginManagement` and `dependencyResolutionManagement` blocks per Gradle composite-build spec)
  - [ ] T7.2 Add `implementation("com.homeservices:design-system")` to `customer-app/app/build.gradle.kts` `dependencies { }` block (right under `compose-material3` line); remove now-redundant `implementation(libs.compose.material3)` ONLY IF every Material 3 usage in customer-app routes through HomeservicesTheme — verify by grep; otherwise keep both (Material 3 is transitively pulled but explicit is clearer)
  - [ ] T7.3 Update `customer-app/.../MainActivity.kt` + `customer-app/.../ui/SmokeScreen.kt` imports: `com.homeservices.customer.ui.theme.HomeservicesCustomerTheme` → `com.homeservices.designsystem.theme.HomeservicesTheme`. Update the wrapper call site from `HomeservicesCustomerTheme { ... }` → `HomeservicesTheme { ... }`
  - [ ] T7.4 `git rm customer-app/app/src/main/kotlin/com/homeservices/customer/ui/theme/{Color,Theme,Type}.kt`
  - [ ] T7.5 Run `./gradlew :app:assembleDebug` in `customer-app/` to confirm composite-build resolution works (`com.homeservices:design-system` substitutes to local source)
  - [ ] T7.6 Run `./gradlew :app:recordPaparazziDebug` in `customer-app/` once; the `SmokeScreenPaparazziTest` snapshots regenerate (now showing UX §5 deep-teal brand + Geist Sans typography); commit the replaced golden PNGs in the SAME commit as the import switch (atomic intentional pixel shift)
  - [ ] T7.7 Run `./gradlew :app:verifyPaparazziDebug` to confirm zero drift

- [ ] **T8 — Migrate technician-app: same as T7, mirrored** (AC-8, AC-9)
  - [ ] T8.1 Identical sub-task list to T7 with `customer` → `technician` substitutions everywhere

- [ ] **T9 — Repo-root CI workflow `design-system-ship.yml` + extend customer-/technician-ship.yml `paths:` filters** (AC-10)
  - [ ] T9.1 Create `.github/workflows/design-system-ship.yml` modelled verbatim on `customer-ship.yml`: `name`, `paths:` `['design-system/**', '.github/workflows/design-system-ship.yml', '.codex-review-passed']`, `defaults.run.working-directory: design-system`, `env: { GIT_SHA: ${{ github.sha }} }`, full step list (BMAD gate, ktlintCheck, detekt, lintDebug, testDebugUnitTest, koverVerify koverXmlReport, verifyPaparazziDebug, assembleRelease, Semgrep `p/kotlin p/owasp-top-ten p/secrets`, codex-marker ancestor-check + scope-diff)
  - [ ] T9.2 Edit `.github/workflows/customer-ship.yml` `paths:` filter: add `'design-system/**'` (so a token tweak re-tests customer-app)
  - [ ] T9.3 Edit `.github/workflows/technician-ship.yml` `paths:` filter: add `'design-system/**'`
  - [ ] T9.4 Verify the customer-ship + technician-ship `diff` catalog-drift step continues to operate on the **two app catalogs only** (NOT the third design-system catalog); add an inline comment in each workflow explaining the third catalog is intentionally outside the drift gate

- [ ] **T10 — ADR sweep: amend ADR-0007, create ADR-0010** (AC-11)
  - [ ] T10.1 Append a 2026-04-18 "Story E01-S04" amendment block to `docs/adr/0007-zero-paid-saas-constraint.md` listing every dep used by design-system (mostly restating E01-S03's list) PLUS the new Geist Sans Variable OFL-1.1 font
  - [ ] T10.2 Create `docs/adr/0010-design-system-composite-build.md` per AC-11 spec (status: accepted; context; decision: composite build via `includeBuild`; consequences; alternatives considered including Maven Local + root-of-repo settings.gradle.kts + git-submodule)
  - [ ] T10.3 Update `docs/adr/README.md` ADR index to list 0010
  - [ ] T10.4 (Cross-link) Add a short "superseded-by-implementation: E01-S04" note to ADR-0001 §Consequences first bullet (which originally promised the shared design-system Gradle module) — inline link to ADR-0010 + this story file

- [ ] **T11 — Module README + KDoc + MIGRATION-FROM-PLACEHOLDER.md** (AC-12)
  - [ ] T11.1 Write `design-system/README.md` per AC-12 spec
  - [ ] T11.2 Write `design-system/MIGRATION-FROM-PLACEHOLDER.md` per AC-12 spec
  - [ ] T11.3 Sweep every public symbol in `design-system/src/main/kotlin/com/homeservices/designsystem/theme/*.kt` for KDoc; add UX §5 sub-section pointer where missing

- [ ] **T12 — Pre-push 5-layer review gate** (per CLAUDE.md §Per-Story Protocol)
  - [ ] T12.1 `/code-review` (cheap lint + stylistic — Claude)
  - [ ] T12.2 `/security-review`
  - [ ] T12.3 `/codex-review-gate` — **authoritative**; produces `.codex-review-passed` keyed to current commit
  - [ ] T12.4 `/bmad-code-review` (Blind Hunter + Edge Case Hunter + Acceptance Auditor)
  - [ ] T12.5 `/superpowers:requesting-code-review`
  - [ ] T12.6 Only after all 5 layers, `git push`; PR description references this story + ADR-0010 + UX §5

---

## Dev Notes

### Story Foundation Context

This is the **fourth E01 foundation story** and the **first cross-app shared-code story**. Dependencies: E01-S01 (`33db7bb`), E01-S02 (`1236d4c`), E01-S03 (`50aa8de`), E01-S06 (`1bd0706`) all merged. Phase gate satisfied. Both apps have working Paparazzi-gated skeletons with placeholder `BrandBlue #0B5FEE` themes ready to be replaced.

**Why this matters strategically:** every Android feature story from E02 onward will render against `HomeservicesTheme`. Getting tokens wrong here means re-recording goldens in 20 future stories. Getting the composite-build distribution wrong means a publish-loop gymnastics every iteration. This is a one-shot foundation — pay the careful-thinking tax now.

### Why Composite Build (`includeBuild`) — Not Maven Local Publish

See ADR-0010 (created in T10.2). Summary:

- **Composite build** = both apps' `settings.gradle.kts` declare `includeBuild("../design-system")`; Gradle substitutes `com.homeservices:design-system` to the local source. Edits in `design-system/` are picked up immediately on next app build. No publish step. No artifact repository. Zero infrastructure cost. **Picked.**
- **Maven Local publish** = developer runs `./gradlew :design-system:publishToMavenLocal` after every change; apps depend on `mavenLocal()` repo. Adds a publish step to every dev cycle; CI must orchestrate publish-then-app-build. Rejected.
- **Root-of-repo `settings.gradle.kts` `include(":design-system", ":customer-app:app", ":technician-app:app")`** = a single Gradle build orchestrates everything. Violates ADR-0001 "Two separate Android codebases" + the per-app independence principle that lets `customer-ship.yml` and `technician-ship.yml` be independent gates. Rejected.
- **Maven Central / GitHub Packages publish** = real artifact repo + version-pinned consumption. Overkill at MVP; revisit if/when a third party (admin-web, future iOS) consumes design tokens. Deferred.

### Color Slot Mapping

UX §5.1 tokens → Material 3 `ColorScheme` slots:

| M3 slot | Light | Dark |
|---|---|---|
| `primary` | `BrandPrimary` `#0E4F47` | `BrandPrimary` `#1E8378` |
| `onPrimary` | `Color.White` | `Color(0xFF0A2E2A)` (dark teal-on-light-teal) |
| `primaryContainer` | `Color(0xFFCFEBE5)` (tinted brand light) | `BrandPrimary` `#1E8378` |
| `onPrimaryContainer` | `BrandPrimary` `#0E4F47` | `Color.White` |
| `secondary` | `BrandAccent` `#EF6F4B` | `BrandAccent` `#F78866` |
| `onSecondary` | `Color.White` | `Color(0xFF4A1B0E)` |
| `tertiary` | `SemanticInfo` `#2E72D9` | `SemanticInfo` `#4F90EC` |
| `error` | `SemanticDanger` `#D73C3C` | `SemanticDanger` `#EC5252` |
| `onError` | `Color.White` | `Color(0xFF4A0E0E)` |
| `background` | `Neutral0` `#FFFFFF` | `Neutral0` `#0A0A0B` |
| `onBackground` | `Neutral900` `#18181B` | `Neutral900` `#FAFAFA` |
| `surface` | `Neutral50` `#FAFAFA` | `Neutral50` `#141518` |
| `onSurface` | `Neutral900` | `Neutral900` (dark variant) |
| `surfaceVariant` | `Neutral100` `#F4F4F5` | `Neutral100` `#1D1F23` |
| `onSurfaceVariant` | `Neutral500` `#71717A` | `Neutral500` `#9CA3AF` |
| `outline` | `Neutral200` `#E4E4E7` | `Neutral200` `#2A2D34` |
| `outlineVariant` | `Neutral100` | `Neutral100` |

UX-specific tokens not in Material 3 (`semantic.success`, `semantic.warning`, `dossier.verified`, `dossier.neighbourhood`, `brandAccent`, `brandPrimaryHover`) → exposed via `HomeservicesExtendedColors` + `LocalHomeservicesExtendedColors` `CompositionLocal`.

### Critical Architectural Constraints (READ BEFORE CODING)

| Constraint | Source | Story-level implication |
|---|---|---|
| **Composite build (`includeBuild`), NOT Maven Local** | ADR-0010 (this story creates) | `design-system/` is its own Gradle root; both apps declare `includeBuild("../design-system")` |
| **`com.homeservices:design-system` is the substitution coordinate** | Gradle composite-build spec | `design-system/build.gradle.kts` sets `group = "com.homeservices"`; `settings.gradle.kts` sets `rootProject.name = "design-system"` |
| **Single canonical `HomeservicesTheme` (no per-app wrappers)** | Skeleton scope | Both apps directly call `HomeservicesTheme { ... }`; `HomeservicesCustomerTheme` / `HomeservicesTechnicianTheme` are **deleted** |
| **Geist Sans Variable bundled in module `res/font/`** | UX §5.2; OFL-1.1 license attribution required | Single TTF file ≤ 80 KB; `NOTICE.md` + `LICENSES/OFL-1.1.txt` committed |
| **Material 3 `Shapes` mapped to `HomeservicesRadius`** | UX §5.7 | `Shapes.small/medium/large/extraLarge` set via `RoundedCornerShape(HomeservicesRadius.*)` |
| **Dark mode: system-driven only at this story; user override deferred** | AC-6, scope discipline | `darkTheme: Boolean = isSystemInDarkTheme()` parameter exposed; future DataStore override is a wrapper |
| **No Hilt / Sentry / networking in design-system** | Module purity | Pure Compose + tokens; no DI graph; no observability; no I/O |
| **Third `libs.versions.toml` (design-system) is OUT of the cross-app drift check** | Different dep surface | Drift check stays on the two app catalogs only |
| **CI: third workflow `design-system-ship.yml` + extended `paths:` on the two app workflows** | E01-S03 lesson reapplied | Each shippable Gradle root gets its own gate; consumers retest on token changes |
| **Re-record Paparazzi goldens once; lock thereafter** | AC-9 intentional pixel shift | Atomic commit per app: import switch + new goldens + deleted theme files |
| **Codex review is authoritative gate** | CLAUDE.md | `.codex-review-passed` required before push; new workflow enforces same ancestor-check pattern |
| **Zero paid SaaS** | ADR-0007 | Geist Sans is OFL-1.1; everything else is approved-list OSS already from E01-S03 |

### Library/Framework Requirements

`design-system/gradle/libs.versions.toml` is intentionally a **subset** of the apps' catalog — only what a token+theme module needs:

| Plugin / Library | Version | Source |
|---|---|---|
| Kotlin (`org.jetbrains.kotlin.android`) | 2.0.21 | E01-S03 catalog |
| Kotlin Compose plugin (`org.jetbrains.kotlin.plugin.compose`) | 2.0.21 | E01-S03 catalog |
| Android Gradle Plugin (`com.android.library` — note: library, not application) | 8.6.0 | E01-S03 catalog |
| Compose BOM | 2024.11.00 | E01-S03 catalog |
| Compose UI / Material 3 / Tooling Preview | (BOM-pinned) | E01-S03 catalog |
| Paparazzi | 1.3.5 | E01-S03 catalog |
| Kover | 0.9.0 | E01-S03 catalog |
| Detekt | 1.23.7 | E01-S03 catalog |
| ktlint Gradle plugin | 12.1.1 | E01-S03 catalog |
| JUnit 5 | 5.11.3 | E01-S03 catalog |
| AssertJ | 3.26.3 | E01-S03 catalog |
| Robolectric (for any future Compose-test that needs Android resources) | 4.14.1 | E01-S03 catalog (likely unused at skeleton; keep for parity) |
| **Geist Sans Variable TTF** | n/a (single file) | **NEW — bundled in `src/main/res/font/`; OFL-1.1; <80 KB** |

Explicitly **NOT** in design-system catalog: Hilt, KSP, Sentry, AndroidX Activity/Lifecycle/ViewModel, JUnit 4 vintage engine (no Paparazzi-Robolectric mix here — the design-system Paparazzi tests don't need vintage; if they do, add in a follow-up).

### Source Tree Components to Touch

```
design-system/                                                                     CREATE (new top-level)
├── README.md                                                                       CREATE
├── NOTICE.md                                                                       CREATE (OFL attrib)
├── LICENSES/OFL-1.1.txt                                                            CREATE (full license text)
├── MIGRATION-FROM-PLACEHOLDER.md                                                   CREATE (90-day shelf-life note)
├── .gitignore                                                                      CREATE
├── settings.gradle.kts                                                             CREATE
├── build.gradle.kts                                                                CREATE (library module)
├── proguard-rules.pro                                                              CREATE (consumer rules)
├── gradle.properties                                                               CREATE
├── gradle/
│   ├── libs.versions.toml                                                          CREATE (subset catalog)
│   └── wrapper/{gradle-wrapper.properties, gradle-wrapper.jar}                     CREATE (Gradle 8.11)
├── gradlew, gradlew.bat                                                            CREATE
├── detekt.yml                                                                      CREATE (mirror apps)
├── src/main/
│   ├── AndroidManifest.xml                                                         CREATE (library; no application)
│   ├── kotlin/com/homeservices/designsystem/
│   │   ├── theme/
│   │   │   ├── Color.kt                                                            CREATE (UX §5.1 + ColorScheme)
│   │   │   ├── ExtendedColors.kt                                                   CREATE (dossier + accent + hover)
│   │   │   ├── Typography.kt                                                       CREATE (UX §5.2 + Geist Sans)
│   │   │   ├── Spacing.kt                                                          CREATE (UX §5.3 + Local)
│   │   │   ├── Radius.kt                                                           CREATE (UX §5.7 + Local)
│   │   │   ├── Elevation.kt                                                        CREATE (UX §5.5 + Local)
│   │   │   ├── Motion.kt                                                           CREATE (UX §5.4 + Local)
│   │   │   └── HomeservicesTheme.kt                                                CREATE (the wrapper)
│   │   └── gallery/
│   │       └── TokenGallery.kt                                                     CREATE (Paparazzi gallery)
│   └── res/font/
│       └── geist_sans_variable.ttf                                                 CREATE (bundled OFL-1.1)
└── src/test/
    ├── kotlin/com/homeservices/designsystem/
    │   ├── theme/
    │   │   ├── ColorTokensTest.kt                                                  CREATE (UX §5.1 hex assertion)
    │   │   ├── ExtendedColorsTest.kt                                               CREATE
    │   │   ├── HomeservicesColorsContrastTest.kt                                   CREATE (WCAG 2.1 AA)
    │   │   ├── TypographyTokensTest.kt                                             CREATE
    │   │   ├── SpacingTokensTest.kt                                                CREATE
    │   │   ├── RadiusTokensTest.kt                                                 CREATE
    │   │   ├── ElevationTokensTest.kt                                              CREATE
    │   │   └── MotionTokensTest.kt                                                 CREATE
    │   └── gallery/
    │       └── TokenGalleryPaparazziTest.kt                                        CREATE (light + dark)
    └── snapshots/images/
        ├── *_tokenGallery_lightTheme*.png                                          CREATE (recorded)
        └── *_tokenGallery_darkTheme*.png                                           CREATE (recorded)

customer-app/
├── settings.gradle.kts                                                             MODIFY (add includeBuild)
├── app/build.gradle.kts                                                            MODIFY (add design-system dep)
├── app/src/main/kotlin/com/homeservices/customer/
│   ├── MainActivity.kt                                                             MODIFY (import + wrapper switch)
│   ├── ui/SmokeScreen.kt                                                           MODIFY (import switch)
│   └── ui/theme/{Color,Theme,Type}.kt                                              DELETE
└── app/src/test/snapshots/images/*.png                                             RE-RECORD (atomic commit)

technician-app/                                                                     SAME CHANGES MIRRORED

.github/workflows/
├── design-system-ship.yml                                                          CREATE (modelled on customer-ship.yml)
├── customer-ship.yml                                                               MODIFY (add design-system/** to paths)
└── technician-ship.yml                                                             MODIFY (add design-system/** to paths)

docs/adr/
├── 0007-zero-paid-saas-constraint.md                                               MODIFY (E01-S04 amendment block)
├── 0010-design-system-composite-build.md                                           CREATE (new ADR)
├── 0001-primary-stack-choice.md                                                    MODIFY (one-line cross-link to 0010)
└── README.md                                                                       MODIFY (index 0010)
```

**Files explicitly NOT created:**

- No app-personality wrappers (`HomeservicesCustomerTheme`, `HomeservicesTechnicianTheme`) — premature indirection
- No Tailwind / CSS export pipeline for `admin-web/` — deferred (Phase 2 cross-stack token sync ADR)
- No Figma library or `figma:figma-generate-library` invocation — that is **E01-S05**'s entire scope
- No `kotlin-multiplatform` for token-sharing-with-iOS — deferred to Phase 4 KMP/SwiftUI ADR (AQ-1)
- No `lifecycle-runtime-compose` / `androidx.activity.compose` — design-system has no `Activity` or `LifecycleOwner` concerns
- No app-level `Sentry` / `Hilt` deps — module is pure presentation
- No new DataStore-backed user dark-mode preference — deferred (AC-6 explicitly leaves the API hook)
- No `androidx.compose.runtime.saveable.Saver` instances for tokens — tokens are immutable; nothing to save

### Anti-patterns (DO NOT)

> 14 explicit anti-patterns. Each one represents a real prior-art mistake in Compose design-system extractions.

1. **Don't `publishToMavenLocal` as the consumption path.** Composite build (`includeBuild`) is the chosen distribution. Maven Local adds a manual publish step on every change.
2. **Don't put `design-system/` inside `customer-app/` or `technician-app/`.** It's a top-level peer module; both apps consume it via `../design-system`. Nesting under one app implies ownership coupling.
3. **Don't write `HomeservicesCustomerTheme` and `HomeservicesTechnicianTheme` thin wrappers around `HomeservicesTheme`.** Premature personality injection. Both apps use the canonical `HomeservicesTheme` directly until a real chrome divergence appears in a feature story.
4. **Don't put tokens in XML resources (`colors.xml`, `dimens.xml`).** Compose-first; typed Kotlin objects only. XML resources can't be `import`ed; can't use `kotlin.time.Duration`; can't carry KDoc.
5. **Don't expose tokens as raw `Int` / `Float` / `String`.** Always typed: `Dp`, `Color`, `Duration`, `TextStyle`, `FontFamily`, `Easing`. The whole point of the module is type-safety.
6. **Don't skip the `CompositionLocal`s for spacing/radius/elevation/motion.** Direct `HomeservicesSpacing.space4` works but defeats theme-override. Always `LocalHomeservicesSpacing.current.space4` in consumer code so a future themed override (e.g. high-density variant) lands in one place.
7. **Don't bundle Hindi / Tamil / Bengali fonts in this story.** Geist Sans Latin only; the Noto family lands in the i18n story. Bundling all fonts now adds ~500 KB to the AAR for zero current consumer.
8. **Don't apply the Hilt plugin to `design-system/build.gradle.kts`.** No DI in a presentation library. Hilt-in-everything is the wrong default; pay the cost only where you need the graph.
9. **Don't write a Storybook server for Android.** The `TokenGallery` Composable + its Paparazzi golden is the visual reference. Real Storybook (Storybook for Android via Showkase) is a separate later story if/when needed.
10. **Don't update `customer-app/CLAUDE.md` or `technician-app/CLAUDE.md` to mention the design-system.** Template residue; refresh is a separate doc-tooling story.
11. **Don't extract `customer-app`'s `BrandBlue #0B5FEE` placeholder constant into the shared module.** It was deliberately wrong (E01-S03 §"Why No Design-System Module Yet"). Replace with the UX §5.1 brand teal `#0E4F47` — that is the source of truth.
12. **Don't widen the cross-app catalog drift check to cover the design-system catalog.** Different dep surface (no Hilt, no Sentry, no Activity); the third file is intentionally divergent.
13. **Don't `git rm` the placeholder `ui/theme/{Color,Theme,Type}.kt` files in a different commit from the one that switches the import.** The migration must be atomic — split commits leave one commit where neither path resolves.
14. **Don't add the `hilt-android-compiler` dependency to `design-system/build.gradle.kts`.** Even as a `kspTest` dep — there are no Hilt-injected tests in this module.

---

## Library / Framework Requirements

(See "Library/Framework Requirements" table in Dev Notes — sized for inclusion above.)

---

## Testing Standards

| Test type | Location | Framework | Coverage |
|---|---|---|---|
| Color/Spacing/Radius/Motion/Elevation hex+value assertion | `design-system/src/test/kotlin/.../theme/*Test.kt` | JUnit 5 + AssertJ (pure JVM) | Every UX §5 token asserted |
| WCAG 2.1 AA contrast | `design-system/src/test/kotlin/.../theme/HomeservicesColorsContrastTest.kt` | JUnit 5 + ~30 LoC pure-Kotlin contrast helper | Every (foreground, background) pair in both `ColorScheme`s |
| Token gallery snapshot | `design-system/src/test/kotlin/.../gallery/TokenGalleryPaparazziTest.kt` | Paparazzi 1.3.5 | Light + dark @ Pixel 5 |
| Smoke screen pixel parity post-migration | `customer-app/.../SmokeScreenPaparazziTest.kt` + `technician-app/.../SmokeScreenPaparazziTest.kt` | Paparazzi (existing from E01-S03) | Re-recorded once; locked thereafter |
| Kover threshold (design-system) | `design-system/build.gradle.kts` | Kover 0.9.0 | Lines + branches + instructions ≥ 80% (excludes Compose generated singletons + R/BuildConfig + the gallery composable's Compose layout DSL whose coverage is captured by the Paparazzi render) |

---

## Out of Scope

- DataStore-backed user dark-mode preference override (AC-6 leaves the API hook; implementation is a later story when there's a Settings screen to host the toggle)
- Tailwind v4 `@theme { ... }` token export pipeline for `admin-web/` (Phase 2 cross-stack token sync ADR)
- Figma library generation via `figma:figma-generate-library` (entire E01-S05 scope)
- KMP-shared tokens for iOS (Phase 4 KMP/SwiftUI ADR; AQ-1)
- App-personality wrappers (`HomeservicesCustomerTheme`, `HomeservicesTechnicianTheme`) — when there's actual chrome divergence to encode
- Compose Preview annotations (`@Preview`) on tokens — Paparazzi is the gating visual; `@Preview` is dev-only convenience and adds no CI value
- Storybook for Android (Showkase library) — separate later story if needed
- Hindi / Tamil / Bengali font bundling — i18n story
- Motion-curve Compose-animation tests — future story (Paparazzi captures static frames only)
- A11y Scanner integration for the gallery — future story (axe-core-equivalent contrast is captured by `HomeservicesColorsContrastTest`)
- Design-token snapshotting via JSON / YAML for cross-stack consumption — Phase 2 (token-pipeline ADR)
- Screen-reader content descriptions on `TokenGallery` swatches — gallery is a developer aid, not a user-facing screen

---

## Open Questions

> Defer to brainstorm session for resolution.

1. **Q1** Composite build vs Maven Local publish — committed in this spec to composite build via `includeBuild`. Brainstorm should pressure-test against (a) iteration speed with two apps, (b) CI cold-build cost, (c) future admin-web token consumption.
2. **Q2** Token naming convention — Material 3 semantic slot names where they fit (primary/secondary/error) + custom UX-specific names (verified, neighbourhood, brandAccent) via `HomeservicesExtendedColors`. Brainstorm: should `brand.primary` use the M3 `primary` slot directly, or be a separately-named token that *maps to* `primary`? Spec leans toward "raw constants are internal-named (`BrandPrimary`); ColorScheme just slots them in".
3. **Q3** Dark mode strategy — system-driven only (skeleton). Brainstorm: confirm DataStore override is genuinely deferrable; consider whether the API hook (caller-supplied `darkTheme` flag) is sufficient.
4. **Q4** Typography scale — UX §5.2 custom scale mapped to M3 slots. Brainstorm: confirm slot mapping; verify `display.xl 48px / 56px` makes sense as `displayLarge` (M3's default `displayLarge` is 57sp — close but not identical).
5. **Q5** Spacing/radius/elevation/motion via typed `Dp` / `Duration` / `Easing` objects PLUS `CompositionLocal`s. Brainstorm: is the dual-exposure (object + Local) worth the verbosity, or pick one?
6. **Q6** Paparazzi strategy — standalone in design-system + re-record in apps. Brainstorm: confirm; consider whether any apps' existing Paparazzi tests beyond `SmokeScreenPaparazziTest` would also need re-recording (none exist at E01-S03 baseline; verify in brainstorm).
7. **Q7** Storybook-equivalent — `TokenGallery` Paparazzi composable. Brainstorm: confirm no Showkase / no real Storybook server.
8. **Q8** Catalog drift — third catalog stays out of the gate. Brainstorm: confirm; consider edge case where someone adds Hilt-something to design-system (would silently drift the third catalog).
9. **Q9** Geist Sans bundling — single TTF in `res/font/`, ~75 KB. Brainstorm: confirm OFL-1.1 attribution location (`NOTICE.md` + `LICENSES/OFL-1.1.txt`) is sufficient; consider whether `res/raw/ofl-license.txt` is also needed for Play Store legal page.
10. **Q10** `frontend-design` skill optional invocation — brainstorm decides whether to invoke for token-explore (especially dark-mode dossier badges) or skip (UX §5 is locked).

---

## Definition of Done

- [ ] All 12 ACs pass via automated tests + 3 CI workflows (design-system-ship, customer-ship, technician-ship)
- [ ] `design-system/` builds independently; AAR produced
- [ ] Both apps consume design-system via composite build; placeholder theme files deleted; Paparazzi goldens re-recorded
- [ ] `TokenGallery` snapshots committed (light + dark)
- [ ] `docs/adr/0010-design-system-composite-build.md` committed; ADR-0007 amended; ADR-0001 cross-linked
- [ ] `design-system/{README, NOTICE, LICENSES/OFL-1.1.txt, MIGRATION-FROM-PLACEHOLDER}.md` committed
- [ ] 5-layer review passed (`/code-review` → `/security-review` → `/codex-review-gate` (`.codex-review-passed` updated) → `/bmad-code-review` → `/superpowers:requesting-code-review`)
- [ ] PR opened; CI green on all three workflows; merged to `main`
- [ ] `docs/stories/README.md` E01 row for E01-S04 marked `[x]`

---

**Story v1.0 — ready for `/bmad-brainstorming`.**
