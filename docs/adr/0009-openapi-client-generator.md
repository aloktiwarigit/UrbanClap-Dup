# ADR-0009: OpenAPI client generator stack — openapi-typescript + openapi-fetch + zod-to-openapi

**Status:** Accepted
**Date:** 2026-04-18
**Story:** E01-S06
**Supersedes:** none
**Superseded by:** none

## Context

E01-S06 establishes a cross-sub-project typed API client so every future admin-web page calls `api/` with compile-time type safety. The repo is constrained by:

- ADR-0007 (zero paid SaaS) — every tool must be OSS.
- E01-S02 forbidden list — no axios / ky / ofetch; native `fetch` only.
- TS strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`; ESLint `--max-warnings 0`.
- Lighthouse Performance ≥ 90 on the admin-web landing page; runtime overhead must be minimal.
- Codex CLI as authoritative review gate — tooling choices must be defensible in cross-model review.

We evaluated three codegen approaches, two emission approaches, and two auth-hook shapes.

## Decision

**Codegen:** `openapi-typescript@^7` (types-only) + `openapi-fetch@^0.13` (runtime).

**Spec emission:** `@asteasolutions/zod-to-openapi@^7` with registry-based registration.

**Spec validation:** `@stoplight/spectral-cli@^6` with `spectral:oas` ruleset in CI; `@apidevtools/swagger-parser@^10` for in-test parseability.

**Auth-header hook:** `openapi-fetch` middleware (`client.use({ onRequest, onResponse })`).

**Artifact strategy:** committed (`api/openapi.json`, `admin-web/src/api/generated/**`); CI drift-checks both.

**HTTP test mocking:** `msw@^2` via `msw/node` `setupServer`.

## Alternatives considered

| Candidate | Rejected because |
|---|---|
| `@hey-api/openapi-ts` (types + runtime) | Pre-1.0; larger runtime than `openapi-fetch`; no material advantage over the openapi-typescript pair. |
| `@openapitools/openapi-generator-cli` | 15–30 KB runtime, heavy structure, over-engineered for ~10 foreseeable endpoints. |
| Hand-rolled 80-LOC `ApiClient` wrapper | Custom maintenance burden; `openapi-fetch` is ~2 KB and battle-tested with a built-in middleware seam. |
| `zod-openapi` (inline `.openapi()` on schemas) | Couples Zod shape to OpenAPI metadata; registry-based emission keeps public-API surface explicit. |
| Regenerate at build time (not committed) | Obscures review; CI would need a special "pretend no drift" path; drift only detectable at runtime. |
| Hand-written seed OpenAPI spec | A generated client from a hand-written spec never fails on drift — lie detector that doesn't fire. |
| `ofetch` / `ky` wrapper | Violates E01-S02 native-fetch-only lock; no advantage for our use case. |
| Simple `headers: () => Record<string,string>` callback | Not extensible to future retry / observability middleware without a breaking change. |

## Consequences

- `admin-web/` gains a `~2` KB runtime + `schema.d.ts` types; Lighthouse budget preserved.
- Every new Zod schema + route requires a one-line addition to `api/src/openapi/registry.ts`.
- Every admin-web API call goes through `apiClient` exported from `admin-web/src/api/index.ts`.
- CI drift-check on every PR; schema changes must be followed by `pnpm -C api openapi:build` + commit.

## Revisit criteria

Replace this stack if any of these become true:
- Runtime overhead from `openapi-fetch` + types exceeds 8 KB gzipped in the admin-web production build.
- Spec regeneration time exceeds 2 s on a 100-endpoint spec on a modern dev machine.
- `openapi-typescript` drops OpenAPI 3.1 support.
- A new OSS alternative materially reduces maintenance burden.

## Links

- Story: `docs/stories/E01-S06-openapi-client-wiring.md`
- Design: `docs/superpowers/specs/2026-04-18-e01-s06-openapi-client-wiring-design.md`
- ADR-0001, ADR-0007, ADR-0008
