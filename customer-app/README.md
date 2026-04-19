# homeservices-customer

Customer-facing Android app for the homeservices-mvp platform. Kotlin 2 + Jetpack Compose + Material 3 + Hilt + Sentry, targeting Android 8 (API 26) through Android 15 (API 35). Published to Google Play (deploy story is separate).

## Quick start

```bash
./gradlew :app:assembleDebug       # build debug APK → app/build/outputs/apk/debug/app-debug.apk
./gradlew :app:installDebug        # build + install on connected device/emulator
```

## Test

```bash
./gradlew ktlintCheck              # Kotlin style
./gradlew detekt                   # static analysis
./gradlew lintDebug                # Android Lint (debug variant)
./gradlew testDebugUnitTest        # JUnit 5 + MockK + Robolectric
./gradlew koverVerify              # coverage ≥80% lines/branches/instructions
./gradlew koverHtmlReport          # HTML report → app/build/reports/kover/html/
./gradlew verifyPaparazziDebug     # screenshot test verification (golden diff)
./gradlew recordPaparazziDebug     # re-record golden images (only when intentionally changing UI)
```

## Conventions

- **Compose + Material 3 only.** No Material 2, no XML layouts for new screens.
- **Hilt for DI.** One `@InstallIn(SingletonComponent::class)` module. `@Inject constructor` preferred over `@Provides`.
- **KSP not KAPT.** All annotation processors run through KSP.
- **Tokens not magic numbers.** Color / size / spacing / typography via Material 3 `MaterialTheme` tokens; the design-system Gradle module lands in E01-S04.
- **`-Werror` + explicit API mode.** Every public declaration has explicit visibility + return type. All compiler warnings fail the build.
- **Paparazzi on every screen.** New screens commit a golden snapshot; PRs fail on pixel drift.
- **Sentry only for observability.** OpenTelemetry is deferred to a dedicated observability story.
- **No network, no Room, no Firebase in this skeleton.** Those land with the first story that needs them.

## Stack

Kotlin 2.0.21 · Jetpack Compose BOM 2024.11.00 · Material 3 · Hilt 2.52 (KSP) · Paparazzi 1.3.5 · Kover 0.9.0 · Detekt 1.23.7 · ktlint plugin 12.1.1 · JUnit 5 · MockK · Robolectric 4.14.1 · Sentry Android 7.17.0 · AGP 8.6.0 · Gradle 8.11.

See `docs/architecture.md` §5, `docs/adr/0001-primary-stack-choice.md`, and `docs/adr/0007-zero-paid-saas-constraint.md` for the full rationale.
