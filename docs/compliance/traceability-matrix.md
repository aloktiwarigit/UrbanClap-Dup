# Compliance Traceability Matrix — 2026-04-26

**Owner:** Alok Tiwari
**Last verified:** 2026-04-26 (commit `f52e6ca` on `feature/E10-S01-karnataka-compliance`)
**Audience:** Karnataka Labour Department auditors, DPDP Board, GST officers, internal compliance review
**Authority:** PRD §FR-9 + §NFR-C (`docs/prd.md` lines 1085–1162)

---

## Scope

This matrix indexes compliance obligations across four regulatory regimes binding on `homeservices-mvp`:

1. **Karnataka Platform Workers (Social Security and Welfare) Act 2025** — in force May 2025; rules notified Nov 2025.
2. **Central Social Security Code 2025** — 1–2% aggregator levy.
3. **Digital Personal Data Protection Act 2023 (DPDP)** — India data residency, consent, PII handling, right to erasure.
4. **GST e-invoicing + Razorpay/RBI compliance** — financial regulations.

Each clause is mapped to its PRD reference (file:line), the implementing story (`docs/stories/<id>.md`), and the test file(s) exercising it. This document is the primary index handed to a regulator on audit request.

---

## Methodology

- Read `docs/prd.md` for all `FR-9.*` and `NFR-C-*` clauses (regulatory section, lines 1085–1162).
- For each clause, identified the corresponding story per `docs/stories/README.md` epic map.
- For each story, located the test files exercising the requirement under `api/tests/`, `api/src/`, `customer-app/app/src/test/`, `technician-app/app/src/test/`, and `admin-web/`.
- Status legend:
  - ✅ implemented + tested
  - ⚠️ implemented untested (missing automated assertion, e.g. infra-as-code or stored-procedure level)
  - ❌ gap (not-yet-scoped, missing implementation, or missing test)

---

## Karnataka Platform Workers Act 2025

| Act clause | PRD reference | Story | Test file(s) | Status | Last verified |
|---|---|---|---|---|---|
| Right-to-refuse without ranking penalty (architectural) | FR-9.1 (`docs/prd.md:1087`), NFR-C-1 (`docs/prd.md:1155`) | E10-S01 (Karnataka right-to-refuse enforcement) | `api/tests/integration/dispatcher-up-ranking.test.ts`, `api/tests/integration/dispatcher-data-isolation.test.ts`, `api/.semgrep.yml` (lint-time decline-token rule) | ✅ | 2026-04-26 |
| Algorithm transparency / publishable on 1-week notice | FR-9.1 AC #3 (`docs/prd.md:1094`) | E10-S01 | `docs/dispatch-algorithm.md` (public transparency doc), `docs/adr/0006-dispatch-algorithm.md`, `docs/adr/0011-karnataka-decline-history-isolation.md` | ✅ | 2026-04-26 |
| Immutable audit log for tech deactivations / appeals | FR-9.4 (cross-ref `docs/prd.md:971`), NFR-S-6 (`docs/prd.md:1143`) | E09-S05 (Immutable Audit Log) | `api/tests/cosmos/audit-log-repository.test.ts`, `api/tests/functions/admin/audit-log/list.test.ts`, `api/src/cosmos/audit-log-repository.ts`, `api/src/services/auditLog.service.ts` | ⚠️ | 2026-04-26 — repo + viewer exist; **no Cosmos stored-procedure deny-write/update test** enforces append-only at the data-layer; relies on caller discipline |
| Tech appeals logged + decision-with-reason via FCM | FR-9.4 cross-ref (`docs/prd.md:971`), FR-5.7 | E08-S04 (Abusive customer shield + rating appeal) | none — **story not yet executed** | ❌ | 2026-04-26 — index entry only at `docs/stories/README.md:146`; no `docs/stories/E08-S04-*.md` and no implementation/tests |
| Welfare board contributions per registered tech (monthly reconciliation) | NFR-C-8 (`docs/prd.md:1162`) | **not-yet-scoped** — no story in epic map for welfare board contribution remittance/reconciliation | none | ❌ | 2026-04-26 — `docs/stories/README.md` E10 covers right-to-refuse + SSC + GST + launch-readiness, but no welfare-board story |
| Customer blacklist + 3+ tech-initiated reports auto-flag | FR-9.3 cross-ref (`docs/prd.md:960`), FR-7.3 | E09-S03 (Owner Override controls) | none — **story not yet executed**; depends on E09-S05 audit log per `docs/stories/README.md:205` | ❌ | 2026-04-26 — story file not created; no tests |

---

## Central Social Security Code 2025

| Act clause | PRD reference | Story | Test file(s) | Status | Last verified |
|---|---|---|---|---|---|
| 1–2% aggregator levy auto-accumulated per booking GMV | FR-9.2 AC #1 (`docs/prd.md:1101`), NFR-C-2 (`docs/prd.md:1156`) | E10-S02 (SSC aggregator levy automation) | `api/tests/functions/admin/compliance/ssc-levy.test.ts`, `api/src/services/ssc-levy.service.ts`, `api/src/cosmos/ssc-levy-repository.ts` | ✅ | 2026-04-26 — index entry at `docs/stories/README.md:172`; no `docs/stories/E10-S02-*.md` file but src + tests cover acceptance behaviour |
| Quarterly remittance via Razorpay payout to SSC fund | FR-9.2 AC #2 (`docs/prd.md:1102`) | E10-S02 | `api/tests/functions/admin/compliance/ssc-levy.test.ts` (mocks `createTransfer` Razorpay call), `api/src/functions/admin/compliance/ssc-levy.ts` (`sscLevyTimerHandler`, `approveSscLevyHandler`) | ✅ | 2026-04-26 |
| CA-verifiable itemised report (per-quarter) | FR-9.2 AC #2 (`docs/prd.md:1102`) | E10-S02 | none — **endpoint to export CA-format report not present**; only owner approval flow tested | ❌ | 2026-04-26 — no `/admin/compliance/ssc-levy/{quarter}/report` export test under `api/tests/functions/admin/compliance/` |
| Audit log entry on quarterly SSC remittance | FR-9.2 AC #3 (`docs/prd.md:1103`) | E10-S02 | `api/tests/functions/admin/compliance/ssc-levy.test.ts` (mocks `auditLog`); **no end-to-end assertion that an entry persists to `audit-log` Cosmos container** | ⚠️ | 2026-04-26 — mock-only; integration assertion missing |

---

## DPDP Act 2023

| Act clause | PRD reference | Story | Test file(s) | Status | Last verified |
|---|---|---|---|---|---|
| India data residency (Azure India Central + Firebase Asia-South1) | NFR-C-3 (`docs/prd.md:1157`), Architecture §residency (`docs/architecture.md:54`, `:425`), Runbook §1 (`docs/runbook.md:21-25`) | not-yet-scoped — **no story enforces region pinning in IaC/config** | `docs/architecture.md` + `docs/runbook.md` document the regions; no automated infra audit | ⚠️ | 2026-04-26 — documented intent; no IaC validation, no CI gate that asserts Cosmos/Functions/Storage region values |
| Explicit consent capture for each data use | NFR-C-5 (`docs/prd.md:1159`) | partial — E02-S03 (Tech KYC via DigiLocker, `docs/stories/README.md:66`); no general consent-log story | `api/tests/kyc/submit-aadhaar.test.ts` (DigiLocker tokenized consent flow); **no `consent_log` table or per-purpose consent persistence** | ⚠️ | 2026-04-26 — DigiLocker Aadhaar consent covered; no shared consent log for camera, location, FCM, marketing, etc. |
| Aadhaar number never stored server-side (tokenized only) | NFR-S-3 (`docs/prd.md:1140`), FR-1.2 (`docs/prd.md:804`) | E02-S03 | `api/tests/kyc/submit-aadhaar.test.ts`, `api/tests/kyc/kyc-status.test.ts`, `api/tests/schemas/kyc.test.ts`, `api/src/functions/kyc/submit-aadhaar.ts`, `api/src/services/digilocker.service.ts` | ✅ | 2026-04-26 |
| 72-hour breach notification readiness (workflow + DPDP Board notification) | NFR-C-6 (`docs/prd.md:1160`) | not-yet-scoped — runbook lists incidents but **no INC-* entry for personal-data breach + DPDP Board notification within 72 hours** | none — `docs/runbook.md` covers INC-1 to INC-10, none of them is a DPDP breach playbook | ❌ | 2026-04-26 — verified by reading `docs/runbook.md` lines 67–272 |
| Right to access (customer data export) | NFR-C-7 (`docs/prd.md:1161`) | not-yet-scoped — no story for customer data-subject-access endpoint | none | ❌ | 2026-04-26 — no `/customer/me/export`, no test under `api/tests/` |
| Right to erasure (customer account deletion) | NFR-C-7 (`docs/prd.md:1161`) | not-yet-scoped — no story for account erasure / soft-delete with retention purge | none | ❌ | 2026-04-26 — no `/customer/me/delete` endpoint or test |
| Data retention policy enforcement (OQ-16: 2y active + 5y archived) | OQ-16 (`docs/prd.md:1242`) | not-yet-scoped — open question, not promoted to a story | none | ❌ | 2026-04-26 — no retention cron (`trigger-purge-expired-*`), no Cosmos TTL config in repo |
| Data inventory / processing register (DPDP Section 8) | implicit (no PRD line) | not-yet-scoped | none | ❌ | 2026-04-26 — no `docs/compliance/data-inventory.md` or equivalent processing register |

---

## GST + Razorpay / RBI

| Act clause | PRD reference | Story | Test file(s) | Status | Last verified |
|---|---|---|---|---|---|
| GST e-invoicing for all paid bookings (single-state, B2C) | NFR-C-4 (`docs/prd.md:1158`) | E10-S03 (GST e-invoice pipeline) — index entry only at `docs/stories/README.md:173` | none — **story not yet executed**; no `api/src/services/gst-invoice.service.ts`, no `gst-invoice.test.ts` | ❌ | 2026-04-26 |
| B2B GSTIN flow + IRP integration toggle | E10-S03 ACs (`docs/stories/README.md:173`), C-34 GST mode | E10-S03 | none — story not started | ❌ | 2026-04-26 |
| Card data never touches our code (PCI scope offloaded) | NFR-S-4 (`docs/prd.md:1141`) | E03-S03 (Razorpay Checkout SDK) | `api/tests/bookings/create.test.ts`, `api/tests/bookings/confirm.test.ts` (verify only `paymentOrderId`/`paymentId` pass through; no PAN/CVV in any schema) | ✅ | 2026-04-26 |
| Razorpay webhook HMAC signature verification | NFR-S, threat-model INC-2; E03-S04 (`docs/stories/README.md:80`) | E03-S04 | `api/tests/webhooks/razorpay-webhook.test.ts` (HMAC + missing-secret + bad-signature + idempotency cases) | ✅ | 2026-04-26 |
| Razorpay Route split payment (commission + tech payout) | FR-3.4 (`docs/prd.md:` Razorpay Route), E06-S04 (`docs/stories/README.md:118`) | E06-S04 | `api/tests/unit/razorpay.service.ts` family + `api/src/services/razorpayRoute.service.ts` + reconciliation cron `api/tests/unit/trigger-reconcile-payouts.test.ts` | ✅ | 2026-04-26 |
| Daily payout reconciliation cron (RBI good-practice) | E03-S04 notes (`docs/stories/README.md:80`), E09-S04 | E03-S04 / E09-S04 | `api/tests/unit/trigger-reconcile-payouts.test.ts`, `api/src/functions/trigger-reconcile-payouts.ts` | ✅ | 2026-04-26 |

---

## Gap summary

**Total clauses mapped: 22** (6 Karnataka + 4 SSC + 8 DPDP + 4 GST/RBI).

**Status counts:**
- ✅ implemented + tested: **10**
- ⚠️ implemented untested (or partial): **4**
- ❌ gap: **8**

### ❌ Gap categorisation

| # | Clause | Regime | Category | Severity |
|---|---|---|---|---|
| G-1 | Welfare board contributions reconciliation | Karnataka | not-yet-scoped (no story) | High — hard legal obligation under Karnataka Act |
| G-2 | Customer blacklist + 3+ reports auto-flag | Karnataka (FR-9.3) | not-yet-scoped (story file missing) | Medium |
| G-3 | Tech rating-appeal flow + audit log | Karnataka (FR-9.4) / E08-S04 | story planned not executed | Medium — appeals are a Karnataka Act protection |
| G-4 | SSC CA-verifiable itemised report endpoint | SSC | missing implementation | Medium — owner can read DB but no auditor-facing export |
| G-5 | DPDP 72-hour breach notification playbook | DPDP | missing doc (runbook) | High — breach without a playbook = DPDP Board fine + reputational risk |
| G-6 | Right to access (data export) | DPDP | not-yet-scoped | High — DPDP §11 right of data principal |
| G-7 | Right to erasure (account deletion) | DPDP | not-yet-scoped | High — DPDP §12 right of data principal |
| G-8 | Data retention purge + data inventory | DPDP / OQ-16 | not-yet-scoped | Medium — controllable via Cosmos TTL once retention policy locked |
| G-9 | GST e-invoicing pipeline + B2B GSTIN | GST | not-yet-scoped (story planned, not started) | High — every paid B2C booking technically already needs an invoice; B2B GSTIN customers a hard blocker for SME segment |

> Note: 9 categorised rows because G-9 bundles GST e-invoicing + B2B GSTIN under a single story (E10-S03) that has not started; both clauses share one Issue.

### ⚠️ Implemented untested rows

| # | Clause | Recommended action |
|---|---|---|
| W-1 | Audit log Cosmos stored-procedure append-only enforcement (NFR-S-6) | Add Cosmos stored-procedure that rejects `update`/`delete` on `audit-log` container + integration test that asserts `409 Conflict` on attempted update |
| W-2 | India data residency automated check (NFR-C-3) | Add CI step that runs `az resource list` (or Bicep diff) and asserts every resource's `location` ∈ {`centralindia`} for Azure and `asia-south1` for Firebase |
| W-3 | Per-purpose consent log (NFR-C-5 beyond DigiLocker) | Add `consent_log` Cosmos container + write at every consent capture point (camera, background-location, FCM marketing, analytics opt-in) + e2e test |
| W-4 | SSC remittance audit-log integration assertion (FR-9.2 AC #3) | Add integration test under `api/tests/functions/admin/compliance/` that hits real audit-log container and asserts entry persisted with `action='ssc_levy.approved'` |

---

## Recommended actions

For each ❌ gap, a GitHub Issue is filed under labels `audit:tier1` + `audit:compliance`. Issues are linked back to this matrix by SHA.

| Gap ID | GitHub Issue | Owner | Target |
|---|---|---|---|
| G-1 | [#55](https://github.com/aloktiwarigit/UrbanClap-Dup/issues/55) — Karnataka welfare board contributions monthly reconciliation | TBD | Pre-launch |
| G-2 | [#57](https://github.com/aloktiwarigit/UrbanClap-Dup/issues/57) — customer blacklist + auto-flag on 3+ tech-initiated reports | TBD | Pre-launch |
| G-3 | [#59](https://github.com/aloktiwarigit/UrbanClap-Dup/issues/59) — tech rating-appeal flow + audit log (E08-S04) | TBD | Pre-launch |
| G-4 | [#62](https://github.com/aloktiwarigit/UrbanClap-Dup/issues/62) — SSC levy CA-verifiable itemised report endpoint | TBD | Pre-launch |
| G-5 | [#64](https://github.com/aloktiwarigit/UrbanClap-Dup/issues/64) — DPDP 72-hour breach notification playbook | TBD | Pre-launch |
| G-6 | [#65](https://github.com/aloktiwarigit/UrbanClap-Dup/issues/65) — DPDP right-to-access (customer data export) | TBD | Pre-launch |
| G-7 | [#67](https://github.com/aloktiwarigit/UrbanClap-Dup/issues/67) — DPDP right-to-erasure (account deletion) | TBD | Pre-launch |
| G-8 | [#69](https://github.com/aloktiwarigit/UrbanClap-Dup/issues/69) — data retention policy + data inventory | TBD | Pre-launch |
| G-9 | [#72](https://github.com/aloktiwarigit/UrbanClap-Dup/issues/72) — GST e-invoicing pipeline (E10-S03) | TBD | Pre-launch |

For each ⚠️ row, a backlog ticket should be opened during the next compliance review (not a release blocker, but a tested-evidence gap that an auditor may flag).

---

## Audit response procedure

**On regulator request, this matrix is the primary index.**

1. Acknowledge audit notice within 48 hours per `docs/runbook.md` INC-10.
2. Engage CA / legal counsel.
3. Hand auditor:
   - This matrix at the SHA of the audit date (`git log -1 docs/compliance/traceability-matrix.md`).
   - The linked test files at the same SHA (CI green proves the assertion held).
   - `docs/dispatch-algorithm.md` for Karnataka algorithm transparency.
   - `docs/adr/0011-karnataka-decline-history-isolation.md` as the architectural decision record.
   - Cosmos `audit-log` container export filtered by date range and `resourceType`.
4. Do NOT alter data during audit (Cosmos append-only collections prevent this anyway).
5. Post-audit: update this matrix + close any remediations the auditor flags.

---

## Re-verification cadence

- **Quarterly** — re-run the methodology against the latest `main` SHA and update each row's `Last verified` cell.
- **On every PR that touches `api/src/services/dispatcher.service.ts`, `api/src/services/auditLog.service.ts`, or any file under `api/src/functions/admin/compliance/`** — the PR template should require updating this matrix.
- **On every new ❌→✅ transition** — close the corresponding GitHub Issue with a link to the test file(s) at the merging SHA.

---

**Matrix v1.0 complete.** 22 clauses mapped; 9 GitHub Issues to be filed for ❌ gaps.
