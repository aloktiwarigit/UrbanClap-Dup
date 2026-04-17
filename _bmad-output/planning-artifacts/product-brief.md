# Product Brief — Home Services Marketplace (Urban Company Parity, Zero-Cost Infra)

**Project Code:** HSV-FULL-2026
**Author:** Alok Tiwari
**Date:** 16 April 2026
**BMAD Stage:** Product Brief (Stage 1 of 6 — brief → PRD → architecture → UX → epics/stories → dev)
**Status:** Draft v1.0
**Distillate:** see `product-brief-distillate.md` for downstream PRD ingestion

---

## 1. Executive Summary

Build a full-feature home-services marketplace at parity with Urban Company (UC) — same category breadth (100+ services), same surfaces (customer iOS/Android/web, technician app, owner web), same advanced features (subscriptions, native products marketplace, 15-min instant service, ML dispatch, multi-city, multi-language) — but constructed entirely on free-tier cloud services (Firebase + Azure) with FCM as the universal messaging/real-time spine. Build is done by the founder using BMAD methodology + Claude Code, so build cost is effectively ₹0; recurring infra cost target is **₹0/month** at pilot scale (1 city, 1k–5k bookings/mo) and **<₹50,000/month** at full UC-equivalent scale (5+ cities, 50k+ bookings/mo).

Strategic wedge vs UC: **fair commission to vendors (22–25% vs UC's 28%), single-city operational depth before scaling, transparent dispatch (Karnataka right-to-refuse compliant from day 1), owner-controlled platform** (UC's algorithmic opacity is its biggest reputational vulnerability — 1.4★ PissedConsumer rating + Jan/Feb 2026 nationwide partner protests).

---

## 2. Background & Strategic Context

### Market

- **TAM:** ₹5.1 lakh crore (~$60B) Indian home-services market, growing to ₹8.4 lakh crore by FY30 at ~10% CAGR.
- **Online organized share:** 0.8% in FY25 → 1.3% by FY30 (18–22% CAGR for full-stack online platforms).
- **Top 200 cities:** 5.3 crore households use home services.
- **Unorganized incumbent:** 99% of the market; the actual competitor is the local dhobi/maid/electrician network.

### Urban Company snapshot

- FY25 revenue ₹1,144 cr (+38%), first profit ₹240 cr (largely deferred-tax credit; pre-tax ₹28 cr).
- Q3 FY26 reverted to ₹21.3 cr loss; InstaHelp vertical alone bled ₹61 cr EBITDA.
- IPO Sep 2025 listed +57.5% at ₹162; now ~₹116 after Q3 FY26 reset.
- Take rate: 28% (sliding to 27.5–27.6% for top performers).
- Average tech in-hand earnings: ₹28,322/mo (9M FY26).
- Active in: India top metros, UAE, Saudi (JV), Singapore.

### Why now

1. **Regulatory tailwind:** Central Social Security Code rules notified Dec 2025 + Karnataka, Rajasthan, Bihar, Jharkhand state acts — formalizes platform work, making informal-only competitors less viable.
2. **AI-augmented build:** Solo founder + Claude Code + BMAD method makes a UC-clone build feasible at ₹0 cash cost (founder time only).
3. **Free-tier cloud maturity:** Firebase Spark/Blaze + Azure free tiers + FCM together can run a real production marketplace through 5,000+ bookings/mo without any monthly bill.
4. **UC vulnerability:** post-IPO public-market discipline, partner protests, and customer NPS softness create a window for a vendor-friendly, ops-disciplined alternative.

---

## 3. Problem Statement

**For Customers:** Booking trusted home services in India today is fragmented (10 different repairman WhatsApp contacts), opaque on price, unreliable on quality, and lacks accountability. Existing platforms (UC) charge premium prices but deliver inconsistent experiences (1.4★ PissedConsumer; refund/no-show complaints rampant).

**For Technicians:** Independent service providers lack steady work, fair pricing, formal credentials, social security, and access to better tools/training. Existing platforms (UC) charge 28% commission, use opaque algorithmic dispatch, and routinely block IDs of dissenters (Jan 2026 protests).

**For the Owner (this business):** Building and running a home-services aggregator at UC parity traditionally requires ₹2–5 cr investment, an engineering team of 10+, multi-city ops staff, and dedicated infrastructure spend of ₹5–10 lakh/month. This locks out solo operators and small teams from a structurally attractive market.

---

## 4. Solution Overview

A full-stack, multi-sided marketplace platform with three primary surfaces:

1. **Customer apps** (Android + iOS + responsive web PWA) — discover, book, pay, track, rate.
2. **Technician/Partner app** (Android + iOS) — onboard, get jobs, navigate, complete, earn.
3. **Owner web admin** — full real-time visibility + control over orders, technicians, payments, complaints, marketing, finance.

Plus secondary surfaces:
- WhatsApp chatbot booking (for customers who don't want to download).
- B2B portal (for societies, offices, corporates with bulk contracts).

Built on **Firebase + Azure free-tier services** with **FCM as the universal real-time/messaging spine** (push for status, dispatch, in-app chat, marketing campaigns — replaces SMS and WhatsApp Business paid services). One-time OTP authentication per device with persistent session (so SMS volume stays in single digits/month after initial onboarding wave).

---

## 5. Target Users & Personas

### Persona 1: "Convenience-first Customer" — Riya, 32, Marketing Manager, Bengaluru

- Books home services 2–4× per month.
- Values: speed, predictable pricing, trust (verified tech, photos, ratings), no haggling.
- Pain points: no-shows, surprise charges, can't reach support when something goes wrong.
- Platforms: Android-first (95% of India), spends 6+ hrs/day on phone.

### Persona 2: "Trust-first Senior Customer" — Mr. Verma, 65, retired, Pune

- Books services 1–2× per month, often via WhatsApp through his daughter.
- Values: human contact, predictable timing, gentle technicians, payment in cash if possible.
- Pain points: app complexity, English-only interfaces, fear of fraud.
- Needs: Hindi/regional language, large fonts, voice-call support, optional cash payment.

### Persona 3: "Ambitious Technician" — Suresh, 28, AC technician, Faridabad

- Earns ₹25k–35k/month independently; wants steady ₹50k+ income.
- Values: fair commission, transparent job allocation, weekly payouts to bank, formal recognition (uniform, ID, insurance).
- Pain points: Urban Company's 28% cut, opaque ratings, ID-blocking on protest, no health cover.
- Needs: skill certification, training videos in Hindi, control over job acceptance, clear earnings dashboard.

### Persona 4: "Career Technician (Beauty/Wellness)" — Priya, 26, beautician, Delhi

- Works home-visits; UC + 2 small platforms + word-of-mouth.
- Values: women-only customers (or filter), safe transport in late hours, dignity.
- Pain points: late-night job assignments, customers who behave inappropriately, no support escalation.
- Needs: customer rating BEFORE accepting (both-way ratings), mandatory photo of customer's society/door, time-window restrictions.

### Persona 5: "Operator Owner" — Alok (the founder/client)

- Wants full real-time visibility into every order, every technician, every rupee.
- Values: low-touch automation, override authority, audit trail for legal protection, predictable margins.
- Pain points: vendor liquidity, working capital, regulatory compliance, marketing ROI.
- Needs: live ops dashboard, finance reconciliation, complaint SLA tracking, audit log, role-based access for future ops team.

### Persona 6: "Society Procurement" — Mrs. Iyer, RWA Treasurer, Whitefield Apt Society

- Manages 200-flat society; needs recurring services (cleaning, pest control, gardening).
- Values: bulk pricing, single invoice/month, vetted technicians.
- Pain points: chasing multiple vendors, inconsistent quality, no GST invoices.
- Needs: B2B portal, monthly contracts, dedicated account manager, GST e-invoices.

---

## 6. Goals & Success Metrics

### Phase 1 (Pilot — 1 city, 6 months post-launch)

| Metric | Target |
|---|---|
| Active categories | 5–8 |
| Active vendors | 200–500 |
| Bookings/month | 5,000 |
| Repeat customer rate (60 days) | ≥ 35% |
| Auto-dispatch acceptance < 30s | ≥ 70% |
| Average rating | ≥ 4.5★ |
| Complaint resolution SLA met | ≥ 90% |
| Tech retention (90 days) | ≥ 60% |
| LTV : CAC ratio | ≥ 3:1 |
| Monthly infra cost | **₹0–₹500** |
| Monthly take-rate (commission) | 22–25% |
| Contribution margin per booking | Positive |

### Phase 2 (Multi-city — 12-month horizon)

| Metric | Target |
|---|---|
| Active cities | 5+ |
| Bookings/month | 50,000+ |
| Annual GMV trajectory | ₹50 cr+ |
| Native products revenue share | 15%+ |
| Subscription members | 25%+ of MAU |
| Multi-city tech retention | 80%+ |
| Monthly infra cost | < ₹50,000 |

---

## 7. Scope

### 7.1 In Scope (Full UC Parity)

#### Customer surfaces
- Android app (primary)
- iOS app (Phase 2)
- Web PWA (Phase 2)
- WhatsApp chatbot (Phase 3)

#### Customer features
- Phone OTP signup (one-time per device) + Truecaller SDK + Google Sign-In fallbacks
- Persistent session (refresh tokens long-expiry; biometric re-auth on sensitive actions)
- Service discovery: 100+ categories across 8 verticals
  - Home Cleaning (deep clean, regular, kitchen, bathroom, sofa, mattress)
  - Appliance Repair (AC, washing machine, refrigerator, microwave, geyser, RO, chimney)
  - Plumbing & Electrical
  - Carpentry, Painting, Pest Control, Waterproofing
  - Beauty & Salon at Home (women + men)
  - Massage & Wellness (women + men)
  - Fitness & Yoga (trainers at home)
  - Daily Help (cooking, dishwashing, laundry, meal prep — UC InstaHelp equivalent)
- Search + browse + categories navigation
- Service detail page: price breakdown, includes/excludes, duration, FAQs
- Slot booking (next available, scheduled future)
- Multi-step bookings (multiple services in one visit)
- Address management (saved addresses with map pin)
- Saved payment methods (Razorpay tokenisation)
- Coupons + promo codes
- Referral program (refer-a-friend with credit)
- Loyalty program (points, tiers — Silver/Gold/Platinum)
- Subscription tier (UC Plus equivalent — ₹999/yr for 10% discount + priority + free cancel)
- Native products marketplace (UC Native equivalent — water purifiers, smart locks, ACs, smart appliances)
- 15-min Instant Service (UC InstaHelp equivalent — daily help)
- 30–60 min Instant Service (UC Instant equivalent — emergency plumbing/electrical)
- Live tracking with map + ETA + tech profile
- Booking lifecycle status (Searching → Assigned → En route → Reached → In progress → Done)
- In-app chat with technician
- Service complete approval with final price (if variable)
- Payment via UPI / cards / wallets / EMI / Pay Later (Razorpay)
- Booking history + one-tap re-book
- Reviews + ratings (gives, sees aggregate)
- Complaints + dispute flow with SLA
- Multi-language UI (Hindi, English, Tamil, Bengali, Marathi, Telugu)
- Push notifications for all status changes (FCM)
- Gift cards
- Corporate gifting

#### Technician/Partner surfaces
- Android app (primary)
- iOS app (Phase 2)

#### Technician features
- Phone OTP signup (one-time per device)
- KYC: Aadhaar + PAN via DigiLocker (free, government-backed) + selfie + skill certificate upload
- Skills + serviceable area (geo-radius) configuration
- Availability schedule (days, hours, off-days, vacations)
- Job offer push (FCM data message — 30-sec ACK window)
- Accept / Decline (decline does NOT degrade ranking — Karnataka compliant)
- Job details: customer name, address (map), service, slot, payout estimate
- Google Maps navigation handoff
- Status workflow: Started Trip → Reached → Started Work → Completed
- Photo upload (before + after — Firebase Storage)
- In-app chat with customer
- Wallet — earnings, payout history, breakdown per booking
- Weekly auto-payout (Razorpay Route to linked bank account)
- Earnings dashboard (today/week/month/lifetime)
- Customer rating (technician rates customer too — both-way)
- Training portal (videos, quizzes, certifications)
- Skill certification badges
- Insurance policy view (auto-enrolled per booking)
- Health insurance enrolment (group cover via partner)
- Welfare programs (tools, kit financing)
- Grievance redressal channel (ombudsman-style escalation)

#### Owner Web Admin
- **Live Operations View** — city map with all techs/bookings in real-time, today's counters
- **Orders Module** — searchable/filterable list, drill-down detail with full timeline + photos + payments + complaints, override controls (re-assign, manual complete, refund, escalate, internal notes), CSV export
- **Technicians Module** — roster, KYC status, weekly earnings, lifetime GMV, rating, location, decline rate, activate/deactivate, commission % per tech, in-app chat
- **Customers Module** — list, lifetime spend, complaint count, blacklist toggle
- **Finance Module** — daily P&L, GMV/commission/payout/refund/marketing/gateway breakdown, weekly payout queue, GST output register, invoice register
- **Complaints Module** — inbox with SLA timer, agent assignment, resolution categorisation
- **Marketing Module** — coupon CRUD, referral program config, push campaigns (city/category/cohort targeted via FCM topics), A/B testing
- **Catalogue Module** — service categories, services, pricing, includes/excludes, FAQ management
- **Subscription Module** — UC Plus equivalent management (members, perks, billing)
- **Native Products Module** — product catalog, inventory, orders, fulfilment, returns
- **B2B Module** — society/corporate accounts, contracts, bulk bookings, dedicated invoicing
- **Multi-city Module** — city-wise P&L, vendor pools, marketing, expansion playbooks
- **Analytics Module** — cohort retention, LTV/CAC, demand heatmaps, tech utilisation heatmaps, predictive forecasts, fraud alerts
- **Audit Log** — every override/refund/deactivate/payout-approve recorded immutably
- **Access Control** — RBAC: super-admin, ops manager, finance, support agent, marketing manager, B2B account manager

#### Cross-cutting (platform-level)
- ML-based dispatch (ranking by distance + rating + recency + customer preference + time-of-day patterns)
- Demand prediction (vendor scheduling based on predicted demand)
- Dynamic pricing (surge during high-demand slots — opt-in, transparent to customer)
- Fraud detection (fake booking, fake review, payment fraud)
- Recommendation engine ("customers who booked X also booked Y")
- Insurance integration (per-booking liability cover ₹5 lakh — automated claim flow)
- Background check renewal (every 6 months)
- Compliance: Karnataka Platform Workers Act + Central Social Security Code (1–2% aggregator levy auto-calculated + remitted)
- DPDP Act (India data privacy) compliance
- Multi-currency support (Phase 3 — UAE, Saudi, Singapore expansion)
- White-label option for societies (society-branded version of customer app)

### 7.2 Out of Scope (Initial release)

- Native apps in Apple Watch / Wear OS / smart speakers
- AR-based service booking ("scan your AC for diagnosis")
- Cryptocurrency payments
- International expansion outside India in v1
- Franchise model
- Equipment rental (e.g. rent a steam cleaner)

### 7.3 Phased Rollout (high-level)

| Phase | Scope | Timeline (founder-built) |
|---|---|---|
| **MVP** | Core booking + auto-dispatch + 5 categories + 1 city + Owner dashboard + Customer Android + Tech Android | Months 1–3 |
| **Trust+** | Reviews + complaints + KYC + insurance + weekly payouts + WhatsApp-via-FCM-equivalent push notifications | Month 4 |
| **Growth** | Coupons + referrals + loyalty + 15-min Instant + UC Instant + advanced analytics | Months 5–6 |
| **Subscription + Products** | UC Plus subscription + Native products marketplace | Months 7–8 |
| **iOS + Multi-language + B2B** | iOS apps + 5 language UI + B2B portal | Months 9–10 |
| **Multi-city + ML** | 5 cities + ML dispatch + dynamic pricing + fraud detection | Months 11–12 |

---

## 8. Feature Inventory (consolidated reference)

| # | Feature | Surface(s) | Free-tier implementation note |
|---|---|---|---|
| F01 | Phone OTP auth (one-time per device) | Customer + Tech | Firebase Phone Auth (~100 SMS/mo at steady state via Truecaller-first strategy) |
| F02 | Persistent session + biometric re-auth | Customer + Tech | Firebase Auth refresh tokens (long expiry) + on-device biometrics |
| F03 | Service discovery + browse + search | Customer | Cosmos DB indexed lookups |
| F04 | Address management with map pin | Customer | Google Maps Places + Geocoding (free $200/mo credit) |
| F05 | Slot booking | Customer | Cosmos DB |
| F06 | Multi-step bookings | Customer | Cosmos DB |
| F07 | Razorpay payment | Customer | Razorpay (no monthly fee, 2% per txn from GMV) |
| F08 | Live tracking with map | Customer | Tech app pushes location updates via FCM data messages → customer app subscribes to FCM topic for that booking |
| F09 | In-app chat | Customer + Tech | FCM data messages (no Firebase Realtime DB needed at low scale) |
| F10 | Push notifications (status, marketing) | All | FCM (unlimited free) |
| F11 | Reviews + ratings (both-way) | Customer + Tech | Cosmos DB |
| F12 | Complaints with SLA | Customer + Owner | Cosmos DB + Azure Functions timer triggers |
| F13 | Coupons + promo codes | Customer | Cosmos DB; validation in Azure Function |
| F14 | Referral program | Customer | Cosmos DB |
| F15 | Loyalty program (tiers, points) | Customer | Cosmos DB; tier upgrade jobs in Azure Functions |
| F16 | Subscription (UC Plus equivalent) | Customer | Razorpay Subscriptions; Cosmos DB membership state |
| F17 | Native products marketplace | Customer | Cosmos DB catalog; manual inventory; Razorpay one-time |
| F18 | 15-min Instant Service | Customer + Tech | Standby pool flag in tech profile; ML dispatch favours instant-eligible techs |
| F19 | 30–60 min Instant Service | Customer + Tech | Same architecture as F18 |
| F20 | Multi-language UI | Customer + Tech | Flutter intl; translations cached on device |
| F21 | KYC (Aadhaar + PAN + selfie) | Tech | DigiLocker free Aadhaar consent flow + manual PAN OCR via Azure Form Recognizer free tier (500 pages/mo) |
| F22 | Skills + service area config | Tech | Cosmos DB |
| F23 | Availability scheduling | Tech | Cosmos DB |
| F24 | Job offer push (30-sec ACK) | Tech | FCM data message + Azure Function dispatcher with Redis-equivalent (Cosmos optimistic concurrency) |
| F25 | Maps nav handoff | Tech | Google Maps Platform |
| F26 | Photo upload (before/after) | Tech | Firebase Storage (5 GB free) |
| F27 | Wallet + earnings dashboard | Tech | Cosmos DB ledger |
| F28 | Weekly auto-payout | Backend | Razorpay Route + Azure Function weekly cron |
| F29 | Training portal | Tech | Videos in Firebase Storage / Azure Blob; quiz state in Cosmos |
| F30 | Skill certifications | Tech | Cosmos DB; admin-issued |
| F31 | Insurance per booking | Backend | Manual partnership initially; auto-claim flow Phase 2 |
| F32 | Health insurance enrolment | Tech | Manual partnership with Plum/Acko |
| F33 | Owner Live Ops dashboard | Owner | Azure Static Web App + Cosmos change feed for real-time |
| F34 | Owner Orders module | Owner | Azure Static Web App + Cosmos queries |
| F35 | Owner Technicians module | Owner | Azure Static Web App + Cosmos |
| F36 | Owner Customers module | Owner | Azure Static Web App + Cosmos |
| F37 | Owner Finance module | Owner | Azure Static Web App + Cosmos |
| F38 | Owner Complaints module | Owner | Azure Static Web App + Cosmos + Azure Functions timer |
| F39 | Owner Marketing module | Owner | FCM topic-based campaigns + Azure Functions |
| F40 | Owner Catalogue module | Owner | Azure Static Web App + Cosmos |
| F41 | Owner Subscription module | Owner | Azure Static Web App + Cosmos |
| F42 | Owner Native Products module | Owner | Azure Static Web App + Cosmos |
| F43 | Owner B2B module | Owner | Azure Static Web App + Cosmos |
| F44 | Owner Multi-city module | Owner | Azure Static Web App + Cosmos partition by city |
| F45 | Owner Analytics module | Owner | Cosmos DB + Azure Synapse Link (free tier) for analytics queries |
| F46 | Audit log | All | Cosmos DB append-only collection |
| F47 | RBAC | Owner | Azure AD B2C (50K MAU free) or Firebase Auth custom claims |
| F48 | ML dispatch ranking | Backend | Azure ML free tier; train monthly on historical data |
| F49 | Demand prediction | Backend | Azure ML free tier |
| F50 | Dynamic pricing | Backend | Rule-based initially (free), ML in Phase 3 |
| F51 | Fraud detection | Backend | Rule-based + Azure Cognitive Services Anomaly Detector free tier |
| F52 | Recommendation engine | Customer | Cosmos DB collaborative filtering job (Azure Function batch) |
| F53 | Compliance (aggregator levy, state laws) | Backend | Azure Function quarterly remittance jobs |
| F54 | DPDP compliance | All | Data residency in Azure India regions; consent flows in apps |
| F55 | WhatsApp chatbot booking | Customer | Meta WhatsApp Cloud API direct (1000 service conversations/mo free) — Phase 3 |
| F56 | B2B portal | Enterprise | Azure Static Web App; Cosmos DB enterprise account schema |
| F57 | Gift cards | Customer | Cosmos DB; Razorpay redemption flow |
| F58 | Corporate gifting | Enterprise | B2B portal extension |

---

## 9. Non-Functional Requirements

### 9.1 Zero-Cost Infrastructure (the binding constraint)

**Target:** ₹0/month operational infra at pilot scale (≤5,000 bookings/mo). **<₹50,000/month at full scale (50,000 bookings/mo).**

#### Service stack

| Concern | Service | Free Tier | Paid trigger |
|---|---|---|---|
| Backend compute | **Azure Functions (Consumption plan)** | 1M executions + 400k GB-sec/mo | ~30k execs at 1k bookings → free; ~3M at 50k bookings → pay |
| Database | **Azure Cosmos DB (Serverless)** | 1000 RU/s + 25 GB free forever | Geo + KV + queries fit in 25 GB up to ~200k orders cumulative |
| Real-time / messaging spine | **FCM (Firebase Cloud Messaging)** | Unlimited free, always | Never |
| Auth | **Firebase Phone Auth + Truecaller SDK + Google Sign-In** | Truecaller free unlimited; Phone Auth ~$0.06/SMS but used <100/mo at steady state | Steady state ~₹400/mo even paid; aim ₹0 with Truecaller-first |
| Photo storage | **Firebase Storage** | 5 GB + 1 GB/day download free | ~1 GB/year accumulating → free for years |
| Web admin hosting | **Azure Static Web Apps** | 100 GB bandwidth/mo free | Won't hit |
| Geo (nearest tech) | **Cosmos DB geospatial indexing** | Included | Free |
| Maps | **Google Maps Platform** | $200/mo recurring credit | Pilot ~$50–100/mo → free; 50k bookings → paid |
| Payments | **Razorpay** | ₹0 onboarding | 2% on GMV (deducted from txn, not pocket cost) |
| Email | **Azure Communication Services (Email)** | 100 emails/day free | Sufficient for transactional |
| Background checks | **DigiLocker (Govt of India)** | Free Aadhaar consent | Free |
| Analytics + product analytics | **PostHog Cloud free tier** | 1M events/mo free | Won't hit at pilot |
| Error monitoring | **Sentry free** | 5k errors/mo free | Won't hit |
| ML | **Azure ML** | Compute: 8 hours/mo free DSVM; Studio: free | Sufficient for monthly model training |
| Form OCR (PAN, etc.) | **Azure Form Recognizer** | 500 pages/mo free | Sufficient for pilot KYC |
| Translation | **Azure Translator** | 2M chars/mo free | Sufficient for app strings |
| Anomaly detection | **Azure Anomaly Detector** | 20K txn/mo free | Fraud detection — fits |
| CDN | **Azure CDN Standard** OR Cloudflare free | Generous free tier | Free |
| CI/CD | **GitHub Actions** | 2000 mins/mo free | Sufficient |
| Domain | Custom `.in` (₹500/yr) OR `*.azurestaticapps.net` (free) | — | ₹85/mo if custom |

#### Architectural choices forced by ₹0 constraint

1. **No persistent WebSocket connections** for tech app. Use FCM data messages for dispatch instead. Tech app opens HTTP connection only when interacting; otherwise idle (no socket cost).
2. **No SMS for status updates.** All booking lifecycle messages go via FCM push. Customers without push permission get an in-app notification badge on next open.
3. **No paid WhatsApp Business API at launch.** Use Meta WhatsApp Cloud API direct (1000 free service conversations/mo) for Phase 3, capped at 1 conversation per booking.
4. **Cosmos DB serverless** instead of provisioned RU/s (no idle billing).
5. **Azure Functions consumption plan** instead of always-on App Service (no idle billing).
6. **Static Web Apps** for owner admin (no server cost).
7. **DigiLocker Aadhaar verification** instead of paid KYC providers (free, government-backed).
8. **Azure Form Recognizer free tier** for PAN OCR (500 pages/mo).
9. **PostHog Cloud free** instead of paid analytics.
10. **Authentication strategy:** Truecaller SDK (95% Android coverage in India, free) → Google Sign-In (free) → Firebase Phone Auth OTP (last resort, ~5 SMS/mo at steady state ≈ ₹0).
11. **Persistent session** with Firebase Auth refresh tokens (long expiry, biometric re-auth on sensitive ops) so no re-OTP flow.
12. **Photo compression** on device before upload (reduces Firebase Storage and bandwidth).
13. **Aggressive caching** — service catalog, translations, geocoding results cached on device + edge (Cloudflare free).
14. **Cron-only ML** — train ranking models monthly via Azure ML 8-hr/mo free tier; serve via Azure Function lookup.
15. **Cosmos change feed → Azure Function** for real-time owner dashboard updates (no need for SignalR paid).

#### Free-tier ceilings (when we'll outgrow)

| Service | Ceiling | Estimated bookings/mo at ceiling | Migration path |
|---|---|---|---|
| Cosmos DB free (1000 RU/s, 25 GB) | ~50k bookings/mo before RU/s exhausts | 50k | Switch to provisioned 4000 RU/s ~₹15k/mo |
| Azure Functions (1M execs) | ~50k bookings/mo @ 20 execs each | 50k | Consumption usage-billed (~₹0.20 per million) — cheap |
| Firebase Storage (5 GB) | ~5 years of photos at 1k bookings/mo | — | $0.026/GB/mo when exceeded — negligible |
| Google Maps ($200/mo credit) | ~25k bookings/mo before exhausting credit | 25k | $0.005/call after — moderate (~₹5–15k/mo at 50k) |
| Form Recognizer (500/mo) | ~500 KYCs/mo | — | $1 per 1000 pages after — negligible |
| FCM | Truly unlimited | — | Never |
| Truecaller SDK | Truly unlimited | — | Never |

**Bottom line:** stays ₹0/month through approximately **5,000 bookings/month**, drifts to ~₹15,000/month at 25,000 bookings, and reaches ~₹50,000/month at 50,000 bookings. Past that, optimization or paid tier upgrades trigger but per-booking infra cost stays under ₹2.

### 9.2 Performance

- API p95 latency < 500 ms
- Auto-dispatch decision < 2 seconds end-to-end (booking → first FCM push to tech)
- Customer app cold start < 3 seconds on mid-range Android (₹15k phone)
- Live tracking update frequency: 10–30 seconds (FCM-pushed)

### 9.3 Scale

- 50,000 bookings/month sustained at full scale
- 5,000 concurrent active customers (browsing/booking)
- 5,000 active technicians simultaneously (location reporting)
- 5+ cities

### 9.4 Reliability

- 99.5% uptime target (Cosmos DB and Azure Functions both meet this on free tier)
- Daily backups (Cosmos DB has 7-day continuous backup free)
- Disaster recovery: documented runbook; cross-region restore tested quarterly

### 9.5 Security

- All data in transit TLS 1.2+
- All data at rest encrypted (Azure default)
- PII minimization (collect only what's needed)
- Aadhaar number NEVER stored on our servers (DigiLocker tokenized verification only)
- Razorpay handles all card data (PCI scope offloaded)
- RBAC with least-privilege on owner admin
- Audit log immutable (append-only, non-deletable)
- Annual penetration test (Phase 2 onwards)

### 9.6 Compliance

- **DPDP Act 2023** (India data privacy) — consent flows, data residency in Azure India regions
- **Karnataka Platform Workers Act 2025** — right-to-refuse without ranking penalty; welfare board contributions
- **Rajasthan / Bihar / Jharkhand state acts** — registration + welfare contributions when expanding to those states
- **Central Social Security Code 2025 rules** — 1–2% aggregator levy auto-calculated + remitted quarterly
- **GST** — registered, e-invoicing automated for B2B
- **DGCA / state-specific health & safety** — beauty/wellness category specific
- **Cyber Security (Reasonable Security Practices) under IT Act**

### 9.7 Localisation

- Hindi, English, Tamil, Bengali, Marathi, Telugu UI
- Currency formatting: ₹ with Indian numbering (lakhs/crores)
- Date/time: Indian timezone, 12-hour format
- RTL support: not required (India)

### 9.8 Accessibility

- WCAG 2.1 AA target
- Large-font mode for senior users (Persona 2)
- Screen reader compatible
- Voice booking option (Phase 3)

### 9.9 Observability

- Structured logs to Azure Application Insights (5 GB/mo free)
- Sentry for error tracking
- PostHog for product analytics
- Custom owner dashboard for business KPIs

---

## 10. Constraints & Assumptions

### Constraints

- **Solo founder build** with Claude Code as paired dev; no engineering team initially.
- **₹0/month infra cost** at pilot scale is non-negotiable.
- **Android-first** (iOS in Phase 2).
- **Single city pilot** before any multi-city build.
- **Razorpay** as exclusive payment gateway initially (no Stripe/Paytm/PhonePe direct).
- **Flutter** for both mobile apps (one codebase).
- **Cosmos DB serverless** as system of record (Postgres ruled out due to free-tier limits in Azure).

### Assumptions

- Founder commits 4–6 hours/day for 12 months to the build.
- Pilot city has ≥ 2 lakh middle-class households (Bengaluru / Pune / Hyderabad / Gurgaon / Mumbai / Chennai / Delhi).
- 50–100 vendors can be recruited in pilot city in first 4 weeks via direct outreach.
- Working capital of ₹15–20 lakh available for tech payouts before Razorpay T+2 settlement.
- Marketing budget of ₹5–10 lakh available for first 3 months of public launch.
- Insurance partnership with ICICI Lombard / Bajaj Allianz / Acko can be secured at 1–2% of GMV.
- DigiLocker Aadhaar verification will continue to be free.
- Firebase Spark/Blaze and Azure free tiers will not be reduced in 2026–2027.
- Truecaller SDK availability remains unrestricted.
- Razorpay Route remains available for split-payments at current pricing.

---

## 11. Strategic Differentiation (vs Urban Company)

| Dimension | Urban Company | Our Approach |
|---|---|---|
| **Take rate** | 28% (sliding) | 22–25% (vendor-friendly wedge) |
| **Dispatch transparency** | Algorithmic black box; 4.8★ rating threshold; ID-blocking on protest | Karnataka right-to-refuse compliant from day 1; ranking algorithm published; no penalty for declines |
| **Geographic strategy** | 30+ cities thinly | 1 city deeply, then 5 cities, then more |
| **Customer NPS** | 1.4★ on PissedConsumer | Designed for higher-touch support; SLA-tracked complaints |
| **Build cost / capital efficiency** | Hundreds of crores of VC | ₹0 build (founder + AI), ₹0/mo infra |
| **Tech welfare** | Reactive (post-2026 protests) | Proactive — health insurance + dignity programs from launch |
| **Owner control** | Centralized algorithmic, opaque to ops | Full real-time visibility + override authority |
| **Native products** | Strong (RO, smart locks, ACs) | Phase 2 — leverage same tech base for product attach |
| **15-min Instant Service** | InstaHelp (loss-making) | Same model but priced to break-even from day 1 |

---

## 12. Visual Design & UI/UX Strategy

**Design Ambition:** World-class. Match or exceed Airbnb / Uber / Stripe-tier polish. Beat Urban Company on every visible dimension. **This is the single most visible customer-facing differentiator** — service quality takes one booking to prove, but design quality is judged in the first 5 seconds.

### 12.1 Why design is strategic, not cosmetic

- UC's 1.4★ PissedConsumer rating signals a trust gap. Premium visual polish *bridges* that gap before service execution begins.
- Indian consumers are now design-literate (post-Zomato / Swiggy / CRED / Cult.fit). Premium-LTV customers (₹50k+/year) judge platforms on design quality first, features second.
- A solo founder can't out-feature UC immediately, but **can out-design** them — design is the highest-leverage solo wedge.

### 12.2 Design principles (non-negotiable forcing functions)

1. **Clarity over density.** UC's home screen has 30+ CTAs competing. We default to 1 hero action per screen.
2. **3-tap booking max.** Category → Service → Confirm. Anything else is failure.
3. **Photography over icons.** Full-bleed service imagery, commissioned in pilot city — never stock.
4. **Generous whitespace.** 8pt grid, ~2× UC's spacing.
5. **Single accent colour + neutrals.** Restrained palette; one bold brand accent.
6. **Variable typography.** One sans-serif (Geist or Inter — both free, variable). Extremes of weight/size carry hierarchy.
7. **Motion as feedback.** 200ms spring physics on every interaction. Never gratuitous.
8. **Skeleton screens, never spinners.** Every loading state is purposeful.
9. **Bespoke empty states.** Custom illustration + clear next action; never "no data".
10. **Honest errors.** Always actionable, never blame the user.
11. **Localised typographic scale.** Hindi/Tamil/Bengali tested for line-height + ascender clearance from day 1.
12. **Dark mode first-class.** Not an afterthought.

### 12.3 Design references (curated)

| App | What we steal |
|---|---|
| **Airbnb** | Booking flow, large hospitality imagery, trust UI patterns |
| **Uber** | Live tracking map, real-time status transitions, driver profile |
| **Stripe Dashboard** | Owner admin information density done elegantly |
| **Linear** | Keyboard-driven speed, restraint, micro-interactions |
| **CRED** | Indian premium aesthetic, motion polish, fintech-tier trust |
| **Notion** | Empty states, onboarding warmth |
| **DoorDash / Zomato** | Multi-vendor marketplace browsing UX |
| **Cult.fit** | Indian wellness/services visual language |
| **Headspace** | Calm color, service-as-care emotional tone |

### 12.4 Toolchain & process (the recommended stack)

| Stage | Tool / Skill | Role |
|---|---|---|
| Visual identity (logo, palette, type) | Freelancer (Toptal / 99designs, ₹15–40k) | One-time brand creation |
| Design system + tokens | **Figma** with Variables | Single source of truth for colors, type, spacing, motion |
| Component library | Figma + **`figma:figma-generate-library` Skill** | Build production-grade Figma library |
| Design system rules | **`figma:figma-create-design-system-rules` Skill** | Project-specific Figma↔code conventions |
| Screen design | Figma + AI tools (Galileo AI, Magic Patterns) for exploration | Initial layout exploration |
| Code generation (Flutter mobile) | **`figma:figma-implement-design` Skill** | 1:1 Figma → Flutter widget translation |
| Code generation (web admin) | **`frontend-design:frontend-design` Skill** | High-quality, distinctive React/Next.js UI — explicitly avoids generic AI aesthetic |
| Bidirectional sync | **`figma:figma-code-connect` Skill** | Map Figma components to code, keep them in sync |
| Push designs back to Figma | **`figma:figma-generate-design` Skill** | When code evolves ahead of design, sync back |
| Iconography | **Phosphor Icons** OR **Lucide** | Free, consistent, customisable |
| Illustration | Bespoke set via Dribbble/Iconscout freelancer (₹20–50k) | Empty states + onboarding |
| Photography | Commissioned in pilot city (₹50k–1L for 50–100 shots) | Hero imagery — never stock |
| Motion / animation | Lottie + Rive (both free) | Lottie for micro-interactions, Rive for richer state machines |
| Prototyping | Figma prototype mode + **Maestro** for Flutter testing | Validate flows before code |
| User testing | Maze (free tier) / UserTesting.com / 5-user RWA in-person | Qualitative validation before public launch |

**Recommended primary stack for this project:**
- **`figma:figma-implement-design`** for the Flutter customer + tech apps (handles 1:1 Figma → code with high visual fidelity)
- **`frontend-design:frontend-design`** for the owner web admin (its core purpose is producing distinctive, polished UI that doesn't look AI-generated)
- **`figma:figma-create-design-system-rules`** to establish project-wide design conventions
- **`figma:figma-generate-library`** to build the canonical Figma library that everything else references

### 12.5 Beating Urban Company on every visible dimension

| Dimension | UC current | Our target |
|---|---|---|
| Home screen CTAs | 30+ competing | 1 hero CTA + curated personalised list |
| Taps to first booking | 7+ | ≤ 3 |
| Service detail page | Wall of text, hidden price | Visual price breakdown, full-bleed hero, includes/excludes infographic |
| Live tracking | Basic map | Cinematic Uber-tier UX — tech profile card, ETA pill, voice update option |
| Empty states | Generic "no data" | Bespoke illustration + clear next action |
| Loading states | Spinners | Skeleton screens with shimmer |
| Error messages | Technical jargon | Plain language + recovery CTA |
| Notification design | Text-heavy | Rich notifications with action buttons + image |
| Receipt | PDF afterthought | Beautiful in-app + email + WhatsApp share |
| Tech profile screen | Tiny photo + name | Full-hero photo + verified badge + reviews + portfolio gallery |
| Customer support entry | Hidden 4 taps deep | Always 1 tap from any screen |
| Onboarding flow | Form-heavy | Progressive, conversational, never feels like a form |
| Hindi/regional language | Bolted on | First-class — type tested, not just translated |
| Dark mode | Inconsistent | Pixel-perfect, designed in parallel |
| Micro-interactions | None | Every state change has 200ms spring feedback |
| Photography | Stock | Custom commissioned in pilot city |

### 12.6 Visual identity (TBD — open questions)

- **Brand name** — recommend brainstorming 8–10 candidates with `.in` and `.com` availability check (open question Q1)
- **Logo** — commission via 99designs (₹15k) or Toptal (₹30k+) once brand name is locked
- **Color palette** — direction: warm neutral base + bold single accent. Avoid UC's red. Inspirations: CRED's deep teal, Airbnb's coral, Stripe's indigo, Notion's monochrome
- **Typography** — Geist (free, variable, modern) OR Inter (free, broadest support). Both Latin + Devanagari support solid
- **Iconography** — Phosphor Icons (free, 6000+ icons, multiple weights)
- **Illustration style** — flat with subtle gradients, warm humanistic palette, Indian context (sari, chai, society apartments — not generic Western tropes)

### 12.7 Measurable design outcomes

| Metric | Target | UC current |
|---|---|---|
| App Store / Play Store rating | ≥ 4.6★ | ~4.2★ |
| Time-to-first-booking (new user) | ≤ 90 seconds | unknown, estimated 3+ minutes |
| Booking completion rate | ≥ 80% | ~65% (industry estimate) |
| Customer NPS | ≥ 65 | ~0 or negative (per PissedConsumer signal) |
| Design system Figma library coverage | ≥ 95% of screens use library components | n/a |
| Accessibility (WCAG 2.1 AA) | 100% AA compliant | unknown |
| Dark mode parity | 100% screens | partial |

### 12.8 Design risks & mitigations

| Risk | Mitigation |
|---|---|
| Design lags dev → ugly screens ship | Design 2 weeks ahead of dev for each phase |
| Founder isn't a designer | Hire freelance designer for visual identity + initial Figma library (₹40–80k one-time); AI design skills handle screen-level work |
| Translation breaks layouts | Design with Hindi/Tamil max-length strings tested in Figma |
| Scope creep on motion / micro-interactions | Strict "200ms or less" rule; defer richer Rive animations to Phase 4 |
| Custom photoshoot delays launch | Curated stock for v1.0, custom shoot in parallel for v1.1 |

### 12.9 Design milestones aligned to roadmap

| Phase | Design deliverables |
|---|---|
| Pre-MVP (Weeks 1–2) | Brand name + logo + color/type + Figma design system v1 + 5 hero screen designs |
| MVP (Months 1–3) | Full Flutter customer + tech app screens; basic owner admin UI |
| Trust+ (Month 4) | Reviews/complaints UI polish, onboarding flow A/B variants |
| Growth (Months 5–6) | InstaHelp UX, coupon/referral flows, advanced analytics dashboards |
| Subscription + Products (Months 7–8) | UC Plus subscription experience, product marketplace UI (heavy lift — ecommerce-grade) |
| iOS + B2B + Languages (Months 9–10) | iOS-native interaction patterns, Hindi/Tamil/Bengali type test, B2B portal UI |
| Multi-city + ML (Months 11–12) | Multi-city brand consistency, ML-driven personalisation surfaces |

---

## 13. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Free-tier limits raised/reduced by cloud vendors | Low | High | Architecture documented for migration; quarterly free-tier audit; ₹50k/mo paid budget standby |
| R2 | Vendor liquidity collapse in pilot city | Medium | High | Recruit 100+ before launch; weekly 1-on-1s; fair commission |
| R3 | Working capital squeeze (Razorpay T+2 vs weekly payouts) | High | Medium | ₹15–20 lakh standby line earmarked; consider Razorpay instant settlement at higher fee |
| R4 | Quality variance — bad tech kills brand | High | High | Mandatory skill test + first 3 jobs supervised; auto-pause below 3.5★ |
| R5 | Marketing CAC too high | Medium | High | RWA tie-ups, society WhatsApp groups, referrals before paid ads |
| R6 | UC retaliates with predatory pricing | Low | Medium | Differentiate on vendor experience, not customer price |
| R7 | Regulatory non-compliance (Karnataka, central levy) | High | High | Compliance built into dispatch + payout from day 1; quarterly legal review |
| R8 | Founder burnout (solo build for 12 months) | High | High | Phased timeline; honest scope management; willing to delay non-MVP features |
| R9 | Claude Code / BMAD workflow breaking down on complex tasks | Medium | Medium | Decompose to small stories (BMAD method); manual fallback for hardest parts |
| R10 | Truecaller SDK approval rejection | Low | Medium | Fallback to Firebase Phone Auth (~₹400/mo at 100 SMS) |
| R11 | DigiLocker Aadhaar consent UX too friction-heavy | Medium | Medium | Manual KYC review fallback for first 100 techs |
| R12 | Cosmos DB 25 GB ceiling hit faster than expected | Medium | Medium | Photo + chat moved to Firebase Storage; archive old orders to cold storage |

---

## 14. Phased Roadmap (founder-built timeline)

### MVP (Months 1–3) — "Walking skeleton"

**Goal:** First 100 paid bookings in pilot city.

- Customer Android app (basic)
- Tech Android app (basic)
- Owner web admin (orders + techs + basic finance)
- 5 categories, 1 city
- Auto-dispatch (Cosmos geo + FCM push)
- Razorpay payment + manual payouts (Route in Phase 2)
- One-time OTP auth + persistent session
- FCM push for all status updates
- Cosmos DB serverless
- Azure Functions backend

### Phase 2 — Trust+ (Month 4)

- Reviews + ratings (both-way)
- Complaints with SLA
- DigiLocker KYC automation
- Insurance integration (manual partnership)
- Razorpay Route auto-split + weekly payouts
- Audit log

### Phase 3 — Growth (Months 5–6)

- Coupons + promo codes
- Referral program
- Loyalty program (tiers, points)
- 15-min Instant Service (UC InstaHelp equivalent)
- 30-60 min Instant Service (UC Instant equivalent)
- Customer in-app chat
- Marketing campaigns (FCM topic-based push)
- Analytics module
- Multi-language UI (Hindi + English)

### Phase 4 — Subscription + Products (Months 7–8)

- UC Plus equivalent subscription
- Native products marketplace
- Recommendation engine (basic collaborative filtering)
- WhatsApp chatbot booking (Meta Cloud API free tier)

### Phase 5 — iOS + B2B + Languages (Months 9–10)

- iOS apps (Customer + Tech)
- B2B portal (society/corporate accounts)
- Tamil, Bengali, Marathi, Telugu UI
- Web PWA for customer
- Gift cards + corporate gifting

### Phase 6 — Multi-city + ML (Months 11–12)

- 4 additional cities
- ML-based dispatch ranking
- Demand prediction
- Dynamic pricing (rule-based v1)
- Fraud detection
- Tech training portal (videos + certifications)
- Health insurance enrolment for techs

### Post-launch (Year 2+)

- International expansion (UAE, Saudi, Singapore — like UC)
- Advanced ML (deep learning dispatch, personalisation)
- AR-based diagnostics (scan AC, get repair quote)
- Voice booking
- Smart-home device integration
- Franchise model

---

## 15. Stakeholders

| Stakeholder | Interest | Influence | Engagement |
|---|---|---|---|
| Founder (Alok) | Build success, capital efficiency | Maximum | Drives all decisions |
| Client (financier) | ROI, vendor management, marketing | High | Weekly reviews + monthly P&L |
| Pilot city vendors | Fair earnings, steady work | High | Weekly 1-on-1s in first 6 months |
| Pilot city customers | Trust, convenience, value | Medium | NPS surveys + complaint reviews |
| Razorpay | Account health, transaction volume | Medium | Quarterly relationship review |
| Insurance partner | Loss ratio | Medium | Quarterly claim review |
| Compliance (legal) | Karnataka + central regulators | High | Quarterly compliance audit |
| Claude Code / BMAD | Tooling stability | Low | Use as-is; flag issues |

---

## 16. Open Questions

1. **Brand name + domain** — TBD. Options to brainstorm: avoid UC-clone naming; suggest 5 names with .in availability.
2. **Pilot city** — Bengaluru (Karnataka law) vs Pune vs Gurgaon vs Hyderabad. Each has different pros (vendor density, RWA culture, regulatory exposure).
3. **Initial 5 categories** — recommend AC repair, plumbing, electrical, deep cleaning, pest control. Confirm.
4. **Founder time commitment** — confirmed 4–6 hours/day for 12 months?
5. **Working capital source** — client-funded or external?
6. **Insurance partner** — to be selected (ICICI Lombard / Bajaj / Acko).
7. **Truecaller SDK partnership** — needs application + approval; ~2 weeks lead time.
8. **DigiLocker integration** — needs partner registration (free but bureaucratic).
9. **Marketing budget for pilot** — ₹5 lakh / ₹10 lakh / other?
10. **Brand visual identity** — logo, color, font — when needed?
11. **Multi-city expansion order** — which cities after pilot? Bengaluru → Pune → Hyderabad → Mumbai → Delhi NCR (suggested)?
12. **B2B account manager hire** — when/by Phase 5?

---

## 17. Next BMAD Steps

| Step | BMAD skill | Output |
|---|---|---|
| 1 | (this document) | Product Brief ✅ |
| 2 | `bmad-create-prd` | Detailed PRD per feature group |
| 3 | `bmad-create-architecture` | Technical architecture (Azure + Firebase free-tier blueprint) |
| 4 | `bmad-create-ux-design` | Screen flows + design system |
| 5 | `bmad-create-epics-and-stories` | Buildable epics → stories |
| 6 | `bmad-sprint-planning` | Sequenced sprints |
| 7 | `bmad-create-story` → `bmad-dev-story` (loop) | Per-story dev with Claude Code |

---

**End of Product Brief v1.0**
