# DPDP Data Inventory

**Owner:** Alok Tiwari (sole operator)
**Reviewed:** 2026-04-26
**Applies to:** homeservices-mvp (brand: Home Heroo) — pilot in Ayodhya, UP, India.
**Statute:** Digital Personal Data Protection Act, 2023 (DPDP Act).

This document is the auditor-facing source of truth for which Personally
Identifiable Information (PII) the platform stores, why we store it, how long
we retain it, and which fields are returned by `GET /v1/users/me/data-export`
(DPDP §11) and erased/anonymized by `POST /v1/users/me/erasure-request` (§12).

The defensive test
[`api/tests/integration/dpdp-data-inventory.test.ts`](../api/tests/integration/dpdp-data-inventory.test.ts)
parses the machine-readable JSON block at the bottom of this file and asserts
that every key declared in `exportedKeys` is present in the data-export
response. Adding a new top-level export key without updating this file will
fail CI.

---

## Field-by-field PII inventory

> **Legend.** Lawful basis: the §7 sub-clause supporting our processing. ✅ =
> field is included in the §11 export response. 🟡 = retained but anonymized
> on §12 erasure (financial / audit-immutability requirements). ⚫ = hard-deleted
> on erasure (no retention basis).

### Customer-side PII

| Field | Container | Purpose | Retention | Lawful basis | §11 export | §12 erasure |
|---|---|---|---|---|---|---|
| `customerId` (Firebase uid) | derived from auth | Identity for booking, ratings, support | Lifetime of relationship | §7(a) consent | ✅ in `userId` | 🟡 anonymized hash |
| Name (display name from Firebase) | Firebase Auth | Display in admin tools / receipts | Auth-managed | §7(a) consent | ✅ in `profile` | ⚫ Firebase Auth user deleted out-of-band |
| Phone (from Firebase Auth) | Firebase Auth | OTP login + technician contact | Auth-managed | §7(a) consent | ✅ in `profile.uid` echo | ⚫ Firebase Auth user deleted out-of-band |
| Booking address text | `bookings.addressText` | Service delivery | 1y after booking close, then aggregate-only | §7(a) consent | ✅ in `bookings[]` | 🟡 replaced with `[deleted]` |
| Booking address lat/lng | `bookings.addressLatLng` | Dispatcher routing | 1y after booking close | §7(a) consent | ✅ in `bookings[]` | 🟡 replaced with `{lat:0, lng:0}` |
| Slot date/window | `bookings.slot*` | Service scheduling | 1y after booking close | §7(a) consent | ✅ in `bookings[]` | 🟡 retained (not PII alone) |
| Razorpay payment IDs | `bookings.payment*` | Reconciliation, refunds | 7y per RBI guidelines | §7(b) contract | ✅ in `bookings[]` | 🟡 retained (financial record) |
| Booking photos (before/after) | `bookings.photos[]` | Service quality, complaint resolution | 90d after booking close | §7(a) consent | URL list in `bookings[]` | 🟡 dropped (URLs unset on cascade) |
| Rating + comment to technician | `ratings.customerComment` | Quality signal | 2y | §7(a) consent | ✅ in `ratings[]` | 🟡 comment dropped, numeric rating retained anonymously |
| Complaint description | `complaints.description` | Dispute resolution | 2y after resolution | §7(a) consent + §7(d) public interest (safety) | ✅ in `complaints[]` | 🟡 replaced with `[deleted]` |
| Complaint photo path | `complaints.photoStoragePath` | Dispute evidence | 2y after resolution | §7(d) public interest | ✅ in `complaints[]` | 🟡 path unset |
| FCM customer topic subscriptions | (topic-based, no doc) | Push notifications | Lifetime of relationship | §7(a) consent | Acknowledged in `fcmTokens.acknowledged` | 🟡 implicit (topic subscription stops with Firebase Auth deletion) |
| Audit log entries (resourceId = customerId) | `audit_log` | DPDP §8(7) accountability | 5y minimum (audit immutability) | §7(d) legal compliance | ✅ in `auditLogEntries[]` (last 90d) | 🟡 NEVER deleted; `resourceId` anonymized |

### Technician-side PII

| Field | Container | Purpose | Retention | Lawful basis | §11 export | §12 erasure |
|---|---|---|---|---|---|---|
| `technicianId` (Firebase uid) | derived from auth | Identity, dispatch, payout | Lifetime of relationship | §7(b) contract | ✅ in `userId` | 🟡 anonymized hash |
| Display name | `technicians.displayName` | Customer-visible profile | Lifetime of relationship | §7(b) contract | ✅ in `profile` | ⚫ container doc hard-deleted |
| Skills | `technicians.skills` | Dispatch routing | Lifetime of relationship | §7(b) contract | ✅ in `profile` | ⚫ container doc hard-deleted |
| Geospatial location | `technicians.location` | Dispatch | Real-time only | §7(b) contract | ✅ in `profile` | ⚫ container doc hard-deleted |
| Availability windows | `technicians.availabilityWindows` | Dispatch | Lifetime of relationship | §7(b) contract | ✅ in `profile` | ⚫ container doc hard-deleted |
| Aadhaar masked (last 4) | `technicians.kyc.aadhaarMaskedNumber` | KYC compliance (Code on Social Security 2020) | Lifetime + 1y | §7(d) legal compliance | ✅ masked in `kyc.aadhaarMaskedNumber` | ⚫ hard-deleted (KYC PII cannot be retained post-erasure) |
| PAN number | `technicians.kyc.panNumber` | KYC + GST/TDS | Lifetime + 1y | §7(d) legal compliance | ✅ masked-on-export in `kyc.panNumber` (first 5 chars masked) | ⚫ hard-deleted |
| PAN image path | `technicians.kyc.panImagePath` | Auditor verification | Lifetime + 1y | §7(d) legal compliance | NOT exported (audit-only) | ⚫ hard-deleted (storage path) |
| FCM token | `technicians.fcmToken` | Job offers, earnings updates | Lifetime of relationship | §7(b) contract | Acknowledged in `fcmTokens.acknowledged` | ⚫ cleared from doc; doc then hard-deleted |
| Booking record (as fulfilling technician) | `bookings.technicianId` | Service history, earnings | 7y per RBI | §7(b) contract | ✅ in `bookings[]` | 🟡 `technicianId` anonymized |
| Booking event log | `booking_events` | Operational ledger | 7y | §7(b) contract | NOT in §11 (operational, not PII export) | 🟡 `technicianId`/`adminId` anonymized |
| Dispatch attempt | `dispatch_attempts.technicianIds[]` | Dispatch ledger | 90d | §7(b) contract | NOT in §11 (operational) | 🟡 array entry replaced with anonymized hash |
| Wallet ledger entries | `wallet_ledger.technicianId` | Payouts, RBI 7y reconciliation | 7y per RBI guidelines | §7(d) legal compliance (financial record) | ✅ in `walletLedger[]` | 🟡 `technicianId` anonymized; entries retained |
| Razorpay linked account ID | `technicians.razorpayLinkedAccountId` | Payouts | Lifetime + 7y | §7(d) legal compliance | NOT exported (sensitive financial routing) | ⚫ hard-deleted with technician doc |
| SSC levy aggregate | `ssc_levies` | Code on Social Security 2020 reporting | 7y | §7(d) legal compliance | NOT applicable (quarterly aggregate, no per-tech PII) | N/A |
| Audit log entries (resourceId = technicianId) | `audit_log` | DPDP §8(7) accountability | 5y minimum | §7(d) legal compliance | ✅ in `auditLogEntries[]` (last 90d) | 🟡 NEVER deleted; `resourceId` anonymized |

---

## §8 retention summary

- **Booking PII:** 1y after booking close → drops below 80% of records.
- **Financial records (bookings.payment*, wallet_ledger):** 7y (RBI / GST).
- **KYC (Aadhaar/PAN):** lifetime of partnership + 1y, then hard-deleted.
- **Audit log:** 5y minimum (DPDP §8(7) accountability + audit immutability invariant).
- **Photos:** 90d post-close.
- **Ratings comments:** 2y (numeric ratings retained anonymously beyond that).
- **Dispatch attempts:** 90d (operational, no aggregate value beyond that).

## §6 purpose limitation

We do not process PII for any purpose beyond the lawful basis declared in the
table above. Any new processing purpose requires:

1. ADR documenting the new purpose
2. Update to this inventory (and bump `dataInventoryVersion`)
3. Update to user consent UI in `customer-app` / `technician-app`

## §11 right-to-access — implementation

- Endpoint: `GET /v1/users/me/data-export`
- Returns the JSON document whose top-level keys are listed in the
  machine-readable inventory below.
- Aadhaar is masked (last-4 only). PAN is masked (first 5 chars replaced with X).
- Booking photos export the URL list (the URL itself contains a Firebase
  Storage path; revoking export means the URLs can no longer be resolved by
  signed URL after the relevant booking is closed and PII is dropped).
- Customer name + phone are stored in Firebase Auth, not Cosmos. The export
  echoes the uid; full Firebase Auth user properties are available to the user
  via the Firebase client SDK.

## §12 right-to-erasure — implementation

- Endpoint: `POST /v1/users/me/erasure-request` (with confirmation phrase
  `DELETE MY ACCOUNT`).
- Cool-off: 7 days. User can revoke via `DELETE /v1/users/me/erasure-request`.
- Auto-execution: Azure Functions timer runs daily at 02:00 UTC and processes
  any PENDING requests past their `scheduledDeletionAt`.
- Cascade rules per the table above.
- Anonymization is irreversible: `SHA-256(uid + per-request salt)`. The salt
  is retained on the erasure request document only — it is not used as a
  reverse-lookup tool, and is destroyed when the erasure request itself is
  archived.

## §12(2) denial

DPDP §12(2) permits denial for specific reasons. We support three:

1. `legal-hold` — active dispute / court order / arbitration.
2. `regulatory-retention-conflict` — RBI / GST / KYC retention period not yet
   elapsed.
3. `fraud-investigation` — open investigation where deletion would impair
   safety or platform integrity.

Admin denial sends an FCM notification with the reason and writes an
`ERASURE_DENIED` audit log entry citing the §12(2) basis.

## §10 breach notification

See `docs/runbook.md` → "DPDP 72-hour breach notification" addendum
(2026-04-26).

---

## Machine-readable inventory (consumed by tests)

The defensive test
[`api/tests/integration/dpdp-data-inventory.test.ts`](../api/tests/integration/dpdp-data-inventory.test.ts)
parses this fenced JSON block and asserts each declared key is a top-level
property of the `/v1/users/me/data-export` response.

```json
{
  "dataInventoryVersion": 1,
  "exportedKeys": {
    "CUSTOMER": [
      "userId",
      "role",
      "profile",
      "bookings",
      "ratings",
      "complaints",
      "kyc",
      "walletLedger",
      "fcmTokens",
      "auditLogEntries",
      "generatedAt"
    ],
    "TECHNICIAN": [
      "userId",
      "role",
      "profile",
      "bookings",
      "ratings",
      "complaints",
      "kyc",
      "walletLedger",
      "fcmTokens",
      "auditLogEntries",
      "generatedAt"
    ]
  }
}
```
