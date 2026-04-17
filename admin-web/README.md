# <Client Name>

Scaffolded from `agency-templates/client-baseline-nextjs`.

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Workflow

See `CLAUDE.md`. Short version: **BMAD plans, Superpowers executes, Codex reviews, CI gates.**

## Structure

| Path | Purpose |
|---|---|
| `docs/prd.md` | Product requirements (BMAD Phase 2) |
| `docs/ux-design.md` | UX spec (BMAD Phase 3) |
| `docs/architecture.md` | Architecture (BMAD Phase 4) |
| `docs/adr/` | Architecture Decision Records |
| `docs/stories/` | Per-story specs (BMAD Phase 5) |
| `docs/threat-model.md` | STRIDE threat model |
| `docs/runbook.md` | Oncall + incident response |
| `plans/` | Superpowers implementation plans (per story) |
| `specs/` | Spec-Kit per-story specs |
| `src/` | Application code — **gated until BMAD artifacts exist** |
| `tests/` | Vitest unit + Playwright e2e + a11y |
| `.storybook/` | Component library |
| `DESIGN.md` | Brand tokens |

## Commands

| Command | What |
|---|---|
| `pnpm dev` | Local dev |
| `pnpm build && pnpm start` | Production build |
| `pnpm typecheck` | TS strict check |
| `pnpm lint` | ESLint (zero warnings) |
| `pnpm test:coverage` | Unit tests ≥80% coverage |
| `pnpm test:e2e` | Playwright |
| `pnpm test:a11y` | axe-core WCAG AA |
| `pnpm lhci` | Lighthouse CI against budget |
| `pnpm storybook` | Component library |

## CI gate

`.github/workflows/ship.yml` enforces:
- typecheck, lint (0 warn), tests ≥80% coverage
- Semgrep SAST
- Playwright e2e + axe a11y
- Lighthouse CI perf/a11y/best-practices/SEO budgets
- BMAD artifacts present
- Codex review marker matches HEAD

Local hooks (`.claude/settings.json`) run the same checks as fast feedback. **CI is authoritative.**
