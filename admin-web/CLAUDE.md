# Client Project — Enterprise Baseline (Next.js)

## Phase gate

This project uses BMAD + Superpowers. **`src/` is off-limits until all of these exist and are committed:**

- `docs/prd.md`, `docs/ux-design.md`, `docs/architecture.md`
- `docs/adr/0001-*.md`
- `docs/stories/` has at least one story file
- `docs/threat-model.md`, `docs/runbook.md`
- `.bmad-readiness-passed` marker

Hooks in `.claude/settings.json` enforce this.

## Per-story execution

1. Pick story from `docs/stories/`
2. Fresh session → `/superpowers:writing-plans` → commit `plans/<story-id>.md`
3. **Fresh session** → `/superpowers:executing-plans`
4. TDD: tests in `tests/` BEFORE implementation in `src/`
5. `/superpowers:verification-before-completion` before claiming done
6. 5-layer review gate → `/codex-review-gate` (writes `.codex-review-passed`)
7. `git push` — CI runs the full quality gate

## Stack

- Next.js 15 (App Router), TypeScript `strict: true`
- Sentry + OpenTelemetry instrumentation
- GrowthBook OSS feature flags
- Storybook + design tokens
- PostHog event tracking
- Vitest + Playwright
- CI: type, lint, test (≥80% coverage), Semgrep, axe-core, Lighthouse CI, Codex review

## Production deployment

- Canonical production admin frontend is Azure Static Web Apps resource `swa-homeservices-admin-prod`.
- Public SWA URL: `https://black-river-0af326a00.7.azurestaticapps.net`.
- Deploy workflow: `.github/workflows/admin-ship.yml` on `main`.
- The old Azure Container App `aca-admin-homeservices-prod` is a legacy/stale admin endpoint and must not be used for validation or access unless a user-approved migration ADR makes ACA canonical again.
- Firebase client auth config is baked into the SWA build from GitHub Actions secrets `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, and `NEXT_PUBLIC_FIREBASE_PROJECT_ID`. If login shows `auth/api-key-not-valid`, check those repo secrets before changing code.

## Override

Set `CLAUDE_OVERRIDE_REASON="<reason>"` to bypass a hook. Logged to `~/.claude/override-log.jsonl`.
