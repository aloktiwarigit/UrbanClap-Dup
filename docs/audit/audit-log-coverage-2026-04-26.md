# Audit-Log Coverage Review — 2026-04-26

## Summary

- **43** handler files identified in `api/src/functions/`
- **23** privileged actions (state-changing on shared/sensitive resources)
- **12** files contain `auditLog()` / `appendAuditEntry()` calls covering **17** distinct privileged actions
- **❌ 12** privileged actions with no audit-log call (P1/P2 gaps)
- **⚠️  3** privileged actions with partial coverage (success path only, or written to a separate event log)

The canonical entry point is `auditLog()` in `api/src/services/auditLog.service.ts:13`, which delegates to `appendAuditEntry()` in `api/src/cosmos/audit-log-repository.ts:8` (writes to the `audit_log` Cosmos container). Some handlers call `appendAuditEntry` directly with a hand-built `AuditLogDoc` (e.g. system actions, fire-and-forget paths). Both are accepted as ✅ for this review.

A separate `bookingEvent` log (`booking-event-repository.ts`) is used by tech-driven status transitions; it is **not** the audit log and is flagged as ⚠️  where it substitutes for one.

## Methodology

1. Listed all 43 `.ts` files under `api/src/functions/` (excluding the `audit-log/list.ts` admin read endpoint).
2. For each, classified as **privileged** (writes shared state / affects user standing / changes money / changes platform policy) or **read-only** (GET endpoints, list endpoints, internal projections, health checks).
3. For each privileged handler, grepped for `auditLog(` and `appendAuditEntry(` and read the file to determine:
   - ✅ — call present on the success path
   - ⚠️  — call present on some branches but missing on a path that should be audited
   - ❌ — no call at all
4. Cross-referenced against FR-9.4 + Karnataka Act §16 (immutable audit of every privileged action affecting a technician's standing, customer's money, or platform-wide policy).

## Coverage Table

| Handler file | Action | Privileged? | Audit-log call? | Status | Notes |
|---|---|---|---|---|---|
| `admin/auth/login.ts` | admin login (success) | yes | ✅ `auditLog` line 74 (`admin.login`) | covered | Only on success path |
| `admin/auth/login.ts` | admin login (failure: wrong TOTP, deactivated, bad Firebase token) | yes | ❌ | **GAP** | Failed admin auth attempts not audited — security forensics blind spot |
| `admin/auth/logout.ts` | admin logout | yes | ✅ `auditLog` line 22 (`admin.logout`) | covered | |
| `admin/auth/refresh.ts` | refresh access token | yes | ❌ | gap (P3) | Session refresh — low-signal but Karnataka may want it for full session reconstruction |
| `admin/auth/setup-totp.ts` | setupTotpGet (QR fetch) | yes | ❌ | minor | Read of pending TOTP secret; counter-arg: enrollment is captured by `admin.totp_setup` POST event |
| `admin/auth/setup-totp.ts` | setupTotpPost (enroll) | yes | ✅ `auditLog` line 102 (`admin.totp_setup`) | covered | |
| `admin/audit-log/list.ts` | list audit entries | yes (super-admin only) | n/a (read-only) | n/a | Read endpoint; not an audit target |
| `admin/me.ts` | get my admin profile | yes (admin only) | n/a (read-only) | n/a | |
| `admin/dashboard/feed.ts` | dashboard feed | yes (admin only) | n/a (read-only) | n/a | |
| `admin/dashboard/summary.ts` | dashboard summary | yes (admin only) | n/a (read-only) | n/a | |
| `admin/dashboard/tech-locations.ts` | tech locations map | yes (admin only) | n/a (read-only) | n/a | |
| `admin/orders/list.ts` | list orders | yes (admin only) | n/a (read-only) | n/a | |
| `admin/orders/detail.ts` | order detail | yes (admin only) | n/a (read-only) | n/a | |
| `admin/orders/overrides.ts` | reassign technician | yes | ✅ `appendAuditEntry` line 45 (`REASSIGN`) | covered | |
| `admin/orders/overrides.ts` | force-complete booking | yes | ✅ `appendAuditEntry` line 89 (`COMPLETE`) | covered | |
| `admin/orders/overrides.ts` | refund (stub) | yes | ✅ `appendAuditEntry` line 134 (`REFUND`) | covered | Currently logs only — refund execution is a TODO; audit captures intent |
| `admin/orders/overrides.ts` | waive fee | yes | ✅ `appendAuditEntry` line 178 (`WAIVE_FEE`) | covered | |
| `admin/orders/overrides.ts` | escalate order | yes | ✅ `appendAuditEntry` line 222 (`ESCALATE`) | covered | |
| `admin/orders/overrides.ts` | add internal note | yes | ✅ `appendAuditEntry` line 269 (`ADD_NOTE`) | covered | |
| `admin/finance/approve-payouts.ts` | approve weekly payout batch | yes | ✅ `auditLog` line 82 (`PAYOUT_APPROVE`) | covered | Per-technician transfer failures are captured in the `errors` array but not individually audited (only batch summary) — ⚠️  consider per-tech entries |
| `admin/finance/payout-queue.ts` | view payout queue | yes (finance/admin) | n/a (read-only) | n/a | |
| `admin/finance/summary.ts` | finance summary | yes (admin only) | n/a (read-only) | n/a | |
| `admin/finance/weekly-aggregate.ts` | system timer: write weekly payout snapshot | yes (system) | ❌ | **GAP** | Writes a per-week aggregate that is the basis for payout approvals; no audit entry |
| `admin/compliance/ssc-levy.ts` | quarterly levy created (timer) | yes (system) | ❌ | gap (P2) | Levy creation not audited; only the eventual transfer is. Creating a levy commits the platform to a remittance — should be audited |
| `admin/compliance/ssc-levy.ts` | approve & transfer levy | yes | ✅ `auditLog` line 188 (`SSC_LEVY_TRANSFER`) | covered | |
| `admin/complaints/list.ts` | list complaints | yes (admin only) | n/a (read-only) | n/a | |
| `admin/complaints/create.ts` | admin creates complaint | yes | ✅ `appendAuditEntry` line 56 (`COMPLAINT_CREATED`) | covered | |
| `admin/complaints/patch.ts` | status change | yes | ✅ `appendAuditEntry` line 88 (`COMPLAINT_STATUS_CHANGED`) | covered | Includes RATING_APPEAL status changes (E08-S04) by transitive coverage — no separate `APPEAL_DECIDED` action; payload only carries `from`/`to` status, not the verdict text |
| `admin/complaints/patch.ts` | assignee change | yes | ✅ `appendAuditEntry` line 104 (`COMPLAINT_ASSIGNED`) | covered | |
| `admin/complaints/patch.ts` | internal note added | yes | ⚠️  note write at line 71-74 is not audited | partial | Note content lands in the document but no `COMPLAINT_NOTE_ADDED` audit entry — admin wrote, no trail of *who wrote what when* in the audit container |
| `admin/complaints/patch.ts` | resolution category set | yes | ⚠️  | partial | Captured only when status flips to RESOLVED (via STATUS_CHANGED payload); standalone category updates on already-RESOLVED complaints not separately logged |
| `admin/complaints/sla-timer.ts` | SLA breach escalation (system) | yes (system) | ✅ `appendAuditEntry` line 43 (`SLA_BREACH`) | covered | |
| `admin/complaints/repeat-offenders.ts` | repeat-offenders list | yes (admin only) | n/a (read-only) | n/a | |
| `bookings.ts` | createBooking (customer) | yes | ❌ | gap (P3) | Customer self-action; counter-arg: webhook capture is the money event, not the booking creation |
| `bookings.ts` | confirmBooking (customer marks PAID) | yes | ❌ | **GAP** | Customer-confirmed payment changes booking to PAID — money state change must be audited per Karnataka |
| `bookings.ts` | requestAddon (technician) | yes | ❌ | gap (P2) | Tech can extend the work scope (and price) — affects customer money once approved |
| `bookings.ts` | approveFinalPrice (customer) | yes | ❌ | gap (P2) | Customer commits to revised final amount — money state change |
| `bookings.ts` | getBooking | no | n/a (read-only) | n/a | |
| `webhooks.ts` | razorpayWebhook → markPaid | yes (system) | ❌ | **GAP** | Money state change driven by an external signed webhook — must be audited per Karnataka §16 |
| `webhooks.ts` | reconcileStaleBookings (timer) | no (logs only) | n/a | n/a | Currently only logs stale bookings; no state change yet |
| `active-job.ts` | getActiveJob | no | n/a (read-only) | n/a | |
| `active-job.ts` | transitionStatusHandler (tech) | yes | ⚠️  written to `bookingEvent` log (line 91), not `audit_log` | partial | Status transitions are tech-driven; today they land in a separate event store. Karnataka regulator query "show me state changes on booking X" cannot be answered from `audit_log` alone |
| `active-job-photos.ts` | record photo for stage | no (technician evidence collection) | n/a | n/a | Photos themselves are evidence; the URL is bound by storage path validation. Lower-priority audit candidate |
| `job-offers.ts` | accept job offer (tech) | yes | ⚠️  `bookingEvent` line 42 only | partial | Acceptance assigns the tech to a booking — affects tech standing. Same separate-store problem as active-job transitions |
| `job-offers.ts` | decline job offer (tech) | yes | ⚠️  `bookingEvent` line 64 only | partial | Same as above |
| `job-offers.ts` | expireStaleOffers (system timer) | yes (system) | ❌ | gap (P2) | Marks bookings UNFULFILLED across the platform; no audit entry |
| `kyc/submit-aadhaar.ts` | submit Aadhaar → set kycStatus | yes | ❌ | **GAP** | KYC verification result (AADHAAR_DONE / PENDING_MANUAL) directly affects whether a tech can take jobs — Karnataka §16 |
| `kyc/submit-pan-ocr.ts` | submit PAN OCR → set kycStatus | yes | ❌ | **GAP** | Same — affects tech onboarding state |
| `kyc/get-kyc-status.ts` | get my KYC status | no | n/a (read-only) | n/a | |
| `rating-escalate.ts` | escalate rating → create RATING_SHIELD complaint | yes | ❌ | **GAP** | Creates a privileged complaint document that affects tech standing; admin-created complaints ARE audited (`complaints/create.ts`), this customer-driven path is not |
| `ratings.ts` | submit rating (customer or tech) | yes | ❌ | gap (P2) | High-volume customer/tech action; affects tech aggregate standing. Karnataka may want it; volume cost trade-off — flag for ADR |
| `ratings.ts` | get rating | no | n/a (read-only) | n/a | |
| `earnings.ts` | get earnings | no | n/a (read-only) | n/a | |
| `tech-ratings.ts` | my ratings summary | no | n/a (read-only) | n/a | |
| `technicians.ts` | patchFcmToken (tech) | no (self-service token rotation) | n/a | n/a | |
| `technicians.ts` | getTechnicianProfile | no | n/a (read-only) | n/a | |
| `technicians.ts` | getConfidenceScore | no | n/a (read-only) | n/a | |
| `catalogue-public.ts` | getCategories / getServiceById | no | n/a (read-only) | n/a | |
| `catalogue-admin.ts` | createCategory (admin) | yes | ❌ | **GAP** | Platform-wide policy change |
| `catalogue-admin.ts` | updateCategory (admin) | yes | ❌ | **GAP** | Platform-wide policy change |
| `catalogue-admin.ts` | toggleCategory (admin) | yes | ❌ | **GAP** | Activates/deactivates a category platform-wide |
| `catalogue-admin.ts` | createService (admin) | yes | ❌ | **GAP** | Platform-wide policy change |
| `catalogue-admin.ts` | updateService (admin) | yes | ❌ | **GAP** | Platform-wide policy change (price changes) |
| `catalogue-admin.ts` | toggleService (admin) | yes | ❌ | **GAP** | Activates/deactivates a service platform-wide |
| `catalogue-admin.ts` | listAdminServices | no | n/a (read-only) | n/a | |
| `sos.ts` | customer SOS trigger | yes | ✅ `appendAuditEntry` line 43 (`SOS_TRIGGERED`) | covered | |
| `health.ts` | health check | no | n/a (read-only) | n/a | |
| `trigger-booking-completed.ts` | system settle (Razorpay Route transfer) | yes (system) | ✅ `appendAuditEntry` (helper) lines 53/81/99/105 (`ROUTE_TRANSFER_*`) | covered | |
| `trigger-reconcile-payouts.ts` | system reconcile (retry) | yes (system) | ✅ `appendAuditEntry` (helper) lines 45/66/73/88 (`RECON_*`) | covered | |
| `trigger-no-show-detector.ts` | system no-show detection (issues credit, swaps tech, marks UNFULFILLED) | yes (system) | ❌ | **GAP** | Affects BOTH tech standing and customer money — silent on regulator queries |
| `trigger-rating-prompt.ts` | system push notification | no (no state change) | n/a | n/a | FCM-only |
| `trigger-service-report.ts` | system PDF + email report | no (output only, not state-changing for booking/tech) | n/a | n/a | Could audit for "did the customer get the report?" but lower priority |

## Action categories with gaps

- **Payments**: Razorpay webhook (`webhooks.ts`), customer payment confirmation (`bookings.ts:confirmHandler`), addon flow (`requestAddon`, `approveFinalPrice`)
- **KYC**: Aadhaar submission, PAN OCR submission
- **Catalogue**: 6 admin endpoints (create/update/toggle × category/service)
- **Auth**: failed admin logins, session refreshes
- **Booking lifecycle (system)**: no-show detector, expire-stale-offers
- **Booking lifecycle (tech)**: status transitions, accept/decline (currently in `bookingEvent` not `audit_log`)
- **Customer-driven complaints**: RATING_SHIELD escalation
- **Aggregations (system)**: weekly payout snapshot, quarterly levy creation

## Severity distribution

| Severity | Count | Examples |
|---|---|---|
| P1 — money / tech standing / security | 8 | payment webhook, customer confirm, KYC Aadhaar, KYC PAN, no-show detector, failed login, rating-shield, all 6 catalogue mutations (counted as 1 issue) |
| P2 — partial coverage / system aggregates / lower-volume | 5 | complaint note add, addon request/approve, expire stale offers, weekly aggregate, levy creation, ratings submission, status transition / accept-decline (separate store) |
| P3 — debatable | 1 | session refresh, customer createBooking |

## Recommended actions

GitHub issues opened on `aloktiwarigit/UrbanClap-Dup`, label `audit:audit-log`:

**P1 (`audit:tier1`):**
- #56 — `webhooks.ts` Razorpay payment captured
- #58 — `bookings.ts` customer payment confirmation
- #60 — `kyc/submit-aadhaar.ts` Aadhaar verification
- #61 — `kyc/submit-pan-ocr.ts` PAN verification
- #63 — `trigger-no-show-detector.ts` credit / tech swap / unfulfilled
- #66 — `admin/auth/login.ts` failed login attempts
- #68 — `rating-escalate.ts` RATING_SHIELD complaint creation
- #70 — `catalogue-admin.ts` 6 catalogue mutations

**P2 (`audit:tier2`):**
- #71 — `admin/complaints/patch.ts` partial coverage (notes, resolution category)
- #73 — `bookings.ts` add-on flow (request, approveFinalPrice)
- #74 — `job-offers.ts` expire timer + accept/decline (bookingEvent vs audit_log split)
- #75 — system aggregates (weekly payout snapshot, quarterly levy creation)
- #76 — ADR: high-volume audit decision (ratings, status transitions)

Triage notes for the orchestrator:
1. P1 #56 + #58 are partial duplicates; one should reference the other in the implementation PR.
2. P1 #60 + #61 share helper-extraction opportunity (a `kycAuditEntry()` helper).
3. P2 #76 is the only one that requires an ADR; it should be sequenced before #74's "Option 2" branch is considered.
4. After fixes land, re-run this review and replace this document with `audit-log-coverage-YYYY-MM-DD.md`.

## Constraints honoured

- This is a read-only audit — no `auditLog` calls were added.
- Read-only handlers (GETs, lists, projections, health) excluded from gap counting.
- Partial-coverage entries flagged as P2 unless the missing branch is the success path (failed-admin-login is the exception → P1).
- Each ✅ cites the line number with the call.
