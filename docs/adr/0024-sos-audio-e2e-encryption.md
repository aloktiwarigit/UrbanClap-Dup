# ADR-0024 — SOS Audio End-to-End Encryption

**Status:** Accepted  
**Date:** 2026-05-16  
**Deciders:** Alok Tiwari  
**Scope:** customer-app + api + Firebase Storage  

---

## Context

The PRD (§ Emergency SOS) requires that SOS audio is "encrypted on device" before upload, and that admin-only playback is gated behind re-authentication. The existing SOS flow (E11-S05b-1) records a `.m4a` file to `filesDir/sos/` but never uploads it. Two open threat-model items drive this story:

- **S-A1** — FCM `owner_alerts` topic payload included `slotAddress`, a PII field visible to any subscriber.  
- **I-A2** — The same FCM payload disclosed the slot address over an unencrypted FCM topic channel.

---

## Decision

**AES/GCM/NoPadding 256-bit client-side encryption**, per incident, with a random key and IV.

### Encryption scheme

- Key: `KeyGenerator.getInstance("AES").init(256).generateKey()` — fresh per incident.
- IV: 12 random bytes from `SecureRandom`.
- Cipher: `Cipher.getInstance("AES/GCM/NoPadding")` with `GCMParameterSpec(128, iv)`. `doFinal` appends the 16-byte authentication tag.
- Encoding: `java.util.Base64` (pure JVM; avoids Robolectric dependency in unit tests).

### Storage

Encrypted blob → Firebase Storage: `sos-audio/{customerId}/{incidentId}.enc`  
Storage rules gate writes to the authenticated `customerId` UID; reads require `admin` custom claim.  
GCS lifecycle rule deletes objects in `sos-audio/` after 7 days (see `infra/firebase/sos-audio-lifecycle.json`).

### Key transport

After upload succeeds, the customer-app POSTs `{ keyB64, ivB64, storagePath }` to `POST /v1/sos/{incidentId}/key`. The API writes a `sos_incident_keys` Cosmos document partitioned by `/customerId` with `defaultTtl = 604800` (7 days). No key is ever written to disk client-side.

### Admin playback

`GET /v1/admin/sos/{incidentId}/playback-token` — roles: `super-admin`, `ops-manager` + TOTP fresh within 5 minutes — returns a V4 signed Storage URL (5-min TTL), `keyB64`, and `ivB64`. The admin-web client decrypts in-browser using `crypto.subtle.decrypt({ name: 'AES-GCM', iv })`.

### FCM PII trim

`sendOwnerSosAlert` payload trimmed to opaque IDs only (`bookingId`, `customerId`, `technicianId`, `incidentId`). `slotAddress` removed. Address resolution requires an authenticated admin round-trip via `GET /v1/admin/sos/{incidentId}`.

---

## Consequences

**Positive**
- No plaintext audio on our infrastructure — neither the blob nor the key alone is sufficient to recover plaintext.
- Key and blob siloed across two services (Cosmos + Firebase Storage); an attacker must compromise both.
- FCM topic payloads carry no PII; I-A2 mitigated.
- 7-day TTL enforced at both storage layers; data minimisation by design.

**Negative / Trade-offs**
- Admin playback requires ~50 LOC of WebCrypto JS in admin-web.
- TOTP re-authentication within 5 minutes creates UX friction for operations staff.
- GCS lifecycle rule is out-of-band (must be applied via `gcloud` — see `docs/runbook.md → SOS audio retention`).

---

## Alternatives Rejected

| Alternative | Reason rejected |
|---|---|
| Server-side encryption only | Fails the PRD requirement "encrypted on device" |
| Forensic-only (no admin playback) | Acceptable as a Phase-2 fallback per spec §1, but owner chose to include playback at launch |
| Using Android Keystore | Would tie the key to the device — unrecoverable if device is replaced mid-incident |
