# Threat Model — homeservices-mvp (STRIDE)

**Author:** Alok Tiwari + Winston (architect persona)
**Date:** 2026-04-17
**BMAD Phase:** 4.5
**Scope basis:** `docs/architecture.md` §3.1 component diagram
**Frameworks:** STRIDE + DPDP Act 2023 + Karnataka Platform Workers Act 2025

---

## 1. Scope

### 1.1 In scope (trust boundaries + data + entry points)

**Components modeled:**
- Customer Android app (Kotlin + Compose)
- Technician Android app (Kotlin + Compose)
- Owner web admin (Next.js on Azure Static Web Apps)
- API backend (Node + Fastify on Azure Functions Consumption)
- Cosmos DB Serverless (system of record)
- Firebase Cloud Messaging (universal messaging spine)
- Firebase Storage (photos + KYC media)
- Firebase Auth (Phone + Google Sign-In)
- Razorpay + Razorpay Route (payment + payout)
- DigiLocker (Aadhaar verification)
- Google Maps Platform (geocoding, places, directions)
- Azure Form Recognizer (PAN OCR)
- PostHog Cloud (product analytics)
- Sentry (error tracking)
- Azure Application Insights (infra telemetry)
- Azure Key Vault (secrets)
- GitHub Actions (CI + release pipeline)

**Data classifications:**
- **PII (sensitive):** customer phone numbers, addresses, geo-coordinates; technician Aadhaar verification status (tokenised), PAN number, bank account, health insurance enrolment; admin user email + TOTP secret.
- **Financial:** Razorpay order/payment IDs, payout amounts, wallet balances, GST invoice data. **No card numbers ever in our systems (Razorpay PCI scope).**
- **Operational:** booking details, ratings, complaints, audit log, photos of home interiors.
- **Public/semi-public:** service catalogue, technician profile (photo, name, rating, specialties), aggregated city-level stats.

**Entry points / attack surfaces:**
- API endpoints (REST via Azure Functions) — public internet
- Mobile app ↔ API (HTTPS + JWT auth)
- Admin web ↔ API (HTTPS + Firebase Auth token + TOTP)
- Razorpay webhooks (signature-verified public endpoint)
- DigiLocker webhooks (signature-verified public endpoint)
- FCM device registration (Firebase SDK direct)
- Firebase Storage uploads (Firebase SDK direct, rules-enforced)
- GitHub Actions (push + PR triggers)

### 1.2 Out of scope (for this iteration)

- Physical security of technician's device (lost/stolen) — app-level mitigation only (biometric re-auth on sensitive actions)
- Supply-chain attacks on third-party SDKs (Razorpay, Firebase, DigiLocker) — mitigated by pinning SDK versions + Snyk dependency audit in CI
- Insider threats by cloud providers (Azure, Firebase/Google, Razorpay) — accepted risk; mitigated by encryption at rest + minimal data retention
- Social engineering of the owner / admin user — mitigated by TOTP 2FA + strong owner awareness training
- Physical infrastructure (Azure India Central region outage) — documented in runbook DR procedures

---

## 2. Trust Boundaries

```
┌────────────────────────────────────────────────────────────────────┐
│  UNTRUSTED INTERNET                                                │
│                                                                    │
│   ┌─────────────┐     ┌──────────────┐     ┌───────────────┐     │
│   │  Customer   │     │  Technician  │     │  Admin        │     │
│   │  device     │     │  device      │     │  browser      │     │
│   └──────┬──────┘     └───────┬──────┘     └──────┬────────┘     │
│          │  HTTPS              │  HTTPS            │  HTTPS+2FA   │
│ ═════════╪═══════════════════╪═══════════════════╪═══════════════ TRUST BOUNDARY 1
└──────────┼───────────────────┼───────────────────┼───────────────────┘
           │                   │                   │
           ▼                   ▼                   ▼
┌────────────────────────────────────────────────────────────────────┐
│  AZURE FUNCTIONS API BACKEND (trusted compute)                     │
│  - Input validation (Zod)                                          │
│  - JWT signature verification                                      │
│  - Rate limiting                                                   │
│  - RBAC on admin endpoints                                         │
└──────────┬───────────┬───────────┬───────────┬───────────┬─────────┘
           │           │           │           │           │
 ══════════╪═══════════╪═══════════╪═══════════╪═══════════╪═════════ TRUST BOUNDARY 2
           │           │           │           │           │
           ▼           ▼           ▼           ▼           ▼
      ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────────┐
      │ Cosmos │ │  FCM   │ │Razorpay│ │Firebase│ │  DigiLocker │
      │  DB    │ │        │ │        │ │Storage │ │  (govt API) │
      └────────┘ └────────┘ └────────┘ └────────┘ └─────────────┘
      (Azure    (Google)   (RBI-reg    (Google)   (Govt of India)
       India)              payment
                           aggregator)
```

**Key trust boundaries:**

- **TB-1** — Internet → our API. Strictest boundary. All inputs untrusted; validation + auth + rate-limit enforced.
- **TB-2** — Our API → external services. We trust their platform security but verify their callbacks (webhook signatures).
- **TB-3 (implicit)** — Admin device ↔ admin web ↔ API. Requires TOTP 2FA for super-admin.
- **TB-4 (implicit)** — Firebase SDK direct writes (photos, location pings from tech app) ↔ Firebase Storage / Cosmos. Firebase Security Rules enforce per-user write scope.

---

## 3. STRIDE Analysis (per component × threat type)

### 3.1 API Backend (Azure Functions)

| Threat | Component | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| **S**poofing | API endpoints | M | H | Firebase Auth JWT verification on every protected endpoint; OpenAPI-generated client types reduce forgery surface; MSG91/Firebase OTP for phone-claim | Arch |
| **T**ampering | Request/response | L | H | TLS 1.2+ enforced (Azure Functions default); Zod schema validation rejects malformed input; input sanitisation for HTML/SQL (no direct SQL, Cosmos query safe-builder) | Arch |
| **R**epudiation | Admin actions (override, refund, deactivate) | L | H | FR-7.4 + NFR-S-6: immutable append-only audit log with admin-ID + IP + reason-code; Cosmos policy blocks update/delete on `audit_log` collection | PM |
| **I**nformation disclosure | Over-fetching, IDOR on GET /bookings/{id} | M | H | Authorization middleware: caller must own booking (customer), be assigned to it (tech), or have admin role; integration tests enforce; monthly Semgrep + manual review | Arch |
| **D**enial of service | API flood | M | M | NFR-S-10 rate limits (Auth 10/min, Booking 30/min, Global 1000/min per IP); Azure Front Door (Phase 2) can front for WAF rules; Functions Consumption auto-scales | Ops |
| **E**levation of privilege | Role-claim forgery | L | H | Role in custom claim on Firebase Auth token, signed; verified on every admin endpoint; force-2FA on super-admin; short access-token life (15 min) with refresh flow | Arch |

### 3.2 Customer + Technician Android Apps

| Threat | Component | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| **S**poofing | Someone using victim's phone | M | M | Biometric re-auth on sensitive actions (payment, payout cadence, profile deletion); device-bound refresh tokens; 180-day expiry; re-OTP on suspicious login pattern | Arch |
| **T**ampering | Client-side state manipulation (faking booking status to unlock payment) | M | H | All state transitions validated server-side; Zod schemas reject invalid transitions; no business logic trusted from client | Arch |
| **R**epudiation | Customer claims "I didn't authorise this add-on" | M | M | FR-2.2 explicit per-add-on approval UI + server-side timestamp + signed client action; tech-side photo upload tied to state transitions (timestamp + location proof) | PM |
| **I**nformation disclosure | Device compromise reveals cached data (recent bookings, addresses) | M | M | Android Keystore for auth tokens; EncryptedSharedPreferences for PII; photos stored only in Firebase Storage (not locally beyond cache); logs redact PII | Arch |
| **D**enial of service | Malicious user creates 1000 bookings | L | M | Per-customer rate limit (30 bookings/day max); payment required upfront (prevents freeloading); admin blacklist (FR-7.3) | Arch |
| **E**levation of privilege | Decompiled APK shows hard-coded keys | M | H | ProGuard/R8 enforced; no sensitive secrets in app (Firebase config keys are public by design; secret operations go through API); Semgrep + Snyk scanning | Arch |

### 3.3 Owner Web Admin

| Threat | Component | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| **S**poofing | Admin impersonation | L | **Critical** | Email/password + mandatory TOTP 2FA for super-admin; Firebase Auth; 30-min session timeout; IP allow-list option (Phase 2) | Arch |
| **T**ampering | CSRF / session fixation | L | H | Firebase Auth SDK handles token refresh; SameSite=Strict cookies; all state-changing calls via API with JWT | Arch |
| **R**epudiation | "I didn't make that payout approval" | L | H | Every admin action → audit_log (immutable); monthly owner review; TOTP ensures it's really them | PM |
| **I**nformation disclosure | XSS leaking session token | L | H | Next.js JSX auto-escapes; CSP headers strict; no innerHTML in React; Semgrep + axe-core in CI | Arch |
| **D**enial of service | Admin page load flood | L | L | Azure Static Web Apps CDN absorbs; API backend rate-limited | Ops |
| **E**levation of privilege | Role escalation via API | L | **Critical** | Role claim on token only modifiable by super-admin via explicit admin-user-management endpoint; that endpoint requires TOTP re-auth; change written to audit log | Arch |

### 3.4 Cosmos DB

| Threat | Component | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| **S**poofing | Stolen Cosmos key | L | **Critical** | Keys never in code; Azure Key Vault + Managed Identity; periodic key rotation (quarterly); access restricted to API Function's Managed Identity | Ops |
| **T**ampering | Data corruption via compromised Function | L | H | Cosmos built-in at-rest encryption; every write goes through Function with Zod validation; append-only collections (audit_log, booking_events) use Cosmos stored procedure policy | Arch |
| **R**epudiation | "Cosmos dropped the write" | L | M | Cosmos has 99.99% write-durability SLA; every write returns _etag; client retries on network errors | Arch |
| **I**nformation disclosure | Over-broad query exposing PII | M | H | Query patterns reviewed; `select * from c` banned; column-level projections per endpoint; PII never logged | Arch |
| **D**enial of service | RU/s exhaustion via hot partition | M | M | Partition key choices (per ADR-0003) spread load; alerts at 70% / 85% of 1000 RU/s; serverless auto-throttles (returns 429) which API handles gracefully | Arch |
| **E**levation of privilege | SQL-injection-like query manipulation | L | H | No string concatenation for queries; always parameterized via SDK; Semgrep rules catch violations | Arch |

### 3.5 Firebase (Auth + Storage + FCM)

| Threat | Component | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| **S**poofing | Fake FCM device token registration | L | M | Device tokens tied to authenticated user on server; unauthorized tokens rejected at push time | Arch |
| **T**ampering | Tampered Firebase Storage photo (e.g., fake "after" photo) | M | M | Firebase Storage rules allow write only by authenticated tech during active job; client sends photo with booking-id in path; server verifies photo metadata + timestamp | Arch |
| **R**epudiation | Tech claims "I didn't get the FCM" | L | L | FCM delivery receipts tracked in PostHog; we can show attempted delivery + ACK status | Ops |
| **I**nformation disclosure | Unauthorised photo read | L | M | Firebase Storage rules: customer can read their booking's photos, tech can read their own job photos, admin can read all; rules tested | Arch |
| **D**enial of service | FCM spam | L | L | FCM's own abuse protection; our server-side rate limits on push-send endpoint | Google/Ops |
| **E**levation of privilege | Firebase Auth custom-claim tampering | L | H | Custom claims signed by server; JWT verification validates signature; Firebase Auth handles this natively | Arch |

### 3.6 Razorpay Integration (webhooks + Route)

| Threat | Component | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| **S**poofing | Fake Razorpay webhook | M | **Critical** | HMAC signature verification on every webhook; `X-Razorpay-Signature` validated against webhook secret in Key Vault; invalid signatures → 400 + logged as security event | Arch |
| **T**ampering | Payment amount tampering | L | **Critical** | Razorpay webhook payload contains signed amount; we never trust client-reported amount; reconciliation job compares Razorpay's record with our Cosmos record daily | Arch |
| **R**epudiation | Razorpay says "we never sent webhook" | L | M | All webhook attempts logged at API layer with raw payload + signature + timestamp; Razorpay dashboard also records; reconcile monthly | Ops |
| **I**nformation disclosure | Payment metadata leak | L | M | Razorpay SDK tokenises card info — we never see it; payment IDs are safe to log | Arch |
| **D**enial of service | Webhook flood | L | L | Rate limits + webhook endpoint at scale (Razorpay sends retries with exponential backoff anyway) | Ops |
| **E**levation of privilege | Compromised Razorpay key → mass payout | L | **Critical** | Razorpay keys in Key Vault, rotated on suspicious activity; API Function has only the minimum Razorpay scope needed (no admin scope); payout amount > ₹50k requires owner manual approval (O-14 weekly payout queue); Razorpay Route transfers capped per tech/week | Ops |

### 3.7 DigiLocker Integration

| Threat | Component | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| **S**poofing | Fake DigiLocker callback | L | H | HMAC signature verification + DigiLocker's OAuth2 flow with PKCE | Arch |
| **T**ampering | Tech claims fake Aadhaar | L | **Critical** | DigiLocker's verification is government-backed; we store only the tokenised verification result (status + hash + timestamp), never the Aadhaar number; if DigiLocker's verification is wrong, that's a government-level failure we cannot prevent | Govt |
| **R**epudiation | DigiLocker logs dispute | L | L | Both sides log the OAuth flow; DigiLocker retains records | Govt |
| **I**nformation disclosure | **Aadhaar number leak** | L | **Critical** | **We never store the Aadhaar number.** Only the tokenised "verified" status. This is architectural — the data simply isn't in our database. Semgrep rule + code review bans Aadhaar-shaped 12-digit string patterns in any write path. | Arch |
| **D**enial of service | DigiLocker downtime | M | M | Tech onboarding temporarily halted; can resume when DigiLocker recovers. Manual fallback for urgent tech adds. | Ops |
| **E**levation of privilege | Compromised DigiLocker key | L | M | Key in Key Vault; only onboarding function has access | Ops |

---

## 4. Compliance Threats (specific to this domain)

### 4.1 DPDP Act 2023

| Threat | Mitigation |
|---|---|
| **Processing without consent** | Consent screens with granular purposes for each data collection (NFR-C-5); consent record stored per user |
| **Data breach — no 72-hour notification** | Runbook has breach-notification workflow; PostHog + Sentry alerts on anomaly; annual breach-response drill |
| **Data retention beyond necessity** | OQ-16: 2 years active + 5 years archived; automated archival job deletes older data from hot collections |
| **Right-to-access / right-to-delete not honoured** | FR (Phase 2) — customer profile action submits a DPDP-request; admin SLA 30 days; audit log records the request + action |
| **Cross-border data transfer** | Zero cross-border: all data in Azure India Central + Firebase Asia-South1 |

### 4.2 Karnataka Platform Workers Act 2025

| Threat | Mitigation |
|---|---|
| **Declining a job penalises ranking** | ADR-0006: architecturally enforced + CI-tested |
| **Opaque algorithm → protest catalyst** | Algorithm features published to regulators on request; FR-5.1 shows tech "why you got this"; transparent ranking formula |
| **Welfare board contributions missed** | Quarterly cron calculates + remits; owner regulatory dashboard tracks |
| **ID blocking without due process** | FR-7.3 requires reason-code; audit log; tech can appeal (T-23) |

### 4.3 Central SSC Code 2025

| Threat | Mitigation |
|---|---|
| **Aggregator levy not remitted** | Quarterly Azure Function timer trigger auto-calculates 1-2% of GMV + initiates transfer via Razorpay payout; confirmation logged in audit |
| **Under-reporting GMV to reduce levy** | Reconciliation between Razorpay's records and Cosmos bookings daily; discrepancies flagged |

---

## 5. Accepted Risks

| Risk | Why accepted | Reference |
|---|---|---|
| 1-2 second cold-start latency on rarely-used API endpoints | Inherent to Azure Functions Consumption; gain free-tier > cost of occasional slow first-hit | ADR-0004 |
| FCM delivery p95 < 5 seconds (not sub-second) | WebSocket alternative costs ₹5-10k+/mo, violating ₹0 constraint | ADR-0002 |
| Third-party outages (Razorpay, DigiLocker, Firebase) | Our architecture can't prevent their downtime; runbook documents response | Runbook |
| No active paid security monitoring (no Datadog, no Wiz) | Free tiers of Sentry + Semgrep + Snyk sufficient at MVP scale | ADR-0007 |
| Admin 30-min session timeout might annoy the owner | Security > convenience on admin side; owner is a single user and can adapt | NFR-S-8 |
| 180-day refresh-token life for customers/techs | Lost-device risk exists but is mitigated by biometric re-auth on sensitive ops | ADR-0005 |

---

## 6. Residual Risks (monitored, not yet fully mitigated)

| Risk | Plan |
|---|---|
| Supply-chain attack on a trusted SDK (Razorpay, Firebase, Truecaller) | Monthly Snyk audit; pin versions; monitor CVE feeds; Phase 2 adds SBOM generation to CI |
| Owner account compromise (phishing/social engineering) | TOTP in place; Phase 2 adds Azure AD Conditional Access + IP allow-list |
| DDoS from a determined attacker (> rate-limit can absorb) | Phase 2 adds Azure Front Door + WAF rules (paid ~₹15k/mo — ADR required) |
| Insider threat by a future support agent | Phase 2 adds audit-log-alerting on suspicious admin patterns; role separation for support (cannot view finance) |
| Zero-day in Android / Kotlin / Jetpack Compose | OS-level risks outside our control; mobile app auto-updates via Play Store help |

---

## 7. Review Cadence

- **Quarterly:** re-run STRIDE over any new components added (Phase 2 features will add subscription, Native products, etc.)
- **Per-release:** Codex review + bmad-code-review Blind Hunter check for new attack surface
- **Annual (from Phase 2):** external penetration test (NFR-S-11) — engage vendor ~₹1-2 lakh one-time (budget separate from operational)
- **Post-incident:** any security incident triggers immediate threat-model review for the affected component

---

**Threat model v1.0 complete.** Operational response guided by `docs/runbook.md`.

---

## Addendum 2026-04-26

**Author:** Alok Tiwari (audit pass)
**Trigger:** ~30 stories landed since v1.0 (E02–E10). New surfaces: FCM topic-based messaging, Razorpay webhook + Razorpay Route, admin TOTP, Cosmos cross-partition queries on hot paths, Karnataka decline-history isolation, rating shield escalation, audit-log container, KYC PAN persistence.
**Method:** Re-walked STRIDE per surface against actual code paths. Out-of-code surfaces (e.g. customer block list, evidence-URL uploads) are NOT included — code search showed they are unimplemented at audit time and so cannot have residual risk yet.

Convention for `Status` column: `mitigated` | `partial` | `not-yet-mitigated` | `accepted`.

### A.1 Spoofing

| # | Threat | Code path | Likelihood | Impact | Mitigation | Residual risk | Status |
|---|---|---|---|---|---|---|---|
| S-A1 | **FCM topic eavesdropping** — `customer_<uid>`, `technician_<uid>`, `owner_alerts` are predictable. FCM SDK on any authenticated device can `subscribeToTopic`; topic ACLs are not enforced by Firebase. | `api/src/services/fcm.service.ts:5,15,43,58,91,107`; client subscribers in `technician-app/.../FcmTopicSubscriber.kt` | 2 | 2 (**E11-S05b-2**: SOS FCM payload trimmed to opaque IDs only — `slotAddress` removed; earnings/rating-shield remain on topic but carry no new PII) | Move non-SOS sensitive payloads off topic for full mitigation. SOS path is now mitigated. | Medium (non-SOS topics remain) | partial (SOS: mitigated via E11-S05b-2) |
| S-A2 | **Inconsistent FCM topic prefix** — dispatcher publishes to `tech_<uid>` (`job-offers.ts:74`) while rating/earnings publish to `technician_<uid>` (`fcm.service.ts:15`). A migration that consolidates one without the other risks orphaned subscriptions or duplicate sends. | `api/src/functions/job-offers.ts:74` vs `api/src/services/fcm.service.ts:15` | 3 | 2 | Pick one prefix; emit a Semgrep rule banning the other. | Low; cosmetic risk plus delivery gap | not-yet-mitigated |
| S-A3 | **Cross-provider auth-token confusion at admin boundary** — admin login accepts any valid Firebase ID token whose `uid` matches an `adminUser` row (`login.ts:42-50`). A customer or technician whose Firebase UID happens to collide with a (deleted, deactivated, but re-created) admin row would authenticate as admin. Currently `adminUsers.id` is the Firebase UID, so an attacker who can provision their own Firebase account with a chosen UID cannot collide — but Google Identity Platform's UID is server-generated, so this is a defence by Firebase property, not code. | `api/src/functions/admin/auth/login.ts:42-50` | 1 | 5 | Add explicit `provider === 'password'` (or whatever admin-provider claim) check on the decoded ID token; reject Phone-Auth/Truecaller/Google-Sign-In tokens at the admin boundary. | Medium; depends on Firebase provider claim | not-yet-mitigated |

### A.2 Tampering

| # | Threat | Code path | Likelihood | Impact | Mitigation | Residual risk | Status |
|---|---|---|---|---|---|---|---|
| T-A1 | **Razorpay webhook signature verification uses non-constant-time string compare** — `expected !== signature` leaks per-byte timing. Network jitter masks most of this, but a sufficiently fast adversary on the same Azure region could mount a timing oracle. | `api/src/functions/webhooks.ts:17` | 1 | 5 | Replace with `crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))` after length check. Two-line fix. | Low until automated | not-yet-mitigated |
| T-A2 | **Razorpay webhook replay** — no event-ID dedup, no timestamp-window check. `payment.captured` is idempotent thanks to `booking.status === 'PAID'` short-circuit (`webhooks.ts:45`), so replaying the same captured event is safe. But future events (`payment.failed`, `refund.processed`, `transfer.processed`) have no replay defence; today they are silently 200-ack'd at line 33-34, so replay is a no-op. The day a new event is wired, replay risk reappears unless we add a webhook_event_id store. | `api/src/functions/webhooks.ts:33-34, 45-47` | 2 | 4 | Add a `webhook_events` Cosmos container keyed by `parsed.payload.payment.entity.id` (or Razorpay `x-razorpay-event-id` header if available) with a 7-day TTL; reject duplicates. | Low today, escalates as more events are handled | not-yet-mitigated |
| T-A3 | **Audit-log mutation/deletion via direct Cosmos access** — the `audit_log` container is conventionally append-only via `auditLog.service.ts → appendAuditEntry → items.create`, but Cosmos has no container-level append-only constraint enforced. An attacker with the Cosmos connection string (or a future Function with overbroad RBAC) could `replace` or `delete` audit entries. The threat-model v1.0 §3.4 claims "Cosmos policy blocks update/delete on audit_log collection" but no such policy exists in code or `setup-cosmos.ts`. | `api/src/cosmos/audit-log-repository.ts:8-10`; absence in `api/scripts/setup-cosmos.ts` | 2 | 5 (regulatory audit invalidated) | Either (a) move audit-log to Azure Storage append-blob (true append-only), or (b) rotate Cosmos write keys to a separate Managed Identity scoped only to the `audit_log` container with create-only RBAC, or (c) add a daily integrity-check job that hashes the prior day's audit entries and stores the digest in a separate location. | High — represented as mitigated in v1.0 but is not | not-yet-mitigated |

### A.3 Repudiation

| # | Threat | Code path | Likelihood | Impact | Mitigation | Residual risk | Status |
|---|---|---|---|---|---|---|---|
| R-A1 | **Tech denying decline** — architecturally handled. Per ADR-0011 + Karnataka Act, declines do NOT influence dispatch ranking, and decline events are append-only `bookingEventRepo.append({event: 'TECH_DECLINED', ...})` in `job-offers.ts:64`. The tech cannot be penalised, so denying a decline has no business consequence. Repudiation surface is therefore moot by design. | `api/src/functions/job-offers.ts:50-67`; `api/.semgrep.yml` rule `karnataka-no-decline-in-dispatcher` | 1 | 1 | Already mitigated by FR-9.1 / ADR-0011 — design choice, not a control. | None | mitigated |
| R-A2 | **Owner denying override** — depends entirely on audit-log integrity (T-A3). If T-A3 is unmitigated, owner override repudiation is also unmitigated. | `api/src/functions/admin/orders/overrides.ts` (writes audit entry) | 1 | 4 | Resolve T-A3. | Tied to T-A3 | partial |

### A.4 Information disclosure

| # | Threat | Code path | Likelihood | Impact | Mitigation | Residual risk | Status |
|---|---|---|---|---|---|---|---|
| I-A1 | **PAN number persisted in cleartext** — `panNumber` on the technician KYC sub-doc is stored as a plain string in Cosmos (`schemas/kyc.ts:13`, written by `cosmos/technician-repository.ts:28`). Cosmos at-rest encryption protects against disk-level theft, but any read of the document — by any of our Functions, by a stolen connection string, by a future support-role admin — exposes the PAN. | `api/src/schemas/kyc.ts:13`, `api/src/cosmos/technician-repository.ts:28-29`, `api/src/services/formRecognizer.service.ts:25` | 2 | 4 (DPDP Act sensitive personal data) | Apply Cosmos client-side encryption for the `kyc.panNumber` property (Always Encrypted) OR persist only `panMaskedNumber` (last 4 digits) plus a SHA-256 hash for matching, and discard the raw value after Form Recognizer extraction. Audit any code path that calls `getKycByTechnicianId`. | High under DPDP — the data is in our DB without column encryption | not-yet-mitigated |
| I-A2 | **FCM topic payload PII leak** — `sendOwnerSosAlert` previously published `slotAddress` to topic `owner_alerts`. **E11-S05b-2**: `slotAddress` removed; payload now contains only opaque IDs (`bookingId`, `customerId`, `technicianId`, `incidentId`). Same applies to `customer_<uid>` (booking IDs, rating prompts) and `technician_<uid>` (earnings, rating drafts). | `api/src/services/fcm.service.ts` (sendOwnerSosAlert — updated); `api/src/services/device-token.service.ts` (E19-S02) | 2 | 2 | SOS path mitigated by E11-S05b-2 (payload trim). **Mitigated by E19-S02**: switched all PII-bearing FCM sends to device-token unicast — `customer_<uid>` and `technician_<uid>` topics retired; sends go to enrolled device tokens only. Non-PII opt-in topics retained (ADR-0026). | Low — unicast eliminates subscriber eavesdrop surface; residual only if device token store is compromised (separate threat) | mitigated (E19-S02) |
| I-A3 | **Cross-partition data exposure via unbounded queries** — `getRepeatOffenders`, `getOverdueComplaints`, `findRatingShieldEscalation`, `queryAuditLog`, `queryComplaints` execute without an explicit `partitionKey` option, i.e. Cosmos performs cross-partition fan-out. Today this is bounded by the calling RBAC layer (admin only, customer only on their own bookingId). The risk is not raw exposure but query construction: a future endpoint that forwards user-controlled filters into one of these helpers, without first checking the caller's claim, exposes other partitions' data. | `api/src/cosmos/complaints-repository.ts:80-95, 109-127, 130-155, 161-173`; `api/src/cosmos/audit-log-repository.ts:43-65` | 2 | 4 | E19-S03: (1) Semgrep ERROR rule `no-user-controlled-cosmos-query` blocks template-literal interpolation into Cosmos query strings; (2) Semgrep WARNING rule `cross-partition-query-must-have-tenant-filter` annotates all cross-partition helpers; (3) static coverage test asserts every caller of a flagged helper imports an approved auth middleware. All 9 cross-partition helpers carry `// SEMGREP-JUSTIFIED:` comments. See docs/adr/0027-cross-partition-query-guardrails.md. | Guard rails in place (E19-S03) | mitigated |
| I-A4 | **Firebase Storage signed URL TTL is 15 min and unconstrained by IP/UA** — `getSignedUrl` issues a 15-minute presigned read URL on `firebase/admin.ts:6-9`. If the URL leaks (browser history, Sentry breadcrumbs, support chat), anyone with the URL can read the file for 15 minutes. KYC and evidence reads route through this. | `api/src/firebase/admin.ts:6-9` | 2 | 3 | Tighten TTL to 60–120 s where the consumer is server-side; keep 15 min for direct-download UX. Redact signed-URL strings from Sentry breadcrumbs. E17-S01 (2026-05-17): `GET /v1/bookings/{id}` photo and report signed URLs now use 5-min TTL (300 s) via `getStorageDownloadUrlWithTtl`. Signed URL values are never passed to Sentry structured fields (`[redacted-signed-url]` in breadcrumbs). 15-min TTL retained on KYC (`extractPanFromStoragePath`) and orders (`orders-repository.ts:toPhotoUrl`) paths — tracked for future hardening story. | Medium | partial (bookings-GET: mitigated) |
| I-A5 | **SOS audio key doc in Cosmos (E11-S05b-2)** — `sos_incident_keys` container holds per-incident AES-256 keys. Cosmos default at-rest encryption protects against disk-level theft, but a compromised admin credential with `ops-manager` or `super-admin` role can retrieve the key via `GET /v1/admin/sos/{incidentId}/playback-token`. Combined with the Firebase Storage blob, plaintext audio is recoverable. | `api/src/cosmos/sos-incident-key-repository.ts`, `api/src/functions/admin/sos/playback-token.ts` | 2 | 3 | Mitigations: (1) Cosmos at-rest encryption; (2) admin-only read API gated by TOTP-fresh session within 5 min; (3) 7-day TTL on both blob and key doc; (4) audit log `SOS_PLAYBACK_TOKEN_ISSUED` with `adminId` — review weekly for unusual patterns. Residual risk: compromised admin account during the 7-day window. | Medium | mitigated (E11-S05b-2) |

### A.5 Denial of service

| # | Threat | Code path | Likelihood | Impact | Mitigation | Residual risk | Status |
|---|---|---|---|---|---|---|---|
| D-A1 | **RU exhaustion via cross-partition full-scan queries** — multiple admin-facing helpers (`getRepeatOffenders`, `queryComplaints` without `assigneeAdminId`, `queryAuditLog` without filters, `findRatingShieldEscalation`) fan out across partitions. On 1000 RU/s serverless, a single broad admin query can throttle the cluster for the duration of its scan, returning 429 to live customer-app traffic. | `api/src/cosmos/complaints-repository.ts:130-155, 109-127`; `api/src/cosmos/audit-log-repository.ts:43-65` | 3 | 3 | (a) Cap admin query page-size at 50 (already partly done — `pageSize.default(50).transform(v => Math.min(v, 200))`); (b) add a `dateFrom` floor enforced by middleware for any admin list endpoint; (c) add a separate read-region or move admin reads to a serverless mirror via change-feed (Phase 2). | Medium under load | partial |
| D-A2 | **FCM topic flood** — anyone with a Firebase ID token can publish to a topic IF they hold a server-side admin SDK. Customers/techs cannot, so this collapses to "compromised API server" which is its own threat. The dispatcher's per-attempt fan-out is limited to TOP_N=3 (`dispatcher.service.ts:13`) so it does not itself self-DoS. | `api/src/services/dispatcher.service.ts:13, 70-92` | 1 | 2 | None additional needed. | Low | mitigated |
| D-L1 | **Location-endpoint flood / replay** — a rogue tech client (or a captured tech auth token) pushes rapid-fire or replayed location updates to `POST /v1/technicians/active-job/{bookingId}/location`, exhausting Cosmos RUs for the `live_locations` container and/or injecting stale/fake coordinates into the customer's live-tracking pin. | `api/src/functions/active-job-location.ts` | 2 | 3 | **Mitigated by E17-S02 (ADR-0019):** (a) token-bucket rate limit `1 req/15 s per bookingId` via `withRateLimit keyExtractor`; (b) `capturedAt` freshness guard (±90 s window rejects replays); (c) assigned-tech-only 403 + booking-status 409 gates; (d) `attestation.isMock` flag logged to Sentry for investigation. Cosmos TTL=3600 s caps container growth. | Low — residual: a determined attacker with the assigned tech's live token can still push spoofed coordinates up to 4/min; hardware attestation (Play Integrity) on the location path is a Phase 2 hardening. | mitigated (E17-S02) |

### A.6 Elevation of privilege

| # | Threat | Code path | Likelihood | Impact | Mitigation | Residual risk | Status |
|---|---|---|---|---|---|---|---|
| E-A1 | **TOTP-setup TOFU race** — `adminLogin` issues a `setupToken` (JWT, server-signed) to ANY caller whose Firebase ID token resolves to an `adminUser` row that has `totpEnrolled: false` (`login.ts:53-56`). The first party to enroll TOTP "wins" the admin account. If an attacker exfiltrates a Firebase ID token for an admin who has not yet completed first-time setup (e.g. owner has signed up but not finished TOTP step), the attacker can race to `setupTotpPostHandler` and lock the legitimate owner out. | `api/src/functions/admin/auth/login.ts:53-56`; `api/src/functions/admin/auth/setup-totp.ts:53-92` | 2 | 5 | (a) Constrain `setupToken` lifetime to 10 minutes and bind it to the admin's IP/UA, OR (b) require an out-of-band confirmation email link before the setup endpoint accepts a TOTP submission, OR (c) provision admins with TOTP pre-shared secret distributed by the owner offline. | High during onboarding window only | not-yet-mitigated |
| E-A2 | **Admin role inheritance not locked** — threat-model v1.0 §3.3 asserts "Role claim on token only modifiable by super-admin via explicit admin-user-management endpoint" but the codebase's `adminUser.service.updateAdminUser` does not enforce caller-role checks at the service layer; only the calling Function (currently only `setup-totp`) does. A future endpoint that reuses `updateAdminUser({role: ...})` without role-guard will silently allow privilege escalation. | `api/src/services/adminUser.service.ts` (lacks caller-aware role write guard) | 2 | 5 | Refactor `updateAdminUser` to accept an `actorRole` argument and refuse `role` writes unless `actorRole === 'super-admin'`. Add Semgrep rule banning `updateAdminUser({role:` outside an explicit role-management Function. | High once the next admin-mgmt endpoint lands | not-yet-mitigated |
| E-A3 | **Stolen Firebase ID token impersonates customer/tech across endpoints** — Firebase ID tokens are bearer credentials with 1-hour life; refresh tokens last 180 days (per ADR-0005). If a token is stolen (device compromise, malicious lib, MITM on a captive WiFi without HSTS preload), attacker has 1h of impersonation and 180d of refresh capability. There is no per-device-bound refresh proof. | `api/src/services/firebaseAdmin.ts` (verifyFirebaseIdToken consumers) | 2 | 4 | Bind refresh-token validity to a device-id claim on first sign-in; rotate refresh on any IP/UA change. Trade-off: occasional re-OTP for legitimate users on roaming networks. Defer to E10-S04+ as a hardening epic. | Medium — accepted for MVP per ADR-0005 but flag for re-review at Phase 2 | accepted (re-review Phase 2) |

### A.7 Karnataka decline-history isolation — defence-in-depth verification

The four-layer protection landed in commit `f52e6ca` (E10-S01) — Semgrep rule (`api/.semgrep.yml:15-39`), runtime integration test (`api/tests/integration/dispatcher-data-isolation.test.ts`), code-comment in dispatcher (`dispatcher.service.ts:28`), and ADR-0011. **No new threat surface added** by this story — but flag for quarterly re-walk that all four layers stay in lockstep when dispatcher.service.ts is modified.

### A.8 Re-walk findings — items already mitigated, no action needed

- **Rating-shield 2-hour timer manipulation** — server computes `expiresAt = now.getTime() + 2 * 60 * 60 * 1000` (`rating-escalate.ts:58`). Timer is server-authoritative; no client knob exists. The comment at `ratings.ts:44-47` confirms the shield is advisory and never blocks rating submission, so manipulating the timer does not gate any business action. Mitigated by design.
- **Customer block list race condition** — code search shows no block-list / blacklist implementation at audit time. Reported in PRD §FR-7.3 + threat-model §3.2 D row but not yet built. **No threat surface yet.** Add to threat model on the story that introduces it.
- **Evidence URL uploads in shield/appeals** — `ComplaintDocSchema` has no `evidenceUrls` field; `EscalateRatingBodySchema` accepts only `draftOverall + draftComment`. **No threat surface yet.**

---

**Addendum 2026-04-26 complete. Total new STRIDE entries: 16 (S:3, T:3, R:2, I:4, D:2, E:3, plus design-mitigated re-walks).**

---

## Addendum 2026-05-12 — E16-S01 Service-Area Polygon Gating

**Author:** Alok Tiwari + Claude (architect persona)
**Trigger:** E16-S01 landed server-side Turf.js polygon gating in `POST /v1/bookings`. New attack surface: client-spoofed geographic coordinates.

Convention for `Status` column: `mitigated` | `partial` | `not-yet-mitigated` | `accepted`.

### New Threat: Booking Input Tampering (Geographic Bypass)

| # | Threat | Code path | Likelihood | Impact | Mitigation | Residual risk | Status |
|---|---|---|---|---|---|---|---|
| **T-B1** | **Service-area bypass via client-spoofed lat/lng** — A customer outside the Ayodhya pilot area submits `addressLatLng: { lat: 26.7958, lng: 82.1947 }` (Ramkot coordinates) in `POST /v1/bookings` while physically located in Delhi or abroad. The booking is accepted and dispatched to a technician in Ayodhya who cannot reach the customer. Repeated systematic attempts (recon pattern) indicate the attacker is probing the polygon boundary or enumerating valid coordinates. | `api/src/functions/bookings.ts` — `isLatLngInServiceArea()` check + GrowthBook flag `customer.service-area-gating.enabled`; `api/src/schemas/booking.ts` — `LatLngSchema` with `lat.min(-90).max(90)` + `lng.min(-180).max(180)` range guard | M (3) | M-H (3) — wasted dispatch capacity, failed bookings, tech-side frustration; H if systematic booking fraud | **Server-side Turf.js polygon check** in `POST /v1/bookings` using `@turf/boolean-point-in-polygon` against 25 km Ayodhya polygon. Out-of-range coords rejected at Zod layer (422); out-of-polygon coords rejected at service layer (400 `SERVICE_NOT_AVAILABLE_AT_LOCATION`) when flag `customer.service-area-gating.enabled = true`. Structured log `service_area_check { inside, mode }` always emitted. **Alert trigger:** >5 rejections/min/customer → recon signal. ADR-0020. | Medium — no phone-home API to verify physical device location; a determined attacker with knowledge of the polygon can always spoof a valid inside-polygon coordinate. Mitigated post-soft-launch by cross-checking address against confirmed tech locations (Phase 2). | mitigated (server-side; AC-5 also mitigates out-of-range spoofing via Zod) |

**Addendum 2026-05-12 complete. New STRIDE entry: T-B1 (Tampering).**

---

## Addendum 2026-05-12 — E13-S01 Customer Wallet Credit (S-W1)

**Author:** Alok Tiwari + Claude Sonnet 4.6 (architect persona)  
**Trigger:** E13-S01 introduced customer wallet credit API (`GET /v1/wallet/balance`, `GET /v1/wallet/ledger`, `applyCredit` on `POST /v1/bookings`). New attack surface: credit replay, negative balance exploit, concurrent double-spend.

Convention for `Status` column: `mitigated` | `partial` | `not-yet-mitigated` | `accepted`.

### New Threats: Wallet Credit Fraud

| # | Threat | Code path | Likelihood | Impact | Mitigation | Residual risk | Status |
|---|---|---|---|---|---|---|---|
| **S-W1a** | **Credit replay attack** — A customer captures a successful `POST /v1/bookings` request with `applyCredit: true` and the same `Idempotency-Key` header and replays it within 24h to apply the same credit to a second booking. | `api/src/functions/bookings.ts` → `attemptCreditApplication()` → `customerCreditLedgerRepo.applyCredit()` → reads `applied_credit_idempotency` container | M (3) — any customer with API-level access | H (4) — free bookings at platform cost | **Idempotency-key dedup:** On `applyCredit`, the server reads the `applied_credit_idempotency` container (partitioned by `/customerId`, TTL 24h) keyed by the client-supplied UUID. If the key exists, the stored `appliedAmountInPaise` is returned without writing a new ledger entry. The idempotency doc is written atomically after the ledger entry — a Cosmos 409 on the dedup write is safe (another concurrent winner already wrote it). See ADR-0017 §4. | Low — an attacker who uses a *different* UUID per replay bypasses key dedup; mitigated by S-W1c (balance-recompute-on-read prevents spending more than earned) | mitigated |
| **S-W1b** | **Negative balance exploit** — A race between two concurrent `applyCredit` requests or a ledger-manipulation attempt causes the customer's effective balance to go below zero, allowing bookings at no cost indefinitely. | `customerCreditLedgerRepo.applyCredit()` — reads balance, computes cap, writes CREDIT_APPLIED entry | L-M (2) — requires concurrent API calls or compromised token | H (4) — indefinite free service | **Belt-and-suspenders at three layers:** (1) `Math.max(0, balance)` in `getBalance()` clamps the recomputed balance to ≥ 0. (2) `amountToApply = Math.min(balanceInPaise, bookingAmount)` cap in `attemptCreditApplication()` — can never apply more than the recomputed balance. (3) A 412 Cosmos conflict on the idempotency write causes a `zero-credit fallback` (booking succeeds, no credit applied) rather than a retry that could overspend. | Low — the cap is server-enforced, not client-supplied. A bug in `getBalance()` that returns a stale high balance is the residual risk; mitigated by test coverage (AC-3/4) and future balance-checkpoint hardening (E13-S03). | mitigated |
| **S-W1c** | **Concurrent double-spend race** — Two simultaneous `POST /v1/bookings` requests with different `Idempotency-Key` values both read the same positive balance, both call `applyCredit`, and both write `CREDIT_APPLIED` entries, spending the credit twice. | `attemptCreditApplication()` — no row-lock between `getBalance()` and `applyCredit()` writes | L (1) — requires near-simultaneous requests | M (3) — credit doubled (not indefinite — bounded by actual balance at read time) | **412 race-fallback:** The second writer receives a Cosmos 412 (or sees a 409 on the idempotency key if both used the same key). The `attemptCreditApplication()` helper treats 412 as a non-fatal signal and returns `0` — the booking proceeds at full amount. The balance-recompute-on-read ensures both CREDIT_APPLIED entries are subtracted correctly on the next read, preventing further overspend. Full `_etag` locking on a balance-checkpoint doc is deferred to E13-S03 when volume warrants it (ADR-0017 §5). | Low-medium — a narrow race window exists between `getBalance()` and the `CREDIT_APPLIED` write. The worst case is the credit is applied twice (not infinite); next `getBalance()` call will reflect the double debit and show 0. Hardened by E13-S03. | partial — 412 fallback covers most cases; full etag locking deferred |
| **S-W1d** | **Credit application on cancelled / no-show bookings** — A customer applies credit to a booking that is later `CUSTOMER_CANCELLED` or `NO_SHOW_REDISPATCH`. The credit is consumed but the booking never completes, so the customer effectively loses their credit for no service delivered. | `bookings.ts` — no post-apply refund path yet | L-M (2) | M (3) — bad UX + customer complaint | **Accepted for pilot.** Razorpay route refund cascade (E13-S04, Week 4) will add a refund event that writes a `REFUND` ledger entry when a credit-applied booking is cancelled. Until then, credit is non-refundable on cancellation — documented in T&C. | Medium — E13-S04 is the fix. Until it ships, a cancelled credit-applied booking loses the credit. Owner aware and accepts for pilot. | not-yet-mitigated (E13-S04 roadmap) |

**Addendum 2026-05-12 complete. New STRIDE entries: S-W1a (Spoofing/Repudiation), S-W1b (Elevation of Privilege), S-W1c (Tampering), S-W1d (accepted/deferred).**

---

## Addendum 2026-05-17 — E16-S04 Address Picker + Waitlist (I-W1, S-A2, T-B1 confirmation)

**Author:** Alok Tiwari + Claude Sonnet 4.6 (architect persona)
**Trigger:** E16-S04 introduces an anonymous `POST /v1/waitlist` endpoint (new PII surface: phone + lat/lng) and a client-side polygon check (new spoofing surface).

Convention for `Status` column: `mitigated` | `partial` | `not-yet-mitigated` | `accepted`.

### New/Confirmed Threats

| # | Threat | Code path | Likelihood | Impact | Mitigation | Residual risk | Status |
|---|---|---|---|---|---|---|---|
| **I-W1** | **Waitlist PII exposure** — `POST /v1/waitlist` stores `phone` + `lat` + `lng` without authentication. A misconfigured admin read endpoint, stolen connection string, or future insider access could expose these to unauthorised parties. | `api/src/functions/waitlist.ts` → `api/src/cosmos/repositories/waitlist.repository.ts` — `customer_waitlist` container, partition `/phone` | M (2) — requires API or DB-level access | M (3) — DPDP sensitive personal data (phone number, location) | (1) Cosmos at-rest encryption for the container. (2) Phone logged only as SHA-256 hash (first 8 hex chars). (3) Admin read endpoint deferred to W6 (`E16-S04b`) — until then no read path exists beyond the Cosmos portal. (4) 1-year TTL on all waitlist docs — automatic purge per compliance retention policy. (5) Rate-limit: 5 req/hr/phone + 50 req/hr/IP via token-bucket — caps enumeration blast radius. | Medium — a determined insider with Cosmos portal access can read raw docs before TTL expires. Phase 2: Cosmos client-side field-level encryption for `phone`. | partial — at-rest encryption + rate-limit + log masking; field-level encryption deferred |
| **S-A2** | **Spoofed lat/lng in waitlist** — An attacker submits fabricated coordinates to the waitlist endpoint (e.g. always submitting Ramkot lat/lng) to appear as an Ayodhya customer and be notified when the service launches, or to bulk-create noise in the waitlist. | `api/src/functions/waitlist.ts` — no server-side polygon check on waitlist (only on `/v1/bookings`) | M (2) — trivial with any HTTP client | L (2) — waitlist has no monetary value; spoofed entries are noise in a future notification campaign | Rate-limit (5/hr/phone) caps bulk-create. Phone format validation (`^\+91[6-9]\d{9}$`) requires a real Indian mobile number shape. Waitlist has zero monetary value — there is nothing to steal by claiming an inside-polygon position. Structured log `waitlist_join { phone_hash, mode }` emitted for forensic review. | Low — accepted for pilot. Add opt-in SMS confirmation step (W6) to further filter phantom numbers. | accepted |
| **T-B1 (confirmed)** | **Service-area bypass via client-spoofed lat/lng** — E16-S04 adds a client-side polygon check (`LocalServiceAreaCheck`) in the Android app as defence-in-depth UX. The client check is NOT the authoritative gate. | `customer-app: LocalServiceAreaCheck.isInside()` — client only; server gate unchanged at `api/src/functions/bookings.ts → isLatLngInServiceArea()` | — | — | **Server-side Turf.js polygon check (ADR-0020) remains the authoritative gate.** `LocalServiceAreaCheck` in the Android app provides UX-only refusal (saves the round-trip for obviously out-of-area customers). A determined attacker who bypasses the client check still hits the server-side rejection. No change to the existing T-B1 mitigation. | Unchanged from E16-S01 addendum. | mitigated (server-side unchanged; client check is additive UX only) |

**Addendum 2026-05-17 complete. New STRIDE entries: I-W1 (Information Disclosure), S-A2 (Spoofing/accepted); T-B1 confirmed unchanged.**
