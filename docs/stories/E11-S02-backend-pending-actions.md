---
id: E11-S02
epic: E11
story: S02
tier: Foundation
status: in_progress
created: 2026-05-12
author: Claude Sonnet 4.6 (subagent Stream 1.2)
---

# E11-S02 — Backend pending_actions container + 5 projectors + Semgrep ordering rule

## Context

This is the server-side foundation for E11 (Durable Screen Hooks). The Android `PendingActionStore` (Stream 1.1, E11-S01a) reconciles against these backend endpoints. Without this backend, the client-side offline queue has no server truth to sync against.

## Acceptance Criteria

- [ ] AC-1: `pending_actions` Cosmos container exists with partition key `/userId`, composite index `(userId, status, expiresAt)`, and individual indexes on `priority`, `createdAt`, `type`.
- [ ] AC-2: Zod schema `api/src/schemas/pendingActions.ts` defines `PendingActionDoc` with all required fields including monotonic `version`, `userId`, `status`, `expiresAt`, `type`, `priority`.
- [ ] AC-3: `api/src/cosmos/pending-action-repository.ts` exposes the `pending_actions` container accessor + CRUD helpers.
- [ ] AC-4: `api/src/services/pending-action-projector.ts` (shared harness) implements:
  - `upsertAction(action)` — idempotent ETag/IfMatch optimistic concurrency, max 3 retries with exponential backoff.
  - `resolveAction(id, userId)` — sets status=RESOLVED, bumps version (same ETag flow).
  - `expireAction(id, userId)` — sets status=EXPIRED, bumps version.
  - Strict ordering: `await upsertAction()` THEN `await emitFcm()` — never reverse.
  - Semantic-no-op detection: same logical state → no version bump, return existing row.
- [ ] AC-5: 5 source adapter files (trigger-projector-*.ts) each handling their respective change-feed triggers:
  - `api/src/functions/trigger-projector-bookings.ts` → `ADDON_APPROVAL_REQUESTED`, `RATING_PROMPT_CUSTOMER`, `COMPLAINT_UPDATE`
  - `api/src/functions/trigger-projector-ratings.ts` → `RATING_RECEIVED`
  - `api/src/functions/trigger-projector-kyc.ts` → `KYC_RESUME`
  - `api/src/functions/trigger-projector-dispatch-attempts.ts` → `JOB_OFFER`
  - `api/src/functions/trigger-projector-complaints.ts` → `COMPLAINT_UPDATE`
- [ ] AC-6: 6 endpoints implemented:
  - `GET /v1/customers/me/pending-actions` — filter `status=ACTIVE` + `expiresAt>now`
  - `GET /v1/technicians/me/pending-actions` — same filter
  - `GET /v1/customers/me/bookings?status=...` — confirm computed-on-read exists in bookings.ts
  - `GET /v1/technicians/me/dashboard` — aggregator (KYC + active-job + pending-offer + today's earnings + today's ratings)
  - `GET /v1/technicians/active-job/{bookingId}` — already exists in active-job.ts (no change)
  - `PATCH /v1/technicians/me/availability` — net-new endpoint replacing local-only toggle
- [ ] AC-7: Semgrep rule in `api/.semgrep.yml` that fails CI when `sendFcm()` is called before `upsertAction()` in any `trigger-projector-*.ts` file.
- [ ] AC-8: Structured OTel logs via existing pipeline:
  - `pending_action_upsert` (id, version, action_type, projector_source)
  - `pending_action_stale_drop` (id, existing_version, incoming_version)
  - `fcm_send_attempt` (action_id, target_user_id)
  - `fcm_send_success` (action_id, ms_elapsed)
  - `fcm_send_failure` (action_id, error_code)
- [ ] AC-9: All tests pass (≥80% coverage), Vitest + supertest.
- [ ] AC-10: `pre-codex-smoke-api.sh` exits 0.
- [ ] AC-11: `.codex-review-passed` marker committed.

## Test surface

- Duplicate change-feed events → idempotent upsert (no version inflation)
- Stale-state cleanup: booking AWAITING_PRICE_APPROVAL → PAID → projector resolves `ADDON_APPROVAL_REQUESTED`
- Expiry: `dispatch_attempts` TTL passes → `JOB_OFFER` action expired by background timer
- Cross-user 403: user B fetches user A's actions
- FCM-after-upsert ordering: Semgrep rule fires on inverted-order test fixture
- `version` monotonicity under concurrent writes (412 retry path under simulated contention)
- Semantic-no-op mutation does NOT bump version
- Read API filters resolved/expired correctly

## Work streams

| WS | Description |
|---|---|
| WS-A | Cosmos collection + Zod schema + indexes + RU budget probe |
| WS-B | Projector harness + 5 source adapters |
| WS-C | Read API + dashboard aggregator + availability PATCH |
| WS-D | Auth middleware audit (cross-user 403 tests) |
| WS-E | Semgrep rule + observability logs |
| WS-F | Pre-Codex smoke gate + Codex review |

## Definition of done

- All ACs checked
- TDD: test files committed before impl files
- `bash tools/pre-codex-smoke-api.sh` → exit 0
- `codex review --base main` → `.codex-review-passed`
- CI ship.yml green (lint + tests + Semgrep)
- Story status → `merged`
