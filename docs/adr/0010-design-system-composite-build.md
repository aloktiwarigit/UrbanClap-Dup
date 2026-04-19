# ADR-0010: Design-system Gradle module distribution via composite build (`includeBuild`)

- **Status:** accepted
- **Date:** 2026-04-19
- **Deciders:** Alok Tiwari

## Context

UX §5 locks a single design token set (color light + dark, typography, 4pt spacing, radii, elevation, motion) consumed by two Android apps (`customer-app/`, `technician-app/`) and — in Phase 2 — the `admin-web/` Next.js dashboard. ADR-0001 §Consequences committed to a "shared design-system Gradle module" to keep both apps on one canonical theme.

ADR-0001 also committed to "two separate Android codebases" — each app has its own Gradle root (`customer-app/`, `technician-app/`) with independent `settings.gradle.kts`, independent CI workflow (`customer-ship.yml`, `technician-ship.yml`), and no root-of-repo Gradle build. A shared Kotlin library must therefore be distributed somehow; four options exist:

1. **Gradle composite build (`includeBuild("../design-system")`)** — each app's `settings.gradle.kts` declares the inclusion; Gradle substitutes `com.homeservices:design-system` to the local source.
2. **Maven Local publish** — run `./gradlew :design-system:publishToMavenLocal` after every change; apps depend on `mavenLocal()`.
3. **Root-of-repo `settings.gradle.kts`** — single Gradle build orchestrating `include(":design-system", ":customer-app:app", ":technician-app:app")`.
4. **Maven Central / GitHub Packages** — real artifact repo with version-pinned consumption.

The ₹0-infra constraint (ADR-0007) and the "two separate codebases" principle (ADR-0001) combine to make this a non-trivial choice.

## Decision

**Use Gradle composite build via `includeBuild("../design-system")`** in each app's `settings.gradle.kts` (placed BEFORE `pluginManagement` — Gradle requires this order for plugin-classpath resolution of the included build).

The design-system module is itself a single-module composite: `design-system/` IS the library module (no nested `library/` directory). `design-system/build.gradle.kts` sets `group = "com.homeservices"`; `design-system/settings.gradle.kts` sets `rootProject.name = "design-system"`. Consumers declare `implementation("com.homeservices:design-system")`; Gradle substitutes the coordinate to the included build at configuration time.

## Consequences

**Positive:**
- **Zero infrastructure.** No artifact repository to host, no publish step to orchestrate in CI. Token changes ripple to both apps on the next build.
- **Honours ADR-0001.** Each app retains its own Gradle root, independent CI workflow, and the existing cross-app catalog drift check. Only `includeBuild("../design-system")` + one `implementation` line cross the boundary.
- **Fast iteration.** No `publishToMavenLocal` gymnastics; edit a token, run the consumer build.
- **₹0 preserved.** No Maven Central account, no GitHub Packages quota to track.
- **Honest pixel gate.** `design-system-ship.yml` runs the module's own Paparazzi `TokenGallery` goldens BEFORE the app workflows build. Pixel drift caught early.

**Negative:**
- **Each consumer must opt in.** `includeBuild` is not transitive; admin-web/ + future iOS need their own pattern (deferred to Phase 2 token-pipeline ADR).
- **No version pinning.** Both apps are in lockstep with `design-system/` HEAD. Acceptable because all three sub-projects ship on the same branch and PR.
- **Inclusion-order sensitivity.** `includeBuild(...)` must come BEFORE `pluginManagement` in `settings.gradle.kts`; silent failure if reordered. Documented in the plan's B9 fix + grep verification in each app's migration task.

**Neutral:**
- The shared toolchain version parity gate (`tools/check-shared-versions.sh`) replaces what Maven Central's version resolution would have done automatically. Script is ~40 LoC bash; maintenance cost is minimal.

## Alternatives considered

| Option | Rejection reason |
|---|---|
| **Maven Local publish (option 2)** | Adds a manual `publishToMavenLocal` step on every design-system change. CI must orchestrate publish-then-app-build. Fragile — developers forget the publish step; token edits appear to not propagate. |
| **Root-of-repo `settings.gradle.kts` (option 3)** | Violates ADR-0001's "two separate Android codebases" principle. Couples app independence; a single Gradle failure blocks both apps' CI. Loses the per-app `-ship.yml` isolation that lets customer PRs not re-run technician Paparazzi. |
| **Maven Central / GitHub Packages (option 4)** | Overkill at MVP. Requires account, signing, release-flow ceremony. Add it when admin-web/ (Next.js + Tailwind) and/or future iOS (SwiftUI) start consuming design tokens in Phase 2 — at that point, a token-pipeline ADR formalises cross-stack distribution. Premature here. |

Revisit option 4 at Phase 2 (token-pipeline ADR triggered by admin-web consumption or KMP/iOS work per AQ-1).

## References

- `docs/adr/0001-primary-stack-choice.md` §Consequences — "shared design-system Gradle module"
- `docs/adr/0007-zero-paid-saas-constraint.md` — ₹0 infra constraint
- `docs/stories/E01-S04-design-system-module.md` — story executing this decision
- `docs/superpowers/specs/2026-04-18-e01-s04-design-system-design.md` §1 Q1 + §5 — Composite-build wiring specifics + gotchas
- `plans/E01-S04.md` — implementation plan
- Gradle composite-build documentation: https://docs.gradle.org/current/userguide/composite_builds.html
