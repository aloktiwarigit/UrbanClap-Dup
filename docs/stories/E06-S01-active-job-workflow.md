# Story E06-S01: Technician active-job workflow — state machine + offline queue + Maps nav

Status: shipped (PR #31, merged 2026-04-22 · SHA `b11bb28`)

> **Epic:** E06 — Service Execution + Payment (`docs/stories/README.md` §E06)
> **Sprint:** S3 (wk 5–6) · **Estimated:** ≤ 1.5 dev-days · **Priority:** **P0 — blocks E06-S02, E06-S03**
> **Sub-projects:** `technician-app/`, `api/`
> **Ceremony tier:** Foundation (state machine + new module + cross-app contract — full plan + Codex; `/security-review` not triggered)
> **Implementation plan:** `plans/E06-S01.md`
>
> **Rescue note (2026-04-26):** This story file was generated retroactively from PR #31 + the existing `plans/E06-S01.md`. The implementation has been live on `main` since 2026-04-22; this document closes the BMAD audit gap (#117).

---

## Story

As the **technician** working a confirmed booking,
I want a guided 4-step workflow (**Start Trip → Mark Reached → Start Work → Complete**) that survives flaky connectivity and hands me off to Google Maps for navigation,
so that **the customer sees accurate live progress, the booking state machine remains consistent on the server, and a transient network drop never blocks me from finishing the job.**

---

## Acceptance Criteria

### AC-1 · Linear state transitions only
- **Given** an active booking in any of `ASSIGNED | EN_ROUTE | REACHED | IN_PROGRESS | COMPLETED`
- **When** the technician taps the single CTA on screen
- **Then** the booking advances exactly one step — `ASSIGNED → EN_ROUTE → REACHED → IN_PROGRESS → COMPLETED`
- **And** any attempt to skip a step (e.g. `ASSIGNED → REACHED`) returns **HTTP 409** from `PATCH /v1/technicians/active-job/{bookingId}/transition`

### AC-2 · Maps nav handoff on Start Trip
- **Given** the booking is in `ASSIGNED`
- **When** the technician taps **Start Trip**
- **Then** the app emits `NavigationEvent.Maps(lat, lng)` and launches Google Maps via `google.navigation:q={lat},{lng}` intent
- **And** the booking transitions to `EN_ROUTE` (or queues offline if the API call fails)

### AC-3 · Offline queue with auto-replay
- **Given** the technician triggers a transition while offline
- **Then** the transition is persisted to a Room `pending_transitions` table with a `createdAt` timestamp
- **And** the local UI optimistically advances to the next state
- **When** connectivity returns (observed via `ConnectivityObserver`)
- **Then** queued transitions are replayed to the API in `createdAt` order
- **And** successful entries are deleted from the queue

### AC-4 · API enriches the GET response with `serviceName`
- **Given** a `GET /v1/technicians/active-job/{bookingId}` call from the assigned technician
- **Then** the response body contains the booking fields plus `serviceName` resolved from the catalogue
- **And** unauthenticated callers receive **401**, mismatched-tech callers receive **403**, missing booking returns **404**

### AC-5 · Status transitions emit a `BookingEvent`
- **Given** any successful transition
- **Then** a `BookingEvent` of type `STATUS_TRANSITION` is appended with `metadata` carrying `from` and `to` status values
- **And** event ordering is preserved per booking

### AC-6 · Compose UI shows progress + offline state
- **Given** the active-job screen is open
- **Then** a 5-dot stepper renders the current stage
- **And** while offline an offline banner is visible
- **And** the **Complete Job** CTA is disabled (photo gate is enforced in E06-S02 once shipped)

### AC-7 · Job-offer accept routes to active-job by `bookingId`
- **Given** a technician accepts a job offer in the dispatch flow (E05)
- **Then** `JobOfferUiState.Accepted` carries the `bookingId`
- **And** `AppNavigation` routes to `activeJob/{bookingId}`

---

## Tasks / Subtasks

> Implementation followed `plans/E06-S01.md` (full work-stream plan). Recap below — granular checklists live in the plan.

- [x] **WS-0 — Prep** · libs.versions.toml sync; Room 2.6.1 + `ACCESS_NETWORK_STATE` permission; Kover exclusions for Hilt/DB/Compose wrappers
- [x] **WS-A — Domain + data layer** · `ActiveJobStatus`, `LatLng`, `ActiveJob`, `NavigationEvent`; Room `PendingTransitionEntity` + DAO + `ActiveJobDatabase`; `ActiveJobApiService` + DTOs; API schema extension `BookingEvent.metadata`
- [x] **WS-B-Android — Repo + use cases (TDD)** · `ActiveJobRepositoryImpl` (API-first, Room fallback); `StartTripUseCase`, `MarkReachedUseCase`, `StartWorkUseCase`, `CompleteJobUseCase` — each with unit tests
- [x] **WS-B-API — Endpoints (TDD)** · `GET` + `PATCH /v1/technicians/active-job/:bookingId/transition` in `api/src/functions/active-job.ts`; legal-transition validator; 7 Vitest cases (200, 403, 404, 409, event metadata)
- [x] **WS-C — DI + connectivity** · `ActiveJobModule` Hilt provides; `ConnectivityObserver` emitting `Flow<Boolean>`
- [x] **WS-D — UI + nav + Paparazzi** · `ActiveJobUiState` sealed class; `ActiveJobViewModel` (`SavedStateHandle` for `bookingId`); `ActiveJobScreen` Compose; `HomeGraph` extension; `JobOfferUiState.Accepted(bookingId)`; Paparazzi stubs `@Ignored` (CI workflow_dispatch)
- [x] **WS-E — Smoke gate + review** · `tools/pre-codex-smoke.sh technician-app` + `tools/pre-codex-smoke-api.sh` PASSED; Codex review PASSED; CI green; merged

---

## Dev Notes

### Context from previous stories
- **E05-S04** wires the dispatch engine through to `JobOfferScreen`. Accept emits `Accepted(bookingId)` — this story consumes that contract.
- **E03-S03** seeds the booking state machine; the legal-transition table here extends it for the technician-side.
- `BookingEvent.metadata: Record<string, unknown>` was widened in this story so future events (E06-S02 photos, E06-S03 add-ons) can attach payload without schema churn.

### Security invariants (non-negotiable)
1. `PATCH /transition` rejects mismatched `technicianId` with **403** — defence in depth alongside Cosmos partition-key check.
2. Skip-step requests return **409** server-side; client cannot bypass via local state.
3. The Room `pending_transitions` table is local-only and contains no PII beyond `bookingId` + status enum.

### Offline queue semantics
- Queue is **per-tech-device**, not synced across logins.
- On replay, a 409 (already-applied) is treated as success and the row is deleted; any other failure leaves the row for the next reconnection.
- Replay runs on a single coroutine to preserve ordering.

### Maps intent
- Uses `google.navigation:q={lat},{lng}` — works without a Maps SDK key. If Google Maps is not installed, the intent falls through to any installed nav app via Android's intent resolution.

### Paparazzi
- `ActiveJobScreenPaparazziTest` ships with `@Ignored` per `docs/patterns/paparazzi-cross-os-goldens.md`. Goldens are recorded via `paparazzi-record.yml` workflow_dispatch on Linux CI, never locally on Windows.

---

## Definition of Done

- [x] `./gradlew :app:testDebugUnitTest` (technician-app) green — 20 new unit tests
- [x] `pnpm test` (api) green — 7 new Vitest cases
- [x] Pre-Codex smoke gates exit 0
- [x] `.codex-review-passed` marker present
- [x] PR #31 opened; CI green on `main`
- [x] Merged 2026-04-22 (SHA `b11bb28`)

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (executing-plans + dispatching-parallel-agents for WS-B fanout).

### Completion Notes
- All 7 ACs validated by automated tests; no manual QA required.
- Paparazzi goldens deferred to CI workflow_dispatch — see `docs/patterns/paparazzi-cross-os-goldens.md`.
- Shipped clean on first Codex round.

### File List
See PR #31 (24 files added/modified across `technician-app/` + `api/`). Authoritative file map in `plans/E06-S01.md` §"File Map".
