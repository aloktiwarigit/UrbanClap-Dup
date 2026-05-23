# ADR-0026 — FCM Push: Device-Token Send by Default; Topic Only for Non-PII Broadcasts

**Status:** Accepted  
**Date:** 2026-05-18  
**Deciders:** Alok Tiwari  
**Supersedes:** Implicit topic-based send pattern used since E11-S05a

---

## Context

The homeservices platform uses Firebase Cloud Messaging (FCM) to push booking status updates,
location updates, earnings notifications, SOS alerts, and DPDP erasure notices to Android apps
and admin web.

The original implementation used FCM topics (e.g. `customer_<uid>`, `technician_<uid>`,
`owner_alerts`) for all sends. This pattern was convenient but creates two threat surfaces:

1. **I-A2 (STRIDE I)**: User IDs embedded in topic names are visible in Firebase Console logs,
   GCP Cloud Logging, and to any app instance that subscribes to a guessed topic name.
2. **Topic payload eavesdrop**: FCM topics are subscription-based. A malicious client that
   knows a victim's UID can subscribe to `customer_<uid>` and receive all booking-related
   pushes, including bookingId, location coordinates, and technician identity.

E11-S05b-2 partially mitigated the SOS path by trimming the payload to `incidentId` only.
E19-S02 generalises the mitigation to ALL PII-bearing sends.

---

## Decision

**Default: Device-token-based send.** Every authenticated session registers its FCM
registration token with the API (`POST /v1/devices/register`). The API stores the token in
the `device_tokens` Cosmos container (partitioned by `/userId`). Push functions look up the
registered tokens for the target userId and send to those tokens directly.

**Narrow exception: Non-PII opt-in topics.** Topic-based send is retained ONLY for messages
whose payload contains no user-identifiable data (e.g. `new_service_in_area`, app update
announcements). No user IDs, booking IDs, or financial data may appear in a topic-addressed
message.

---

## Token lifecycle

| Event | Action |
|---|---|
| App start / FCM token refresh | `POST /v1/devices/register` |
| User sign-out (customer-app, technician-app) | `DELETE /v1/devices/{token}` |
| Admin logout (admin-web) | `deleteToken()` + `DELETE /v1/devices/{token}` |
| Daily timer (02:00 UTC) | Prune tokens with `lastSeen` > 60 days |

---

## Consequences

**Positive**
- Eliminates I-A2 eavesdrop surface: sends are unicast to enrolled devices only.
- Owner SOS/shield alerts reach the owner's enrolled admin browsers, not an open topic.
- Compatible with FCM `sendMulticast` (up to 500 tokens per request) for future multi-device support.

**Negative / Trade-offs**
- Zero-token state: if a user signs in but the device registration call fails (e.g. offline),
  they will miss that push. Mitigation: `DeviceTokenRegistrar.register()` is also called on
  app resume and FCM token-refresh callback, so stale/missing registrations recover on the
  next launch.
- Stale-token send failures: FCM returns `messaging/registration-token-not-registered` for
  deleted or rotated tokens. The prune timer catches 60-day-old tokens; in-flight failures
  are logged to Sentry and skipped (do not retry to the same token).

---

## Alternatives Rejected

| Alternative | Reason rejected |
|---|---|
| Keep topics for all sends | Leaves I-A2 unmitigated; subscriber eavesdrop attack remains viable |
| Payload-only trim (no send-path change) | Reduces data leakage in payload but UID-in-topic-name exposure persists in GCP logs |
| Instance-group topics (opaque IDs instead of UIDs) | Adds complexity without eliminating the subscription-eavesdrop surface |

---

## References

- `docs/threat-model.md` — threat I-A2 (FCM topic payload PII leak)
- `docs/adr/0002-fcm-universal-messaging-spine.md` — original FCM ADR
- `docs/adr/0024-sos-audio-e2e-encryption.md` — partial SOS mitigation (E11-S05b-2)
- E19-S02 story — full device-token migration implementation
