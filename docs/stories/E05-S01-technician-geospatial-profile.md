# Story E05-S01: Technician geospatial profile — schema, ST_WITHIN repo, Bengaluru seed

Status: shipped (PR #18, merged 2026-04-20, commit 3fdfa4e) — **retroactive docs**

> **Epic:** E05 — Dispatch Engine + Job Offers (`docs/stories/README.md` §E05)
> **Sprint:** S3 (wk 5–6) · **Estimated:** ≤ 1 dev-day · **Priority:** P0 (blocks E05-S02)
> **Sub-project:** `api/`
> **Ceremony tier:** Foundation (new schema + cross-cutting Cosmos query that downstream stories build on)
> **Plan file:** `plans/E05-S01.md` (retroactively authored — see issue #98)
> **Retroactive note:** PR #18 shipped without `docs/stories/E05-S01-*.md` or its plan file. Both are being added retroactively (issue #98). Acceptance criteria below are reverse-engineered from `api/src/schemas/technician.ts`, `api/src/cosmos/technician-repository.ts`, `api/src/cosmos/geo.ts`, `api/src/cosmos/indexes/technicians-index.json`, and `api/scripts/seed-technicians.ts`. Plan file holds canonical step-by-step.

---

## Story

As **the dispatcher service** and as **the operator running the Bengaluru pilot**,
I want a `TechnicianProfile` Cosmos schema with GeoJSON location, skills, availability, online/available flags, and KYC status, plus a repository that runs `ST_WITHIN` queries with a spatial index, plus a seed script that loads 10 Bengaluru technicians (including two edge-case docs the dispatcher MUST exclude),
so that **E05-S02 can fan out job offers to the nearest skilled, KYC-approved, online, available technicians without scanning the whole container** (FR-4.1, ADR-0003, ADR-0006).

---

## Acceptance Criteria

### AC-1 · `TechnicianProfileSchema` (Zod)
- Required fields: `id`, `technicianId`, `location: GeoPoint`, `skills: string[].min(1)`, `availabilityWindows: AvailabilityWindow[]`, `isOnline: boolean`, `isAvailable: boolean`, `kycStatus: 'APPROVED' | 'PENDING' | 'REJECTED'`
- Optional fields: `fcmToken`, `rating: number ∈ [0, 5]`, `completedJobCount: int ≥ 0`, `updatedAt: ISO datetime`
- `GeoPoint`: `{ type: 'Point', coordinates: [number, number] }` — GeoJSON canonical `[lng, lat]` order
- `AvailabilityWindow`: `dayOfWeek ∈ [0, 6]`, `startHour ∈ [0, 23]`, `endHour ∈ [1, 24]`
- **No decline-history field anywhere in the schema** — FR-9.1 invariance is architecturally enforced by absence

### AC-2 · `boundingBoxPolygon(lat, lng, radiusKm)` returns a closed 5-vertex ring
- Computes `deltaLat = radiusKm / 111` and `deltaLng = radiusKm / (111 × cos(lat))`
- Returns `{ type: 'Polygon', coordinates: [[sw, se, ne, nw, sw]] }` with vertices as `[lng, lat]` pairs
- The polygon is a square that *contains* the desired circle; the dispatcher (E05-S02) does the haversine post-filter
- Companion `pointInsidePolygon(...)` is a unit-test-only ray-casting helper (not used at runtime)

### AC-3 · `getTechniciansWithinRadius(lat, lng, radiusKm, serviceId)` Cosmos query
- Builds bounding-box polygon and runs:
  ```sql
  SELECT * FROM c
  WHERE ST_WITHIN(c.location, @polygon)
    AND ARRAY_CONTAINS(c.skills, @serviceId)
    AND c.kycStatus = "APPROVED"
    AND c.isOnline = true
    AND c.isAvailable = true
  ```
- Returns `TechnicianProfile[]` (zero entries when no candidates match)
- Three boolean filters mean offline techs and busy techs are physically excluded from the result set — no chance of accidentally dispatching to them

### AC-4 · `upsertTechnicianProfile(profile)` writes to `technicians` container
- Calls `container.items.upsert(profile)` (idempotent — used by both seed and the live online/availability toggles in E05-S02)
- Container partition key is `/technicianId` (matches `id` in this schema)

### AC-5 · Spatial index policy applied to `technicians`
- `api/src/cosmos/indexes/technicians-index.json` declares:
  ```json
  "spatialIndexes": [{ "path": "/location/*", "types": ["Point"] }]
  ```
- Includes `indexingMode: consistent`, `automatic: true`, `excludedPaths: ["/\"_etag\"/?"]`
- Applied either via `container.replace({ id, partitionKey, indexingPolicy })` at deploy time or manually via Azure Portal Data Explorer
- Without the index, `ST_WITHIN` falls back to a slow scan — capacity bound for the dispatcher

### AC-6 · Bengaluru seed: 10 technicians across the city
- 8 healthy techs spread across Koramangala (12.9352, 77.6245), Indiranagar (12.9784, 77.6408), Whitefield (12.9698, 77.7500), HSR (12.9116, 77.6474), Marathahalli (12.9591, 77.7011), Jayanagar (12.9299, 77.5830), BTM (12.9166, 77.6101), Electronic City (12.8399, 77.6790)
- 1 offline tech at Yelahanka (`isOnline: false`) — exists to verify the dispatch query EXCLUDES offline techs
- 1 on-job tech at Banashankari (`isAvailable: false`) — exists to verify the dispatch query EXCLUDES busy techs
- Skill mix covers AC, plumbing, electrical, cleaning, pest-control (so dispatch filtering by skill is meaningfully testable)
- Run with `pnpm seed:technicians` (requires `COSMOS_ENDPOINT` + `COSMOS_KEY` env)
- Seed is dev-only — not run in CI

### AC-7 · TDD coverage: 22 new tests, suite at 125 green
- 9 schema tests (`tests/schemas/technician.test.ts`) — valid + invalid `kycStatus` + edge cases
- 6 geo polygon tests (`tests/unit/cosmos/geo.test.ts`) — shape, span, boundary exclusion invariant
- 7 repository tests (`tests/unit/cosmos/technician-geospatial.test.ts`) — upsert, SQL construction, ST_WITHIN clause, ARRAY_CONTAINS, parameter passing

### AC-8 · KYC integration with E02-S03
- Existing `upsertKycStatus` and `getKycByTechnicianId` methods (added in E02-S03 pattern) are preserved at the top of `technician-repository.ts`
- New geospatial methods are appended below — both shapes coexist on the same partition (`technicianId`)

---

## Tasks / Subtasks (as actually shipped)

> Plan file `plans/E05-S01.md` is canonical. Below mirrors the work-stream summary.

- [x] **WS-A — Schema (TDD)** — `tests/schemas/technician.test.ts` red → `src/schemas/technician.ts` green
- [x] **WS-B — Geo helper (TDD)** — `tests/unit/cosmos/geo.test.ts` red → `src/cosmos/geo.ts` (`boundingBoxPolygon` + `pointInsidePolygon`) green
- [x] **WS-C — Repository (TDD)** — `tests/unit/cosmos/technician-geospatial.test.ts` red → append `upsertTechnicianProfile` + `getTechniciansWithinRadius` to `technician-repository.ts` green
- [x] **WS-D — Index policy + seed** — `src/cosmos/indexes/technicians-index.json`; `scripts/seed-technicians.ts`; `pnpm seed:technicians` script
- [x] **WS-E — Smoke gate + Codex** — `bash tools/pre-codex-smoke-api.sh` PASSED; `.codex-review-passed` shipped at HEAD

---

## Dev Notes

### Why bounding-box polygon, not a circle
Cosmos `ST_WITHIN` requires a `Polygon` (or `MultiPolygon`) — there is no built-in `ST_DWITHIN` for "points within radius of point" in Cosmos's GeoJSON dialect at the time of this story. The bounding-box polygon is a square that *contains* the desired circle. The dispatcher (E05-S02) then runs a haversine pass to drop the four bounding-box corner techs that are inside the square but outside the actual radius. This is faster than fetching everything and post-filtering in Node, because the spatial index prunes the vast majority of the container on the database side.

### Why GeoJSON `[lng, lat]` order
Cosmos follows GeoJSON canonical (RFC 7946): `coordinates: [longitude, latitude]`. This is the opposite of the more intuitive "lat first" convention used in everyday speech. Every consumer of `TechnicianProfile.location.coordinates` must access `[1]` for latitude and `[0]` for longitude — the dispatcher's `rankTechnicians` and the haversine post-filter both honour this. A test fixture's lat/lng swap is a recurring source of bugs; the schema's tuple typing helps catch them at compile time.

### Why the schema *omits* a `declineCount` field
Karnataka FR-9.1 prohibits the dispatcher from using decline history as a ranking signal. The cleanest enforcement is *making the data unreachable*: the schema simply doesn't declare such a field, so any dispatcher attempt to read `tech.declineCount` would be a TypeScript compile error. E05-S02 adds a CI gate (`dispatcher-up-ranking.test.ts`) that asserts the schema does not regrow such a field, defending against well-meaning future developers who try to "improve" the ranking.

### Why include the two edge-case seed docs
The seed script is the only realistic way to verify the dispatch query's WHERE clause. Without the offline+on-job edge cases, a reviewer reading the query would have no proof that `isOnline` and `isAvailable` are *actually* enforced — the test could pass with the filters silently broken. The Yelahanka and Banashankari docs are deliberate trip-wires; if the dispatcher ever returns them, something is wrong.

### Why optional `rating`, `fcmToken`, `completedJobCount`
These are populated by *later* stories — `rating` by E07-S01 ratings flow, `fcmToken` by the Android app on first login (E05-S03), `completedJobCount` by the booking-completed handler in E06-S04. Making them optional in the schema lets E05-S01 ship with technicians who have *no* history yet, which is the realistic state at pilot launch.

---

## Definition of Done

- [x] `cd api && pnpm typecheck && pnpm test` — 125/125 tests green (was 103 before this story)
- [x] `bash tools/pre-codex-smoke-api.sh` exited 0
- [x] `.codex-review-passed` marker shipped in PR #18
- [x] `pnpm seed:technicians` validated against dev Cosmos endpoint (manual)
- [x] CI green on `main` after merge (commit 3fdfa4e)

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per PR #18 commit attribution)

### Completion Notes
PR #18 merged 2026-04-20 20:48 UTC as commit 3fdfa4e. PR also bundled the E09-S04/S05 audit-log work that landed in the same window — those changes are tracked in their own stories. Dispatcher remains a stub at this point; E05-S02 (PR #26) replaces it.

### File List
See PR #18 (E05-S01 portion only):
- Added: `api/src/schemas/technician.ts`, `api/src/cosmos/geo.ts`, `api/src/cosmos/indexes/technicians-index.json`, `api/scripts/seed-technicians.ts`, `api/tests/schemas/technician.test.ts`, `api/tests/unit/cosmos/geo.test.ts`, `api/tests/unit/cosmos/technician-geospatial.test.ts`
- Modified: `api/src/cosmos/technician-repository.ts` (appended geospatial methods), `api/package.json` (`seed:technicians` script)
