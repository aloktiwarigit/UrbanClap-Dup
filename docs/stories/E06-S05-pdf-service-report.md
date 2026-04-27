# Story E06-S05: Customer-facing auto-generated PDF service report

Status: merged

> **Epic:** E06 — Service Execution + Payment (`docs/stories/README.md` §E06)
> **Sprint:** S3 (wk 5–6) · **Estimated:** ≤ 1 dev-day · **Priority:** P1
> **Sub-project:** `api/`
> **Ceremony tier:** Feature (API-only, no auth/payment sensitivity — Codex + CI, no /security-review)
> **Prerequisite:** E06-S04 merged to main (PR #38 ✅)

---

## Story

As the **solo founder-operator (Alok)** building homeservices-mvp,
I want the system to automatically generate a PDF service report when a booking reaches `COMPLETED`, email it to the customer, and store it in Firebase Storage,
so that **customers have a professional record of the service, warranty terms, and next-service guidance without any manual effort from me.**

---

## Acceptance Criteria

### AC-1 · Report generated on COMPLETED trigger
- **Given** a booking transitions to `COMPLETED`
- **Then** within the same change-feed fire, a PDF service report is generated
- **And** stored at `reports/{bookingId}/service-report.pdf` in Firebase Storage
- **And** emailed to the customer's registered email address

### AC-2 · PDF contains required content
The generated PDF must include:
- Technician name + rating (if available)
- Service name + completed date/time (IST)
- Before/after photos embedded from Firebase Storage paths stored on the booking doc
- Final price breakdown: base amount + each approved add-on (if any)
- Warranty expiry date: `completedAt + 7 days`
- Next-service recommendation (hardcoded per category)

### AC-3 · Idempotency — change-feed double-fire does not double-generate
- **Given** the change-feed fires twice for the same COMPLETED booking
- **Then** Firebase Storage is checked first; if the report already exists, generation is skipped
- **And** no duplicate email is sent

### AC-4 · Email only sent if customer has a registered email
- **Given** a customer's Firebase Auth record has no email address
- **Then** the PDF is still generated and stored; email step is silently skipped

### AC-5 · completedAt recorded on booking when transitioning to COMPLETED
- **Given** the technician calls `PATCH /v1/technicians/active-job/{bookingId}/transition` with `targetStatus: "COMPLETED"`
- **Then** the booking document has `completedAt` set to the transition timestamp
- **And** the report uses this timestamp for service date + warranty calculation

### AC-6 · Photo fetch failure is graceful
- **Given** a Firebase Storage photo download fails (e.g. file deleted)
- **Then** that photo is skipped silently; the report is still generated and delivered

---

## Tasks / Subtasks

> TDD: test file committed before implementation file per CLAUDE.md.

- [x] **T1 — Schema + env vars (no tests needed — pure type changes)**
  - [x] T1.1 Add `completedAt?: z.string()` to `BookingDocSchema` in `api/src/schemas/booking.ts`
  - [x] T1.2 Set `completedAt` in `transitionStatusHandler` (`active-job.ts`) on COMPLETED transition
  - [x] T1.3 Create `api/src/schemas/report.ts` — `ReportData` interface + `PhotoSet` interface
  - [x] T1.4 Verify `COSMOS_CONNECTION_STRING` is in `local.settings.example.json` (added by E06-S04)

- [x] **T2 — Firebase Storage helpers + technician-repository extension (no TDD — thin infra wrappers)**
  - [x] T2.1 Add `checkStorageFileExists()`, `uploadBufferToStorage()`, `downloadStorageFile()` to `api/src/firebase/admin.ts`
  - [x] T2.2 Add `getTechnicianForReport()` to `api/src/cosmos/technician-repository.ts`

- [x] **T3 — Data assembly service (TDD)**
  - [x] T3.1 (RED) Write `api/tests/unit/report-data.service.test.ts`
  - [x] T3.2 (GREEN) Implement `api/src/services/report-data.service.ts`
  - [x] T3.3 Commit

- [x] **T4 — PDF generator (TDD)**
  - [x] T4.1 Install `pdfkit` + `@types/pdfkit`
  - [x] T4.2 (RED) Write `api/tests/unit/pdf-generator.service.test.ts`
  - [x] T4.3 (GREEN) Implement `api/src/services/pdf-generator.service.ts`
  - [x] T4.4 Commit

- [x] **T5 — ACS email service + change-feed trigger (TDD)**
  - [x] T5.1 Create `api/src/services/acs-email.service.ts`
  - [x] T5.2 (RED) Write `api/tests/unit/trigger-service-report.test.ts`
  - [x] T5.3 (GREEN) Implement `api/src/functions/trigger-service-report.ts`
  - [x] T5.4 Full test suite + coverage
  - [x] T5.5 Commit

- [x] **T6 — Pre-Codex smoke gate + review**
  - [x] T6.1 `bash tools/pre-codex-smoke-api.sh` — must exit 0
  - [x] T6.2 `codex review --base main` — authoritative gate

---

## Dev Notes

### Context from previous stories
- `BookingDoc.photos` is `Record<string, string[]>` — keys are stage names (`IN_PROGRESS`, `COMPLETED`, etc.), values are Firebase Storage paths (not download URLs). Pattern: `bookings/{bookingId}/photos/{technicianUid}/{stage}/{timestamp}.jpg`.
- `BookingDoc.approvedAddOns` set by E06-S03 price-approval flow. `finalAmount` set when add-ons approved.
- E06-S04 added `trigger-booking-completed.ts` which uses the same Cosmos change-feed pattern — reuse exactly.
- `getStorageDownloadUrl(path)` already exists in `api/src/firebase/admin.ts` but returns signed URL. For PDF embedding we need to download bytes directly — add `downloadStorageFile(path)`.
- `@azure/communication-email@^1.1.0` already installed. Use `ACS_CONNECTION_STRING` + `ACS_SENDER_ADDRESS` already in `local.settings.example.json`.
- Category IDs: `'ac-repair'`, `'deep-cleaning'`, `'plumbing'`, `'electrical'`, `'pest-control'`.

### Change-feed lease container
Use `booking_report_leases` (not `booking_completed_leases` — that belongs to E06-S04's trigger). Different lease containers allow both triggers to fire independently on the same bookings container.

### PDFKit in ESM
`pdfkit` ships CommonJS. In an ESM project (`"type": "module"`), import as:
```typescript
import PDFDocument from 'pdfkit';
```
Add `"pdfkit"` to `compilerOptions.types` is not needed — `@types/pdfkit` provides types and works with `import` syntax.

---

## Definition of Done

- [x] `pnpm typecheck && pnpm lint && pnpm test:coverage` green
- [x] All AC pass (test assertions, not manual)
- [x] Pre-Codex smoke gate exits 0
- [x] `.codex-review-passed` marker present
- [x] PR opened; CI green on `main`

---

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes
_To be filled by dev agent_

### File List
_To be filled by dev agent_
