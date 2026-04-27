# Story E04-S01: Trust Dossier component (customer-app + admin-web)

Status: shipped (PR #30, merged 2026-04-23, commit 93349c0) — **retroactive docs**

> **Epic:** E04 — Trust Layer (Customer) (`docs/stories/README.md` §E04)
> **Sprint:** S2 (wk 3–4) · **Estimated:** ≤ 1.5 dev-days · **Priority:** P0 (trust wedge)
> **Sub-projects:** `api/` + `customer-app/` + `admin-web/`
> **Ceremony tier:** Foundation (cross-cutting trust component, public API, three sub-projects)
> **Plan file:** `plans/E04-S01-trust-dossier.md` (1476 lines, lives in repo)
> **Retroactive note:** PR #30 shipped with its plan file (`plans/E04-S01-trust-dossier.md`) but no `docs/stories/E04-S01-*.md` file. This story is being authored after-the-fact from the merged PR (issue #115). Acceptance criteria are reverse-engineered from the merged code. The plan file is canonical for implementation detail.

---

## Story

As a **customer browsing services** and as an **owner reviewing an order in the admin dashboard**,
I want to see a unified Trust Dossier panel for the technician (photo, verified Aadhaar / background-check badges, certifications, languages, years in service, jobs completed, last 3 reviews),
so that **I can build trust in the technician before booking and the owner can audit profile state inline without leaving the order view** (FR-3.1).

---

## Acceptance Criteria

### AC-1 · Public dossier endpoint
- `GET /v1/technicians/{id}/profile` (authLevel `anonymous`) returns 200 with a Zod-validated `TechnicianDossier` body
- Response is read from the Cosmos `technicians` container (point-read by partition key = `id`); PII fields (phone, address, raw Aadhaar number) are stripped — schema only allows `displayName`, `photoUrl?`, `verifiedAadhaar`, `verifiedPoliceCheck`, `trainingInstitution?`, `certifications[]`, `languages[]`, `yearsInService`, `totalJobsCompleted`, `lastReviews[]` (max 3)
- `displayName` falls back to legacy `name` field for existing Cosmos docs
- Missing technician → 404 `NOT_FOUND`
- Schema validation failure → 404 `NOT_FOUND` (do not leak Zod error shape on a public endpoint)
- Response includes `Cache-Control: public, max-age=60` (low-mutation profile data)

### AC-2 · `TrustDossierCard` Compose component (customer-app, two variants)
- `TrustDossierCard(uiState: TrustDossierUiState, compact: Boolean, modifier: Modifier = Modifier)` is a stateless composable placed in `ui/shared/`
- States: `Loading` (spinner), `Loaded(TechnicianProfile)` (compact or expanded), `Error(message)` (subdued), `Unavailable` (lock icon + "technician will be assigned shortly")
- Compact (≤ 80 dp tall): 40 dp avatar + name + verified badge chips
- Expanded: 64 dp avatar + name + jobs/years line + badges row + certifications list + languages list + last reviews block
- Avatar rendered via Coil `AsyncImage`; circle clip; falls back gracefully on null `photoUrl`

### AC-3 · `TrustDossierViewModel` lifecycle
- `loadProfile(technicianId)` transitions `Unavailable → Loading → Loaded | Error`
- Initial state is `Unavailable` (so screens that mount before a technician id is known render the assigning placeholder)
- ViewModel collects `GetTechnicianProfileUseCase(id)` flow on `viewModelScope`
- Failures map exception message to `Error.message`

### AC-4 · Customer-app integration points
- `ServiceDetailScreen` shows the **compact** card in place of the legacy `trust_dossier_stub` (Lock icon + stub text)
- `BookingConfirmedScreen` shows the **expanded** card before the "Back to home" CTA
- Both currently render the `Unavailable` state because no technician is bound to the booking until E05-S02 dispatch completes; the card surface area is locked in for the dispatch story to wire into

### AC-5 · Admin-web `TrustDossierPanel` (collapsible, lazy-fetch)
- `'use client'` component placed alongside `OrderSlideOver`
- Renders a collapsed "▸ Trust Profile" toggle under the technician name; lazy-fetches `${NEXT_PUBLIC_API_BASE_URL}/api/v1/technicians/{id}/profile` on first expand
- Renders dossier with same field set as Android (name, jobs/years, badges, certifications, languages, last reviews)
- Loading + error states inline; collapses cleanly with no layout shift

### AC-6 · Hilt DI reuses CatalogueModule singletons
- `TechnicianProfileModule` injects unqualified `Moshi` + `OkHttpClient` provided by the existing `CatalogueModule` — does not declare a second pair (avoids duplicate-binding compile error)
- `@Binds TechnicianProfileRepository ↔ TechnicianProfileRepositoryImpl`

### AC-7 · TDD test coverage
- `GetTechnicianProfileUseCaseTest` — delegates + propagates failure (2 tests)
- `TechnicianProfileRepositoryImplTest` — DTO→domain mapping + IOException → `Result.failure` (2 tests)
- `TrustDossierViewModelTest` — initial state + Loaded + Error (3 tests)
- `TrustDossierCardPaparazziTest` — 4 `@Ignored` snapshot stubs (compact_unavailable, expanded_unavailable, compact_loaded, expanded_loaded); goldens recorded on CI Linux per `docs/patterns/paparazzi-cross-os-goldens.md`

### AC-8 · Codex review passed
- `.codex-review-passed` marker shipped in PR #30
- P1 fix landed in same PR: `displayName` fallback to `name` for existing Cosmos docs

---

## Tasks / Subtasks (as actually shipped)

> Implementation merged via PR #30. The plan file `plans/E04-S01-trust-dossier.md` is the canonical step-by-step (15 tasks). Below mirrors the work-stream summary.

- [x] **WS-A — API schema + endpoint** (`api/src/schemas/technician-dossier.ts`, `api/src/functions/technicians.ts`)
- [x] **WS-B — Android domain layer** (TDD red→green: `TechnicianProfile`, `TechnicianReview`, `TechnicianProfileRepository`, `GetTechnicianProfileUseCase`)
- [x] **WS-C — Android data layer** (TDD red→green: DTO with `toDomain()`, `TechnicianProfileApiService`, `TechnicianProfileRepositoryImpl`, `TechnicianProfileModule`)
- [x] **WS-D — UI + admin-web** (TDD red→green: `TrustDossierUiState`, `TrustDossierViewModel`, `TrustDossierCard`; admin-web `TechnicianDossier` types + `TrustDossierPanel` + `OrderSlideOver` wire-in)
- [x] **WS-E — ktlint + smoke gate + Codex review + Paparazzi CI record**

---

## Dev Notes

### Why `displayName` fallback to `name`
Existing Cosmos documents from earlier seed data and from the KYC flow (E02-S03) store the technician's name under `name`, not `displayName`. The dossier endpoint had to gracefully handle both shapes to avoid surfacing 404s for valid technicians during the rollout window. The fallback is a one-line change in `getTechnicianProfileHandler` and is the only P1 finding from Codex review on PR #30.

### Why Coil on Android (not Glide)
Coil is already a transitive dep via androidx; Glide would have added a second image-loader. The Trust Dossier shipped before any other story added an image loader, so Coil became the project default by precedent. No ADR was filed because the choice was determined by what was already on the classpath.

### Why the card defaults to `Unavailable`
At the time of this story, dispatch (E05-S02) had not yet shipped, so no booking ever has a real `technicianId` yet. The card needed to render *something* so that screen layout could be locked in and Paparazzi goldens recorded on the same surface area E05-S03 will eventually fill. The `Unavailable` placeholder doubles as the post-payment "your technician will be assigned shortly" state.

### Why no `@AuthOkHttpClient` qualifier
The dossier endpoint is `authLevel: anonymous` — anyone can fetch a technician's public profile by id. No Firebase ID token needed; the unqualified `OkHttpClient` from `CatalogueModule` (no auth interceptor) is correct.

---

## Definition of Done

- [x] `cd api && pnpm typecheck && pnpm test` green
- [x] `cd customer-app && ./gradlew testDebugUnitTest ktlintCheck assembleDebug` green
- [x] `cd admin-web && pnpm typecheck && pnpm lint && pnpm test` green
- [x] Pre-Codex smoke gates exited 0
- [x] `.codex-review-passed` marker shipped in PR #30
- [x] Paparazzi goldens recorded on CI Linux and committed
- [x] CI green on `main` after merge (commit 93349c0)

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per PR #30 commit attribution)

### Completion Notes
PR #30 merged 2026-04-23 22:14 UTC as commit 93349c0. One Codex P1 fixed in-PR (`displayName` fallback). Paparazzi goldens recorded via `paparazzi-record.yml` workflow_dispatch on CI Linux.

### File List
See PR #30: 14 files added under `customer-app/`, 3 files added under `admin-web/`, 4 files added/modified under `api/`, 12 strings added to `customer-app/.../strings.xml`, plus the canonical `plans/E04-S01-trust-dossier.md` plan file. (PR #30 also bundled an unrelated SSC-levy story; that work is tracked elsewhere.)
