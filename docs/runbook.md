# Runbook — homeservices-mvp

**Author:** Alok Tiwari + Winston
**Date:** 2026-04-17
**BMAD Phase:** 4.5
**Related docs:** `docs/architecture.md`, `docs/threat-model.md`, `docs/prd.md` §NFR-R reliability

---

## 1. Service Summary

**homeservices-mvp** is a three-app home-services marketplace for the Indian market — Customer Android, Technician Android, Owner Web Admin — running on Azure (Functions Consumption + Cosmos DB Serverless + Static Web Apps) and Firebase (FCM + Auth + Storage). Payments via Razorpay + Razorpay Route. KYC via DigiLocker. Maps via Google Maps Platform.

**Dependents:**
- End customers in the pilot city (Bengaluru per OQ-2) — need booking, payment, tracking, complaints.
- Active technicians — need job offers, earnings, payouts.
- Owner operator (Alok) — needs live ops visibility, overrides, compliance reports.
- Regulators (Karnataka Labour Department, Central government for SSC levy, GST authorities) — need compliance reports quarterly.

**Where it runs:**
- API: Azure Functions Consumption plan, Azure India Central region
- Data: Azure Cosmos DB Serverless, Azure India Central
- Admin web: Azure Static Web Apps, India-edge CDN
- FCM: Google infrastructure (asia-south1 region for low-latency India)
- Firebase Storage + Auth: asia-south1 (Mumbai) region
- Mobile apps: Google Play Store (Indian market)

**SLOs:**
- API uptime: ≥ 99.5% (3.6 hours/month error budget)
- API p95 latency: < 500 ms reads, < 800 ms writes
- Dispatch p95: < 2 s end-to-end
- FCM delivery: ≥ 95% within 10 s
- Payment capture success: ≥ 99.95%

---

## 2. Oncall

**Primary:** Alok Tiwari (founder) — phone + WhatsApp always on
**Secondary (Phase 2 onwards):** Ops manager — hired when MVP reaches 500 bookings/month
**Escalation (for production emergencies):**
- Razorpay account manager (for payment issues): via Razorpay Dashboard support
- Azure support (Developer plan — free, community-based): portal.azure.com
- Firebase support: firebase.google.com/support
- DigiLocker issues: digilocker.gov.in → support

**Paging (Phase 1):** Sentry alerts → email + phone (via Twilio-free-tier or manual SMS). No PagerDuty (paid SaaS — forbidden per ADR-0007).

---

## 3. Dashboards

| System | URL | What to look for |
|---|---|---|
| **Azure portal** | portal.azure.com → homeservices-mvp RG | Function execution rates, Cosmos RU consumption, Storage usage, Static Web App traffic |
| **Azure App Insights** | Azure portal → App Insights resource | API latency, error rate, failed requests, dependency call metrics |
| **Sentry** | sentry.io/homeservices-mvp | Errors across mobile + admin + api (free tier 5k errors/mo) |
| **PostHog** | posthog.com → homeservices-mvp project | User flows, conversion funnels, feature usage, FCM delivery telemetry (free tier 1M events/mo) |
| **Razorpay Dashboard** | dashboard.razorpay.com | Payment success rate, payout status, disputes, settlement reconciliation |
| **Firebase Console** | console.firebase.google.com | FCM delivery reports, Auth sign-in stats, Storage usage |
| **Google Cloud Console** | console.cloud.google.com | Maps Platform API usage (free $200/mo credit tracking) |
| **GitHub Actions** | github.com/.../actions | CI status, deploy history |
| **Owner Live Ops** (admin web, this app) | admin.homeservices-mvp.in (TBD) | Business KPIs, live orders, complaints SLA |

---

## 4. Common Incidents

### INC-1: Elevated API error rate (Sentry spike or App Insights failure-rate > 2%)

**Signals:**
- Sentry alert (issue frequency > threshold)
- App Insights failure-rate graph > 2%
- Customer complaints in owner admin spiking

**Diagnosis:**
1. Open Sentry → filter by "unresolved" → identify the new exception type and the triggering deploy.
2. Open App Insights → "Failures" blade → see which endpoint is failing.
3. If correlated with a recent deploy (last 60 min), suspect regression.
4. If downstream service (Razorpay, DigiLocker, Cosmos, FCM) is returning errors, check vendor status pages.

**Resolution:**
- **Recent-deploy regression:** revert the triggering commit → re-run CI → auto-deploy via Static Web Apps. Rollback time < 10 min.
- **Downstream outage:** check vendor status page; if confirmed outage, (a) post maintenance banner in customer app (FCM topic `all_customers`), (b) pause new bookings if payment/dispatch critical dependency is down, (c) extend complaint SLA by outage duration in owner admin.
- **Traffic spike (DDoS or viral moment):** verify rate-limits are firing (NFR-S-10); if legitimate traffic causing cold-starts, bump warm-up ping frequency temporarily; if malicious, enable Azure Front Door WAF (Phase 2 — paid ADR required for MVP).

**Postmortem:** required for any INC-1 affecting > 5% of users for > 30 minutes.

---

### INC-2: Payment failures (Razorpay capture success drops < 99%)

**Signals:**
- Razorpay dashboard shows elevated failure rate
- Sentry errors: `RazorpayCaptureFailed`, `WebhookSignatureInvalid`
- Customer complaints about failed bookings

**Diagnosis:**
1. Razorpay status.razorpay.com — vendor-side?
2. Our Razorpay webhook endpoint at `/webhooks/razorpay` — are we rejecting valid webhooks? (signature mismatch)
3. Our keys: are they the correct environment (prod/staging)?
4. Specific payment method failing (UPI vs Card vs Wallet)?

**Resolution:**
- **Vendor outage:** customer sees "Payment temporarily unavailable" via FCM broadcast; booking held in `SEARCHING` for 10 min; if no capture, full refund auto-initiated.
- **Our webhook signature bug:** verify key in Key Vault matches Razorpay dashboard; recent rotation? re-rotate + redeploy.
- **UPI-only failure (RuPay issues):** enable fallback to Card via Razorpay SDK config.
- **Reconciliation discrepancy (our records vs Razorpay):** daily cron should flag; investigate the gap — usually webhook retries missed.

**Owner action:** pause marketing campaigns during incident to avoid adding more failed bookings.

---

### INC-3: Dispatch failure (bookings stuck in `SEARCHING` > 5 min)

**Signals:**
- Owner admin shows bookings in `UNFULFILLED` rising
- Sentry errors: `DispatcherFunctionTimeout`, `CosmosQueryFailed`
- Techs report "not getting jobs"

**Diagnosis:**
1. Dispatcher function health in App Insights — invocation success rate?
2. Cosmos RU throttling (429s)? Check RU consumption vs free-tier 1000 RU/s.
3. FCM delivery — are pushes reaching tech phones? PostHog event `fcm_push_received` rate.
4. Tech pool health: are enough techs online + available for the booking's category? (Maybe a Sunday afternoon gap.)

**Resolution:**
- **Cosmos 429 (RU throttling):** free-tier 1000 RU/s nearly exhausted — fix query hotspots immediately (most likely a new endpoint doing cross-partition scan). Temporary: enable burst capacity (Cosmos serverless accommodates burst). Long-term: ADR for moving to provisioned 4000 RU/s (~₹20k/mo — threshold-crossing ADR-0007 event).
- **FCM delivery degraded:** layer in MSG91 SMS fallback (pre-planned 1-week implementation); meanwhile owner messages affected techs directly via WhatsApp.
- **Tech pool thin:** owner manually assigns via override (O-6); recruit more techs next day.

**Customer-facing:** affected bookings → `UNFULFILLED` → FCM with apology + automatic full refund + ₹500 credit goodwill offer.

---

### INC-4: Cosmos DB outage or data corruption

**Signals:**
- API returning 5xx with Cosmos connection errors
- Admin live ops not updating
- Writes failing silently

**Diagnosis:**
1. Azure status page — Cosmos DB India Central region status
2. Application Insights → dependency calls → Cosmos latency + failure rate

**Resolution:**
- **Region outage:** Cosmos continuous backup covers us; restore-to-point-in-time within 7-day window to a new Cosmos account in a different region; update Function app settings; expect 2-4 hour RTO (meets NFR-R-3).
- **Corruption (specific collection):** point-in-time restore that collection (Cosmos continuous backup granularity).
- **Data-inconsistency bug (not outage):** use the `booking_events` collection (append-only event log) as source of truth to rebuild bookings state if needed.

**DR drill:** quarterly restore to secondary account + smoke test. Document in `docs/postmortems/drill-YYYY-QX.md`.

---

### INC-5: Auth failures (customers/techs cannot sign in)

**Signals:**
- Sentry errors: `FirebaseAuthInvalidToken`, `TruecallerSDKError`
- PostHog: signup funnel drop
- Customer WhatsApp complaints

**Diagnosis:**
1. Truecaller SDK status — are Truecaller-based verifications succeeding? PostHog event `auth_method=truecaller` success rate.
2. Firebase Phone Auth status — Google infra issue?
3. Firebase Auth quota — hit daily SMS limit? (Steady state should never exceed.)
4. Specific region — device-type cluster?

**Resolution:**
- **Truecaller outage:** fallback to Firebase Phone Auth OTP activates automatically (architected fallback); expected cost bump ~₹500-1000 for the day, acceptable.
- **Firebase Phone Auth outage:** fallback to MSG91 direct integration (Phase 2 pre-plan — 1-week implementation); meanwhile message affected users via FCM that auth is delayed.
- **Google Sign-In issue:** direct affected customers to phone-OTP path.

---

### INC-6: FCM delivery degradation (delivery < 95% within 10s over 15-min window)

**Signals:**
- PostHog `fcm_push_sent` vs `fcm_push_received` gap > 5%
- Customer complaints about missing booking status
- Tech complaints about not receiving job offers

**Diagnosis:**
1. Firebase Console → FCM Delivery Insights
2. FCM status — Google infra outage?
3. Specific device-type pattern (some Android OEMs aggressive battery management)?

**Resolution:**
- **Google FCM outage:** nothing we can do on Google side; customer sees banner "Live tracking delayed"; tech-side, switch dispatcher to broadcast-to-all within radius instead of top-3-with-timeout (reduces ACK-loss risk).
- **OEM battery management:** documented customer guidance (e.g., whitelist our app in battery settings); typically Xiaomi/Oppo/Vivo.
- **Chronic issue > 48 hrs:** activate MSG91 SMS fallback (costs ~₹500-1000/day extra — approved operational spend, tracked as incident cost).

---

### INC-7: Free-tier quota breach (Cosmos RU, Functions execs, etc.)

**Signals:**
- Azure Monitor alert (70% / 85% / 95% thresholds set)
- 429 errors from Cosmos
- Unexpected Azure bill

**Diagnosis:**
1. Which service hit limit?
2. Is it traffic growth (good problem) or a bug causing excess consumption (code problem)?

**Resolution:**
- **Traffic growth:** if we've reached free-tier ceiling organically, that's the MVP → Phase 2 trigger. ADR required to pay for next tier (NFR-M-2 ≤ ₹50k/mo cap). Owner approves; deploy paid-tier config change.
- **Code bug:** revert/fix the over-consuming query or function. Common offender: N+1 query in a new endpoint, misconfigured timer trigger.
- **Immediate survival:** if critical (service broken), enable temporary paid-tier config via `CLAUDE_OVERRIDE_REASON` environment variable (logged to override-log.jsonl per CLAUDE.md); fix code within 7 days and revert.

---

### INC-8: Safety SOS triggered (FR-6.5 customer safety event)

**Signals:**
- Owner web admin: SOS notification banner (red)
- FCM to owner's admin topic `safety_sos`

**Diagnosis:**
Safety events are always treated as real until confirmed otherwise.

**Resolution (owner):**
1. **Within 30 seconds:** open the SOS incident in admin; see customer name, tech name, booking location, last-known tech location from live tracking.
2. Call customer directly (admin has one-click call).
3. If customer confirms emergency: dial 112 (India emergency number); provide customer + tech name + address.
4. Initiate "force tech leave" via admin override; customer booking → `TECH_CANCELLED_SAFETY`; tech app pushed: "Job cancelled by owner — leave premises immediately."
5. Apply force-majeure to tech payment (50% fee regardless, per T-24 principle).
6. Log in audit with full reason + timeline.
7. Day-after: follow-up call with customer + offer full refund + goodwill credit.
8. If customer can't be reached within 5 min: police notification with all details.

**Owner-phone-off scenario:** Phase 2 adds secondary ops-manager SOS alert; MVP, the owner MUST be reachable 24/7 during operational hours.

---

### INC-9: Tech protest / mass-decline event (à la Urban Company Jan 2026)

**Signals:**
- Tech acceptance rate drops > 30% in a day
- Multiple tech complaints / WhatsApp escalations
- Social media chatter

**Diagnosis:**
1. Is there a specific grievance (rating, payout, dispatch perception)?
2. Is it organic tech concern or external organizing?

**Resolution (owner-led, not code-led):**
1. Do NOT deactivate protesting techs (Karnataka Act + our own values).
2. Do NOT change dispatch algorithm to penalise declines (architectural constraint ADR-0006).
3. Do engage directly: call top 10 techs; ask what's wrong; address genuine grievances (usually payout timing or specific customer dispute).
4. Update all techs via FCM broadcast `techs_all` with transparency.
5. Post-incident: review dispatch + rating + payout logs for genuine systemic issue; fix root cause; document in post-mortem.

---

### INC-10: Regulatory audit (Karnataka Labour Department or GST)

**Signals:**
- Owner receives formal notice

**Preparation:**
- Regulatory dashboard (O-30, Phase 2) has SSC levy + Karnataka welfare contributions + GST e-invoices always ready to export.
- Audit log (O-28) is the primary evidence source.
- Architecture transparency: algorithm features are publishable (NFR-C-1).

**Response:**
1. Acknowledge notice within 48 hrs.
2. Engage CA / legal counsel (retainer relationship recommended from MVP).
3. Export relevant data from admin modules (Orders CSV, Finance Register, Audit Log, Regulatory Dashboard) → hand to auditor.
4. Do NOT alter data during audit (Cosmos append-only collections prevent this anyway).

---

## 5. Deploy Procedure

1. PR opened on GitHub → CI runs (ship.yml) → 5-layer review gate per CLAUDE.md → Codex review marker required.
2. On `main` merge: Azure Static Web Apps auto-deploys admin-web; Azure Functions auto-deploys api (via GitHub Actions workflow).
3. Mobile apps: Play Store release builds via GitHub Actions → internal testing track → (after manual sanity test) promote to production.
4. Database migrations: Cosmos is schema-flexible; additive changes (new fields) need no migration. Breaking changes require a story + coordinated deploy.

**Rollback:**
- Admin / API: revert commit + push to `main` → auto-rolls forward. Static Web Apps retains previous deployment slots.
- Mobile: Play Store Staged Rollouts + Halt-Rollout feature. Previous APK users unaffected; new users get old version until hotfix ships.

**Feature flags (GrowthBook):**
- Any risky feature behind a flag. Kill-switch requires owner TOTP.
- Flag state changes logged to Sentry breadcrumbs.

---

## 6. Data Restore

1. **Point-in-time restore (within 7 days):** Azure Cosmos continuous backup → restore to new account → update `COSMOS_ENDPOINT` in Key Vault + redeploy Functions. RTO 2-4 hr.
2. **Per-collection restore:** select the specific collection via Cosmos portal; identical process.
3. **DR drill:** quarterly, Q1/Q2/Q3/Q4 — restore to secondary region account, run smoke test, document in `docs/postmortems/drill-*.md`.

---

## 7. Quarterly / Recurring Operational Tasks

| Task | Cadence | Owner |
|---|---|---|
| Free-tier quota review (all services) | Monthly | Owner |
| Central SSC levy remittance | Quarterly | Azure Function timer trigger + owner verify |
| Karnataka welfare board contribution | Monthly | Azure Function timer trigger + owner verify |
| GST filings (monthly + annual) | Monthly + annual | CA (external) via GST register export |
| Cosmos backup restoration drill | Quarterly | Owner |
| Dependency audit (Snyk / pnpm audit) | Every PR (CI) + monthly manual | Owner |
| Threat model review | Quarterly | Owner + Winston (architect) |
| Penetration test (Phase 2+) | Annual | External vendor |
| Performance review (are we within SLOs) | Monthly | Owner |
| Codex review marker audit | Every PR | CI |
| Tech 1-on-1s | Weekly during first 6 months | Owner |

---

## 8. Post-Incident

After every incident:
1. Blameless postmortem in `docs/postmortems/YYYY-MM-DD-<slug>.md`.
2. Use template: What happened → Impact → Timeline → Root cause → What went well → What didn't → Action items.
3. Add any new failure mode or gap to this runbook.
4. If the incident touched regulation/compliance, notify CA + legal counsel.

---

## 9. Contact List

| Role | Contact | Notes |
|---|---|---|
| Founder / primary | Alok Tiwari | 24/7 for MVP |
| Razorpay account mgr | TBD (post-onboarding) | via dashboard |
| CA / tax counsel | TBD (OQ pre-launch) | quarterly retainer recommended |
| Legal counsel (Karnataka labour) | TBD | quarterly check-in |
| Insurance partner | TBD (OQ-8 ICICI Lombard / Acko) | claim-flow contact |
| Pilot city ops (weekly vendor calls) | Founder initially | Phase 2 hire ops manager |

---

**Runbook v1.0 complete.** Living document — update after every incident and every significant architectural change.
