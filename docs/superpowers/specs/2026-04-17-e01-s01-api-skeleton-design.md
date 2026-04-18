# E01-S01 Design — API skeleton + `/v1/health`

**Date:** 2026-04-17
**Story:** `docs/stories/E01-S01-api-skeleton-health-endpoint.md`
**Status:** brainstorm complete — ready for `/superpowers:writing-plans`

This document captures decisions made during brainstorming that adjust or extend the published story spec. The story spec remains the primary source of truth for acceptance criteria; this doc overlays design-level decisions and disaster fixes that must flow into the implementation plan.

---

## 1. Decisions locked

| # | Question | Decision | Rationale |
|---|---|---|---|
| Q1 | Azure Functions Core Tools install path | **devDep** (`"azure-functions-core-tools": "^4"` in `devDependencies`) | Hermetic setup: `pnpm install` → `pnpm dev` works with no side-channel. Lockfile pins version. Scripts: `"dev": "func start"` (uses devDep binary via pnpm shim), `"dev:direct": "func start"` (documented as a PATH-based fallback when the npm install fails on Windows — user installs `winget install Microsoft.AzureFunctionsCoreTools` and runs the same command from a shell where `func` resolves from PATH, not node_modules). Both scripts invoke the same command; the distinction is pedagogical and lives in the README. |
| Q2 | Build tool | **`tsc --build`**, remove `tsup` entirely | Functions v4 expects file-per-function layout; tsc gives it for free. Cleaner source maps for Sentry. Avoids bundler interactions with native-introspecting deps. |
| Q3 | `/v1/health` route prefix | **Keep default `/api/`** → URL is `/api/v1/health` | SWA convention; trivial gateway rewrite if ever undesired; one less non-default `host.json` setting to maintain. AC-1 wording already reflects this. |
| Q4 | AC-7 observability shape | **Keep Sentry + bootstrap pattern. Defer OTel entirely.** | `@opentelemetry/auto-instrumentations-node` is NOT a clean no-op — it monkey-patches http/fs/dns/pg/etc. and produces spans in memory even without an exporter. Claim of "safe no-op" is factually wrong. Sentry v8 IS a clean no-op when DSN unset. Defer OTel to a dedicated observability story where exporter choice is made (Azure Monitor vs OTLP/Grafana vs Axiom). |
| Q5 | Scope of the 8 disasters | **All 8 fixed in this story** | They're all small, and this is the foundation story — every one becomes 30× expensive to retrofit later. |

---

## 2. AC-7 revision (from story)

**Was:** "Sentry + OpenTelemetry are imported and initialized but in safe no-op mode by default."

**Now:**

> **AC-7 · Sentry is initialized with early-return when DSN is unset; `bootstrap.ts` is the single observability entry point for all future handlers.**
>
> - **Given** the function app starts **and** `SENTRY_DSN` env var is **not** set
> - **Then** `initSentry()` returns without calling `Sentry.init()`; `Sentry.isInitialized()` is `false`; no network calls occur.
> - **Given** `SENTRY_DSN` is set
> - **Then** `Sentry.init({ dsn, tracesSampleRate: 0.1 })` is called exactly once (verified in `tests/observability.test.ts` via SDK mock).
> - **And** `src/bootstrap.ts` is imported at the top of every function file in `src/functions/`. It is the only sanctioned place for observability initialization.
> - **And** `src/bootstrap.ts` contains a TODO comment referencing the future OTel story (placeholder: `// TODO(E01-Sxx): wire OpenTelemetry tracing once exporter is chosen`).
> - **(NFR-O-2 traceability. NFR-O-6 deferred to the OTel story.)**

**Dependency changes from story §Library/Framework Requirements:**

| Package | Story says | Design decision |
|---|---|---|
| `@sentry/node@^8` | Add | **Add** (unchanged) |
| `@opentelemetry/api@^1` | Add | **Do not add in this story** |
| `@opentelemetry/auto-instrumentations-node@^0.50` | Add | **Do not add in this story** |

Saves ~15 MB of transitive deps + one correctness concern + one future rework cycle.

---

## 3. Disaster fixes (8 items → which task they fold into)

| # | Gap | Fix | Lands in |
|---|---|---|---|
| D1 | `tsconfig.json` missing `outDir` / `rootDir` / `include` — would emit `dist/tests/*.js` and misalign with Functions layout | Add `"outDir": "./dist"`, `"rootDir": "./src"`, `"include": ["src/**/*"]` to `tsconfig.json`. Add `tsconfig.tests.json` (extends base, adds `"include": ["src/**/*", "tests/**/*"]`, `"noEmit": true`) used by Vitest and `pnpm typecheck`. | **T2.1** (extend AC-4 compiler-options list) |
| D2 | `package.json` `main` field not specified — `func start` would find zero functions | Set `"main": "dist/src/functions/*.js"` in `api/package.json`. | **T3.4** (explicit sub-task) |
| D3 | `GIT_SHA` not wired in CI — deployed `/v1/health` would always show `"dev"` | Set `env: { GIT_SHA: ${{ github.sha }} }` on the `quality-gate` job in `ship.yml` so any future deploy job inherits it. Local dev remains `"dev"` default per AC-2. | **T8** (new sub-task T8.6) |
| D4 | `ship.yml` codex-marker step is a warning, not an error — contradicts CLAUDE.md "CI is the real gate" | Change `echo "::warning::…"` to `echo "::error::…"; exit 1` on missing/mismatched `.codex-review-passed`. | **T8** (extend T8.4) |
| D5 | NodeNext ESM `.js` import-extension gotcha — `import { parseBody } from "./shared/zod.js"` required even though source is `.ts` | Add a §Conventions block to `api/README.md` calling this out. Also add one example import in a code block. | **T1.2** (extend README contents list) |
| D6 | Sentry v8 ↔ OTel interaction complexity | **Resolved by Q4** — OTel deferred; Sentry owns its own instrumentation. No action needed in this story. | n/a |
| D7 | `pnpm audit --audit-level=high \|\| true` swallows failures | Accept for the skeleton (near-zero deps). Document a follow-up in a new story or tech-debt list (`docs/stories/README.md` §E01 notes section). | **T8** (doc note, no workflow change) |
| D8 | `.nvmrc` missing | Add `api/.nvmrc` containing `22`. | **T1** (new sub-task T1.3) |

**Net task-list delta:** three sub-tasks added (T1.3, T3.4 extended, T8.6), three sub-tasks extended (T2.1, T1.2, T8.4). No new top-level tasks.

---

## 4. Source-tree delta from story §Source Tree Components to Touch

**Remove from planned creation:**
- `src/observability/otel.ts` — **deferred**

**Add to planned creation:**
- `tsconfig.tests.json` — separate tsconfig for tests with `noEmit`
- `.nvmrc` — contains `22`

**Keep as story specified:**
- `src/bootstrap.ts` (Sentry-only + TODO for OTel)
- `src/observability/sentry.ts`
- `tests/observability.test.ts` (Sentry init paths only)

**Revised file count:** 3 source files + 1 schema + 2 observability files (→ 1) + 4 test files + 8 config/meta files.

---

## 5. Test plan (minor clarifications)

- `tests/observability.test.ts` covers **Sentry only**, two paths: unset DSN (no init, `Sentry.isInitialized()` false), set DSN (init called once). Mocks `@sentry/node` to verify call count.
- `tests/health.test.ts` invokes the exported handler directly with a fabricated `HttpRequest` — **does not spawn `func start`**. `func start` is a manual smoke test for AC-1, captured in the PR description per T5.4.
- Coverage exclusion list (vitest.config.ts) drops `src/observability/otel.ts` (no longer exists). Still excludes `src/bootstrap.ts` and `**/*.config.*`.
- **Do not exclude `src/observability/sentry.ts`** from coverage — it's 10 lines, trivial to cover at 100%, and discipline matters.

---

## 6. Explicitly out of scope (deferred to later stories)

- OpenTelemetry auto-instrumentation + exporter choice → future observability story (to be scheduled in E01 or E07).
- Deep health endpoint (`/v1/health/deep` with Cosmos / FCM / Razorpay pings) → separate story.
- `pnpm audit` made gating (remove `|| true`) → tech-debt story once dep count > ~30.
- `@h4ad/serverless-adapter` Fastify-on-Functions wrapping → per-endpoint decision when first non-trivial Fastify hook is needed.
- Stamping `GIT_SHA` into the deployed Functions app environment → deploy story (this design only wires it in CI env so downstream jobs inherit it).

---

## 7. Risk register (known, accepted)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `azure-functions-core-tools` npm install fails on Windows | M | M (blocks dev loop) | README documents winget fallback + `pnpm dev:direct` script reading from PATH |
| ESLint type-checked rules slow down lint as codebase grows | M | L (~5–10 s at 30 files) | Accept for now; revisit if `pnpm lint` > 30 s |
| `@sentry/node` v8 API changes in minor bump | L | L | Pin minor in package.json; CI catches breakage |
| Future dev agent forgets `.js` extension in NodeNext imports | H | L (fast compile error) | README §Conventions + CLAUDE.md reference |

---

## 8. Definition of "plan-ready"

Before handing off to `/superpowers:writing-plans`, this design:

- Resolves the 3 open questions in the story — ✅
- Revises AC-7 with explicit rationale — ✅
- Incorporates 8 disaster fixes into named task slots — ✅
- Lists explicit out-of-scope items — ✅
- Is committed to git — _pending_

---

## 9. Next step

Invoke `/superpowers:writing-plans` with this design + the story spec. Commit the plan to `plans/E01-S01.md`. Then fresh session → `/superpowers:executing-plans` (TDD).
