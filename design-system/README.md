# design-system — homeservices-mvp shared Compose theme + UX §5 tokens

Source-of-truth implementation of `docs/ux-design.md` §5 tokens (color light + dark, typography, 4pt spacing, radii, elevation, motion) for both Android apps. Distributed via Gradle composite build — no Maven publish step, no artifact repository, zero recurring cost. Token edits in this module ripple to `customer-app/` and `technician-app/` on the next build.

Per ADR-0010 (design-system composite build) + ADR-0007 (₹0-infra constraint).

## Quick start (for consumers)

Each consuming Android app wires the module in two places:

**1. `<app>/settings.gradle.kts` — at the TOP, before `pluginManagement`:**

```kotlin
includeBuild("../design-system")

pluginManagement { ... }
// ...
```

**2. `<app>/app/build.gradle.kts` — in `dependencies { }`:**

```kotlin
implementation("com.homeservices:design-system")
```

**3. Use the theme at the top of each screen / Activity:**

```kotlin
import com.homeservices.designsystem.theme.HomeservicesTheme
import androidx.compose.material3.MaterialTheme

setContent {
    HomeservicesTheme {
        // All MaterialTheme.colorScheme / typography / shapes reads
        // resolve through the HomeservicesTheme wrapper.
        MyScreen()
    }
}
```

## Token cheat sheet

| Token group | File | UX source |
|---|---|---|
| Brand + semantic + neutral colours + Material 3 `ColorScheme` (light + dark) | `theme/Color.kt` | UX §5.1 |
| Extended (trust-dossier) colours — verified, neighbourhood, brand accent, brand primary hover | `theme/ExtendedColors.kt` + `LocalHomeservicesExtendedColors` | UX §5.1 dossier rows |
| Typography scale (10 M3 slots) + Geist Sans Variable FontFamily | `theme/Typography.kt` | UX §5.2 |
| Spacing (4pt grid, space0..space24) | `theme/Spacing.kt` + `LocalHomeservicesSpacing` | UX §5.3 |
| Border radii (sm, md, lg, xl, full) | `theme/Radius.kt` + `LocalHomeservicesRadius` | UX §5.7 |
| Elevation Dp values + Shadow data class (light + dark variants) | `theme/Elevation.kt` + `LocalHomeservicesElevation` | UX §5.5 |
| Motion durations + easing curves | `theme/Motion.kt` + `LocalHomeservicesMotion` | UX §5.4 |
| Single `HomeservicesTheme { ... }` composable wrapping all of the above | `theme/HomeservicesTheme.kt` | AC-6 |
| `TokenGallery` Paparazzi-only composable (light + dark pixel-locked goldens) | `gallery/TokenGallery.kt` | AC-7 |

## Conventions

- **Compose-only.** No DI (no Hilt), no networking, no persistence, no application-level concerns.
- **Typed tokens, never stringly.** All values are `Dp`, `Color`, `Duration`, `TextStyle`, `FontFamily`, `Easing`.
- **Dual exposure.** Each non-M3 token group is available as a typed `object` (for tests + non-Composable code) AND a `CompositionLocal` (for `@Composable` consumers). In `@Composable` code, prefer `LocalHomeservicesSpacing.current.space4` over `HomeservicesSpacing.space4` so a future themed-override (e.g. dense-mode variant) lands in one place.
- **No per-app theme wrappers.** Both apps import `HomeservicesTheme` directly — no `HomeservicesCustomerTheme` / `HomeservicesTechnicianTheme` thin wrappers (premature indirection at skeleton stage).
- **Dark mode is system-driven.** `HomeservicesTheme(darkTheme: Boolean = isSystemInDarkTheme())`. A user-preference override (DataStore-backed) will land as a separate wrapper composable once a Settings screen exists — zero API change to this function.
- **Paparazzi + variable fonts.** `Typography.kt` uses `FontLoadingStrategy.OptionalLocal` so Paparazzi tests fall back to `FontFamily.Default` gracefully. Production APKs render Geist Sans Variable correctly.

## Test + lint commands

Run from `design-system/`:

```bash
./gradlew testDebugUnitTest        # JUnit 5 token assertions (colour hex, type size/weight, spacing values, WCAG contrast)
./gradlew verifyPaparazziDebug     # TokenGallery pixel gate (light + dark)
./gradlew recordPaparazziDebug     # re-record goldens after intentional token change
./gradlew ktlintCheck detekt       # style + static analysis
./gradlew lintDebug                # Android Lint
./gradlew koverVerify              # ≥80% line/branch/instruction coverage
./gradlew assembleRelease          # AAR at build/outputs/aar/design-system-release.aar
```

## Module layout

```
design-system/
├── README.md                     — this file
├── NOTICE.md                     — OFL-1.1 attribution for Geist Sans
├── LICENSES/OFL-1.1.txt          — full SIL Open Font License text
├── MIGRATION-FROM-PLACEHOLDER.md — onboarding aid (auto-delete 2026-07-17)
├── build.gradle.kts              — library module build (single-module composite)
├── settings.gradle.kts           — rootProject.name = "design-system"
├── detekt.yml + .editorconfig    — mirror apps' style config
├── gradle/libs.versions.toml     — subset catalog (no Hilt/Sentry/Activity)
├── src/main/kotlin/com/homeservices/designsystem/
│   ├── theme/{Color, ExtendedColors, Typography, Spacing, Radius, Elevation, Motion, HomeservicesTheme}.kt
│   └── gallery/TokenGallery.kt
├── src/main/res/font/geist_sans_variable.ttf
└── src/test/
    ├── kotlin/com/homeservices/designsystem/theme/*Test.kt  — pure JVM JUnit 5 + AssertJ
    ├── kotlin/com/homeservices/designsystem/gallery/TokenGalleryPaparazziTest.kt
    └── snapshots/images/*.png    — Paparazzi goldens (committed, pixel-locked)
```

## Related docs

- Story: `docs/stories/E01-S04-design-system-module.md`
- Plan: `plans/E01-S04.md`
- ADR-0010 (composite build): `docs/adr/0010-design-system-composite-build.md`
- ADR-0007 (zero paid SaaS): `docs/adr/0007-zero-paid-saas-constraint.md`
- ADR-0001 (primary stack): `docs/adr/0001-primary-stack-choice.md`
- UX §5: `docs/ux-design.md`
