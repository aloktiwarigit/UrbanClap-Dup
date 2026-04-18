# E01-S02 Design — admin-web skeleton + landing page

**Date:** 2026-04-18
**Story:** `docs/stories/E01-S02-admin-web-skeleton-landing-page.md`
**Branch:** `E01-S02-admin-web-skeleton` (local; 1 commit ahead of `main`)
**Status:** brainstorm complete — ready for `/superpowers:writing-plans`

This overlay resolves the seven Open Questions at the bottom of the story and slots ten disaster fixes that a direct read of the baseline (not the story) exposed. The story remains the primary source of truth for acceptance criteria.

Decisions already locked by E01-S01 and not re-debated: workflow at repo-root `.github/workflows/admin-ship.yml`; ancestor-check + scope-diff codex marker gate; OTel deferred; no paid SaaS; Tailwind v4 (not v3); App Router (not Pages); `packageManager: "pnpm@9.15.4"`.

---

## 1. Decisions locked

| # | Question | Decision | Rationale |
|---|---|---|---|
| Q1 | Tailwind v4 theme location | **CSS-native `@theme { ... }` in `app/globals.css`** | Tailwind v4 promotes CSS-native theming; the Figma→code token pipeline (E01-S05) will generate CSS custom properties, not TS objects. One fewer file to keep in sync. `tailwind.config.ts` can be omitted entirely — v4 auto-discovers content; only add it back if a plugin lands. |
| Q2 | React component test runner | **Vitest + jsdom + `@testing-library/react` for unit; Playwright + `@axe-core/playwright` for e2e + a11y** | `@vitest/browser` is still stabilizing (Vitest v2). jsdom + RTL is mature, fast (< 500 ms), well-documented, and survives Node-only CI. Playwright owns real-browser concerns (axe against hydrated DOM). No Storybook–Vitest composition. |
| Q3 | Theme toggle mechanism | **Hand-rolled `useTheme` hook + inline pre-hydration `<script>` — no `next-themes` dep** | Skeleton story; dep-minimal. Exact no-FOUC snippet in §5. Revisit only if hydration edge cases surface. |
| Q4 | Landing page copy | **Placeholder, extracted into `src/content/landing.ts`** | Brand identity unlocked until E01-S05 Figma library; extracting to a content module makes the E01-S05 swap a one-file change instead of a page-tsx diff. |
| Q5 | Root-layout theme pre-hydration | **Inline blocking `<script dangerouslySetInnerHTML>` in `<head>` of `app/layout.tsx`** — literal snippet in §5. **Do NOT use `<Script strategy="beforeInteractive">`** — in App Router RSC rendering, that strategy does not execute before the server-rendered HTML paints, which defeats the purpose. |
| Q6 | Storybook 8 + Next 15 + React 19 | **Pin `@storybook/nextjs@^8.4` (not bare `^8`)** | 8.0–8.3 emit React 19 peer-dep warnings; 8.4 (Nov 2024) officially supports React 19 + Next 15. No need for 9-rc. Fallback if `pnpm install` still throws peers: add narrow `pnpm.overrides` for `react`/`react-dom`. If that also fails, defer Storybook to a follow-up story rather than pulling 9-rc (record as ADR deviation). |
| Q7 | Package rename | **`homeservices-admin`** | Matches sub-project naming pattern `homeservices-<surface>` (api → `homeservices-api`; future customer/technician apps follow). Not `homeservices-admin-web`. |

---

## 2. AC revisions

**AC-3 (Lighthouse budgets) — numeric core-vital assertions dropped.**
The baseline `lighthouserc.js` asserts `first-contentful-paint ≤ 1800ms`, `largest-contentful-paint ≤ 2500ms`, `cumulative-layout-shift ≤ 0.1`, `total-blocking-time ≤ 300ms` **in addition** to the four `categories:*:minScore` thresholds. Two of the four numeric thresholds are stricter than the story's NFR-P-6 (FCP p95 < 3 s, TBT < 200 ms) and one is looser (TBT 300 vs 200). Keeping them duplicates enforcement and makes CI brittle to runner jitter. **Drop the numeric assertions**; rely solely on the four category-score assertions (Performance ≥ 0.9, Accessibility ≥ 0.95, Best-Practices ≥ 0.9, SEO ≥ 0.9). The category scores already bake in a weighted mix of all core vitals. AC-3 wording stays valid; the config simplifies.

**AC-9 (Sentry wiring) — split into the Sentry v8 three-config pattern.**
Current baseline `src/instrumentation.ts` is a single-file inline init that reads `NEXT_PUBLIC_SENTRY_DSN` even for the server runtime — wrong (server should read `SENTRY_DSN`; client reads `NEXT_PUBLIC_*`). Rewrite to:

- `src/instrumentation.ts` — `register()` that branches on `process.env.NEXT_RUNTIME` and dynamically imports `./sentry.server.config` or `./sentry.edge.config`. No Sentry calls here directly.
- `src/sentry.server.config.ts` — reads `SENTRY_DSN`; early-return if unset; else `Sentry.init({ dsn, tracesSampleRate: 0.1 })`.
- `src/sentry.edge.config.ts` — identical pattern, edge-safe imports, reads `SENTRY_DSN`.
- `src/sentry.client.config.ts` — reads `NEXT_PUBLIC_SENTRY_DSN`; same shape. Called from the root layout via a tiny `"use client"` bootstrap component OR left to Sentry's auto-import (verify during plan — v8 manual wiring doesn't auto-detect; use an explicit client bootstrap to keep behaviour predictable).

All four files have a top-level `// TODO(E01-Sxx observability): wire OpenTelemetry once exporter is chosen` comment mirroring api/ `bootstrap.ts`. `@opentelemetry/api` and `@opentelemetry/sdk-node` removed from `package.json` — same rationale as E01-S01 Q4.

**AC-10 (.env.example) — align to baseline naming + drop OTel/source-map vars.**
Story AC-10 lists `GROWTHBOOK_CLIENT_KEY=` but the baseline file uses `NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY=` (correct per Next's public-env convention — GrowthBook runs client-side). Final `.env.example` keys: `SENTRY_DSN=`, `NEXT_PUBLIC_SENTRY_DSN=`, `NEXT_PUBLIC_POSTHOG_KEY=`, `NEXT_PUBLIC_POSTHOG_HOST=`, `NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY=`, `NEXT_PUBLIC_GROWTHBOOK_API_HOST=`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`. Drop `OTEL_*` (deferred), `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` (only needed for source-map upload — re-added by the future deploy story).

---

## 3. Disaster fixes (10 items → task slots)

| # | Gap | Fix | Lands in |
|---|---|---|---|
| N1 | `admin-web/docs/`, `admin-web/plans/`, `admin-web/specs/` exist as leftover template dirs shadowing root `docs/` — `admin-web/docs/` even contains stub `runbook.md`, `threat-model.md`, `adr/`, `stories/` that duplicate project-scoped docs | Delete all three empty/stub dirs; per root CLAUDE.md, sub-project ADRs live under the sub-project only once real sub-project-scoped decisions emerge. | **T1.6** (new) |
| N2 | App Router location split: baseline has empty `admin-web/src/app/`; story source-tree shows top-level `admin-web/app/`. Mixing is wrong. | **Pick top-level `admin-web/app/`.** `tsconfig.json` alias `@/*` → `./src/*` keeps non-route components in `src/components/`, `src/lib/`, `src/content/`. Delete the empty `src/app/`. | **T5.0** (new), **T1.7** (new) |
| N3 | No `next.config.ts` in baseline — AC-9 + AC-10 + T5.3 all implicitly assume it exists for the `NEXT_PUBLIC_GIT_SHA` / `NEXT_PUBLIC_APP_VERSION` env injection + `reactStrictMode` + typed routes. | Create `admin-web/next.config.ts` with `env: { NEXT_PUBLIC_GIT_SHA: process.env.NEXT_PUBLIC_GIT_SHA ?? '', NEXT_PUBLIC_APP_VERSION: pkg.version }`, `reactStrictMode: true`, `experimental: { typedRoutes: true }`. Read `pkg.version` via ESM `import pkg from './package.json' assert { type: 'json' }` (node 22 supports). | **T5.0** (new — before T5.3) |
| N4 | `vitest.config.ts`, `playwright.config.ts`, `postcss.config.mjs`, `eslint.config.mjs` all missing — story tasks say "VERIFY" in places where the correct verb is CREATE. | Re-label: T3.1 CREATE `eslint.config.mjs`; T4.2 CREATE `postcss.config.mjs`; T7.1 CREATE `vitest.config.ts`; T7.2 CREATE `playwright.config.ts` (not VERIFY). | **T3/T4/T7** (labels) |
| N5 | `instrumentation.ts` reads `NEXT_PUBLIC_SENTRY_DSN` for server — wrong var scope — and handles edge/node inline rather than via Sentry's canonical three-config pattern. | See §2 AC-9 revision. | **T6.2** (revised), **T6.4** (new edge config file) |
| N6 | `husky` `prepare` script in `admin-web/package.json` — `api/package.json` dropped husky (E01-S01 merged without it, CI went green). Keeping husky in admin-web creates a CI failure risk when `pnpm install --frozen-lockfile` tries to install hooks on a monorepo subpath. | Remove `"prepare": "husky"` and `husky` devDep from `admin-web/package.json`. Local git hooks are the concern of `.husky/` at repo root (managed in a separate tooling story). | **T1.1** (extend) |
| N7 | Root `.gitignore` has no `admin-web/` block — `admin-web/.gitignore` covers local dev but root takes precedence for future CI paths and for any contributor running a root-level `git status`. | Add `# admin-web/` block to root `.gitignore` covering `admin-web/.next/`, `admin-web/coverage/`, `admin-web/storybook-static/`, `admin-web/node_modules/`, `admin-web/.env.local`, `admin-web/playwright-report/`, `admin-web/test-results/`, `admin-web/.lighthouseci/`. | **T1.5** (extend) |
| N8 | Lighthouse numeric assertions duplicate/contradict AC-3. | See §2 AC-3 revision; drop numeric assertions. | **T9.1** (revised) |
| N9 | `@storybook/nextjs` pin `^8` allows 8.0–8.3 which throws React 19 peer warnings → could block `pnpm install --frozen-lockfile` in CI. | Tighten to `^8.4`. Add peer-range override only if `pnpm install` still errors (document in README `## Known Issues` block). | **T8.0** (new — dep bump + smoke install before T8.1) |
| N10 | `admin-web/.github/` directory (workflow moved in T10.1 via `git mv`) — make sure the `git mv` removes it entirely, not just the file inside. On Windows `git mv` may leave an empty dir behind; follow with `rmdir admin-web/.github/workflows && rmdir admin-web/.github` if needed. | Explicit cleanup step after `git mv`. | **T10.7** (extend) |

**Net task-list delta:** five new sub-tasks (T1.6, T1.7, T5.0, T6.4, T8.0); three revisions (T6.2, T9.1, T10.7); four label flips (T3.1, T4.2, T7.1, T7.2 — VERIFY → CREATE); three small extensions (T1.1, T1.5, T10.7). No new top-level tasks.

---

## 4. Source-tree delta from story §Source Tree Components to Touch

**Add to planned creation:**
- `admin-web/next.config.ts` (N3)
- `admin-web/src/sentry.edge.config.ts` (N5 — third Sentry config file, beyond story's `sentry.client.config.ts` + `sentry.server.config.ts`)
- `admin-web/src/content/landing.ts` (Q4 — extracted copy module)

**Remove from planned creation (obsolete):**
- `admin-web/src/styles/tokens.css` — merged into `app/globals.css` via `@theme { ... }` (Q1).

**Delete (template residue, N1/N2):**
- `admin-web/docs/`, `admin-web/plans/`, `admin-web/specs/`, `admin-web/src/app/` (empty), `admin-web/.github/` (after `git mv`).

**Reaffirm VERIFY → CREATE relabelling (N4):**
- `vitest.config.ts`, `playwright.config.ts`, `postcss.config.mjs`, `eslint.config.mjs` all CREATE.

Other source-tree entries in the story §Source Tree block are unchanged.

---

## 5. Pre-hydration theme snippet (Q5 literal)

Goes in `<head>` of `app/layout.tsx`, before any CSS link / script:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){try{var t=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&m))document.documentElement.classList.add('dark');}catch(e){}})();`,
  }}
/>
```

Rules: single-line IIFE (minimised — keep < 400 chars); no ESM; `try/catch` around `localStorage` (Safari private mode throws); runs before React hydration; `class="dark"` is the only DOM mutation. Paired with `useTheme` hook in `src/lib/useTheme.ts` for the in-app toggle.

---

## 6. Test plan clarifications

- `tests/landing.page.test.tsx` (Vitest + RTL, jsdom) asserts brand + tagline + CTA `<Link>` + footer build-info text. Uses semantic queries (`getByRole`, `getByText`). **No snapshot tests.**
- `tests/e2e/landing.spec.ts` (Playwright, Chromium) — happy path (load `/`, click CTA, land on `/login`, assert 501 placeholder text).
- `tests/a11y/landing.a11y.spec.ts` (Playwright + axe) — scans `/` **and** `/login` for WCAG 2.1 AA violations. axe runs after full hydration (default `@axe-core/playwright` behaviour) — this matches the human-perceived a11y floor, not the raw HTML.
- `tests/sentry-init.test.ts` — three paths: server DSN unset (no init); server DSN set (init once, `tracesSampleRate: 0.1`); client DSN unset (no init). Mocks `@sentry/nextjs`. Edge config path tested by a fourth case if `@vitest/environment: 'edge-runtime'` is wired — else deferred to observability story.
- `tests/tokens.test.tsx` — assert `getComputedStyle(document.documentElement).getPropertyValue('--color-brand')` returns a non-empty value after rendering `<html>` with `globals.css` imported. Guards against a refactor that silently drops the `@theme` block.
- Coverage exclusions (vitest.config.ts): `src/sentry.*.config.ts`, `src/instrumentation.ts`, `**/*.stories.tsx`, `**/*.config.*`, `app/layout.tsx` only if it becomes a pure imports-only file. **Do not exclude** `app/page.tsx`, `app/login/page.tsx`, `src/components/**`, `src/lib/**`.

---

## 7. Explicitly out of scope (deferred to later stories)

- OpenTelemetry auto-instrumentation + exporter choice → future observability story.
- Dark-mode theming across all components → E01-S04 (theming groundwork only in this story — tokens + toggle hook + pre-hydration snippet).
- Figma→code token sync → E01-S05.
- Login (real owner sign-in) → E02-S04. This story ships only the 501 stub.
- Live Ops Dashboard or any data-driven page → E09-S01+.
- Chromatic or any paid visual-regression SaaS → evaluated once components > ~20.
- Deploy to Azure Static Web Apps → dedicated deploy story.
- Source-map upload to Sentry → deploy story (env vars added back then).
- Storybook–Vitest story-level composition testing → follow-up once Storybook 9 lands or CSF3-test matures.

---

## 8. Risk register (known, accepted)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Storybook 8.4 still peer-warns on React 19.1+ | M | L | `pnpm.overrides` or defer Storybook AC-5 to a follow-up ADR-logged deviation |
| Playwright Chromium download adds 3–5 min to CI | H | L | Use `pnpm exec playwright install --with-deps chromium` caching via `actions/cache` on `~/.cache/ms-playwright` — implement if CI time > 15 min |
| Lighthouse CI flakiness on GitHub-hosted runners | M | M (flaky red) | `numberOfRuns: 3` already set; category-score thresholds (not numeric) tolerate jitter; budget is ≥ 0.9 not 0.95 |
| Tailwind v4 `@theme` + Next 15 `app/globals.css` order bug | L | M | Smoke-check `pnpm dev` + `pnpm build` locally before pushing the tokens commit |
| `typedRoutes` experimental flag churn | L | L | Pin Next minor if broken; typed-routes is ergonomic not load-bearing |
| `next.config.ts` import assertion for JSON not yet stable | L | L | Fallback to `const pkg = require('./package.json')` via `createRequire` if the assertion syntax errors |

---

## 9. Definition of "plan-ready"

- Resolves the 7 open questions in the story — ✅
- Revises AC-3 (Lighthouse numeric drop), AC-9 (three-file Sentry pattern), AC-10 (env keys) with explicit rationale — ✅
- Slots 10 disaster fixes into named task slots — ✅
- Lists explicit out-of-scope items — ✅
- Target commit count for implementation (mirrors E01-S01 cadence): 10–14 TDD-ordered commits.
- Committed to git — _pending_

---

## 10. Next step

Fresh session → `/superpowers:writing-plans`

