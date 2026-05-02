# homeservices-admin

Owner-facing admin dashboard for the homeservices-mvp platform. Next.js 15 (App Router, RSC-first) + TypeScript strict + Tailwind v4 + Storybook. Hosted on Azure Static Web Apps free tier (deploy story is separate).

## Quick start

```bash
pnpm install
cp .env.example .env.local   # leave SENTRY_DSN blank for local dev
pnpm dev                     # http://localhost:3000
```

## Firebase dev keys (required for login)

The login form uses Firebase Phone Auth. `.env.local` ships with placeholder values that fail with `auth/api-key-not-valid` on actual sign-in. To run the login flow locally:

1. **Create a dev Firebase project** (or get added to the existing one):
   - Go to https://console.firebase.google.com
   - Create a project named `homeservices-dev` (or reuse any throwaway project).
   - Add a Web app: Project settings → General → Your apps → "Add app" → Web.
   - Enable Phone Auth: Authentication → Sign-in method → Phone → Enable.
   - Add `localhost` to Authorized domains.

2. **Copy the SDK config into `.env.local`:**
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...                   # Web API Key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=homeservices-dev.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=homeservices-dev
   ```

3. **Restart `pnpm dev`** — Firebase reads env at module import.

> Production keys live in the Azure Static Web Apps environment, not in `.env.local`. Never commit real keys; `.env.local` is gitignored but treat it as secret regardless. To rotate the placeholder `JWT_SECRET` to a per-developer random value:
> ```
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```
> and replace `JWT_SECRET=` in `.env.local`.

## Test

```bash
pnpm typecheck            # tsc --noEmit, strict
pnpm lint                 # next lint + eslint . --max-warnings 0
pnpm test:coverage        # Vitest + RTL, ≥80% lines/branches/functions/statements
pnpm -C ../api install    # prereq for test:e2e — the Playwright webServer boots api/
pnpm -C ../api build      # prereq for test:e2e — func start reads dist/
pnpm test:e2e             # Playwright (Chromium); boots api/ on :7071 + admin-web on :3000
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
- **Tokens only.** Every color/space/type/radius/elevation/motion comes from a token defined in `app/globals.css` `@theme { ... }`. No hex literals, no magic `px`, no inline styles. Theme via `data-theme="light|dark"` on `<html>`, server-rendered from the `theme` cookie.
- **Tailwind v4 only.** No Emotion, no styled-components, no CSS Modules for new code.
- **Strict TS + zero ESLint warnings.** `tsconfig.json` includes `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- **Tests live under `tests/`.** Unit + component in `tests/*.test.tsx`; e2e in `tests/e2e/`; a11y in `tests/a11y/`. **No snapshot tests.**
- **Sentry init lives in `src/sentry.{server,edge,client}.config.ts`** dispatched by `src/instrumentation.ts`. No `Sentry.init()` calls in components/pages.
- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).

## Generated API Client

This project consumes `api/`'s OpenAPI spec via a generated TypeScript client.

- **Generate:** `pnpm openapi:client` syncs `api/openapi.json` → `src/api/generated/openapi.json` and emits `src/api/generated/schema.d.ts` via `openapi-typescript`.
- **When to regenerate:** every time `api/openapi.json` changes. CI drift-checks on every PR.
- **How to call:** import `createApiClient` from `@/api` (never from `@/api/generated/*`). See ADR-0009.
- **Auth tokens:** pass a `headers` provider to `createApiClient({ headers: () => ({...}) })`. The provider is invoked per request, so rotating tokens work.
- **Base URL:** set `API_BASE_URL` (server-only — never `NEXT_PUBLIC_*`) or default to `http://localhost:7071/api`.
