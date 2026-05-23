# Launch Readiness Checklist — homeservices-mvp

**Created:** 2026-05-17
**Owner:** Alok Tiwari
**Target launch:** Ayodhya/UP pilot soft-launch
**Goal:** Track everything between "code complete" and "first real customer can book without losing money."

---

## Status legend

- `[ ]` not started
- `[~]` in progress
- `[x]` done
- `[!]` blocked / needs decision
- `[N/A]` not applicable to this phase

---

## 1. Engineering backlog (code-complete)

### 1a. In-flight (last 3 PRs)

- [ ] **E11-S05b-2** — SOS audio AES-GCM encrypt + Storage upload + admin playback endpoint (`plans/E11-S05b-2.md`)
- [ ] **E16-S04** — Customer-app address picker (Places SDK + draggable pin) + `POST /v1/waitlist` (`plans/E16-S04.md`)
- [ ] **E17-S02** — Cross-app 30s technician location push (tech-app foreground service + API + customer-app tracking) (`plans/E17-S02.md`)

### 1b. Security hardening — production blockers

These are P0 for DPDP Act compliance + admin security posture. No story files existed before 2026-05-17.

- [ ] **E19-S01** — I-A1: PAN cleartext in Cosmos → hash + last-4 mask, discard raw (`plans/E19-S01-pan-encryption.md`)
- [ ] **E19-S02** — I-A2: FCM topic PII leak → switch sensitive notifications to device-token send (`plans/E19-S02-fcm-pii-trim.md`)
- [ ] **E19-S03** — I-A3: Cross-partition query guardrails → Semgrep rule + coverage tests (`plans/E19-S03-cross-partition-guard.md`)
- [ ] **E19-S04** *(to be scoped)* — E-A1: TOTP-setup TOFU race (admin onboarding — high risk during owner enrollment window)
- [ ] **E19-S05** *(to be scoped)* — E-A2: `updateAdminUser` role-write guard at service layer

### 1c. Code-complete sign-off

After all of the above merge:

- [ ] `git log origin/main` — last 30 commits all green
- [ ] `bash tools/pre-codex-smoke.sh customer-app` — green
- [ ] `bash tools/pre-codex-smoke.sh technician-app` — green
- [ ] `bash tools/pre-codex-smoke-api.sh` — green
- [ ] `bash tools/pre-codex-smoke-web.sh` — green
- [ ] `docs/threat-model.md` reviewed; all `not-yet-mitigated` rows have either a story or a documented accept/defer decision

---

## 2. Infra provisioning (Azure + GCP + third-party)

### 2a. Azure Functions — `func-homeservices-prod`

- [ ] Verify all Cosmos containers exist (run `pnpm -C api setup:cosmos`):
  - `bookings`, `services`, `categories`, `technicians`, `customer_credit_ledger`, `complaints`, `audit_log`, `payouts`, `ssc_levies`, `pending_actions`, `slot_holds`
  - **NEW (after in-flight PRs):** `live_locations` (E17-S02), `waitlist` (E16-S04), `sos_incident_keys` (E11-S05b-2)
- [ ] Lease containers exist (cannot auto-create): `booking_completed_leases`, `booking_rating_prompt_leases`, `booking_report_leases`
- [ ] All required app settings configured: `COSMOS_CONNECTION_STRING`, `COSMOS_DATABASE`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `ACS_CONNECTION_STRING`, `SENTRY_DSN`, `POSTHOG_API_KEY`, `GROWTHBOOK_API_HOST`, `GROWTHBOOK_CLIENT_KEY`, `WEBSITE_RUN_FROM_PACKAGE` (deleted per Oryx note), `SCM_DO_BUILD_DURING_DEPLOYMENT=true`, `ENABLE_ORYX_BUILD=true`, `NPM_CONFIG_INCLUDE=dev`
- [ ] Last deploy verified via `/api/v1/health` showing the right git SHA
- [ ] Cold start latency measured on Consumption plan (target <2s p95)
- [ ] Region: `centralindia` confirmed

### 2b. Azure Container Apps — `aca-admin-homeservices-prod`

- [ ] Image pushed to GHCR: `ghcr.io/aloktiwarigit/urbanclap-dup-admin-web:<sha>`
- [ ] ACA scaling: min replicas 0, max replicas 1 (pilot cost control)
- [ ] Custom domain (when ready) wired with HTTPS cert
- [ ] Same-origin `/admin-api/*` reverse-proxy to `func-homeservices-prod` confirmed

### 2c. Firebase project

- [ ] Production Firebase project provisioned (separate from dev)
- [ ] Phone Auth enabled (test number quota raised if needed)
- [ ] Storage bucket configured + **lifecycle rule for 7-day TTL on SOS audio** (E11-S05b-2 dependency)
- [ ] FCM Server Key + Service Account JSON downloaded; loaded into `FIREBASE_SERVICE_ACCOUNT_JSON` app setting
- [ ] Crashlytics enabled on both Android apps
- [ ] Remote Config keys defined: `rating_shield_threshold_stars` (default 2), feature flags as needed
- [ ] App Check enabled (Play Integrity) — if used in code
- [ ] `google-services.json` for each Android app — release builds only

### 2d. GCP — Maps + Places

- [ ] Maps SDK for Android enabled
- [ ] Places SDK for Android enabled (E16-S04 dependency)
- [ ] Daily quota alert configured (billing protection at the $200/mo free tier)
- [ ] Restrict API keys to bundle ID + SHA-1 fingerprints (release signing keys)

### 2e. Razorpay

- [ ] Live mode KYC completed
- [ ] Live API keys → API app settings (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`)
- [ ] Webhook URL: `https://func-homeservices-prod.azurewebsites.net/api/v1/webhooks/razorpay`
- [ ] Webhook signature secret configured
- [ ] Test booking → real payment → webhook → booking CONFIRMED end-to-end

### 2f. Truecaller SDK

- [ ] Partner registered + App ID + secret obtained
- [ ] Configured per Android build flavor (debug vs release)

### 2g. DigiLocker (Aadhaar KYC)

- [ ] Government partner registration completed
- [ ] OAuth client credentials in API app settings
- [ ] First test consent flow verified end-to-end with a real Aadhaar

### 2h. Azure Communication Services — Email

- [ ] Sender domain verified
- [ ] DKIM/SPF/DMARC records published
- [ ] Test welcome email + complaint notification delivered to gmail + outlook + a UP-rural ISP inbox

### 2i. Observability — Sentry + PostHog + GrowthBook

- [ ] Sentry org + project for each surface (customer-app, technician-app, admin-web, api)
- [ ] PostHog Cloud project + API keys
- [ ] GrowthBook OSS instance running OR GrowthBook Cloud Free SDK key (E13-S05)
- [ ] Sentry alerts: rate-limit 5k errors/mo, p1 alert on >50 errors/min, slack/email channel wired
- [ ] PostHog funnels defined: `booking-search → catalogue-view → booking-created → booking-confirmed → booking-completed → rating-submitted`
- [ ] GrowthBook flags wired and toggleable for a single test customerId

---

## 3. Compliance + Legal

### 3a. DPDP Act (India Data Protection)

- [ ] **E19-S01 PAN encryption merged** (currently `not-yet-mitigated`)
- [ ] Data Export (E15-S01) end-to-end verified on a real account
- [ ] Account Delete (E15-S02) — 7-day cool-off + revoke flow verified
- [ ] Privacy policy URL live and linked from app
- [ ] Consent capture wording reviewed by counsel
- [ ] Data Processor / Sub-processor agreements with: Firebase (Google), Azure (Microsoft), Razorpay, Truecaller, ACS, Sentry, PostHog, GrowthBook
- [ ] DPDP Grievance Officer named + contact published

### 3b. Karnataka decline-history isolation (ADR-0011)

- [ ] All 4 enforcement layers verified active (Semgrep rule passes, dispatcher unit test passes)

### 3c. SSC Levy quarterly compliance (E10-S02)

- [ ] Timer trigger active (`0 0 0 1 1,4,7,10 *`)
- [ ] Owner notification flow tested end-to-end
- [ ] Razorpay Route fund account configured for SSC fund transfer
- [ ] First quarter dry-run scheduled before live booking date

### 3d. Terms + Refund policy

- [ ] Terms of Service drafted + counsel reviewed + published
- [ ] Refund policy drafted + counsel reviewed + published
- [ ] Cancellation policy aligned with refund policy
- [ ] Both URLs linked from app and admin

### 3e. Operator-technician contracts

- [ ] Independent-contractor agreement template signed by first 10 technicians
- [ ] KYC retention + deletion policy in contract

---

## 4. Pre-launch QA

### 4a. End-to-end smoke tests

- [ ] **Real booking, real Razorpay** — Alok books from customer-app, pays ₹100 (smallest test slot), real technician accepts, flow completes through COMPLETED + rating
- [ ] **No-show flow** — booking, technician doesn't show within window, redispatch fires, credit issued, customer sees credit chip on home
- [ ] **Add-on price approval** — technician requests add-on mid-job, customer approves with biometric, payment captures correctly
- [ ] **SOS** — customer triggers SOS, owner FCM delivered, audio uploaded (post E11-S05b-2)
- [ ] **Complaint** — customer files complaint from booking, admin sees it, reopen flow works

### 4b. Hindi (Devanagari) UI review

- [ ] Native Hindi speaker walks every screen on customer-app
- [ ] Native Hindi speaker walks every screen on technician-app
- [ ] Native Hindi speaker walks admin-web (per ADR-0016)
- [ ] Devanagari typography polish verified on actual low-end Android (per E12-S03b devanagari-web-typography.md)
- [ ] Numeric formatting (currency, dates, distances) verified

### 4c. Field conditions

- [ ] Customer-app tested on ₹5,000-class entry-level Android (target market device)
- [ ] Technician-app foreground location service battery drain measured over 4h job
  - Target: <8% battery per hour with location running
- [ ] 2G/3G network simulator: booking flow completes within 30s; offline → recover gracefully
- [ ] Actual rural-Ayodhya field test: travel there, drive 5km, verify GPS accuracy + service-area boundary check
- [ ] Truecaller-not-installed fallback (OTP path) tested on a fresh device

### 4d. Accessibility

- [ ] Google Accessibility Scanner run on both Android apps; 0 critical issues
- [ ] axe-core (admin-web) — 0 critical, <5 warnings
- [ ] TalkBack screen-reader walkthrough on key flows

### 4e. Load test (light)

- [ ] 50 concurrent bookings simulated → no Cosmos 429s
- [ ] Admin dashboard with 1,000 bookings loads in <3s
- [ ] FCM fan-out for 5 simultaneous SOS events delivered within 5s

---

## 5. Play Store + release

### 5a. Customer-app — Play Store

- [ ] App name + icon + screenshots (5 minimum) + feature graphic
- [ ] ASO copy in Hindi + English (short + long description)
- [ ] Privacy policy URL set in Play Console
- [ ] Data Safety form completed (DPDP-aligned)
- [ ] Content rating questionnaire submitted
- [ ] Target audience (18+) and content guidelines confirmed
- [ ] Signed release AAB uploaded; internal testing track verified install + launch
- [ ] Closed beta track set up with 10 testers (yourself + family + friendly users)
- [ ] Pre-launch report from Play Console reviewed (no crashes on test devices)

### 5b. Technician-app — Play Store

- [ ] Separate app listing OR consolidated under same dev account
- [ ] Permissions justified in Data Safety form (location-always, foreground service, camera)
- [ ] Foreground service usage declared (E17-S02 — location during active job)
- [ ] Closed beta with 5 real technicians from Ayodhya area

### 5c. Brand naming

- [ ] **Decide brand name** — `homeservices-mvp` placeholder needs to be replaced before Play Store listing (per CLAUDE.md)
- [ ] Domain registered
- [ ] Logo + brand assets finalized
- [ ] Customer-app `applicationId` renamed if needed (note: changing applicationId requires a new Play Store listing — decide BEFORE first internal track upload)
- [ ] Technician-app `applicationId` renamed if needed

### 5d. Release signing

- [ ] `release-upload.jks` backed up to a secure secondary location (encrypted)
- [ ] Keystore password stored in a password manager (not in git)
- [ ] Play App Signing enrolled (Google holds the signing key; you only hold upload key)

---

## 6. Runbook + on-call

### 6a. Runbook

- [ ] `docs/runbook.md` reviewed end-to-end (current as of 2026-05-17?)
- [ ] Each runbook scenario rehearsed:
  - Cosmos throttling / 429 storm
  - Razorpay outage
  - FCM delivery failure spike
  - SOS alert that fails to reach owner
  - Compromised admin TOTP
- [ ] Owner can reproduce each recovery step without help

### 6b. On-call

- [ ] Owner phone number on PagerDuty/Sentry alerts (or just Sentry email → SMS bridge)
- [ ] Severity thresholds defined: P0 = customer cannot complete a booking; P1 = degraded but recoverable; P2 = next-business-day
- [ ] First-week post-launch: owner on-call 24/7; after week 1, define schedule

### 6c. Backups + DR

- [ ] Cosmos periodic backup verified (Cosmos Serverless has built-in backups; confirm restore-test procedure)
- [ ] Firebase Storage versioning enabled where relevant
- [ ] Recovery Time Objective (RTO) documented: target <4h for full data restoration
- [ ] Recovery Point Objective (RPO) documented: target <15min data loss

---

## 7. Launch sequencing

### 7a. Internal alpha (week 0)

- [ ] Owner + 2 trusted friends as customers
- [ ] 1 owner-controlled technician
- [ ] 5 bookings completed end-to-end
- [ ] Sentry, PostHog, GrowthBook all receiving events as expected
- [ ] No P0 issues across 48h soak

### 7b. Closed beta (week 1-2)

- [ ] 10-20 invited customers from Ayodhya
- [ ] 3-5 technicians from Ayodhya
- [ ] Owner manually monitors every booking
- [ ] Daily standup with owner-self: review Sentry + PostHog funnel + complaint count
- [ ] Exit criteria for narrow soft-launch:
  - <1 P0 per week
  - >80% bookings reach COMPLETED
  - <10% complaint rate
  - Owner has personally seen every failure mode at least once

### 7c. Narrow soft-launch (week 3-6)

- [ ] One ward / neighborhood in Ayodhya
- [ ] 50-100 customers target
- [ ] No paid marketing yet — referral + word-of-mouth only
- [ ] Daily owner review continues
- [ ] First post-launch ADR cycle: anything that went sideways gets an ADR within 7 days

### 7d. Pilot expansion

- [ ] If narrow soft-launch hits exit criteria, expand to all of Ayodhya district
- [ ] Then expand to Faizabad, then neighboring districts
- [ ] Wider expansion gated on: pilot booking volume > 200/mo, complaint rate <5%, technician retention >70%

---

## 8. Documentation hygiene

- [ ] `docs/prd.md` reflects shipped scope (drop any scoped-out items)
- [ ] `docs/architecture.md` reflects production infra (Azure + GCP + Firebase)
- [ ] `docs/runbook.md` includes everything from §6a above
- [ ] `docs/stories/README.md` marks all completed stories (E18-S01/S02/S03 were silently merged via W4-Batch2 + earlier PRs — needs update)
- [ ] `docs/threat-model.md` all rows reviewed; status accurate
- [ ] `CLAUDE.md` brand name updated (after §5c decision)
- [ ] `README.md` at repo root explains how to clone, set up, and run locally — for the eventual second developer

---

## Critical-path summary

The bare minimum to take a real payment from a real customer:

1. **E11-S05b-2 + E16-S04 + E17-S02 PRs merged** (1c)
2. **E19-S01 PAN encryption merged** (DPDP compliance, 1b + 3a)
3. **Azure infra provisioned** with all containers + app settings (2a)
4. **Razorpay live keys + webhook verified end-to-end** (2e + 4a)
5. **Privacy policy + ToS published; brand name decided** (3d + 5c)
6. **Signed AAB internal track installs and runs** (5a)
7. **Owner has done 5 real bookings end-to-end** (4a + 7a)

Everything else is hardening / scale / nice-to-have. The 7 items above are the gate.
