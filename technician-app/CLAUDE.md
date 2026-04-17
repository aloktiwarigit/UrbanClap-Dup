# Client Project — Enterprise Baseline (Android / Kotlin + Compose)

## Phase gate

Same as Next.js template. `app/src/main/` is off-limits until all BMAD artifacts exist and `.bmad-readiness-passed` is committed. See `.claude/settings.json`.

## Stack

- Kotlin (with `-Werror`, strict null, explicit API mode)
- Jetpack Compose
- Hilt (DI), Room (local DB), Ktor (networking), Coroutines
- Sentry Android SDK
- GrowthBook Android SDK (OSS)
- PostHog Android SDK
- Detekt + ktlint + Android Lint
- JUnit 5 + MockK (unit), Espresso + Compose test (UI)
- Paparazzi (screenshot tests)

## CI

- Android Lint (0 warnings)
- ktlint, Detekt
- Unit tests ≥80% coverage (Kover)
- Compose screenshot diffs (Paparazzi)
- R8 / ProGuard release build
- Semgrep SAST (Kotlin ruleset)
- Play Store pre-submission: no `android:debuggable`, `usesCleartextTraffic="false"` except dev

## Per-story flow
Same as Next.js: BMAD → Superpowers plan → fresh session execute → TDD → verify → 5-layer review → Codex → CI.

## Android-specific pre-release checklist
- [ ] Signed release APK/AAB generated
- [ ] ProGuard rules verified (no release-breaking shrinkage)
- [ ] `baselineprofile` generated for cold-start perf
- [ ] Privacy policy URL set in Play Console
- [ ] Data safety form completed
- [ ] Screenshot tests pass on all supported densities
- [ ] Accessibility scanner (Google Accessibility Scanner) run on key flows
