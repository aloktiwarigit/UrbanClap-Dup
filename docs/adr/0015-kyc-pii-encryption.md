# ADR 0015 — KYC PII Encryption at Rest (PAN Number)

**Status:** Accepted
**Date:** 2026-04-29
**Closes:** Issue #84 — PAN number persisted in Cosmos in cleartext

---

## Context

The technician KYC flow extracts PAN numbers via Azure Form Recognizer OCR and stores them in Cosmos DB (`technicians` container, `kyc.panNumber`). Before this ADR, the full cleartext PAN was written to Cosmos, violating DPDP §8 (data minimisation) and standard security practice for Aadhaar-linked identifiers.

PAN numbers are 10-character alphanumeric identifiers (`AAAAA9999A`). They are used by the Indian Income Tax department and, in combination with Aadhaar, constitute sensitive financial PII subject to DPDP 2023 and RBI data-localisation requirements.

---

## Decision

Apply **AES-256-GCM** symmetric encryption to the cleartext PAN before any Cosmos write.

### What is stored in Cosmos

| Field | Value |
|---|---|
| `kyc.panNumber` | Masked value only — digits replaced: `ABCDE1234F` → `ABCDE####F` |
| `kyc.panNumberEncrypted` | `EncryptedPan` blob: `{ iv, ciphertext, tag, v: 1 }` (all base64) |

The cleartext PAN **never** reaches Cosmos, any log, or any API response.

### Encryption parameters

- **Algorithm:** AES-256-GCM (authenticated encryption — provides confidentiality + integrity)
- **Key:** 32-byte secret loaded from `COSMOS_PAN_ENCRYPTION_KEY` environment variable (base64-encoded)
- **IV:** 12 random bytes generated per call via `node:crypto.randomBytes(12)`
- **Auth tag:** 16-byte GCM tag appended in the blob (`tag` field)
- **Blob versioning:** `v: 1` field reserved for future key-rotation migrations

### Why not Azure Key Vault

Azure Key Vault is not in the free tier at pilot scale (≤5,000 bookings/month). The ₹0/month operational constraint is binding. AES-256-GCM with an env-var key achieves equivalent at-rest confidentiality without per-operation API call costs.

The key is stored in Azure Functions Application Settings (encrypted at rest by Azure) and rotated manually via the procedure below. This is an acceptable trade-off for pilot scale; a Key Vault migration ADR should be raised if the project scales beyond the free tier.

### API surface changes

- `GET /v1/kyc/status` — returns `panNumber` (masked) only. `panNumberEncrypted` is never sent to clients.
- `POST /v1/kyc/pan-ocr` — now returns masked `panNumber` in response body. Encrypted blob stored in Cosmos.
- `GET /v1/users/me/data-export` — DPDP §11 right-to-access: decrypts blob and returns `panDecrypted` field alongside the masked `panNumber`. If decryption fails (key rotation in progress), `panDecrypted` is `null` and the masked value is returned.

### No migration required

`panNumberEncrypted` is an **optional** field. Existing Cosmos documents without it remain valid. The encrypted blob is populated on the next `POST /v1/kyc/pan-ocr` resubmit. Masked-only records are fully supported throughout the codebase.

---

## Key Rotation Procedure

1. Generate a new 32-byte key: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
2. Deploy the new value as `COSMOS_PAN_ENCRYPTION_KEY_NEW` alongside the existing `COSMOS_PAN_ENCRYPTION_KEY`.
3. Write a one-off migration script that:
   a. Reads each technician doc with `panNumberEncrypted.v === 1`
   b. Decrypts using the old key
   c. Re-encrypts using the new key (new IV per record)
   d. Upserts the doc with the new blob and `v: 2`
4. After migration is verified, set `COSMOS_PAN_ENCRYPTION_KEY` to the new value and remove `COSMOS_PAN_ENCRYPTION_KEY_NEW`.
5. Update `v` literal in `EncryptedPanSchema` to `z.literal(2)` (or extend to `z.union([z.literal(1), z.literal(2)])`).

---

## Consequences

**Positive:**
- Cleartext PAN never persists in Cosmos, logs, or API responses.
- GCM auth tag ensures integrity — tampered ciphertexts are detected and rejected.
- Random IV per call prevents ciphertext correlation across technicians.
- DPDP §8 compliance restored. DPDP §11 data export still provides the cleartext PAN (decrypted) to the data principal.
- Zero additional operational cost at pilot scale.

**Negative / Trade-offs:**
- Encrypted blob cannot be queried in Cosmos (e.g. "find all technicians with PAN X"). This is not a required query path.
- Key loss = data loss for encrypted blobs. Masked `panNumber` remains, but the full PAN is unrecoverable. Treat `COSMOS_PAN_ENCRYPTION_KEY` as a critical secret.
- Key rotation requires a migration script (see above).

---

## Alternatives Considered

| Option | Rejected because |
|---|---|
| Azure Key Vault | Not free tier at pilot scale (₹0 constraint) |
| Hash + lookup table | One-way — can't satisfy DPDP §11 right-to-access (export) |
| Tokenisation service | Paid SaaS, violates `feedback_paid_tools.md` |
| No encryption (status quo) | Issue #84 — direct DPDP violation |
