# ADR-0037: targetSdk 36 on compileSdk 35, to keep Paparazzi

- **Status:** accepted
- **Date:** 2026-09-19
- **Deciders:** Alok Tiwari

## Context

Google Play rejects uploads of both apps:

> Your app currently targets API level 35 and must target at least API level 36

The obvious change is to raise **both** `compileSdk` and `targetSdk` to 36. That is what
the unmerged `chore/api-36-migration` branch did, and what its draft ADR-0030
(`0030-compilesdk-36-on-agp-8-6-suppression.md`, never merged — `0030` on `main` is
`single-technician-launch-gate`) proposed. That draft asserted:

> All 111 Paparazzi goldens and the visual-regression net stay intact *during* the
> edge-to-edge refactor — precisely when that net is most valuable.

**That claim is false, and was never tested.** The branch has no PR and no CI run
(`gh run list --commit a44925cc` returns nothing), so the assertion was never exercised
against the pipeline.

Raising `compileSdk` to 36 breaks Paparazzi 1.3.5 **completely** — not a pixel diff, a
total failure to initialise. Observed on CI in PR #366 and reproduced locally:

```
java.util.NoSuchElementException at Renderer.kt:213
kotlin.UninitializedPropertyAccessException at PaparazziSdk.kt:596
```

`Renderer` cannot resolve a platform for API 36, so `sessionParamsBuilder` is never
assigned. Every Paparazzi-backed test in both apps fails, including screens untouched by
any edge-to-edge work. Paparazzi 1.3.5 is the newest stable release; the first version
supporting a new enough AGP is `2.0.0-alpha05`, which would cascade into Kotlin, KSP,
Hilt, Gradle and AGP upgrades and put an alpha dependency into an enterprise-floor
project.

The key observation is that the two settings serve different masters:

- **Play enforces `targetSdk`.** It reads `targetSdkVersion` from the uploaded bundle's
  manifest. It does not inspect `compileSdk`.
- **Paparazzi keys off `compileSdk`**, because that is what selects the layoutlib platform
  it renders against.

So the compliance requirement and the screenshot-testing constraint do not actually
collide — they were only made to collide by moving both values together.

## Decision

Set `targetSdk = 36` and leave `compileSdk = 35` in both `customer-app` and
`technician-app`. Keep AGP 8.6.0, Gradle 8.11, Kotlin 2.0.21, KSP 2.0.21-1.0.28 and
Paparazzi 1.3.5 pinned exactly as they are.

`android.suppressUnsupportedCompileSdk` is **not** needed, because `compileSdk` stays at a
level AGP 8.6.0 has been tested against. No warning to suppress.

Android 16 enforces edge-to-edge at `targetSdk 36` regardless of `compileSdk`, so the
edge-to-edge inset audit that accompanies this change is still required — and
`enableEdgeToEdge()` and `safeDrawingPadding()` are both available in the compileSdk 35
API surface.

### Verified

- `assembleDebug` succeeds at compileSdk 35 / targetSdk 36 — AGP 8.6.0 raises no error for
  `targetSdk > compileSdk`
- `ServiceDetailScreenTest` (Paparazzi-backed) **fails** at compileSdk 36 with the
  `sessionParamsBuilder` error and **passes** at compileSdk 35 — same code, same machine,
  only the build config differs
- full pre-Codex smoke gate green for both apps

## Consequences

- **Positive:** Meets the Play deadline with a one-line change per app. All 111 Paparazzi
  goldens keep working, so the visual-regression net stays live through the edge-to-edge
  refactor — which is exactly what draft ADR-0030 wanted and did not achieve. No alpha
  dependency, no toolchain migration, no suppression flag.
- **Negative:** We compile against API 35 while targeting 36, so new API 36 lint checks and
  any API-36-only symbols are unavailable at build time. We use none today. This is the
  long-standing, supported Android configuration — `targetSdk` governs runtime behaviour
  opt-in, which is what Play and Android 16 care about.
- **Neutral:** Raising `compileSdk` to 36 is deferred until Paparazzi ships a stable
  release supporting it.

## Revisit when

- Paparazzi publishes a **stable** release supporting AGP 8.9+ / compileSdk 36, at which
  point compileSdk, AGP, Kotlin and Paparazzi move together in one deliberate migration
  and all 111 goldens are re-recorded on CI (never on Windows — see
  `docs/patterns/paparazzi-cross-os-goldens.md`).
- Play begins requiring `compileSdk` parity, or we need an API-36-only symbol.
