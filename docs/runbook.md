# Runbook — homeservices-mvp

**Author:** Alok Tiwari + Winston
**Date:** 2026-04-17
**BMAD Phase:** 4.5
**Related docs:** `docs/architecture.md`, `docs/threat-model.md`, `docs/prd.md` §NFR-R reliability

---

## 1. Service Summary

**homeservices-mvp** is a three-app home-services marketplace for the Indian market — Customer Android, Technician Android, Owner Web Admin — running on Azure (Functions Consumption + Cosmos DB Serverless + Static Web Apps) and Firebase (FCM + Auth + Storage). Payments via Razorpay + Razorpay Route. KYC via DigiLocker. Maps via Google Maps Platform.

**Dependents:**
- End customers in the pilot city (Ayodhya, Uttar Pradesh — pivot per `project_pivot_ayodhya_hindi.md`; originally Bengaluru per OQ-2) — need booking, payment, tracking, complaints.
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

> **⚠ Deferred — requires live Razorpay account.** This procedure is documented but cannot be executed until the Razorpay live account is provisioned. The procedure body is preserved here so it is ready to execute on Day 1 of go-live; do not remove.

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

(Same RG as the API Function App. **`centralindia` is NOT available** for `Microsoft.Web/staticSites` — SWA Free is restricted to `westus2 / centralus / eastus2 / westeurope / eastasia`. `eastasia` is closest to the Ayodhya/UP rural pilot region at ~140 ms RTT.)

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
    JWT_SECRET="$(openssl rand -hex 32)" \
    API_BASE_URL="https://func-homeservices-prod.azurewebsites.net/api"
```

`JWT_SECRET` is consumed by `admin-web/middleware.ts` to verify the `hs_access` access-token cookie on `/dashboard/*`. `API_BASE_URL` points server-side admin-web calls and the `/admin-api/*` browser proxy at the Functions API while keeping Static Web Apps on the Free SKU.

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

> **⚠ Deferred — requires live Razorpay account.** This procedure is documented but cannot be executed until the Razorpay live account is provisioned. The procedure body is preserved here so it is ready to execute on Day 1 of go-live; do not remove.

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

---

## Operational Procedures 2026-04-26

**Author:** Alok Tiwari (audit pass — paired with `docs/threat-model.md` Addendum 2026-04-26)
**Trigger:** Procedures missing from v1.0 that have become load-bearing after E02–E10 stories landed.

### OP-A1: Razorpay account compromise / signature key leaked

> **⚠ Deferred — requires live Razorpay account.** This procedure is documented but cannot be executed until the Razorpay live account is provisioned. The procedure body is preserved here so it is ready to execute on Day 1 of go-live; do not remove.

**Trigger:**
- Razorpay sends a security advisory email
- Sentry alerts spike on `WebhookSignatureInvalid` AND `RAZORPAY_KEY_ID` is unchanged
- An unexpected payout shows up in the Razorpay dashboard
- A team member confirms a key leaked into git history, a screenshot, or a third-party tool

**Severity:** P0 (financial)

**Immediate action (first 5 minutes):**
1. From Razorpay Dashboard → Account & Settings → API Keys → **Regenerate** Key ID + Key Secret (this revokes the old keys immediately).
2. From Razorpay Dashboard → Webhooks → **Regenerate** webhook secret.
3. Pause all in-flight payouts: Razorpay Dashboard → Route → Pause Transfers (if Route active).

**Investigation:**
- `gh run list --workflow=ship.yml --limit 20` — confirm no rogue deploys.
- Razorpay Dashboard → Reports → All Transactions: filter last 24h, look for transfers/payouts you don't recognise.
- Cosmos `wallet_ledger` container: `SELECT * FROM c WHERE c.createdAt > <leak-window-start> ORDER BY c.createdAt DESC` — cross-check with Razorpay's record.
- Audit log: `queryAuditLog({ action: 'finance.payout_approved', dateFrom: <leak-window-start> })`.

**Mitigation:**
- Update `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` in Azure Key Vault.
- Trigger a redeploy of the API Function so it picks up new env vars (Function App → Restart).
- File reversal requests via Razorpay Dashboard for any unauthorised transfers (Razorpay supports reversal within 24h of capture).

**Recovery:**
- Resume payouts only after a clean reconciliation between Cosmos `wallet_ledger` and Razorpay's transaction history for the leak window.
- Notify affected technicians via FCM `technician_<uid>` if any of their payouts were affected.

**Post-incident:**
- DPDP-Act check: if PII flowed through unauthorised payouts (notes payload), consider this a breach → trigger OP-A4.
- Add Semgrep rule banning `RAZORPAY_KEY_*` outside `services/razorpay.service.ts` and `services/razorpayRoute.service.ts`.
- Postmortem in `docs/postmortems/`.

**Owner / escalation:**
- Razorpay account manager via Razorpay Dashboard support
- CA / legal counsel within 24h if reversed amount > ₹50,000

---

### OP-A2: FCM service-account-key rotation

**Trigger:**
- Quarterly cadence (calendar reminder; rotate every 90 days)
- Suspicion of leak (Firebase Admin SDK key in git, Sentry breadcrumb, etc.)
- Firebase Console → Service Accounts → "Last used" anomaly

**Severity:** P1 (without rotation: standing risk; on suspected leak: P0)

**Immediate action (first 5 minutes — leak case):**
1. Firebase Console → Project settings → Service accounts → **Disable** the suspect key.
2. Generate a new private key (Firebase Console → Service Accounts → Generate new private key).
3. Stage the new JSON in Azure Key Vault as `firebase-admin-sdk-NEW`.

**Investigation:**
- Firebase Console → IAM → review which projects/services hold the old key.
- Sentry: search for `firebase` in last 30 days for any logged JSON containing the old key fingerprint.
- GitHub: `gh secret list` — confirm no GitHub Actions secret holds the old key (Codex review marker check should have prevented this; verify).

**Mitigation:**
- Update API Function App settings: replace `FIREBASE_ADMIN_KEY_JSON` env var (or Key Vault reference) with the new key.
- Restart the Function App. Confirm a successful FCM publish via the next dispatch in App Insights.

**Recovery:**
- Once new key is verified working for 24h, **delete** the old service-account-key (not just disable) from Firebase IAM.
- Update local `.env.local` for any developers (rotation broadcast in team channel).

**Post-incident:**
- If leak confirmed, treat as breach + run OP-A4.
- Document rotation date in `docs/runbooks/key-rotation-log.md` (append-only).

**Owner / escalation:** Firebase support via console.

---

### OP-A3: Cosmos partition / document size limit reached

**Trigger:**
- Cosmos write returns `RequestEntityTooLarge` (HTTP 413) with code `EntityTooLarge`
- Azure Monitor alert: a single document approaching 2 MB (Cosmos hard limit) or a logical partition approaching 20 GB
- Owner sees `CONTAINER_NOT_PROVISIONED` or `DocumentTooLarge` in Sentry

**Severity:** P1 (writes to that partition fail; reads still work)

**Note on the "rating list" assumption:** the threat brief mentioned a single rating-doc growing past document size. As of audit, `rating-repository.ts` writes ONE document per booking-rating-side, so that exact failure mode is not present. The real-world equivalents are: (a) `audit_log` partition (monthly partitions, could grow large), (b) `complaints` doc with a long `internalNotes` array, (c) `dispatch_attempts` doc — though TTL'd. This procedure covers all three.

**Immediate action (first 5 minutes):**
1. Identify which container + partition is failing: Azure Portal → Cosmos → Metrics → "Document count by partition key".
2. Pause writes to the affected partition: deploy a feature-flag (GrowthBook) `partition_writes_paused_<container>=true`.

**Investigation:**
- Run `SELECT VALUE COUNT(1) FROM c WHERE c.partitionKey = '<key>'` to confirm doc count.
- Check biggest documents: `SELECT TOP 10 c.id, LENGTH(JSON.stringify(c)) AS size FROM c WHERE c.partitionKey = '<key>' ORDER BY size DESC`.
- For `complaints`: a complaint with hundreds of `internalNotes` entries is the usual culprit.

**Mitigation:**
- For **audit_log**: rotate to a new partition-key scheme (already monthly via `timestamp.slice(0, 7)`; if a single month exceeds 20 GB, switch to weekly: `timestamp.slice(0, 7) + '-W' + weekNum`).
- For **complaints**: cap `internalNotes` array size in `replaceComplaint` (e.g. ≤ 500 entries; archive older notes to a sibling `complaint_notes_archive` container).
- For **bookings hot partition** (e.g. all-customers-in-one-partition mistake — won't happen in current schema where partition is `customerId`): add a salt to partition key for known-hot tenants.

**Recovery:**
- Re-enable writes after migration: flip GrowthBook flag.
- Run a backfill if rotated container schema diverges.

**Post-incident:**
- ADR for the partition-key change.
- Update Cosmos quota alerts to fire at 70% of new limit.

**Owner / escalation:** Azure support (Developer plan, free).

---

### OP-A4: DPDP Act breach notification (72-hour window)

**Trigger:**
- Confirmed unauthorised access to PII (customer phone numbers, addresses, geo-coordinates, technician PAN, KYC photos, admin TOTP secrets)
- Triggered by OP-A1, OP-A2 leak case, or OP-A6 audit log tamper case

**Severity:** P0 (regulatory clock starts at the moment of confirmation)

**Immediate action (first 5 minutes):**
1. **Start a clock.** DPDP Act 2023 § 8(6) requires notification "without delay"; consensus interpretation by MeitY guidance is 72 hours from awareness.
2. Log start time + initial impact estimate in `docs/postmortems/breach-YYYY-MM-DD-<slug>.md` (created from template now).
3. Pause any data-export functions that touch the affected dataset.

**Investigation:**
- Determine WHO was accessed (count of data principals, by category).
- Determine WHAT data categories were exposed (phone, address, geo, PAN, KYC photo, etc.).
- Determine HOW (which surface; reference threat-model entry).
- Determine FROM-WHEN to UNTIL-WHEN.
- Preserve audit logs for the affected window (snapshot the audit_log container to Storage append-blob).

**Mitigation:**
- Close the leak surface (per the originating procedure).
- Reset credentials for any data principals whose creds were exposed.

**Recovery — within 72h:**
- Notify the Data Protection Board of India via the specified online portal (URL TBD until DPB sets up; until then, file via written letter to MeitY per § 8(6) interim guidance).
- Notify affected data principals via the channel they registered (FCM + SMS + email if applicable).
- Notification must include: nature of breach, categories of data, approximate count, likely consequences, mitigation steps taken, contact for queries.

**Post-incident:**
- File a copy of the notification in `docs/breach-notifications/YYYY-MM-DD-<slug>.md`.
- Postmortem within 7 days.
- CA + legal counsel review.

**Owner / escalation:** Founder; legal counsel from contact list § 9.

---

### OP-A5: Karnataka Labour Department audit response (1-week notice)

**Trigger:**
- Owner receives formal notice of audit from Karnataka Labour Dept (typically 5-7 days notice for platform-worker compliance)

**Severity:** P1 (regulatory; financial penalty risk)

**Immediate action (first 24 hours):**
1. Acknowledge the notice in writing within 48 hours; cite acknowledgement number.
2. Engage labour counsel from § 9 contact list.
3. Notify CA — they may need to provide concurrent records.

**Preparation (days 2-5):**
- Export the algorithm-transparency document (`docs/dispatch-algorithm.md`) — confirm it still matches `api/src/services/dispatcher.service.ts` ranking logic.
- Run `api/tests/integration/dispatcher-data-isolation.test.ts` and capture green output as evidence that decline-history is not used in dispatch (FR-9.1 / ADR-0011).
- Export from owner admin: technician-population list, decline-rate by technician (for show — not used in dispatch), payout register, welfare-board contribution register.
- Audit log dump for the relevant period: `queryAuditLog({ dateFrom: <quarter-start> })` → CSV.
- Snapshot Cosmos `wallet_ledger` for the relevant period.

**Day-of-audit:**
- Walk auditor through `docs/dispatch-algorithm.md` and the four-layer decline-history isolation (Semgrep + integration test + code comment + ADR).
- Hand over CSVs; do NOT alter live data while audit is in progress (Cosmos at the read endpoint is safe; ensure no migrations are running).

**Post-incident:**
- Capture auditor questions/findings in `docs/audits/karnataka-YYYY-MM-DD.md`.
- Address findings within the auditor's deadline; track in GitHub project `compliance`.

**Owner / escalation:** Labour counsel; CA.

---

### OP-A6: Mass tech deactivation / protest event (UC-style)

**Trigger:**
- INC-9 signals (acceptance rate drops > 30% / day, multiple complaints, social media chatter)
- A coordinated email/letter from a worker collective
- Press inquiry referencing platform workers

**Severity:** P1 (reputational + regulatory — Karnataka Act protections tight)

**Immediate action (first 5 minutes):**
1. **Do NOT** issue any ID block, payout freeze, or dispatch-priority change against named techs (FR-9.1 + Karnataka Act + ADR-0011).
2. Open the audit log for the past 7 days: confirm no decline-history-based dispatcher modifications were merged.
3. Capture social-media + email evidence; freeze a copy in `docs/incidents/protest-YYYY-MM-DD/` for the postmortem.

**Investigation:**
- Pull dispatch logs for the protesting techs: `bookingEventRepo` filtered by `technicianId IN (...)` to confirm dispatch was equitable.
- Pull payout register for the protesting techs: confirm no missed/late payouts.
- Pull rating data: any retaliatory low-rating cluster?

**Mitigation (owner-led, NOT code-led):**
- Owner directly calls top 5-10 protesting techs; offers a 30-min listening session.
- FCM broadcast to `techs_all` topic with transparency: "We are listening, dispatch algorithm is unchanged, here's the public algorithm doc → `<link>`".
- If the grievance is genuine and code-fixable (e.g. payout timing bug, complaint-misclassification): create story + implement urgently (Foundation tier).

**Recovery:**
- Public-facing comms: a single owner-signed note (no PR-speak); link to `docs/dispatch-algorithm.md`.
- If Karnataka Labour Dept escalates: trigger OP-A5.

**Post-incident:**
- Postmortem in `docs/postmortems/`. Include "what would have prevented this" — usually a pre-emptive comms cadence (monthly tech 1:1s — already in §7 quarterly tasks).
- Re-walk threat-model § 4.2.

**Owner / escalation:** Founder leads; labour counsel on standby.

---

### OP-A7: Audit log integrity verification (preventive)

**Trigger:**
- Quarterly cadence
- Any time T-A3 mitigation is deferred and another quarter passes
- Triggered automatically by OP-A1 / OP-A2 (any compromise event)

**Severity:** P2 (preventive)

**Procedure:**
1. Pull the prior quarter's audit_log entries: `queryAuditLog({ dateFrom: <Q-start>, dateTo: <Q-end> })`.
2. Compute SHA-256 over the sorted-by-timestamp concatenation of `(id, action, resourceType, resourceId, timestamp)`.
3. Append the digest + range to `docs/audit-log-digests.md` (append-only file in repo, signed off by owner each quarter).
4. Cross-check current quarter's digest against recomputed digest of past quarters in append-blob storage (once T-A3 is mitigated).

**Investigation (if digests don't match):**
- Compare entry counts.
- Run `SELECT * FROM c WHERE c.id NOT IN (<known-id-list>)` — find injected entries.
- Compare against Sentry breadcrumbs from the affected window.

**Mitigation:**
- Treat any mismatch as P0 → triggers OP-A4 (DPDP) + investigation.

**Owner / escalation:** Founder.

---

### OP-A8: GrowthBook config-server unreachable

**Trigger:**
- GrowthBook Cloud Free SDK fails to fetch feature flags (HTTP timeout or 5xx from `cdn.growthbook.io`)
- Admin-web shows a degraded-mode banner ("Feature flags unavailable — some features may be limited")
- Sentry alert: `GrowthBookFetchFailed` repeated > 3 times in 5 minutes

**Severity:** P2 (non-critical — clients fall back to last cached evaluation; no data is written)

**Immediate action (first 5 minutes):**
1. Check [GrowthBook status](https://status.growthbook.io) — vendor-side outage?
2. In admin-web: degraded-mode banner activates automatically (feature flags fall back to last SDK cache). No bookings are lost. New sessions that have no cache evaluate to default values (flags default to `false`; any gates that default-false are documented in `docs/feature-flags.md`).
3. Mobile apps: GrowthBook React Native SDK caches the last successful fetch to local storage; existing sessions are unaffected.

**Investigation:**
- Confirm `GROWTHBOOK_API_HOST` in Azure Functions app settings is `https://cdn.growthbook.io` (or correct custom host). A misconfigured value would cause persistent failure.
- Confirm `GROWTHBOOK_CLIENT_KEY` is the correct SDK key for the production environment (not staging).

**Mitigation (if outage > 30 minutes):**
- If a critical flag (e.g. `soft_launch_enabled`) must be toggled urgently during a GrowthBook outage, it can be forced via a direct API call to the Functions endpoint (endpoint to be added in a follow-up story — `PUT /api/v1/admin/flags/:name`). Until that endpoint exists, update the Azure Functions app setting `GROWTHBOOK_FALLBACK_FLAGS` with a JSON override and restart the Function App.

**Recovery:**
- Once GrowthBook CDN recovers, the next SDK evaluation cycle (every 60 s in the admin-web implementation) picks up fresh flags automatically. No restart needed.

**Post-incident:**
- If outage exceeded 2 hours, consider adding a local Redis cache or Azure Storage fallback for critical flags.

**Owner / escalation:** GrowthBook OSS community / GitHub issues (self-hosted fallback is always an option — see ADR-0007).

---

### OP-A9: Rotate JWT_SECRET (admin-web)

**Trigger:**
- Routine rotation (every 90 days, calendar reminder)
- Suspected leak (JWT_SECRET visible in logs, screenshots, git history, or a third-party tool)
- Post-incident requirement from OP-A1 / OP-A2

**Severity:** P1 on suspected leak; P2 on routine rotation

**Effect of rotation:** All active admin sessions are immediately invalidated — the owner must re-login after the rotation. There is only one admin account in MVP; this is acceptable.

**Procedure:**

1. Generate a new 32-byte secret:
   ```bash
   openssl rand -hex 32
   ```

2. Update the SWA app setting:
   ```bash
   az staticwebapp appsettings set \
     --name swa-homeservices-admin-prod \
     --resource-group rg-homeservices-prod \
     --setting-names JWT_SECRET="<new-value>"
   ```

3. Trigger a redeployment so the new secret takes effect in the server-side runtime (Static Web Apps picks up new app settings on the next request, but a restart ensures clean state):
   ```bash
   # Redeploy by pushing an empty commit or rerunning the last workflow:
   gh workflow run admin-ship.yml
   ```

4. Verify: open admin-web → you should be redirected to `/login` (old session cookie rejected). Log in — confirms new secret is active.

5. If rotation was due to a suspected leak: audit the admin access log for any sessions in the leak window. Sentry + App Insights → filter `admin` routes by timestamp.

**Post-incident:**
- Document rotation date in `docs/runbooks/key-rotation-log.md` (append-only).

**Owner / escalation:** Founder only.

---

### OP-A10: TLS cert rotation on API custom domain

**Trigger:**
- Azure sends "certificate expiring in 30 days" email (auto-sent by Azure for managed certs)
- Cert expiry alert in Azure Monitor
- Manual rotation following a suspected CA compromise

**Severity:** P1 (expired cert = customer-facing TLS errors; payment flows break)

**Note — managed vs custom cert:**
- If the API custom domain uses an **Azure-managed certificate** (free, recommended): Azure auto-rotates 30 days before expiry. No manual action needed unless the managed-cert service reports an error.
- If using a **custom-uploaded certificate**: follow the procedure below.

**Procedure (custom-uploaded cert):**

1. Obtain the new cert (from your CA, e.g. ZeroSSL free 90-day or Let's Encrypt via Certbot):
   ```bash
   certbot certonly --standalone -d api.homeservices-mvp.in
   # Produces fullchain.pem + privkey.pem
   ```

2. Convert to PFX for Azure:
   ```bash
   openssl pkcs12 -export \
     -out api-cert.pfx \
     -inkey privkey.pem \
     -in fullchain.pem \
     -passout pass:<pfx-password>
   ```

3. Upload to Azure:
   ```bash
   az functionapp config ssl upload \
     --name func-homeservices-prod \
     --resource-group rg-homeservices-prod \
     --certificate-file api-cert.pfx \
     --certificate-password <pfx-password>
   ```

4. Bind the new cert to the custom domain:
   ```bash
   THUMBPRINT=$(az functionapp config ssl list \
     --resource-group rg-homeservices-prod \
     --query "[?subjectName=='api.homeservices-mvp.in'].thumbprint | [0]" -o tsv)
   az functionapp config ssl bind \
     --name func-homeservices-prod \
     --resource-group rg-homeservices-prod \
     --certificate-thumbprint "$THUMBPRINT" \
     --ssl-type SNI
   ```

5. Verify: `curl -I https://api.homeservices-mvp.in/api/health` — expect `HTTP/2 200` and confirm cert details via `openssl s_client -connect api.homeservices-mvp.in:443`.

6. Delete the old cert from Azure Key Vault / Function App after confirming the new cert is serving.

**Owner / escalation:** Azure support (Developer plan, free) for managed-cert issues. Let's Encrypt community for Certbot issues.

---

### OP-A11: Launch checklist tick-through (owner sign-off)

**Trigger:**
- All pre-launch stories are marked Done in the GitHub project board
- Owner is ready to enable `soft_launch_enabled = true`
- Run within 48 hours of the intended go-live

**Severity:** P1 (skipping this gate risks exposing an unconfigured system to real customers)

**Procedure (sequential — do not skip steps):**

1. **Env var audit.** Confirm ALL items in the Launch Checklist table (§ above) are set to production values (not test/staging):
   - `RAZORPAY_KEY_ID` — must start with `rzp_live_` not `rzp_test_`
   - `COSMOS_PAN_ENCRYPTION_KEY` — 32-byte base64 generated at provisioning time; confirm it exists in Azure Key Vault
   - `GROWTHBOOK_CLIENT_KEY` — production SDK key from GrowthBook Cloud console
   - `JWT_SECRET` — confirm last rotation date is ≤ 90 days ago
   - `ADMIN_SETUP_SECRET` — **remove** this after TOTP enrollment (see § 11)

2. **TOTP enrollment.** Owner must have completed TOTP setup (§ 11) and verified a successful admin login.

3. **Smoke test (production URLs):**
   ```bash
   curl https://api.homeservices-mvp.in/api/health       # expect {"status":"ok"}
   curl https://admin.homeservices-mvp.in/                # expect 302 to /login
   ```

4. **GrowthBook sanity.** Log into GrowthBook Cloud → confirm `soft_launch_enabled` is set to `false` (will be toggled on after this checklist).

5. **Sentry sanity.** Open Sentry → confirm zero unresolved issues tagged `production` (or review and close any known-benign ones).

6. **Play Store.** Confirm customer-app and technician-app production APKs are in the `production` track (not just internal/beta).

7. **F&F list.** Prepare the list of 5–10 F&F pilot users who will receive the first booking.

8. **Go-live.** GrowthBook → `soft_launch_enabled` → set to `true`. Send invite to F&F users.

9. **Post-go-live monitoring (first 2 hours):**
   - Sentry: watch for new issues
   - App Insights: confirm error rate < 2%
   - Razorpay Dashboard: first test payment completed and captured
   - Admin-web: first booking appears in live orders

**Owner / escalation:** Founder. No code change should be merged during the 2-hour monitoring window without explicit owner decision.

---

### OP-A12: Rollback an Android release (Play Console halt + roll forward)

**Trigger:**
- Crash rate spike after a staged rollout (Firebase Crashlytics / Sentry spike)
- Customer complaints referencing a specific app version
- Play Console "rate alert" email for the new release

**Severity:** P0 if crash rate > 1% on the new version; P1 otherwise

**Important:** Google Play **does not support binary rollback** (you cannot push an older APK as a higher version code). The correct procedure is:
1. Halt the staged rollout immediately to stop new users getting the bad version.
2. Roll forward with a hotfix that has a higher `versionCode`.

**Procedure:**

1. **Halt the rollout (first 2 minutes):**
   - Open [Play Console](https://play.google.com/console) → the affected app → Release → Production → find the staged rollout → **Halt rollout**.
   - Users who have NOT yet updated are now protected. Users who already updated keep the bad version until the hotfix ships.

2. **Triage.**
   - Firebase Crashlytics → identify the crash signature.
   - Reproduce locally on a device matching the affected device profile.
   - Check if a quick code-fix is available or if a revert of the last merged story is cleaner.

3. **Hotfix branch:**
   ```bash
   git checkout -b hotfix/<short-description> origin/main
   # Apply the targeted fix
   git commit -m "fix: <description>"
   git push origin hotfix/<short-description>
   # Open PR → CI → merge
   ```

4. **Bump `versionCode` in `app/build.gradle.kts`** (increment by 1; `versionName` patch bump, e.g. `1.2.0` → `1.2.1`).

5. **Release via Play Console:**
   - GitHub Actions `release.yml` workflow builds a signed APK on `main` merge.
   - Alternatively, build locally and upload via Play Console → Create new release (upload AAB/APK).
   - Start with a **10% staged rollout** → monitor crash rate for 1 hour → promote to 100% if clean.

6. **Communicate:**
   - FCM broadcast to `all_customers` or `all_technicians` topic: "We've released a fix for an issue affecting some users. Please update the app from the Play Store."

7. **Post-incident:**
   - Postmortem in `docs/postmortems/`.
   - Add a regression test covering the crash scenario.
   - Review whether the pre-release smoke gate (`tools/pre-codex-smoke.sh`) should have caught this.

**Owner / escalation:** Founder. Play Store emergency review (if the hotfix needs expedited review) — contact Google Play developer support.

---

### Cross-references to existing INCs

- **OP-A1** complements **INC-2** (payment failures) — INC-2 is for outage / vendor side; OP-A1 is for compromise / our side.
- **OP-A4** is upstream of every DPDP-relevant incident; INC-1 through INC-7 should escalate here on confirmation of PII exposure.
- **OP-A6** complements **INC-9** — INC-9 is signal detection, OP-A6 is full response procedure.
- **OP-A8** complements the GrowthBook soft-launch flag procedures in § Emergency Rollback — A8 is the vendor outage case; Emergency Rollback is the self-initiated kill-switch.
- **OP-A12** complements § 5 Deploy Procedure → Rollback bullet — A12 is the detailed Play Store-specific flow.
- **DR drill (E10-S04, planned)** — when implemented, this runbook's § 6 should reference the drill cadence enforcement (timer trigger or GitHub Action).

---

**Operational Procedures 2026-04-26 complete. Total new procedures: 7 (OP-A1..A7) + 5 (OP-A8..A12) = 12.**

---

## SOS audio retention (E11-S05b-2)

Encrypted SOS audio blobs are stored in Firebase Storage under `sos-audio/{customerId}/{incidentId}.enc`. A GCS object lifecycle rule deletes all objects in this prefix 7 days after creation, matching the Cosmos `sos_incident_keys` container's `defaultTtl = 604800` seconds.

**One-time setup** (run once per environment against the Firebase Storage bucket):

```bash
gcloud storage buckets update gs://<your-firebase-bucket> \
  --lifecycle-file=infra/firebase/sos-audio-lifecycle.json
```

Substitute `<your-firebase-bucket>` with the bucket name from Firebase Console → Storage → Files (shown in the URL bar, e.g. `homeservices-prod.appspot.com`).

**Verification:**

```bash
gcloud storage buckets describe gs://<your-firebase-bucket> --format="json(lifecycle)"
```

Expected output contains `"age": 7` with `"matchesPrefix": ["sos-audio/"]`.

**Why two TTLs?** The Cosmos key doc TTL (7 days) and the Storage blob lifecycle rule (7 days) are set independently. If a blob outlasts its key doc (e.g. Cosmos TTL fires first due to clock skew), the blob becomes unplayable — this is the safer failure mode. The 7-day window aligns with the maximum incident investigation SLA defined in the threat model (I-A4).

---

## Privacy policy (E20-S07)

**Policy document:** `docs/legal/privacy-policy-technician.md`

**Hosted URL:** `https://aloktiwarigit.github.io/homeheroo-privacy/technician/`

The policy is published automatically by `.github/workflows/gh-pages-legal.yml` on every push to `main` that changes `docs/legal/**`. To republish manually, trigger the workflow from GitHub Actions → "Publish legal docs to GitHub Pages" → Run workflow.

**First-time GitHub Pages setup (one-time, per repo):**
1. Push the `gh-pages-legal.yml` workflow to `main`.
2. In the GitHub repo → Settings → Pages → Source: select "GitHub Actions".
3. The next workflow run will deploy to `https://aloktiwarigit.github.io/<repo-name>/technician/`.

**Play Console:** The privacy policy URL must be entered in Play Console → App content → Privacy policy before submitting to any track (internal testing or production). Use: `https://aloktiwarigit.github.io/homeheroo-privacy/technician/`

**Deletion requests:** Inbound deletion requests arrive at aloktiwari49@gmail.com. Process:
1. Acknowledge within 48 hours.
2. In Firebase Console → Authentication → find user by phone → Delete user.
3. In Firestore → delete all documents under `technicians/{uid}/` and `kyc/{uid}/`.
4. In Firebase Storage → delete all objects under `kyc/{uid}/` and `uploads/{uid}/`.
5. Confirm erasure to the requester within 30 days of the original request.

**Annual review:** Review and update the policy document at least once per year, or whenever a new third-party SDK is integrated that processes PII.

## One-time migrations

### PAN mask backfill (S-001 / E20-S09 — run before pilot launch)

This script scans the `technicians` Cosmos container for records where `kyc.panNumber` is set and `kyc.panMaskedNumber` is null. It is the companion operation to the S-001 fix that removed the `?? kyc.panNumber` plaintext fallback from `GET /v1/kyc/status`.

**When to run:** Once, after the S-001 API fix is deployed to production and before pilot launch. Do not run during peak hours (prefer off-peak maintenance window).

**Prerequisites:**
- `COSMOS_CONNECTION_STRING` or `COSMOS_ENDPOINT` + `COSMOS_KEY` env vars set.
- `COSMOS_DATABASE` env var (defaults to `homeservices`).

**Step 1 — dry run (verify scope, no writes):**
```bash
cd api
pnpm backfill:pan-mask
```

**Step 2 — review the log** output. Expect two categories:
- `[MASK]` — canonical PAN (`ABCDE1234F` shape); script will write `panMaskedNumber = XXXXX1234F` and clear `panNumber`.
- `[ESCALATE]` — non-canonical value (OCR noise, old `####` format); script will clear `panNumber` and set `kycStatus = MANUAL_REVIEW`. Admin must re-collect the PAN via DigiLocker for these technicians.

**Step 3 — apply:**
```bash
pnpm backfill:pan-mask -- --apply
```

**Step 4 — verify** no remaining plaintext PANs:
```sql
SELECT COUNT(1) FROM c
WHERE IS_DEFINED(c.kyc.panNumber)
  AND c.kyc.panNumber != null
  AND (NOT IS_DEFINED(c.kyc.panMaskedNumber) OR c.kyc.panMaskedNumber = null)
```
Expected result: `0`.

**Escalated records:** Search admin dashboard for `kycStatus = MANUAL_REVIEW` technicians and contact them to re-submit their PAN card via DigiLocker before the pilot goes live.

---

## Privacy policy

Hosted at **aloktiwarigit/homeheroo-privacy** (GitHub Pages). Source of truth for all privacy-policy content; the UrbanClap-Dup repo no longer contains policy markdown files.
