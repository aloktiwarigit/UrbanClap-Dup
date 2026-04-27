# Story E01.S06: Cross-sub-project OpenAPI client generator — typed TS client from `api/` spec, wired into `admin-web/`

Status: merged

> **Epic:** E01 — Foundations, CI & Design System (`docs/stories/README.md` §E01)
> **Sprint:** S1 (wk 1–2) · **Estimated:** ≤ 1 dev-day · **Priority:** **P0 / foundation enabler — BLOCKS E03-S01 (first real consumer) and every subsequent admin-web story that calls `api/`**
> **Sub-projects touched:** `api/` (adds OpenAPI emission) + `admin-web/` (consumes generated client) + repo root (CI)
> **Inserted:** 2026-04-18 (per owner decision, in place of previously-planned E03-S01-first approach — see §"Why this is E01-S06, not E03-S01" below)

---

## Story

As the **solo founder-operator (Alok)** building homeservices-mvp on Claude Max + Codex,
I want a single, typed, OSS-only OpenAPI codegen pipeline that (a) produces an OpenAPI 3.1 document from `api/`'s Zod schemas and (b) generates a typed TypeScript client consumed by `admin-web/`,
so that **every future admin-facing page, owner tool, dashboard, and operations workflow calls `api/` with full compile-time type safety — schema drift fails CI instead of reaching a customer — and the 30+ later stories that will rely on `api/` endpoints don't each re-invent an ad-hoc `fetch` wrapper.**

This is a **foundation-enabler story**, not a vertical feature: it lands zero user-visible functionality, but every row of the roadmap after E01-S06 depends on it. The first real consumer is **E03-S01** (service catalogue endpoints + admin CRUD); the client's ability to round-trip the catalogue shape is the end-to-end validation that the codegen pipeline actually works.

It also establishes the **cross-repo API contract discipline** that the homeservices-mvp "boring tech" manifesto (architecture §2) depends on: Zod → OpenAPI → typed client in one direction, with a CI drift-detection gate that refuses to merge if the committed spec or the committed generated client diverges from what api/'s current schemas would produce.

**Out of scope for this story** (to be handled in separate stories):
- Kotlin client generation for `customer-app/` and `technician-app/` — deferred until those apps have a backend call that actually warrants it (probably E02-S01 auth or E03-S02 catalogue consumption); the Kotlin pipeline uses a different codegen toolchain and belongs in its own story.
- Any specific auth scheme wired into the header-injection hook — that is E02-S04 (admin login + TOTP + RBAC). This story only provides the **seam**.
- Any real `api/` endpoint beyond the existing `/v1/health` — new endpoints land in their own stories; this one only proves the pipeline on the existing surface.
- Any non-generated, hand-rolled "SDK" wrapper on top of the generated client. If ergonomics gaps appear once real endpoints exist, a thin wrapper may be justified in a later story — not this one.

---

## Acceptance Criteria

> All acceptance criteria are BDD-formatted (Given/When/Then) and verified by automated tests (Vitest in `api/tests/` + `admin-web/tests/`) plus the CI workflows.

### AC-1 · `api/` emits a committed, conformant OpenAPI 3.1 document derived from Zod schemas

- **Given** the `api/` project at its current state (`@azure/functions@^4`, `zod@^3.23`, `/v1/health` endpoint using `HealthResponseSchema`)
- **When** a developer runs `pnpm --filter homeservices-api openapi:build` (or `pnpm run openapi:build` from `api/`)
- **Then** a file is written to `api/openapi.json` (committed artifact — see §Open Questions #2 for the committed-vs-generated-only decision) that is a **valid OpenAPI 3.1 document** per the `@apidevtools/swagger-parser` validator or `@stoplight/spectral-cli` `oas` ruleset (whichever the brainstorm selects; both are OSS)
- **And** the document includes `paths["/v1/health"].get` with `responses["200"].content["application/json"].schema` matching the `HealthResponseSchema` Zod shape (all five fields, with `status` as `const: "ok"`)
- **And** the document's `info.version` matches `api/package.json` `version` (currently `0.1.0`)
- **And** the document's `info.title` is `"homeservices-api"`
- **And** re-running `pnpm openapi:build` on an unchanged tree produces a **byte-identical** file (deterministic output — no timestamps, no nondeterministic ordering)
- **(Architectural principle: Zod is the single source of truth; OpenAPI is an artifact, never a hand-edit)**

### AC-2 · Committed OpenAPI spec is drift-tested in CI

- **Given** a PR is opened against `main`
- **When** the relevant ship.yml job runs the drift check
- **Then** the job runs `pnpm openapi:build` and fails with a clear error if `git diff --exit-code api/openapi.json` shows any change — instructing the developer to commit the regenerated spec
- **And** the error message references this story ID and the `pnpm openapi:build` command
- **And** the drift check runs on **any** change under `api/src/schemas/**` or `api/src/functions/**` (changes to Zod schemas or endpoint registration trigger the check)
- **And** the drift check is a **hard CI fail** (exit 1), not a warning — same principle as the codex-marker gate

### AC-3 · Typed TypeScript client is generated from the committed spec

- **Given** the committed `api/openapi.json` and a clean `admin-web/` checkout
- **When** a developer runs `pnpm --filter homeservices-admin openapi:client` (or `pnpm run openapi:client` from `admin-web/`)
- **Then** a typed TypeScript client is written under `admin-web/src/api/generated/` (default committed-artifact location — see §Open Questions #2)
- **And** the generated code compiles clean under the existing admin-web `tsconfig.json` (`strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`) — no `any`, no `@ts-expect-error`, no `// @ts-ignore`
- **And** the generated code contains, at minimum, a typed accessor for `GET /v1/health` whose return type resolves (via `z.infer` or a codegen-specific typing mechanism) to the `HealthResponse` shape: `{ status: "ok"; version: string; commit: string; timestamp: string; uptimeSeconds: number }`
- **And** re-running `pnpm openapi:client` on an unchanged spec produces a **byte-identical** set of files (deterministic codegen)
- **And** the codegen tool is OSS and on the approved list (ADR-0007) — one of `openapi-typescript`, `@hey-api/openapi-ts`, or `@openapitools/openapi-generator-cli` (decision in brainstorm; rationale captured in a new ADR `docs/adr/0009-openapi-client-generator.md` created by this story)

### AC-4 · Generated client is drift-tested in CI

- **Given** a PR is opened against `main`
- **When** the relevant ship.yml job runs the client-drift check
- **Then** the job runs `pnpm openapi:client` (admin-web) and fails with a clear error if `git diff --exit-code admin-web/src/api/generated/` shows any change — instructing the developer to commit the regenerated client
- **And** the drift check runs on any change to `api/openapi.json` or to the codegen config (`admin-web/openapi-ts.config.ts` or equivalent — tool-specific location)
- **And** the drift check is a **hard CI fail**

### AC-5 · `admin-web/` ships an `ApiClient` wrapper with an auth-header injection hook

- **Given** the generated client and the admin-web app
- **Then** a hand-maintained wrapper lives at `admin-web/src/api/client.ts` that:
  - Exposes a `createApiClient(options: { baseUrl: string; headers?: () => Promise<Record<string, string>> | Record<string, string> })` factory
  - Returns an object whose methods call the generated client with `baseUrl` applied and with `headers()` invoked (if provided) at request time (not at factory time — so tokens that rotate don't get captured stale)
  - Uses native `fetch` under the hood (no axios, no ky, no ofetch — see forbidden-list below and §Open Questions #4)
  - **Throws on non-2xx** with an `ApiError` class that preserves `status`, `url`, `method`, parsed `body` (if JSON) — downstream stories will handle this; this story only establishes the shape
- **And** the wrapper does **not** import, assume, or reference any specific auth scheme (no Firebase, no Entra, no Truecaller, no NextAuth imports) — E02-S04 will compose the wrapper with the auth provider
- **And** `tests/api-client.test.ts` proves: (a) factory without `headers` option works, (b) factory with sync `headers()` injects them, (c) factory with async `headers()` awaits before request, (d) non-2xx throws `ApiError` with status/url/body populated, (e) 2xx returns parsed JSON typed correctly
- **And** MSW (`msw@^2`, OSS) is the HTTP mock boundary for these tests — **not** hand-stubbed `global.fetch` (locks in the testing pattern for future API-calling tests)

### AC-6 · Landing page proves the pipeline with a real (server-side) round-trip

- **Given** the admin-web landing page at `app/page.tsx` (currently RSC, no API calls)
- **When** rendered in the production build
- **Then** the `<footer>` includes the `commit` and `version` fields **fetched via the generated client from `/v1/health`** — server-side (RSC `fetch`, not client hydration) — at build time or request time (the dev agent picks; document in PR)
- **And** if the `/v1/health` call fails (e.g., api/ not reachable during `next build`), the footer falls back to `process.env.NEXT_PUBLIC_GIT_SHA` with the word "(local)" appended — **no render-time crash, no Sentry report, no retry loop** (the codegen proof-of-life is best-effort at build; production runtime uses the live endpoint)
- **And** the `/v1/health` URL is read from `process.env.API_BASE_URL` (server-only — no `NEXT_PUBLIC_` prefix, so it never reaches the browser bundle) with a default of `http://localhost:7071/api` for local dev
- **And** `tests/e2e/landing.spec.ts` is updated to assert the footer contains a plausible 8-char hex SHA **and** a semver version — proving the round-trip succeeded in CI
- **(This is the end-to-end functional proof. Without it, the pipeline could silently be broken.)**

### AC-7 · Codegen is cross-repo safe — `admin-web/` does NOT import from `api/`

- **Given** the monorepo layout
- **Then** `admin-web/src/api/generated/**` contains **zero** imports from `../../../api/**` or any relative path that escapes `admin-web/`
- **And** the generated client reads the OpenAPI spec **from a committed copy** (`admin-web/src/api/generated/openapi.json` OR via a build-step copy from `api/openapi.json` — brainstorm decides the mechanism; the lint rule is "no admin-web file reads from api/ at runtime")
- **And** an ESLint `no-restricted-imports` rule blocks any future attempt to cross the boundary (rule lives in `admin-web/eslint.config.mjs` — see task T6)
- **And** `tests/no-cross-package-imports.test.ts` grep-asserts the rule holds (belt-and-braces: lint catches it during authoring; test catches it if the lint rule is disabled)

### AC-8 · OpenAPI spec validation step added to `api-ship.yml`

- **Given** the existing `.github/workflows/api-ship.yml`
- **When** a PR under `api/**` is opened
- **Then** a new job step runs `pnpm exec spectral lint openapi.json --ruleset oas` (or the equivalent for the chosen validator) and fails on any `error`-level finding
- **And** the step runs **before** the codex-marker gate (so spec errors don't consume a manual review cycle)
- **And** the step uses the **same `paths:` filter semantics** as the existing api-ship.yml — no new CI minutes on unrelated changes

### AC-9 · OpenAPI drift + client drift + auth-header seam tests are in CI for BOTH ship.yml files

- **Given** PRs against `main`
- **When** the PR touches `api/**` OR `admin-web/**`
- **Then** the drift checks + client tests fire in the appropriate workflow (the brainstorm decides whether this is one new `contracts-ship.yml` that both api-ship and admin-ship depend on, OR an extension to each existing workflow — see §Open Questions #5)
- **And** whichever layout is chosen, the `paths:` filter for triggering MUST include both `api/**` (because a schema change forces a client regen) and `admin-web/**` (because a client-config change forces a client regen)
- **And** the codex-marker ancestor-check gate (same verbatim pattern as `api-ship.yml` + `admin-ship.yml`) runs on both workflows — never merge without `.codex-review-passed` valid for HEAD
- **And** the workflows' paths-filter MUST include `.codex-review-passed` and `docs/reviews/**` so marker-only commits don't bypass the gate

### AC-10 · TypeScript strict + ESLint zero-warnings + Vitest ≥ 80% coverage preserved in BOTH sub-projects

- **Given** the codebase after this story lands
- **When** `pnpm --filter homeservices-api typecheck && pnpm --filter homeservices-api lint && pnpm --filter homeservices-api test:coverage` runs
- **Then** all exit 0 with coverage ≥ 80% lines/branches/functions/statements (Vitest `vitest.config.ts` thresholds unchanged from E01-S01)
- **When** `pnpm --filter homeservices-admin typecheck && pnpm --filter homeservices-admin lint && pnpm --filter homeservices-admin test:coverage` runs
- **Then** all exit 0 with coverage ≥ 80% (unchanged from E01-S02)
- **And** generated code under `admin-web/src/api/generated/**` is **excluded from coverage thresholds** (it's machine-generated; coverage there would be meaningless) but is **NOT excluded from typecheck or lint**
- **And** the landing-page Lighthouse budgets from E01-S02 (Perf ≥ 90, A11y ≥ 95, BP ≥ 90, SEO ≥ 90) still pass — the RSC round-trip in AC-6 MUST NOT regress FCP/LCP below those thresholds (if it does, switch to build-time-only fetch)

### AC-11 · Zero paid SaaS dependencies introduced + exactly one new ADR

- **Given** the new `api/package.json`, `admin-web/package.json`, and lockfiles after this story
- **Then** every new dependency added is on the approved free-tier list at `docs/adr/0007-zero-paid-saas-constraint.md` §"Known free-tier dependencies" (or added to that list in an ADR amendment as part of this story if it's an OSS dep simply not yet catalogued)
- **And** no SDK from the prohibited list is present (paid Readme.com, paid Postman, paid Stoplight cloud, Swagger Hub paid, etc. — SDK documentation tooling specifically called out here because it's the nearest slippery slope for a codegen story)
- **And** a **new ADR** `docs/adr/0009-openapi-client-generator.md` is committed capturing:
  - The selected codegen tool (chosen in brainstorm from the 3 OSS candidates)
  - Why (bundle size / runtime cost / ergonomics / community size tradeoffs)
  - Committed-artifact vs regenerate-at-build decision (§Open Questions #2)
  - Spec-emission tool on the api/ side (§Open Questions #3)
  - Fetch wrapper runtime (native `fetch` expected; see §Open Questions #4)
  - Revisit trigger (e.g., "reconsider if codegen time exceeds 2s on a 100-endpoint spec, or if bundle overhead exceeds 8 KB gzipped")

---

## Tasks / Subtasks

> **TDD discipline (per root CLAUDE.md):** every production change starts with a failing test.
> **Cross-sub-project sequencing:** api/ side first (produce spec), then admin-web/ side (consume spec + client). Do NOT interleave — finish the api/ side and commit it before touching admin-web/, so a revert point exists.

- [x] **T1 — ADR-0009: codegen tool decision** (AC-11)
  - [x] T1.1 Create `docs/adr/0009-openapi-client-generator.md` from `docs/adr/TEMPLATE.md`; capture the three-candidate tradeoff (openapi-typescript / @hey-api/openapi-ts / @openapitools/openapi-generator-cli)
  - [x] T1.2 Capture the spec-emission decision (zod-openapi vs @asteasolutions/zod-to-openapi vs hand-written seed) and the committed-artifact vs regenerate decision
  - [x] T1.3 Add the selected tool to ADR-0007 §Known free-tier dependencies if not already listed
  - [x] T1.4 Status: `Accepted` — committed with the rest of the story

- [x] **T2 — `api/` OpenAPI emission** (AC-1, AC-2)
  - [x] T2.1 Add the spec-emission library to `api/package.json` `devDependencies` (brainstorm decides which — prefer `zod-openapi@^3` for `@asteasolutions/zod-to-openapi@^7` OSS; pin minors per the api/ pattern)
  - [x] T2.2 (RED) Write `api/tests/openapi-build.test.ts` asserting: (a) the build script produces a file at `api/openapi.json`, (b) the file parses as valid OpenAPI 3.1 via `@apidevtools/swagger-parser` (OSS), (c) `paths["/v1/health"].get.responses["200"]` is a schema-equivalent of `HealthResponseSchema` (deep-equal modulo ordering), (d) running it twice produces byte-identical output
  - [x] T2.3 (GREEN) Create `api/src/openapi/registry.ts` — a single module that registers every schema + route. Include `HealthResponseSchema` + the `/v1/health` GET operation. All future endpoints add their registration here.
  - [x] T2.4 (GREEN) Create `api/src/openapi/build.ts` CLI entry that imports the registry and writes `api/openapi.json`. Deterministic output: sort keys, no timestamps, stable whitespace (pretty-printed with 2-space indent + trailing newline so diffs are readable)
  - [x] T2.5 Add `"openapi:build": "tsx src/openapi/build.ts"` to `api/package.json` scripts (tsx already in devDependencies)
  - [x] T2.6 Generate `api/openapi.json` — commit it
  - [x] T2.7 Add `api/openapi.json` to the list of files typechecked / linted (lint should ignore JSON; typecheck N/A) — verify Spectral ruleset ignores `examples` nondeterminism

- [x] **T3 — `api-ship.yml` spec-validation + drift step** (AC-2, AC-8)
  - [x] T3.1 Add `@stoplight/spectral-cli@^6` (OSS) to `api/devDependencies`
  - [x] T3.2 Edit `.github/workflows/api-ship.yml` — add a new step **before the codex-marker step** running `pnpm exec spectral lint openapi.json --ruleset oas --fail-severity error`
  - [x] T3.3 Add a drift-check step: `pnpm openapi:build && git diff --exit-code api/openapi.json || (echo "::error::openapi.json is out of date — run pnpm openapi:build and commit" && exit 1)`
  - [x] T3.4 Verify `paths:` filter on api-ship.yml still triggers appropriately (schema files under `api/src/schemas/**` are in scope — they're already under `api/**`)

- [x] **T4 — `admin-web/` client codegen config** (AC-3, AC-4)
  - [x] T4.1 Add the selected codegen tool (from ADR-0009) to `admin-web/devDependencies` — e.g., `openapi-typescript@^7` OR `@hey-api/openapi-ts@^0.x` OR `@openapitools/openapi-generator-cli@^2` (pin minors per admin-web pattern)
  - [x] T4.2 Create the codegen config file at the tool's conventional location — e.g., `admin-web/openapi-ts.config.ts` (for @hey-api) or `admin-web/openapi.config.ts` (for openapi-typescript with a wrapper script) or `admin-web/openapitools.json` (for the Apache tool)
  - [x] T4.3 Copy (or symlink-via-build-step) `api/openapi.json` to `admin-web/src/api/generated/openapi.json` — the brainstorm decides the mechanism (a prebuild script reading the api/ file, OR a committed copy — the AC-7 "no cross-package imports" rule forbids direct admin-web → api/ reads at runtime, but build-time file copies are allowed)
  - [x] T4.4 Add `"openapi:client": "<tool-specific command>"` to `admin-web/package.json` scripts
  - [x] T4.5 Run it; verify output under `admin-web/src/api/generated/` is deterministic; commit the generated files
  - [x] T4.6 Add an ESLint `no-restricted-imports` rule (or `eslint-plugin-boundaries`) blocking any import from `admin-web/**` that resolves outside of `admin-web/` — specifically `**/api/src/**`

- [x] **T5 — `ApiClient` wrapper with header-injection hook** (AC-5)
  - [x] T5.1 (RED) Write `tests/api-client.test.ts` — use `msw@^2` to mock `/v1/health`; cover all 5 sub-assertions in AC-5
  - [x] T5.2 (GREEN) Implement `admin-web/src/api/client.ts`:
    - `export class ApiError extends Error { status; url; method; body; }`
    - `export function createApiClient({ baseUrl, headers })` returning `{ health: { get(): Promise<HealthResponse> } }` (or whatever shape the chosen codegen produces — adapt)
    - Internal: `async function request(method, path, init)` applies `baseUrl`, awaits `headers()` (if provided), calls `fetch`, throws `ApiError` on non-2xx, returns typed JSON on 2xx
  - [x] T5.3 Export `ApiClient`, `ApiError`, and `createApiClient` from `admin-web/src/api/index.ts` (barrel — the ONLY module outside `src/api/` should import from is `./api/index.ts`, not deep paths)
  - [x] T5.4 Add `msw@^2` to `admin-web/devDependencies` (OSS; industry-standard HTTP mocking; locks the pattern for E02+ stories)

- [x] **T6 — Cross-package-import lint rule + test** (AC-7)
  - [x] T6.1 Update `admin-web/eslint.config.mjs` with a `no-restricted-imports` rule: `patterns: [{ group: ["../../../api/*", "../../api/*"], message: "admin-web may not import from api/; use the generated client instead" }]`
  - [x] T6.2 Write `admin-web/tests/no-cross-package-imports.test.ts` — glob `src/**/*.{ts,tsx}` and assert no file contains `from "../../../api/"` or `from "../../api/"` or `require("../../../api/"` etc.
  - [x] T6.3 Validate the rule by temporarily adding a cross-import to a test fixture, confirm lint + test fail, remove the fixture

- [x] **T7 — Landing page round-trip integration** (AC-6)
  - [x] T7.1 Update `admin-web/app/page.tsx` to call `createApiClient({ baseUrl: process.env.API_BASE_URL ?? "http://localhost:7071/api" }).health.get()` — server-side (RSC context, no `"use client"`)
  - [x] T7.2 Gracefully handle failure: `try/catch` around the call; on failure, render `(local)` suffix in footer; **do NOT** call `Sentry.captureException` here (best-effort at render; if the api is unreachable at build we still ship)
  - [x] T7.3 Update `admin-web/tests/landing.page.test.tsx` — mock the client factory; assert footer contains the `commit` + `version` when mock returns success; assert `(local)` suffix when mock throws
  - [x] T7.4 Update `admin-web/tests/e2e/landing.spec.ts` — assert footer text contains an 8-char hex SHA `(/[a-f0-9]{8}/)` AND a semver pattern `(/\d+\.\d+\.\d+/)` to prove the real round-trip happened
  - [x] T7.5 In `admin-web/playwright.config.ts` `webServer:` block, ensure the api/ dev server is also started for e2e — OR, for simplicity, stub `/v1/health` via a Next.js test-time route handler and document that decision in the PR

- [x] **T8 — Lighthouse regression check** (AC-10)
  - [x] T8.1 Run `pnpm exec lhci autorun --config=lighthouserc.cjs` locally after the landing page change
  - [x] T8.2 If Performance score drops below 90, switch from per-request RSC fetch to build-time static fetch (execute in `generateStaticParams` or equivalent — decide in brainstorm). Commit the switch with a note in the PR.

- [x] **T9 — CI layout decision + implementation** (AC-9)
  - [x] T9.1 Based on brainstorm §Open Questions #5, either (a) extend both `api-ship.yml` and `admin-ship.yml` with the relevant drift checks, OR (b) add a new `.github/workflows/contracts-ship.yml` that both workflows `needs:` (if GitHub Actions supports cross-workflow deps — it does not natively, so (a) is likely simpler). Pick (a) by default unless the brainstorm surfaces a strong reason.
  - [x] T9.2 For whichever workflow enforces the admin-side drift check: ensure `paths:` filter includes `api/openapi.json` as a trigger (so spec changes force admin-web regen + CI)
  - [x] T9.3 Ensure `.codex-review-passed` and `docs/reviews/**` are in the paths filters of both workflows (already the case; verify)
  - [x] T9.4 Confirm the codex-marker ancestor-check step is present verbatim in any new workflow file

- [x] **T10 — Coverage exclusion for generated files** (AC-10)
  - [x] T10.1 Update `admin-web/vitest.config.ts` `coverage.exclude` to add `src/api/generated/**` and `src/api/client.ts` (optional — the client IS tested, so if thresholds met without exclusion, skip this for `client.ts` and ONLY exclude the generated folder)
  - [x] T10.2 Verify coverage report still meets 80% thresholds after the exclusion

- [x] **T11 — `api/README.md` + `admin-web/README.md` updates**
  - [x] T11.1 In `api/README.md`, under a new `## OpenAPI` section, document: `pnpm openapi:build` produces the spec; it MUST be committed after every Zod schema or route change; CI drift-checks on every PR
  - [x] T11.2 In `admin-web/README.md`, under a new `## Generated API Client` section, document: `pnpm openapi:client` regenerates `src/api/generated/`; it MUST be committed after api/openapi.json changes; import via `@/api` barrel; never import from `api/` directly
  - [x] T11.3 Document the `API_BASE_URL` env var + the default in both READMEs

- [x] **T12 — Pre-push 5-layer review gate** (per root CLAUDE.md)
  - [x] T12.1 `/code-review` (lint + stylistic — Claude)
  - [x] T12.2 `/security-review` (pay attention: does the header-injection hook have any path to log-leak a token? does the spec expose any internal-only routes?)
  - [x] T12.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
  - [x] T12.4 `/bmad-code-review` (Blind Hunter + Edge Case Hunter + Acceptance Auditor)
  - [x] T12.5 `/superpowers:requesting-code-review`
  - [x] T12.6 Only after all 5 layers, `git push`

---

## Dev Notes

### Story Foundation Context

This is the **first cross-sub-project story** in the repo — it touches both `api/` and `admin-web/` in a single story. The two sub-projects were built in isolation by E01-S01 and E01-S02; this story is the explicit bridge.

**Dependencies:**
- E01-S01 merged (✓ — merge commit `33db7bb` on main; api/ skeleton + `/v1/health` + Zod schema + ancestor-check codex gate)
- E01-S02 merged (✓ — merge commit `1236d4c` on main; admin-web skeleton + Tailwind v4 + Storybook + landing page)
- Phase gate satisfied (`.bmad-readiness-passed` committed; verified by SessionStart hook)

**What this story unblocks:**
- **E03-S01** (service catalogue + /v1/services + admin CRUD) — the first real consumer; validates the pipeline end-to-end
- Every E03+ admin-web story that calls api/
- Eventually: the Kotlin client generator story (separate; out of scope here) that will parallel this on the Android side

**Why this matters strategically:** architecture §2 Boring-Technology Manifesto says "schemas are the contract; generate clients, don't hand-write SDK wrappers." That principle has no teeth until there's a pipeline that enforces it. This story installs the pipeline. Get it right and the next ~30 stories each save ~30 minutes of ad-hoc `fetch` wiring. Get it wrong (e.g., picking a codegen tool that produces ergonomically bad output, or allowing spec drift) and every future story has a manual step or a silent-drift bug.

### Why this is E01-S06, NOT E03-S01

The original roadmap placed the catalogue data model + `/v1/services` endpoint at E03-S01. Two observations drove the owner's 2026-04-18 decision to insert E01-S06 as a foundation-enabler instead:

1. **E03-S01 would have shipped catalogue endpoints without a typed client.** That means admin-web would either hand-roll `fetch('/v1/services')` calls (establishing an anti-pattern for future stories), OR E03-S01 would double in scope to land both the endpoints AND the codegen pipeline (violating the one-story-one-session sizing rule).
2. **Codegen without a real consumer is a lie-detector that never fires.** If we land the codegen now (with only `/v1/health`) and then land catalogue endpoints in E03-S01, the act of regenerating the client in E03-S01 is itself the end-to-end test. If the generator has any sharp edges, they surface on first contact — **which is exactly what we want before 30 stories depend on it**.

So: this story is not a cost, it's a wedge. It buys one session of disciplined foundation work now and prevents technical-debt compounding across the whole roadmap.

### Critical Architectural Constraints (READ BEFORE CODING)

| Constraint | Source | Story-level implication |
|---|---|---|
| **Zod is the single source of truth for API shapes** | E01-S01 Patterns to Reuse; architecture §6 | The OpenAPI doc is derived from Zod. Never edit `api/openapi.json` by hand. Never duplicate shapes in TypeScript `interface` declarations — use `z.infer`. |
| **TypeScript strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`** | E01-S01 AC-6, E01-S02 AC-6 | Generated code must be strict-clean; any codegen tool that emits non-strict types is disqualified (most OSS tools honor strict mode; verify for the candidate you pick). |
| **Zero paid SaaS (ADR-0007)** | binding across all stories | Every tool is OSS: `openapi-typescript` / `@hey-api/openapi-ts` / `@openapitools/openapi-generator-cli` (codegen), `zod-openapi` / `@asteasolutions/zod-to-openapi` (emission), `@stoplight/spectral-cli` (validation), `msw` (testing). No Stoplight Studio cloud, no Postman Enterprise, no Swagger Hub, no Readme.com paid tier. |
| **Codex review authoritative** | root CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` valid for HEAD. Ancestor-check + scope-diff pattern in CI (lock from E01-S01 C1 fix). |
| **No cross-sub-project runtime imports** | monorepo architecture principle, E01-S02 Project Structure Notes | `admin-web/src/**` may not import from `../../../api/src/**` at runtime. Build-time file copies are allowed; runtime resolves everything within `admin-web/`. |
| **Native `fetch` only — no axios, ky, ofetch** | E01-S02 forbidden list | Admin-web's "Do not use axios" rule from E01-S02 applies here. The codegen tool's runtime (if it has one, e.g., `@hey-api` can emit one) must use `fetch` or be configured to use `fetch`. |
| **CI is the real gate** | root CLAUDE.md | Local `pnpm openapi:build` / `pnpm openapi:client` are fast feedback; the drift check in CI is what actually prevents drift from merging. |
| **Deterministic codegen** | derived from "drift check" principle | Both spec generation and client generation must be deterministic across runs on the same inputs. Non-deterministic ordering, timestamps, or random IDs in outputs are disqualifying. |
| **Feature flags + a11y floor preserved** | E01-S02 AC-2, AC-3 | Landing page changes must not break axe-core zero-violations or Lighthouse budgets. |

### Why Three Candidate Codegen Tools, Not One

The three OSS candidates have materially different shapes:

| Tool | Output | Bundle impact | Ergonomics | Maturity |
|---|---|---|---|---|
| **`openapi-typescript`** | Types-only — a single `.d.ts` with named types per operation | Zero runtime; bring your own fetch wrapper | Lean; caller writes the wrapper (matches AC-5 explicitly) | v7, very stable, widely adopted |
| **`@hey-api/openapi-ts`** | Types + runtime client (fetch-based, configurable) | ~3-8 KB gzipped runtime | Rich — per-operation methods pre-wired | v0.x, actively maintained, well-regarded |
| **`@openapitools/openapi-generator-cli`** | Types + full SDK (fetch, interceptors, OAuth flows, …) | ~15-30 KB gzipped, more opinionated | Heaviest; brings structure we don't need for ~10 endpoints | Apache project, very mature but over-engineered for this stack |

The brainstorm session picks one based on these tradeoffs. **My strong recommendation going into brainstorm:** `openapi-typescript` (types-only), with our own hand-written `ApiClient` wrapper (T5). Reason: the wrapper is ~80 LOC, gives us exact control over the auth-header-injection hook, and keeps the bundle minimal (critical for the Lighthouse Performance budget). The other two tools are worth considering only if we discover we need interceptors or complex auth flows (and even then we'd probably extend the hand wrapper first).

### Why Three Candidate Spec-Emission Tools, Not One

Zod → OpenAPI converters:

| Tool | Style | Integration effort | Notes |
|---|---|---|---|
| **`@asteasolutions/zod-to-openapi`** | Registry-based: you explicitly register schemas + routes | Medium — write a `registry.ts` module | Most control; most explicit; well-maintained |
| **`zod-openapi`** | Extends Zod schema with `.openapi(...)` methods | Low — annotate schemas inline | More coupling between Zod shape and OpenAPI metadata; less maintained than @asteasolutions |
| **Hand-written seed spec** | You write `openapi.json` by hand | Low now, high later | Not really an option for a story whose whole purpose is to lock in Zod-as-SoT; explicitly rejected in the Open Questions but listed for completeness |

**Recommendation going into brainstorm:** `@asteasolutions/zod-to-openapi`. Registry-based emission forces us to be explicit about which routes are public, gives us a single file to review when onboarding, and avoids the temptation to leak internal-only schemas into the public spec.

### Source Tree Components to Touch

```
api/
├── package.json                              MODIFY (add zod-to-openapi, spectral, scripts)
├── README.md                                 MODIFY (add OpenAPI section)
├── openapi.json                              CREATE (committed artifact; deterministic)
├── src/
│   └── openapi/
│       ├── registry.ts                       CREATE (every schema + route registered here)
│       └── build.ts                          CREATE (CLI: reads registry, writes openapi.json)
└── tests/
    └── openapi-build.test.ts                 CREATE

admin-web/
├── package.json                              MODIFY (add codegen tool, msw, scripts)
├── README.md                                 MODIFY (add Generated API Client section)
├── eslint.config.mjs                         MODIFY (no-restricted-imports rule)
├── vitest.config.ts                          MODIFY (coverage exclude src/api/generated/**)
├── openapi-ts.config.ts (or similar)         CREATE (codegen config)
├── playwright.config.ts                      VERIFY / MODIFY (webServer for real api/, or document stub decision)
├── app/
│   └── page.tsx                              MODIFY (server-side /v1/health fetch; footer populated)
├── src/
│   └── api/
│       ├── index.ts                          CREATE (barrel export)
│       ├── client.ts                         CREATE (ApiClient + createApiClient + ApiError)
│       └── generated/
│           ├── openapi.json                  CREATE (build-copied from api/openapi.json)
│           └── <tool-specific files>         CREATE (types / client / metadata from codegen)
└── tests/
    ├── api-client.test.ts                    CREATE (MSW-backed; 5 sub-assertions)
    ├── no-cross-package-imports.test.ts      CREATE
    └── e2e/landing.spec.ts                   MODIFY (SHA + semver in footer)
└── tests/landing.page.test.tsx               MODIFY (mock api client; footer assertions)

docs/adr/
└── 0009-openapi-client-generator.md          CREATE

.github/workflows/
├── api-ship.yml                              MODIFY (spectral lint + openapi drift)
└── admin-ship.yml                            MODIFY (generated-client drift + API_BASE_URL env)
```

### Patterns to Reuse (LOCK IN — every future cross-repo API-consuming story)

| Pattern | Where established | Rule |
|---|---|---|
| **OpenAPI emission** | `api/src/openapi/registry.ts` + `build.ts` | Every new Zod schema and every new route registration adds an entry to `registry.ts`. Never edit `openapi.json` by hand. CI drift-checks on every PR. |
| **Typed client** | `admin-web/src/api/generated/` + `admin-web/src/api/client.ts` | Every admin-web API call goes through `createApiClient(...)`. Never hand-write a `fetch('/v1/...')` call. Never import the generated client directly — always via the `src/api/index.ts` barrel. |
| **Auth-header hook** | `createApiClient({ headers: () => {...} })` | Auth token injection happens at the factory boundary, evaluated per-request (not at factory-instantiation — so rotating tokens work). No specific auth scheme is assumed; E02-S04 will compose. |
| **Drift CI gate** | `api-ship.yml` spec-drift step + `admin-ship.yml` client-drift step | On every PR: regenerate locally in CI, `git diff --exit-code`, hard-fail if anything changes. |
| **MSW for API-contract testing** | `tests/api-client.test.ts` | `msw@^2` mocks the HTTP boundary. Never hand-stub `global.fetch`. Every future test that exercises an api/ call uses MSW. |
| **No cross-package runtime imports** | `admin-web/eslint.config.mjs` `no-restricted-imports` + `tests/no-cross-package-imports.test.ts` | `admin-web` may not `import ... from "../../../api/..."`. Build-time file copies are fine. |
| **ADR-per-toolchain-choice** | `docs/adr/0009-openapi-client-generator.md` | Any toolchain swap (codegen tool, emission tool, validator) requires a new ADR superseding 0009. |

### Project Structure Notes

- **Generated files are committed.** The project is small; commit-then-regenerate is simpler than CI-generates-on-the-fly. When the committed copy drifts from what the current Zod schemas would produce, CI fails. Revisit if commit noise becomes unmanageable (unlikely at < 50 endpoints).
- **`src/api/index.ts` is the barrel.** Never deep-import `src/api/generated/*`. Barrel keeps the blast radius of a codegen-tool swap small.
- **`src/api/client.ts` does NOT depend on Next.js.** Use plain TS + `fetch`. That keeps the wrapper usable in Storybook, Vitest jsdom environment, and (eventually) any non-Next tooling.

### Previous Story Intelligence (merged PRs #1, #2)

**Direct lessons that apply here:**

1. **Workflow location** (from E01-S01 C1): any new workflow file MUST live at repo-root `.github/workflows/`, not under a sub-project. This story edits existing workflows at the correct location; no new workflow file is needed if the brainstorm picks option (a) in T9.1.
2. **Codex-marker paradox fix** (from E01-S01 round 2): any CI step that gates on `.codex-review-passed` uses the **ancestor-check + scope-diff** pattern, NOT `MARKER_SHA == HEAD_SHA`. The paths filter MUST include `.codex-review-passed` and `docs/reviews/**`. Both existing workflows already implement this correctly (verified in `.github/workflows/api-ship.yml` and `.github/workflows/admin-ship.yml`); this story preserves the pattern.
3. **OTel remains deferred** (E01-S01, E01-S02). This story does not revisit observability wiring.
4. **Corepack reproducibility**: `packageManager: "pnpm@9.15.4"` in both sub-projects. Don't regress.
5. **`pnpm dev` on api/ is `pnpm build && func start`** (E01-S01 codex round 2 fix): Azure Functions v4 loads compiled `dist/`. Any new `api/` script (e.g., `openapi:build`) should NOT itself run `func start`; it runs via `tsx` for a clean one-off.
6. **Storybook is react-vite** (E01-S02, ADR-0008): not `@storybook/nextjs`. Irrelevant here but noted.
7. **ESLint `--max-warnings 0` + flat config**: generated code must not produce warnings. If the codegen tool produces non-strict code, either (a) configure it to emit strict, (b) exclude the generated folder from lint (last resort; coverage-level exception only, documented in ADR-0009), or (c) pick a different tool.

### Git Intelligence (last 5 commits on main)

```
1236d4c E01-S02: admin-web skeleton + landing page (#2)
33db7bb Merge pull request #1 from aloktiwarigit/E01-S01-api-skeleton
5ca1d4e chore: codex review passed (round 2) — mark 71c61bf as reviewed
71c61bf fix(api,ci): address Codex review — dev script must build first + marker gate chicken-egg fix
c7cb8bd fix(ci): move ship.yml to repo-root .github/workflows/api-ship.yml
```

**Patterns observed:** disciplined TDD commits; codex round-2 fixes were a CI chicken-and-egg issue that required the ancestor-check pattern. The same class of issue can bite a new ship.yml — this story re-uses the proven pattern, does not re-invent.

### Library / Framework Requirements (exact versions, all approved OSS free-tier)

> All new deps must be OSS and either already in ADR-0007 §"Known free-tier dependencies" or added to that list in the ADR amendment that accompanies this story.

**api/ new devDependencies (added):**
- `@asteasolutions/zod-to-openapi@^7` — Zod → OpenAPI 3.1 emission (recommendation; brainstorm may pick zod-openapi)
- `@apidevtools/swagger-parser@^10` — OpenAPI validation in the emission test (OSS, widely used)
- `@stoplight/spectral-cli@^6` — OpenAPI linting in CI (OSS; MIT)

**admin-web/ new devDependencies (added):**
- `openapi-typescript@^7` — types-only codegen (recommendation; brainstorm may pick @hey-api/openapi-ts or openapi-generator-cli)
- `msw@^2` — HTTP mocking for tests (OSS; industry standard; locks pattern for all future api-calling tests)

**Forbidden in this story (and generally, without ADR):**
- `axios`, `ky`, `ofetch`, `got`, `node-fetch` — native `fetch` only (E01-S02 lock)
- `@openapitools/openapi-generator` (the Java version — only the CLI wrapper `@openapitools/openapi-generator-cli` is a candidate; and even that is heavy)
- Any paid tier of Readme.com, Postman, Stoplight cloud, Swagger Hub
- Any hand-written SDK wrapper on top of the codegen output (premature abstraction; revisit after 20+ endpoints)
- Any runtime-dependent generator that requires a persistent service (e.g., running a docker container for codegen) — the codegen must be fully local + offline

### Latest Tech Specifics (verified against current versions)

- **OpenAPI 3.1** (not 3.0) is the target. 3.1 aligns with JSON Schema draft 2020-12, which matches Zod's output semantics more closely (especially nullable handling).
- **`openapi-typescript@7`** (2024) supports OpenAPI 3.1; emits types-only `.d.ts`; very small footprint; zero runtime.
- **`@hey-api/openapi-ts@0.x`** (2024) is pre-1.0 but widely adopted; emits a full `fetch`-based client; supports plugins; acceptable risk.
- **`@asteasolutions/zod-to-openapi@7`** (2024) supports OpenAPI 3.1; registry-based; well-maintained.
- **`msw@2`** (2023 release) is the ESM-first rewrite; works cleanly with Vitest jsdom + Playwright; `Response.json()` shapes align with the `fetch` API.
- **`@stoplight/spectral-cli@6`** supports OpenAPI 3.1 + custom rulesets; the `oas` built-in ruleset is sufficient for drift + basic quality.
- **React 19 Server Components** support async data fetching in the component body — no `getStaticProps`/`getServerSideProps`. Our `/v1/health` RSC call is an async component body.
- **Next.js 15 `fetch` caching**: by default, RSC `fetch` is cached per-build; this matches our "build-time /v1/health fetch" goal in AC-6. If we need per-request, explicitly opt in with `{ cache: 'no-store' }`.

### Performance Note

Adding a `/v1/health` call to the RSC landing page introduces one HTTP request at build or render time. Expected impact:
- Build-time fetch (default Next.js behaviour): **zero runtime cost** — value is baked into the static HTML.
- Request-time fetch with `{ cache: 'no-store' }`: **+~50 ms server response time** — negligible for an internal admin page; no customer-facing impact.

AC-10's Lighthouse requirement is the safety net: if the round-trip somehow regresses Performance below 90, we switch to build-time and commit the switch with a PR note.

### References

- [Source: `docs/architecture.md` §2 Boring-Technology Manifesto, §6 Code structure, §7.1 NFR traceability (NFR-M-5 strict types, NFR-P-6 FCP, NFR-P-2 write latency)]
- [Source: `docs/adr/0001-primary-stack-choice.md` — Node 22 + Fastify + Zod + Next.js + TS strict]
- [Source: `docs/adr/0007-zero-paid-saas-constraint.md` — approved free-tier dependency list + forbidden list]
- [Source: `docs/adr/0008-storybook-react-vite-framework.md` — precedent for a toolchain ADR accompanying a story]
- [Source: `docs/prd.md` §NFR-M-5 (strict types), NFR-M-4 (coverage ≥ 80%)]
- [Source: `docs/stories/README.md` §E01 table row E01-S06 + dependency graph annotation]
- [Source: `docs/stories/E01-S01-api-skeleton-health-endpoint.md` — api/ patterns, ancestor-check codex gate, Zod schema pattern]
- [Source: `docs/stories/E01-S02-admin-web-skeleton-landing-page.md` — admin-web/ patterns, native-fetch-only rule, axe + Lighthouse gates]
- [Source: `CLAUDE.md` (root), `api/CLAUDE.md`, `admin-web/CLAUDE.md` — phase gate, 5-layer review, forbidden deps]
- [Source: `.github/workflows/api-ship.yml` — template for the codex-marker ancestor-check pattern]
- [Source: `.github/workflows/admin-ship.yml` — template for admin-web CI + drift-check integration point]
- [Source: `api/src/schemas/health.ts`, `api/src/functions/health.ts` — the existing endpoint the pipeline proves against]

---

## Anti-patterns to AVOID (Disaster Prevention)

> Each item is a real risk for the dev agent — flagged in advance.

1. **Do NOT hand-edit `api/openapi.json` after it's generated.** It's a committed artifact, not a source. Every change comes from Zod + registry. CI drift-check will fail any hand-edit.
2. **Do NOT let `admin-web/` import from `api/` at runtime.** Build-time file copy is the ONLY allowed cross-package data transfer. ESLint rule in T6 enforces this.
3. **Do NOT pick a codegen tool that emits non-strict TypeScript.** It will generate lint-warnings that either fail `--max-warnings 0` or force an exclusion that masks real issues.
4. **Do NOT bake a specific auth scheme (Firebase, Entra, Truecaller, NextAuth) into `ApiClient`.** E02-S04 composes auth. The `headers()` hook is the ONLY seam.
5. **Do NOT skip the drift checks "because the generated files are already committed."** Without CI enforcement, drift is inevitable within weeks.
6. **Do NOT write a custom `ApiError`-catching global interceptor in this story.** Error-handling UX belongs in a later story (probably E04 Trust layer). Throwing `ApiError` at the boundary is enough for now.
7. **Do NOT add retry / backoff / circuit-breaker logic.** YAGNI. First-principles: if `/v1/health` flakes, the landing page falls back. If a real endpoint flakes, the caller surfaces it. Resilience patterns land when they're actually needed.
8. **Do NOT use a naive `MARKER_SHA == HEAD_SHA` codex-marker check in any new workflow.** Verbatim ancestor-check + scope-diff from `api-ship.yml`. (Lesson from E01-S01 round 2.)
9. **Do NOT place any new workflow under `api/.github/` or `admin-web/.github/`.** Repo-root `.github/workflows/` only. (Lesson from E01-S01 C1.)
10. **Do NOT introduce Docker / docker-compose for local codegen.** The codegen must run from `pnpm` scripts on the developer's host. No docker-dependency in the inner loop.
11. **Do NOT add axios / ky / ofetch.** Native `fetch`. E01-S02 forbidden list stands.
12. **Do NOT snapshot-test the generated files.** Coverage excludes them; drift-check gates them; snapshots would double-gate and obscure the real failure.
13. **Do NOT couple the `ApiClient` to Next.js.** Pure TS + fetch. Re-usable in Vitest, Storybook, and future non-Next consumers.
14. **Do NOT commit any real secrets in the openapi config or test fixtures.** MSW mocks stay generic; no real api keys.
15. **Do NOT extend the spec to cover endpoints that don't exist yet.** Spec is derived from api/ source; there's only `/v1/health` today. Future endpoints land in their own stories.
16. **Do NOT bypass TDD.** RED → GREEN on the openapi-build test, the api-client test, and the landing-page test.
17. **Do NOT amend commits after push.** Fix forward. (Root CLAUDE.md.)
18. **Do NOT ship without re-running Lighthouse locally.** Verify AC-10 before merging; revert to build-time fetch if Performance regresses.
19. **Do NOT set `CLAUDE_OVERRIDE_REASON` for routine work.** Codex gate is authoritative. (Root CLAUDE.md.)
20. **Do NOT add a "temporary" paid-tier tool "just to ship the story."** ADR-0007 is binding. If brainstorm decides no OSS option is acceptable (unlikely), escalate before writing code.

---

## Definition of Done

- [x] All 11 acceptance criteria pass (verified by tests + manual smoke + green CI)
- [x] All 12 task groups (T1–T12) checked off
- [x] **api/**: `pnpm openapi:build && pnpm typecheck && pnpm lint && pnpm test:coverage` all green locally
- [x] **admin-web/**: `pnpm openapi:client && pnpm typecheck && pnpm lint && pnpm test:coverage && pnpm build && pnpm test:e2e && pnpm test:a11y && pnpm exec lhci autorun` all green locally
- [x] `api/openapi.json` committed; re-running `pnpm openapi:build` produces byte-identical output
- [x] `admin-web/src/api/generated/**` committed; re-running `pnpm openapi:client` produces byte-identical output
- [x] ADR-0009 committed + `Accepted`; ADR-0007 amended if needed to list new OSS deps
- [x] Coverage ≥ 80% lines/branches/functions/statements in both sub-projects (Vitest reports)
- [x] WCAG 2.1 AA zero violations on `/` (axe-core unchanged from E01-S02)
- [x] Lighthouse scores: Perf ≥ 90, A11y ≥ 95, BP ≥ 90, SEO ≥ 90 (unchanged from E01-S02)
- [x] Landing page footer shows a real 8-char hex SHA + semver, proving the round-trip
- [x] PR opened against `main`; both `api-ship.yml` and `admin-ship.yml` GREEN end-to-end
- [x] 5-layer review gate complete: `.codex-review-passed` marker present, SHA is ancestor of HEAD, scope-diff clean
- [x] PR description includes: summary, test plan, codegen-tool choice + rationale, axe + Lighthouse reports, deliberate-deviations list, link to ADR-0009
- [x] `docs/stories/README.md` E01 row reflects stories count 6 + dev-days 5 + total 45 (done in the same commit as this story file)
- [x] No new `.md` files beyond this story file, `docs/adr/0009-openapi-client-generator.md`, and README updates to api/ + admin-web/
- [x] No paid-SaaS dependencies introduced (grep against ADR-0007 forbidden list)
- [x] No runtime imports from admin-web/ to api/ (lint rule + test pass)

---

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent on first edit (e.g., "claude-sonnet-4-6 via /superpowers:executing-plans, 2026-04-XX")_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent — capture: selected codegen tool + spec-emission tool and why; any deviation from the plan and why; any deferred sub-task with rationale; CI run URLs (both workflows); Lighthouse + axe summaries; generated-client byte size; any new pattern not anticipated above (which becomes locked-in for future stories)._

### File List

_To be filled by dev agent — final list of created/modified files for the PR_

---

## Open Questions for Dev Agent (resolve during brainstorm — DO NOT silently decide)

> These six questions must be explicitly answered in the brainstorm session and captured in ADR-0009 before plan writing begins.

1. **Codegen tool choice — `openapi-typescript` (types-only) vs `@hey-api/openapi-ts` (types + runtime client) vs `@openapitools/openapi-generator-cli` (heaviest).** Tradeoff: bundle size vs runtime helper ergonomics vs community momentum. **My going-in recommendation:** `openapi-typescript`, with our hand-written `createApiClient` wrapper from T5. Reasons: zero runtime overhead (keeps Lighthouse green), exact control over the auth-header hook (matches AC-5 cleanly), wrapper is ~80 LOC (trivial to maintain and understand). Revisit if we discover we need interceptors or complex auth flows.

2. **Generated-client location — committed artifact (`admin-web/src/api/generated/` checked in) vs build-time regeneration (in `admin-web/.next/` or `admin-web/node_modules/.cache/`).** Tradeoff: committed is simpler for PR review and avoids CI chicken-and-egg on first commit; regenerated is cleaner long-term (no commit noise). **My recommendation:** committed. Small project, simpler PR review, drift-check in CI catches divergence. Revisit if commit noise becomes unmanageable at > 50 endpoints.

3. **OpenAPI emission on the api/ side — `@asteasolutions/zod-to-openapi` (registry-based) vs `zod-openapi` (inline `.openapi(...)` annotations on schemas) vs hand-written seed spec that api/ regenerates later.** Hand-written is rejected outright (a generated client from a hand-written spec is a lie detector that never fires — same rationale as the "pick E01-S06 before E03-S01" decision). **My recommendation:** `@asteasolutions/zod-to-openapi`. Registry is explicit about which routes are public; gives us a single `registry.ts` to review; forces discipline about keeping internal schemas out of the public spec.

4. **Runtime fetch wrapper — native `fetch` (per project conventions, no axios per E01-S02 forbidden list) vs `ofetch` vs `ky`.** Native `fetch` is the default per E01-S02. **My recommendation:** native `fetch`. Zero dep; Node 22 has native fetch; Next.js extends it with caching knobs we'd give up with a wrapper. Explicitly confirm in brainstorm that no edge case requires `ofetch` / `ky`.

5. **CI layout — extend both existing `api-ship.yml` and `admin-ship.yml` with drift checks vs add a new `.github/workflows/contracts-ship.yml` that both depend on.** GitHub Actions does not natively support cross-workflow dependencies, so option (a) extending each is simpler. **My recommendation:** extend each workflow; keep the codex-marker ancestor-check step in both; the `paths:` filter on admin-ship.yml should additionally trigger on `api/openapi.json` changes so spec changes force admin-web regen + CI.

6. **Auth-header injection — hook shape `{ headers: () => Record<string, string> | Promise<Record<string, string>> }` vs middleware-array pattern `{ middleware: [tokenInjector, retry, ...] }`.** Tradeoff: simple hook ships now; middleware array scales better for future concerns. **My recommendation:** simple hook. YAGNI for middleware today; we can add middleware later when we have at least 2 concerns that need it (retry + auth would be the trigger). The hook is compatible with future middleware — a middleware array can be implemented internally behind the hook's callers.

**Tentative recommended stack (all subject to brainstorm confirmation):**
- Spec emission: `@asteasolutions/zod-to-openapi@^7` + `tsx` CLI in `api/src/openapi/build.ts`
- Spec validation: `@stoplight/spectral-cli@^6` with built-in `oas` ruleset
- Client codegen: `openapi-typescript@^7`
- Client wrapper: hand-written `admin-web/src/api/client.ts` (~80 LOC, native `fetch`, hook-based headers)
- Testing: `msw@^2` for API-contract tests
- Commit strategy: committed spec + committed generated client; CI drift-checks both
- CI layout: extend both existing ship.yml files; preserve ancestor-check codex gate verbatim
