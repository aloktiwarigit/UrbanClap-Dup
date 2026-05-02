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

### 5.1 Admin Web — One-time Azure Static Web Apps setup

The `admin-ship.yml` workflow's `deploy` job pushes to an Azure Static Web App (Free SKU, ₹0/mo, 100 GB bandwidth). The resource and its secrets must be provisioned **once** before the first deploy.

**Fast path (recommended):** export your Firebase web-app config to a local JSON file and run:

```bash
bash tools/bootstrap-admin-web-deploy.sh path/to/firebase-web-config.json
```

The script is idempotent — it creates the SWA resource if missing, fetches the deployment token, sets all 4 GitHub secrets + the `ADMIN_WEB_PUBLIC_URL` variable, and provisions `JWT_SECRET` on SWA app settings (preserved across re-runs unless `ROTATE_JWT=true`). Prereqs: `az login`, `gh auth login`, `jq`, `openssl`.

The Firebase config JSON has the shape `{ "apiKey": "...", "authDomain": "...", "projectId": "..." }` — pull it from Firebase Console → Project settings → Your apps → Web → Config.

**Manual path (if you'd rather drive it by hand):**

**Step 1 — Create the Static Web App resource:**

```bash
az staticwebapp create \
  --name swa-homeservices-admin-prod \
  --resource-group rg-homeservices-prod \
  --location eastasia \
  --sku Free
```

(Same RG as the API Function App. **`centralindia` is NOT available** for `Microsoft.Web/staticSites` — SWA Free is restricted to `westus2 / centralus / eastus2 / westeurope / eastasia`. `eastasia` is closest to Bengaluru at ~140 ms RTT.)

**Step 2 — Get the deployment token + public hostname:**

```bash
# Deployment token → goes into GH secret AZURE_STATIC_WEB_APPS_API_TOKEN
az staticwebapp secrets list \
  --name swa-homeservices-admin-prod \
  --resource-group rg-homeservices-prod \
  --query "properties.apiKey" -o tsv

# Public hostname → goes into GH variable ADMIN_WEB_PUBLIC_URL
az staticwebapp show \
  --name swa-homeservices-admin-prod \
  --resource-group rg-homeservices-prod \
  --query "defaultHostname" -o tsv
# Output looks like: swa-homeservices-admin-prod.<random>.5.azurestaticapps.net
```

**Step 3 — Configure GitHub repo secrets + variables:**

`Settings → Secrets and variables → Actions`:

| Type | Name | Value |
|---|---|---|
| Secret | `AZURE_STATIC_WEB_APPS_API_TOKEN` | from Step 2 |
| Secret | `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project settings → Web app config |
| Secret | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | same |
| Secret | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | same |
| Variable | `ADMIN_WEB_PUBLIC_URL` | `https://<defaultHostname from Step 2>` |

**Step 4 — Set server-side runtime env vars via SWA app settings:**

`NEXT_PUBLIC_*` are baked at build time (Step 3 above). Server-only secrets must be set on the SWA resource itself:

```bash
az staticwebapp appsettings set \
  --name swa-homeservices-admin-prod \
  --setting-names \
    JWT_SECRET="$(openssl rand -hex 32)"
```

`JWT_SECRET` is consumed by `admin-web/middleware.ts` to verify the `hs_access` access-token cookie on `/dashboard/*`.

**Step 5 — First deploy:**

Push to `main` (or run `gh workflow run admin-ship.yml`). The `deploy` job will:
1. Wait for `quality-gate` and `e2e-and-a11y` to pass.
2. Invoke `Azure/static-web-apps-deploy@v1`, which runs Oryx inside the action's container — Oryx auto-detects Next.js 15, runs `pnpm install` + `pnpm build`, deploys SSR runtime + static assets.
3. App goes live at the URL from Step 2 within ~2-3 min.

**Step 6 — Verify:**

```bash
curl -I "$(az staticwebapp show --name swa-homeservices-admin-prod --resource-group rg-homeservices-prod --query 'defaultHostname' -o tsv | sed 's|^|https://|')"
# Expect 200/302 (302 = middleware redirecting unauthenticated user to /login)
```

**Caveats:**
- Azure SWA's hybrid Next.js support is in **preview** — middleware works but adds ~200-400 ms cold-start latency on first request after idle. Acceptable for an internal admin dashboard.
- ISR (`revalidate`) is **not** supported — use SSR or static.
- `next/image` Loader is restricted — defaults to unoptimized. Acceptable for admin.
- If SWA hybrid Next.js limitations bite later, fallback is Azure App Service B1 (~₹1k/mo) or Container Apps (free 180k vCPU-sec/mo) — both need an ADR amendment to ADR-0007.

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

## 10. DPDP 72-hour breach notification (added 2026-04-26)

**Statutory basis:** Digital Personal Data Protection Act 2023 §10 +
Data Protection Board rules. Applies nationwide; relevant to the Ayodhya
pilot regardless of state.

**Trigger.** Any of:

1. Sentry alert containing PII (uid, phone, address, KYC fields, payment
   identifiers) on a path that should not have logged it.
2. Cosmos DB alert: unauthorised egress, exposed connection string, anomalous
   read pattern from non-admin source.
3. External notification — customer/tech/researcher reports unauthorised
   access to their data.
4. Unauthorised access to admin-web (compromised admin session, leaked TOTP).
5. Razorpay breach notification touching our merchant account.

**Owner:** Alok Tiwari. Sole operator — no escalation chain in pilot.

### Within 24 hours: data-principal notification

1. Identify affected uids via audit log query (`resourceType` = container
   touched + `timestamp` window).
2. For each affected user, send FCM + email:
   ```
   Subject: Important — security incident affecting your Home Heroo data

   We detected unauthorised access to your account information on
   <DATE>. The following data may have been viewed: <LIST>. We have
   <ACTION TAKEN>. You should: <RECOMMENDED ACTIONS, e.g. change
   Firebase password, watch for fraud>.

   Incident ID: <UUID>
   ```
3. Audit-log entry: `action='DPDP_BREACH_USER_NOTIFIED'`, `resourceId=<uid>`.

### Within 48 hours: DPDP Board notification

Email to the Data Protection Board (`dpdp@meity.gov.in` or successor
authority — verify current address quarterly):

```
Subject: §10 breach notification — Home Heroo (homeservices-mvp)

1. Data fiduciary: <legal entity name>, GSTIN <if registered>
2. Contact: Alok Tiwari, aloktiwari49@gmail.com, <phone>
3. Incident discovered: <ISO datetime>
4. Nature of breach: <unauthorised access / accidental disclosure / loss / etc.>
5. Categories of personal data affected: <see DPDP §2(t)>
6. Approximate number of affected data principals: <N>
7. Likely consequences: <description>
8. Measures taken or proposed: <description>
9. Data principal notification status: <complete / in-progress with timeline>
```

### Within 72 hours: full incident report

File at `docs/postmortems/YYYY-MM-DD-dpdp-<slug>.md` with:

- Cause (root cause analysis)
- Scope (number of users, fields, time window)
- Mitigation (what we did)
- Prevention (what we'll change so it doesn't recur)
- Timeline of detection → notification → resolution
- Audit log queries used to bound the scope
- Reference to ADR if architectural change required

Cross-reference the incident in `docs/runbook.md` § Past Incidents.

### Drill cadence

- Tabletop exercise: quarterly (calendar reminder).
- After every incident: rerun this section as a checklist; update gaps.

---

## 11. Admin Setup Procedure (first deploy)

**Do this once before the pilot owner completes TOTP enrollment. Skipping this leaves the setup endpoint open.**

### Step 1 — Generate the setup secret

```bash
# Generate a 32-byte cryptographically random secret
openssl rand -hex 32
# Example output: a3f8c2d1e9b47056...
```

### Step 2 — Set the env var in Azure Functions

In the Azure Portal → your Function App → Configuration → Application settings:

```
ADMIN_SETUP_SECRET = <the hex value from step 1>
```

Save and restart the Function App.

### Step 3 — Share with the owner only

Send the secret value to Alok (the legitimate owner) via a secure out-of-band channel (e.g. Signal, not email). This value must **not** appear in source control, chat history, or issue trackers.

### Step 4 — Owner completes enrollment

The owner opens the TOTP setup URL and sets the `X-Setup-Secret` header (or uses a pre-configured tool / admin web UI that embeds it):

```
GET  /api/v1/admin/auth/setup-totp
X-Setup-Secret: <secret>
Authorization: Bearer <setup-token>
```

Follow with the POST to confirm the TOTP code. On success, the owner's TOTP device is enrolled and the setup endpoint is now locked (any subsequent attempt without the secret returns 403).

### Step 5 — Optional: rotate or remove the secret

After enrollment is confirmed:
- **Remove:** Delete `ADMIN_SETUP_SECRET` from Azure Function App settings → setup endpoint reverts to open mode (safe post-enrollment since `ALREADY_ENROLLED` blocks re-setup).
- **Rotate:** Replace with a new value for future re-enrollment scenarios (e.g. new admin, device lost).

### Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `403 SETUP_SECRET_REQUIRED` | Header missing or wrong value | Check the `X-Setup-Secret` header matches `ADMIN_SETUP_SECRET` in Azure settings exactly |
| `409 ALREADY_ENROLLED` | Owner already completed setup | Setup is done — no action needed |
| `401 SETUP_TOKEN_INVALID` | Setup JWT expired (15 min TTL) | Re-login to get a new setup token |

---

## Emergency Rollback

**Trigger:** Sentry error rate > 5%, payment webhook failures > 2/10 min, FCM delivery < 80%/30 min, or any unhandled first-time exception in production.

**Estimated time: < 15 minutes from detection to user impact ended.**

### Step 1 — Disable soft_launch_enabled (immediate user impact ended)

In GrowthBook dashboard → Feature Flags → `soft_launch_enabled` → set to `false`.

All new booking creation attempts immediately return:
```json
{ "code": "SERVICE_UNAVAILABLE", "message": "Launch coming soon" }
```
Customers see "coming soon" instead of an error. No data is written.

### Step 2 — Triage in-flight bookings

For any bookings currently in `PAID` or `SEARCHING` state:
- Open admin-web → Orders → filter by status `SEARCHING`
- Owner manually closes or refunds via admin override panel
- Razorpay Route payouts for `COMPLETED` bookings continue automatically (unaffected)

### Step 3 — Revert the bad commit (if code regression)

```bash
git log --oneline origin/main | head -5    # identify the bad SHA
git revert -m 1 <sha>                      # creates a revert commit
git push origin HEAD:feature/revert-<sha>  # push to a new branch
# Open PR → CI green → merge
```

Do NOT force-push to main. Use revert + PR.

### Step 4 — Re-enable after root cause fixed

Once the fix is deployed and smoke-tested:
- GrowthBook → `soft_launch_enabled` → set to `true`
- Monitor Sentry for 10 minutes
- Notify F&F users via admin FCM broadcast (topic: `all_customers`)

---

## Launch Checklist

Required env vars before enabling `soft_launch_enabled`:

| Env var | Where set | Note |
|---|---|---|
| `GROWTHBOOK_CLIENT_KEY` | Azure Functions app settings | Required for soft-launch flag to work |
| `GROWTHBOOK_API_HOST` | Azure Functions app settings | Default: `https://cdn.growthbook.io` |
| `RAZORPAY_KEY_ID` | Azure Functions app settings | Production key (not test) |
| `RAZORPAY_KEY_SECRET` | Azure Functions app settings | Production key (not test) |
| `RAZORPAY_WEBHOOK_SECRET` | Azure Functions app settings | For webhook signature validation |
| `COSMOS_PAN_ENCRYPTION_KEY` | Azure Functions app settings | `openssl rand -base64 32` |
| `ADMIN_SETUP_SECRET` | Azure Functions app settings | First-run only — remove after TOTP enrollment |

See `docs/launch-checklist.md` for the full pre-launch checklist.

---

## Disaster Recovery Drill

**Run this drill 1–2 weeks before launch to confirm recovery procedures work.**

### 1. Cosmos DB restore (point-in-time)

Azure Cosmos DB Serverless has continuous backup enabled by default.

**Procedure:**
1. Azure Portal → Cosmos DB account → Backups → Restore
2. Select timestamp (up to 30 days back)
3. Restore to a new account (restoration is non-destructive — original account remains)
4. Verify document counts and spot-check data integrity
5. DNS/connection string cutover: Azure Functions → Configuration → `COSMOS_CONNECTION_STRING` → update to new account endpoint
6. Restart Function App to pick up new connection string

**Estimated RTO:**
- Full restore: 2–4 hours (depends on data volume)
- Connection string cutover: 30 minutes (if restore already complete)

**Drill:** Restore to a test Cosmos account, verify 5 sample bookings match production, then delete the test account.

### 2. Azure Functions cold-start recovery

If Functions are unresponsive (HTTP 5xx or no response):

```bash
# Portal path:
# Azure Portal → Function App → Overview → Restart

# CLI (faster):
az functionapp restart --name <app-name> --resource-group <resource-group>
```

**Estimated RTO:** < 5 minutes (Functions restart and warm up within 2–3 cold-start invocations)

**Drill:** Restart the staging Function App and verify `GET /api/health` returns 200 within 60 seconds.

### 3. Firebase Auth outage

Firebase Phone Auth is Google-managed infrastructure.

**During outage:**
- Existing sessions (Firebase JWT / persistent token) continue to work — customers mid-flow are unaffected
- New logins fail with `auth/network-request-failed` → customer-app shows "Please try again later" message
- No owner action needed

**Resolution:** Monitor [Firebase Status](https://status.firebase.google.com). Firebase has 99.9% monthly uptime SLA.

**Owner action:** None. If outage > 1 hour, post in-app maintenance banner via admin FCM broadcast.

### 4. FCM outage

FCM is Google-managed infrastructure.

**During outage:**
- Job offers not delivered via push → technicians must manually check the app for new jobs
- Owner FCM alerts not delivered → owner monitors admin dashboard directly
- `dispatcher.service.ts` logs `FCM_DELIVERY_FAILED` to Sentry — confirms outage is FCM-side

**Resolution:** None needed. FCM has 99.9% SLA. Bookings and payments are unaffected.

**Owner action:** Notify active technicians via SMS (manual, out-of-band) if outage > 30 minutes.

### 5. Razorpay Route outage

**During outage:**
- Payout disbursements via Route will fail
- `trigger-booking-completed.ts` captures Route errors to Sentry (`RazorpayRoutePayoutFailed`)
- Settled amounts stay in `PENDING` state in `wallet_ledger` entries — **idempotent and safe to retry**

**Resolution:** When Route recovers, `trigger-reconcile-payouts.ts` automatically retries all `FAILED` ledger entries on its next scheduled run (every 6 hours).

**Owner action:**
- Monitor `/v1/admin/finance/payout-queue` for stuck `PENDING` entries
- If entries remain stuck > 24 hours after Route recovery, manually trigger `trigger-reconcile-payouts` from Azure Portal → Functions → Run

**Runbook v1.2 complete (E10-S04: Emergency rollback + DR drill + launch checklist).**
Living document — update after every incident and every significant architectural change.
