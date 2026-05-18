# E19-S01 — PAN Encryption (Threat I-A1 Mitigation)

**Tier:** Foundation security-sensitive | **Deps:** none | **Threat:** I-A1 (`docs/threat-model.md` §A.4)
**Goal:** Eliminate cleartext PAN persistence in Cosmos. DPDP Act compliance gate for launch.

---

## Problem statement

`panNumber` is stored as a plain string on the technician KYC sub-document
(`api/src/schemas/kyc.ts:13`, written by `api/src/cosmos/technician-repository.ts:28-29`,
read by `api/src/services/formRecognizer.service.ts:25`). Cosmos at-rest encryption
protects against disk-level theft but every read by every Function — including a
future support-role admin or a stolen connection string — exposes the full PAN.

**Status:** `not-yet-mitigated`. **Impact:** DPDP Act sensitive personal data exposure.

---

## Approach (chosen)

**Store only:**
1. `panMaskedNumber` — last 4 digits, plaintext (e.g., `XXXXX1234D`) — for display + UX
2. `panHash` — SHA-256 of the normalized PAN (uppercase, no whitespace) — for duplicate-detection / lookup

**Discard the raw PAN immediately after Form Recognizer extraction.**

This avoids Always Encrypted (Cosmos Serverless lacks full CMK support and adds RU
overhead). Hash-based lookup is sufficient for the only existing use case (detecting
a re-submitted PAN). Display only needs the last 4 digits per UPI/banking convention.

**Rejected alternatives:**
- Cosmos Always Encrypted with CMK — Serverless tier limits; adds 2-3x RU cost on
  encrypted-column reads; CMK rotation operationally heavy at pilot scale.
- App-layer AES-GCM with KMS-stored key — same operational burden; Hash+mask gives
  the same security with simpler code.

---

## Pattern citations

- `api/src/services/sos.service.ts` (post E11-S05b-2) — AES-GCM precedent for crypto
  patterns. PAN does NOT need symmetric encryption; hash is one-way and sufficient.
- `docs/adr/0015-kyc-pii-encryption.md` — current ADR; this story SUPERSEDES it by
  removing the encryption requirement (hash+mask is the new approach).

---

## Architecture overview

### Before

```
KycDoc {
  technicianId: string;
  panNumber: "ABCDE1234F";     // PII LEAK
  panImageStoragePath: string;
  aadhaarVerified: boolean;
}
```

### After

```
KycDoc {
  technicianId: string;
  panMaskedNumber: "XXXXX1234F";       // last 4 + check letter, plaintext
  panHash: "sha256-hex-of-normalized-pan";  // 64 chars, deterministic
  panImageStoragePath: string;
  aadhaarVerified: boolean;
}
```

### Migration

Backfill script reads existing docs, computes `panMaskedNumber` + `panHash` from
`panNumber`, writes both, then deletes `panNumber`. Run once with a snapshot timestamp
to ensure idempotency.

---

## Work streams

### WS-A: Schema + utility

**Files:**
- `api/src/schemas/kyc.ts` (MODIFY) — remove `panNumber`, add `panMaskedNumber` + `panHash`
- `api/src/services/pan.utils.ts` (NEW) — `normalizePan(raw): string`, `maskPan(raw): string`, `hashPan(raw): string`
- `api/tests/services/pan.utils.test.ts` (NEW)

**Tests (TDD red first):**
- `normalizePan` strips whitespace + uppercases
- `maskPan` returns `XXXXX1234D` for `ABCDE1234D`
- `hashPan` is deterministic + same input → same hash + different inputs → different hashes
- Schema rejects writes containing the old `panNumber` field (strict mode)

### WS-B: Repository + service migration

**Files:**
- `api/src/cosmos/technician-repository.ts` (MODIFY) — `upsertKyc` accepts only the new fields
- `api/src/services/formRecognizer.service.ts` (MODIFY) — extract PAN → compute mask+hash → pass to repo → discard raw immediately
- `api/src/functions/technicians.ts` (MODIFY) — any handler that returned `panNumber` now returns `panMaskedNumber` only
- `api/tests/services/formRecognizer.service.test.ts` (MODIFY) — assert raw PAN never persists; mask+hash written
- `api/tests/cosmos/technician-repository.test.ts` (MODIFY) — assert old `panNumber` rejected

### WS-C: Migration script

**File:** `api/scripts/migrate-pan-to-hash.ts` (NEW)

- Read all KYC docs that still have `panNumber`
- For each: compute `panMaskedNumber` + `panHash`, write both, delete `panNumber`
- Idempotent: skip docs that already have `panHash` and no `panNumber`
- Dry-run mode: report counts without writing
- Logs every write with a redacted summary (technicianId + before/after field names, no values)

**Run order at deploy time:**
1. Deploy this PR to prod (new schema accepts both old + new fields temporarily — strict-mode rejection lands in WS-D)
2. Run migration script in dry-run; verify count matches expected
3. Run migration for real
4. Verify zero docs still have `panNumber`
5. Deploy WS-D (strict schema) — old field becomes a hard reject

### WS-D: Strict-mode lockdown (separate follow-up PR after migration)

- Schema gains `.strict()` to reject writes containing `panNumber`
- Add Semgrep rule banning `panNumber` field name in any new `.ts` file under `api/src/`
- Update `docs/threat-model.md` §I-A1 to status `mitigated`
- Update `docs/adr/0015-kyc-pii-encryption.md` with a SUPERSEDED-BY note → ADR-0025 (new)
- New `docs/adr/0025-pan-hash-mask-storage.md` documents the final approach

### WS-E: Smoke gate

```bash
bash tools/pre-codex-smoke-api.sh
```

All 3 steps green before Codex review. Then `bash api/scripts/migrate-pan-to-hash.ts --dry-run`
against a local Cosmos emulator with seed data.

---

## File manifest

| Path | Action |
|---|---|
| `api/src/schemas/kyc.ts` | MODIFY |
| `api/src/services/pan.utils.ts` | NEW |
| `api/src/cosmos/technician-repository.ts` | MODIFY |
| `api/src/services/formRecognizer.service.ts` | MODIFY |
| `api/src/functions/technicians.ts` | MODIFY |
| `api/scripts/migrate-pan-to-hash.ts` | NEW |
| `api/tests/services/pan.utils.test.ts` | NEW |
| `api/tests/services/formRecognizer.service.test.ts` | MODIFY |
| `api/tests/cosmos/technician-repository.test.ts` | MODIFY |
| `docs/threat-model.md` | MODIFY (§I-A1 status update — in WS-D) |
| `docs/adr/0015-kyc-pii-encryption.md` | MODIFY (superseded-by note — in WS-D) |
| `docs/adr/0025-pan-hash-mask-storage.md` | NEW (in WS-D) |

---

## Out of scope

- Aadhaar number storage (handled separately by DigiLocker consent flow — only consent
  receipt token is stored, not the raw Aadhaar)
- Always Encrypted CMK approach (rejected per Approach §)
- Admin-web display changes (the only place PAN is displayed is admin technician detail;
  WS-B's `panMaskedNumber` projection is a drop-in replacement)
- Migration of historical bookings or other PII (this story only addresses KYC PAN)

---

## Execution order

1. WS-A (schema + utility) — TDD red first
2. WS-B (repo + service migration) — TDD red first
3. WS-C (migration script) — dry-run tested against local Cosmos emulator
4. Pre-Codex smoke gate
5. Codex review → push → PR
6. **After merge + prod migration verified:** open follow-up PR for WS-D (strict-mode lockdown)
