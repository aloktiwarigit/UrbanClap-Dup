# E19-S02 — FCM Topic PII Trim (Threat I-A2 Mitigation)

**Tier:** Foundation security-sensitive | **Deps:** E11-S05b-2 (partially mitigates SOS path) | **Threat:** I-A2 (`docs/threat-model.md` §A.4)
**Goal:** Remove PII from FCM topic payloads. Switch sensitive notifications from topic-based send to device-token send so only enrolled devices receive payloads.

---

## Problem statement

Three FCM payloads currently leak PII over public topics:

1. **`sendOwnerSosAlert`** (`api/src/services/fcm.service.ts:84-100`) — publishes
   `customerId + technicianId + slotAddress` to topic `owner_alerts`. Anyone who
   subscribes to `owner_alerts` from any app instance reads SOS events.
   *(Partially addressed by E11-S05b-2 which trims to incidentId only.)*
2. **`sendBookingStatusUpdatePush`** and **`sendCustomerNotification`**
   (`api/src/services/fcm.service.ts:5-29`) — publish to `customer_<uid>` topics with
   `bookingId` + status. A malicious tech-app could subscribe to a known
   `customer_<uid>` topic to harvest booking IDs.
3. **`sendTechnicianBookingStatusUpdatePush`** and earnings pushes
   (`api/src/services/fcm.service.ts:102-115`) — publish to `technician_<uid>` topics
   with `bookingId` + amount fields. Symmetric leak risk for technician data.

**Status:** `not-yet-mitigated`. **Impact:** PII exposure across the wrong-side app
(customer reads technician earnings, technician reads customer addresses).

---

## Approach (chosen)

**Switch from topic-based send to device-token send.** Every authenticated session
registers its FCM device token with the API; the API stores token-per-userId; pushes
target the device token, not the topic.

**Topic-based send is retained only for opt-in broadcast notifications** (e.g., "new
service category available in your area") where the payload is non-PII.

---

## Pattern citations

- `api/src/services/fcm.service.ts` — current topic-send implementation
- `api/src/cosmos/booking-repository.ts:getById` — pattern for partition-key reads
- `docs/adr/0018-hindi-default-customer-app.md` — locale field on user → similar
  user-meta storage pattern

---

## Architecture overview

### Before

```
customer-app                                  api
  └─ FCM.subscribeToTopic("customer_<uid>")
                                               └─ admin.messaging().send({
                                                    topic: "customer_<uid>",
                                                    data: { bookingId, status }
                                                  })
                                              ANYONE subscribed reads this
```

### After

```
customer-app
  └─ FCM.getToken() ─POST─> api/v1/devices/register
                                               └─ deviceTokens container:
                                                    { userId, deviceToken, platform,
                                                      lastSeen, appBuild }

  (later)                                      └─ admin.messaging().sendMulticast({
                                                    tokens: [<device tokens for userId>],
                                                    data: { bookingId, status }
                                                  })
                                              Only that user's enrolled devices receive
```

### Token lifecycle

- Register on app start + on FCM token refresh
- Unregister on sign-out (E14-S04 sign-out hardening hook)
- Stale tokens (>60 days `lastSeen`) auto-pruned by a daily TTL sweep

---

## Work streams

### WS-A: Schema + repository

**Files:**
- `api/src/schemas/device-token.ts` (NEW) — `DeviceTokenSchema` (userId, userType `customer|technician|admin`, deviceToken, platform `android|web`, lastSeen, appBuild)
- `api/src/cosmos/device-token-repository.ts` (NEW) — `registerDeviceToken`, `getDeviceTokensForUser`, `unregisterDeviceToken`, `pruneStaleTokens(olderThanDays)`
- `api/scripts/setup-cosmos.ts` (MODIFY) — provision `device_tokens` container, partition key `/userId`
- `api/tests/cosmos/device-token-repository.test.ts` (NEW)

### WS-B: Registration endpoints

**Files:**
- `api/src/functions/devices.ts` (NEW):
  - `POST /v1/devices/register` (customer | technician) — body: `{ deviceToken, platform, appBuild }`; userId from JWT
  - `DELETE /v1/devices/{deviceToken}` — explicit unregister
- `api/tests/functions/devices.test.ts` (NEW)

### WS-C: FCM service refactor

**Files:**
- `api/src/services/fcm.service.ts` (MODIFY) — every PII-bearing send function changes
  from `topic:` to `tokens:` via `device-token-repository.getDeviceTokensForUser`. Add
  graceful fallback: if zero tokens registered for the user, log a warning + skip send
  (do NOT fall back to topic — that defeats the purpose).
- `api/src/services/fcm.service.ts:sendOwnerSosAlert` (MODIFY) — switch from
  `topic: owner_alerts` to device-tokens-of-admin-users-with-role=owner. Requires
  enrollment: admin-web stores its FCM web push subscription on login.
- `api/tests/services/fcm.service.test.ts` (MODIFY)

**Topic-based sends RETAINED (non-PII broadcast):**
- `new_service_in_area` (future)
- `app_update_available` (future)
- Any topic whose payload is `{messageType: ...}` only, no IDs

### WS-D: Client-side token registration

**customer-app + technician-app:**
- New `DeviceTokenRegistrar` injected at app init
- On Firebase Messaging token-received callback → POST to API
- On sign-out (via existing E14-S04 sign-out orchestrator) → DELETE
- New tests in each app for register + unregister flows

**admin-web:**
- Service worker subscribes to FCM Web Push on owner-login
- Registers token via existing admin API auth
- Unregisters on logout

### WS-E: Daily TTL prune

**Files:**
- `api/src/functions/timers/prune-device-tokens.ts` (NEW) — daily timer trigger
- Removes tokens with `lastSeen` > 60 days
- Logs counts to Sentry breadcrumb

### WS-F: Threat-model + ADR

- `docs/threat-model.md` §I-A2: status → `mitigated` for SOS + customer + technician
  PII pushes; `accepted` for non-PII topic broadcasts
- `docs/adr/0026-fcm-device-token-vs-topic.md` (NEW) — documents the device-token
  default + the narrow topic exception

### WS-G: Smoke gates

- `bash tools/pre-codex-smoke-api.sh`
- `bash tools/pre-codex-smoke.sh customer-app`
- `bash tools/pre-codex-smoke.sh technician-app`
- `bash tools/pre-codex-smoke-web.sh` (admin-web)
- All four green before Codex review

---

## File manifest

| Path | Action |
|---|---|
| `api/src/schemas/device-token.ts` | NEW |
| `api/src/cosmos/device-token-repository.ts` | NEW |
| `api/scripts/setup-cosmos.ts` | MODIFY |
| `api/src/functions/devices.ts` | NEW |
| `api/src/services/fcm.service.ts` | MODIFY (all PII-bearing functions) |
| `api/src/functions/timers/prune-device-tokens.ts` | NEW |
| `api/tests/cosmos/device-token-repository.test.ts` | NEW |
| `api/tests/functions/devices.test.ts` | NEW |
| `api/tests/services/fcm.service.test.ts` | MODIFY |
| `api/tests/functions/timers/prune-device-tokens.test.ts` | NEW |
| `customer-app/.../data/device/DeviceTokenRegistrar.kt` | NEW |
| `customer-app/.../data/auth/SessionManager.kt` | MODIFY (call unregister on sign-out) |
| `technician-app/.../data/device/DeviceTokenRegistrar.kt` | NEW |
| `admin-web/src/lib/push-registration.ts` | NEW |
| `admin-web/public/firebase-messaging-sw.js` | NEW or MODIFY |
| `docs/threat-model.md` | MODIFY (§I-A2 status) |
| `docs/adr/0026-fcm-device-token-vs-topic.md` | NEW |

---

## Out of scope

- Migrating existing `customer_<uid>` / `technician_<uid>` topic subscriptions —
  apps will simply stop receiving topic pushes once API switches; rebuild on next app
  launch is fine
- Multi-device per user is allowed (returned as a list); no device-cap enforcement
- Web Push for customer-app (out of scope — customer-app is Android-only)
- E-A2 admin role hardening (separate story)

---

## Execution order

1. WS-A + WS-B (schema, repo, endpoints) — TDD red first
2. WS-D client-side registrars (customer + technician + admin-web) — independent, can
   parallelize across 3 subagents
3. WS-C FCM service refactor — depends on tokens being registered
4. WS-E daily TTL prune — independent
5. WS-F threat-model + ADR
6. Smoke gates (all four)
7. Codex review → push → PR
