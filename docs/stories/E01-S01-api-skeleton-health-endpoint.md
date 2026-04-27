# Story E01.S01: API skeleton — Fastify + Zod + Azure Functions local dev + `/v1/health` + green CI

Status: merged

> **Epic:** E01 — Foundations, CI & Design System (`docs/stories/README.md` §E01)
> **Sprint:** S1 (wk 1–2) · **Estimated:** ≤ 1 dev-day · **Priority:** **P0 / blocks all other api/ stories**
> **Sub-project:** `api/`

---

## Story

As the **solo founder-operator (Alok)** building homeservices-mvp on Claude Max + Codex,
I want the `api/` sub-project to be a runnable Node 22 + TypeScript + Azure Functions skeleton with a `/v1/health` endpoint, Zod validation wired in, and `ship.yml` CI green on a PR,
so that **every subsequent backend story (auth, bookings, dispatch, payments, webhooks, timers) starts from a stable, conventionally-shaped, lint-clean, test-covered, BMAD-gated baseline — not a blank `src/` directory.**

This story turns the placeholder agency-baseline scaffold (`api/package.json` name `client-baseline-node`, empty `src/`, ship.yml that wrongly provisions Postgres) into the canonical homeservices-mvp API skeleton aligned with **ADR-0001** (Node 22 + Fastify + Zod), **ADR-0004** (Azure Functions Consumption), and **ADR-0007** (zero paid SaaS).

---

## Acceptance Criteria

> **All acceptance criteria are BDD-formatted (Given/When/Then) and verified by automated tests in `api/tests/` plus the CI ship.yml run.**

### AC-1 · Local Azure Functions runtime starts and serves the health endpoint
- **Given** a developer at `api/` runs `pnpm install && pnpm dev` (where `pnpm dev` invokes `func start`)
- **Then** Azure Functions Core Tools v4 boots without error inside ≤ 15 s
- **And** `curl http://localhost:7071/api/v1/health` returns HTTP **200**
- **And** the response body matches the Zod schema `HealthResponseSchema` (see §Technical Requirements)
- **And** `Content-Type: application/json; charset=utf-8`
- **And** the response time is < 100 ms after warm-up

### AC-2 · Health response shape is contract-tested
- **Given** the running function app
- **When** `GET /api/v1/health` is called
- **Then** the response JSON has exactly these keys: `status` (`"ok"`), `version` (semver string from `package.json`), `commit` (8-char short SHA from `process.env.GIT_SHA` or `"dev"` locally), `timestamp` (ISO-8601 UTC), `uptimeSeconds` (number ≥ 0)
- **And** `tests/health.test.ts` asserts the response parses cleanly via `HealthResponseSchema.parse()` (Zod)
- **And** unknown extra keys cause the test to fail (Zod `.strict()` mode)

### AC-3 · Input validation pattern proven via Zod (even though `/health` takes no input)
- **Given** the codebase
- **When** the test `tests/zod-pattern.test.ts` runs
- **Then** it round-trips a sample request body through `parseBody(schema, raw)` (a shared helper at `src/shared/zod.ts`) and confirms (a) valid input parses, (b) invalid input throws `ZodError` with structured `issues`, (c) the helper converts `ZodError` to a 400 JSON response of shape `{ error: "ValidationError", issues: [...] }`
- **And** this helper is the **only** sanctioned input-validation entry point for all future endpoints — all subsequent stories MUST use it (documented in §Patterns to Reuse)

### AC-4 · TypeScript `strict: true` and ESLint zero-warnings policy
- **Given** the codebase
- **When** `pnpm typecheck` runs
- **Then** it exits 0 with `tsc --noEmit` against a `tsconfig.json` whose `compilerOptions` includes `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`, `"target": "ES2022"`, `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`
- **And** `pnpm lint` exits 0 with **zero warnings** (`--max-warnings 0`) using flat ESLint config (`eslint.config.mjs`) extending `@typescript-eslint/recommended-type-checked` and `eslint-plugin-import`
- **(NFR-M-5 enforcement)**

### AC-5 · Vitest passes ≥ 80% coverage on the skeleton
- **Given** the codebase
- **When** `pnpm test:coverage` runs
- **Then** Vitest exits 0 with coverage thresholds in `vitest.config.ts`: lines ≥ 80%, branches ≥ 80%, functions ≥ 80%, statements ≥ 80%
- **And** the coverage report is written to `api/coverage/`
- **And** at least these test files exist and pass: `tests/health.test.ts`, `tests/zod-pattern.test.ts`, `tests/version.test.ts`
- **(NFR-M-4 enforcement)**

### AC-6 · `ship.yml` CI is green on a PR to `main`
- **Given** a PR is opened from this story's feature branch to `main`
- **When** GitHub Actions runs `api/.github/workflows/ship.yml`
- **Then** every step passes: BMAD artifacts gate, `pnpm typecheck`, `pnpm lint`, `pnpm test:coverage`, `pnpm audit --audit-level=high || true`, Semgrep SAST (`p/typescript p/owasp-top-ten p/nodejs p/secrets`)
- **And** the ship.yml is **trimmed of irrelevant baseline scaffolding**: the Postgres `services:` block is removed (we use Cosmos DB Serverless per ADR-0003 — there is no Postgres in this stack)
- **And** the codex-review-marker step is preserved (per CLAUDE.md authoritative-cross-model-review policy)
- **And** the BMAD-gate step looks for `docs/prd.md`, `docs/architecture.md`, `docs/threat-model.md`, `docs/runbook.md`, `.bmad-readiness-passed` — all of which already exist as of commit `c360120`

### AC-7 · Sentry + OpenTelemetry are imported and initialized but in safe no-op mode by default
- **Given** the function app starts
- **And** `SENTRY_DSN` env var is **not** set (default for local dev + CI)
- **Then** Sentry SDK initialization is a no-op (no errors, no network calls)
- **And** OpenTelemetry auto-instrumentation is loaded but exports to a `NoopSpanProcessor` when `OTEL_EXPORTER_OTLP_ENDPOINT` is not set
- **Given** in production both env vars **are** set
- **Then** Sentry captures errors and OTel exports spans to App Insights — wired but **not exercised** in this story (full validation in a later story; this story only proves the imports compile and don't crash on import)
- **(NFR-O-2, NFR-O-6 — instrumentation is in place from day one)**

### AC-8 · Project rename and metadata
- **Given** `api/package.json`
- **Then** the `name` field is `"homeservices-api"` (replacing the placeholder `"client-baseline-node"`)
- **And** `version` is `"0.1.0"`
- **And** the `engines` field requires `"node": ">=22.0.0"` and `"pnpm": ">=9.0.0"`
- **And** `api/README.md` exists with: 5-line project description, "Quick start" (`pnpm install`, `pnpm dev`), "Test" (`pnpm test:coverage`), "Deploy" (`pnpm build` — placeholder), and a link to `docs/architecture.md` §6 + ADR-0001 + ADR-0004

### AC-9 · `local.settings.json` template + secret hygiene
- **Given** the repository
- **Then** `api/local.settings.json` is **gitignored** (already in root `.gitignore`; verify and add if missing under the `api/` section)
- **And** `api/local.settings.example.json` is committed with `FUNCTIONS_WORKER_RUNTIME=node`, `AzureWebJobsStorage="UseDevelopmentStorage=true"`, and **no** real secrets
- **And** Semgrep `p/secrets` does not flag any committed file
- **(NFR-S-9: secrets never in code, only Key Vault in production)**

### AC-10 · Zero paid SaaS dependencies introduced
- **Given** the new `api/package.json` and `api/pnpm-lock.yaml`
- **Then** every dependency added in this story is on the **approved free-tier list** at `docs/adr/0007-zero-paid-saas-constraint.md` §"Known free-tier dependencies"
- **And** the dependency list is documented in §Library/Framework Requirements below
- **And** no SDK from the prohibited list is present (LaunchDarkly, Segment, Datadog, New Relic, paid CodeRabbit, paid Figma, etc.)

---

## Tasks / Subtasks

> **TDD discipline (per CLAUDE.md):** for each task that introduces production code, write the failing test first, then make it pass, then refactor. Sub-tasks are ordered for that.

- [x] **T1 — Rename + metadata** (AC-8)
  - [x] T1.1 Rename `api/package.json` `name` to `"homeservices-api"`, set version `0.1.0`, add `engines`
  - [x] T1.2 Add `api/README.md` with the sections in AC-8

- [x] **T2 — TypeScript + ESLint config (strict)** (AC-4)
  - [x] T2.1 Add `api/tsconfig.json` with the compiler options listed in AC-4
  - [x] T2.2 Add `api/eslint.config.mjs` (flat config) extending `@typescript-eslint/recommended-type-checked` + `eslint-plugin-import`; `--max-warnings 0`
  - [x] T2.3 Add `api/.editorconfig` (2 spaces, LF, UTF-8, trim trailing ws)
  - [x] T2.4 Add `api/.prettierrc.json` (single-quote, no-semi false, print-width 100, trailing-comma `all`)

- [x] **T3 — Azure Functions runtime + host config** (AC-1, AC-9)
  - [x] T3.1 Add `api/host.json` (v2.0 schema, Functions runtime v4, `extensionBundle` v4.x, `logging.applicationInsights.samplingSettings.isEnabled: true`)
  - [x] T3.2 Add `api/local.settings.example.json` per AC-9
  - [x] T3.3 Verify `api/local.settings.json` is gitignored (root `.gitignore`); add `api/local.settings.json` and `api/.azure/` entries under an explicit `# api/` section if not present
  - [x] T3.4 Add `@azure/functions@^4` to dependencies; remove `tsup`-only build that doesn't emit Functions output, replace with `tsc --build` producing `dist/` matching Functions v4 layout

- [x] **T4 — Shared Zod helper + version util** (AC-3, AC-5)
  - [x] T4.1 (RED) Write `tests/zod-pattern.test.ts` covering: valid parse, ZodError on invalid, error-to-HTTP conversion shape `{ error: "ValidationError", issues: [...] }`
  - [x] T4.2 (GREEN) Implement `src/shared/zod.ts` exporting `parseBody<T>(schema, raw): T` and `zodErrorToHttp(err: ZodError): { status: 400, body: {...} }`
  - [x] T4.3 (RED) Write `tests/version.test.ts` asserting `getVersionInfo()` returns `{version, commit}` from `package.json` + `process.env.GIT_SHA` (defaulting to `"dev"`)
  - [x] T4.4 (GREEN) Implement `src/shared/version.ts`

- [x] **T5 — `/v1/health` endpoint** (AC-1, AC-2)
  - [x] T5.1 Add `src/schemas/health.ts` exporting `HealthResponseSchema` (Zod, `.strict()`) per AC-2
  - [x] T5.2 (RED) Write `tests/health.test.ts` using `@azure/functions` test helpers OR the recommended `azure-functions-handler-tester` pattern (or directly invoke the handler function with a fabricated `HttpRequest`). Assert status 200, JSON content-type, schema-valid body, all required keys present.
  - [x] T5.3 (GREEN) Implement `src/functions/health.ts` registering an HTTP trigger via Azure Functions v4 programming model (`app.http("health", { methods: ["GET"], route: "v1/health", authLevel: "anonymous", handler: ... })`)
  - [x] T5.4 Verify locally: `pnpm dev` boots, `curl localhost:7071/api/v1/health` returns expected JSON
  - [x] T5.5 Confirm < 100 ms warm response (informal benchmark; capture in PR description; not a CI gate)

- [x] **T6 — Sentry + OTel safe no-op init** (AC-7)
  - [x] T6.1 Add `src/observability/sentry.ts` — `initSentry()` early-returns if `SENTRY_DSN` is unset; otherwise calls `Sentry.init({ dsn, tracesSampleRate: 0.1 })`
  - [x] T6.2 Add `src/observability/otel.ts` — `initOtel()` early-returns if `OTEL_EXPORTER_OTLP_ENDPOINT` is unset; otherwise registers auto-instrumentations + OTLP exporter
  - [x] T6.3 Wire both in a `src/bootstrap.ts` imported at the top of every function file (single import, no per-handler boilerplate)
  - [x] T6.4 Test (`tests/observability.test.ts`): no env vars → init returns without throwing AND no Sentry/OTel network calls happen (mock the SDKs or assert `Sentry.isInitialized() === false`)

- [x] **T7 — Vitest config + coverage thresholds** (AC-5)
  - [x] T7.1 Add `api/vitest.config.ts` with `coverage: { provider: "v8", thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 }, exclude: ["**/*.config.*", "src/bootstrap.ts", "src/observability/**", "tests/**"] }`
  - [x] T7.2 Confirm `pnpm test:coverage` passes locally with all thresholds met
  - [x] T7.3 Add `coverage/` to `.gitignore` if not already

- [x] **T8 — Fix `ship.yml`** (AC-6)
  - [x] T8.1 Remove the `services: postgres:` block in `api/.github/workflows/ship.yml` (we use Cosmos per ADR-0003)
  - [x] T8.2 Verify the BMAD-gate step paths resolve from the **repo root** (not from `api/`); if the workflow is triggered with `paths: [api/**]` filter, ensure `working-directory: api` is set for `pnpm install/typecheck/lint/test` while the BMAD-gate `test -f` lookups continue to use root-relative paths
  - [x] T8.3 Add `paths` filter on `pull_request` and `push` so the api workflow only runs when `api/**` or this workflow file changes (avoid wasted CI minutes on customer-app/admin-web/technician-app changes)
  - [x] T8.4 Confirm Semgrep step uses `p/typescript p/owasp-top-ten p/nodejs p/secrets` (already correct in baseline; just verify)
  - [x] T8.5 Push branch + open draft PR to confirm CI is green; iterate until all steps pass

- [x] **T9 — Pre-push 5-layer review gate** (per CLAUDE.md §Per-Story Protocol)
  - [x] T9.1 `/code-review` (cheap lint pass — Claude)
  - [x] T9.2 `/security-review`
  - [x] T9.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
  - [x] T9.4 `/bmad-code-review` (Blind Hunter + Edge Case Hunter + Acceptance Auditor)
  - [x] T9.5 `/superpowers:requesting-code-review`
  - [x] T9.6 Only after all 5 layers, `git push`

---

## Dev Notes

### Story Foundation Context

This is the **first story of the entire backend** and the entry point for sprint S1. It has zero upstream story dependencies (no previous-story file to load). The phase gate (BMAD readiness, marker `.bmad-readiness-passed` committed at `c360120`) is satisfied — `src/` edits are now allowed.

**Why this matters strategically (per architecture §2 Boring-Technology Manifesto):** every choice in this story locks in a pattern the next 30+ backend stories will follow. Get the skeleton wrong (e.g., wrong validation library, wrong Functions programming model version, missing observability) and we pay for it in every subsequent story. Get it right and the next 30 stories are fast.

### Critical Architectural Constraints (READ BEFORE CODING)

| Constraint | Source | Story-level implication |
|---|---|---|
| **Node 22 LTS only** | ADR-0001, NFR-M-5 | `engines.node >= 22`, CI uses `actions/setup-node@v4` with `node-version: 22` (already set) |
| **TypeScript `strict: true` + `-Werror` equivalent** | NFR-M-5, root CLAUDE.md | `tsconfig.json` enables strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes; ESLint `--max-warnings 0` |
| **Azure Functions Consumption (no App Service)** | ADR-0004 | Use `@azure/functions@^4` programming model. `host.json` v2.0. No long-running background tasks (60s exec limit). |
| **Cosmos DB is the SoR (no Postgres, no MySQL)** | ADR-0003 | Remove the Postgres service from ship.yml. No `pg`, `prisma`, `drizzle`, or `mongodb` packages. |
| **Zero paid SaaS** | ADR-0007 | Every dep must be on the approved free-tier list (§Library/Framework Requirements). Adding a paid dep needs a new ADR + owner approval. |
| **DPDP — India data residency** | NFR-C-3 | Not directly testable in this story, but `host.json` and any region-bound config must be neutral; deployment story will pin to Azure India Central. |
| **Stateless functions only** | ADR-0004 §Negative | No global mutable state; no in-process caches; all state in Cosmos / Storage / Key Vault. The `/health` handler is trivially stateless. |
| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` marker keyed to commit SHA. Pre-push hook in `api/.claude/settings.json` enforces this. |

### Why Azure Functions v4 Programming Model (not v3)

Azure Functions Node v4 programming model (GA late 2023) is the current standard:
- Single `app.http(...)` registration replaces v3's `function.json` files (less yaml, fewer mistakes)
- TypeScript-native types for `HttpRequest` / `HttpResponseInit`
- Cleaner DI for shared helpers (zod parser, observability bootstrap)
- Forward-compatible with Functions runtime v4 GA

Reference: `@azure/functions@^4` package; documentation under "Azure Functions Node.js v4 programming model".

### Why Fastify is Listed in Architecture but Not Used in `/health`

Architecture §2 lists Fastify as the API framework. **In practice with Azure Functions Consumption**, the deployment unit is an Azure Function (HTTP trigger), not a long-running Fastify server. The story description says "Fastify + Zod + Azure Functions local dev runtime" because:
1. **Fastify is retained as a dependency** for shared utilities (request parsing, lifecycle hooks, error formatting) that mirror Fastify ergonomics across handlers — but the public surface is the Azure Functions HTTP trigger registration.
2. **Some future stories may wrap Fastify inside a Functions handler** (`@h4ad/serverless-adapter` pattern) if endpoint complexity warrants — that decision is per-story, deferred until needed.
3. **For `/v1/health` (this story)**, do NOT introduce Fastify-as-server. Use the native Azure Functions v4 HTTP trigger directly. Keep Fastify in `dependencies` (already there from baseline) but unused.

This is documented as a deliberate per-story decision in §Patterns to Reuse.

### Source Tree Components to Touch

```
api/
├── package.json                              MODIFY (rename, version, engines, deps)
├── tsconfig.json                             CREATE (strict mode)
├── eslint.config.mjs                         CREATE (flat config, --max-warnings 0)
├── vitest.config.ts                          CREATE (coverage thresholds 80%)
├── host.json                                 CREATE (Functions v4 host config)
├── local.settings.example.json               CREATE (committed example)
├── local.settings.json                       NEVER COMMIT (gitignored)
├── .editorconfig                             CREATE
├── .prettierrc.json                          CREATE
├── README.md                                 CREATE
├── .github/workflows/ship.yml                MODIFY (drop Postgres, add paths filter, fix working-dir)
├── src/
│   ├── bootstrap.ts                          CREATE (imports observability init)
│   ├── functions/
│   │   └── health.ts                         CREATE (`/v1/health` HTTP trigger)
│   ├── schemas/
│   │   └── health.ts                         CREATE (Zod HealthResponseSchema, .strict())
│   ├── shared/
│   │   ├── zod.ts                            CREATE (parseBody, zodErrorToHttp)
│   │   └── version.ts                        CREATE (getVersionInfo)
│   └── observability/
│       ├── sentry.ts                         CREATE (no-op-when-unset init)
│       └── otel.ts                           CREATE (no-op-when-unset init)
└── tests/
    ├── health.test.ts                        CREATE
    ├── zod-pattern.test.ts                   CREATE
    ├── version.test.ts                       CREATE
    └── observability.test.ts                 CREATE
```

Root-level files touched:
- `.gitignore` — ensure `api/local.settings.json`, `api/coverage/`, `api/dist/`, `api/.azure/`, `api/node_modules/` are present (verify; add if missing under an explicit `# api/` section).

### Testing Standards (project-wide)

- **Vitest** is the test framework (already in baseline). Use `describe / it / expect`. Coverage via `@vitest/coverage-v8`.
- **No mocks of Cosmos / FCM / Razorpay in this story** — none are touched. Future stories use **Testcontainers** (already in `devDependencies`) for Cosmos emulator integration tests.
- **Test files mirror source layout under `tests/`**: `src/functions/health.ts` → `tests/health.test.ts`. No `__tests__` co-location.
- **Coverage exclusions** are minimal and explicit (`bootstrap.ts`, `observability/**`, configs). Never exclude `src/functions/**` or `src/shared/**` from coverage.
- **Test names** are full sentences: `"GET /v1/health returns 200 with valid HealthResponse JSON"`, not `"health works"`.
- **Snapshot tests are forbidden** for API responses (they hide regressions); use explicit shape assertions with Zod parse.

### Patterns to Reuse (LOCK IN — every future story must follow)

| Pattern | Where established | Rule |
|---|---|---|
| **Input validation** | `src/shared/zod.ts` `parseBody` | Every endpoint with a body MUST call `parseBody(SomeSchema, request.json())`. Never hand-roll validation. Never use `express-validator`, `joi`, `class-validator`. |
| **Error response shape** | `src/shared/zod.ts` `zodErrorToHttp` + future `src/shared/errors.ts` (this story creates only validation; future stories add domain errors) | Validation errors: `400 { error: "ValidationError", issues: [...] }`. NEVER leak stack traces in production responses. |
| **Function registration** | `src/functions/health.ts` (`app.http(...)`) | Every HTTP endpoint = one file under `src/functions/{kebab-name}.ts` calling `app.http(...)`. Routes ALWAYS prefixed `v1/` (versioning baked in from day one). |
| **Schemas live in `src/schemas/`** | `src/schemas/health.ts` | Zod schema is the single source of truth. Same schema generates OpenAPI in a future story. Do NOT duplicate types — derive with `z.infer<typeof Schema>`. |
| **Observability bootstrap** | `src/bootstrap.ts` imported by every function file | One-line import; never re-init Sentry/OTel inside handlers. |
| **Naming** | architecture §6.2 | TypeScript: PascalCase types, camelCase vars, kebab-case file names. API routes: `/v1/{resource}/{action}` with hyphens. |

### Project Structure Notes

- **Alignment with monorepo (architecture §6):** This story creates the `api/src/functions/`, `api/src/schemas/`, `api/src/shared/`, `api/src/observability/` layout matched to the architecture spec. The `src/domain/` and `src/infra/` folders mentioned in arch §6 are NOT created in this story — they appear in later stories when first needed (YAGNI per CLAUDE.md "no premature abstraction").
- **No cross-package imports:** `api/` does NOT import from `customer-app/`, `technician-app/`, or `admin-web/`. This story has no opportunity to violate this, but the rule is locked.
- **Detected variance:** baseline `package.json` has a `tsup` build for an ESM bundle. Azure Functions v4 prefers `tsc --build` emitting per-file `dist/` artifacts. Replace `build` script with `tsc --build` (or keep `tsup` if it produces a layout `func` accepts — verify in T3.4). Document the chosen approach in PR description.

### Previous Story Intelligence

**N/A** — this is the first story (E01-S01). No previous-story file to inherit from. Future stories in epic E01 (S02–S05) and dependent epics MUST inherit the patterns established here.

### Git Intelligence (last 5 commits, for context)

```
c360120 chore(phase-5.5): BMAD readiness gate PASS — code execution unlocked
700faa6 docs(phase-5): epics + stories — 44 stories across 10 epics, 12-week plan
b673312 docs(phase-4.5): threat model (STRIDE) + operational runbook
6e2fae4 docs(phase-4): architecture v1.0 + 7 ADRs covering all major decisions
3b535a3 docs(phase-3): UX design spec v1.0 + Owner Live Ops dashboard demo
```

The last 5 commits are **all docs/scaffolding**, no production code yet. This story is the first production-code commit. There are no Sentry breadcrumbs, deploy history, or runtime patterns to inherit.

### Library / Framework Requirements (exact versions, all approved free-tier)

> **All listed packages are on `docs/adr/0007` §Known free-tier dependencies. Adding any other package requires an ADR + owner approval.**

**Production dependencies (added/kept):**
- `@azure/functions@^4.5.0` — Azure Functions Node v4 programming model (NEW — this story adds it)
- `fastify@^5` — kept as a baseline dep; not exercised in `/health`; available for future shared utility use
- `zod@^3.23.0` — schema validation (already in baseline; pin minor for consistency)
- `@sentry/node@^8` — error tracking (no-op when DSN unset)
- `@opentelemetry/api@^1` + `@opentelemetry/auto-instrumentations-node@^0.50` — distributed tracing (no-op when OTLP endpoint unset)
- `posthog-node@^4` — analytics (kept; not used in this story)
- `@growthbook/growthbook@^1` — feature flags (kept; not used in this story)

**Dev dependencies (added/kept):**
- `typescript@^5.6.0`
- `@types/node@^22`
- `vitest@^2`, `@vitest/coverage-v8@^2`
- `eslint@^9`, `@typescript-eslint/parser@^8`, `@typescript-eslint/eslint-plugin@^8`, `eslint-plugin-import@^2`
- `prettier@^3`
- `tsx@^4` (local dev hot reload via `pnpm dev` if not using `func start` directly)
- `supertest@^7` (kept for future HTTP integration tests)
- `testcontainers@^10` (kept for future Cosmos integration tests)
- `azure-functions-core-tools@^4` (added as devDep so `func start` is available without global install; alt: documented in README that contributors must `pnpm add -g azure-functions-core-tools` — pick one approach in PR, document in README)

**Forbidden in this story (and ever, without ADR):** `express`, `koa`, `nestjs`, `pg`, `prisma`, `drizzle`, `mongoose`, `mongodb`, `joi`, `yup`, `class-validator`, `lodash` (use native ES2022), `axios` (use native `fetch`), `moment` (use native `Intl` / `Temporal` polyfill).

### Latest Tech Specifics (verified against current versions)

- **Azure Functions Node v4 programming model** (GA 2023-Q4) is the current default for new projects. Use `app.http()` registration, not `function.json` files.
- **Azure Functions Core Tools v4** is required for `func start` against runtime v4. Install via `npm i -g azure-functions-core-tools@4` OR commit as devDep.
- **Vitest v2** has stable coverage thresholds API. The `coverage.thresholds` block (not the deprecated `coverage.lines` etc. as top-level) is correct.
- **ESLint v9 flat config** (`eslint.config.mjs`) is required — `.eslintrc.*` is deprecated. Baseline only declares `eslint@^9` so config style matters.
- **Sentry SDK v8** for Node uses `Sentry.init({ dsn })` and is a no-op if `dsn` is falsy/undefined. Check via `Sentry.isInitialized()`.
- **OpenTelemetry SDK Node** auto-instrumentations register against `@opentelemetry/api`; if no exporter is registered, the default is a no-op processor. Document this explicitly in `src/observability/otel.ts`.
- **`@h4ad/serverless-adapter`** (Fastify-on-Functions adapter) is NOT added in this story; deferred to whenever a future endpoint genuinely needs Fastify's hooks/plugins.

### Performance Note (informational, not a CI gate)

`/v1/health` cold-start path:
- Function cold start (Consumption, Node 22): ~1.5–2.0 s
- Function warm start: < 50 ms
- Handler execution: < 5 ms (no I/O)
- **Warm response budget: < 100 ms wall-clock** (informal target in AC-1; not failing CI)

This sets the latency floor for all future endpoints. Real perf SLOs (NFR-P-1 < 500 ms p95 reads, NFR-P-2 < 800 ms p95 writes) get measured in production via App Insights.

### References

- [Source: `docs/architecture.md` §2 Boring-Technology Manifesto, §3.2 Component table, §4.1 ADR-0001, §4.4 ADR-0004, §6 Code structure, §6.2 Naming conventions, §7.1 NFR traceability]
- [Source: `docs/adr/0001-primary-stack-choice.md` — Node 22 + Fastify + Zod choice]
- [Source: `docs/adr/0004-azure-functions-consumption.md` — Functions Consumption + cold-start mitigations]
- [Source: `docs/adr/0007-zero-paid-saas-constraint.md` — approved free-tier dependency list]
- [Source: `docs/prd.md` §NFR-P-1 (read p95 < 500 ms), NFR-R-1 (uptime 99.5%), NFR-M-5 (TS strict / -Werror), NFR-M-4 (≥ 80% coverage), NFR-O-2 (Sentry), NFR-O-6 (OTel), NFR-S-9 (secrets only in Key Vault), NFR-S-12 (dep audit in CI)]
- [Source: `docs/threat-model.md` §3.1 API Backend STRIDE — informs future input-validation discipline; this story locks the validation pattern]
- [Source: `docs/runbook.md` §5 Deploy Procedure — documents the merge-to-deploy flow this story's CI participates in]
- [Source: `docs/stories/README.md` §E01 — this story's row + sprint allocation + dependency graph]
- [Source: `CLAUDE.md` (root) — phase gate, model routing, per-story protocol, 5-layer review]
- [Source: `api/CLAUDE.md` — sub-project stack rules + CI gates]
- [Source: `api/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
- [Source: `api/.github/workflows/ship.yml` (current state) — to be modified per AC-6/T8]
- [Source: `~/.claude/projects/.../memory/project_homeservices_zero_cost.md` — the ₹0 constraint is binding]

---

## Anti-patterns to AVOID (Disaster Prevention)

> Each item here corresponds to a real risk for the dev agent — flagged in advance to prevent rework.

1. **Do NOT introduce Express, Hono, Koa, or NestJS.** Architecture says Fastify or Hono; we picked Fastify in ADR-0001. Adding another framework forks the codebase.
2. **Do NOT add Postgres, Prisma, Drizzle, or any SQL ORM.** ADR-0003 mandates Cosmos. The baseline `ship.yml` Postgres service is a leftover and MUST be removed (AC-6).
3. **Do NOT use `function.json` files (Azure Functions v3 model).** Use `app.http(...)` from `@azure/functions@^4` (v4 programming model).
4. **Do NOT commit `local.settings.json`.** It will eventually contain Cosmos connection strings, Razorpay test keys, etc. The `.example` file is the only committed variant.
5. **Do NOT bypass `parseBody` in any future endpoint.** Establishing the pattern in this story is half the value.
6. **Do NOT add a paid-SaaS package "just for now."** ADR-0007 is binding. CodeRabbit Pro, Datadog, New Relic, LaunchDarkly, paid Sentry tier — all forbidden without an ADR.
7. **Do NOT skip TDD.** Per CLAUDE.md per-story protocol, tests come first. The task list orders RED → GREEN explicitly.
8. **Do NOT amend an earlier commit on this branch after it's pushed.** Per root CLAUDE.md: always create new commits. Pre-commit hooks failing means the previous commit didn't happen — fix forward, don't `--amend`.
9. **Do NOT bypass the codex-review-gate.** The pre-push hook in `api/.claude/settings.json` will block; do not set `CLAUDE_OVERRIDE_REASON` for routine work.
10. **Do NOT add comments explaining what code does.** Per root CLAUDE.md: only comment when WHY is non-obvious. Well-named identifiers explain WHAT.
11. **Do NOT extend the `/v1/health` handler with DB pings, FCM checks, or other "deep health" probes.** Those belong in a future `/v1/health/deep` endpoint with its own story. This story's `/v1/health` is liveness-only.
12. **Do NOT refactor or "clean up" the customer-app, technician-app, or admin-web sub-projects.** This story is api/-scoped only. Other sub-projects have their own E01-S0X stories.

---

## Definition of Done

- [x] All 10 acceptance criteria pass (verified by tests + manual `func start` smoke + green CI)
- [x] All 9 task groups (T1–T9) checked off
- [x] `pnpm typecheck && pnpm lint && pnpm test:coverage` all green locally
- [x] `func start` boots locally; `curl localhost:7071/api/v1/health` returns valid JSON
- [x] Coverage ≥ 80% on lines/branches/functions/statements (Vitest report)
- [x] PR opened against `main`; `ship.yml` is GREEN end-to-end
- [x] 5-layer review gate complete: `.codex-review-passed` marker present and matches HEAD SHA
- [x] PR description includes: summary, test plan, screenshot of green CI, perf-warm response time
- [x] `docs/stories/README.md` Phase 5 Status Tracker row for E01 marked as "Started: ✅"
- [x] No new `.md` files created beyond this story file and `api/README.md`
- [x] No paid-SaaS dependencies introduced (verified by `grep` against ADR-0007 forbidden list)

---

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent on first edit (e.g., "claude-sonnet-4-6 via /superpowers:executing-plans, 2026-04-XX")_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent — capture: any deviation from the plan and why; any deferred sub-task with rationale; CI run URL; perf-warm timing observed; any new pattern not anticipated above (which becomes locked-in for future stories)._

### File List

_To be filled by dev agent — final list of created/modified files for the PR_

---

## Open Questions for Dev Agent (resolve before starting)

1. **`func start` install path** — install Azure Functions Core Tools globally (documented in `api/README.md` Quick Start) OR add as devDep so `pnpm dev` works out of the box? **Recommendation:** devDep for hermetic setup; smaller chance of "works on my machine" surprises. Confirm in T3.4.
2. **Build tool** — keep `tsup` (current baseline) or replace with `tsc --build`? Functions v4 deploys typically expect a `dist/` matching source structure. **Recommendation:** `tsc --build` for transparency; `tsup` is overkill here. Confirm in T3.4.
3. **`/v1/health` route prefix** — Functions default base path is `/api`. So the URL is `http://localhost:7071/api/v1/health`. Adjust `host.json` `extensions.http.routePrefix` to empty string if we want `/v1/health` directly? **Recommendation:** keep default `/api` prefix in local dev; in production fronted by Static Web Apps proxy or Front Door, the prefix is rewritten. AC-1 wording uses `/api/v1/health` to reflect local behaviour.
