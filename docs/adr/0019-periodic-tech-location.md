# ADR-0019 — Periodic Technician Location Push

**Status:** Accepted  
**Date:** 2026-05-16  
**Story:** E17-S02  
**Scope:** technician-app + api + customer-app (cross-cutting)

---

## Context

Customers tracking an active booking need sub-minute technician pin freshness during the `EN_ROUTE → IN_PROGRESS` phase. The existing `sendLocationUpdatePush` (fired on each `transitionStatus`) gives a single location snapshot at status change but no ongoing updates — the pin appears frozen for the duration of a job.

Two constraints drive the solution space:

1. **₹0/month infra** — WorkManager's minimum interval (15 min) is too coarse; a persistent WebSocket requires a paid stateful backend; any polling from the customer-app requires an authenticated endpoint reachable without a background restriction exemption.
2. **Android 14+ foreground-service restrictions** — background location access requires `ACCESS_BACKGROUND_LOCATION` (Play Store review-heavy) and a background service without a visible notification is killed by the OS on API 34+.

---

## Decision

A **foreground service on technician-app** (`LocationForegroundService`, channel `active_job_location`, `FOREGROUND_SERVICE_TYPE_LOCATION`) runs while a booking is in `EN_ROUTE | REACHED | IN_PROGRESS` status. It uses `FusedLocationProviderClient.requestLocationUpdates` at a 30-second interval with `setMinUpdateDistanceMeters(15f)` to suppress updates for stationary technicians.

Each location sample is:
1. **POSTed to** `POST /v1/technicians/active-job/{bookingId}/location` (new Azure Function), which upserts a single `LiveLocationDoc` in Cosmos DB (`live_locations` container, partition `/bookingId`, TTL 3600 s) and publishes a **slim FCM data message** to topic `customer_{customerId}`.
2. **Received by** `CustomerFirebaseMessagingService` in customer-app, which routes the slim payload to `LocationUpdateEventBus` (distinguished from the legacy `LOCATION_UPDATE` payload by the presence of `capturedAt`). `LiveTrackingViewModel` merges the bus flow into its `uiState`, preferring the live pin when available.

A **GrowthBook kill-switch** (`customer.periodic-location.enabled`, default off) gates the FCM publish step. When off, the Cosmos write still happens (admin observability is preserved) but no live pin appears in customer-app.

---

## Consequences

### Pros

- **₹0 infra** — FCM is unlimited; Cosmos Serverless charges only for the upsert RUs; Azure Functions on Consumption plan stays within free tier at pilot scale.
- **30-second freshness** — substantially better than the previous single-snapshot approach; covers the typical 15–45-minute job duration.
- **Idle suppression** — `setMinUpdateDistanceMeters(15f)` prevents redundant network calls when the technician is stationary.
- **Kill-switch** — FCM publish disabled with a flag flip; admin observability (Cosmos) is unaffected.
- **Reuses existing `customer_{customerId}` FCM topic** — no new infrastructure.
- **No new Play Store permissions** — `FOREGROUND_SERVICE_LOCATION` is already declared; `ACCESS_BACKGROUND_LOCATION` is not requested.

### Cons

- **Battery** — foreground location service draws ~2–3% battery per hour on a typical Android device. For a 45-minute job this is ~1.5–2.5%, within the risk register accepted for MVP.
- **Visible notification required** — Android 14+ mandates a persistent notification while the service is active. This is surfaced as "Sharing location with customer" (low-importance channel, no sound/vibration).
- **`FOREGROUND_SERVICE_LOCATION` runtime permission on API 34+** — the permission is already declared in the manifest (added in E11-S01b-1). User must grant `ACCESS_FINE_LOCATION` before the service starts; `LocationPermissionHelper.hasForegroundLocation()` guards the start call.

---

## Alternatives rejected

| Alternative | Reason rejected |
|---|---|
| WorkManager `PeriodicWorkRequest` | Minimum interval 15 min (OS-enforced since API 23). Too coarse for job tracking. |
| Persistent WebSocket from technician-app | Requires a stateful backend (e.g. Socket.io, MQTT broker). Violates ₹0 constraint. |
| Background service without notification | Killed by OS on Android 14+ (`FOREGROUND_SERVICE_LOCATION` must be foreground). |
| Customer-app polls a location endpoint | Requires background network access + adds customer-side battery cost. Inappropriate reversal of push model. |
| Extending `ActiveJobForegroundService` | That service owns outbox-sync responsibility. Coupling GPS to it would violate SRP and make each harder to test/kill independently. |

---

## Rollback

Flip `customer.periodic-location.enabled` to `false` in GrowthBook. FCM publishes stop immediately (within the next flag refresh). Cosmos writes continue — admin dashboard retains location observability. Tech-app continues calling the endpoint (Cosmos upsert still happens); deploy a client-side flag to stop the foreground service if needed.

---

## Security invariants implemented

- **Assigned-tech-only** — endpoint rejects 403 if `booking.technicianId !== auth.uid`.
- **Booking status gate** — 409 `BOOKING_NOT_ACTIVE` for statuses outside `{EN_ROUTE, REACHED, IN_PROGRESS}`.
- **Rate limit** — 1 request per 15 s per `bookingId` via `withRateLimit` `keyExtractor`. Mitigates D-L1 (DoS on location endpoint, see threat-model).
- **Capture freshness** — `capturedAt` must be within ±90 s of server time; stale fixes rejected with 400 `STALE_FIX`.
- **No PII on FCM** — data message carries only `{type, bookingId, lat, lng, capturedAt}`. Technician name, photo URL, and address are never included.
- **Mock-fix flagging** — `attestation.isMock` forwarded from Android; server logs a Sentry warning but allows through (matches `transitionStatus` behavior).
