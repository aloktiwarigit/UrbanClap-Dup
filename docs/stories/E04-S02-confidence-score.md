# Story E04-S02: Pre-booking Confidence Score (on-time %, area rating, nearest ETA)

Status: shipped (PR #34, merged 2026-04-24, commit 4861332) — **retroactive docs**

> **Epic:** E04 — Trust Layer (Customer) (`docs/stories/README.md` §E04)
> **Sprint:** S2 (wk 3–4) · **Estimated:** ≤ 1.5 dev-days · **Priority:** P1
> **Sub-projects:** `api/` + `customer-app/`
> **Ceremony tier:** Foundation (split into S02a + S02b due to API-then-Android dependency)
> **Plan files:** `plans/E04-S02a.md` (609 lines, API + schema) and `plans/E04-S02b.md` (757 lines, Android domain/data/UI)
> **Retroactive note:** PR #34 shipped with both plan files but no `docs/stories/E04-S02-*.md` file. This story is being authored after-the-fact from the merged PR (issue #116). The two plan files together are canonical for step-by-step implementation; this story file gives the user-facing acceptance criteria and ties them back to the plan files.

---

## Story

As a **customer choosing whether to commit to a booking**,
I want to see three pill chips on the Service Detail screen (technician's on-time % over the last 30 days, area rating, nearest ETA from my address), with a "Limited data" badge when the technician has fewer than 20 timed jobs and a tap-for-methodology bottom sheet,
so that **I can decide whether to book this technician with confidence rather than guessing from a star rating alone** (FR-3.2).

---

## Acceptance Criteria

### AC-1 · `GET /v1/technicians/{id}/confidence-score?lat=&lng=`
- Behind `requireCustomer(...)` middleware (Firebase ID token + `customer` role)
- Query schema: `lat ∈ [-90, 90]`, `lng ∈ [-180, 180]`, both required (`z.coerce.number`)
- Response body (Zod `ConfidenceScoreResponseSchema`):
  ```json
  {
    "onTimePercent": 87,
    "areaRating": null,
    "nearestEtaMinutes": 14,
    "dataPointCount": 31,
    "isLimitedData": false
  }
  ```
- 400 `MISSING_PARAM` if `id` route param absent
- 400 `VALIDATION_ERROR` if `lat`/`lng` invalid
- 404 `TECHNICIAN_NOT_FOUND` if Cosmos read returns no doc OR throws Cosmos `code === 404`
- 200 with `dataPointCount: 0` and `onTimePercent: 0` when no completed bookings in window

### AC-2 · On-time % computation (last 30 days)
- Query bookings with `status IN ('COMPLETED', 'PAID')` AND `slotDate >= today−30d`
- **Filter on `slotDate`, not `createdAt`** — service quality is measured on when the slot was promised, not when the booking was paid (Codex P2 fix in-PR)
- For each booking with a non-null `startedAt` timestamp:
  - Parse `slotWindow` start hour/minute (format `"HH:MM-HH:MM"`)
  - Slot start = `${slotDate}T${HH}:${MM}:00.000Z`
  - On-time iff `(startedAt − slotStart) ≤ 15 minutes`
- **Bookings without `startedAt` are excluded from the denominator** (untimed jobs cannot prove on-time-ness honestly — Codex P2 fix in-PR)
- `onTimePercent = round((onTime / timed) × 100)`; 0 when `timed === 0`

### AC-3 · `areaRating` deferred — return `null`
- Per-booking ratings collection (E07-S01) ships later. Returning `null` is honest; returning a fabricated 0 or fake "—" placeholder would mislead.
- Zod schema permits null (`z.number().min(0).max(5).nullable()`).

### AC-4 · Nearest ETA (haversine + 20 km/h average urban speed)
- Read technician doc by point-read (partition key = id = uid)
- If `(lat, lng) === (0, 0)` → treat as "no customer location available" → `nearestEtaMinutes: null` (Codex P1 fix in-PR — guards against unset GPS sending the request to the city center by accident)
- Otherwise: `etaMinutes = round((haversineKm(customer, tech) / 20) × 60)`

### AC-5 · `isLimitedData` flag
- `isLimitedData = dataPointCount < 20` — UI shows a "Limited data" badge so the customer knows the % is statistically thin

### AC-6 · `ConfidenceScoreRow` Compose component
- Three pill chips horizontally: on-time %, area rating ("—" when null), ETA chip ("ETA <N> min" or hidden when null)
- Shimmer placeholder on `Loading` state
- "Limited data" badge below the pills when `isLimitedData`
- Tap any chip → bottom sheet explaining methodology (window length, on-time threshold, ETA assumption)
- Pulled into `ServiceDetailScreen` after the price block; falls back to `Hidden` (no chips, no badge) when the API returns 401 or the user is unauthenticated

### AC-7 · Optional `techId` query param on `SERVICE_DETAIL` route
- `CatalogueRoutes.serviceDetail(serviceId, techId?)` builds `/serviceDetail/{serviceId}?techId={techId}`
- `ServiceDetailViewModel.init` reads both params from `SavedStateHandle` and triggers `getConfidenceScoreUseCase` only when `techId` is present
- When `techId` is absent (browse-without-recommendation path), the row stays `Hidden`

### AC-8 · Karnataka FR-9.1 invariance preserved
- The endpoint reads no decline-history field. The Cosmos query selects only `id, status, slotDate, slotWindow, startedAt`; the schema for the booking row is intentionally narrow.
- This is enforced architecturally — no decline term is even available to the handler.

### AC-9 · Known limitation (documented in `TechnicianModule.kt`)
- The Android `TechnicianModule` OkHttpClient has no Firebase ID token interceptor. This branch predates customer auth (E02-S01 on a sibling branch). The endpoint requires `requireCustomer`, so Android calls return 401 until E02-S01 merges and the interceptor is wired into a `@AuthOkHttpClient` qualifier (mirror pattern from `BookingModule`). UI correctly falls back to `Hidden` state.

### AC-10 · 7 rounds of Codex review, all P1/P2 resolved
- 7 review rounds shipped in `docs/reviews/codex-E04-S02-round{1..7}-*.md` for posterity
- Resolved: slotDate filter (P2), exclude untimed bookings from denominator (P2), areaRating null over fake (P2), (0,0) ETA guard (P1), 404 guard with Cosmos error discrimination (P1), `authLevel: anonymous` registration (P1), `/api` prefix on Android base URL (P1), `lifecycle-runtime-compose` dep (P1)
- Auth interceptor deferred per AC-9 (waits on E02-S01 merge)

---

## Tasks / Subtasks (as actually shipped)

> Plans `E04-S02a.md` (API) and `E04-S02b.md` (Android) are canonical. Below mirrors the work-stream summary.

### Plan A (API)
- [x] **WS-A1 — Zod schemas** (`ConfidenceScoreQuerySchema`, `ConfidenceScoreResponseSchema`)
- [x] **WS-A2 — Endpoint handler + auth wrapper** (`getConfidenceScoreHandler` behind `requireCustomer`)
- [x] **WS-A3 — Cosmos query + haversine helper** (in-handler `haversineKm`; bookings query filters on `slotDate`)
- [x] **WS-A4 — Tests** (9 tests in `tests/technicians/confidence-score.test.ts`: 401, 400, 404, ETA hidden when (0,0), on-time math edge cases, untimed bookings excluded)

### Plan B (Android)
- [x] **WS-B1 — Domain layer** (`ConfidenceScore`, `GetConfidenceScoreUseCase`)
- [x] **WS-B2 — Data layer** (`TechnicianApiService`, `ConfidenceScoreDto`, `ConfidenceScoreRepository(Impl)`, `TechnicianModule` Hilt DI)
- [x] **WS-B3 — UI** (`ConfidenceScoreRow` composable + 3 pill chips + shimmer + limited-data badge + methodology bottom sheet)
- [x] **WS-B4 — Navigation** (`SERVICE_DETAIL` route gains optional `techId` query param)
- [x] **WS-B5 — ViewModel wiring** (`ServiceDetailViewModel` reads both params, triggers use case only when `techId` present)
- [x] **WS-B6 — Paparazzi stubs + tests** (`ConfidenceScoreRowPaparazziTest` `@Ignored`; `GetConfidenceScoreUseCaseTest`; `ServiceDetailViewModelTest` extended)

### WS-Z — Cross-cutting
- [x] Pre-Codex smoke gate (`bash tools/pre-codex-smoke-api.sh` + `bash tools/pre-codex-smoke.sh customer-app`) PASSED
- [x] 7 rounds of Codex review; `.codex-review-passed` marker at HEAD

---

## Dev Notes

### Why split into S02a + S02b
The story has API-then-Android sequencing with no UI work blocked on Android compile until the API contract is locked. Splitting let the Android plan reference a frozen schema and DTO. Both plans landed in the same PR (#34), but the split kept each plan under the 800-line warning threshold per CLAUDE.md story-size gate.

### Why deferred `areaRating: null`
Per-booking ratings (E07-S01) had not yet shipped at the time of this story. Returning `0` would suggest "bad area"; returning a fake `4.5` would be dishonest; UI would have to special-case "no data" anyway. Returning `null` is the simplest contract that lets the UI render "—" without lying. The schema permits null, the UI handles null, the field becomes meaningful once E07-S01 lands and a downstream story populates the value.

### Why 20 km/h average urban speed
This is the Bengaluru urban-traffic average from a back-of-envelope review of the location data E05-S01 seeds (Koramangala→Whitefield ≈ 11 km in ~33 min during traffic). It is intentionally conservative — over-estimating ETA is less harmful than promising the customer 5 min and showing up in 25. Once we have real per-leg telemetry from E04-S03 location pings, this constant can be replaced with a per-corridor estimate.

### Why `(0, 0)` ETA guard rather than required `lat`/`lng`
The query schema *does* require lat and lng, but `(0.0, 0.0)` is the legal-but-meaningless default produced when the customer has not yet granted the location permission. Codex caught this during round 4: a customer with no GPS would have been told "your technician is 1500 km away" because (0, 0) is in the Atlantic Ocean. The guard now hides ETA when the customer's location is unset.

### Why the Android module ships with a known auth gap
E02-S01 (customer auth) was on a sibling feature branch at the time of writing. Blocking the dossier story on E02-S01 would have stalled the trust layer. The interceptor gap is documented in `TechnicianModule.kt` and the UI's `Hidden` fallback is graceful — the chips simply don't render. When E02-S01 merges, a one-line `@AuthOkHttpClient` swap activates the calls. This is an acceptable temporary state because the screen ships with the trust dossier card from E04-S01 in the same area, so the section is not visually empty.

---

## Definition of Done

- [x] `cd api && pnpm typecheck && pnpm test tests/technicians/confidence-score.test.ts` — 9 tests pass
- [x] `cd customer-app && ./gradlew assembleDebug testDebugUnitTest` — BUILD SUCCESSFUL
- [x] Pre-Codex smoke gates exited 0
- [x] 7 rounds of Codex review completed; `.codex-review-passed` marker at HEAD
- [x] All P1/P2 findings addressed except documented auth-interceptor branch constraint
- [x] CI green on `main` after merge (commit 4861332)

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per PR #34 commit attribution)

### Completion Notes
PR #34 merged 2026-04-24 02:24 UTC as commit 4861332. Seven Codex review rounds documented in `docs/reviews/codex-E04-S02-round{1..7}-*.md` (≈28k lines of review transcripts preserved for audit).

### File List
See PR #34. Plan-A files: `api/src/schemas/confidence-score.ts` (added), `api/src/functions/technicians.ts` (modified — added `getConfidenceScoreHandler` + helpers), `api/tests/technicians/confidence-score.test.ts` (added). Plan-B files: 7 added under `customer-app/.../data/technician/`, `domain/technician/`, `ui/catalogue/`; `CatalogueRoutes.kt` + `MainGraph.kt` + `ServiceDetailScreen.kt` + `ServiceDetailViewModel.kt` + `ServiceDetailUiState.kt` modified. Paparazzi: `ConfidenceScoreRowPaparazziTest` `@Ignored` (cross-OS golden drift).
