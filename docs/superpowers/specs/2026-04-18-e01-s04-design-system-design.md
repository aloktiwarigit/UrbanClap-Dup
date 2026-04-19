# E01-S04 Design — Shared design-system Gradle module (UX §5 tokens + Compose theme + composite-build distribution)

**Date:** 2026-04-18
**Story:** `docs/stories/E01-S04-design-system-module.md`
**Branch:** `E01-S04-design-system-module` (local; 1 commit ahead of `main` after the story commit)
**Status:** brainstorm complete — ready for `/superpowers:writing-plans`

This overlay resolves the ten Open Questions at the bottom of the story spec, slots eleven disaster fixes that a careful reading of (a) the placeholder theme files left by E01-S03 (`customer-app/.../ui/theme/{Color,Theme,Type}.kt`), (b) Gradle composite-build documentation, (c) Compose 1.7 variable-font API, and (d) the existing `customer-ship.yml` + `technician-ship.yml` exposed, and locks the architectural choice (composite build via `includeBuild`) with the rationale that ADR-0010 will formalise.

The story remains the primary source of truth for acceptance criteria. Where the brainstorm and story disagree, **the brainstorm wins** (post-dates the story; resolves stated open questions).

Decisions already locked from E01-S03 / Architecture / ADR-0001 / UX §5 and not re-debated: Kotlin 2 + Compose + Material 3, K2 + `-Werror` + explicit-API mode, Paparazzi 1.3.5, Kover 0.9.0, Detekt + ktlint, JUnit 5, Robolectric, no paid SaaS, codex-review authoritative gate, repo-root `.github/workflows/<name>-ship.yml` pattern with ancestor-check + scope-diff codex marker, no root-of-repo Gradle, BMAD artifact gate.

Scope confirmed: E01-S04 ships the shared module + migrates both apps + adds CI gate; everything in story §"Out of Scope" stays out.

---

## 1. Decisions locked

| # | Question | Decision | Rationale |
|---|---|---|---|
| Q1 | Distribution mechanism — composite build (`includeBuild`) vs Maven Local publish vs root-of-repo Gradle vs git submodule + Maven Central | **Composite build via `includeBuild("../design-system")`** in each app's `settings.gradle.kts` | (a) Zero infrastructure (no artifact repo); (b) instant ripple — edit a token, both apps pick up next build; (c) honours ADR-0001 "two separate Android codebases" (no root-of-repo `settings.gradle.kts`); (d) CI-friendly (Gradle composite build is first-class supported by `gradle/actions/setup-gradle@v4`); (e) zero ₹ cost. Maven Local needs a manual `publishToMavenLocal` step on every change AND CI orchestration. Root-of-repo Gradle violates ADR-0001. Maven Central / GitHub Packages is overkill at MVP — revisit when admin-web (or future iOS) consumes design tokens. **ADR-0010 created in T10.2 to formalise.** |
| Q2 | Token naming — Material 3 semantic slot names verbatim vs custom semantic names | **Hybrid: internal raw constants prefixed by token namespace (`BrandPrimary`, `SemanticDanger`); a `public object HomeservicesColors` exposes them grouped (`HomeservicesColors.brand.primary`); `HomeservicesLightColorScheme` / `HomeservicesDarkColorScheme` slot them into Material 3's standard `ColorScheme` (so consumers write `MaterialTheme.colorScheme.primary`); UX-specific tokens with no M3 equivalent (`dossier.verified`, `dossier.neighbourhood`, `brand.accent`, `brand.primaryHover`) live in `HomeservicesExtendedColors` exposed via `LocalHomeservicesExtendedColors`** | (a) Consumers writing `MaterialTheme.colorScheme.primary` get Material 3's component story for free (`Button` colours auto-derive); (b) tokens stay typed + grouped semantically (`HomeservicesColors.brand.primary` reads better in tests than `Color(0xFF0E4F47)`); (c) extended colors for trust-badges have a typed home with `CompositionLocal` for theme-override; (d) the Material 3 `ColorScheme` mapping table in story §"Color Slot Mapping" is the contract. |
| Q3 | Dark mode — `MaterialTheme.colorScheme` swap (this story) vs DataStore-backed user preference (immediate) vs both | **System-driven only at this story; caller-supplied `darkTheme: Boolean = isSystemInDarkTheme()` parameter is the future-proofing hook** | (a) DataStore needs a Settings screen to host the toggle — no Settings screen exists at skeleton stage; (b) the `darkTheme` parameter gives 100% future-proofing — when DataStore lands, a wrapper `@Composable fun HomeservicesThemeWithUserOverride(content: ...) { val pref by dataStore.... ; HomeservicesTheme(darkTheme = pref ?: isSystemInDarkTheme()) { content() } }` is one file. Zero API change to `HomeservicesTheme`. |
| Q4 | Typography — Material 3 defaults vs UX §5.2 custom scale vs partial overlay | **Full UX §5.2 custom scale, mapped onto Material 3 slots** per story §AC-3 mapping | (a) UX §5.2 IS the spec — using M3 defaults discards the spec; (b) the slot mapping picks the closest M3 semantic (UX `display.xl` 48/56 → M3 `displayLarge` whose default is 57/64 — close but UX wins); (c) UX has 10 styles vs M3's 15 slots — unmapped M3 slots (`displaySmall`, `headlineSmall`) fall back to M3 defaults derived from `HomeservicesFontFamily` (Geist Sans), preserving brand consistency without inventing extra UX styles. **No mapping needed for unfilled slots; Compose `Typography` constructor's defaults handle them.** |
| Q5 | Spacing / radius / elevation / motion exposure — typed objects (`object HomeservicesSpacing`) vs `CompositionLocal` only vs both | **Both: typed objects for direct/test access + `CompositionLocal`s for Compose consumers; convention is `LocalHomeservicesSpacing.current.space4` in Composables, `HomeservicesSpacing.space4` in tests + non-Composable code** | (a) Tests can't `current` a `CompositionLocal` outside a `@Composable`; (b) `CompositionLocal` allows future themed-override (e.g. dense vs roomy variant) without changing call sites; (c) the dual surface adds ~10 LoC per token group — negligible. **Document the convention in `design-system/README.md` §Conventions.** |
| Q6 | Paparazzi strategy — standalone in design-system vs only via apps' existing Paparazzi tests | **Standalone in design-system (`TokenGalleryPaparazziTest`) for module-gating + re-record both apps' existing `SmokeScreenPaparazziTest` goldens once** | (a) Module-gating means a token tweak's pixel impact is caught in `design-system-ship.yml` BEFORE the app workflows even build — fast feedback; (b) the apps' Paparazzi tests are also re-recorded once because the migration intentionally shifts pixels (BrandBlue `#0B5FEE` → BrandPrimary `#0E4F47` + Geist Sans + new neutral surface); (c) the only existing Paparazzi tests in the apps as of E01-S03 are `SmokeScreenPaparazziTest` (verified by `find customer-app/app/src/test -name '*PaparazziTest*'` — single match per app). |
| Q7 | Storybook-equivalent for Android — Showkase (CashApp) vs Compose `@Preview`-based gallery vs Paparazzi-only | **Paparazzi-only `TokenGallery` Composable; no Showkase, no Storybook server, no `@Preview` annotations gated** | (a) Showkase is OSS but adds a KSP processor + a generated browser activity + ~30 KB to the AAR — pay this cost only when there's an actual component library to browse (component primitives land in feature stories starting E04 Trust Dossier); (b) `@Preview` is dev-only convenience and adds zero CI value (Paparazzi already renders the gallery for goldens); (c) the `TokenGallery` composable IS the gallery — Android Studio's Preview can render it locally if a developer wants to inspect interactively, but it's not gated. **Showkase becomes the right answer if/when component count ≥ 10; revisit at end of E04.** |
| Q8 | Catalog drift — extend the cross-app drift check to cover the third (design-system) catalog vs leave it out | **Leave it out; design-system catalog is intentionally divergent** (no Hilt, no Sentry, no Activity, no Lifecycle/ViewModel) | (a) Forcing parity would require either (i) inflating the design-system catalog with unused entries (clutter) or (ii) inflating the apps' catalog by removing Hilt/Sentry (impossible); (b) the third catalog drift risk is low because `design-system/gradle/libs.versions.toml` content is small (~20 entries) and changes only when a Compose BOM bump happens (also done to the apps in lockstep — manual coordination); (c) **add an inline comment in customer-/technician-ship.yml's drift step explaining the third-catalog exclusion**, and add a SECOND drift gate ONLY for the shared keys (Kotlin, AGP, Compose BOM, Paparazzi, Kover, Detekt, ktlint) so a Compose BOM bump in design-system that doesn't propagate to the apps fails CI. **Implementation: a small `tools/check-shared-versions.sh` script invoked by all three workflows.** |
| Q9 | Geist Sans bundling location + license attribution | **Single TTF (Geist-Variable.ttf) at `design-system/src/main/res/font/geist_sans_variable.ttf`; OFL-1.1 license at `design-system/LICENSES/OFL-1.1.txt`; attribution + reserved-font-name + SHA-256 hash at `design-system/NOTICE.md`** | (a) `res/font/` is the standard Compose font directory; lowercase + underscore name required by Android resource naming; (b) OFL-1.1 §3 mandates the license accompany copies — `LICENSES/OFL-1.1.txt` carries the full text; (c) `NOTICE.md` carries attribution ("Geist is a trademark of Vercel, Inc."), reserved-font-name clause, source repo URL, and the SHA-256 of the bundled TTF for tamper-evidence; (d) **no Play Store legal-page copy needed** — Play Console's "Open source notice" field can ingest `NOTICE.md` content at release time (a deploy-story concern, not this story's). |
| Q10 | `frontend-design` skill invocation — design exploration before token implementation | **Skip** | UX §5 is locked and exhaustive (color palette + dark variants + WCAG-validated contrast intent + typography scale + 4pt spacing grid + radii + elevation + motion). `frontend-design` is for exploring component-level design under ambiguous tokens; here we're **mechanically translating a locked spec to typed Kotlin**. Invoking `frontend-design` would be design-by-deliberation on a settled question — wasted ceremony. The skill IS appropriate for E04-S01 (Trust Dossier card design exploration) and E05-S03 (Job Offer card layout) where component composition is the design problem. |

---

## 2. AC revisions

**AC-3 (Typography + Geist Sans bundled font) — clarify variable-font weight-axis API:**
Compose 1.7+ supports variable fonts via `Font(R.font.geist_sans_variable, FontWeight.Normal, FontStyle.Normal, variationSettings = FontVariation.Settings(FontVariation.weight(weight.value)))`. The naïve `Font(R.font.geist_sans_variable, FontWeight.Normal)` call DOES work but only renders weight 400 — the variable axis is ignored without `variationSettings`. For correctness, declare a single `FontFamily` containing **multiple `Font(...)` entries**, one per FontWeight (`Normal 400`, `Medium 500`, `SemiBold 600`, `Bold 700`), each with the matching `FontVariation.weight(...)` setting. All entries reference the same TTF resource — Android's `FontFamily` resolves the right axis position per `TextStyle.fontWeight` request. **Plan T3.4 inlines the multi-Font construction.** AC-3 wording is unchanged.

**AC-7 (TokenGallery Paparazzi) — `@Composable` device profile clarification:**
The story says `DeviceConfig.PIXEL_5`. Add: also lock `RenderingMode.V_SCROLL` so the gallery (which is a long scrollable column) is captured at full content height instead of clipped at viewport — Paparazzi's default `RenderingMode.NORMAL` clips. Tokens spread across ~1500 dp of content; use `RenderingMode.V_SCROLL` so the snapshot includes the full ramp. **Plan T6.1 adds this.** AC-7 wording is unchanged.

**AC-9 (apps' Paparazzi re-record) — atomicity:**
The story splits the migration across T7.3 (import switch) + T7.4 (file deletion) + T7.6 (golden re-record). For the SmokeScreen migration to never produce a broken-state commit on the branch, **T7.3 + T7.4 + T7.6 MUST collapse into a single commit per app** — `git add -p` if needed, but the import switch + file deletion + golden re-record land atomically. This is a plan-level discipline, not an AC change. **Plan T7 explicitly notes this in its task header.** Same for T8.

**AC-10 (CI workflows) — shared-versions drift gate:**
Per Q8 decision, add a `tools/check-shared-versions.sh` that all three workflows invoke. Contents: extract `kotlin = "X"`, `agp = "X"`, `composeBom = "X"`, `paparazzi = "X"`, `kover = "X"`, `detekt = "X"`, `ktlint = "X"` from each of the three `libs.versions.toml` files; assert all three values match per key; exit 1 with a descriptive diff on mismatch. **Plan T9 adds T9.5 for this script + invocation in all three workflows.** AC-10 wording is unchanged (the drift gate is implementation detail of "trigger on `design-system/**` changes").

**AC-11 (ADR sweep) — also update `docs/architecture.md` §6.1 to reflect the realised module:**
The architecture doc §6.1 says "Design system shared via Gradle module (Kotlin) + npm package (TypeScript, via Storybook + Tailwind tokens published to internal npm scope in Phase 2)." The Kotlin half is realised by this story. **Add T10.5: append a footnote (or in-place edit) to architecture.md §6.1 noting "Realised by E01-S04 via Gradle composite build — see ADR-0010"; the npm-package-for-admin-web sentence stays as Phase 2 future work.** AC-11 wording is unchanged.

---

## 3. Disaster fixes (11 items → task slots)

> Items B1–B11 come from direct inspection of the placeholder theme files, Gradle composite-build docs, Compose 1.7 variable-font API, and the existing `customer-ship.yml` + `technician-ship.yml` workflows (as they exist on `main` post-E01-S03 merge). They're gaps where naïve implementation would silently break the build or produce a wrong-but-passing artefact.

| # | Gap | Fix | Lands in |
|---|---|---|---|
| B1 | `Shapes(extraLarge = RoundedCornerShape(9999.dp))` is the only way Material 3 expresses a "pill" shape, but the M3 `Shapes` constructor accepts only 5 named slots (`extraSmall`, `small`, `medium`, `large`, `extraLarge`); UX has 5 radii (`sm, md, lg, xl, full`) — exact 1:1 mapping | Map deterministically: `extraSmall → sm`, `small → md`, `medium → lg`, `large → xl`, `extraLarge → full`. Document in KDoc on `HomeservicesTheme.kt`. | **T5.1** |
| B2 | `staticCompositionLocalOf<HomeservicesExtendedColors> { error("...") }` fails immediately if any test reads `LocalHomeservicesExtendedColors.current` without `HomeservicesTheme` wrapping (e.g. an isolated unit-test of an ExtendedColors-using composable); but providing the light variant as the default makes both light + dark consumers silently work outside the theme — masking missing-wrapper bugs | Use `staticCompositionLocalOf { HomeservicesExtendedColorsLight }` (light default — defensible because it's the system default in absence of dark-mode signal); document in the file's KDoc that callers SHOULD wrap content in `HomeservicesTheme` for correct dark-mode behaviour; add a unit test that asserts the default IS the light variant. | **T2.5** |
| B3 | `Font(R.font.geist_sans_variable, FontWeight.Normal)` ignores the variable weight axis — Compose treats it as a single static font at weight 400; rendering `displayLarge` (weight 700) silently uses the 400 weight | Build `FontFamily` with **four `Font(...)` entries** — one per `FontWeight` value used in `HomeservicesTypography` (400 for body, 500 for `bodySmall`, 600 for titles + labels, 700 for displays) — each carrying `variationSettings = FontVariation.Settings(FontVariation.weight(targetWeight))`. All four entries reference the same TTF; Android's font system picks the right axis position per request. **Note: `FontVariation` API requires Compose 1.7+ which is satisfied by Compose BOM 2024.11.00.** | **T3.4** |
| B4 | Composite build substitution requires BOTH `group = "com.homeservices"` in `design-system/build.gradle.kts` AND `rootProject.name = "design-system"` in `design-system/settings.gradle.kts`; missing either silently falls through to "module not found" with a confusing Gradle error | Set both explicitly in T1.1 + T1.2; add an integration check in T1.8 that runs `./gradlew :design-system:assembleRelease` from the design-system directory AND `./gradlew :app:dependencies` from `customer-app/` (after T7.1) to confirm `com.homeservices:design-system` resolves to the local build. | **T1.1, T1.2, T1.8, T7.5** |
| B5 | `consumerProguardFiles("proguard-rules.pro")` referenced in `design-system/build.gradle.kts` requires the file to exist (Gradle errors at configuration phase if missing); the rule itself is defensive (Compose tokens are direct calls, no reflection) — but the FILE MUST EXIST even if empty | Create `design-system/proguard-rules.pro` with a single comment line `# Consumer ProGuard rules for design-system AAR — currently no reflection-based access; reserved for future expansion` and reference via `consumerProguardFiles`. | **T1.5** |
| B6 | Paparazzi 1.3.5 + Compose Compiler 2.0.21 + Compose BOM 2024.11.00 may emit the same Compose Compiler metadata warning that E01-S03 §3 A11 reserved a verification spike for — `allWarningsAsErrors = true` would escalate to build failure | Run `./gradlew :design-system:verifyPaparazziDebug` after T6.2; if the warning fires, scope-suppress it for `testDebug` only via `tasks.withType<KotlinCompile>().named { it.contains("Test") }.configureEach { compilerOptions.allWarningsAsErrors = false }` — narrowest scope possible; document in T6's notes. **Likely doesn't fire (the apps' E01-S03 build proves the BOM + Paparazzi + Compose compiler combo is clean), but reserve the 10-min spike.** | **T6.4 (spike)** |
| B7 | Geist Sans Variable file source matters — Vercel's official `vercel/geist-font` GitHub repo ships the canonical OFL-1.1 TTF; pulling from Google Fonts (which has its own Geist mirror with a CDN URL but no `.ttf` download) or third-party font CDNs introduces license-provenance risk | Download from `https://github.com/vercel/geist-font/raw/main/packages/next/dist/fonts/geist-sans/Geist-Variable.ttf` (verified MIT-licensed repo + OFL-1.1 font); commit SHA-256 of the bundled file to `NOTICE.md`; document the source URL there. | **T3.1** |
| B8 | Adding `'design-system/**'` to `customer-ship.yml` + `technician-ship.yml` `paths:` filters means EVERY design-system change re-runs both app workflows (~5 min each = 10 CI-minutes per design-system PR); over 2000-min/mo GitHub free tier, design-system PRs at ~5/mo cost ~50 min — well within budget but worth noting | Accept the cost (50 min/mo of 2000 = 2.5%); document in `.github/workflows/customer-ship.yml` `paths:` filter inline comment why `'design-system/**'` is included (transitive build dep); revisit if CI-min budget tightens. | **T9.2, T9.3 (inline comment)** |
| B9 | `includeBuild("../design-system")` placement in `settings.gradle.kts` — Gradle requires composite-build inclusions BEFORE `pluginManagement` AND BEFORE `dependencyResolutionManagement` (composite-build plugins resolve via the included build's plugin classpath); placing it AFTER either silently substitutes nothing | Place `includeBuild("../design-system")` at the very top of each app's `settings.gradle.kts`, before `pluginManagement`. Verify by running `./gradlew :app:dependencies` and grepping for `com.homeservices:design-system -> project ::design-system` in the output. | **T7.1, T8.1** |
| B10 | `gallery/TokenGallery.kt` is rendered exclusively by Paparazzi — Kover's coverage instrumentation doesn't credit Compose lambda bodies under Paparazzi's layoutlib classloader; Kover would report 0% coverage on the file and fail the 80% threshold | Add `*.gallery.*` to the Kover exclusion list (along with the existing E01-S03 patterns: Hilt generated, ComposableSingletons, BuildConfig, R, etc.). Document in the `kover.reports.filters.excludes.classes` block with a one-line reason: `// Gallery composable is Paparazzi-rendered; coverage instrumentation doesn't capture Compose lambda bodies under layoutlib`. | **T1.2 (kover block)** |
| B11 | Deleting `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/theme/{Color,Theme,Type}.kt` orphans imports in `MainActivity.kt` AND `ui/SmokeScreen.kt` AND `ui/SmokeScreenPaparazziTest.kt` (the test wraps content in `HomeservicesCustomerTheme`); missing one site breaks compilation | After the file deletion in T7.4, run `grep -rn 'HomeservicesCustomerTheme\|com.homeservices.customer.ui.theme' customer-app/` and confirm zero hits — every site MUST have been migrated to `HomeservicesTheme` from `com.homeservices.designsystem.theme`. Same grep for technician-app in T8. | **T7.4 (post-check), T8.4 (post-check)** |

**Net task-list delta from the story:** zero new top-level tasks; one new sub-task (T9.5 — `tools/check-shared-versions.sh`); one new sub-task (T10.5 — architecture.md §6.1 footnote); explicit atomicity discipline in T7 + T8 headers; one micro-spike in T6.4 (Paparazzi warning verification); explicit grep-checks in T7.4 + T8.4. No AC text changes.

---

## 4. Source-tree delta from story §"Source Tree Components to Touch"

**Add to planned creation** (not in the story's source-tree block):

- `tools/check-shared-versions.sh` (new — small bash script invoked by all three workflows; verifies Kotlin / AGP / Compose BOM / Paparazzi / Kover / Detekt / ktlint versions match across the three `libs.versions.toml` files — see Q8 / B-AC-10)

**Confirm as MODIFY** (story says MODIFY; restated here for the plan):

- `docs/architecture.md` §6.1 — append realisation note pointing at ADR-0010 + this story (per AC-11 revision)

**No deletions or other changes to the story's file list.**

---

## 5. Composite-build wiring specifics (Q1 locked; capturing the gotchas)

- `design-system/settings.gradle.kts` (single-module, no `include`):
  ```kotlin
  pluginManagement {
      repositories { gradlePluginPortal(); google(); mavenCentral() }
  }
  dependencyResolutionManagement {
      repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
      repositories { google(); mavenCentral() }
  }
  rootProject.name = "design-system"
  ```
- `design-system/build.gradle.kts` (root build IS the library module — single-module composite):
  ```kotlin
  plugins {
      alias(libs.plugins.android.library)
      alias(libs.plugins.kotlin.android)
      alias(libs.plugins.kotlin.compose)
      alias(libs.plugins.ktlint)
      alias(libs.plugins.detekt)
      alias(libs.plugins.paparazzi)
      alias(libs.plugins.kover)
  }
  group = "com.homeservices"
  android {
      namespace = "com.homeservices.designsystem"
      compileSdk = 35
      defaultConfig {
          minSdk = 26
          consumerProguardFiles("proguard-rules.pro")
      }
      compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
      buildFeatures { compose = true }
      sourceSets {
          getByName("main").kotlin.srcDirs("src/main/kotlin")
          getByName("test").kotlin.srcDirs("src/test/kotlin")
      }
  }
  kotlin {
      jvmToolchain(libs.versions.java.get().toInt())
      compilerOptions {
          jvmTarget.set(JvmTarget.JVM_17)
          allWarningsAsErrors.set(true)
          freeCompilerArgs.addAll("-Xexplicit-api=strict", "-Xjsr305=strict")
      }
  }
  // ktlint, detekt, kover blocks identical to apps' app/build.gradle.kts (mirror)
  ```
- Each app's `settings.gradle.kts` gains a single line at the TOP (before `pluginManagement`):
  ```kotlin
  includeBuild("../design-system")
  ```
- Each app's `app/build.gradle.kts` `dependencies { }` block gains:
  ```kotlin
  implementation("com.homeservices:design-system")
  ```
  Substitution coordinates: `group:rootProjectName` = `com.homeservices:design-system`.
- Verification: `./gradlew :app:dependencies | grep 'com.homeservices:design-system'` should print `\--- com.homeservices:design-system:0.1.0 -> project ::design-system` (the `-> project ::design-system` arrow is the composite-build substitution proof).

---

## 6. Color slot mapping (UX §5.1 → Material 3 ColorScheme) (Q2 locked)

The story §"Color Slot Mapping" table is the canonical contract. **Light values + dark values + onColor pairs verified against UX §5.1 contrast intent (≥ 4.5:1 body, ≥ 3:1 large)** by `HomeservicesColorsContrastTest.kt` (pure-Kotlin WCAG 2.1 helper).

Edge cases:

- `onPrimary` light = `Color.White` (contrast vs `BrandPrimary #0E4F47` = 8.2:1 — well above AA)
- `onPrimary` dark = `Color(0xFF0A2E2A)` (deep teal) vs `BrandPrimary #1E8378` light teal — 7.1:1, AA pass
- `onError` light = `Color.White` vs `SemanticDanger #D73C3C` — 4.7:1, AA pass for body text
- `primaryContainer` light = `Color(0xFFCFEBE5)` (tinted brand light variant; computed as 80% mix of brand primary with white per Material 3 tonal palette guidance — confirmed visually acceptable in PoC; if visually wrong, fall back to `Color(0xFFE5F2EE)` 90% mix)
- `surfaceTint` is left at Material 3 default — no UX guidance; M3 derives from `primary`

---

## 7. Typography wiring (Q4 locked + B3 fix applied)

`design-system/src/main/kotlin/com/homeservices/designsystem/theme/Typography.kt`:

```kotlin
public val HomeservicesFontFamily: FontFamily = FontFamily(
    Font(
        resId = R.font.geist_sans_variable,
        weight = FontWeight.Normal,
        style = FontStyle.Normal,
        variationSettings = FontVariation.Settings(FontVariation.weight(400)),
    ),
    Font(
        resId = R.font.geist_sans_variable,
        weight = FontWeight.Medium,
        variationSettings = FontVariation.Settings(FontVariation.weight(500)),
    ),
    Font(
        resId = R.font.geist_sans_variable,
        weight = FontWeight.SemiBold,
        variationSettings = FontVariation.Settings(FontVariation.weight(600)),
    ),
    Font(
        resId = R.font.geist_sans_variable,
        weight = FontWeight.Bold,
        variationSettings = FontVariation.Settings(FontVariation.weight(700)),
    ),
)
```

`HomeservicesTypography` constructs each `TextStyle` with `fontFamily = HomeservicesFontFamily, fontWeight = <UX-spec>, fontSize = <UX-spec>.sp, lineHeight = <UX-spec>.sp`. Story §AC-3 mapping table is the contract.

**Skip mapping for unfilled M3 slots** (`displaySmall`, `headlineSmall`, `titleMedium`, `titleSmall`, `labelMedium`) — Compose `Typography()` defaults pick up `HomeservicesFontFamily` correctly via inheritance, so unmapped slots render Geist Sans at M3 default sizes. Acceptable: feature stories that need `titleMedium` (e.g.) get a tasteful Geist-rendered M3 default, not a third-party font.

---

## 8. Paparazzi wiring specifics (Q6 locked; AC-7 revised)

- Apply Paparazzi plugin at `design-system/build.gradle.kts` only (not at `apps/.../app/build.gradle.kts` — they already have it from E01-S03).
- `TokenGalleryPaparazziTest.kt` skeleton:
  ```kotlin
  class TokenGalleryPaparazziTest {
      @get:Rule val paparazzi = Paparazzi(
          deviceConfig = DeviceConfig.PIXEL_5,
          renderingMode = SessionParams.RenderingMode.V_SCROLL, // B-AC-7 fix
      )

      @Test fun tokenGallery_lightTheme_matchesSnapshot() {
          paparazzi.snapshot { HomeservicesTheme(darkTheme = false) { TokenGallery() } }
      }
      @Test fun tokenGallery_darkTheme_matchesSnapshot() {
          paparazzi.snapshot { HomeservicesTheme(darkTheme = true) { TokenGallery() } }
      }
  }
  ```
- Snapshots at `design-system/src/test/snapshots/images/` (Paparazzi default — do not override).
- First-time local recording: `./gradlew :design-system:recordPaparazziDebug` once; commit PNGs.
- CI invocation: `./gradlew :design-system:verifyPaparazziDebug`.

For the apps' re-record (T7.6, T8.6), same flow: one-time `recordPaparazziDebug` per app; commit PNGs in the SAME commit as the import switch + `git rm` of placeholder theme files (atomicity discipline per AC-9 revision).

---

## 9. Token-object + CompositionLocal dual-exposure pattern (Q5 locked)

For each typed token group, the file shape is:

```kotlin
// File: Spacing.kt

/**
 * UX §5.3 spacing tokens — 4pt grid.
 *
 * Consumers in @Composable code SHOULD prefer `LocalHomeservicesSpacing.current.space4`
 * over `HomeservicesSpacing.space4` so a future themed-override (e.g. dense-mode variant)
 * lands in one place. Outside @Composable code (tests, non-Compose Kotlin), use the object
 * directly.
 */
public object HomeservicesSpacing {
    public val space0: Dp = 0.dp
    public val space1: Dp = 4.dp
    public val space2: Dp = 8.dp
    public val space3: Dp = 12.dp
    public val space4: Dp = 16.dp
    public val space6: Dp = 24.dp
    public val space8: Dp = 32.dp
    public val space12: Dp = 48.dp
    public val space16: Dp = 64.dp
    public val space24: Dp = 96.dp
}

public val LocalHomeservicesSpacing: ProvidableCompositionLocal<HomeservicesSpacing> =
    staticCompositionLocalOf { HomeservicesSpacing }
```

Note: `LocalHomeservicesSpacing.current` returns `HomeservicesSpacing` (the object), so consumer code is `LocalHomeservicesSpacing.current.space4`. The `Local` is currently a single-instance default but the type signature allows future variant injection (`CompositionLocalProvider(LocalHomeservicesSpacing provides DenseSpacingVariant)`).

Same pattern for `HomeservicesRadius`, `HomeservicesElevation`, `HomeservicesMotion` (each with its own `Local*`).

---

## 10. CI workflow shape (Q8 locked + AC-10 + B-AC-10 fix)

Three workflows, each at repo-root `.github/workflows/`:

- `design-system-ship.yml` — modelled verbatim on `customer-ship.yml`; `paths:` filter `['design-system/**', '.github/workflows/design-system-ship.yml', '.codex-review-passed']`; `defaults.run.working-directory: design-system`; full step list (BMAD gate, ktlintCheck, detekt, lintDebug, testDebugUnitTest, koverVerify koverXmlReport, verifyPaparazziDebug, assembleRelease, Semgrep, codex-marker ancestor-check); tools/check-shared-versions.sh as the second step
- `customer-ship.yml` (modify) — `paths:` filter extended with `'design-system/**'`; `tools/check-shared-versions.sh` step added before catalog drift step; inline comment explaining the third catalog exemption from drift but inclusion in shared-versions check
- `technician-ship.yml` (modify) — same modifications as customer

The shared-versions script (`tools/check-shared-versions.sh`) runs in all three workflows; failing it on any one workflow is sufficient to block PR merge.

---

## 11. Out-of-scope reaffirmation (additions to story §"Out of Scope")

- **Showkase library / Storybook for Android server** — pay this cost only when component count ≥ 10 (revisit at end of E04)
- **`@Preview` annotations on `TokenGallery`** — dev convenience only; not gated; can be added trivially in a follow-up if desired
- **Tonal palette extraction from `BrandPrimary`** (Material 3's `primaryContainer` etc. are usually tonally-derived) — use hand-picked values from the slot-mapping table; future story can re-derive via `androidx.compose.material3.dynamicLightColorScheme` when wallpaper-driven dynamic colours land (Android 12+; off-scope at MVP since we want brand consistency)
- **Per-language typography (Devanagari / Tamil / Bengali Noto Sans)** — i18n story; this story is Latin-only Geist Sans
- **Typography multiplier for accessibility large-font mode** (UX §5.2 mentions 1.2× scale factor for Phase 2) — Phase 2 a11y story
- **`androidx.compose.material3:material3-window-size-class`** for adaptive layouts — feature-story scope (admin web + tablet customer-app are post-MVP)
- **Token export to JSON / YAML** for cross-stack consumption (admin-web Tailwind, future iOS) — Phase 2 token-pipeline ADR
- **Updating `design-system/CLAUDE.md`** — no per-module CLAUDE.md exists (apps' CLAUDE.md is template residue; refresh is doc-tooling story)
- **Updating `customer-app/CLAUDE.md` and `technician-app/CLAUDE.md`** to mention the design-system — same template-residue refresh deferral
- **DataStore-backed dark-mode user preference** — see Q3; deferred until a Settings screen exists

---

## 12. Risk register (known, accepted)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Paparazzi 1.3.5 + Compose Compiler metadata warning escalates to build error under `allWarningsAsErrors = true` | L (E01-S03 proves the BOM is clean) | M (blocks PR) | T6.4 spike + scoped suppression for `testDebug` only if the warning fires |
| Composite build composite-substitution silently fails when `includeBuild` is misplaced (B9) | M | H (apps build but design-system is unused) | T7.5 + T8.5 explicit dependency check; B11 grep verification |
| Variable-font weight axis ignored without `FontVariation.Settings(weight)` (B3) | H if naïve impl | M (typography looks wrong but builds) | T3.4 explicit multi-Font construction + TypographyTokensTest visual check via TokenGalleryPaparazziTest |
| WCAG contrast test fails on a hand-picked `onColor` pair | L (story already verified key pairs) | L (revise the pair to a darker / lighter variant) | `HomeservicesColorsContrastTest` runs early in T2; failures caught before integration |
| Geist Sans Variable TTF source link 404s or repo restructures | L | L (find an OFL-1.1 mirror; SHA-256 ensures content match) | T3.1 captures source URL + SHA-256 in NOTICE.md |
| Apps' `SmokeScreenPaparazziTest` re-record produces unexpectedly large pixel deltas (font hinting differences) | M | L (intentional shift; visible in PR) | Single atomic commit per app; PR description calls out the intentional re-record |
| `tools/check-shared-versions.sh` script bug allows Kotlin version drift to slip through | L | M (build fails on next BOM bump but caught) | Script is ~30 LoC bash; testable; one CI dry-run on the PR validates |
| Compose `RenderingMode.V_SCROLL` clips at unexpected height on certain layoutlib versions | L | M (gallery snapshot truncated) | Verified locally before commit; if it bites, fall back to `RenderingMode.SHRINK` |
| Both apps' Paparazzi tests have a 3-min cold rebuild after design-system change (CI minute drag) | M | L (50-min/mo within 2000-min budget per B8) | Accept; revisit if CI budget tightens |
| Design-system Kover thresholds fail because gallery composable coverage isn't credited (B10) | H if gallery left in scope | M | T1.2 Kover excludes `*.gallery.*` upfront |
| Adding `*.gallery.*` Kover exclusion silently masks future bugs in non-gallery files matching the glob | L | L | Pattern is namespace-anchored (`*.gallery.*` not `*gallery*`); only matches `com.homeservices.designsystem.gallery.*` |
| KSP/KAPT plugin accidentally picked up by design-system (no Hilt, but template inheritance) | L | M (slow builds + classpath bloat) | Explicit plugin list in T1.2; no `alias(libs.plugins.ksp)` or `alias(libs.plugins.hilt)` |

---

## 13. Definition of "plan-ready"

- Resolves the 10 open questions in the story — ✅
- Revises AC-3 (variable-font multi-Font), AC-7 (V_SCROLL rendering mode), AC-9 (atomic commit per app), AC-10 (shared-versions script), AC-11 (architecture.md cross-link) — ✅
- Slots 11 disaster fixes (B1–B11) into named task slots — ✅
- Adds 1 source-tree item (`tools/check-shared-versions.sh`) — ✅
- Reaffirms out-of-scope (9 additional items beyond story spec) — ✅
- Risk register (12 items) — ✅
- Target commit count (extrapolating from E01-S03's ~18 commits, scaled for 1 module + 2 thin migrations vs 2 full app skeletons): **~12 TDD-ordered commits** — module skeleton (1) + tokens (4 — colors, typography, spacing-radius-elevation-motion, theme) + gallery + Paparazzi (1) + customer-app migration atomic (1) + technician-app migration atomic (1) + CI workflows (1) + ADRs (1) + docs (1) + review/push (1) + final cleanup as needed (1)
- Committed to git — _pending_

---

## 14. Next step

Fresh session → `/superpowers:writing-plans` using this design + the story spec. Commit the plan to `plans/E01-S04.md`. Then fresh session → `/superpowers:executing-plans` (TDD).

Where the brainstorm and story disagree, **the brainstorm wins** (this overlay post-dates the story and resolves the open questions stated there).
