# Story E03-S01: Service catalogue — data model, API, admin CRUD, seed

Status: shipped (PR #12, merged 2026-04-20, commit 5f23ad3) — **retroactive docs**

> **Epic:** E03 — Service Discovery + Booking Flow (`docs/stories/README.md` §E03)
> **Sprint:** S2 (wk 3–4) · **Estimated:** ≤ 1 dev-day · **Priority:** P0
> **Sub-projects:** `api/`, `admin-web/`
> **Ceremony tier:** Foundation (introduces two new Cosmos containers, the public read API, and the admin CRUD surface that every later booking story consumes)
> **Prerequisite:** E01-S06 (typed OpenAPI client) — admin-web consumes the regenerated client.
> **Retroactive note:** This story file is being written *after* the implementation merged. PR #12 shipped without `docs/stories/E03-S01-*.md` ever landing in main. The accompanying plan `plans/E03-S01.md` was committed at implementation time and is unchanged. Acceptance criteria below are reverse-engineered from the merged code (see PR #12 file list and `api/src/cosmos/catalogue-repository.ts`, `api/src/functions/catalogue-public.ts`, `api/src/functions/catalogue-admin.ts`, `api/src/cosmos/seeds/catalogue.ts` for the canonical implementation).

---

## Story

As a **customer browsing the home screen**,
I want a service catalogue with categories, services, fixed prices, includes, and add-ons,
so that **I can pick a service knowing exactly what I'm paying for** (FR-2.1).

As an **owner / ops manager**,
I want admin-web pages to create, edit, and toggle categories and services,
so that **I can manage the catalogue without a deploy** (FR-2.1, OQ-3 seed).

---

## Acceptance Criteria

### AC-1 · Cosmos schema for catalogue
- **Given** the API process boots
- **Then** two Cosmos containers exist: `service_categories` (partitioned by `/id`) and `services` (partitioned by `/categoryId`)
- **And** Zod schemas in `api/src/schemas/service-category.ts` and `api/src/schemas/service.ts` validate every read/write
- **And** the `Service` schema includes `id`, `categoryId`, `name`, `description`, `basePrice` (paise, integer), `durationMinutes`, `imageUrl`, `includes` (string[]), `addOns` (`{name, price}[]`), `active` (boolean)
- **And** the `ServiceCategory` schema includes `id`, `name`, `imageUrl`, `displayOrder`, `active`

### AC-2 · Public read API
- **Given** the seeded catalogue exists
- **When** a client calls `GET /v1/categories`
- **Then** the response is `200 { categories: [{ ...category, services: [...] }] }` — categories with their services nested in a single round-trip
- **And** `GET /v1/services/{id}` returns `200 {service}` for an existing service id, `404` otherwise
- **And** the public endpoints require no auth header (catalogue is public)

### AC-3 · Admin CRUD API (auth-gated)
- **Given** an admin user with role `super-admin` or `ops-manager` (auth stub during E03; promoted to real auth in E02-S04)
- **When** they call admin endpoints under `/v1/admin/catalogue/*`
- **Then** they can create, update, and toggle categories and services
- **And** every admin write returns `201`/`200` with the updated record
- **And** every admin endpoint returns `401` without a valid Bearer token, `403` for insufficient role

### AC-4 · Idempotent seed
- **Given** the API is started fresh
- **When** the seed function in `api/src/cosmos/seeds/catalogue.ts` runs
- **Then** it upserts 5 categories × 3 services each (AC repair, deep-cleaning, plumbing, electrical, pest-control — per OQ-3)
- **And** running the seed twice produces the same final state (idempotent, no duplicates)

### AC-5 · OpenAPI registration + typed client regeneration
- **Given** the new endpoints exist
- **Then** they are registered in `api/src/openapi/registry.ts`
- **And** `api/openapi.json` and `admin-web/src/api/generated/openapi.json` + `schema.d.ts` reflect the new paths/types
- **And** admin-web consumes the typed client via `serverApi` helper for SSR pages

### AC-6 · Admin-web catalogue UI
- **Given** an admin is signed in
- **When** they navigate to `/(dashboard)/catalogue`
- **Then** they see a list of categories (cards) sorted by `displayOrder`
- **And** clicking a category shows its services + create/edit/toggle controls
- **And** the create-service form (`ServiceForm.tsx`) validates name, basePrice (paise), duration, includes, addOns
- **And** a server action (`actions.ts`) posts to the admin API with the typed client

### AC-7 · Test coverage
- **Given** the implementation
- **Then** API has unit tests for both schemas, the repository (mocked Cosmos), the public handler, and the admin handler
- **And** the test suite reports ≥ 105 passing tests on PR #12 CI (per merged-PR description)
- **And** Vitest coverage stays above the project's ≥ 80% line threshold

### AC-8 · Public catalogue is CDN-cacheable
- **Given** `GET /v1/categories` is read-only and seeded data is small
- **Then** the handler is a pure read with no per-user state (no auth, no cookies)
- **And** the response is suitable for CDN caching by a future ADR (out of scope here; AC just records the architectural intent)

---

## Tasks / Subtasks (as actually shipped)

> Implementation merged via PR #12. Tasks below match the plan at `plans/E03-S01.md` and the code in main.

- [x] **T1 — Cosmos client + container refs** (`api/src/cosmos/client.ts`)
- [x] **T2 — Zod schemas**
  - [x] T2.1 `api/src/schemas/service-category.ts`
  - [x] T2.2 `api/src/schemas/service.ts`
  - [x] T2.3 `api/tests/schemas/service-category.test.ts`
  - [x] T2.4 `api/tests/schemas/service.test.ts`
- [x] **T3 — Catalogue repository** (`api/src/cosmos/catalogue-repository.ts` + `api/tests/catalogue-repository.test.ts`)
- [x] **T4 — Public read API** (`api/src/functions/catalogue-public.ts` + `api/tests/catalogue-public.test.ts`)
- [x] **T5 — Admin CRUD API** (`api/src/functions/catalogue-admin.ts` + `api/tests/catalogue-admin.test.ts`)
- [x] **T6 — Idempotent seed** (`api/src/cosmos/seeds/catalogue.ts` — 5×3 services)
- [x] **T7 — OpenAPI registration** (`api/src/openapi/registry.ts`)
- [x] **T8 — Regenerate typed client** → `admin-web/src/api/generated/openapi.json` + `schema.d.ts`
- [x] **T9 — Admin-web catalogue pages**
  - [x] T9.1 `app/(dashboard)/catalogue/page.tsx` — categories list
  - [x] T9.2 `app/(dashboard)/catalogue/[categoryId]/page.tsx` — services list
  - [x] T9.3 `app/(dashboard)/catalogue/[categoryId]/services/new/page.tsx` — create
  - [x] T9.4 `app/(dashboard)/catalogue/[categoryId]/services/[serviceId]/page.tsx` — edit (server) + `EditServiceClient.tsx`
  - [x] T9.5 `components/catalogue/CategoryCard.tsx`, `components/catalogue/ServiceForm.tsx`
  - [x] T9.6 `app/(dashboard)/catalogue/actions.ts` — server actions
  - [x] T9.7 `lib/serverApi.ts` — server-side typed client helper
- [x] **T10 — Codex review + CI green** (PR #12 CI passed; `.codex-review-passed` shipped)

---

## Dev Notes

### What was actually shipped (per PR #12 file list)
- 14 API source files + 5 test files (105 tests passing per PR description)
- 7 admin-web source files + regenerated OpenAPI client (1068 added lines in `openapi.json`, 580 in `schema.d.ts`)
- `api/package.json`: added `@azure/cosmos` dependency
- 5 categories × 3 services seeded (AC repair, deep-cleaning, plumbing, electrical, pest-control)

### Why this story is being written retroactively
- During the 2026-04-26 story-completeness audit (`docs/audit/story-completeness-2026-04-26.md`), the audit found that PR #12 (E03-S01) shipped with the plan committed (`plans/E03-S01.md`) but no story file ever landing in main.
- The Karnataka Platform Workers Act 2025 + DPDP Act both require traceability between processing logic and the requirement that motivated it. This rescue PR closes the audit hole.

### Patterns referenced (per plan)
- N/A — this is an API + Next.js story; no Android-specific gotchas (`docs/patterns/` files are Android-only).

---

## Definition of Done

- [x] `cd api && pnpm typecheck && pnpm lint && pnpm test` green (verified on PR #12 CI)
- [x] `cd admin-web && pnpm typecheck && pnpm lint` green
- [x] All AC pass via test assertions (105 unit tests on the API side)
- [x] Pre-Codex smoke gate exited 0 (PR #12 CI)
- [x] `.codex-review-passed` marker shipped in PR #12
- [x] CI green on `main` after merge (commit 5f23ad3)

---

## Dev Agent Record

### Agent Model Used
Claude (per PR #12 commit attribution)

### Completion Notes
PR #12 merged 2026-04-20 at 02:39 UTC as commit 5f23ad3. Codex review passed. No P1 findings recorded.

### File List
See PR #12: 14 API files (schemas, repository, public + admin handlers, seed), 7 admin-web files (4 pages, 2 components, server actions, serverApi helper), regenerated OpenAPI client (`openapi.json`, `schema.d.ts`), `package.json` dependency bump.
