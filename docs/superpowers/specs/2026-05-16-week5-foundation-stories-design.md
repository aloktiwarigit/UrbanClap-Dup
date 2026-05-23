# Week 5 Foundation Stories — Brainstorm Spec

**Date:** 2026-05-16
**Author:** Claude Opus 4.7 (architect persona)
**Scope:** Design decisions for E11-S05b-2 (SOS audio encryption), E17-S02 (periodic location push), E16-S04 (address picker). Drives the three Foundation-tier plans committed in this PR.
**Roadmap source:** `docs/superpowers/plans/2026-05-12-customer-app-gap-closure-roadmap.md` §Week 5

This is the brainstorm output for the Foundation-tier Week 5 stories. The six Feature-tier stories (E11-S04, E11-S05a, E11-S05c, E17-S01, E16-S02, E16-S05) reuse patterns already proven in W1–W4 and need no brainstorm.

Per `feedback_autonomous_decisions.md`, sub-decisions were made autonomously with the owner-input items flagged explicitly below.

---

## 1. E11-S05b-2 — SOS audio truth-up

**Threats mitigated:** S-A1 + I-A2 (FCM topic PII leak in SOS payload). PRD requires "encrypted on device" — the audio must be encrypted before leaving the phone, not just at rest in Firebase Storage.

### Design

- **Client-side encryption:** AES/GCM/NoPadding, 256-bit key, 96-bit IV, 128-bit tag. Per-incident random key generated client-side via `KeyGenerator.getInstance("AES")`. The IV is prepended to the ciphertext for storage.
- **Storage path:** `sos-audio/{customerId}/{incidentId}.enc`. Firebase Storage rules permit write only by authenticated customer with matching uid; read only by admin custom-claim.
- **Storage TTL:** Firebase Storage lifecycle rule on the `sos-audio/` prefix — delete objects 7 days after creation. Configured in `firebase.storage.rules` deploy pipeline (not in code).
- **Key management:** New Cosmos container `sos_incident_keys` partitioned by `/customerId`, Cosmos TTL 7 days. Doc shape `{ id: incidentId, customerId, keyB64, ivB64, createdAt }`. Cosmos default at-rest encryption protects the key.
- **Owner playback:** new admin endpoint `GET /v1/admin/sos/{incidentId}/playback-token` returns `{ signedStorageUrl (5-min TTL), keyB64, ivB64 }` to admin web (auth: admin role + TOTP-fresh session). Admin web decrypts in-browser using WebCrypto `crypto.subtle.decrypt`. Audio is never persisted plaintext on our infra.
- **Customer-app upload flow (extends existing SOS):**
  1. `SosViewModel.startRecording()` → MediaRecorder writes to a tmp file.
  2. On stop, read tmp → encrypt → upload encrypted blob via `FirebaseStorage.reference().putBytes()` with `onProgress` and `onSuccess` callbacks (callbackFlow per `docs/patterns/firebase-callbackflow-lifecycle.md`).
  3. Server endpoint `POST /v1/sos/{incidentId}/key` accepts `{ keyB64, ivB64, storagePath }` from the authenticated customer-app and writes the Cosmos key doc.
  4. Existing `sendOwnerSosAlert` FCM payload is amended: drop `slotAddress` (PII) from topic broadcast; admin-app fetches details via authenticated `GET /v1/admin/sos/{incidentId}` instead.
- **Feature flag:** new `customer.sos-audio-upload.enabled` (default off; flip on Week 5 exit after E2E test).

### New ADR-0024 — SOS audio E2E encryption + retention

Documents the AES-GCM scheme, key-doc format, 7-day TTL on both blob + key, admin playback flow, threat-model mitigations.

### Owner decision flagged

**Q: Owner playback in admin web — yes or no?**
- **Default Yes** per roadmap §"Open Decisions #1" (Option A: "owner can listen"). Plan written for this path.
- If owner prefers forensic-only (no playback ever), drop the key-doc + admin endpoint. Ciphertext sits in Storage for 7 days as evidence; never decrypted by us. Reduces blast radius further.

### Open items for the plan
- Existing `SosViewModel` already lives at `customer-app/.../ui/tracking/SosViewModel.kt` — extends, not replaces.
- Storage rules update: `request.auth.token.role == 'admin'` on read; `request.auth.uid == request.path.split('/')[1]` on write.
- Tests: encrypt-decrypt round-trip JVM test, MediaRecorder lifecycle test (Robolectric), admin endpoint integration test.

---

## 2. E17-S02 — Periodic 30s location push (cross-app)

**Threats mitigated:** D-L1 (DoS on location endpoint) + accepted residual risk on FOREGROUND_SERVICE_LOCATION usage.

### Design

- **Tech-app: foreground service**, **not WorkManager**.
  - WorkManager's minimum periodic interval is 15 minutes — too coarse.
  - `LocationForegroundService` started on job state transition into `EN_ROUTE` / `REACHED` / `IN_PROGRESS`; stopped on `COMPLETED` / `CANCELLED` / `NO_SHOW`.
  - Uses `FusedLocationProviderClient.requestLocationUpdates` with `LocationRequest.Builder(30_000L).setPriority(Priority.PRIORITY_BALANCED_POWER_ACCURACY).setMinUpdateDistanceMeters(15f).build()`.
  - `setMinUpdateDistanceMeters(15f)` suppresses idle pings — tech sitting still does not generate a 30s call. Saves battery + API calls.
  - Battery estimate: ~2-3% per hour on a 45-min average job. Acceptable per ADR-0019 risk register.

- **Foreground notification (Channel `CHANNEL_ACTIVE_JOB`, IMPORTANCE_LOW, no sound):**
  - **EN title:** "Sharing location with customer"
  - **HI title:** "ग्राहक के साथ स्थान साझा कर रहे हैं"
  - **EN body:** "Only during active booking"
  - **HI body:** "केवल सक्रिय बुकिंग के दौरान"
  - Tap action: opens active-job screen via deep-link `homeservices://action/active-job/{bookingId}`.

- **App-lifecycle recovery:** on `Application.onCreate`, if there is a Room `active_job` row in `READY_FOR_LOCATION_PUSH` state (set by the state-transition observer), `LocationForegroundService.startIfNeeded(context, bookingId)` is called.

- **API:** `POST /v1/technicians/active-job/{bookingId}/location`
  - Body: `{ lat, lng, accuracyMeters, capturedAt }` (Zod-validated: lat ±90, lng ±180, accuracy ≤ 100m, capturedAt ≤ 90s old).
  - Auth: technician JWT + booking-owner check (assigned tech for this booking).
  - **Rate limit:** 1 req per 15 s per (techId, bookingId). 429 on exceed. Threat-model D-L1.
  - Writes `LiveLocationDoc` to `live_locations` Cosmos container (partitioned by `/bookingId`, TTL 3600s — 1h). Last-write-wins.
  - Publishes FCM data message `{ type: "LOCATION_UPDATE", bookingId, lat, lng, capturedAt }` to topic `customer_{customerId}` (note: this leaks customerId in topic name — already covered by S-A1; sensitive payload kept off).
  - GrowthBook flag `customer.periodic-location.enabled` gates the publish. When off, server still writes Cosmos (so admin observability works) but skips the FCM emit.

- **Customer-app reception:** existing `CustomerFirebaseMessagingService` adds a `LOCATION_UPDATE` branch → updates `LiveTrackingViewModel.location` via a new `LocationUpdateEventBus` (mirrors `NoShowCreditEventBus`). E17-S03 (W6) wires the stale-data heartbeat on top of this.

### New ADR-0019 — Periodic technician location push

Documents foreground-service choice (vs WorkManager), 30s cadence rationale, battery posture, FG-service permission requirements, kill-switch flag, rate-limit threat mitigation.

### Owner decision flagged

None. Cadence, channel, rate-limit, copy all decided per zero-cost + UX guidelines.

### Open items for the plan
- Tech-app: new `LocationForegroundService.kt`, manifest entries (`FOREGROUND_SERVICE_LOCATION` permission + `<service android:foregroundServiceType="location">`).
- API: new `active-job-location.ts` function + `LiveLocationRepository` + Zod schema + rate-limit middleware.
- Customer-app: new `LocationUpdateEventBus.kt` + FCM branch + `LiveTrackingViewModel.location` wiring.
- Tests cover: FG service lifecycle (Robolectric), rate-limit middleware (jest), Zod validation, FCM publish.

---

## 3. E16-S04 — Customer-app address picker

### Design

- **Google Maps Platform Places SDK**, with session tokens (required for bundled pricing).
- Predictions biased to Ayodhya: `RectangularBounds.newInstance(swCorner, neCorner)` covering the 25 km polygon corners, `setCountries("IN")`, `setOrigin(LatLng(26.7958, 82.1947))`. Predictions outside the rectangle still returned (Places SDK doesn't hard-filter) but ranked lower.
- **Quota math (₹0 verification):**
  - Free tier: $200/mo credit, recurring.
  - Autocomplete (session-based): $2.83 per 1k sessions. 5k bookings/mo × 2 sessions/booking = 10k sessions = $28.30/mo.
  - Reverse geocoding on drag-end: $5 per 1k calls. 5k bookings × 1.5 = 7.5k calls = $37.50/mo.
  - Total: ~$65.80/mo. Headroom: **~15k bookings/mo before the credit cracks.** Pilot is ≤5k/mo.

- **Draggable pin:** marker initialized at autocomplete-selected place; `Marker.isDraggable = true`; `GoogleMap.setOnMarkerDragListener` → on `onMarkerDragEnd`, debounce 500ms → fire reverse-geocode via `Geocoder.getFromLocation` (Android built-in, falls back to Maps Geocoding API). Update the formatted-address text. Failure → keep lat/lng, show "Location set — confirm pin" without a friendly address.

- **Manual fallback:** if `PlacesClient.findAutocompletePredictions` errors or returns empty after a 2-second timeout, switch the predictions list off and surface inline message "Search unavailable — drop a pin on the map." Map remains interactive. Same path serves fully-offline.

- **Service-area refusal UX:**
  - Client bundles the same Ayodhya GeoJSON polygon used server-side in `customer-app/app/src/main/assets/service-area-ayodhya.geojson` (read at app start, cached as `Polygon` object).
  - On `Continue` tap, `LocalServiceAreaCheck.isInside(lat, lng)` runs.
  - If outside: Continue button is replaced with a banner — "We don't serve this area yet" + secondary CTA "Notify me when available" → routes to `WaitlistScreen` which collects optional phone (default to authenticated phone) and posts to `POST /v1/waitlist`.
  - Server `POST /v1/bookings` (E16-S01) is still the authoritative gate; this is defence-in-depth + better UX (no round-trip for the refusal).

- **Waitlist endpoint:** `POST /v1/waitlist { phone, lat, lng, serviceId, requestedAt }` writes a single Cosmos doc in `customer_waitlist` container (partitioned by `/phone`). No automation; admin reads via `GET /v1/admin/waitlist?page=&limit=`.

- **Feature flag:** `customer.places-autocomplete.enabled`. Default off. Flip on at Week 5 exit, geo-gated (only customers whose IP geolocates to UP — defer the geo-gate to runtime check in flag rule, not code).

### Owner decision flagged

**Q: Waitlist endpoint scope** — default is **single Cosmos doc + admin CSV export.** Alternatives: email-collection + drip campaign (Phase 2 epic; needs Azure Communication Services + opt-in copy). Plan written for the default.

### Open items for the plan
- New customer-app files: `ui/booking/AddressPickerScreen.kt` (replaces existing `AddressScreen.kt` if any), `AddressPickerViewModel.kt`, `LocalServiceAreaCheck.kt`, `WaitlistScreen.kt`, `WaitlistViewModel.kt`.
- New API endpoint: `api/src/functions/waitlist.ts`.
- New asset: `assets/service-area-ayodhya.geojson` (copy of server-side polygon).
- `app/build.gradle.kts`: Places SDK dep, BuildConfig `MAPS_API_KEY` env-driven.
- `AndroidManifest.xml`: `<meta-data android:name="com.google.android.geo.API_KEY">` + `INTERNET`, `ACCESS_FINE_LOCATION` (already present).
- Tests: VM tests for autocomplete state, polygon check, refusal flow; Paparazzi for AddressPickerScreen + WaitlistScreen (both `@Ignored`).

---

## Cross-cutting items for all three plans

- **First task in every Android plan: sync `libs.versions.toml` from customer-app to technician-app** if the story touches tech-app. Prevents post-Codex drift.
- **All new Paparazzi tests `@Ignored`** per `docs/patterns/paparazzi-cross-os-goldens.md`. Goldens recorded post-merge via `paparazzi-record.yml` workflow_dispatch (existing W4 follow-up backlog).
- **Pre-Codex smoke gate** (6-step) is the last work stream of every plan.
- **TDD non-negotiable** — test file before implementation file per `~/.claude/CLAUDE.md`.
- **`/security-review` triggered for** E11-S05b-2 (encryption, PII) + E17-S02 (auth, location PII) + E16-S04 (geo-spoofing surface). E16-S05, E17-S01 do not trigger.
- **Threat-model addendum** appended in PR: row for E11-S05b-2 mitigates S-A1 + I-A2; E17-S02 verifies D-L1; E16-S04 confirms T-B1 client-side defence-in-depth.

## Plan-line-count guard rail

Each plan targets the size-gate budgets from CLAUDE.md:
- Foundation: ≤1500 lines (each of these three should land ~250–500 lines)
- Feature: ≤800 lines (each of the six Feature plans should land ~150–300 lines)
