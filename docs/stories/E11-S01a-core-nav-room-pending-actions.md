---
status: in_progress
epic: E11
story: S01a
tier: Foundation
dependencies: []
created: 2026-05-12
---

# E11-S01a — Core-nav module + Room pending_actions + serialization spike

## Purpose

Foundation story that builds the shared navigation contracts and local persistence layer that
6+ subsequent E11 stories depend on. Blocked stories: E11-S01b-1 (router + ingestor), E11-S03
(customer home hooks), E11-S04 (technician dashboard hooks), E11-S05a/b (job/trust hooks).

## Scope

### core-nav module (pure Kotlin, no Android deps)
- `RouteSpec` interface
- `PendingActionType` enum (10 values, aligned with existing FCM wire types)
- `PendingActionStatus` enum
- `PendingActionPriority` enum
- `PendingAction` data class
- `NotificationIntent` data class
- `DeepLinkUri` object (build + parse)
- `NotificationRouter` interface
- `RouteResolver` interface
- `RouteContext` data class
- `TierLadder` object (pure tier-ladder logic, T0–T6)
- `AuthState` sealed interface (shared auth states)

**12 exported contract types.**

### Per-app Room layer — customer-app
- `PendingActionEntity` Room entity (5 indexes)
- `PendingActionDao` interface (8 methods)
- `PendingActionsDatabase` Room database
- `PendingActionStore` implementation class
- `PendingActionsModule` Hilt module

### Per-app Room layer — technician-app
- Same 5 artifacts as customer-app, under `com.homeservices.technician` package

### Spike (WS-C) — kotlinx-serialization
- Add `kotlinx-serialization` plugin to both apps' `libs.versions.toml`
- Add `kotlinx-serialization-json` library to both apps' `build.gradle.kts`
- Convert 1 simple route + 1 arg-route per app to `@Serializable`
- Verify `composable<T>()` + `entry.toRoute<T>()` compiles and round-trips
- Run Paparazzi smoke on a converted route (goldens recorded on CI Linux, never local Windows)

## Out of Scope

- `NotificationRouter` Android adapter (S01b-1)
- `PendingActionIngestor` orchestrator (S01b-1)
- FCM service refactor (S01b-1)
- Cold-start integration in MainActivity (S01b-1)
- Route migration codemod for existing screens (S01b-2)
- Event-bus removal (S01b-2)
- Dispatcher ranking logic — Karnataka invariant per ADR-0006/ADR-0011: DO NOT TOUCH

## Acceptance Criteria

- [ ] AC-1: `core-nav` module compiles; exports exactly 12 contract types with explicit `public` modifiers (required by `-Xexplicit-api=strict`).
- [ ] AC-2: Both apps wire `PendingActionsDatabase` via Hilt; `./gradlew :app:kspDebugKotlin` succeeds on both.
- [ ] AC-3: Spike — `BookingPriceApprovalRoute(bookingId="bk123")` round-trips through Compose Nav typed routes via `composable<BookingPriceApprovalRoute>{}` + `entry.toRoute<BookingPriceApprovalRoute>()`; no runtime crash.
- [ ] AC-4: Spike go/no-go recorded as owner-visible decision in PR description.
- [ ] AC-5: Paparazzi golden for spike route recorded on CI Linux (workflow_dispatch `paparazzi-record.yml`) — NOT recorded locally on Windows.
- [ ] AC-6: `TierLadder` unit tests cover all T0–T6 paths + tie-break combinations; ≥80% line coverage on `core-nav` pure code.
- [ ] AC-7: `DeepLinkUri.build`/`parse` round-trip tests cover URL encoding edge cases.
- [ ] AC-8: Room DAO tests cover priority ordering, expiry filter, tombstone purge at 30d, and `markMissingAsResolved` semantics.
- [ ] AC-9: `libs.versions.toml` files in `customer-app/gradle/` and `technician-app/gradle/` are byte-for-byte identical after each commit.
- [ ] AC-10: Pre-Codex smoke gate passes: `bash tools/pre-codex-smoke.sh customer-app && bash tools/pre-codex-smoke.sh technician-app`.

## Work Streams

```
WS-A: core-nav module — pure Kotlin contracts + TierLadder
      Runs first (no deps). Sonnet subagent OK.
      TDD: test file committed before impl file.

WS-B: per-app Room layer — customer-app AND technician-app
      Parallel fan-out: 2 independent paths, both depend on core-nav types.
      TDD: entity/DAO test committed before entity/DAO impl.

WS-C: kotlinx-serialization spike + Paparazzi smoke
      Depends on WS-A (uses route types from core-nav).
      Owner-visible go/no-go gate.

WS-D: pre-Codex smoke gate + Codex review
      Runs after WS-A/B/C complete.
```

## Test Surface

| Test class | Type | Scope |
|---|---|---|
| `TierLadderTest` | JVM unit | All T0-T6 paths × tie-break (earliest expiresAt, oldest createdAt, lexicographic id) |
| `DeepLinkUriTest` | JVM unit | build/parse round-trip, URL-encoded args, null on malformed |
| `PendingActionDaoTest` (customer) | Robolectric | priority ordering, expiry filter, markMissingAsResolved, tombstone purge |
| `PendingActionDaoTest` (technician) | Robolectric | same as customer |
| `BookingPriceApprovalRouteSerializationTest` | JVM unit | @Serializable round-trip via Json.encodeToString/decodeFromString |
| `SpikeRouteRoundTripTest` (Paparazzi) | Paparazzi | 1 simple route + 1 arg-route snapshot on CI Linux |

## Pattern References

- `docs/patterns/hilt-module-android-test-scope.md` — DAO tests use Robolectric, not `@HiltAndroidTest`
- `docs/patterns/kotlin-explicit-api-public-modifier.md` — all exported types need explicit `public`
- `docs/patterns/paparazzi-cross-os-goldens.md` — NEVER record on Windows; trigger CI workflow

## Risk Flags

- kotlinx-serialization spike may find incompatibility with existing navigation setup. If go/no-go is NO-GO, commit `docs/adr/00XX-route-contract-fallback.md` choosing sealed-class string routes in the SAME PR. S01b is frozen until that ADR is merged.
- `-Xexplicit-api=strict` combined with `-Werror` means any implicit public visibility = compile error. Every exported type in `core-nav` must carry explicit `public`.
- Room schema version must start at 1 in both apps; no migration required for v1 (fresh install).
