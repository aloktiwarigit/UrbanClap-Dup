---
stepsCompleted:
  - 'step-01-init'
  - 'step-02-context'
  - 'step-03-starter'
  - 'step-04-decisions'
  - 'step-05-patterns'
  - 'step-06-structure'
  - 'step-07-validation'
  - 'step-08-complete'
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief.md'
  - 'docs/prd.md'
  - 'docs/brainstorm.md'
  - 'docs/ux-design.md'
  - 'CLAUDE.md'
workflowType: 'architecture'
project_name: 'homeservices-mvp'
---

# System Architecture — homeservices-mvp

**Architect:** Winston (BMAD Architect persona)
**Author:** Alok Tiwari
**Date:** 2026-04-17
**BMAD Phase:** 4 — Architecture
**Status:** v1.0
**ADRs:** `docs/adr/0001-*.md` through `docs/adr/0007-*.md` (linked throughout)

---

## 1. Context & Constraints

### 1.1 The brief, distilled to architectural inputs

- **Three surfaces:** Customer Android (Kotlin + Compose), Technician Android (Kotlin + Compose), Owner Web Admin (Next.js 15 + TypeScript). iOS deferred to Phase 4 (OQ-18 — SwiftUI vs Kotlin Multiplatform TBD).
- **Backend:** Node 22 + TypeScript on Azure Functions Consumption plan.
- **Data:** Azure Cosmos DB Serverless — primary system of record. Firebase Storage for photos/media.
- **Real-time:** **FCM (Firebase Cloud Messaging) as universal messaging spine.** No WebSockets. No SMS in steady state. No paid WhatsApp Business.
- **Auth:** Truecaller SDK (primary) → Firebase Phone Auth OTP (fallback) → Google Sign-In (alternative), with persistent device sessions.
- **Payments:** Razorpay + Razorpay Route (split-payment escrow).
- **KYC:** DigiLocker (free, government) for Aadhaar; Azure Form Recognizer (free tier) for PAN OCR.
- **Maps:** Google Maps Platform within $200/mo free credit.

### 1.2 Binding constraints

| Constraint | Source | Architectural implication |
|---|---|---|
| **₹0/mo operational infra at pilot scale (≤5,000 bookings/mo)** | NFR-M-1, D2 | Every service must stay in its free tier at that volume. No always-on compute. No paid SaaS. |
| **<₹50k/mo at full scale (≤50,000 bookings/mo)** | NFR-M-2 | Free-tier overflow pays at usage rate, not reserved capacity. Per-booking cost < ₹2 at 50k. |
| **Zero paid SaaS dependencies** | NFR-M-3, D2 | Any paid dependency requires ADR + approval. |
| **Karnataka right-to-refuse — architecturally enforced** | NFR-C-1, D25, FR-9.1 | Decline history MUST NOT be a dispatch feature. Tested in CI. |
| **Immutable audit log** | NFR-S-6, FR-7.4 | Append-only Cosmos collection with deny-write/update policy. |
| **DPDP — India data residency** | NFR-C-3 | Azure India Central + Firebase Asia-South1 (Mumbai) only. |
| **Dispatch p95 < 2s** | NFR-P-3 | Cosmos geospatial index + FCM data message; no server roundtrip for tech-to-tech relay. |

### 1.3 What we are explicitly NOT building at MVP

Per PRD §Product Scope, the MVP is **exactly 25 features**. Architecture is sized for these features, with extension hooks for Phase 2+ but NO speculative generality.

**Deferred:** subscriptions (Razorpay Subscriptions integration — Phase 3), Native products marketplace (Phase 3), iOS (Phase 4 — needs KMP-or-SwiftUI ADR), multi-city (Phase 4 — re-partition ADR), ML dispatch (Phase 4 — Azure ML cron), B2B portal (Phase 4), WhatsApp Business API (Phase 3 — Meta Cloud API free tier only).

---

## 2. Boring-Technology Manifesto (why this stack)

> *Good architecture is usually boring architecture.*

Every choice here has been battle-tested by at least three teams larger than ours. We do not use unproven or interesting-but-trendy technology. The discipline of the ₹0 constraint naturally leads to the boring-and-obvious choice:

- **Kotlin + Compose** — Google-recommended Android stack since 2021. CRED, Zomato, Swiggy use it. Template has it wired with Paparazzi screenshot tests, Detekt/ktlint, Kover coverage, Hilt DI, Ktor networking. Nothing custom.
- **Next.js 15 + TypeScript strict** — hostable on Azure Static Web Apps free tier. Template has Storybook, Sentry, PostHog, axe-core, Lighthouse CI, Semgrep. Nothing custom.
- **Node 22 + Fastify + Zod** — Azure Functions Consumption runs Node natively. Fastify is the fastest Node framework with good ecosystem. Zod gives us schema validation + OpenAPI generation in one.
- **Azure Cosmos DB Serverless** — 25 GB + 1000 RU/s free forever. Native geospatial indexing. Change feed for event-driven real-time.
- **Azure Functions Consumption** — 1M executions + 400k GB-sec/month free. Autoscales. No idle cost.
- **FCM** — unlimited free forever. Proven at billions-of-devices scale. Data messages give us real-time without WebSockets.
- **Razorpay + Route** — Indian default. Razorpay handles PCI scope + RBI payment-aggregator compliance. We stay zero scope.
- **DigiLocker** — Government of India. Free. Aadhaar verification without storing Aadhaar.

**The only unconventional architectural moves we make** are strategic — and documented as ADRs:

1. FCM as universal messaging spine (ADR-0002) — replaces paid SMS + WhatsApp
2. Cosmos DB instead of Postgres (ADR-0003) — free forever, native geo
3. No WebSockets (ADR-0002) — FCM data messages do the same job free

Everything else is industry-standard.

---

## 3. System Overview (high-level architecture)

### 3.1 Architecture diagram (logical)

```
                                      ┌─────────────────────────────────────┐
                                      │          GOOGLE MAPS PLATFORM       │
                                      │   (Places + Geocoding + Directions) │
                                      │         free $200/mo credit         │
                                      └───────────────▲─────────────────────┘
                                                      │
                                                      │ (SDK calls)
                                                      │
  ┌──────────────────────┐  ┌────────────────────┐  ┌─┴──────────────────┐
  │  CUSTOMER APP        │  │  TECHNICIAN APP    │  │  OWNER WEB ADMIN   │
  │  Kotlin + Compose    │  │  Kotlin + Compose  │  │  Next.js 15 + TS   │
  │  (Android)           │  │  (Android)         │  │  (Static Web Apps) │
  └──────────┬───────────┘  └────────┬───────────┘  └──────────┬─────────┘
             │                       │                         │
             │          REST (HTTPS) │                         │
             └───────────┬───────────┘                         │
                         │                                     │
                         ▼                                     ▼
                ┌──────────────────────────────────────────────────────┐
                │   API BACKEND — Azure Functions Consumption (Node)   │
                │   Fastify + Zod + OpenAPI 3.1 + TypeScript strict   │
                │   HTTP triggers + Timer triggers + Queue triggers   │
                │   Free tier: 1M execs + 400k GB-sec/month          │
                └──────────────┬───────────────────────┬──────────────┘
                               │                       │
                               ▼                       ▼
              ┌────────────────────────────┐   ┌──────────────────────────────┐
              │  AZURE COSMOS DB           │   │  FIREBASE CLOUD MESSAGING    │
              │  Serverless · 25 GB free   │   │  (FCM data messages)         │
              │  · 1000 RU/s provisioned   │   │  UNIVERSAL MESSAGING SPINE   │
              │  · Native geospatial       │   │  dispatch · tracking · chat  │
              │  · Change feed             │   │  status · marketing · SOS    │
              │                            │   │  unlimited free              │
              │  Collections:              │   └──────────────▲───────────────┘
              │   bookings (partitioned)   │                  │
              │   technicians              │                  │ (mobile ↔ FCM)
              │   customers                │                  │
              │   audit_log (append-only)  │                  │
              │   wallet_ledger            │                  │
              │   ratings                  │                  │
              │   complaints               │                  │
              │   services (catalog)       │                  │
              │                            │                  │
              └─────────┬──────────────────┘                  │
                        │ (change feed)                       │
                        ▼                                     │
              ┌──────────────────────────────┐                │
              │  DISPATCHER FUNCTION         │                │
              │  (Azure Function — Cosmos    │◀───────────────┘
              │   change feed trigger)       │
              │  PostGIS-equivalent geo      │
              │  query for nearest N techs   │
              │  → FCM data message + Cosmos │
              │  optimistic concurrency for  │
              │  first-to-accept lock        │
              └──────────────────────────────┘

  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
  │  RAZORPAY + ROUTE    │  │  FIREBASE STORAGE    │  │  DIGILOCKER          │
  │  payment + split +   │  │  photos (before/     │  │  Aadhaar verification│
  │  payout to techs     │  │   after, KYC, chat)  │  │  free (govt)         │
  │  (2% of GMV from tx) │  │  5GB + 1GB/day free  │  └──────────────────────┘
  └──────────────────────┘  └──────────────────────┘

  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
  │  FIREBASE AUTH       │  │  TRUECALLER SDK      │  │  AZURE FORM          │
  │  Phone OTP +         │  │  (primary auth path; │  │  RECOGNIZER          │
  │  Google Sign-In      │  │   skip OTP if        │  │  (PAN OCR, 500/mo    │
  │  fallback            │  │   Truecaller on-dev) │  │   free)              │
  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘

  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
  │  POSTHOG (1M ev/mo)  │  │  SENTRY (5k err/mo)  │  │  APP INSIGHTS        │
  │  product analytics   │  │  error tracking      │  │  5 GB/mo — infra     │
  │                      │  │                      │  │  telemetry + traces  │
  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

### 3.2 Component responsibilities

| Component | Responsibility | Free tier boundary |
|---|---|---|
| **Customer app** | Service discovery, booking, payment UX, live tracking, rating, complaint, safety SOS. Receives FCM for all status + chat. | N/A (client app) |
| **Technician app** | Job offer handling (30s ACK), active-job workflow with guided photo capture, parts catalog (Phase 2), earnings dashboard, payouts, ratings + appeals, abusive-customer shield. | N/A (client app) |
| **Owner admin** | Live ops dashboard, orders drill-down + override, tech roster, customer list, finance + payouts, complaints inbox with SLA, audit log viewer, catalogue CRUD (Phase 2). | Static Web Apps 100 GB/mo bandwidth free |
| **API backend** | REST endpoints (OpenAPI 3.1), webhook handlers (Razorpay, DigiLocker), background triggers (dispatch, SLA timers, payouts cron). Stateless. | 1M execs + 400k GB-sec/mo free |
| **Cosmos DB** | System of record. All entities. Change feed drives dispatcher + live ops. Append-only audit log. Geospatial index for dispatch. | 1000 RU/s + 25 GB free forever |
| **FCM** | All push delivery: customer status updates, tech job offers + job-lifecycle pushes, admin live-ops feed, marketing campaigns (Phase 2), in-app chat messages. | Unlimited forever |
| **Firebase Storage** | Before/after photos, tech KYC selfies, in-chat media. | 5 GB + 1 GB/day free |
| **Razorpay + Route** | Payment capture, split between owner (commission) + tech (payout). Webhook-driven state transitions. | ₹0 fixed; 2% per tx from GMV |
| **DigiLocker** | Aadhaar verification via tokenised consent (never store the number). | Free |
| **Azure Form Recognizer** | PAN card OCR during tech onboarding. | 500 pages/mo free |
| **Google Maps** | Geocoding, Places autocomplete, Distance Matrix for dispatch, Directions for tech nav. | $200/mo recurring free credit |

---

## 4. Key Architectural Decisions (ADRs)

All decisions below are formalised as numbered ADRs at `docs/adr/0001-*.md` through `docs/adr/0007-*.md`. Summaries here; full ADRs in those files.

### 4.1 ADR-0001 — Primary stack choice

**Decision:** Kotlin + Jetpack Compose (Android, ×2 apps) + Next.js 15 (owner admin) + Node 22 + Fastify (API backend). Monorepo with `customer-app/`, `technician-app/`, `admin-web/`, `api/` subdirectories. Shared `docs/` at root for BMAD artifacts.

**Why:** each stack matches a scaffolded agency-baseline template (`client-baseline-android`, `client-baseline-nextjs`, `client-baseline-node`) that already wires the enterprise floor (Sentry, GrowthBook, PostHog, Storybook/Paparazzi, Semgrep, Codex-review CI). Zero custom scaffolding needed. Fits solo-build constraints.

**Trade-off accepted:** two separate Android codebases (customer-app + technician-app) share only a Gradle design-system module. Not KMP-shared initially. Future iOS (Phase 4) will likely add SwiftUI — that's a separate ADR when we get there.

### 4.2 ADR-0002 — FCM as universal messaging spine (no WebSockets, no SMS, no WhatsApp paid)

**Decision:** Firebase Cloud Messaging data messages handle ALL real-time delivery: customer status updates, technician job offers + lifecycle events, admin live-ops feed, marketing campaigns, in-app chat. One-time OTP SMS is the only non-FCM path at MVP.

**Why:** FCM is unlimited free. WebSocket servers cost money (not in free-tier compatible). Paid SMS scales with users (₹0.20 × 1M = ₹2 lakh). Paid WhatsApp Business API costs ~₹0.30-0.40 per conversation × 1M = ₹3-4 lakh. All cost free-tier violations at scale. Single-spine architecture also simplifies testing.

**Trade-off accepted:** FCM delivery SLO is ~95% within 10 seconds (NFR-R-5); we accept this vs WebSocket's near-instantaneous. We DO NOT have SMS fallback in steady state; we DO have MSG91 integration pre-planned (1-week implementation) if FCM delivery drops below 95%.

### 4.3 ADR-0003 — Azure Cosmos DB Serverless as system of record (not Postgres)

**Decision:** Cosmos DB Serverless is primary system of record. No Postgres, no MySQL, no MongoDB Atlas.

**Why:** 25 GB + 1000 RU/s free forever. Native geospatial indexing (vs Postgres requiring PostGIS extension + dedicated server). Change feed primitive gives us event-driven architecture without Kafka/EventBridge. Cross-partition queries expensive but free-tier-fine at ≤5k bookings/mo.

**Trade-off accepted:** Cosmos's RU-unit model requires discipline (partition key design, query patterns, index policies). Postgres would be more familiar. We get dollar-for-dollar more value from Cosmos at this scale, and the discipline forces good habits.

**Partition strategy:**
- `bookings`: partition by `customerId` (high read-by-customer for history; range queries by `createdAt` within partition).
- `technicians`: partition by `city` (currently 1 city; expands cleanly for multi-city Phase 4).
- `customers`: partition by `customerId` (self).
- `audit_log`: partition by `yyyy-mm` month (append-only, time-series access pattern).
- `ratings`, `complaints`: partition by `bookingId`.
- `wallet_ledger`: partition by `technicianId`.
- `services` (catalog): partition by `category` (small dataset, cached heavily client-side).

### 4.4 ADR-0004 — Azure Functions Consumption (not App Service)

**Decision:** All API handlers on Azure Functions Consumption plan. No always-on App Service. Cold starts accepted.

**Why:** 1M executions + 400k GB-sec/mo free. App Service F1 free tier has 60 min CPU/day limit — unusable. Consumption autoscales + zero idle cost.

**Trade-off accepted:** cold start latency ~1-2s for Node Functions. Mitigation: warmup ping every 4 min during Indian business hours (6 AM - midnight IST) keeps most functions warm. Dispatcher function is change-feed-triggered so always warm during traffic.

### 4.5 ADR-0005 — Authentication strategy (Truecaller + Firebase + Google)

**Decision:** Three-layer auth:
1. **Truecaller SDK** — primary, skips OTP entirely (95% of Indian Android devices have Truecaller)
2. **Firebase Phone Auth** — OTP fallback (SMS) for ~5% without Truecaller
3. **Google Sign-In** — alternative entry for customers who prefer it

Persistent device sessions via Firebase Auth refresh tokens (180-day expiry). Biometric re-auth (Android BiometricPrompt) on sensitive actions.

**Why:** Truecaller SDK is free + eliminates the ~₹0.40-per-SMS Firebase Phone Auth cost at scale. At 100 new customers/month steady state, OTP volume stays <100/mo = ~₹40/mo = effectively ₹0. Google Sign-In is free.

**Trade-off accepted:** Truecaller SDK requires business registration (2-week lead time — OQ-13). Biometric re-auth only works on devices with fingerprint/face sensors — older devices fall back to PIN.

### 4.6 ADR-0006 — Dispatch algorithm (Cosmos geospatial + FCM + optimistic concurrency)

**Decision:** Dispatcher is an Azure Function triggered by Cosmos Change Feed on `bookings` collection. When a booking enters `SEARCHING` state:

1. Query `technicians` collection via Cosmos ST_WITHIN (geo) for techs matching: `category` ∈ skills, `available` in slot window, within 5 km of booking address, rating ≥ 3.5, acceptance rate ≥ 30%.
2. Rank by composite score: `0.4 × (1 - normalized_distance) + 0.3 × normalized_rating + 0.2 × recency_of_last_job + 0.1 × acceptance_rate`. **NONE of: decline_count, decline_ratio, decline_recency — by architectural policy (NFR-C-1 / FR-9.1 / Karnataka Act).**
3. Send FCM data message to top 3 candidates simultaneously with 30-second ACK timeout.
4. First to ACK via API hits `/tech/offers/{id}/accept`. Accept uses Cosmos optimistic concurrency (`_etag`) to lock booking → `ASSIGNED`. Remaining candidates receive "no longer available" FCM.
5. If all three decline or time out, expand radius to 10 km and re-run. After 3 expansions (15 km), booking → `UNFULFILLED`.

**Why this beats a WebSocket solution:** No connection state to manage. No reconnect logic. Tech phones sleep; FCM wakes them via native OS. First-to-accept is a single Cosmos write, not a distributed lock across WS server instances.

**Trade-off accepted:** 30-second ACK window vs WebSocket's real-time. Acceptable for dispatch UX.

**CI test enforcing compliance:** integration test that creates 100 bookings dispatched to 10 techs with varying decline histories; asserts ranking order is IDENTICAL to the same techs with ZERO decline history. This test sits on the `main` branch; any dispatcher change that breaks it fails CI.

### 4.7 ADR-0007 — Zero paid SaaS constraint (binding)

**Decision:** No paid SaaS dependencies at MVP or any phase without explicit owner ADR + approval.

**Why:** Operational cost discipline is our strategic wedge (Innovation I-1). Every paid add erodes the margin advantage.

**Scope:** applies to any third-party service with a recurring monthly cost > ₹0 at our usage volume. Free tiers with clear overflow paths (Google Maps $200 credit, FCM unlimited, Cosmos 25 GB) are fine.

**Override:** if a paid dependency becomes necessary, ADR justifies why no free alternative works, documents the paid-tier migration plan with cost projection, and requires explicit owner sign-off in the ADR.

---

## 5. Architectural Patterns

### 5.1 Real-time data flow: Cosmos Change Feed → Function → FCM

**Problem:** Admin dashboard needs real-time updates (every new booking, status change, complaint) without WebSockets.

**Pattern:** Cosmos Change Feed (push) → Azure Function (cosmos-change-feed trigger) → FCM topic per admin user → admin web subscribes to FCM topics. Admin web is offline-capable; on reconnect it queries for recent events via REST.

**Latency:** Change feed → Function invocation is sub-second (Cosmos SLA). Function → FCM → web client is 2-5 seconds typical. Total feed-lag: ~5 seconds end-to-end, well within "real-time" user expectations.

### 5.2 Booking state machine

```
CREATED → SEARCHING → ASSIGNED → EN_ROUTE → REACHED → IN_PROGRESS → COMPLETED → PAID → CLOSED
                              ↘
                                UNFULFILLED (no tech found)
                                CUSTOMER_CANCELLED
                                TECH_CANCELLED (with penalty)
                                TECH_NO_SHOW (→ re-dispatch)
                                DISPUTED (parallel: still tracked)
```

Every state transition writes an event to `booking_events` collection (Cosmos) with timestamp + actor + reason. Change feed picks up events → triggers downstream actions (FCM, dispatcher, payout).

### 5.3 Payment lifecycle

1. Customer confirms booking → API creates Razorpay order → customer pays via Razorpay Checkout SDK.
2. Razorpay webhook → API verifies signature → booking → `PAID` state.
3. At `COMPLETED`, API initiates Razorpay Route transfer: `transfer_account_id: owner → commission %` + `transfer_account_id: tech → balance`.
4. Route webhook → API updates `wallet_ledger` for tech; Cosmos change feed → FCM to tech with earnings update.
5. Weekly payout cron (Azure Function timer trigger, Mondays 10 AM IST) aggregates pending tech wallets → owner approves via admin → Razorpay batch-release.

### 5.4 Audit log pattern

Every admin action → append-only `audit_log` Cosmos collection entry with:
```
{
  "id": "uuid",
  "adminId": "...",
  "adminRole": "super-admin|ops|finance|support|marketing",
  "timestamp": ISO8601,
  "sourceIP": "...",
  "actionType": "override|refund|deactivate|payout-approve|...",
  "reasonCode": "customer-request|tech-error|dispute|...",
  "targetEntity": { "type": "booking|tech|customer", "id": "..." },
  "beforeStateHash": "sha256",
  "afterStateHash": "sha256",
  "metadata": { ... action-specific ... }
}
```

Cosmos collection policies: no update, no delete (enforced via Cosmos built-in stored-procedure policy). Reads scoped via RBAC.

### 5.5 Live tracking flow

1. Tech app writes location to Cosmos `technicians` collection every 30 seconds during active job (Firebase SDK direct write, no API roundtrip).
2. Change feed → Function → FCM data message to customer's active booking topic.
3. Customer app receives FCM → updates map pin position.
4. Battery discipline: location updates pause when tech taps "Reached" (job active, no need to track); resume only for en-route phase.

### 5.6 Compliance enforcement pattern (Karnataka right-to-refuse)

Dispatcher module has zero access to `decline_history` data. Enforced by:
- Data layer: `technicians` collection has no `declineCount` field exposed via the dispatcher's query API surface.
- Test layer: dispatcher integration test uses ranking-invariance assertion (same techs, different decline histories, identical rank order).
- Review layer: Codex review + bmad-code-review Blind Hunter both flag any code that reads decline history in dispatch path.

---

## 6. Code Structure (monorepo layout)

```
/                                 (project root, scaffolded Phase 0)
├── CLAUDE.md                     Root-level workflow + cross-cutting rules
├── .gitignore
├── docs/                         BMAD artefacts (greenfield protocol)
│   ├── brainstorm.md
│   ├── prd.md
│   ├── ux-design.md
│   ├── architecture.md           (this file, copied)
│   ├── threat-model.md           (Phase 4.5)
│   ├── runbook.md                (Phase 4.5)
│   ├── adr/
│   │   ├── README.md
│   │   ├── TEMPLATE.md
│   │   ├── 0001-primary-stack-choice.md
│   │   ├── 0002-fcm-universal-messaging-spine.md
│   │   ├── 0003-cosmos-db-serverless-sor.md
│   │   ├── 0004-azure-functions-consumption.md
│   │   ├── 0005-auth-strategy-truecaller-firebase.md
│   │   ├── 0006-dispatch-algorithm.md
│   │   └── 0007-zero-paid-saas-constraint.md
│   ├── stories/                  (Phase 5 — per-story specs)
│   ├── proposals/                (client-facing proposals, Hindi + English)
│   └── ux-demos/                 (Frontend-design skill outputs)
│       └── owner-live-ops-dashboard.html
│
├── customer-app/                 Android · Kotlin + Compose
│   ├── app/
│   │   ├── src/main/kotlin/.../home/
│   │   ├── src/main/kotlin/.../booking/
│   │   ├── src/main/kotlin/.../tracking/
│   │   ├── src/main/kotlin/.../payment/
│   │   ├── src/main/kotlin/.../rating/
│   │   └── src/main/kotlin/.../safety/
│   ├── design-system/            Shared Compose theme + components (Gradle module)
│   ├── .github/workflows/ship.yml
│   ├── CLAUDE.md                 Android-specific rules
│   └── README.md
│
├── technician-app/               Android · Kotlin + Compose (separate codebase)
│   ├── app/src/main/kotlin/.../offers/
│   ├── app/src/main/kotlin/.../active-job/
│   ├── app/src/main/kotlin/.../earnings/
│   ├── app/src/main/kotlin/.../appeals/
│   ├── design-system/            (same Gradle module as customer-app, different app context)
│   └── ...
│
├── admin-web/                    Next.js 15 · TypeScript strict
│   ├── src/app/(dashboard)/page.tsx        Live Ops (default)
│   ├── src/app/(dashboard)/orders/
│   ├── src/app/(dashboard)/technicians/
│   ├── src/app/(dashboard)/customers/
│   ├── src/app/(dashboard)/finance/
│   ├── src/app/(dashboard)/complaints/
│   ├── src/app/(dashboard)/audit/
│   ├── src/components/
│   ├── src/lib/ (api-client, auth, tokens)
│   ├── .storybook/
│   ├── tests/
│   └── ...
│
├── api/                          Node 22 · Fastify · Azure Functions
│   ├── src/functions/            Each HTTP / timer / change-feed trigger
│   │   ├── auth-otp/
│   │   ├── bookings-create/
│   │   ├── bookings-status/
│   │   ├── tech-onboard/
│   │   ├── tech-offers-accept/
│   │   ├── tech-wallet/
│   │   ├── admin-*/
│   │   ├── webhook-razorpay/
│   │   ├── webhook-digilocker/
│   │   ├── trigger-dispatcher/ (Cosmos change feed trigger)
│   │   ├── trigger-sla-timer/ (timer trigger)
│   │   ├── trigger-weekly-payouts/ (timer trigger)
│   │   └── trigger-ssc-levy/ (quarterly timer trigger)
│   ├── src/domain/               Business logic (pure, no infra deps)
│   │   ├── booking/
│   │   ├── dispatcher/
│   │   ├── compliance-karnataka/
│   │   └── ...
│   ├── src/infra/                Infra adapters (Cosmos, FCM, Razorpay, DigiLocker)
│   ├── src/schemas/              Zod schemas (single source of truth; generates OpenAPI)
│   └── tests/                    Vitest unit + Testcontainers integration
│
├── _bmad/                        BMAD config + skill scaffolding
├── _bmad-output/                 BMAD intermediate outputs
│   ├── planning-artifacts/       (prd.md, architecture.md, etc.)
│   └── brainstorming/            (session transcripts)
├── tools/                        cross-cutting scripts
│   └── md_to_docx.py
└── (intentionally no root package.json — each sub-project is independent)
```

### 6.1 Package boundaries

- **No cross-package imports between sub-projects.** `customer-app/` does not import from `technician-app/` or `admin-web/` or `api/`. Communication strictly via API contracts (OpenAPI-generated types).
- **Shared types via code generation**, not shared modules. `api/src/schemas/*.zod.ts` → OpenAPI 3.1 spec → generated TypeScript types for `admin-web/` + Kotlin types for Android apps (via OpenAPI generator).
- **Design system shared via Gradle module** (Kotlin) + npm package (TypeScript, via Storybook + Tailwind tokens published to internal npm scope in Phase 2). Kotlin half realised by E01-S04 (composite build per ADR-0010); npm-package half remains Phase 2.

### 6.2 Naming conventions (enforced by lint)

- Kotlin: PascalCase for types, camelCase for functions, `SCREAMING_SNAKE_CASE` for constants.
- TypeScript: PascalCase for types, camelCase for variables, kebab-case for file names.
- API endpoints: `/v1/{resource}/{action}` with hyphens, not slashes-for-action.
- Cosmos collection names: lowercase snake_case (`booking_events`, `wallet_ledger`).
- Event types (in `booking_events`): `booking.created`, `booking.assigned`, `payment.captured`, etc. — dot-namespaced.

---

## 7. Architectural Validation

### 7.1 NFR traceability

Every NFR in PRD §Non-Functional Requirements maps to at least one architectural decision:

| NFR | Architectural mitigation |
|---|---|
| NFR-P-1 to NFR-P-8 (performance) | Cosmos Serverless + Azure Functions Consumption + FCM + CDN (Static Web Apps) |
| NFR-R-1, R-2, R-3 (reliability) | Cosmos continuous backup, Azure Functions retry semantics, DR runbook |
| NFR-R-4 (Razorpay uptime) | Razorpay's SLA + our webhook signature verification |
| NFR-R-5 (FCM delivery ≥ 95%) | FCM is Google infra; MSG91 SMS fallback documented (ADR-0002 trade-off) |
| NFR-S-1 to S-12 (security) | Azure + Firebase defaults + Razorpay + DigiLocker + Semgrep + audit log + secrets in Key Vault |
| NFR-C-1 to C-8 (compliance) | ADR-0006 Karnataka enforcement, quarterly SSC levy cron, DPDP data residency, GST IRP integration |
| NFR-A-1 to A-5 (accessibility) | axe-core CI gate + Paparazzi + design-system tokens |
| NFR-L-1 to L-5 (localisation) | string externalization + Figma localisation testing |
| NFR-O-1 to O-6 (observability) | PostHog + Sentry + App Insights + OTel |
| NFR-U-1 to U-5 (usability) | UX spec enforces; Paparazzi visual-regression catches drift |
| NFR-M-1 to M-9 (maintainability + cost) | ADR-0007 binding constraint; free-tier monitoring; test coverage CI gate |

### 7.2 Free-tier budget verification

At pilot scale (5,000 bookings/month):

| Service | Expected usage | Free tier | Headroom |
|---|---|---|---|
| Azure Functions Consumption | ~30k execs × 100ms avg = 3k GB-sec | 1M execs + 400k GB-sec | 99% headroom |
| Cosmos DB Serverless | ~5k bookings + 50k events + 500 techs + 1M wallet rows ≈ 300 MB | 25 GB | 98% headroom |
| Cosmos DB RU/s | ~20-30 RU/s peak | 1000 RU/s | 97% headroom |
| Firebase Storage | ~400 MB/month photos | 5 GB + 1 GB/day download | years of runway |
| Azure Static Web Apps | ~20 GB/mo bandwidth | 100 GB/mo | 80% headroom |
| Google Maps | ~$40/mo | $200 free credit | 80% headroom |
| FCM | unlimited | unlimited | — |
| Firebase Phone Auth | ~100 SMS/mo = ~₹40 | no free tier but near-zero | de minimis |
| Azure Form Recognizer | ~50 techs × 1 page = 50/mo | 500/mo | 90% headroom |
| PostHog Cloud | ~500k events | 1M/mo | 50% headroom |
| Sentry | ~1k errors target | 5k/mo | 80% headroom |
| App Insights | ~2 GB/mo | 5 GB/mo | 60% headroom |
| Azure Comm Services Email | ~100/day | 100/day | at limit; monitor |
| GitHub Actions | ~800 mins/mo CI | 2000 mins/mo | 60% headroom |

**At full scale (50,000 bookings/month)** — 10× pilot — most services remain free:
- Functions: 300k execs = 30% of free tier (still free)
- Cosmos: data grows to ~3 GB = 12% of 25 GB (still free); RU/s peaks at ~300 RU/s (still well under 1000 free)
- Maps: $400/mo usage — $200/mo paid. This becomes our first paid expense (~₹17,000/mo at 50k bookings).
- Bandwidth Static Web Apps: may push past 100 GB — migrate to Azure CDN (~₹5-8k/mo).
- Total cost at 50k: ~₹25-40k/mo. Within the ≤₹50k/mo NFR-M-2 ceiling.

### 7.3 Dispatch p95 < 2s validation

Dispatcher performance budget (end-to-end from booking paid → first FCM received by tech):

| Step | Budget | Notes |
|---|---|---|
| Razorpay webhook → API function cold start | 0 ms | Already warm via traffic |
| Function invocation → Cosmos geo query | 50-200 ms | ST_WITHIN on partitioned index |
| Ranking computation (in-memory) | < 5 ms | 50 candidates × simple math |
| FCM send batch (top 3 candidates) | 100-400 ms | FCM HTTP v1 API |
| FCM delivery to device | 500-1500 ms | Google's spine |
| **Total p95** | **~1800 ms** | Within 2 s budget |

Monitoring: Azure Function execution-duration metric + PostHog event-timing on tech-side "offer received" → alert if p95 > 2s for 5 min.

### 7.4 Alignment with downstream phases

| Downstream | What architecture provides |
|---|---|
| Phase 4.5 threat model | Component inventory, trust boundaries (§3.1 diagram), data classification by collection |
| Phase 4.5 runbook | Incident categories (dispatch failure, payment failure, FCM degradation, free-tier breach) + owner contacts + DR procedures |
| Phase 5 epics/stories | Each FR maps to a function / module listed in §6 structure |
| Phase 5.5 readiness gate | NFR traceability (§7.1) is the primary gate artefact |
| Per-story execution | Monorepo + templates + CI already in place means stories can start immediately after gate |

---

## 8. Open Architecture Questions

| # | Question | Deferred to |
|---|---|---|
| AQ-1 | iOS approach — SwiftUI native or Kotlin Multiplatform Mobile (KMP) shared logic? | Phase 4 ADR-0008 (when iOS scoped) |
| AQ-2 | Multi-city Cosmos partition strategy — repartition by `city` from MVP or lazy-migrate? | Phase 4 ADR-0009 (when 2nd city planned) |
| AQ-3 | ML dispatch model — Azure ML Studio or TensorFlow Lite on-device? | Phase 4 ADR-0010 |
| AQ-4 | Subscription tier — Razorpay Subscriptions vs our own recurring billing? | Phase 3 ADR-0011 |
| AQ-5 | Native products marketplace — same API + new endpoints, or separate service? | Phase 3 ADR-0012 (lean toward same API) |
| AQ-6 | B2B portal — new Next.js app or multi-tenant extension of admin-web? | Phase 4 ADR-0013 (lean toward new app) |
| AQ-7 | Real-time media (video calls for senior customer onboarding support)? | Phase 3+ if scoped |
| AQ-8 | Live chat server (if FCM latency insufficient for conversational chat) | Phase 2 monitoring-driven |

---

## 9. Next BMAD Steps

- **Phase 4.5 — Threat model + Runbook.** Threat model uses §3.1 component diagram as its STRIDE target; runbook references §7 SLOs and incident categories.
- **Phase 5 — Epics + Stories.** Each FR → epic → stories. Architecture §6 structure defines where code lands.
- **Phase 5.5 — Readiness gate.** NFR traceability (§7.1) validated.
- **Per-story execution.** Stories can start after `.bmad-readiness-passed` marker is committed.

---

**Architecture v1.0 complete.** Ready for Phase 4.5.
