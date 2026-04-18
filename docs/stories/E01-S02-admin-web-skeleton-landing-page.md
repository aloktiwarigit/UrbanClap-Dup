# Story E01.S02: Admin web skeleton — Next.js 15 + Tailwind + Storybook + landing page + green CI

Status: ready-for-dev

> **Epic:** E01 — Foundations, CI & Design System (`docs/stories/README.md` §E01)
> **Sprint:** S1 (wk 1–2) · **Estimated:** ≤ 1 dev-day · **Priority:** **P0 / blocks all other `admin-web/` stories (E09-S01..S06, E10-S04) and UX-driven design-system work (E01-S04, E01-S05)**
> **Sub-project:** `admin-web/`

---

## Story

As the **solo founder-operator (Alok)** building homeservices-mvp on Claude Max + Codex,
I want the `admin-web/` sub-project to be a runnable Next.js 15 + TypeScript + Tailwind + Storybook skeleton with a WCAG-AA-clean landing page and green `ship.yml` CI on a PR,
so that **every subsequent owner-facing web story (Live Ops Dashboard, Orders, Finance, Complaints, Audit Log) starts from a stable, accessibility-tested, performance-budgeted, BMAD-gated baseline — not a scaffold with missing Tailwind, an unstyled `page.tsx`, and a CI workflow that GitHub Actions cannot even discover.**

This story turns the placeholder agency-baseline scaffold (`admin-web/package.json` name `client-baseline-nextjs`, no Tailwind installed, empty Storybook, `admin-web/.github/workflows/ship.yml` at a path GitHub Actions does not read) into the canonical homeservices-admin skeleton aligned with **ADR-0001** (Next.js 15 + Tailwind + strict TS), **ADR-0007** (zero paid SaaS), and **architecture §6** (design-system foundations/tokens layout + Figma-driven tokens pipeline for a future story).

It also applies the two disaster fixes already proven in E01-S01 (workflow-at-wrong-path and self-referential codex-marker paradox) to the `admin-web` workflow so CI actually runs and actually gates.

---

## Acceptance Criteria

> All acceptance criteria are BDD-formatted (Given/When/Then) and verified by automated tests in `admin-web/tests/` plus the CI `api-ship.yml`/`admin-ship.yml` runs.

### AC-1 · Local Next.js dev server starts and renders the landing page
- **Given** a developer at `admin-web/` runs `pnpm install && pnpm dev`
- **Then** Next.js 15 boots without error inside ≤ 10 s
- **And** navigating to `http://localhost:3000` returns HTTP **200** and renders the `/` landing route
- **And** the landing page displays at minimum: brand name ("homeservices" placeholder), a one-line tagline, an owner-login CTA (link to `/login` which may be a 501-stub route in this story), and a footer with build info (version + 8-char commit from `NEXT_PUBLIC_GIT_SHA` env or `"dev"` locally)
- **And** no client-side console errors or warnings in a fresh incognito browser profile

### AC-2 · Landing page is WCAG 2.1 Level AA conformant
- **Given** the running dev server (or production build via `pnpm build && pnpm start`)
- **When** Playwright + `@axe-core/playwright` run via `pnpm test:a11y` against the landing page
- **Then** axe-core reports **zero** violations at the `wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa` levels (no `moderate`/`serious`/`critical` issues allowed; `minor` surfaced as warnings)
- **And** all interactive elements are keyboard-reachable, with visible `:focus-visible` rings
- **And** color contrast ≥ 4.5:1 for body text and ≥ 3:1 for large text (NFR-A-5 enforced by tokens, verified by axe)
- **(NFR-A-1 enforcement)**

### AC-3 · Lighthouse CI budgets pass
- **Given** the production build
- **When** `pnpm exec lhci autorun` executes in CI against the built landing page
- **Then** Lighthouse scores meet these category minimums (p95 over 3 runs):
  - **Performance ≥ 90** (NFR-P-6 — FCP p95 < 3 s; LCP < 2.5 s; TBT < 200 ms)
  - **Accessibility ≥ 95** (complements axe-core)
  - **Best Practices ≥ 90**
  - **SEO ≥ 90**
- **And** the `lighthouserc.js` budgets file captures the exact thresholds
- **And** the assertion is a CI hard-fail (not a warning)

### AC-4 · Tailwind v4 is installed, configured, and wired with tokens from UX §5
- **Given** the codebase
- **When** `pnpm build` runs
- **Then** Tailwind CSS v4 is active (via the `@tailwindcss/postcss` or first-party Vite/Next plugin per v4 conventions)
- **And** `admin-web/app/globals.css` (or equivalent) imports the Tailwind layers
- **And** `admin-web/src/styles/tokens.css` (or `tailwind.config.ts` `theme.extend`) defines the **foundation tokens** per architecture §6.4 and UX design §5: color (`--brand`, `--surface`, `--text`, `--success`, `--warn`, `--danger`), type scale (`text-xs` through `text-4xl`), spacing scale (4 / 8 / 12 / 16 / 24 / 32 / 48 px), radii (4 / 8 / 12 px), elevation (3 shadow tiers), motion (2 duration + 2 easing tokens)
- **And** the landing page uses **tokens only** — no hex codes, no magic numbers for spacing, no inline styles
- **And** dark mode works via `prefers-color-scheme: dark` with a manual override class (`class="dark"` on `<html>`), verified by a test that toggles it and asserts a different computed contrast

### AC-5 · Storybook boots and builds
- **Given** the codebase
- **When** a developer runs `pnpm storybook`
- **Then** Storybook serves at `http://localhost:6006` within ≤ 15 s
- **And** at least **three seed stories** exist: `Button` (variants: primary/secondary/ghost; sizes: sm/md/lg; state: default/hover/disabled), `TokenSwatch` (renders the full color token palette for visual review), and `Typography` (renders all text size tokens)
- **And** `pnpm storybook:build` produces a static site in `admin-web/storybook-static/` without errors
- **And** the Storybook static build is smoke-tested in CI (a trivial step that runs `pnpm storybook:build` and asserts `storybook-static/index.html` is non-empty)

### AC-6 · TypeScript strict + ESLint zero-warnings
- **Given** the codebase
- **When** `pnpm typecheck` runs
- **Then** it exits 0 with `tsc --noEmit` against `tsconfig.json` whose `compilerOptions` includes `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`, `"target": "ES2022"`, `"moduleResolution": "Bundler"` (Next.js 15 convention)
- **And** `pnpm lint` exits 0 with **zero warnings** (`next lint && eslint . --max-warnings 0`) using the flat ESLint config extending `next/core-web-vitals`, `@typescript-eslint/recommended-type-checked`, and `eslint-plugin-jsx-a11y`
- **(NFR-M-5 enforcement)**

### AC-7 · Vitest passes ≥ 80% coverage + Playwright e2e covers the landing page happy path
- **Given** the codebase
- **When** `pnpm test:coverage` runs
- **Then** Vitest exits 0 with coverage thresholds in `vitest.config.ts`: lines ≥ 80%, branches ≥ 80%, functions ≥ 80%, statements ≥ 80%
- **And** `pnpm test:e2e` passes at minimum: "GET / renders brand, tagline, CTA, and footer with build-info; clicking CTA navigates to /login" and "Theme toggle switches `<html class='dark'>` and the computed background color changes"
- **And** the following test files exist and pass: `tests/landing.page.test.tsx` (Vitest + React Testing Library), `tests/e2e/landing.spec.ts` (Playwright), `tests/a11y/landing.a11y.spec.ts` (Playwright + axe)
- **(NFR-M-4 enforcement)**

### AC-8 · `admin-ship.yml` CI is green on a PR to `main` — workflow moved to repo-root `.github/workflows/`
- **Given** a PR is opened from this story's feature branch to `main`
- **When** GitHub Actions discovers and runs `.github/workflows/admin-ship.yml` (the renamed workflow at the **repo-root** path — see Anti-pattern #1 and Disaster Prevention §1)
- **Then** every step passes: BMAD artifacts gate, `pnpm typecheck`, `pnpm lint`, `pnpm test:coverage` (≥ 80% threshold enforced), `pnpm build`, Semgrep SAST (`p/typescript p/react p/owasp-top-ten p/secrets`), `pnpm test:e2e` (Playwright), `pnpm test:a11y` (axe-core), `pnpm exec lhci autorun`, `pnpm storybook:build`, `pnpm audit --audit-level=high || true`
- **And** the codex-review-marker step uses the **ancestor-check + scope-diff** pattern (matching the fix applied in E01-S01 for `api-ship.yml` — see §"Patterns to Reuse") — **not** a naive `MARKER_SHA == HEAD_SHA` equality check
- **And** the workflow has a `paths:` filter: `['admin-web/**', '.github/workflows/admin-ship.yml']` so it only runs on admin-web changes (avoid wasted CI minutes on api/, customer-app/, technician-app/ changes)
- **And** `defaults.run.working-directory: admin-web` is set so `pnpm install/typecheck/lint/test/build` run from `admin-web/` while the BMAD-gate `test -f` lookups continue to use workspace-root paths
- **And** the BMAD-gate step hard-fails (`exit 1`) on missing artifacts — not a `::warning::`

### AC-9 · Sentry for Next.js is initialized but in safe no-op mode by default; OpenTelemetry deferred
- **Given** the app starts
- **And** `SENTRY_DSN` env var (or `NEXT_PUBLIC_SENTRY_DSN` for client) is **not** set (default for local dev + CI)
- **Then** Sentry Next.js SDK initialization is a no-op (no errors, no network calls) verified in `tests/sentry-init.test.ts`
- **And** `admin-web/src/instrumentation.ts` (Next.js 15 built-in hook) calls the same `initSentry()` wrapper pattern established in E01-S01 api/ — reads DSN from env, early-returns when unset
- **Given** in production both env vars **are** set
- **Then** Sentry captures errors and traces (full exercise deferred to a later observability story; this story only proves the wiring doesn't crash and is a no-op when unset)
- **And** OpenTelemetry auto-instrumentation is **deferred entirely** in this story (consistent with E01-S01 brainstorm §2 — `@opentelemetry/sdk-node` is not a clean no-op in Next.js SSR either; exporter choice is a cross-cutting decision owed to a dedicated observability story). Remove `@opentelemetry/api` and `@opentelemetry/sdk-node` from `admin-web/package.json` in this story; add a TODO comment in `instrumentation.ts` pointing to the future OTel story.
- **(NFR-O-2 traceability for Sentry; NFR-O-6 deferred)**

### AC-10 · Project rename, metadata, README, and `.env.example` hygiene
- **Given** `admin-web/package.json`
- **Then** the `name` field is `"homeservices-admin"` (replacing the placeholder `"client-baseline-nextjs"`)
- **And** `version` is `"0.1.0"`
- **And** `engines` requires `"node": ">=22.0.0"` and `"pnpm": ">=9.0.0"`
- **And** `packageManager` field is set to `"pnpm@9.15.4"` (matches api/ — corepack reproducibility)
- **And** `admin-web/README.md` exists with: 5-line project description, "Quick start" (`pnpm install`, `pnpm dev`), "Test" (`pnpm test:coverage`, `pnpm test:e2e`, `pnpm test:a11y`), "Storybook" (`pnpm storybook`), "Deploy" (placeholder — "Azure Static Web Apps — covered in a later deploy story"), and a `## Conventions` block documenting the App Router only / RSC-first / tokens-only-no-magic-numbers / Tailwind-only-no-Emotion rules
- **And** `admin-web/.env.example` committed with **no real secrets** — only `SENTRY_DSN=`, `NEXT_PUBLIC_SENTRY_DSN=`, `NEXT_PUBLIC_POSTHOG_KEY=`, `GROWTHBOOK_CLIENT_KEY=` stub keys (empty values); `admin-web/.env.local` is gitignored (verify and add to root `.gitignore` if missing)

### AC-11 · Zero paid SaaS dependencies introduced
- **Given** the new `admin-web/package.json` and `admin-web/pnpm-lock.yaml`
- **Then** every dependency added in this story is on the **approved free-tier list** at `docs/adr/0007-zero-paid-saas-constraint.md` §"Known free-tier dependencies"
- **And** the dependency list is documented in §Library/Framework Requirements below
- **And** no SDK from the prohibited list is present (LaunchDarkly, Segment, Datadog, New Relic, paid CodeRabbit, paid Chromatic, paid Figma, paid Vercel AI SDK tier, etc.)
- **And** Chromatic (visual regression) is **not** introduced in this story (free tier is 5,000 snapshots/mo — defer the decision to a dedicated story once component count > ~20; for now Storybook static build is the visual-regression artifact, manually reviewable in the static build)

---

## Tasks / Subtasks

> **TDD discipline (per CLAUDE.md):** for each task that introduces production code, write the failing test first, then make it pass, then refactor. Sub-tasks are ordered for that.

- [ ] **T1 — Rename + metadata** (AC-10)
  - [ ] T1.1 Rename `admin-web/package.json` `name` to `"homeservices-admin"`; set `version` `0.1.0`; add `engines`; add `packageManager: "pnpm@9.15.4"`
  - [ ] T1.2 Add `admin-web/.nvmrc` containing `22`
  - [ ] T1.3 Add `admin-web/.editorconfig`, `admin-web/.prettierrc.json`, `admin-web/.prettierignore` (mirror api/ shapes)
  - [ ] T1.4 Create `admin-web/README.md` with the sections in AC-10
  - [ ] T1.5 Create `admin-web/.env.example` with the stub keys in AC-10; verify `admin-web/.env.local` is gitignored (add to root `.gitignore` under `# admin-web/` block if missing)

- [ ] **T2 — TypeScript strict config** (AC-6)
  - [ ] T2.1 Replace `admin-web/tsconfig.json` with strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `moduleResolution: "Bundler"` + `paths: { "@/*": ["./src/*"] }` + `include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]`
  - [ ] T2.2 Add `admin-web/next-env.d.ts` if not already present (Next.js auto-generates; check)

- [ ] **T3 — ESLint 9 flat config** (AC-6)
  - [ ] T3.1 Add `admin-web/eslint.config.mjs` extending `next/core-web-vitals`, `@typescript-eslint/recommended-type-checked`, `eslint-plugin-jsx-a11y` with `--max-warnings 0`
  - [ ] T3.2 Update `pnpm lint` script to `next lint && eslint . --max-warnings 0` (keep both — Next's own lint catches framework issues the flat config doesn't)

- [ ] **T4 — Tailwind v4 + design tokens** (AC-4)
  - [ ] T4.1 Add Tailwind v4 deps (`tailwindcss@^4`, `@tailwindcss/postcss`, `postcss`, `autoprefixer`) to `devDependencies`
  - [ ] T4.2 Create `admin-web/postcss.config.mjs` with the `@tailwindcss/postcss` plugin
  - [ ] T4.3 Create `admin-web/app/globals.css` importing Tailwind layers (`@import "tailwindcss"`) and defining CSS custom properties for foundation tokens (color, type, space, radii, elevation, motion) per UX §5 + architecture §6.4
  - [ ] T4.4 Ensure `admin-web/app/layout.tsx` imports `./globals.css` and sets `<html lang="en" className={...}>` with a theme class toggle hook
  - [ ] T4.5 (RED) Write `tests/tokens.test.tsx` asserting a token CSS variable is computed on the document element
  - [ ] T4.6 (GREEN) Wire the tokens — they should already be there from T4.3; this test guards future regressions

- [ ] **T5 — Landing page** (AC-1, AC-2, AC-4)
  - [ ] T5.1 (RED) Write `tests/landing.page.test.tsx` (Vitest + React Testing Library) asserting brand + tagline + CTA + footer-with-build-info rendered
  - [ ] T5.2 (GREEN) Implement `admin-web/app/page.tsx` as a React Server Component (RSC). Use Tailwind tokens only (no hex, no px magic numbers). Include a semantic `<header>`, `<main>`, `<footer>`. The CTA is a `<Link href="/login">` — `/login` itself is a stub route (T5.4) returning a 501 Coming Soon message.
  - [ ] T5.3 Add `admin-web/src/lib/build-info.ts` exporting `getBuildInfo()` reading `NEXT_PUBLIC_GIT_SHA` (falls back to `"dev"`) + `package.json` version via Next's compile-time `process.env` inlining (NOT `readFileSync` — there's no `dist/` layout in Next.js; use `NEXT_PUBLIC_APP_VERSION` env injected at build via `next.config.ts` `env` block)
  - [ ] T5.4 Add `admin-web/app/login/page.tsx` — minimal 501 placeholder ("Owner sign-in coming in E02-S04"). RSC, token-only styling, linked from landing CTA.
  - [ ] T5.5 (RED + GREEN) Add `tests/e2e/landing.spec.ts` — Playwright test for the happy path

- [ ] **T6 — Sentry wiring (no-op-when-unset) + OTel deferral** (AC-9)
  - [ ] T6.1 Delete `@opentelemetry/api` and `@opentelemetry/sdk-node` from `admin-web/package.json` dependencies (remove after `pnpm install` regenerates the lockfile)
  - [ ] T6.2 Rewrite `admin-web/src/instrumentation.ts` as: read `SENTRY_DSN`; if unset, early return; else import and call `Sentry.init({ dsn, tracesSampleRate: 0.1 })`. Add a TODO comment pointing to the future OTel story (mirror the api/ `bootstrap.ts` pattern).
  - [ ] T6.3 Add `admin-web/src/sentry.client.config.ts` — init client SDK the same way, reading `NEXT_PUBLIC_SENTRY_DSN`
  - [ ] T6.4 Add `admin-web/src/sentry.server.config.ts` for server-side runtime (re-reads `SENTRY_DSN`)
  - [ ] T6.5 (RED + GREEN) `tests/sentry-init.test.ts` — mock `@sentry/nextjs`; assert init not called when DSN unset; assert init called once with tracesSampleRate=0.1 when set

- [ ] **T7 — Vitest + Playwright + coverage** (AC-7)
  - [ ] T7.1 Add/update `admin-web/vitest.config.ts` with React Testing Library setup + v8 coverage thresholds 80% on lines/branches/functions/statements
  - [ ] T7.2 Confirm `admin-web/playwright.config.ts` includes a11y project (`@axe-core/playwright`) and default (Chromium) project; both run against `http://localhost:3000`
  - [ ] T7.3 Write `tests/a11y/landing.a11y.spec.ts` — Playwright + axe-core scanning `/` for WCAG 2.1 AA violations; fail on any moderate/serious/critical
  - [ ] T7.4 Add `coverage/` to `admin-web/.gitignore`

- [ ] **T8 — Storybook with seed stories** (AC-5)
  - [ ] T8.1 Verify `admin-web/.storybook/main.ts` references `@storybook/nextjs` framework; ensure it picks up `src/components/**/*.stories.tsx`
  - [ ] T8.2 Create `admin-web/src/components/Button.tsx` — a minimal token-styled button with `variant: 'primary' | 'secondary' | 'ghost'` and `size: 'sm' | 'md' | 'lg'`
  - [ ] T8.3 Create `admin-web/src/components/Button.stories.tsx` with the variants × sizes × states matrix
  - [ ] T8.4 Create `admin-web/src/components/TokenSwatch.stories.tsx` — renders the full color palette (server-side static)
  - [ ] T8.5 Create `admin-web/src/components/Typography.stories.tsx` — renders all text size tokens
  - [ ] T8.6 Confirm `pnpm storybook` boots locally; `pnpm storybook:build` produces `storybook-static/`

- [ ] **T9 — Lighthouse CI budgets** (AC-3)
  - [ ] T9.1 Update `admin-web/lighthouserc.js` with category-score assertions per AC-3 (Performance ≥ 90, Accessibility ≥ 95, Best-Practices ≥ 90, SEO ≥ 90)
  - [ ] T9.2 Add `settings.numberOfRuns: 3` and `assert.assertions.*` blocks for `categories:*:minScore`
  - [ ] T9.3 Verify `pnpm exec lhci autorun` works locally against `pnpm start`

- [ ] **T10 — Move ship.yml + fix paths filter + codex-marker ancestor-check** (AC-8)
  - [ ] T10.1 `git mv admin-web/.github/workflows/ship.yml .github/workflows/admin-ship.yml` (apply the lesson from E01-S01 C1 finding — GitHub Actions only discovers workflows at the repo-root `.github/workflows/`)
  - [ ] T10.2 Rewrite `.github/workflows/admin-ship.yml` name to `"admin-ship"`; add `paths:` filter `['admin-web/**', '.github/workflows/admin-ship.yml']` on both `pull_request` and `push`
  - [ ] T10.3 Add `defaults.run.working-directory: admin-web` at job scope
  - [ ] T10.4 Add `env: { GIT_SHA: ${{ github.sha }}, NEXT_PUBLIC_GIT_SHA: ${{ github.sha }} }` at job scope
  - [ ] T10.5 Wire all steps: checkout, pnpm/action-setup, actions/setup-node (with `cache-dependency-path: admin-web/pnpm-lock.yaml`), BMAD-gate (hard-fail), pnpm install, typecheck, lint, test:coverage, build, semgrep, e2e-and-a11y job (Playwright + axe-core), Lighthouse CI, storybook:build, pnpm audit (`|| true` inline-commented same as api/)
  - [ ] T10.6 Replace the codex-review-marker step with the **ancestor-check + scope-diff** pattern from `.github/workflows/api-ship.yml` (verbatim adaptation — marker SHA must be ancestor of HEAD; diff since marker limited to `.codex-review-passed` + `docs/reviews/`)
  - [ ] T10.7 Delete the obsolete `admin-web/.github/` directory after the move; verify `admin-web/.github/workflows/ship.yml` no longer exists

- [ ] **T11 — Pre-push 5-layer review gate** (per CLAUDE.md §Per-Story Protocol)
  - [ ] T11.1 `/code-review` (lint + stylistic — Claude)
  - [ ] T11.2 `/security-review`
  - [ ] T11.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
  - [ ] T11.4 `/bmad-code-review` (Blind Hunter + Edge Case Hunter + Acceptance Auditor)
  - [ ] T11.5 `/superpowers:requesting-code-review`
  - [ ] T11.6 Only after all 5 layers, `git push`

---

## Dev Notes

### Story Foundation Context

This is the **first admin-web story** and the entry point for every owner-facing page. Dependencies: E01-S01 merged (✓ — merge commit `33db7bb` on main). Phase gate satisfied (`.bmad-readiness-passed` committed at `c360120`).

**Why this matters strategically (per architecture §2 Boring-Technology Manifesto):** every choice in this story locks in a pattern the next ~15 admin-web stories will follow. Getting the design-token plumbing wrong, the Tailwind v4 wiring wrong, the Next.js 15 RSC pattern wrong, the a11y floor wrong, or the CI workflow location wrong all have 15×-multiplier impact. Get it right and E09 (Owner Operations) stories are fast.

### Critical Architectural Constraints (READ BEFORE CODING)

| Constraint | Source | Story-level implication |
|---|---|---|
| **Next.js 15 App Router only** | ADR-0001, architecture §6 | No `pages/`. All routes in `app/`. RSC by default; `"use client"` only where needed (event handlers, client state). |
| **Tailwind v4** | ADR-0001, architecture §6.4, UX §5 | Tokens via CSS custom properties + `@theme` directive or `tailwind.config.ts` `theme.extend`. No Emotion/styled-components/CSS Modules for NEW code. |
| **TypeScript strict + `-Werror` equivalent** | NFR-M-5, root CLAUDE.md | `tsconfig.json` strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`. ESLint `--max-warnings 0`. |
| **Azure Static Web Apps as deploy target** | ADR-0007 (free tier 100 GB/mo), architecture §3 | Deployment is out-of-scope for this story, but build output must be SWA-compatible. Default Next.js output is fine; avoid features that block SWA (no `output: 'standalone'` needed for SWA). |
| **Tokens are single source of truth** | UX §5, architecture §6.4 | Every color / space / type / radius / elevation / motion value in code comes from a token. Seed tokens in this story; Figma-to-code sync lands in E01-S05. |
| **WCAG 2.1 AA is the accessibility floor** | NFR-A-1, NFR-A-5 | axe-core in CI, Lighthouse Accessibility ≥ 95, manual keyboard-nav pass before merge. No `tabIndex={-1}` workarounds; no ARIA if semantic HTML works. |
| **FCP p95 < 3 s** | NFR-P-6 | Lighthouse Performance ≥ 90 enforces this in CI. RSC-first. Lazy-load non-critical client islands. |
| **Zero paid SaaS** | ADR-0007 | Every dep on approved free-tier list. Storybook (OSS), Playwright (OSS), axe-core (OSS), Lighthouse CI (OSS), GrowthBook OSS self-hosted deferred to later story. |
| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` marker validated by the CI workflow's ancestor-check. |

### Why Next.js 15 App Router (not Pages Router or Remix or SvelteKit)

Next.js 15 App Router (GA late 2024) is the current standard:
- RSC by default = smaller client bundles = cheaper FCP = easier NFR-P-6 compliance
- Built-in `instrumentation.ts` hook = single Sentry wiring entry point (matches api/ `bootstrap.ts` pattern)
- First-class Tailwind v4 support with the PostCSS plugin
- Static + dynamic rendering mix = fits SWA free-tier perfectly (static landing, dynamic dashboard later)
- Route handlers for any server-side helpers we need without spinning up the api/ project

Pages Router is legacy. Remix is fine but Sentry/OTel/Tailwind v4 integration is less mature. SvelteKit is not in our skill-base and changes the frontend-design skill assumptions.

Reference: `next@^15` package; Next.js App Router docs.

### Why Landing Page, Not Login, Not Dashboard

Per the epic row, this story ships a **landing page** — lightweight brand placeholder with a CTA. Rationale:
1. **Login (E02-S04)** needs the Firebase/Entra auth pipeline that belongs in its own story.
2. **Live Ops Dashboard (E09-S01)** needs the Cosmos data model + FCM subscription + complex data-visualization that are multi-story concerns.
3. **Landing page** proves the Next.js + Tailwind + Storybook + a11y + Lighthouse pipeline end-to-end with minimum code — the whole point of the skeleton story.

### Source Tree Components to Touch

```
admin-web/
├── package.json                              MODIFY (rename, deps cleanup, scripts)
├── pnpm-lock.yaml                            REGENERATE
├── tsconfig.json                             MODIFY (strict mode)
├── eslint.config.mjs                         CREATE (flat config)
├── vitest.config.ts                          CREATE (thresholds)
├── playwright.config.ts                      VERIFY (ensure a11y project)
├── postcss.config.mjs                        CREATE (Tailwind v4)
├── next.config.ts                            VERIFY (env for NEXT_PUBLIC_GIT_SHA injection)
├── lighthouserc.js                           MODIFY (budgets)
├── .editorconfig, .prettierrc.json, .prettierignore  CREATE
├── .nvmrc                                    CREATE (22)
├── .env.example                              MODIFY
├── README.md                                 CREATE
├── .storybook/main.ts                        VERIFY (already exists)
├── app/
│   ├── layout.tsx                            CREATE (imports globals.css)
│   ├── page.tsx                              CREATE (landing RSC)
│   ├── login/page.tsx                        CREATE (501 stub)
│   └── globals.css                           CREATE (Tailwind + tokens)
├── src/
│   ├── instrumentation.ts                    REWRITE (no-op Sentry + TODO for OTel)
│   ├── sentry.client.config.ts               CREATE
│   ├── sentry.server.config.ts               CREATE
│   ├── lib/
│   │   ├── analytics.ts                      VERIFY (already exists)
│   │   ├── flags.ts                          VERIFY (already exists)
│   │   └── build-info.ts                     CREATE
│   ├── components/
│   │   ├── Button.tsx                        CREATE
│   │   ├── Button.stories.tsx                CREATE
│   │   ├── TokenSwatch.stories.tsx           CREATE
│   │   └── Typography.stories.tsx            CREATE
│   └── styles/tokens.css                     CREATE (may be inlined into globals.css — author's call)
└── tests/
    ├── landing.page.test.tsx                 CREATE
    ├── sentry-init.test.ts                   CREATE
    ├── tokens.test.tsx                       CREATE
    ├── e2e/landing.spec.ts                   CREATE
    └── a11y/landing.a11y.spec.ts             CREATE
```

Root-level files touched:
- `.github/workflows/admin-ship.yml` — CREATE (via `git mv` from `admin-web/.github/workflows/ship.yml` + content rewrite)
- `admin-web/.github/workflows/ship.yml` — DELETE (moved)
- `.gitignore` — ensure `admin-web/.next/`, `admin-web/coverage/`, `admin-web/storybook-static/`, `admin-web/node_modules/`, `admin-web/.env.local`, `admin-web/playwright-report/`, `admin-web/test-results/` are present under an explicit `# admin-web/` block

### Testing Standards (project-wide, plus admin-web specifics)

- **Vitest** for unit + component tests (React Testing Library for components). `describe/it/expect`. Coverage via `@vitest/coverage-v8`.
- **Playwright** for e2e + a11y. Run against `pnpm build && pnpm start` in CI; against `pnpm dev` locally.
- **axe-core via `@axe-core/playwright`** for WCAG scanning. Scan the `/` landing and `/login` stub.
- **Test files mirror source layout under `tests/`**, except Playwright tests live in `tests/e2e/` and a11y tests in `tests/a11y/`.
- **Coverage exclusions** are minimal: `app/layout.tsx` if it becomes entirely trivial; `src/sentry.*.config.ts`; `**/*.stories.tsx`; `**/*.config.*`. Never exclude `app/page.tsx` or `src/components/**` from coverage.
- **Test names** are full sentences: `"GET / renders the brand, tagline, CTA, and build-info footer"`, not `"landing works"`.
- **Snapshot tests are forbidden** for pages and components (they hide regressions and lock in arbitrary DOM). Use explicit queries with Testing Library semantic roles.

### Patterns to Reuse (LOCK IN — every future admin-web story must follow)

| Pattern | Where established | Rule |
|---|---|---|
| **Observability bootstrap** | `src/instrumentation.ts` (this story) | Read `SENTRY_DSN`; early-return if unset. Single entry point. Never call `Sentry.init()` directly in page/component code. |
| **Design tokens** | `app/globals.css` + `tailwind.config.ts` `theme.extend` | Every color/space/type/radius/elevation/motion comes from a token. Hex codes + arbitrary `px` values are lint-blocked. Dark mode works via `class="dark"` on `<html>`. |
| **Route structure** | `app/<route>/page.tsx` | App Router. RSC by default. `"use client"` only when needed. Routes version-prefixed (`/v1/...`) only when the route is an API route-handler — UI routes stay unprefixed. |
| **Build info** | `src/lib/build-info.ts` reading `NEXT_PUBLIC_GIT_SHA` + `NEXT_PUBLIC_APP_VERSION` via `next.config.ts` `env` injection | Never `readFileSync(package.json)` at runtime — Next.js bundles don't have a consistent filesystem layout. |
| **a11y floor** | Every page gets an entry in `tests/a11y/`. | axe-core zero-violations at WCAG 2.1 AA. No exceptions without an inline rationale comment + a tracking issue. |
| **Lighthouse** | `lighthouserc.js` budgets, CI gate | Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90, SEO ≥ 90. |
| **CI workflow location** | `.github/workflows/admin-ship.yml` (repo-root) | GitHub Actions only discovers root-level workflows. (Hard lesson from E01-S01.) |
| **Codex-marker CI gate** | `.github/workflows/admin-ship.yml` codex step (matches `api-ship.yml`) | Ancestor-check + scope-diff, NOT naive SHA-equality (chicken-and-egg paradox). |
| **Naming** | architecture §6.2 | TypeScript: PascalCase types/components, camelCase vars, kebab-case file names for pages, PascalCase file names for components. |

### Project Structure Notes

- **Alignment with monorepo (architecture §6):** This story creates `admin-web/app/`, `admin-web/src/components/`, `admin-web/src/lib/`, `admin-web/src/styles/` layout matched to the architecture spec.
- **No cross-package imports:** `admin-web/` does NOT import from `customer-app/`, `technician-app/`, or `api/`. Shared types come via **OpenAPI-generated client** from api/ (a later story — E03-S01 will wire the generator). For this story, the landing page has no API dependency, so no client is generated yet.
- **Detected variance:** baseline `package.json` has `@opentelemetry/api` and `@opentelemetry/sdk-node` directly — these are **removed** in this story (AC-9 deferral decision). Baseline has no Tailwind — added in T4. Baseline ship.yml is at `admin-web/.github/workflows/ship.yml` — moved in T10 (repo-root requirement).

### Previous Story Intelligence (from E01-S01 — merged `33db7bb`)

**Direct lessons that apply to this story (confirmed in the PR body of #1):**
1. **Workflow location:** GitHub Actions discovers workflows only at repo-root `.github/workflows/`. The `admin-web/.github/workflows/ship.yml` location is dead code; **must be moved** (T10.1). Same issue exists in `customer-app/` and `technician-app/` — those are out of scope for this story but will need the same move in their own E01-S0X stories.
2. **Codex-marker gate paradox:** naive `MARKER_SHA == HEAD_SHA` check is unsatisfiable (committing the marker moves HEAD). Use ancestor-check + scope-diff pattern (T10.6 — copy from `.github/workflows/api-ship.yml`).
3. **Build-before-dev:** if `pnpm dev` relies on a build step (api/ required this because Azure Functions loads from `dist/`), make `pnpm dev` explicitly `pnpm build && ...`. For Next.js, `next dev` handles compilation live so `pnpm dev` = `next dev` is correct (no change needed), but document the difference in the README.
4. **OTel is not a clean no-op:** defer entirely; remove the packages; leave a TODO in `instrumentation.ts` pointing at a future observability story.
5. **`main` glob is an Azure-Functions-only idiom:** doesn't apply here (Next.js has its own entry-point discovery).
6. **ESLint false positives for framework idioms:** expect to tune (e.g., Next's `next/core-web-vitals` may fight with `@typescript-eslint/recommended-type-checked` over Server Component prop types — tune `argsIgnorePattern` and specific Next rules only when they fire).
7. **Corepack reproducibility:** add `packageManager: "pnpm@9.15.4"` to `package.json`.

### Git Intelligence (last 5 commits on main, for context)

```
33db7bb Merge pull request #1 from aloktiwarigit/E01-S01-api-skeleton
5ca1d4e chore: codex review passed (round 2) — mark 71c61bf as reviewed
71c61bf fix(api,ci): address Codex review — dev script must build first + marker gate chicken-egg fix
c7cb8bd fix(ci): move ship.yml to repo-root .github/workflows/api-ship.yml
5526c3b fix(api): ESLint — allow _-prefixed unused params and async-without-await in functions
```

**Patterns observed:** TDD-ordered commits; each commit does one thing; commit messages include the "why"; review-gate fixes are clearly marked. This story should follow the same cadence (target: 10-13 commits).

### Library / Framework Requirements (exact versions, all approved free-tier)

> **All listed packages are on `docs/adr/0007` §"Known free-tier dependencies". Adding any other package requires an ADR + owner approval.**

**Production dependencies (added / kept):**
- `next@^15` — framework (already in baseline)
- `react@^19`, `react-dom@^19` — (already in baseline)
- `@sentry/nextjs@^8` — error tracking + Next-native tracing (already in baseline; no-op when DSN unset)
- `@growthbook/growthbook-react@^1` — feature flags (kept; not exercised in this story)
- `posthog-js@^1` — analytics (kept; not exercised in this story)

**Production dependencies REMOVED:**
- `@opentelemetry/api@^1` — deferred (see AC-9)
- `@opentelemetry/sdk-node@^0.50` — deferred

**Dev dependencies (added):**
- `tailwindcss@^4`, `@tailwindcss/postcss@^4`, `postcss@^8`, `autoprefixer@^10` — Tailwind v4 pipeline
- `@typescript-eslint/parser@^8`, `@typescript-eslint/eslint-plugin@^8`, `typescript-eslint@^8` (meta), `eslint-plugin-jsx-a11y@^6`, `eslint-config-next@^15` (already in baseline)

**Dev dependencies (kept):**
- `@axe-core/playwright@^4`, `@lhci/cli@^0.14`, `@playwright/test@^1`, `@storybook/nextjs@^8`, `@testing-library/react@^16`, `@types/node@^22`, `@types/react@^19`, `@vitest/coverage-v8@^2`, `eslint@^9`, `husky@^9`, `typescript@^5`, `vitest@^2`

**Forbidden in this story (and generally, without ADR):** `redux`, `@reduxjs/toolkit`, `zustand`, `jotai`, `mobx` (use RSC + URL state + React state); `emotion`, `styled-components`, `stitches` (Tailwind is locked); `date-fns` and `dayjs` (native `Intl.DateTimeFormat`); `axios` (use native `fetch`); `lodash` (native ES2022); Chromatic (paid after 5k snapshots); `@vercel/analytics` (use PostHog); `react-router` (App Router).

### Latest Tech Specifics (verified against current versions)

- **Next.js 15 App Router** is GA. `instrumentation.ts` is the official per-runtime hook (no experimental flag needed in 15.x).
- **React 19** is GA. Server Components by default in App Router. `use` hook for Suspense-integrated promise resolution.
- **Tailwind CSS v4** (2025 release) uses the PostCSS-native architecture. `@import "tailwindcss"` replaces the v3 `@tailwind base; @tailwind components; @tailwind utilities;` lines. Theme configuration can live in CSS (`@theme { ... }`) or `tailwind.config.ts`. Either works.
- **Sentry Next.js SDK v8** is the current major. `withSentryConfig` wrapper in `next.config.ts` is **not** required if using the manual `instrumentation.ts` pattern — which we do, to match the api/ pattern. Avoid the wrapper; it hides config and adds a source-map-upload step we don't need yet.
- **Storybook 8** supports Next.js 15 App Router via `@storybook/nextjs`. Set `framework.name: '@storybook/nextjs'` in `.storybook/main.ts`.
- **Lighthouse CI v0.14** supports category-score assertions via `assert.assertions['categories:performance'].minScore`.
- **axe-core via `@axe-core/playwright@^4`** supports WCAG 2.1 AA tag filtering.
- **Vitest v2** React support: use `environment: 'jsdom'` and `@vitejs/plugin-react` (NOT needed if using `@storybook/nextjs`-compatible vite config — verify).

### Performance Note (informational + CI gate)

Landing page performance targets:
- First Contentful Paint (FCP) p95 < 3 s (NFR-P-6) — enforced by Lighthouse Performance ≥ 90 budget
- Largest Contentful Paint (LCP) p95 < 2.5 s — Lighthouse default
- Total Blocking Time (TBT) < 200 ms — Lighthouse default
- Cumulative Layout Shift (CLS) < 0.1 — Lighthouse default

All enforced in CI via `lhci autorun` + assertions in `lighthouserc.js`.

### References

- [Source: `docs/architecture.md` §2 Boring-Technology Manifesto, §3 Component table, §6 Code structure, §6.4 Design-system foundations, §7.1 NFR traceability]
- [Source: `docs/adr/0001-primary-stack-choice.md` — Next.js + Tailwind + strict TS]
- [Source: `docs/adr/0007-zero-paid-saas-constraint.md` — approved free-tier dependency list]
- [Source: `docs/prd.md` §NFR-A-1 (WCAG 2.1 AA), §NFR-A-5 (contrast), §NFR-M-5 (strict types), §NFR-M-4 (coverage), §NFR-P-6 (FCP p95 < 3 s)]
- [Source: `docs/ux-design.md` §5 Design system, §7 Admin shell skeleton, §6.4 Tokens pipeline]
- [Source: `docs/threat-model.md` §3.2 Admin Web STRIDE — informs future auth + CSRF hardening; this story is pre-auth so scope is limited]
- [Source: `docs/runbook.md` §5 Deploy Procedure — deploy path is SWA; this story doesn't wire deploy but keeps build SWA-compatible]
- [Source: `docs/stories/README.md` §E01 row for E01-S02]
- [Source: `CLAUDE.md` (root) — phase gate, model routing, per-story protocol, 5-layer review]
- [Source: `admin-web/CLAUDE.md` — sub-project stack rules + CI gates]
- [Source: `admin-web/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
- [Source: `.github/workflows/api-ship.yml` — template for the codex-marker ancestor-check pattern to copy]
- [Source: `docs/stories/E01-S01-api-skeleton-health-endpoint.md` — structural and disciplinary template]
- [Source: merged PR #1 — for the exact workflow-location + marker-paradox fixes and their rationale]

---

## Anti-patterns to AVOID (Disaster Prevention)

> Each item here corresponds to a real risk for the dev agent — flagged in advance to prevent rework.

1. **Do NOT place the workflow at `admin-web/.github/workflows/admin-ship.yml`.** GitHub Actions only discovers workflows at the repo-root `.github/workflows/` directory. The current baseline location is dead code. This is the single most impactful fix in the story.
2. **Do NOT use a naive `MARKER_SHA == HEAD_SHA` codex-marker check.** Committing the marker moves HEAD, so that check is unsatisfiable. Use ancestor-check + scope-diff (copy from `.github/workflows/api-ship.yml`).
3. **Do NOT introduce OpenTelemetry auto-instrumentation.** `@opentelemetry/sdk-node` is not a clean no-op in Next.js SSR. Defer to a dedicated observability story. Remove the packages from `package.json`.
4. **Do NOT use the Pages Router** (`pages/*.tsx`). App Router only.
5. **Do NOT introduce Emotion, styled-components, or CSS Modules for new components.** Tailwind v4 is the locked CSS strategy.
6. **Do NOT introduce a client-side state library (Redux / Zustand / MobX / Jotai).** React state + URL state + React Query (in later stories) cover the needs.
7. **Do NOT use `readFileSync` on `package.json` at runtime** (the api/ lesson does NOT transfer directly because Next.js has no `dist/` layout — instead, inject the version + GIT_SHA at build time via `next.config.ts` `env`).
8. **Do NOT commit `admin-web/.env.local`.** The `.env.example` is the only committed variant.
9. **Do NOT add a paid-SaaS package "just for now."** ADR-0007 is binding. Chromatic, Vercel Analytics, LaunchDarkly, paid Sentry tier — all forbidden without an ADR.
10. **Do NOT skip TDD.** Per CLAUDE.md per-story protocol, tests come first. The task list orders RED → GREEN explicitly.
11. **Do NOT add `"use client"` to every component "just in case".** RSC by default; mark client only when needed (event handlers, browser-only APIs, React state).
12. **Do NOT bypass `pnpm lint` warnings with `// eslint-disable-next-line` without a trailing `--` rationale comment.** Every disable must justify itself.
13. **Do NOT snapshot-test React components.** Brittle + hides regressions. Use semantic queries from Testing Library.
14. **Do NOT amend an earlier commit on this branch after it's pushed.** Per root CLAUDE.md: always create new commits. Pre-commit hooks failing means the previous commit didn't happen — fix forward, don't `--amend`.
15. **Do NOT add components to `/app/**` unless they're route-scoped.** Shared components live in `src/components/`.
16. **Do NOT bypass the codex-review-gate.** The pre-push hook in `admin-web/.claude/settings.json` will block; do not set `CLAUDE_OVERRIDE_REASON` for routine work.
17. **Do NOT add comments explaining what code does.** Per root CLAUDE.md: only comment when WHY is non-obvious.
18. **Do NOT build the Live Ops Dashboard or any data-driven dashboard in this story.** That's E09-S01. This story's landing page is a static owner-facing brand placeholder with a CTA — nothing more.

---

## Definition of Done

- [ ] All 11 acceptance criteria pass (verified by tests + manual smoke + green CI)
- [ ] All 11 task groups (T1–T11) checked off
- [ ] `pnpm typecheck && pnpm lint && pnpm test:coverage && pnpm build && pnpm test:e2e && pnpm test:a11y && pnpm exec lhci autorun && pnpm storybook:build` all green locally
- [ ] `pnpm dev` boots; `http://localhost:3000` serves the landing page; Storybook serves at `http://localhost:6006`
- [ ] Coverage ≥ 80% on lines/branches/functions/statements (Vitest report)
- [ ] WCAG 2.1 AA zero violations on `/` and `/login` (axe-core)
- [ ] Lighthouse scores: Perf ≥ 90, A11y ≥ 95, BP ≥ 90, SEO ≥ 90
- [ ] PR opened against `main`; `.github/workflows/admin-ship.yml` is GREEN end-to-end
- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
- [ ] PR description includes: summary, test plan, axe report screenshot, Lighthouse run summary, deliberate-deviations list
- [ ] `docs/stories/README.md` Phase 5 Status Tracker row for E01 marked as "Started: ✅" (may already be set from E01-S01)
- [ ] `admin-web/.github/workflows/ship.yml` deleted; `.github/workflows/admin-ship.yml` present and correct
- [ ] No new `.md` files created beyond this story file and `admin-web/README.md`
- [ ] No paid-SaaS dependencies introduced (verified by grepping against ADR-0007 forbidden list)

---

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent on first edit_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent — capture: any deviation from the plan and why; any deferred sub-task with rationale; CI run URL; Lighthouse summary; axe-core summary; any new pattern not anticipated above (which becomes locked-in for future admin-web stories)._

### File List

_To be filled by dev agent — final list of created/modified files for the PR_

---

## Open Questions for Dev Agent (resolve during brainstorm)

1. **Tailwind v4 theme location** — define tokens in CSS (`@theme { ... }` in `globals.css`) or in TS (`tailwind.config.ts` `theme.extend`)? **Recommendation:** CSS-native for the foundation tokens (lines up with the CSS custom property approach Figma-to-code will generate), but keep `tailwind.config.ts` minimal for content paths + plugins. Confirm in brainstorm.
2. **Test runner for React components** — Vitest with jsdom + Testing Library, OR Vitest with `@vitest/browser` + Playwright? **Recommendation:** jsdom for unit tests, Playwright for e2e/a11y. Don't use `@vitest/browser` in this story (it's still stabilizing).
3. **Theme toggle mechanism** — `next-themes` package, or hand-rolled `useTheme` hook + localStorage? **Recommendation:** hand-rolled for the skeleton (one `useTheme` hook, ~20 lines) to avoid a dep on `next-themes` (it's OSS and small but we want to stay dep-minimal in skeleton stories). Revisit if we hit hydration edge cases.
4. **Landing page copy** — placeholder or real? **Recommendation:** placeholder ("homeservices — owner console" + "Live operations at a glance") pending E01-S05 Figma library. Mark the copy as tokenized for future replacement.
5. **Root layout theme class** — SSR computed or client-only? **Recommendation:** client-only with a `next/script` inline blocking script that reads `localStorage` before hydration to avoid flash. Brainstorm should document the exact script snippet.
6. **Storybook Next.js compatibility** — does `@storybook/nextjs@^8` work with Next 15 + React 19 out of the box, or does it need patches? **Recommendation:** try it, fall back to `@storybook/nextjs@^9-rc` if needed, flag in brainstorm if blocked.
7. **Package.json rename — `homeservices-admin` vs `homeservices-admin-web`?** **Recommendation:** `homeservices-admin` (matches pattern `homeservices-api`, `homeservices-customer`, `homeservices-technician`). Confirm.
