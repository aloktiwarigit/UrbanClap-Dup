---
status: pr_open
epic: E16
story: S01
tier: Foundation
security: true
---

# E16-S01 — API: Service-Area Polygon Gating in POST /v1/bookings

## Context

The Ayodhya pilot requires that only customers physically located within the service area (Ayodhya / Faizabad region) can create bookings. Without server-side enforcement, a customer anywhere in India (or the world) could submit a booking, which wastes dispatcher capacity and confuses field technicians.

This story adds server-side Turf.js polygon gating to `POST /v1/bookings`, backed by a 25 km radius polygon centered on Ramkot temple complex in Ayodhya. The check is gated behind GrowthBook flag `customer.service-area-gating.enabled` so we can operate in warn-only mode during soak before hard-failing.

## Acceptance Criteria

- **AC-1** `POST /v1/bookings` with `addressLatLng` inside Ayodhya polygon → 200 (unchanged behavior, booking proceeds normally).
- **AC-2** `POST /v1/bookings` with `addressLatLng` outside Ayodhya polygon AND flag `customer.service-area-gating.enabled` is `on` → 400 with body `{ error: "SERVICE_NOT_AVAILABLE_AT_LOCATION", message: "...", suggestedAction: "join_waitlist" }`.
- **AC-3** `POST /v1/bookings` with `addressLatLng` outside Ayodhya polygon AND flag is `off` → 201 + structured log entry `service_area_check { inside: false, mode: "warn-only" }`.
- **AC-4** Boundary case: a point on the polygon edge → `true` (inclusive via Turf.js boolean-point-in-polygon).
- **AC-5** Spoofed lat/lng (`lat: 999, lng: 999`) → 400 via Zod schema validation (lat range -90..90, lng range -180..180); does not reach the service layer.
- **AC-6** ADR-0020 committed at `docs/adr/0020-service-area-gating.md`, citing Turf.js choice, polygon source, Phase-2 expansion playbook.
- **AC-7** Threat-model row T-B1 appended to `docs/threat-model.md`: server-side Turf.js polygon check; reject 400; alert on >5 rejections/min/customer (recon signal).
- **AC-8** ≥80% test coverage (Vitest + supertest pattern).

## Files Modified / Created

| File | Action |
|---|---|
| `api/src/services/service-area.service.ts` | New — pure Turf.js polygon check function |
| `api/src/data/service-area-ayodhya.geojson` | New — 25 km radius, 32-vertex polygon around Ramkot |
| `api/src/functions/bookings.ts` | Modified — service-area check gate in `createHandler` |
| `api/src/schemas/booking.ts` | Verify `addressLatLng` has lat/lng range validation |
| `api/tests/services/service-area.service.test.ts` | New — unit tests for polygon check |
| `api/tests/bookings/create.test.ts` | Extended — service-area flag scenarios |
| `docs/adr/0020-service-area-gating.md` | New |
| `docs/threat-model.md` | Appended T-B1 row |

## Work Streams

### WS-A: Zod schema + GeoJSON data (committed first)

1. Verify/add lat/lng range validation to `LatLngSchema` in `api/src/schemas/booking.ts`
2. Create `api/src/data/service-area-ayodhya.geojson` — 32-vertex polygon

### WS-B: Service module (TDD — test before impl)

1. Commit `api/tests/services/service-area.service.test.ts` (red)
2. Install `@turf/boolean-point-in-polygon` + `@turf/helpers`
3. Commit `api/src/services/service-area.service.ts` (green)

### WS-C: Feature flag + bookings.ts integration (TDD — test before impl)

1. Add `isServiceAreaGatingEnabled` to `featureFlags.service.ts`
2. Extend `api/tests/bookings/create.test.ts` with AC-2/AC-3/AC-5 scenarios (red)
3. Integrate into `api/src/functions/bookings.ts` (green)

### WS-D: Docs

1. Commit `docs/adr/0020-service-area-gating.md`
2. Append T-B1 to `docs/threat-model.md`

### WS-E: Pre-Codex smoke gate

```bash
bash tools/pre-codex-smoke-api.sh
```

## Feature Flag

| Flag | Default | Semantics |
|---|---|---|
| `customer.service-area-gating.enabled` | `false` | `false` = warn-only (log + allow); `true` = hard reject 400 |

## Observability

Each request logs at INFO level:
```
service_area_check { customerId, lat, lng, inside: boolean, mode: "warn-only" | "fail" }
```

Alert annotation: >5 rejections/min/customer is a reconnaissance signal (T-B1).
