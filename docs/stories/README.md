# Epics & Stories — homeservices-mvp

**BMAD Phase 5** · v1.0 · 2026-04-17
**Inputs:** `docs/prd.md`, `docs/architecture.md`, `docs/ux-design.md`, 7 ADRs, threat model, runbook.
**Purpose:** Organise the 25 MVP FRs from the PRD into 10 epics, each broken into stories sized for single-session execution per CLAUDE.md's per-story protocol (fresh session → brainstorm → plan → fresh session → execute → TDD → verify → 5-layer review including Codex authoritative → CI).

---

## Story File Convention

- Each story has a unique ID `E##-S##` (epic number + story number within epic).
- When a story is picked up for execution, create `docs/stories/E##-S##-<kebab-slug>.md` from the story-template at `C:/Alok/Business Projects/agency-templates/` or a fresh BMAD `bmad-create-story` invocation.
- Until then, this index is the spec — enough detail to choose what to pick up next.

## Story Sizing Rule

**One story = one fresh session can complete + review + merge.** If a story takes > 2 dev-days, split it. Target: most stories ≤ 1 dev-day (i.e., 4-6 hrs of focused AI-paired execution per CLAUDE.md cadence).

---

## Epic Roadmap & Sprint Allocation

| Epic | Title | Stories | Dev-days est. | Sprint |
|---|---|---:|---:|---|
| E01 | Foundations, CI & Design System | 5 | 4 | S1 (wk 1–2) |
| E02 | Authentication & Onboarding | 4 | 3 | S1 (wk 1–2) |
| E03 | Service Discovery + Booking Flow | 4 | 4 | S2 (wk 3–4) |
| E04 | Trust Layer (Customer) | 3 | 3 | S2 (wk 3–4) |
| E05 | Dispatch Engine + Job Offers | 4 | 4 | S3 (wk 5–6) |
| E06 | Service Execution + Payment | 5 | 5 | S3 (wk 5–6) |
| E07 | Ratings, Complaints & Safety | 5 | 4 | S4 (wk 7–8) |
| E08 | Technician Experience (Earnings, Appeals) | 4 | 3 | S4 (wk 7–8) |
| E09 | Owner Operations + Finance | 6 | 5 | S5 (wk 9–10) |
| E10 | Compliance, Audit & Launch Readiness | 4 | 3 | S5 (wk 9–10) |
| **Total** | | **44** | **~38 dev-days** | **10 weeks** |

**Buffer:** ~2 weeks for soft launch iteration, bug polish, and Play Store submission = **~12 weeks end-to-end**. Matches PRD §14.1 MVP phase (Months 1–3).

---

## E01 — Foundations, CI & Design System

**Epic goal:** Turn the scaffolded monorepo into a live development environment with all three sub-projects building, CI green on `main`, and the shared Figma design system published.

**Prerequisite:** Phase 0 scaffold + `.bmad-readiness-passed` marker.

| ID | Story | FR / NFR | Notes |
|---|---|---|---|
| **E01-S01** | Wire up `api/` skeleton with Fastify + Zod + Azure Functions local dev runtime + `/health` endpoint + CI green | NFR-P-1, NFR-R-1 | Setup: `func start` works; `GET /v1/health` returns 200; CI ship.yml passes with lint + test + Semgrep |
| **E01-S02** | Wire up `admin-web/` Next.js + Tailwind + Storybook + landing page + CI green | NFR-A-1, NFR-M-5 | `pnpm dev` loads landing; Storybook loads; axe-core + Lighthouse CI pass |
| **E01-S03** | Wire up `customer-app/` + `technician-app/` Kotlin projects with Compose + Paparazzi + Hilt + Sentry SDK + `./gradlew build` green | NFR-M-5, NFR-O-2 | Two APKs build; Paparazzi screenshot smoke test passes; CI ship.yml green |
| **E01-S04** | Create shared design-system Gradle module with tokens from UX §5 (color, type, space, motion, elevation, radii) + Compose theme; publish | UX §5, NFR-A-5 | Import in both Android apps; dark mode toggles correctly |
| **E01-S05** | Create Figma library (via `figma:figma-generate-library` skill) matching design-system tokens + publish to org; wire `figma:figma-code-connect` | UX §5, §12 | Figma library reachable; token changes sync; component naming convention codified via `figma:figma-create-design-system-rules` |

---

## E02 — Authentication & Onboarding

**Epic goal:** Customer, tech, and admin users authenticate and begin their journeys. Truecaller-first, Firebase fallback, DigiLocker for tech KYC, 2FA for admin.

| ID | Story | FR | Notes |
|---|---|---|---|
| **E02-S01** | Customer app OTP login via Truecaller SDK primary + Firebase Phone Auth fallback + persistent session | FR-1.1 | Biometric re-auth prompt on sensitive actions; 180-day refresh token; all 4 AC in PRD pass |
| **E02-S02** | Technician app same auth flow as customer | FR-1.1 | Reused code from E02-S01; tech-specific onboarding next-step routing |
| **E02-S03** | Technician KYC via DigiLocker (Aadhaar consent) + PAN OCR via Azure Form Recognizer | FR-1.2 | 3 AC from PRD; manual fallback flagged for owner review; Aadhaar never stored |
| **E02-S04** | Admin web login — email + password + TOTP 2FA + RBAC role claim middleware on all admin endpoints | FR-1.3 | 30-min session timeout; audit log entry on every admin action; 403 tests for non-super-admin |

---

## E03 — Service Discovery + Booking Flow

**Epic goal:** Customer can browse catalogue and complete a booking in 3 taps with transparent pricing.

| ID | Story | FR | Notes |
|---|---|---|---|
| **E03-S01** | Service catalogue data model + `/v1/services` + `/v1/services/{id}` + CRUD in admin (catalogue module) seed | FR-2.1 | 5 categories × 3–5 services seeded: AC Repair, Deep Cleaning, Plumbing, Electrical, Pest Control per OQ-3 |
| **E03-S02** | Customer app photo-first catalogue home + service detail with Trust Dossier preview + fixed price + "Includes / Add-ons" UI per UX §7.1 | FR-2.1, FR-2.2 | Images from Firebase Storage CDN; lazy-loaded; a11y AA; Hindi/English string resources |
| **E03-S03** | Booking creation flow: slot picker → address (Google Maps Places + pin) → confirm & pay via Razorpay Checkout SDK → booking enters `SEARCHING` | FR-3.3 | 3-tap target (NFR-U-3); booking state machine from architecture §5.2; payment intent created, not charged until captured |
| **E03-S04** | Razorpay webhook handler for payment captured → booking → `PAID` → dispatcher triggered | FR-3.3, FR-3.4 | HMAC signature verification (NFR-C, threat-model INC-2); idempotency key; reconciliation cron (daily) |

---

## E04 — Trust Layer (Customer)

**Epic goal:** Customer sees a real human tech with verified credentials and live progress. Trust is the wedge.

| ID | Story | FR | Notes |
|---|---|---|---|
| **E04-S01** | Trust Dossier component (C-1) — shared across customer app and admin (view-only in admin) | FR-3.1 | Photo + verified badges + certs + languages + years + jobs + last 3 reviews; `figma:figma-implement-design` translation |
| **E04-S02** | Pre-booking Confidence Score (C-8) — on-time %, area rating, nearest ETA | FR-3.2 | Data from 30-day sliding window; limited-data state at < 20 bookings; tap-for-methodology tooltip |
| **E04-S03** | Live service tracking screen + FCM status updates (C-5) — granular stages (Searching / Assigned / En-route / Reached / InProgress / Complete) | FR-3.5 | Live map with tech pin (reused from tech location stream) + ETA pill + timeline; never > 5-min silent window; FR-3.5 ACs |

---

## E05 — Dispatch Engine + Job Offers

**Epic goal:** The booking-paid → tech-accepted loop works in p95 < 2 seconds, architecturally Karnataka-compliant.

| ID | Story | FR | Notes |
|---|---|---|---|
| **E05-S01** | Cosmos technicians collection + geospatial index + skills/availability data model | ADR-0003, ADR-0006 | Seed test data; ST_WITHIN query correctness tests |
| **E05-S02** | Dispatcher Azure Function (change-feed triggered) — nearest-N query + composite ranking (no decline features) + FCM data message to top 3 | FR-4.1, FR-9.1 | Karnataka compliance integration test (ranking invariance under varying decline histories) — CI gate |
| **E05-S03** | Technician app Job Offer full-screen card — rich context (FR-5.1) + 30-sec accept/decline | FR-5.1, FR-4.1 | Earnings preview, "why you got this", large Accept/Decline, haptic on countdown last 5s |
| **E05-S04** | Accept/decline API + Cosmos optimistic-concurrency (`_etag`) for first-to-accept lock + "no longer available" FCM to others | FR-4.1, FR-5.1 | Accept race tests (3 techs accept simultaneously → only one wins); decline logs to `booking_events` but NOT fed to dispatcher |

---

## E06 — Service Execution + Payment

**Epic goal:** Tech arrives, performs service with guided photos, customer approves final price, payment settles to both sides.

| ID | Story | FR | Notes |
|---|---|---|---|
| **E06-S01** | Technician app active-job workflow — state machine (Started Trip → Reached → Start Work → Complete) + Google Maps nav handoff | FR-5.4, Architecture §5.2 | All state transitions call API; offline-capable with Room DB queue |
| **E06-S02** | Guided photo capture at each stage (T-7 / FR-5.4) — camera auto-opens with AR prompt; upload to Firebase Storage | FR-5.4, NFR-S-3 | 100% photo compliance; compression on-device; storage rules scoped to booking |
| **E06-S03** | Final price approval flow — if add-ons, customer approves each line item before charge; price-lock enforcement server-side | FR-2.2, FR-3.3 | Customer sees Approve/Decline per add-on in-app; FCM push on approval request |
| **E06-S04** | Razorpay Route split-payment on completion — commission to owner, balance to tech linked bank | FR-3.4 | Route transfers configured; wallet_ledger entry per tech; daily reconciliation |
| **E06-S05** | Customer-facing auto-generated PDF service report (C-17) — emailed + stored for history | FR-3.5 (extended) | Generated via Azure Function; includes photos, parts, warranty, next-service |

---

## E07 — Ratings, Complaints & Safety

**Epic goal:** Mutual respect + dispute resolution + safety infrastructure baked in from day 1.

| ID | Story | FR | Notes |
|---|---|---|---|
| **E07-S01** | Mutual rating flow (customer → tech + tech → customer) + sub-scores; post-`CLOSED` prompt | FR-6.1 | Both sides rate; visible to other party after both submit; no tit-for-tat; contextual tip chips (C-19) if 4★+ |
| **E07-S02** | Rating Shield pre-review escalation (C-36) — if customer submits <3★, option to escalate to owner first | FR-6.2 | 2-hour SLA; auto-creates complaint; customer can still post after |
| **E07-S03** | Complaint module — create, track, SLA timer (Acknowledge 2h, Resolve 24h), auto-escalate on breach | FR-6.3 | Reason categorisation; photos; internal notes; links to booking |
| **E07-S04** | Tech no-show detection + auto-credit (C-11) + re-dispatch | FR-6.4 | 30-min timeout from slot-start; ₹500 credit to customer wallet; re-dispatch with expanded radius |
| **E07-S05** | Discreet Safety SOS (C-35) — customer-side silent alert → owner FCM + optional audio recording + nearest-police info | FR-6.5 | Audio recording encrypted on device; privacy-consent flow; accidental-trigger 30-sec cancel window |

---

## E08 — Technician Experience (Earnings, Appeals)

**Epic goal:** Techs feel respected, informed, protected, and able to grow.

| ID | Story | FR | Notes |
|---|---|---|---|
| **E08-S01** | Tech app earnings dashboard (T-2) — today / week / month / lifetime + goal progress + sparkline | FR-5.2 | Data from wallet_ledger partitioned by technicianId; real-time update via FCM after booking completion |
| **E08-S02** | Flexible payout cadence — weekly (free), next-day (₹15), instant post-job (₹25) | FR-5.3 | Razorpay Route cadence config; each cadence option visible with fee; default weekly |
| **E08-S03** | Rating transparency + written feedback visible to tech (T-10) | FR-5.5 | FCM push on <5★ with written feedback; aggregate trend chart; sub-scores |
| **E08-S04** | Abusive customer shield (T-11) + rating appeal (T-23) | FR-5.6, FR-5.7 | 1-tap customer block; owner 48h appeal review; evidence upload; 1-appeal-per-month quota |

---

## E09 — Owner Operations + Finance

**Epic goal:** Solo owner runs the business in 22 minutes a day, full visibility, fast overrides, audit trail.

| ID | Story | FR | Notes |
|---|---|---|---|
| **E09-S01** | Owner Live Ops Dashboard — map, real-time order feed, today's counters (matches demo at `docs/ux-demos/owner-live-ops-dashboard.html`) | FR-7.1 | `frontend-design` skill; Cosmos change-feed → FCM topic → admin web WebSocket-free real-time |
| **E09-S02** | Owner Orders module — master table + filters + drill-down detail (slide-over per UX §7.3) | FR-7.2 | Filters: status, city, category, tech, date, amount, phone; CSV export |
| **E09-S03** | Owner Override controls (re-assign, manual-complete, refund, waive-fee, escalate, internal note) on order detail | FR-7.3 | Reason-code mandatory; audit log entry; customer + tech FCM on change |
| **E09-S04** | Owner Finance module — daily P&L, weekly Payout Queue with Razorpay Route approve-all | FR-8.1, FR-8.2 | Chart, per-tech queue, Monday-morning cron aggregate |
| **E09-S05** | Immutable Audit Log — append-only Cosmos collection + Cosmos stored-procedure deny-write/update + viewer UI | FR-7.4, NFR-S-6 | Searchable + filterable; every admin action logged; no edit/delete possible |
| **E09-S06** | Owner Complaints Inbox — kanban per status with SLA timer + assignment + resolution-categorisation | FR-6.3 (owner side) | SLA breach auto-escalation; repeat-offender detection helper |

---

## E10 — Compliance, Audit & Launch Readiness

**Epic goal:** Ship day-one-compliant, soft-launch-proof, and operationally ready.

| ID | Story | FR / NFR | Notes |
|---|---|---|---|
| **E10-S01** | Karnataka right-to-refuse enforcement — data-layer isolation + ranking-invariance integration test in CI | FR-9.1, NFR-C-1 | Dispatcher read-model has no decline fields; test fails CI if any dispatcher query touches decline history |
| **E10-S02** | Central SSC aggregator levy automation — quarterly cron calculates 1-2% of GMV + Razorpay transfer to SSC fund | FR-9.2, NFR-C-2 | Quarterly timer trigger; itemised report; owner verification; audit log entry |
| **E10-S03** | GST e-invoice pipeline — per-booking generation + B2B path (GSTIN in profile) + IRP integration when applicable | NFR-C-4 | MVP covers single-state GST; e-invoicing for B2B triggered on toggle (C-34 GST mode) |
| **E10-S04** | Launch readiness suite — soft-launch feature flag (GrowthBook OSS), marketing-pause toggle, emergency-rollback playbook test, DR drill | NFR-R-1/R-3, Runbook §5 | Flag-controlled: first 100 F&F bookings only while soft-launch; DR drill documented |

---

## Dependency Graph (which stories must come before which)

```
E01 (all) — blocks everything

E02-S01, S02 — block E03, E04, E06, E07, E08
E02-S03     — blocks E05 (tech must be KYC'd before dispatch)
E02-S04     — blocks E09

E03-S01     — blocks E03-S02
E03-S02     — blocks E03-S03
E03-S03     — blocks E03-S04
E03-S04 (payment captured) — blocks E05-S02 (dispatch trigger)

E05-S01     — blocks E05-S02
E05-S02     — blocks E05-S03, S04
E05-S04     — blocks E06-S01

E06-S01     — blocks E06-S02, S03
E06-S03     — blocks E06-S04
E06-S04     — blocks E06-S05, E07-S01

E07-S01     — blocks E07-S02
E05-S02, E06-S04 — block E08-S01 (earnings rely on ledger)

E09-S01     — shared design; others can parallelise
E09-S05 (audit log) — blocks E09-S03 (override needs audit)

E10-S01 — blocks E05-S02 merge to main (Karnataka test is MVP-gate)
E10-S02 — independent (Phase 2 reasonable target; soft requirement)
E10-S03 — independent (can ship after MVP)
E10-S04 — final integration; blocks public launch
```

---

## "Fresh Session per Story" Execution Plan (per CLAUDE.md)

For each story, when picked up:

1. **Fresh Claude Code session.**
2. Invoke `/bmad-create-story` with the story ID → produces `docs/stories/E##-S##-<slug>.md` with full context + tests + implementation hints.
3. Commit the story file.
4. **Fresh session.** Invoke `/superpowers:brainstorming` to explore design.
5. Invoke `/superpowers:writing-plans` → commit `plans/E##-S##-<slug>.md`.
6. **Fresh session** (context quarantine). Invoke `/superpowers:executing-plans`.
7. TDD: tests in `tests/` before implementation.
8. `/superpowers:verification-before-completion`.
9. **5-layer review gate** before push:
   - `/code-review` (lint + stylistic)
   - `/security-review`
   - `/codex-review-gate` — **Codex CLI is authoritative** (writes `.codex-review-passed`)
   - `/bmad-code-review` (Blind Hunter + Edge Case Hunter + Acceptance Auditor)
   - `/superpowers:requesting-code-review`
10. Push to feature branch → CI runs `ship.yml` (type + lint + test ≥ 80% + Semgrep + axe-core + Lighthouse + Codex-marker-check + BMAD artifact gate) → PR review → merge to `main`.
11. Update this index file: mark story as done (`[x]`).

---

## Done Criteria (for the epic phase)

An epic is "done" when:
- Every story in the epic is merged to `main`.
- `ship.yml` passes on `main`.
- No open critical Sentry issues from the epic's code paths.
- Owner has smoke-tested the flow in staging.

---

## Phase 5 Status Tracker

| Epic | Started | Completed |
|---|---|---|
| E01 | ⬜ | ⬜ |
| E02 | ⬜ | ⬜ |
| E03 | ⬜ | ⬜ |
| E04 | ⬜ | ⬜ |
| E05 | ⬜ | ⬜ |
| E06 | ⬜ | ⬜ |
| E07 | ⬜ | ⬜ |
| E08 | ⬜ | ⬜ |
| E09 | ⬜ | ⬜ |
| E10 | ⬜ | ⬜ |

---

**Epics & Stories v1.0 complete.** Ready for Phase 5.5 readiness gate and per-story execution.
