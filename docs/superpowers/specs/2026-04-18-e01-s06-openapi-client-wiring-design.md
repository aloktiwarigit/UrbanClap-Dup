# E01-S06 Design — Cross-sub-project OpenAPI client generator wiring

**Date:** 2026-04-18
**Story:** `docs/stories/E01-S06-openapi-client-wiring.md`
**Branch:** `E01-S06-openapi-client-wiring`
**Status:** Approved (brainstorm complete); ready for plan writing

---

## 1. Purpose

Install a typed, drift-gated, OSS-only codegen pipeline that turns `api/`'s Zod schemas into a consumable TypeScript client in `admin-web/`, so every future admin-web story calls `api/` with compile-time type safety and schema drift fails CI instead of reaching a customer. First real consumer is E03-S01 (catalogue endpoints).

This is a foundation enabler — zero user-visible functionality; ~30 downstream stories depend on the seams installed here.

---

## 2. Locked decisions (six open questions, resolved)

| # | Question | Decision | Rationale |
|---|---|---|---|
| 1 | Codegen tool | **`openapi-typescript@^7` (types) + `openapi-fetch@^0.13` (runtime)** | Canonical pair, same maintainer, ~2 KB runtime, native `fetch`, first-class middleware seam. Strictly better than hand-rolled ~80-LOC wrapper — no custom code to maintain, battle-tested dep, cleaner AC-5/OQ-6 resolution. |
| 2 | Generated-artifact location | **Committed** — `api/openapi.json` + `admin-web/src/api/generated/` | Simpler PR review; CI drift-check catches divergence; revisit if commit noise unmanageable at > 50 endpoints. |
| 3 | Spec emission | **`@asteasolutions/zod-to-openapi@^7`** (registry-based) + `tsx` CLI | Explicit public-API surface via a single `registry.ts`; forces discipline about internal vs public schemas; well-maintained. |
| 4 | Fetch runtime | **Native `fetch` via `openapi-fetch`** | No axios/ky/ofetch (E01-S02 lock); Node 22 + Next.js 15 native fetch is sufficient; Next fetch-cache extensions preserved. |
| 5 | CI layout | **Extend both existing `.github/workflows/api-ship.yml` and `admin-ship.yml`** | GHA lacks cross-workflow deps; existing ancestor-check codex gate stays verbatim; `paths:` filter on `admin-ship.yml` additionally triggers on `api/openapi.json` so spec changes force client regen + CI. |
| 6 | Auth-header hook | **`openapi-fetch` middleware** — `client.use({ onRequest })` | Middleware-array shape comes for free (extensible: auth + retry + observability); E02-S04 composes an `onRequest` that adds `Authorization`; no bespoke callback contract. |

Also locked (non-question design choices):
- **Workspace model:** no pnpm workspace is added in this story. Scripts use `pnpm -C api …` / `pnpm -C admin-web …` from repo root, matching the existing CI `working-directory:` pattern. A workspace can be retrofitted later in a dedicated tooling story if the root-level DX justifies it.
- **Validator:** `@stoplight/spectral-cli@^6` with built-in `spectral:oas` ruleset in CI; `@apidevtools/swagger-parser@^10` in the Vitest emission test. Two distinct concerns (quality vs parseability) — two tools.
- **Testing:** `msw@^2` via `msw/node` `setupServer()` for all `api-client.test.ts` mocking. Locks the pattern for every future API-calling test in admin-web.
- **RSC round-trip:** admin-web landing page calls `/v1/health` server-side. In CI, the quality-gate job does NOT boot api/ during `next build` — footer falls back to `(local)` and that's the intended contract. The **e2e-and-a11y job** boots api/ via `playwright.config.ts` `webServer` and asserts the real SHA + semver in the footer. This separation keeps the build job hermetic and the e2e job honest.

---

## 3. Component sketch (for the plan to consume)

### 3.1 api/ side

```
api/
├── package.json                              + openapi:build script; + zod-to-openapi, swagger-parser, spectral-cli
├── openapi.json                              NEW — committed artifact; deterministic output
├── src/
│   └── openapi/
│       ├── registry.ts                       NEW — OpenAPIRegistry instance; registerPath() for /v1/health; register(HealthResponseSchema)
│       └── build.ts                          NEW — tsx CLI; imports registry; writes openapi.json with sortKeys + 2-space indent + trailing newline
└── tests/
    └── openapi-build.test.ts                 NEW — validates 3.1 parse, schema-equivalence to HealthResponseSchema, byte-determinism across two runs
```

### 3.2 admin-web/ side

```
admin-web/
├── package.json                              + openapi:client script; + openapi-typescript, openapi-fetch, msw
├── openapi-ts.config.ts                      NEW — openapi-typescript config pointing at src/api/generated/openapi.json
├── eslint.config.mjs                         + no-restricted-imports rule blocking api/src/** resolutions
├── vitest.config.ts                          + coverage.exclude for src/api/generated/**
├── playwright.config.ts                      + webServer boots api/ (pnpm -C ../api start) on :7071 for e2e project only
├── app/
│   └── page.tsx                              MODIFY — server-side ApiClient.GET('/v1/health') in RSC; try/catch with (local) fallback
├── src/
│   └── api/
│       ├── index.ts                          NEW — barrel: export { apiClient, ApiError, createApiClient }
│       ├── client.ts                         NEW — createClient<paths>({ baseUrl, fetch }); exposes middleware hook; ApiError shape
│       └── generated/
│           ├── openapi.json                  NEW — build-step copy of api/openapi.json (copied by admin-web's openapi:client script)
│           └── schema.d.ts                   NEW — openapi-typescript output; single paths type
└── tests/
    ├── api-client.test.ts                    NEW — msw/node setupServer; 5 sub-assertions from AC-5 + middleware onRequest/onResponse
    ├── no-cross-package-imports.test.ts      NEW — glob src/**/*.{ts,tsx}; grep-assert no ../../../api/ imports
    ├── landing.page.test.tsx                 MODIFY — mock createApiClient; assert footer has sha + semver on success, (local) on throw
    └── e2e/landing.spec.ts                   MODIFY — assert /[a-f0-9]{8}/ AND /\d+\.\d+\.\d+/ in footer
```

### 3.3 Repo root

```
docs/adr/0009-openapi-client-generator.md     NEW — captures tool choices + revisit criteria
.github/workflows/api-ship.yml                MODIFY — + spectral lint step + openapi drift-check step, both before codex-marker gate
.github/workflows/admin-ship.yml              MODIFY — + paths-filter trigger on api/openapi.json; + client drift-check step in quality-gate job
```

---

## 4. Data flow (spec → client → call site)

```
┌─ api/src/schemas/health.ts ──┐
│  HealthResponseSchema (Zod)  │
└──────────────┬───────────────┘
               │ registered in
               ▼
┌─ api/src/openapi/registry.ts ─┐
│  OpenAPIRegistry instance      │
│  + schemas + paths             │
└──────────────┬─────────────────┘
               │ pnpm -C api openapi:build  (tsx CLI)
               ▼
┌─ api/openapi.json (committed) ┐
│  OpenAPI 3.1 document         │
│  sortKeys, deterministic      │
└──────────────┬────────────────┘
               │ copied by openapi:client script
               ▼
┌─ admin-web/src/api/generated/openapi.json ─┐
│  same bytes as api/openapi.json            │
└──────────────┬─────────────────────────────┘
               │ pnpm -C admin-web openapi:client  (openapi-typescript CLI)
               ▼
┌─ admin-web/src/api/generated/schema.d.ts ──┐
│  export interface paths { ... }            │
└──────────────┬─────────────────────────────┘
               │ imported by
               ▼
┌─ admin-web/src/api/client.ts ──┐
│  createClient<paths>({         │
│    baseUrl,                    │
│    fetch,                      │
│  });                           │
│  .use({ onRequest, ... })      │
└──────────────┬─────────────────┘
               │ barrel re-export
               ▼
┌─ admin-web/src/api/index.ts ──┐
│  export { apiClient, ... }    │
└──────────────┬────────────────┘
               │ consumed by
               ▼
┌─ admin-web/app/page.tsx (RSC) ┐
│  await apiClient.GET(         │
│    "/v1/health"               │
│  )                            │
└───────────────────────────────┘
```

Drift is prevented at two CI chokepoints:
1. `api-ship.yml`: `pnpm -C api openapi:build && git diff --exit-code api/openapi.json` — schema changes force spec commit
2. `admin-ship.yml`: `pnpm -C admin-web openapi:client && git diff --exit-code admin-web/src/api/generated/` — spec changes force client commit

---

## 5. Error-handling contract

Only one error path is in scope for this story: **non-2xx responses throw `ApiError`**.

```ts
class ApiError extends Error {
  readonly status: number;
  readonly url: string;
  readonly method: string;
  readonly body: unknown;
}
```

- `openapi-fetch` returns `{ data, error, response }` discriminated union; the wrapper in `client.ts` translates to throw-on-error semantics via an `onResponse` middleware that rethrows an `ApiError`.
- No retries, no circuit breakers, no backoff in this story (YAGNI; revisit when a caller actually needs resilience).
- The RSC landing-page round-trip catches `ApiError` at the call site and falls back to `(local)` — that's the ONLY production caller in this story; every future caller handles `ApiError` as appropriate to its UX.

Sentry is NOT called from `client.ts` or `page.tsx`. Error instrumentation is a later observability story.

---

## 6. Testing strategy

| Layer | File | Tool | What it proves |
|---|---|---|---|
| Spec emission | `api/tests/openapi-build.test.ts` | Vitest + swagger-parser | Spec is valid 3.1, matches Zod shape, byte-deterministic |
| Spec quality | `api-ship.yml` spectral step | Spectral CLI | OpenAPI best practices (no missing descriptions, valid status codes, etc.) |
| Spec drift | `api-ship.yml` drift step | `git diff --exit-code` | Committed spec matches what schemas would produce now |
| Client drift | `admin-ship.yml` drift step | `git diff --exit-code` | Committed generated client matches what spec would produce now |
| Client behavior | `admin-web/tests/api-client.test.ts` | Vitest + msw/node | Factory + middleware + error paths + JSON parsing |
| Cross-package isolation | `admin-web/tests/no-cross-package-imports.test.ts` | Vitest + fs globbing | No `admin-web/**` file imports from `../../../api/` |
| Landing unit | `admin-web/tests/landing.page.test.tsx` | Vitest + RTL | Footer rendering on success + (local) fallback on throw |
| Landing e2e | `admin-web/tests/e2e/landing.spec.ts` | Playwright (api/ booted via webServer) | Real RSC round-trip; SHA + semver in footer |
| A11y + Lighthouse | existing tests | axe-core + lhci | No regression from AC-10 thresholds |

Coverage: generated code excluded; everything else held to the existing 80% threshold from E01-S01 + E01-S02.

---

## 7. Task ordering (for plan writing)

1. **ADR-0009** — commit first; establishes the toolchain-of-record before any code.
2. **api/ side** — emission library + registry + build script + test + commit `openapi.json`. One branch checkpoint here (no push).
3. **api-ship.yml** — spectral step + drift step. Manual local run to confirm green.
4. **admin-web/ side** — codegen tool + config + generated client committed.
5. **ApiClient wrapper** (`src/api/client.ts`) + barrel + unit tests.
6. **ESLint rule** + cross-package-import test.
7. **Landing page** — RSC fetch + fallback + unit test update.
8. **Playwright webServer** update + e2e assertion update.
9. **Lighthouse local re-run** (AC-10 gate).
10. **admin-ship.yml** — drift step + paths-filter for `api/openapi.json`.
11. **READMEs** — api/ and admin-web/ sections.
12. **5-layer review gate** → push → PR → CI green → merge.

---

## 8. Patterns that become locked-in for future stories

- Every Zod schema + route registers in `api/src/openapi/registry.ts`.
- Every admin-web API call uses `apiClient` via the `src/api` barrel — never deep-imports generated code; never hand-rolls `fetch('/v1/...')`.
- Every API-contract test uses `msw/node`.
- Every cross-sub-project workflow extension preserves the ancestor-check codex-marker pattern verbatim.
- Every toolchain choice (codegen, emission, validator) gets an ADR; swapping requires a superseding ADR.

---

## 9. Out of scope (explicit)

- Kotlin client for `customer-app/` + `technician-app/` — separate future story when first Android→api/ call lands.
- Retry / backoff / circuit-breaker middleware — add when first real caller needs it.
- Auth scheme wiring — E02-S04.
- Any new `/v1/` endpoint beyond existing `/v1/health` — each lands in its own story.
- Hand-written "SDK" over the generated client — revisit after 20+ endpoints if ergonomics warrant it.
- pnpm workspace setup — standalone tooling story if + when root-level DX justifies it.

---

## 10. Revisit criteria (for ADR-0009)

Revisit the codegen stack if any of these become true:
- Bundle overhead from `openapi-fetch` + generated types exceeds 8 KB gzipped in the admin-web production build.
- Spec regeneration time exceeds 2 s on a 100-endpoint spec on a modern dev machine.
- `openapi-typescript` drops OpenAPI 3.1 support or stops tracking the spec.
- A new OSS tool appears that materially reduces maintenance burden or bundle size.

---

**Ready for plan writing.**
