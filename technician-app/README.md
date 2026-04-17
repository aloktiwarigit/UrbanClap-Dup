# <Client App> — Android

Scaffolded from `agency-templates/client-baseline-android`.

## Structure
| Path | Purpose |
|---|---|
| `docs/` | BMAD artifacts (prd, ux-design, architecture, adr/, stories/, threat-model, runbook) |
| `plans/` | Superpowers plan files |
| `specs/` | Per-story specs |
| `app/src/main/` | Kotlin / Compose code — **gated until BMAD complete** |
| `app/src/test/` | JUnit 5 + MockK |
| `app/src/androidTest/` | Espresso + Compose test |

## Bootstrapping TODO (after scaffold)
- Run `gradle init` (or copy your house `build.gradle.kts` starter in)
- Add Sentry, GrowthBook, PostHog SDKs per `docs/architecture.md`
- Configure signing in `~/.gradle/gradle.properties` (NEVER commit keystores)
- Set up Play Console + internal testing track

See `CLAUDE.md` for per-story flow and pre-release checklist.
