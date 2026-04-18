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
