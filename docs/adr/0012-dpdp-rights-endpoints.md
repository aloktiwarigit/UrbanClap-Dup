# ADR-0012: DPDP Rights Endpoints + Data Inventory + Breach Playbook

**Status:** Accepted (2026-04-27)
**Deciders:** Alok Tiwari (sole operator)
**Story:** E10-S05 — DPDP rights endpoints + data inventory
**Supersedes:** none
**Superseded by:** none

## Context

Pilot launches in Ayodhya, Uttar Pradesh. The Digital Personal Data Protection
Act 2023 (DPDP Act) applies nationwide — unlike the Karnataka Platform-Based
Gig Workers Welfare Act, it has no state ring-fence. Without rights endpoints
in place, the first customer or technician who requests their data and is
refused becomes a regulatory complaint to the DPDP Board. That complaint is a
launch-blocker.

DPDP §11 grants every "data principal" the right to access their personal
data. §12 grants the right to correct or erase it. §8 obliges the data
fiduciary (us) to maintain a data inventory + retention policy + 72-hour
breach playbook. §10 mandates breach notification within 72 hours.

Wave-1 audit issues #65, #67, #69, and #94 each track one of these gaps.

## Decision

We implement the DPDP rights surface as **customer/technician self-service
(read + submit) plus admin override (execute / deny)**, with the following
properties:

1. **Right-to-access (§11)** — single GET endpoint
   `GET /v1/users/me/data-export` that aggregates PII from every container the
   pilot stack touches (bookings, ratings, complaints, technician profile,
   KYC (masked), wallet ledger, audit log entries about the user). Aadhaar
   stays masked (last-4); PAN is masked (first-5). Returns a JSON document
   whose `dataInventoryVersion` matches the version in
   `docs/dpdp-data-inventory.md`.

2. **Right-to-erasure (§12)** — two-step submit + execute:
   - **Submit:** customer/tech `POST /v1/users/me/erasure-request` with
     confirmation phrase `DELETE MY ACCOUNT` (case-sensitive). 7-day cool-off
     before deletion. User may revoke via `DELETE` during the cool-off.
   - **Execute:** automatic via Azure Functions timer (daily at 02:00 UTC) once
     the cool-off elapses, OR manual via admin
     `PATCH /v1/admin/erasure-requests/{id}` (super-admin role only). The
     manual path enforces the same cool-off — admin cannot fast-track.
   - **Deny:** admin `PATCH /v1/admin/erasure-requests/{id}` with
     `{action: 'DENY', reason: <legal-hold|regulatory-retention-conflict|fraud-investigation>}`.
     Per §12(2), denial requires one of those three reasons; the user is
     notified via FCM with the reason and an audit log entry is written.

3. **Cascade with anonymization (not hard-delete) for retained data** —
   - **Hard-delete:** technician profile doc (incl. Aadhaar, PAN, FCM token).
     KYC PII categories cannot be retained post-erasure.
   - **Anonymize-and-retain:** bookings, ratings, complaints, wallet ledger,
     booking events, dispatch attempts, audit log entries. We replace PII
     fields (`customerId`, `technicianId`, `addressText`, `addressLatLng`,
     comments, descriptions) with a deterministic
     `SHA-256(uid + per-request salt)` so the records remain queryable for
     finance reconciliation, audit, and the platform-rating average — but
     can no longer be re-identified to a natural person.
   - **Audit log immutability:** entries are NEVER deleted. Only the
     `resourceId` field is anonymized. This preserves the audit-immutability
     invariant required by FR-9.4 and is consistent with §11(2) of DPDP which
     allows retention "for a legitimate purpose specified by law".
   - **Wallet ledger:** retained for 7 years per RBI/finance regulation. Only
     the `technicianId`/`partitionKey` are rewritten to the anonymized hash.

4. **Confirmation phrase as accidental-deletion guard.** The submit handler
   rejects any payload missing or mismatching the literal string
   `DELETE MY ACCOUNT`. Defends against typo/auto-fill mistakes and against
   unscoped CSRF (token-based auth means a forged request would still need
   the exact string).

5. **Defensive invariant test** — `dpdp-data-inventory.test.ts` parses the
   machine-readable JSON block in `docs/dpdp-data-inventory.md` and asserts
   that every declared `exportedKeys[role]` is a top-level property of the
   data-export response. Adding a new top-level export key without updating
   the inventory fails CI.

6. **72-hour breach playbook** — verified/added in `docs/runbook.md` (see
   "DPDP 72-hour breach notification" addendum). Covers data-principal
   notification (24h), DPDP Board notification (48h), full incident report
   (72h).

## Consequences

### Positive

- DPDP §11 + §12 coverage at launch — a customer/tech requesting deletion
  gets an in-app self-service path and a 7-day cool-off, not a regulatory
  complaint.
- Auditor can match the data-export response to the inventory document via
  `dataInventoryVersion`.
- Anonymization preserves operational invariants: rating average, financial
  reconciliation, audit immutability.

### Negative

- **Cosmos cross-container deletion is not transactional.** If the cascade
  fails partway, the request transitions to FAILED and an admin must retry.
  Idempotency: each cascade step's natural predicate ("rows where
  customerId = uid") becomes a no-op once executed, so retries are safe. We
  accept the operational cost of partial-failure visibility.
- **Anonymization is irreversible by design.** A natural-person mapping
  exists only via the per-request salt + uid + SHA-256 — and we destroy the
  salt when the erasure request is archived. There is no path to re-identify
  a deleted user. This is a feature, not a bug.
- **Adding new PII storage now requires inventory + ADR updates.** The
  defensive test fails CI if a new top-level export key lands without
  updating `docs/dpdp-data-inventory.md`. Burden falls on the developer.

### Neutral

- Customer profile (name, phone) lives in Firebase Auth, not Cosmos. We
  acknowledge this in the inventory; full Firebase Auth user deletion happens
  out-of-band (the customer can delete their Firebase Auth user via the
  client SDK; we do not have admin-side Firebase deletion in pilot scope).
  Listed as a known follow-up.

## References

- DPDP Act 2023 §6, §7, §8, §10, §11, §12, §12(2)
- RBI Master Direction — Outsourcing of Information Technology Services (7y
  retention basis for `bookings.payment*` and `wallet_ledger`).
- Code on Social Security 2020 (KYC retention basis for Aadhaar/PAN).
- Audit reports: `docs/audit/audit-log-coverage-2026-04-26.md`,
  `docs/compliance/traceability-matrix.md`.
- Wave-1 audit issues #65, #67, #69, #94.
- Implementation: `api/src/functions/users-data-export.ts`,
  `api/src/functions/users-erasure-request.ts`,
  `api/src/functions/admin/erasure-requests/{patch,execute,deny,list}.ts`,
  `api/src/functions/trigger-erasure-deadline.ts`,
  `api/src/services/dataExport.service.ts`,
  `api/src/services/erasureCascade.service.ts`,
  `api/src/cosmos/erasure-request-repository.ts`,
  `api/src/cosmos/user-data-export-reads.ts`,
  `api/src/cosmos/user-data-cascade-writes.ts`.
- Defensive test: `api/tests/integration/dpdp-data-inventory.test.ts`.
- Inventory: `docs/dpdp-data-inventory.md`.
- Breach playbook: `docs/runbook.md` § "DPDP 72-hour breach notification".
