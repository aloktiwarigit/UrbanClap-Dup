# homeservices-admin

Owner-facing admin dashboard for the homeservices-mvp platform. Next.js 15 (App Router, RSC-first) + TypeScript strict + Tailwind v4 + Storybook. Hosted on Azure Static Web Apps free tier (deploy story is separate).

## Quick start

```bash
pnpm install
cp .env.example .env.local   # leave SENTRY_DSN blank for local dev
pnpm dev                     # http://localhost:3000
```

## Test

```bash
pnpm typecheck            # tsc --noEmit, strict
pnpm lint                 # next lint + eslint . --max-warnings 0
pnpm test:coverage        # Vitest + RTL, ≥80% lines/branches/functions/statements
pnpm test:e2e             # Playwright (Chromium)
pnpm test:a11y            # Playwright + axe-core (WCAG 2.1 AA)
pnpm exec lhci autorun    # Lighthouse CI budgets (Perf 0.9 / A11y 0.95 / BP 0.9 / SEO 0.9)
```

## Storybook

```bash
pnpm storybook            # http://localhost:6006
pnpm storybook:build      # static site → ./storybook-static/
```

## Deploy

Azure Static Web Apps (free tier — 100 GB/mo bandwidth). Deploy wiring is **out of scope for this skeleton story** and lands in a dedicated deploy story; build output stays SWA-compatible (no `output: 'standalone'`, no Edge runtime requirement).

## Conventions

- **App Router only.** No `pages/`. All routes in `app/<route>/page.tsx`.
- **RSC by default.** `"use client"` only when needed (event handlers, browser APIs, React state).
- **Tokens only.** Every color/space/type/radius/elevation/motion comes from a token defined in `app/globals.css` `@theme { ... }`. No hex literals, no magic `px`, no inline styles. Dark mode via `class="dark"` on `<html>`.
- **Tailwind v4 only.** No Emotion, no styled-components, no CSS Modules for new code.
- **Strict TS + zero ESLint warnings.** `tsconfig.json` includes `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- **Tests live under `tests/`.** Unit + component in `tests/*.test.tsx`; e2e in `tests/e2e/`; a11y in `tests/a11y/`. **No snapshot tests.**
- **Sentry init lives in `src/sentry.{server,edge,client}.config.ts`** dispatched by `src/instrumentation.ts`. No `Sentry.init()` calls in components/pages.
- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
