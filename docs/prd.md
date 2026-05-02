---
stepsCompleted:
  - 'step-01-init'
  - 'step-02-discovery'
  - 'step-02b-vision'
  - 'step-02c-executive-summary'
  - 'step-03-success'
  - 'step-04-journeys'
  - 'step-05-domain'
  - 'step-06-innovation'
  - 'step-07-project-type'
  - 'step-08-scoping'
  - 'step-09-functional'
  - 'step-10-nonfunctional'
  - 'step-11-polish'
  - 'step-12-complete'
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief.md'
  - 'docs/brainstorm.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-04-17-2349.md'
  - 'CLAUDE.md'
workflowType: 'prd'
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 2
  projectDocs: 1
project_name: 'homeservices-mvp'
classification:
  projectType: 'multi-surface-marketplace (mobile_app primary + saas_b2b admin + api_backend)'
  domain: 'home-services-marketplace / indian-gig-economy'
  complexity: 'high'
  projectContext: 'greenfield'
  domainConcerns:
    - 'Karnataka Platform Workers Act 2025 (right-to-refuse, welfare board)'
    - 'Central Social Security Code 2025 (1–2% aggregator levy)'
    - 'DPDP Act 2023 (India data residency, consent flows)'
    - 'GST e-invoicing for B2B'
    - 'Razorpay / RBI payment compliance'
    - 'Two-sided rating integrity'
    - 'Gig worker welfare / social security'
---

# Product Requirements Document — homeservices-mvp

**Author:** Alok Tiwari
**Date:** 2026-04-17
**PM:** John (BMAD PM persona)
**BMAD Phase:** 2 — PRD
**Status:** Draft v0.1 (in progress)

---

## Executive Summary

homeservices-mvp is a three-app home-services marketplace for India — Customer Android + Technician Android + Owner web admin — replicating Urban Company's core booking loop (customer request → nearest qualified technician → FCM notification to owner → owner receives payment → owner settles technician with commission) at small scale (one city pilot) with two non-negotiable differentiators: **(a) impeccable UI/UX at Airbnb/CRED tier to beat UC's 1.4★ customer experience, and (b) fair vendor economics (22–25% commission vs UC's 28%) with transparent right-to-refuse-compliant dispatch architecture (defensive against Karnataka Platform Workers Act + future state extensions; no decline-derived ranking) to attract UC's discontented technicians post-Jan/Feb 2026 protests.**

The platform is built solo by the founder using BMAD + Claude Code on Firebase + Azure free tiers (FCM as universal messaging spine, Cosmos DB Serverless, Azure Functions, Firebase Auth with one-time OTP + persistent device session). Operational infrastructure cost is targeted at **₹0/month at pilot scale (≤5,000 bookings/mo)** and ceilings at **≤₹50,000/month at full scale (50,000+ bookings/mo)** — enabling unit-economic viability that public-company UC cannot match.

**Target users:** (1) Premium-LTV urban customers (Persona Riya — convenience-first, trust-first, Hindi-prominent, Ayodhya/UP rural-town resident booking 1–3×/month, mid-income household, sub-₹10k Android primary device), (2) Ambitious independent technicians (Persona Suresh — ITI-certified, currently burnt by UC's 28% commission and opaque dispatch, seeking fair deal + career progression), (3) Solo founder-operator (Persona Alokt — needs full real-time visibility + override authority + audit trail + low-touch automation).

**Problem being solved:** Fragmented, opaque, untrustworthy home services marketplace in India. Unorganised sector (99% of the ₹5.1 lakh crore TAM) is cheap but unreliable. Organised (UC) is reliable-on-paper but suffers catastrophic customer NPS (1.4★) and partner antagonism (nationwide 2026 protests). Neither serves the premium-LTV customer or career-minded technician well.

**Business model:** Customer pays owner via Razorpay; owner takes 22–25% commission; Razorpay Route auto-splits balance to technician's linked bank account; weekly or flexible-cadence payouts. Zero paid SaaS dependencies. GST-compliant from day one.

### What Makes This Special

**Three simultaneous non-obvious advantages** that no current competitor can replicate simultaneously:

1. **Impossible economics via solo AI build.** No existing or incoming competitor can match our cost structure. A solo founder + Claude Code building UC-parity-class software at ₹0 cash burn and ₹0 recurring infra is a new category that didn't exist in 2024. Multi-city burn-funded competitors will continue to lose money per booking; we will not.

2. **Vendor-friendliness as strategic wedge, not afterthought.** Every design decision — 22–25% commission ladder, Karnataka-compliant right-to-refuse-without-penalty dispatch, written customer-feedback visibility to techs, both-way ratings with tech-initiated abusive-customer reports, transparent pre-acceptance earnings previews, flexible payout cadence (weekly/next-day/instant) — prioritises technician retention. UC's 28% + opaque dispatch + ID-blocking of dissenters created the opening; we walk through it.

3. **UX as the primary customer wedge.** UC at 1.4★ PissedConsumer rating is a gift. Airbnb-tier trust dossiers per tech, Zomato-tier granular live tracking, fixed-price menus with transparent variable add-ons, photo-first service browsing, 7-day fix warranty surfaced pre-booking, tech no-show guarantees with automatic ₹500 credit, 60-second insurance claims, rating shield for pre-review dispute resolution, discreet safety SOS for women customers — collectively this is Airbnb/CRED-tier polish applied to home services, which has not happened in India before.

**Core insight:** Urban Company's post-IPO public-market discipline constrains its commission-reduction headroom, its multi-city sprawl dilutes per-city operational excellence, and its catastrophic customer NPS + vendor antagonism have opened a narrow window. A disciplined solo operator in one city, with better economics for *all three sides* (customer / technician / owner) than UC offers any single side, can capture the premium segment before a well-funded fast-follower emerges. The AI-augmented build + free-tier infra make this window accessible to a solo founder for the first time.

**Why now:** (1) Central Social Security Code 2025 rules (notified Dec 2025) + Karnataka Platform Workers Act 2025 (in force May 2025) formalise platform gig work — making informal local competitors less viable; (2) AI-augmented solo development is now genuinely productive for this scope (BMAD + Claude Code on Kotlin + Next.js + Node); (3) Firebase + Azure free tier maturity make ₹0 infra at pilot scale realistic; (4) UC's 2026 protest fallout + Q3 FY26 InstaHelp ₹61 cr EBITDA loss have created the competitive window.

## Project Classification

- **Project type:** Multi-surface marketplace — primary: `mobile_app` (two Kotlin + Jetpack Compose Android apps: customer-app, technician-app); secondary: `saas_b2b` (Next.js 15 + TypeScript owner web admin); backend: `api_backend` (Node 22 + TypeScript on Azure Functions). Single-platform pilot (Android + Web); iOS deferred to Phase 5 (post-MVP).
- **Domain:** Home-services marketplace / Indian gig-platform economy. Adjacent concerns from fintech (payment flows, KYC), insurance (liability cover per booking), legaltech (labour-code compliance).
- **Complexity:** HIGH.
  - Regulatory: Karnataka Platform Workers Act 2025 (right-to-refuse-without-penalty, welfare board contributions), Central Social Security Code 2025 (1–2% aggregator levy), DPDP Act 2023 (India data residency, consent), GST e-invoicing, Razorpay + RBI compliance, state-level welfare boards if multi-city.
  - Two-sided marketplace: customer + technician mutual trust, rating integrity, dispute resolution with SLA, insurance integration.
  - Real-time geo-dispatch: nearest-tech matching via Cosmos DB geospatial + FCM push with ACK window, Redis-equivalent optimistic concurrency for first-to-accept.
  - Payment + payout infrastructure: Razorpay Route split-payment, multi-cadence payouts, wallet ledger per technician, weekly GST output register.
- **Project context:** GREENFIELD. No existing codebase. Agency templates (client-baseline-android, client-baseline-nextjs, client-baseline-node) scaffolded into monorepo subdirectories in Phase 0. Product brief + BMAD Phase 1 brainstorm (91 ideas → 25-feature MVP cut + 20 open questions + 28 locked decisions) pre-completed.

---

## Success Criteria

### User Success

**Customer-side metrics:**

| Metric | MVP Target | Phase 2 Target |
|---|---|---|
| Time to first completed booking (new user) | ≤ 90 s | ≤ 60 s |
| Booking completion rate (started → paid) | ≥ 80% | ≥ 90% |
| Customer 60-day repeat rate | ≥ 35% | ≥ 50% |
| Average booking-level rating | ≥ 4.5★ | ≥ 4.7★ |
| Play Store rating | ≥ 4.6★ | ≥ 4.8★ |
| Complaint resolution SLA met | ≥ 90% < 24 hrs | ≥ 95% |
| Customer NPS | ≥ 65 | ≥ 75 |
| Tech no-show incidents | ≤ 2% bookings | ≤ 0.5% |

**Technician-side metrics:**

| Metric | MVP Target | Phase 2 Target |
|---|---|---|
| Onboarding time (OTP → first offer) | ≤ 7 days | ≤ 3 days |
| Avg in-hand monthly earnings (active FT) | ≥ ₹35,000 | ≥ ₹45,000 |
| 90-day retention | ≥ 60% | ≥ 75% |
| Written feedback visibility (<5★ ratings) | 100% | 100% |
| Abusive-customer reports resolved < 48 hrs | ≥ 95% | ≥ 98% |
| Rating appeal upheld-for-tech rate (when evidence provided) | ≥ 80% | ≥ 85% |

**Mutual-respect metrics:**

- Dispatch acceptance within 30 s: ≥ 70% MVP / ≥ 85% Phase 2
- Mutual rating completion rate: ≥ 80% MVP / ≥ 90% Phase 2
- Tech-decline-without-penalty compliance: 100% (architecturally enforced; Karnataka Platform Workers Act)

### Business Success

**Pilot phase (6 months post-launch):**

| Metric | Target | Rationale |
|---|---|---|
| Bookings / month | 5,000 | Break-even at 22% commission + ₹0 infra |
| Contribution margin / booking | Positive | After tech payout + gateway + infra share + CAC |
| Take rate (blended) | 22–25% | Starts 22%; ladders to 25% at 50-job-per-tech milestone |
| LTV:CAC ratio | ≥ 3:1 by month 6 | Sustainable growth floor |
| Infra cost | ₹0 / month | Hard constraint |
| Active vendors | 200–500 | Pilot city |
| Active categories | 5 | AC repair, water pump / borewell, plumbing, electrical, RO / water purifier |

**Growth phase (12-month horizon):**

| Metric | Target |
|---|---|
| Bookings / month | 50,000+ |
| Active cities | 5+ |
| Annual GMV trajectory | ₹50 crore+ |
| Infra cost | < ₹50,000 / month |
| Tech retention (multi-city) | ≥ 80% |

**Infra cost ceiling (any phase):** free-tier-eligible at ≤ 5,000 bookings/month. Any paid-tier migration requires ADR + owner approval.

### Technical Success

**Performance SLOs:**

| Endpoint Class | p50 | p95 | p99 |
|---|---|---|---|
| Read API (catalog, orders list, profile) | < 200 ms | < 500 ms | < 1 s |
| Write API (booking create, rating submit) | < 300 ms | < 800 ms | < 1.5 s |
| Real-time dispatch (booking → first FCM push) | < 1 s | < 2 s | < 3 s |
| FCM data message delivery | < 2 s | < 5 s | < 10 s |
| Mobile cold start (₹15k Android, 3G) | < 2 s | < 3 s | < 5 s |
| Admin dashboard first contentful paint | < 1.5 s | < 3 s | < 5 s |

**Reliability:** 99.5% uptime MVP / 99.9% Phase 2. Zero data loss via Cosmos DB continuous backup. DR: RPO ≤ 1 hr, RTO ≤ 4 hr.

**Security & compliance (binary — passes or fails CI gate):**

- TLS 1.2+ in transit; Azure-default at-rest encryption
- Aadhaar never stored server-side (DigiLocker tokenized only)
- Card data never in our code (Razorpay tokenization; PCI scope offloaded)
- RBAC on admin (super-admin / ops / finance / support / marketing)
- Immutable append-only audit log
- Karnataka right-to-refuse: 100% architecturally enforced
- Central SSC levy (1–2% of GMV) auto-calculated + quarterly remitted
- DPDP Act: India data residency (Azure India Central / Firebase Asia-South1)
- GST e-invoicing automated
- Zero paid SaaS dependencies (architectural constraint)

**Test coverage + CI gate:**

- Unit tests ≥ 80% coverage (Kover / Vitest / Paparazzi)
- Integration tests (API ↔ Cosmos ↔ Razorpay ↔ FCM) passing
- E2E: Playwright admin + Maestro mobile on 10 critical flows
- Load: 500 concurrent bookings / 60 s, dispatch p95 < 2 s, zero payment failures
- CI must pass: typecheck, lint (0 warnings), tests ≥ 80%, Semgrep, Paparazzi screenshot, axe-core, Lighthouse CI, BMAD artifact gate, Codex review marker

### Measurable Outcomes (connected to the 3 non-obvious advantages)

**1. Impossible economics via solo AI build:**

- Infra cost-per-booking < ₹2 through 50,000 bookings/month
- Build-to-launch time ≤ 6 months from Phase 0 scaffold
- Paid-SaaS-dependency count = 0

**2. Vendor-friendliness as strategic wedge:**

- Tech 90-day retention ≥ 60% (vs UC ~40–50% estimated)
- Tech average earnings ≥ ₹35k/month (vs UC ₹28,322 FY26 9M)
- 100% of declines have zero future-ranking impact (architectural)
- Tech Net Promoter Score ≥ 50 (separate tech NPS survey, quarterly)

**3. UX as primary customer wedge:**

- Play Store rating ≥ 4.6★ (vs UC ~4.2★)
- PissedConsumer/MouthShut reputation ≥ 4.0★ (vs UC 1.4★ / 1.28★)
- Time-to-first-booking ≤ 90 s (vs industry estimate 3+ min)
- Booking completion rate ≥ 80% (vs industry estimate ~65%)

---

## Product Scope

### MVP — Minimum Viable Product (first 3 months post-kickoff)

**Exactly the 25 features from brainstorm §6.1. Not 26. Not 24.**

**MVP-P0 (blockers — no launch without these) — 15 features:**

| ID | Title | Why P0 |
|---|---|---|
| T-1 | Pre-acceptance earnings preview | Core vendor-liquidity wedge |
| T-4 | Rich job-offer context | Enables informed tech decisions |
| T-7 | Guided photo capture | Enables all customer-trust features (C-5/17/20) |
| T-11 | Abusive customer shield | Vendor loyalty lever |
| T-23 | Rating appeal with evidence | Karnataka Act fairness compliance |
| C-1 | Trust dossier per technician | Foundation of customer trust layer |
| C-2 + C-12 | Fixed-price menu + price lock | Kills UC's #1 complaint |
| C-5 | Live service-in-progress updates | Kills anxiety; Zomato-tier tracking |
| C-11 | Tech no-show guarantee (₹500) | Reliability promise |
| C-36 | Rating shield (pre-review escalation) | Prevents launch-destroying 1★ reviews |
| O-1 + O-2 + O-3 | Live ops command centre | Solo-owner operability |
| O-4 + O-5 + O-6 | Orders table + drill-down + override | Core ops surface |
| O-13 | Daily P&L dashboard | Finance visibility |
| O-14 | Weekly payout queue | Vendor settlement |
| O-28 | Immutable audit log | Karnataka + legal protection |

**MVP-P1 (ship by soft launch) — 7 features:**

| ID | Title | Why P1 |
|---|---|---|
| T-2 | Real-time earnings dashboard | Tech motivation + retention |
| T-3 | Flexible payout cadence | Vendor-choice loyalty |
| T-10 | Rating transparency + written feedback | Tech growth tool |
| C-8 | Pre-booking confidence score | First-5-seconds wedge |
| C-10 | 7-day fix warranty surfaced | Pre-booking trust signal |
| C-17 | Auto-gen service report PDF | Post-service differentiator |
| O-19 | Complaints inbox with SLA | Accountability infra |

**MVP-P2 (ship by public launch) — 3 features:**

| ID | Title | Why P2 |
|---|---|---|
| C-7 + C-35 | Women-safe filter defaults + discreet safety SOS | Safety brand pillar for beauty + late-hour |
| C-15 | Photo-first service browse | Airbnb-tier premium feel |

**MVP does NOT include:** subscriptions, Native products, InstaHelp, multi-city, iOS, HI beyond EN+HI, ML dispatch, dynamic pricing, wallet auto-top-up, society group booking, year-end wrapped, health insurance auto-enrollment, OEM certs, B2B portal, gift cards.

**Compliance MVP minimums (non-skippable):**

- Karnataka Platform Workers Act — right-to-refuse, transparent algorithm, audit log (architectural)
- Central SSC levy (1–2% of GMV) — calculation + quarterly remittance
- DPDP Act — India data residency, consent, Aadhaar via DigiLocker
- GST registration + e-invoicing pipeline
- Background checks — DigiLocker Aadhaar + Azure Form Recognizer PAN OCR (free tier)
- Liability insurance — manual partnership MVP, automated Phase 3

### Growth Features (Post-MVP, Phases 2–4)

**Phase 2 (Months 4–6) — Trust+ & Growth (32 features):**

Full complaints + both-way ratings moderation (O-20, O-21, C-22), coupons + referrals + loyalty (C-23, C-24 gift, C-25 society-group), WhatsApp Business via Meta Cloud API free tier, Home Health hub (C-18, C-20, C-21, C-26), voice-first + vernacular (C-29 in HI/TA/BN/TE/MR/KN), low-literacy visual (C-28), caregiver dual-access (C-30), split-bill (C-32), wallet (C-33), GST mode (C-34), insurance claim 60-s (C-37), diagnose quiz (C-13), society feed (C-14), emergency toggle (C-16), contextual tipping (C-19), plus technician T-5/T-6/T-8/T-9/T-12/T-22/T-24, welfare T-17/T-18/T-19, career T-13/T-14/T-15/T-16, community T-20/T-21, owner O-7 to O-12 management, O-15 GST register, O-16 to O-18 marketing, O-22 to O-24 analytics, O-25 to O-27 catalog, O-29 RBAC, O-30 regulatory dashboard.

**Phase 3 (Months 7–9) — Subscription + Native Products:**

UC-Plus-equivalent subscription tier (Razorpay Subscriptions). Native products marketplace (own-branded RO, smart locks, ACs). Recommendation engine (basic collaborative filtering). WhatsApp chatbot booking. Home Services Wrapped year-end (C-27).

**Phase 4 (Months 10–12) — Scale:**

iOS apps (customer + technician). Web PWA. Multi-city architecture (2nd city launch). B2B portal (societies, corporates, bulk). Gift cards + corporate gifting (C-24 full). Multi-language full UI in 6 languages. ML-based dispatch ranking. Demand prediction. Dynamic pricing. Fraud detection. Tech training portal at scale.

### Vision (Future, Year 2+)

- 5+ cities: Bengaluru (pilot) → Pune → Hyderabad → Mumbai → Delhi-NCR
- International: Singapore (high do-it-for-me acceptance) → UAE → Saudi (mirrors UC footprint with better economics)
- Native products ecosystem: 15–20% of revenue
- Subscription penetration: 25%+ of MAU
- Enterprise / B2B: RWA contracts, office-services, corporate wellness partnerships
- Advanced AI: deep-learning personalisation, voice booking, AR diagnostics, predictive service alerts
- Acquisition-ready or independent cash-flow business at scale where VC interest is optional
- Category leadership: Indian home services evolves from "unreliable unorganised + opaque organised" to "trusted, transparent, well-designed" with homeservices-mvp defining the new default

---

## User Journeys

Six personas from the product brief. **Four are MVP-primary** (Riya, Suresh, Priya, Alokt); **two are Phase 2+** (Mr. Verma needs voice booking, Mrs. Iyer needs B2B portal — both deferred). Narrative journeys below.

### Journey 1 — Riya (Customer) — Happy Path

**Opening scene.** It's 9 PM on a Thursday. Riya's split AC is making a grinding noise. She's WFH tomorrow with a 10 AM client call and she can't sleep in 36°C Bengaluru. She's used Urban Company twice before and had mediocre experiences — the last tech arrived 2 hrs late, upcharged her by ₹800, and the app made her feel like she didn't matter. A colleague mentioned homeservices-mvp launched in Shantiniketan. She downloads it.

**Rising action.** OTP in 8 seconds. Truecaller auto-verifies — no typing. She lands on a photo-first home screen: a large image of a tech doing an AC service, tap → service detail page. Fixed price ₹599. Below, a neat list: *"This covers: chemical wash, gas pressure check, filter clean, full test run. Possible add-ons: Gas refill ₹1,200 if pressure is below X."* No fine print. She hits **Book for 8 AM tomorrow.**

Before confirm, she sees: *"95% on-time in your area. Nearest tech: Suresh, 4.8★, 340 jobs, 2 km away, 12 min ETA."* She taps Suresh's name — full Trust Dossier opens: DigiLocker-verified, ITI-certified, 5 jobs in Prestige Shantiniketan, languages HI/EN/PA. She books.

**Climax.** At 7:55 AM, an FCM push: *"Suresh is 3.2 km away, ETA 12 min."* At 8:04, another: *"Suresh has reached."* She opens the door, Suresh introduces himself, wearing a clean uniform, kit-bag in hand. He asks where the AC is. 20 minutes later, he's sent her three live updates via the app — *Opened indoor unit, Found dusty filter (photo), Chemical wash starting* — each with a photo.

**Resolution.** At 8:48 AM: *"Service complete."* He shows her the before/after photos in the app. Final price: ₹599 (locked; no add-ons needed). She pays via UPI, rates 5★, taps "Thank Suresh" and tips ₹50. Ten minutes later she gets a beautiful PDF service report emailed with everything Suresh did, the parts used (none), and *"Next AC service recommended: October 2026."* She leaves for her client call on time.

**Requirements revealed:** one-time OTP auth (Truecaller + Firebase Auth fallback), photo-first catalog (C-15), service detail w/ transparent pricing (C-2), pre-booking confidence score (C-8), Trust Dossier per tech (C-1), live tracking theatre with granular FCM pushes (C-5), price lock (C-12), contextual tipping (C-19 — MVP-P1 deferred), auto-generated service report PDF (C-17), one-tap re-booking prompt (C-3 — Phase 2).

### Journey 2 — Riya (Customer) — Edge Case (Service Goes Wrong)

**Opening scene.** Two weeks later, Riya books a deep-cleaning for Sunday 10 AM. A different tech, Ramesh, is assigned. At 10:30 AM he hasn't arrived. Anxiety spikes.

**Rising action.** The app shows: *"Tech running late — updated ETA 10:45."* At 10:50, no tech and no update. Riya opens the app. At the top of her booking screen: *"Tech no-show in 5 minutes? You'll get ₹500 credit automatically + we'll find a replacement."* At 11:01, FCM push: *"No-show confirmed. ₹500 credited. We're finding another tech."* At 11:07, a new FCM: *"Ravi is assigned, 18 min away. Here's his profile."*

**Climax.** Ravi arrives at 11:26, apologises for the rush (though he had nothing to do with Ramesh), does the deep clean. But Riya finds the kitchen floor still dirty near the stove. She rates 2★ and types *"Ravi did most of the job well but kitchen stove area wasn't cleaned."* Before submitting, the app intercepts: *"We're sorry. Want the owner to make this right before you post the 2★? Reply in 2 hours."*

**Resolution.** She taps "Yes." Within 20 minutes, Alokt (owner) chats her directly — *"Riya, this is my mistake. I'm sending Ravi back with an extra cleaner tomorrow at no charge. You get to keep the ₹500 credit from the no-show too."* Next day, Ravi returns with a colleague, deep-cleans thoroughly, Riya is delighted. She updates her rating to 4★ with a different comment: *"Had a rough first attempt but the owner made it right. That's rare."* She becomes a long-term customer.

**Requirements revealed:** tech no-show detection + auto-credit (C-11), automatic re-dispatch, rating shield with pre-review owner escalation (C-36), owner-customer direct chat, complaint SLA (O-19), complaint resolution with credit management (O-6 override, O-20).

### Journey 3 — Suresh (Technician) — Happy Path

**Opening scene.** Suresh quit Urban Company four months ago — 28% commission, opaque ratings, the January 2026 protest got him ID-blocked for a week. Since then he's been doing independent work through a WhatsApp group of 12 tech friends. A friend tells him homeservices-mvp is recruiting ITI-certified techs in Faridabad with 22% commission. He's skeptical (heard it before) but desperate enough to download.

**Rising action.** Onboarding via OTP (Firebase Auth), then DigiLocker for Aadhaar (free, official). KYC done in 2 days. A human calls him from Alokt's team for a 30-min skill test — real scenarios, not a multiple-choice quiz. He passes. On day 5, his first offer arrives.

**Climax.** The offer card shows everything he wanted UC to show him: customer Priya R., flat in DLF Phase 3 society, AC deep service, Sunday 8 AM slot, 4.3 km travel, 45 min estimated, *earnings ₹450 on a ₹599 booking (you keep 75% after platform + owner commission)*, plus *"You got this because you're 3rd-nearest and have a 4.9★ rating in AC service."* He taps Accept. Navigation hands off to Google Maps. Arrives on time, does the service, uses in-app parts catalog to add a ₹150 filter clean (customer approves on her phone before charged). Uploads before/after photos guided by the app's AR prompts. Hits Completed.

**Resolution.** Customer rates 5★ and writes *"Very professional, explained everything, clean work."* Suresh sees this within seconds on his phone — full written feedback, not just a number. He also sees his sub-scores (Punctuality 5.0, Skill 4.9, Attitude 5.0). That evening, he checks his earnings dashboard: *"Today ₹450 (1 job) • This week ₹2,850 (6 jobs) • Monthly progress ₹10,400 of ₹35,000 target."* He opts into next-day payout (₹15 fee) because his kid's school payment is due Tuesday. On Tuesday morning, ₹435 lands in his bank. He doesn't quit this platform.

**Requirements revealed:** DigiLocker KYC, skill test workflow, pre-acceptance earnings preview (T-1), rich job-offer context with "why you got this" reasoning (T-4), Google Maps navigation handoff, in-job parts catalog (T-8 — Phase 2), guided photo capture (T-7), rating transparency with written feedback + sub-scores (T-10), real-time earnings dashboard (T-2), flexible payout cadence (T-3).

### Journey 4 — Priya (Technician) — Safety Edge Case

**Opening scene.** Priya is a 26-year-old beautician from Noida, previously on UC. She's experienced two harassment incidents in the last year with UC — both buried under "it's complicated" from UC support. She's heard homeservices-mvp treats women techs differently. She joins.

**Rising action.** First month: smooth. She sees the **Women-Safe default** for late-hour and beauty bookings — she's only offered jobs from verified customers with clean history, and the customer app prominently tells customers: "You've selected a women-only professional." She feels seen.

**Climax.** One Sunday evening she accepts a 6 PM salon-at-home booking. Arriving, the customer's husband is at home and intoxicated. He makes Priya uncomfortable. Before the situation escalates, she opens the app, taps the discreet **Safety icon** on the service-in-progress screen. Silently, Alokt is alerted; the app starts optional audio recording in the background. On her end, a helpful message: *"Need to leave safely? Say 'I need to reschedule this'. Ravi (nearby tech) is available to escort you."* Two minutes later, Alokt calls the customer directly — *"Priya says there's discomfort, we'll reschedule. Our tech is leaving now."* Priya leaves safely.

**Resolution.** Priya files a one-tap report on the customer via Abusive Customer Shield. That customer is auto-blocked from being matched with her ever again. Alokt reviews the recording + report the next morning, confirms the pattern, permanently deactivates the customer account. Priya gets full payment for the cancelled booking (force-majeure protection) and a written thank-you from Alokt. She tells her WhatsApp group of 8 women beauticians. All 8 apply to join homeservices-mvp that week.

**Requirements revealed:** women-safe defaults (C-7), discreet safety SOS (C-35), silent audio recording opt-in, owner real-time alert, abusive customer shield (T-11), force-majeure protection (T-24 — Phase 2), owner override with customer deactivation (O-9), audit log (O-28).

### Journey 5 — Alokt (Owner) — Running the Business

**Opening scene.** Monday 7 AM. Alokt opens the owner web admin. Live Ops view loads in under 2 seconds.

**Rising action.** The dashboard greets him with yesterday's numbers: 47 bookings, ₹28,500 GMV, ₹6,400 commission, one complaint open (SLA timer 14 hrs remaining). City map shows 12 techs online at 7 AM — 3 already on jobs, 9 idle. Real-time order feed shows a booking just came in (AC repair, Prestige Shantiniketan, 9 AM slot). 28 seconds later, feed updates: *Suresh accepted*. Alokt clicks into the complaint — full timeline, photos, tech chat, customer note. Customer had a plumbing fix that leaked again on day 3. Two-tap action: re-assign to original tech (Ravi) with 7-day warranty auto-flag; add internal note *"Warranty re-service, no charge to customer"*; complaint resolves within SLA.

**Climax.** He clicks the Finance module. Weekly payout queue shows ₹1,82,400 to be released to 38 techs today. He reviews per-tech breakdown — Suresh ₹12,400 this week (his best), Priya ₹8,200 (recovering from Sunday incident). He approves the queue; Razorpay Route auto-settles to linked bank accounts. 38 UPI notifications ping out over 6 minutes. He glances at the Regulatory Dashboard: Central SSC levy for this week ₹2,850 auto-calculated, quarterly remittance scheduled for April 30. Karnataka welfare board: 12 techs' contributions this month ₹300 each, auto-filed.

**Resolution.** Total time in the admin: 22 minutes. Alokt closes the laptop and goes to the vendor breakfast meeting — 6 new AC techs joining this month; he personally shakes hands with each. No ops team needed. Solo operation is working.

**Requirements revealed:** real-time city map + order feed + counters (O-1/O-2/O-3), master orders table + drill-down (O-4/O-5), override controls (O-6), tech roster + commission tuning (O-7/O-8), customer view with complaint history (O-10), daily P&L (O-13), weekly payout queue with Razorpay Route integration (O-14), complaints inbox with SLA (O-19), regulatory dashboard (O-30 — Phase 2 but SSC/welfare calculations are MVP), audit log (O-28).

### Journey 6 — Mr. Verma (Customer — Senior, Phase 2)

**Summary (Phase 2 deferred — requires voice booking + low-literacy mode):** Mr. Verma doesn't install apps. His daughter in Bengaluru books services for his Kanpur home via Caregiver Dual-Access (C-30). Or in Phase 2, he uses voice booking in Hindi (C-29) — says *"AC service chahiye kal 11 baje"* and the AI schedules it. He gets only simple SMS confirmations.

**Requirements deferred to Phase 2:** C-28 visual mode, C-29 voice booking in HI, C-30 caregiver dual-access.

### Journey 7 — Mrs. Iyer (RWA Treasurer — Phase 3)

**Summary (Phase 3 deferred — requires B2B portal):** Mrs. Iyer manages a 200-flat society. She books quarterly pest control + monthly society-level AC service at a B2B rate. She gets a single GST invoice per month. Individual flats can opt into society-level contracts.

**Requirements deferred to Phase 3:** B2B portal, bulk contracts, society-level subscription, consolidated GST invoicing.

### Journey Requirements Summary

**Capabilities revealed across the 5 MVP journeys:**

| Capability Area | Revealed By Journey | MVP Features |
|---|---|---|
| Authentication | J1, J3, J4 | One-time OTP (Firebase Auth + Truecaller + Google Sign-In fallback), persistent session with biometric re-auth on sensitive actions |
| Service Discovery | J1 | Photo-first catalog (C-15), service detail with transparent pricing (C-2), confidence score (C-8) |
| Trust Layer | J1, J3 | Trust Dossier per tech (C-1), written reviews, sub-scores |
| Booking Flow | J1 | 3-tap booking, address management, slot selection, Razorpay checkout |
| Dispatch | J1, J3 | PostGIS geo-query, FCM push with ACK, rich context (T-4), earnings preview (T-1) |
| Live Tracking | J1 | FCM data messages with status stages, map view, ETA |
| Service Execution | J1, J3 | Guided photo capture (T-7), Google Maps nav handoff, parts catalog (T-8 Phase 2), service completion workflow |
| Payment | J1, J3 | Razorpay Route split-payment, price lock (C-12), mandatory add-on approval |
| Post-Service | J1 | Auto-gen PDF report (C-17), ratings + written feedback, tipping (C-19 Phase 2) |
| Recovery / Disputes | J2 | No-show detection + auto-credit (C-11), rating shield (C-36), owner chat, force-majeure (T-24 Phase 2) |
| Safety | J4 | Women-safe defaults (C-7), discreet SOS (C-35), abusive customer shield (T-11), audio recording opt-in |
| Tech Earnings | J3 | Pre-accept earnings preview (T-1), dashboard (T-2), flexible payouts (T-3), rating transparency (T-10) |
| Tech Appeals | J4 | Rating appeal with evidence (T-23), abusive customer report + block |
| Owner Ops | J5 | Live city map (O-1), real-time order feed (O-2), counters (O-3), orders table + drill-down (O-4/O-5), override controls (O-6) |
| Owner Finance | J5 | Daily P&L (O-13), weekly payout queue with Razorpay Route (O-14), GST register (O-15 Phase 2) |
| Owner Trust | J2, J4, J5 | Complaints inbox + SLA (O-19), immutable audit log (O-28), regulatory dashboard (O-30 Phase 2) |
| Multi-User Architecture | All | RBAC on admin (O-29), role-based visibility across 3 apps |

---

## Domain-Specific Requirements

Complexity classification from Step 2 is **HIGH** — Indian gig-platform marketplace with overlapping regulatory frameworks.

### Compliance & Regulatory

| Framework | Applies to | MVP Requirement |
|---|---|---|
| **Karnataka Platform Workers (Social Security and Welfare) Act 2025** (in force May 2025; rules notified Nov 2025) | If pilot is Bengaluru (recommended — OQ-2) | Right-to-refuse without algorithmic ranking penalty (architecturally enforced in dispatch); transparent algorithm publication; welfare board contributions per registered tech; immutable audit log for tech deactivations |
| **Rajasthan Platform-Based Gig Workers (Registration and Welfare) Act 2023** | If pilot/expansion touches Rajasthan | Registration with state welfare board; welfare cess contributions |
| **Bihar + Jharkhand state gig worker acts** | Multi-city expansion (Phase 4) | Analogous to Karnataka; add to regulatory dashboard |
| **Central Social Security Code 2025 (rules notified 30 Dec 2025)** | All aggregators | 1–2% of GMV to central social-security fund (capped at 5% of payments to workers); quarterly remittance; auto-calculated in owner admin (O-30) |
| **Digital Personal Data Protection Act 2023 (DPDP)** | All customer + tech data | India data residency (Azure India Central region); explicit consent flows for each data use; data minimisation; right-to-access/delete flows; 72-hour breach notification |
| **GST + e-invoicing** | All paid bookings | GSTIN registration; HSN/SAC codes for services; e-invoice via IRP for B2B (>₹5 cr turnover threshold; plan for MVP) |
| **IT Act 2000 + Reasonable Security Practices Rules 2011** | Owner admin + tech PII | Reasonable-security-measures for PII including Aadhaar (DigiLocker tokenised, never stored); annual pentest Phase 2+ |
| **Razorpay + RBI PPI/PA guidelines** | Payment + payout flows | Razorpay handles PCI + RBI PA compliance; we stay within approved SDK; no card data in our systems |
| **State-specific health & safety codes** | Beauty, wellness, and pest-control services | Category-specific tech training + certification (Phase 2); pest-control chemicals traceable |

### Technical Constraints (domain-derived)

| Constraint | Why | MVP Implementation |
|---|---|---|
| **Aadhaar never stored** | Aadhaar Act 2016 + DPDP | DigiLocker tokenised verification only; store verification status + timestamp, not the number itself |
| **Card data never touches our code** | PCI-DSS scope + Razorpay contract | Razorpay SDK + Razorpay Route; order ID + payment reference only |
| **Immutable audit log** | Karnataka fairness + DPDP accountability | Append-only Cosmos DB collection with timestamp + admin identity + reason code for every override / deactivation / refund / payout approval |
| **Data residency in India** | DPDP Act | Azure India Central (primary) + Firebase Asia-South1 (Mumbai); no cross-border data flows without explicit consent flow |
| **Right-to-refuse + transparent algorithm** | Karnataka Act | Dispatch logic publishes its ranking factors; tech decline events have zero future-ranking impact (enforced at dispatcher layer, tested in integration suite) |
| **Welfare board contribution automation** | Karnataka / Rajasthan / Bihar / Jharkhand | Per-tech contribution calculated per booking; aggregated quarterly; remittance automated via Razorpay vendor payout with separate ledger |
| **Two-sided rating integrity** | Trust layer brand pillar | Neither customer nor tech sees the other's rating-in-progress; both-way rating submission only after payment settled; rating appeal flow (T-23) requires evidence, reviewed in audit log |
| **Real-time geo-dispatch** | Core product requirement | Cosmos DB geospatial index + PostGIS-equivalent queries; FCM data message push with 30-sec ACK timeout; Redis-equivalent optimistic concurrency (Cosmos `_etag`) for first-to-accept lock |

### Integration Requirements

| Integration | Purpose | Free-Tier Budget |
|---|---|---|
| **Firebase Auth (Phone + Google Sign-In)** | One-time OTP auth with persistent session | ~100 SMS/mo at steady state — near ₹0 |
| **Truecaller SDK** | Primary auth path (95% Android coverage in India) — avoids OTP cost | Free for business |
| **DigiLocker** (Government of India) | Aadhaar verification via tokenised consent flow | Free |
| **Azure Form Recognizer** (free tier — 500 pages/mo) | PAN card OCR | Free at pilot scale |
| **Google Maps Platform** | Geocoding, address autocomplete, Distance Matrix for dispatch, Directions for tech nav | $200/mo recurring credit covers pilot |
| **Razorpay + Razorpay Route** | Payment capture, split-payment escrow, tech payouts to linked bank accounts | ₹0 fixed; 2% transaction fee (from GMV not pocket) |
| **FCM (Firebase Cloud Messaging)** | Universal messaging spine — dispatch push, live tracking updates, marketing, chat, status, notifications | Unlimited free forever |
| **Firebase Storage** | Before/after photos, KYC selfies, audit photos | 5 GB + 1 GB/day download free |
| **Azure Communication Services (Email)** | Transactional emails (booking confirmations, invoices, receipts) | 100 emails/day free (sufficient for MVP) |
| **Insurance partner API** | Per-booking liability cover claim flow | Manual partnership MVP → API Phase 3; partner TBD (OQ-8 ICICI Lombard / Bajaj / Acko) |
| **PostHog Cloud** (free tier — 1M events/mo) | Product analytics, cohort retention, A/B testing | Free at pilot scale |
| **Sentry** (free tier — 5k errors/mo) | Error monitoring across mobile + web + api | Free at pilot scale |
| **Azure Translator** (free tier — 2M chars/mo) | UI translations for HI (Phase 2 adds more languages) | Free |
| **Azure Anomaly Detector** (free tier — 20k txn/mo) | Fraud detection rules engine for Phase 2 | Free |
| **Azure ML** (free tier — 8 hrs/mo compute) | Monthly ML dispatch model training (Phase 4) | Free |

### Domain-Specific Risk Mitigations

| Risk | Mitigation |
|---|---|
| **Tech safety incident during service** | Background check (DigiLocker Aadhaar + manual PAN OCR) + insurance cover + discreet safety SOS (C-35) + force-majeure protection (T-24 Phase 2) + audit log of all tech-customer interactions |
| **Customer fraud (fake booking, chargeback)** | Razorpay fraud detection + Anomaly Detector rules (Phase 2) + both-way rating including tech-side blocking (T-11) + owner override with audit trail |
| **Regulatory audit (Karnataka Labour Department, RBI, GST)** | Immutable audit log + regulatory dashboard with real-time contribution/remittance tracking (O-30); quarterly compliance review scheduled with CA / legal counsel |
| **Free-tier limit hit unexpectedly at scale spike** | Monitoring alerts at 70% / 85% of each free tier quota; documented paid-tier migration playbook; ₹50k/mo budget standby; per-service migration ADRs pre-authored |
| **Data breach / DPDP violation** | Azure-default at-rest encryption + TLS 1.2+ in transit + Aadhaar never stored + annual pentest (Phase 2+) + 72-hour breach notification workflow; incident response runbook |
| **Tech protests / labour unrest (à la UC Jan/Feb 2026)** | Fair commission (22–25%) + transparent dispatch + written feedback visibility + rating appeal (T-23) + abusive customer shield (T-11) + rating transparency (T-10) — all MVP-P0 features built to prevent the conditions that caused UC's protests |
| **Customer review catastrophe (launch reviews <3★ on Play Store)** | Soft launch to 100 friends-and-family before public (D23) + rating shield (C-36) + daily review monitoring + owner-direct complaint escalation within 2-hour SLA |
| **Working capital shortage during scale** | ₹15–20 lakh standby line earmarked (A-4 unconfirmed — OQ-6); Razorpay Instant Settlement option tested; contingency plan: pause new tech onboarding until float recovers |
| **Cosmos DB 25 GB free tier hit faster than expected** | Photo + chat data on Firebase Storage (not Cosmos); archive orders >180 days to cold storage; partition strategy by city + month for predictable scan costs; monitoring at 15 GB (60% alert) |
| **Insurance partner refuses claim / slow resolution** | Multiple partner evaluation (OQ-8); customer-facing insurance claim flow (C-37) has fallback to owner-funded settlement + later recovery from insurer; SLA on partner contract

---

## Innovation & Novel Patterns

### Detected Innovation Areas

Four genuinely novel elements in this project — not "innovation theatre," actual categories that didn't exist in 2024:

**I-1. Solo-founder + AI building enterprise-grade multi-sided marketplace at ₹0 infra.**
- **What's novel:** UC-parity-class product surface (3 native mobile apps + admin + API + compliance) traditionally required ₹2–5 crore and 10+ engineers. BMAD + Claude Code + Firebase/Azure free-tier maturity simultaneously crossed a threshold in 2025–2026 that makes this achievable for a disciplined solo operator.
- **Fallback if it doesn't work:** hire a 2–3 person team at ~₹12–18 lakh (still 10× cheaper than UC's burn).
- **Validation approach:** monthly burn-rate check. If build progress < 1 story per 3 days after month 2, signal to add freelance developer on retainer.

**I-2. FCM as universal messaging spine (replacing paid SMS + WhatsApp Business).**
- **What's novel:** Most Indian consumer apps use MSG91 + Wati/Gupshup for transactional comms (~₹5-15k/mo at this scale). One-time OTP + persistent device session + FCM data messages for everything else cuts that to near ₹0. The insight: customers install the app once; after that, the communication channel is already in their pocket.
- **Fallback:** if FCM delivery reliability < 95%, layer MSG91 SMS as secondary notification channel (~₹1k/mo).
- **Validation approach:** FCM delivery telemetry in PostHog; alert if < 95% delivery-within-10-seconds.

**I-3. Cosmos DB serverless + Azure Functions for a 50k-booking marketplace.**
- **What's novel:** Traditional wisdom says you need Postgres + Redis + EC2 + K8s for a real marketplace. Cosmos DB Serverless (1000 RU/s + 25 GB free forever) + Azure Functions Consumption (1M execs/mo free) handles ≤50k bookings/month on free tier. Geospatial indexing is built in. No provisioning, no idle cost.
- **Fallback:** migrate to Postgres + Redis + Fargate at the ceiling (~₹20k/mo at 50k bookings) — still cheap.
- **Validation approach:** load test 500 concurrent bookings / 60s pre-launch; monitor RU consumption; alert at 70% of free limit.

**I-4. Mutual respect as architectural principle (not feature).**
- **What's novel:** Indian gig platforms have historically been one-way — platform decides, tech complies. UC's 2026 protests exposed the failure mode. We make respect bidirectional architecturally: pre-acceptance earnings transparency (T-1), decline-without-penalty (Karnataka-enforced, T-4), written feedback visibility (T-10), rating appeal with evidence (T-23), abusive-customer shield (T-11), rating shield for customers (C-36). Individual features exist elsewhere; the *coherent architectural stance* doesn't.
- **Fallback:** the ideas work even individually. But full differentiation depends on the composite posture.
- **Validation approach:** tech 90-day retention ≥ 60% (vs UC estimated ~40-50%); tech NPS ≥ 50 (quarterly survey).

### Market Context & Competitive Landscape

From product brief + brainstorm:

- **Urban Company (incumbent):** ₹1,144 cr FY25 revenue, 1.4★ PissedConsumer NPS, Jan/Feb 2026 nationwide tech protests, Q3 FY26 ₹21.3 cr loss (InstaHelp alone -₹61 cr EBITDA), public-company pressure. Strong on scale + brand; weak on customer NPS + vendor treatment.
- **Housejoy, Pronto, Bro4u, NoBroker:** small scale, niche geographic, not structural threats.
- **Unorganised local market (99% of TAM):** the real competitor — familiar relationship, cash flexibility, flexible timing. Our Trust Dossier + neighbourhood-verified + transparent pricing addresses this substitute directly.
- **Amazon Home Services / JioMart Home:** rumoured entries, not live at MVP launch. If they enter post-launch, our vendor-loyalty moat is the defence.

### Validation Approach (Innovation Hypotheses)

| Hypothesis | How we'll know it's validated |
|---|---|
| I-1 (solo AI build is feasible) | 25-feature MVP delivered in 3 months with CI passing |
| I-2 (FCM-only messaging works) | Booking status delivery > 95% within 10 s; tech job-offer ACK rate > 70% |
| I-3 (free-tier Cosmos handles scale) | 5,000 bookings/month sustained with < 70% of free-tier RU consumption |
| I-4 (mutual respect drives retention) | Tech 90-day retention ≥ 60%; tech NPS ≥ 50 |

### Risk Mitigation for Innovation

Each innovation has documented fallback (above). Additionally:

- **Innovation risk #1 (overconfidence in AI-assisted build):** strict scope discipline; MVP is 25 features, not 26. Pre-mortem F-1 documented.
- **Innovation risk #2 (FCM delivery unreliability):** SMS fallback designed but not built; if telemetry triggers it, 1-week implementation on path.
- **Innovation risk #3 (free-tier policy change):** per-service paid-tier migration playbook pre-written in architecture docs; ₹50k/mo budget standby.
- **Innovation risk #4 (vendor-loyalty metrics don't move):** if tech 90-day retention stays below 55% at month 3, initiate retention deep-dive with 10 tech interviews; revisit commission ladder (OQ-4).

---

## Project-Type Specific Requirements

homeservices-mvp spans three distinct project types — answering CSV-derived key questions for each.

### Part 1: Mobile App Requirements (customer-app + technician-app)

**Stack:** Kotlin 2.x + Jetpack Compose (Material Design 3) on Android. iOS deferred to Phase 4 (SwiftUI or Kotlin Multiplatform TBD — OQ-18).

**Platform:**
- **Android only at MVP.** minSdk 26 (Android 8.0 — covers ~95% of Indian active devices). targetSdk = latest.
- Two separate Gradle-packaged apps sharing a design-system Gradle module.
- Both apps built from one monorepo (`customer-app/`, `technician-app/`) — Phase 4 iOS joins with SwiftUI + shared Kotlin business logic (KMP) if that ADR goes through.

**Device permissions (granular consent per DPDP):**

| Permission | Customer app | Technician app | Justification |
|---|---|---|---|
| `CAMERA` | optional (for profile photo) | required (for before/after photos per booking) | Photo capture with DPDP-compliant consent screens |
| `ACCESS_FINE_LOCATION` | during booking (address pin) | during active job (dispatch + live tracking) | Location only while app is foreground + job active |
| `ACCESS_BACKGROUND_LOCATION` | ❌ never | optional during active job only | Background location asks explicit consent; paused immediately on job completion |
| `POST_NOTIFICATIONS` | required | required | FCM status updates; Android 13+ explicit consent |
| `READ_PHONE_STATE` | ❌ | ❌ | Not needed (Truecaller SDK handles phone verification without this) |
| `RECORD_AUDIO` | optional (for SOS audio recording opt-in) | ❌ | Only during SOS trigger, not continuous |
| Biometric (`USE_BIOMETRIC`) | optional (re-auth on sensitive actions) | optional (re-auth on payout approval) | Persistent session + biometric re-auth on payment/payout |

**Offline mode:**
- **Customer app:** graceful degradation — cached service catalogue + cached bookings visible offline; booking creation requires network.
- **Technician app:** ongoing job state cached locally (Room DB); status transitions queue + sync when online; critical for flaky rural areas.
- **Admin web:** online-only; no offline requirement.

**Push notifications strategy:**
- **FCM exclusively** for all status pushes (see Innovation I-2).
- Data messages for booking lifecycle (Searching / Assigned / En-route / Reached / InProgress / Completed), one per status change.
- Notification messages for marketing campaigns (Phase 2+), with topic subscriptions (city, category, cohort).
- Delivery SLO: < 95% delivery within 10 s (PostHog tracked).
- Android 13+ explicit consent; fallback to in-app banners if declined.

**Store compliance (Play Store):**
- Privacy policy URL (per Play Console requirement)
- Data Safety form completed: discloses what's collected (phone, location, photos), shared (Razorpay for payment), purpose
- Target API level ≤ 1 year old (per Play policy)
- 64-bit only (Play requirement since 2019)
- Proguard/R8 release builds with `isDebuggable=false`, `usesCleartextTraffic=false` (except dev)
- App Bundle (AAB) distribution, not APK
- Content rating: PG / Everyone
- Permissions: each sensitive permission justified via in-app consent screen at time of use (not at install)
- Pre-submission: signed release AAB + Paparazzi screenshot tests across densities + Accessibility Scanner pass on key flows

### Part 2: SaaS B2B (Owner Web Admin)

**Stack:** Next.js 15 (App Router) + TypeScript `strict: true` + Tailwind + Storybook. Hosted on Azure Static Web Apps (free tier — 100 GB bandwidth/mo).

**Multi-tenancy:** **Single-tenant MVP.** One owner, one city, one admin instance. Phase 4 (multi-city) shifts to multi-tenant by city with shared infrastructure — ADR required in Phase 4.

**Permission model (RBAC for MVP — O-29):**

| Role | Permissions |
|---|---|
| `super-admin` (the owner) | Everything. Full read + write + override + audit-log-view. Force 2FA. |
| `ops-manager` | Orders (read + override) + technicians (read + activate/deactivate) + complaints (read + resolve) + live ops map. **NO finance, NO audit log delete.** |
| `finance` | Finance module (read + export) + payout queue (approve/hold) + GST register + audit log (read-only). **NO order override, NO tech activation.** |
| `support-agent` | Assigned complaints only + customer lookup (read) + orders (read) + owner chat. **NO override authority.** |
| `marketing-manager` (Phase 2+) | Coupons + referrals + push campaigns + cohort analytics. **NO finance, NO tech management.** |

**MVP includes:** super-admin, ops-manager (for future team), finance, support-agent roles. marketing-manager deferred to Phase 2.

**Subscription tiers (for the OWNER — B2B context does not apply at MVP):** N/A. Customer-side subscriptions (UC Plus equivalent) are a Phase 3 feature, not MVP.

**Integrations (owner admin):** reads from Cosmos DB + Azure Functions API; pushes to Razorpay Route for payouts; triggers FCM via Admin SDK for marketing campaigns (Phase 2+). No third-party admin integrations (e.g., no Slack/Intercom/HubSpot) at MVP — keep the tool closed and focused.

**Compliance reqs for admin:**
- All admin actions logged to audit log (O-28) with user ID + timestamp + reason code + IP
- Force 2FA for super-admin (TOTP via authenticator app)
- Session timeout 30 min of inactivity
- CSV export traces logged (data export is a DPDP-sensitive action)

### Part 3: API Backend (Node)

**Stack:** Node 22 LTS + TypeScript `strict: true` + Fastify (per template default; alternative Hono in ADR-0001-stack-choice). Zod for input validation. Running on Azure Functions Consumption plan (1M execs/mo free tier).

**Endpoints (MVP surface):**

| Endpoint Group | Examples | Auth |
|---|---|---|
| Public / anon | GET `/services` (catalogue), GET `/services/{id}` | None (cached via CDN) |
| Customer auth | POST `/auth/otp/request`, POST `/auth/otp/verify`, POST `/auth/refresh` | Firebase Auth token → custom JWT |
| Customer bookings | POST `/bookings`, GET `/bookings/{id}`, GET `/bookings/mine`, POST `/bookings/{id}/approve-final-price`, POST `/bookings/{id}/rate`, POST `/bookings/{id}/complaint` | Customer JWT |
| Technician onboarding | POST `/tech/kyc/digilocker/initiate`, POST `/tech/kyc/digilocker/verify`, POST `/tech/skills`, POST `/tech/availability` | Technician JWT |
| Technician jobs | GET `/tech/offers/pending`, POST `/tech/offers/{id}/accept`, POST `/tech/offers/{id}/decline`, POST `/tech/jobs/{id}/status`, POST `/tech/jobs/{id}/photo`, POST `/tech/jobs/{id}/complete` | Technician JWT |
| Technician earnings | GET `/tech/wallet`, GET `/tech/payouts`, POST `/tech/payouts/cadence` | Technician JWT |
| Admin | GET/POST `/admin/*` (orders, techs, customers, finance, complaints, audit, catalogue, campaigns) | Admin JWT with role claim |
| Webhook | POST `/webhooks/razorpay`, POST `/webhooks/digilocker` | Signature verification |
| Health | GET `/health` (readiness + liveness) | None |

**Authentication model:**
- **Customer + Technician:** Firebase Phone Auth (one-time OTP + persistent session) → custom JWT exchanged on first login, refreshed via refresh token. Biometric re-auth on sensitive actions (payment approval, payout cadence change).
- **Admin:** email + password via Firebase Auth for admin project, plus role claim in custom JWT. Force 2FA for super-admin.
- **Service-to-service:** Azure Managed Identity where available; Key Vault for secrets.
- **Truecaller SDK:** primary path for customer + tech auth (skips OTP if Truecaller installed); Firebase Phone Auth is fallback.

**Data formats:** JSON only. OpenAPI 3.1 spec generated from Zod schemas (one source of truth). ISO 8601 timestamps. All money in paise (integer) internally to avoid floating-point rounding.

**Error codes:** Standardised error envelope: `{code: "BOOKING_SLOT_UNAVAILABLE", message: "That slot is full. Nearest alternative: ...", details: {...}, traceId: "..."}`. Error codes documented in OpenAPI. HTTP status codes follow RFC 7231 (400 for validation, 401 unauth, 403 forbidden, 404 not found, 409 conflict, 422 semantic, 429 rate-limit, 500 server).

**Rate limits (MVP):**
- Auth endpoints: 10 req/min per phone number (OTP request); 20 req/min per IP (catch scanning)
- Booking endpoints: 30 req/min per customer
- Admin endpoints: 100 req/min per admin user
- Global: 1000 req/min per IP
- Enforced via Azure Functions rate-limit middleware

**Versioning:** URL-based (`/v1/...`). v1 for MVP; v2 only on breaking changes. Backward-compatible additions don't bump version.

**SDK:** none needed at MVP (mobile apps call API directly via Retrofit/Ktor, admin via fetch). Phase 3 may add internal SDK if we scale to multi-team.

**API docs:** OpenAPI 3.1 auto-generated from Zod; hosted via Azure Static Web Apps at `/docs` route. Updated on every deploy.

### Technical Architecture Considerations (cross-surface)

| Concern | Choice | Rationale |
|---|---|---|
| **Realtime dispatch** | FCM data messages + Cosmos optimistic concurrency (`_etag`) for first-to-accept lock | No persistent WebSocket costs; matches free-tier constraint (Innovation I-2) |
| **Geo queries** | Cosmos DB geospatial indexing (native) | 25 GB free tier + built-in spatial — no Postgres/PostGIS needed |
| **Event sourcing for owner admin live view** | Cosmos change feed → Azure Function → FCM topic per admin | Free-tier scale; avoids WebSocket/SignalR paid tier |
| **Secrets** | Azure Key Vault (free tier 10k operations/mo) | First-class secret rotation |
| **Logging** | Application Insights free tier (5 GB/mo) + Sentry (free 5k errors) | Both have adequate free tier at MVP scale |
| **CI** | GitHub Actions (2000 mins/mo free) | Sufficient at MVP |

### Implementation Considerations (cross-cutting)

- **Monorepo structure:** `customer-app/` + `technician-app/` + `admin-web/` + `api/` + shared `docs/` at root. Already scaffolded in Phase 0.
- **Design system:** Figma Library (free tier) + `figma:figma-implement-design` skill for Flutter → Kotlin Compose translation + `frontend-design:frontend-design` for Next.js admin. Shared visual identity across 3 surfaces.
- **Testing strategy:** ≥ 80% coverage via Kover (Android) + Vitest (web + api) + Paparazzi (Android screenshot) + Playwright (admin e2e) + Maestro (mobile e2e).
- **Release cadence:** MVP = single big-bang launch; Phase 2+ = 2-week sprint releases.
- **Observability:** PostHog for product analytics across all 3 surfaces; Sentry for errors; Application Insights for infra telemetry.
- **Error budget:** 99.5% uptime → 3.6 hours/month downtime allowed; reset on first day of month.

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP approach:** **Validated-learning MVP anchored to unit economics**, not a "demo MVP" or a "feature-matching-UC MVP."

The test: *can a solo-built, ₹0-infra three-app marketplace deliver contribution-margin-positive bookings in one city at 5,000/month with ≥ 4.6★ Play Store rating, ≥ 60% tech 90-day retention, and ≥ 35% customer 60-day repeat rate?*

If YES → the economic thesis (Innovation I-1) is validated, Phase 2 is funded by the business, and we scale features + cities.
If NO → we've learned something cheap (₹0 infra means ~₹25–40 lakh total cash risked, not ₹2–5 crore). Pivot or shut down with dignity.

**Why this philosophy beats "feature-matching-UC MVP":** UC is losing money at the full-feature level (Q3 FY26 ₹21.3 cr loss, InstaHelp -₹61 cr EBITDA). Replicating them in full is a trap. We prove the *core economic unit* first; the amplifiers come only when the unit works.

**Resource requirements:**
- **Solo founder** (Alokt) at 4–5 hrs/day × 6 months
- **Claude Code Opus 4.7 (1M ctx) + Sonnet subagents** for bulk execution
- **Freelance designer** (₹30–50k one-time) for visual identity + initial Figma library
- **Optional part-time dev on retainer** (₹20–30k/mo) as burnout insurance (recommended but not strictly required)
- **Working capital** ₹15–20 lakh (OQ-6)
- **Marketing pilot budget** ₹5 lakh (OQ-7)

### MVP Feature Set (Phase 1)

See §Product Scope above for detail. TL;DR: **25 features.** 15 P0 (blockers), 7 P1 (ship by soft launch), 3 P2 (ship by public launch).

**Core user journeys supported at MVP:** Journey 1 (Riya happy path), Journey 2 (Riya edge case — no-show recovery), Journey 3 (Suresh happy path), Journey 4 (Priya safety edge case), Journey 5 (Alokt operator). Journey 6 (Mr. Verma — voice) and Journey 7 (Mrs. Iyer — B2B) deferred to Phase 2+.

**Must-have capabilities — no launch without these:**
- Booking lifecycle (browse → book → pay → dispatch → track → deliver → rate) end-to-end
- Three-app role-based visibility (Customer / Technician / Owner) — Kotlin+Compose × 2 + Next.js × 1
- Real-time dispatch (FCM + Cosmos geospatial + 30-sec ACK window)
- Razorpay + Razorpay Route split-payment with weekly payouts
- Karnataka-compliant dispatch (right-to-refuse, transparent algorithm)
- Full real-time owner visibility (Live Ops + Orders + Override + Finance + Complaints + Audit)
- Trust Dossier per tech (C-1) and price-lock (C-2 + C-12)
- Rating shield (C-36) — prevents launch-review catastrophe
- Women-safe defaults (C-7) + SOS (C-35) — safety brand pillar
- ₹0 infra at pilot scale (architectural constraint)

### Post-MVP Features

**Phase 2 (Months 4–6 from MVP launch) — Trust+ & Growth:**
- Full complaints + both-way ratings moderation + complaints workflow
- Coupons + referrals + society-group bookings + WhatsApp share cards
- WhatsApp Business (Meta Cloud API free tier)
- Home Health hub (maintenance calendar + photo archive + health check)
- Voice-first + vernacular (HI/TA/BN/TE/MR/KN)
- Low-literacy visual mode + caregiver dual-access (unlocks Journey 6)
- Split-bill + wallet + GST-mode
- Insurance claim 60-sec flow
- Diagnose quiz + society feed + emergency toggle + contextual tipping
- Technician features: beacon + slot commits + parts catalog + auto-report template + public profile + force-majeure
- Technician welfare: health insurance auto-enrollment + fatigue guard + weather pause
- Technician career: levels + training library + OEM certs + portfolio
- Community features: board + ride-share
- Owner: full management (tech/customer/finance/marketing/analytics/catalog)
- Regulatory dashboard with quarterly remittance automation
- **E12-S03 — admin-web Hindi i18n.** Trigger: when first non-bilingual admin/ops user is hired. Scope: install `next-intl`; structure `messages/en.json` + `messages/hi.json`; route prefix `/[locale]/...`; translate all admin-web strings. Estimated: 2 dev-days. Tier: Foundation.
- **E13-S01 — Ayodhya regional tech recruitment + verification.** Trigger: prerequisite to flipping `marketing.public-launch` GrowthBook flag. Scope: identify ≥2 technicians per active serviceId in Ayodhya service radius (~10km from `[82.20, 26.79]` GeoJSON `[longitude, latitude]`); complete DigiLocker Aadhaar KYC + PAN OCR + tech-app onboarding for each. Operations/recruitment story, not a software story. Tracked here to make the launch-flag prerequisite (E10-S04 AC) auditable.

**Phase 3 (Months 7–9) — Subscription + Native Products:**
- UC Plus-equivalent subscription (Razorpay Subscriptions)
- Native products marketplace (RO + smart locks + ACs) — own-branded
- Basic recommendation engine (collaborative filtering)
- WhatsApp chatbot booking
- Home Services Wrapped year-end
- Tool financing for techs

**Phase 4 (Months 10–12) — Scale:**
- iOS apps (SwiftUI or KMP-shared — OQ-18)
- Web PWA
- Multi-city architecture + second city launch (unlocks Journey 7 via B2B portal)
- B2B portal (societies, corporates, bulk)
- Gift cards + corporate gifting
- Full 6-language UI
- ML-based dispatch ranking + demand prediction + dynamic pricing + fraud detection

**Vision (Year 2+):** 5+ cities, international (Singapore → UAE → Saudi), subscription penetration 25%+ of MAU, Native products 15–20% of revenue, acquisition-ready.

### Risk Mitigation Strategy

**Technical risks:**

| Risk | Mitigation |
|---|---|
| Free-tier limits hit unexpectedly | Monitoring alerts at 70% / 85% of each free tier; paid-tier migration playbook pre-written; ₹50k/mo budget standby |
| FCM delivery unreliability | Delivery telemetry in PostHog; if < 95% within 10 s, MSG91 SMS fallback planned (1-week implementation) |
| Cosmos DB 25 GB ceiling | Photos on Firebase Storage (not Cosmos); archive orders > 180 days to cold storage; partition by city + month |
| Solo AI-build collapses | Freelance dev on retainer (optional but recommended); willing to delay non-MVP features; BMAD artifacts are portable if we switch tooling |

**Market risks:**

| Risk | Mitigation / Validation Approach |
|---|---|
| Customer acquisition CAC too high | RWA tie-ups + society WhatsApp + referrals (C-23/C-25) before paid ads; soft launch to 100 F&F first (D23); paid ads only after organic hits 500 bookings/mo |
| Vendor liquidity collapse | 100+ techs recruited BEFORE launch (D22 pre-launch sprint); weekly 1-on-1s in first 6 months; 22% commission lock-in letter + top-20 exclusivity |
| UC predatory price war | Compete on vendor experience, not customer price; lock top 20 techs with exclusivity; maintain differentiators that don't depend on price |
| Regulatory ambush (Karnataka algo block) | Right-to-refuse + transparent algorithm + immutable audit log built into MVP dispatch; quarterly legal review |

**Resource risks:**

| Risk | Mitigation |
|---|---|
| Founder burnout at month 6 | 4 hrs/day sustainable cadence (not 6); phased timeline with willingness to delay non-MVP features; optional part-time dev on retainer (₹20–30k/mo) |
| Working capital squeeze | ₹15–20 lakh standby line earmarked (OQ-6); Razorpay Instant Settlement as optional tech-paid feature (T-3); contingency: pause new tech onboarding until float recovers |
| Marketing budget insufficient | Phase-gated spend: ₹1 lakh organic only first 3 months; paid ads only after organic CAC validated; budget cap ₹5 lakh pilot (OQ-7) |
| Team of one scales down (illness, personal) | Process documented for 2-week handoff; part-time dev retainer as insurance; BMAD artifacts are complete spec — another dev + AI pair could continue |

### Scope Guardrails (Locked Decisions)

- **MVP = exactly 25 features (D21).** No feature creep. Any proposed addition moves something to Phase 2+.
- **D22 superseded 2026-05-01 (umbrella spec `docs/superpowers/specs/2026-05-01-ayodhya-hindi-pivot-design.md` §5.4):** original "no coding until 50 techs" gate replaced by per-serviceId launch-flag prerequisite. Coding may proceed in parallel with recruitment. `marketing.public-launch` flag = on requires **≥2 verified technicians per active serviceId** in Ayodhya service radius (10km from `[82.20, 26.79]`); `marketing.soft-launch` flag (≤100 F&F bookings, D23) may flip earlier with **≥1 tech per serviceId**. Original D22 ("50 techs mandatory") was Bengaluru-metro context, has been silently bypassed across 37+ stories of execution; the supersede makes the new gate explicit and auditable.
- **Soft launch to 100 F&F before public (D23).** Use rating shield aggressively.
- **Single-city pilot — no multi-city work in Year 1 (D15 from brainstorm).**
- **Commission ladder: 22% → 25% at 50-job milestone per tech (D24).**
- **₹0 infra constraint (D2). Any paid SaaS needs ADR + approval.**
- **Karnataka compliance is MVP, not Phase 2 (D25).**

---

## Functional Requirements

**Capability contract** — the complete inventory of what homeservices-mvp MUST do at MVP. Grouped by capability area, not by surface. Each FR has a user story, priority (MVP-P0/P1/P2), dependencies, acceptance criteria (Given/When/Then), and free-tier implementation notes.

**Critical:** UX will only design what's here. Architecture will only support what's here. Stories will only implement what's here. If a capability isn't listed, it will not exist in MVP.

### Capability Area 1: Authentication & Onboarding

**FR-1.1 — One-time OTP authentication with persistent session**
- *As a customer or technician, I want to sign in once on my device and stay logged in for months, so that I don't lose time to repeated OTP flows.*
- **Priority:** MVP-P0
- **Dependencies:** none
- **Acceptance criteria:**
  - Given a first-time user, When they enter their phone number, Then system first attempts Truecaller SDK verification; on failure, sends Firebase Phone Auth OTP (6 digits); on failure offers Google Sign-In.
  - Given a returning user within refresh-token lifetime, When they open the app, Then they are auto-authenticated without OTP or typing.
  - Given a sensitive action (payment approval, payout cadence change, profile deletion), When user attempts, Then system prompts biometric re-auth before executing.
  - Given a 180-day inactive account, When user returns, Then system requires fresh OTP (refresh token expires).
- **Free-tier note:** Firebase Phone Auth charges per SMS (~₹0.40 each); Truecaller-first strategy keeps OTP volume below 100/month steady-state (≈ ₹40/month, effectively ₹0).

**FR-1.2 — Technician KYC via DigiLocker**
- *As a technician applicant, I want to verify my Aadhaar via DigiLocker in under 5 minutes so that I can start taking jobs quickly without paperwork.*
- **Priority:** MVP-P0
- **Dependencies:** FR-1.1
- **Acceptance criteria:**
  - Given a technician completes onboarding flow, When they tap "Verify Aadhaar", Then DigiLocker consent flow opens; on success, system stores tokenized verification status + timestamp only (never the Aadhaar number).
  - Given PAN card upload, When tech submits photo, Then Azure Form Recognizer extracts PAN number and verifies format; stored in encrypted field.
  - Given DigiLocker verification fails, When retried 3 times, Then system flags for manual verification by owner (fallback path).
- **Free-tier note:** DigiLocker is free (government-backed); Form Recognizer free tier 500 pages/month covers onboarding flow.

**FR-1.3 — Admin authentication with RBAC and 2FA**
- *As the owner, I want to log into the admin web with 2FA and only see functions my role allows, so that the business is protected from accidental damage by future team members.*
- **Priority:** MVP-P0
- **Dependencies:** none
- **Acceptance criteria:**
  - Given an admin user, When they attempt login, Then system requires email + password + TOTP (from authenticator app) for super-admin; other roles optional 2FA in MVP.
  - Given a logged-in ops-manager user, When they navigate to the Finance module, Then system returns 403 Forbidden.
  - Given an admin session with 30 minutes of inactivity, When user acts, Then system redirects to login.
  - Given any admin action (override, deactivate, refund, payout-approve), When executed, Then system writes immutable audit-log entry with user-ID + timestamp + reason-code + source-IP.

### Capability Area 2: Service Discovery

**FR-2.1 — Photo-first service catalogue browse (C-15)**
- *As a customer, I want to browse services by large photographs of the service being performed, not tiny icons, so that I can desire-pick what I need the way I would on Airbnb.*
- **Priority:** MVP-P2
- **Dependencies:** none
- **Acceptance criteria:**
  - Given a customer on home screen, When they scroll, Then they see full-bleed photographs of services (1 per card, minimum 320 pixels tall), commissioned in-house (not stock).
  - Given a service card, When customer taps, Then service detail page opens in < 800 ms.
  - Given a customer in a poor-network area, When catalogue loads, Then photos are progressively loaded with placeholders; app is usable within 3 seconds.
- **Free-tier note:** Images served via Firebase Storage CDN (5 GB + 1 GB/day free); aggressive caching.

**FR-2.2 — Service detail with transparent pricing (C-2, C-12)**
- *As a customer, I want to see the full fixed price AND any possible add-ons with trigger conditions before I book, so that I'm never surprised at the end.*
- **Priority:** MVP-P0
- **Dependencies:** FR-2.1
- **Acceptance criteria:**
  - Given a service detail page, When customer views, Then they see: hero price (bold, large), scope (bulleted "includes"), possible add-ons with trigger conditions (e.g., "Gas refill: +₹1,200 if pressure < X"), estimated duration, and FAQ.
  - Given a customer books a service, When they reach confirmation, Then the displayed price becomes the LOCKED price for the base service — technician cannot change it mid-service; add-ons require explicit customer approval at time of discovery.
  - Given a tech attempts to add a line-item during service, When customer is notified, Then customer sees a description, price, and explicit Approve / Decline buttons; tech cannot proceed without approval.

### Capability Area 3: Booking & Payment

**FR-3.1 — Trust Dossier per technician (C-1)**
- *As a customer about to book, I want to see the full profile of the technician assigned so that I can judge them as a human before they enter my home.*
- **Priority:** MVP-P0
- **Dependencies:** FR-1.2
- **Acceptance criteria:**
  - Given an assigned technician, When customer taps their name, Then trust dossier opens showing: real name + photo, DigiLocker-verified badge, years of experience, certifications, languages, total jobs completed, aggregate rating (from real customer reviews), and last 3 anonymized reviews.
  - Given a technician with incomplete KYC, When booking flow reaches assignment, Then system does not offer jobs to them (no half-verified dispatches).
  - Given the trust dossier, When customer wants to see more, Then they can tap to view additional reviews; 20 shown by default, infinite scroll for more.

**FR-3.2 — Pre-booking confidence score (C-8)**
- *As a customer evaluating a booking, I want to see quantified confidence markers in the first 5 seconds so that I don't hesitate.*
- **Priority:** MVP-P1
- **Dependencies:** FR-3.1
- **Acceptance criteria:**
  - Given a customer has selected a service and slot, When the confirmation screen loads, Then they see: "X% on-time in your area", "Y.Z★ avg in this area", "N techs within K km, nearest ETA M min".
  - Given insufficient data for an area (< 20 bookings historical), When screen loads, Then confidence markers show city-level aggregates with a "(limited local data)" footnote.
  - Given the customer taps any confidence marker, When expanded, Then methodology is shown in one sentence ("based on last 30 days in your pincode").

**FR-3.3 — Booking creation end-to-end**
- *As a customer, I want to go from catalogue to paid booking in 3 taps or fewer, so that booking is frictionless.*
- **Priority:** MVP-P0
- **Dependencies:** FR-1.1, FR-2.1, FR-2.2, FR-3.1
- **Acceptance criteria:**
  - Given a customer on service detail, When they tap Book → select slot → confirm address → Pay, Then booking is created in `SEARCHING` state and Razorpay checkout opens.
  - Given a customer lacks any saved address, When booking flow reaches address step, Then Google Maps Places autocomplete + map-pin picker are presented; selection validates against service-area polygon.
  - Given payment succeeds, When Razorpay callback fires, Then booking transitions to `ASSIGNED_PENDING` and dispatch is triggered.
  - Given payment fails, When error occurs, Then booking stays in `SEARCHING` with 10-minute hold; customer can retry payment without re-entering details.
- **Free-tier note:** Google Maps Places + Geocoding within $200/month free credit (sufficient for pilot scale).

**FR-3.4 — Razorpay payment + Razorpay Route split**
- *As the owner, I want customer payments to auto-split into my commission + tech's earnings so that I don't have to manually settle.*
- **Priority:** MVP-P0
- **Dependencies:** FR-3.3
- **Acceptance criteria:**
  - Given a successful Razorpay payment of amount X, When capture is confirmed via webhook, Then Razorpay Route transfers to linked accounts: tech's share (X × (1 - commission%)) to tech's bank, owner's share (X × commission%) to owner account.
  - Given a refund is initiated by owner override (FR-9.3), When processed, Then Razorpay reverses proportionally from both parties' ledgers.
  - Given a tech's linked bank account is invalid, When Route transfer fails, Then system flags for manual resolution in owner admin; tech earnings sit in owner account pending resolution.
- **Free-tier note:** Razorpay and Route have zero monthly fees; transaction fee is 2% of GMV (from transaction, not from owner pocket).

**FR-3.5 — Live service tracking with granular status (C-5)**
- *As a customer, I want to know exactly what's happening at every moment of the service so that I'm never anxious about "what's going on."*
- **Priority:** MVP-P0
- **Dependencies:** FR-3.3, FR-4.1
- **Acceptance criteria:**
  - Given a tech is en route, When customer opens booking screen, Then they see tech's photo, name, real-time ETA, current map-position (dot updated every 30 s).
  - Given tech updates status (Reached / Started / Photo-captured / Completed / Finalized), When transition happens, Then customer receives FCM notification within 10 s AND booking screen updates.
  - Given a customer closes the app during service, When they reopen, Then status reflects latest state without stale cache.

### Capability Area 4: Dispatch & Matching

**FR-4.1 — Real-time nearest-tech dispatch with 30-sec ACK (core FCM spine)**
- *As the system, I want to find the nearest qualified technician and offer them the job with pre-acceptance context, honouring Karnataka right-to-refuse.*
- **Priority:** MVP-P0
- **Dependencies:** FR-3.3, FR-5.1
- **Acceptance criteria:**
  - Given a booking transitions to `ASSIGNED_PENDING`, When dispatcher runs, Then it queries Cosmos DB geospatial index for techs matching category + available slot + within 5 km + acceptance-rate ≥ 30% + rating ≥ 3.5, ordered by distance + rating + recency-of-last-job.
  - Given the dispatcher has a candidate list, When it sends the offer, Then FCM data message with rich context (FR-5.1) is pushed; tech has 30 seconds to accept.
  - Given a tech declines OR fails to accept within 30 s, When timeout fires, Then system offers to next candidate; candidate's decline has ZERO impact on their future ranking (Karnataka compliant).
  - Given all candidates decline or time out after 3 iterations, When dispatch fails, Then booking moves to `UNFULFILLED`; customer notified with options (reschedule, cancel for full refund, manual owner assignment).
- **Free-tier note:** Cosmos DB geospatial indexing is native; FCM data messages are unlimited free; no WebSocket server costs.

### Capability Area 5: Technician Experience

**FR-5.1 — Pre-acceptance job offer with rich context (T-1, T-4)**
- *As a technician, I want to see the full economic picture of a job offer before I accept so that I can make informed decisions.*
- **Priority:** MVP-P0
- **Dependencies:** FR-4.1
- **Acceptance criteria:**
  - Given a job offer push arrives, When tech taps notification, Then offer card shows: customer first-name + society (not exact flat), service name + any special requirements, slot date/time, parking notes from customer, travel distance (km), estimated duration, and earnings preview — "Customer pays ₹X → your share ₹Y (Z%) • Owner ₹A • Platform ₹B".
  - Given the offer card, When tech scrolls, Then a "Why this job came to you" line is shown ("You're 3rd nearest, 4.8★ rating on AC service, 5 min away") — algorithm transparency.
  - Given tech hits Accept, When state transitions, Then booking moves to `ASSIGNED` and other candidates receive "No longer available" push.
  - Given tech hits Decline, When state transitions, Then no ranking change; reason prompt optional.

**FR-5.2 — Real-time earnings dashboard (T-2)**
- *As a technician, I want to see my earnings update live and track progress toward monthly goals so that I feel motivated and in control.*
- **Priority:** MVP-P1
- **Dependencies:** FR-3.4, FR-6.1
- **Acceptance criteria:**
  - Given a tech opens app home, When they see dashboard, Then counters update in real-time: Today's earnings + jobs, This Week, Month-to-date with goal-progress bar (if goal set).
  - Given a tech completes a job, When payment captures, Then dashboard pending-earnings counter increases within 30 s.
  - Given a tech sets a monthly goal (optional), When pipeline view shown, Then app projects monthly total based on pace and compares to goal.

**FR-5.3 — Flexible payout cadence (T-3)**
- *As a technician, I want to choose how often I get paid — weekly, next-day, or instant — so that I can manage my cash flow.*
- **Priority:** MVP-P1
- **Dependencies:** FR-3.4
- **Acceptance criteria:**
  - Given a tech opens wallet settings, When they change cadence, Then: Weekly (free, standard), Next-Day (₹15/payout), Instant-post-job (₹25/payout) options visible. Changes take effect next payout window.
  - Given a tech selects Instant, When they complete a job, Then earnings are disbursed to linked bank within 30 minutes of job completion (minus ₹25 fee).
  - Given a tech selects Next-Day, When their day ends at 11:59 PM, Then all that day's earnings are released next business day at 10 AM (minus ₹15 total).
- **Free-tier note:** Razorpay Route handles the disbursement; the ₹15/₹25 fees cover Razorpay's transaction cost + marginal overhead.

**FR-5.4 — Guided photo capture at each service stage (T-7)**
- *As a technician, I want the app to prompt me for photos at the right moments so that photo compliance is 100% without me having to remember.*
- **Priority:** MVP-P0
- **Dependencies:** FR-3.5
- **Acceptance criteria:**
  - Given a tech taps "Started Work", When state transitions, Then camera auto-opens with AR prompt ("Capture the AC indoor unit") and photo is required to proceed.
  - Given tech taps "Completed", When state transitions, Then camera auto-opens for after-photo; at least 1 before and 1 after per job is required.
  - Given photos are captured, When upload happens, Then images are compressed on-device (< 200 KB each), uploaded to Firebase Storage with `booking-id/before.jpg` and `booking-id/after.jpg` keys.
- **Free-tier note:** Firebase Storage 5 GB + 1 GB/day download free — ample at 1 GB/year accumulation rate.

**FR-5.5 — Rating transparency with written feedback + sub-scores (T-10)**
- *As a technician, I want to see exactly what customers say about me and why, so that I can improve.*
- **Priority:** MVP-P1
- **Dependencies:** FR-6.1
- **Acceptance criteria:**
  - Given a customer submits a rating, When stored, Then tech sees within 30 seconds: numeric rating, written text (if provided), and sub-scores (Punctuality, Skill, Attitude — each 1-5).
  - Given a tech views their profile summary, When displayed, Then they see aggregate: avg rating, sub-score averages, rating trend over last 30 days, and count of each rating tier.
  - Given a rating is < 5, When tech receives it, Then FCM push notifies them gently with the written feedback prominently shown.

**FR-5.6 — Abusive customer shield with auto-block (T-11)**
- *As a technician, I want to report abusive customers in one tap and never be matched with them again, so that I feel safe on the platform.*
- **Priority:** MVP-P0
- **Dependencies:** FR-4.1, FR-9.1
- **Acceptance criteria:**
  - Given a tech experiences a safety issue, When they tap "Report customer" from active-job screen, Then: optional photos + description captured, system immediately adds customer to tech's private block-list, and owner is alerted via FCM within 10 s.
  - Given a customer is blocked by one tech, When dispatcher runs, Then that tech is not offered that customer's bookings ever again (customer-tech block pair persists).
  - Given a customer accrues 3+ tech-initiated reports, When threshold triggered, Then customer is auto-flagged for owner review; owner can blacklist customer platform-wide (FR-9.3).
  - Given tech reports a safety-critical issue (SOS variant), When escalated, Then owner is alerted within 10 s; tech is compensated 50% of job fee as force-majeure protection; no rating impact on tech.

**FR-5.7 — Rating appeal with evidence (T-23)**
- *As a technician, I want to appeal unfair ratings with evidence, so that one bad customer doesn't destroy my livelihood.*
- **Priority:** MVP-P0
- **Dependencies:** FR-5.5
- **Acceptance criteria:**
  - Given a tech receives a sub-3★ rating, When they tap "Appeal", Then they can upload evidence (photos, chat logs) and state their case (max 500 chars).
  - Given an appeal is filed, When owner reviews, Then owner decides within 48 hours to: Uphold (rating stays), Remove (rating deleted from tech's aggregate), or Partial-Remove (rating stays but is flagged as disputed-visible-to-customer-only).
  - Given a tech has filed 1 appeal in the current calendar month, When they try to file another, Then system rejects with message "one appeal per month; next available ⟨date⟩".
  - Given appeal outcome, When decided, Then tech is notified via FCM with decision reason; appeals are logged in audit log (FR-9.4).

### Capability Area 6: Ratings, Feedback & Disputes

**FR-6.1 — Mutual rating (customer → tech and tech → customer)**
- *As a customer or technician, I want to rate the other party after the service so that future matching improves and bad actors are filtered out.*
- **Priority:** MVP-P0
- **Dependencies:** FR-3.4
- **Acceptance criteria:**
  - Given a booking reaches `CLOSED` state after successful payment, When customer opens app, Then they are prompted to rate (1-5★) + optional comment + sub-scores (Punctuality, Skill, Attitude) within 24 hours.
  - Given a booking closes, When tech opens app, Then tech is prompted to rate the customer (1-5★) + optional comment; customer's rating is used for future dispatch filtering.
  - Given both parties submit ratings, When stored, Then each party's rating is visible to the other party but never mid-booking (to prevent tit-for-tat).
  - Given a rating is not submitted within 7 days, When timeout fires, Then system stores no rating and does not nag.

**FR-6.2 — Rating shield for pre-review owner escalation (C-36)**
- *As a customer, I want the option to escalate to the owner before posting a < 3★ rating so that legitimate complaints get resolved before reputation damage.*
- **Priority:** MVP-P0
- **Dependencies:** FR-6.1, FR-9.1
- **Acceptance criteria:**
  - Given a customer is about to submit a < 3★ rating, When they tap Submit, Then system intercepts with: "Want the owner to fix this first? We'll respond in 2 hours. You can still post your rating after." with options "Yes, escalate" / "No, post rating".
  - Given customer chooses escalate, When clicked, Then a complaint is auto-created (FR-6.3) with the draft rating + comment attached; owner gets FCM alert; 2-hour SLA timer starts.
  - Given owner resolves within 2 hours, When resolution is acknowledged by customer, Then customer can choose to (a) post original rating, (b) update rating, (c) withdraw rating.
  - Given owner misses 2-hour SLA, When timeout fires, Then original rating auto-posts AND complaint remains open for resolution.

**FR-6.3 — Complaint creation and SLA tracking (O-19)**
- *As a customer, I want to file a complaint and know it will be addressed on a clear timeline so that I'm not left hanging.*
- **Priority:** MVP-P1
- **Dependencies:** FR-3.3
- **Acceptance criteria:**
  - Given a booking exists, When customer taps "File a complaint", Then they select category (service-quality / tech-behavior / pricing / damage / other), describe, and optionally attach photos.
  - Given complaint filed, When submitted, Then SLA timer starts: Acknowledge in 2 hrs, Resolve in 24 hrs.
  - Given SLA breaches, When time elapses, Then system auto-escalates (ops → super-admin); customer sees status "escalated"; audit log records the escalation.
  - Given complaint is resolved, When owner marks with resolution (refund / re-service / compensation / no-action-justified), Then customer is notified and can accept or reopen once.

**FR-6.4 — Tech no-show detection with auto-credit (C-11)**
- *As a customer, I want automatic compensation if a tech no-shows, so that I'm not at a dead-end when things go wrong.*
- **Priority:** MVP-P0
- **Dependencies:** FR-3.3, FR-4.1
- **Acceptance criteria:**
  - Given a booked slot starts and a tech has not marked "Reached" within 30 min of slot start, When timeout fires, Then booking auto-transitions to `TECH_NO_SHOW`, ₹500 credit auto-applied to customer wallet, and re-dispatch initiated (FR-4.1 with expanded radius).
  - Given re-dispatch finds another tech, When they accept, Then customer receives FCM with new tech's details + apology message.
  - Given no tech accepts re-dispatch within 30 minutes, When timeout fires, Then booking moves to `UNFULFILLED`, full payment refunded via Razorpay.
  - Given the original no-show tech, When tech's pattern crosses 2 no-shows in 30 days, Then owner is flagged to review tech's reliability; 3 no-shows triggers auto-pause until owner intervenes.

**FR-6.5 — Discreet safety SOS for customers (C-35)**
- *As a customer, especially a woman in beauty or late-hour bookings, I want a discreet emergency signal during active service so that I can get help quickly.*
- **Priority:** MVP-P2
- **Dependencies:** FR-3.5
- **Acceptance criteria:**
  - Given a service is `IN_PROGRESS`, When customer taps the discreet Safety icon on the service screen, Then: owner alerted via FCM within 5 s, optional audio recording begins (on-device, encrypted), nearest-police information displayed, and app shows a non-obvious "I need to reschedule this" message for customer to say aloud if they want a dignified exit.
  - Given SOS triggered, When owner receives alert, Then owner can call customer directly (in-app), view the live audio if customer opted-in, and initiate emergency actions (dispatch backup tech, force-tech-leave, contact police).
  - Given the SOS resolves safely, When owner marks clear, Then booking can be rescheduled or refunded; incident is logged in audit log; customer receives follow-up within 24 hrs.
  - Given the SOS is accidental, When customer cancels within 30 s, Then alert is dismissed without escalation.

### Capability Area 7: Owner Operations

**FR-7.1 — Live Operations Command Centre (O-1, O-2, O-3)**
- *As the owner, I want a single real-time dashboard showing all active techs and bookings on a city map so that I can run operations single-handedly.*
- **Priority:** MVP-P0
- **Dependencies:** FR-3.3, FR-4.1, FR-5.4
- **Acceptance criteria:**
  - Given owner opens admin dashboard, When page loads in < 3 s, Then display shows: (a) city map with live pins for each tech (color-coded: idle / en-route / on-job / offline), (b) real-time order feed with last 20 events (new booking / assigned / completed / issue), (c) today's counters (bookings, GMV, commission, payouts pending, open complaints).
  - Given a tech location updates, When data reaches Cosmos change feed, Then map pin updates on the dashboard within 30 s without refresh.
  - Given a new booking is created, When event fires, Then order feed adds the entry in real-time via FCM topic subscription.
- **Free-tier note:** Cosmos Change Feed → Azure Function → FCM topic → admin web (WebSocket-free real-time).

**FR-7.2 — Master orders table with drill-down (O-4, O-5)**
- *As the owner, I want to search, filter, and inspect any order with full detail so that I can resolve issues and audit operations.*
- **Priority:** MVP-P0
- **Dependencies:** FR-3.3
- **Acceptance criteria:**
  - Given owner visits Orders module, When table loads, Then all orders are listed with columns: ID, status, category, customer name (first + last initial), tech name, slot time, amount, date. Filters: status, category, date range, amount range, customer phone, tech ID, city.
  - Given owner taps an order row, When detail opens, Then they see full timeline (booking → assignment → dispatch → status transitions), customer + tech contacts, photos (before/after), payment details, refund history, complaint history, internal notes.
  - Given owner has filtered orders, When they export, Then CSV download with all columns + applied filter visible in the filename.

**FR-7.3 — Owner override controls (O-6)**
- *As the owner, I want to intervene in any order — re-assign tech, refund, waive fees, escalate — so that I can handle edge cases.*
- **Priority:** MVP-P0
- **Dependencies:** FR-7.2
- **Acceptance criteria:**
  - Given an order in any active state, When owner taps Override, Then options include: Re-assign tech (with reason), Manual Mark Complete (with reason), Issue Refund (partial or full + reason), Waive Cancellation Fee (with reason), Escalate to Complaint (auto-creates), Add Internal Note.
  - Given owner selects any override, When executed, Then audit log entry is written (user, timestamp, action, reason-code, before-state, after-state) and change propagates to customer + tech apps in real-time.
  - Given owner blacklists a customer, When action completes, Then customer's future bookings are rejected at API gateway; ongoing bookings are honored; audit log records the ban with reason.

**FR-7.4 — Immutable audit log (O-28)**
- *As the owner (and as a regulator), I want every admin action to be traceable and impossible to alter, so that we have legal protection and accountability.*
- **Priority:** MVP-P0
- **Dependencies:** FR-7.3
- **Acceptance criteria:**
  - Given any admin action (override, refund, deactivate, payout-approve, complaint-resolve, catalogue-edit), When executed, Then an append-only record is written to Cosmos DB `audit_log` collection with: user-ID, role, timestamp (UTC), IP, action-type, reason-code, before-state hash, after-state hash.
  - Given an audit entry exists, When someone attempts to modify or delete it, Then Cosmos security rules reject the operation (read-only from application layer).
  - Given owner views audit log, When filtered by user / date range / action-type, Then results render in < 2 s; export to CSV available.
  - Given a tech disputes an action taken against them (e.g., deactivation), When they request an appeal (FR-5.7), Then the audit log entry is cited in the response; tech cannot view the log but owner can.

### Capability Area 8: Owner Finance & Payouts

**FR-8.1 — Daily P&L dashboard (O-13)**
- *As the owner, I want to see daily profit, payouts, and margin so that I always know if the business is healthy.*
- **Priority:** MVP-P0
- **Dependencies:** FR-3.4
- **Acceptance criteria:**
  - Given owner visits Finance module, When dashboard loads, Then shows today's: GMV, commission earned, payouts pending, refunds issued, gateway fees deducted, computed contribution margin.
  - Given owner selects a prior date, When filter applied, Then the same breakdown for that date is shown; 30-day rolling chart visible.
  - Given a discrepancy in computed commission vs received (Razorpay reconciliation), When detected, Then flagged with red indicator; ops can click to investigate.

**FR-8.2 — Weekly payout queue with Razorpay Route (O-14)**
- *As the owner, I want to approve weekly tech payouts in one action so that settlement is fast and traceable.*
- **Priority:** MVP-P0
- **Dependencies:** FR-5.3, FR-3.4
- **Acceptance criteria:**
  - Given each Monday morning, When system aggregates, Then a payout queue is generated listing each tech with: net earnings for the week (minus commission, minus instant/next-day fees if applicable), cumulative pending balance, linked bank account status.
  - Given owner reviews queue, When they hit "Approve All" or "Approve Individual", Then Razorpay Route disburses to each linked bank account; each disbursement logs an audit entry.
  - Given a disbursement fails, When error captured, Then the amount returns to pending balance and owner is alerted; the tech is notified via FCM with instructions to fix bank linkage.

### Capability Area 9: Compliance Enforcement

**FR-9.1 — Karnataka right-to-refuse compliance (architectural)**
- *As a technician (and the platform, per law), I want tech decisions to decline jobs to have ZERO impact on future dispatch ranking, so that I'm not punished for exercising my rights.*
- **Priority:** MVP-P0 (legal obligation)
- **Dependencies:** FR-4.1
- **Acceptance criteria:**
  - Given the dispatch algorithm computes tech ranking, When input features are assembled, Then NONE of: historical decline count, decline ratio, decline-in-last-N-days, or any decline-derived feature is used. This is architecturally enforced — not an algorithmic choice.
  - Given the ranking algorithm is modified, When PR is reviewed, Then a test in the integration suite validates that decline-history does not affect ranking for otherwise-identical techs.
  - Given an audit, When a regulator requests, Then the algorithm's input features are publishable with 1 week's notice; internal documentation of features is maintained in architecture docs.

**FR-9.2 — Central SSC aggregator levy automation (O-30 — MVP partial)**
- *As the owner, I want the 1-2% aggregator levy per the Central Social Security Code to be auto-calculated and remitted quarterly, so that I stay compliant without manual effort.*
- **Priority:** MVP-P0 (legal obligation)
- **Dependencies:** FR-8.1
- **Acceptance criteria:**
  - Given each booking completes, When GMV is recorded, Then 1-2% (configurable, starts at 1%) is accumulated in a dedicated "SSC-Contribution" ledger per quarter.
  - Given quarter-end, When trigger fires, Then system generates an itemised report (for CA filing) and transfers the accumulated amount to the central SSC fund bank account via a scheduled Razorpay payout.
  - Given the quarter's SSC remittance is confirmed, When webhook receives, Then entry is logged in audit log + Finance module; owner reviews quarterly.

---

## Non-Functional Requirements

Consolidated, testable NFRs. Each is numbered and verifiable. Cross-references earlier sections (Success Criteria §User/Business/Technical, Project-Type §3, Domain §Compliance) to avoid duplication — this section formalises the contract.

### NFR-P — Performance

| ID | Requirement | Measurement |
|---|---|---|
| NFR-P-1 | Read API (catalogue, orders list, profile) p95 latency < 500 ms | Application Insights dashboard; alert at > 500 ms sustained 5 min |
| NFR-P-2 | Write API (booking, rating) p95 latency < 800 ms | Application Insights dashboard |
| NFR-P-3 | Dispatch (booking → first FCM push) p95 < 2 s | Custom instrumentation in dispatcher function |
| NFR-P-4 | FCM data message delivery p95 < 5 s | PostHog event timing from push-sent → push-received |
| NFR-P-5 | Mobile cold start p95 < 3 s on ₹15k Android on 3G | Firebase Performance Monitoring |
| NFR-P-6 | Admin dashboard first-contentful-paint p95 < 3 s | Lighthouse CI in ship.yml |
| NFR-P-7 | Photo upload p95 < 8 s on 3G for 200 KB compressed | Custom telemetry |
| NFR-P-8 | 500 concurrent bookings load-test: dispatch p95 < 2 s, zero payment failures | Load test in pre-release; documented in runbook |

### NFR-R — Reliability & Availability

| ID | Requirement | Measurement |
|---|---|---|
| NFR-R-1 | API uptime ≥ 99.5% MVP / ≥ 99.9% Phase 2 | Azure Monitor + synthetic health-checks every 1 min |
| NFR-R-2 | Zero data loss (Cosmos DB continuous 7-day backup) | Azure Backup service verification quarterly |
| NFR-R-3 | Disaster Recovery: RPO ≤ 1 hour, RTO ≤ 4 hours | Runbook + quarterly DR drill |
| NFR-R-4 | Payment capture to Razorpay: 99.95% success rate (excluding customer-side failures) | Razorpay dashboard + our reconciliation |
| NFR-R-5 | FCM delivery success ≥ 95% within 10 s | PostHog telemetry |

### NFR-S — Security

| ID | Requirement | Measurement |
|---|---|---|
| NFR-S-1 | All data in transit: TLS 1.2+ | Semgrep SAST rule + CI gate |
| NFR-S-2 | All data at rest: encrypted (Azure + Firebase defaults) | Infrastructure-as-code validation |
| NFR-S-3 | Aadhaar number NEVER stored server-side (tokenized DigiLocker only) | Code audit + Semgrep custom rule banning Aadhaar-shaped strings in any write path |
| NFR-S-4 | Card data NEVER touches our code (Razorpay SDK only) | PCI scope offloaded; attested by Razorpay |
| NFR-S-5 | RBAC enforced on admin (5 roles: super-admin, ops, finance, support, marketing) | Role assertions in every admin endpoint; integration tests |
| NFR-S-6 | Immutable audit log (append-only, no update/delete) | Cosmos DB security rules + access-control policy |
| NFR-S-7 | Force TOTP 2FA for super-admin | Auth flow tested in Playwright e2e |
| NFR-S-8 | 30-min admin session inactivity timeout | Middleware config + test |
| NFR-S-9 | Secrets never in code, only Key Vault | `git-secrets` pre-commit hook + Semgrep pattern |
| NFR-S-10 | API rate limits enforced (Auth 10/min, Booking 30/min, Admin 100/min, Global 1000/min per IP) | Azure Functions rate-limit middleware; tested |
| NFR-S-11 | Annual penetration test from Phase 2 onwards | Vendor engagement tracked in runbook |
| NFR-S-12 | Dependency audit on every CI run (Snyk/pnpm audit/OWASP) | CI gate in ship.yml |

### NFR-C — Compliance

| ID | Requirement | Measurement |
|---|---|---|
| NFR-C-1 | Karnataka Platform Workers Act: right-to-refuse without ranking penalty | Integration test validates declines don't affect ranking (FR-9.1) |
| NFR-C-2 | Central Social Security Code: 1-2% aggregator levy auto-calculated, quarterly remittance | Ledger audit + CA-verifiable report (FR-9.2) |
| NFR-C-3 | DPDP Act: India data residency (Azure India Central + Firebase Asia-South1) | Infrastructure audit; data-transfer map in architecture docs |
| NFR-C-4 | GST e-invoicing for all paid bookings | IRP integration; invoice register audit |
| NFR-C-5 | DPDP: explicit consent capture for each data use | UX-enforced consent flows; log of consent per user |
| NFR-C-6 | DPDP: 72-hour breach notification readiness | Runbook documents notification workflow |
| NFR-C-7 | DPDP: right-to-access + right-to-delete flows | Implemented as customer profile actions; tested in e2e |
| NFR-C-8 | Karnataka welfare board contributions: accurate per registered tech | Monthly reconciliation with welfare board |

### NFR-A — Accessibility

| ID | Requirement | Measurement |
|---|---|---|
| NFR-A-1 | WCAG 2.1 Level AA conformance for admin web | axe-core in CI; manual review for keyboard nav |
| NFR-A-2 | Android apps: TalkBack screen reader usable on all critical flows | Google Accessibility Scanner pass; manual smoke test |
| NFR-A-3 | Dark mode: pixel-perfect parity on all screens | Paparazzi screenshot tests cover light+dark |
| NFR-A-4 | Minimum font size 14sp / 14px on all surfaces | Linting rule in style guide |
| NFR-A-5 | Color contrast ratio ≥ 4.5:1 for text | axe-core + design system enforcement |

### NFR-L — Localisation

| ID | Requirement | Measurement |
|---|---|---|
| NFR-L-1 | MVP: English + Hindi (HI) MUST be selectable in-app on all external mobile surfaces (customer-app + technician-app) via in-app language picker (`AppCompatDelegate.setApplicationLocales()`); not system-locale-only. First-launch picker; persisted choice. Admin-web stays English-only for MVP (E12-S03 Phase 2 stub). | String resource files in both apps; first-launch picker test; Paparazzi screenshots in `values-hi/` variant; field copy testing per E10-S04 launch AC |
| NFR-L-2 | Phase 2: Tamil, Bengali, Marathi, Telugu, Kannada added | Rollout plan in Phase 2 backlog |
| NFR-L-3 | Currency: ₹ with Indian number formatting (lakhs/crores) | Unit test for formatter |
| NFR-L-4 | Dates: 12-hour clock, DD-MMM-YYYY (e.g., "17 Apr 2026") | Unit test |
| NFR-L-5 | Devanagari + regional scripts must not break layouts at max string length | Figma design validates with longest translations |

### NFR-O — Observability

| ID | Requirement | Measurement |
|---|---|---|
| NFR-O-1 | Structured logs (JSON) to Application Insights for all backend requests | Logger middleware; free tier 5 GB/month |
| NFR-O-2 | Error tracking via Sentry across mobile + web + api (free tier 5k errors/month) | Sentry integration tested |
| NFR-O-3 | Product analytics via PostHog: user events, cohort retention, A/B testing | Instrumentation on critical user actions (free tier 1M events/month) |
| NFR-O-4 | Real-time business KPIs on owner dashboard (GMV, bookings, payouts, complaints) | FR-7.1 implementation |
| NFR-O-5 | Alert on critical production issues: payment failures > 5%, dispatch failures > 10%, API uptime < 99% | Azure Monitor alerts |
| NFR-O-6 | Distributed tracing via OpenTelemetry (api ↔ Cosmos ↔ Razorpay ↔ FCM) | OTel instrumentation on all integration boundaries |

### NFR-U — Usability

| ID | Requirement | Measurement |
|---|---|---|
| NFR-U-1 | Time to first completed booking (new customer) ≤ 90 s | PostHog funnel |
| NFR-U-2 | Time to accept first job offer (new technician after onboarding) ≤ 30 s | PostHog funnel |
| NFR-U-3 | 3-tap booking maximum (category → service → confirm) | UX design constraint; enforced in wireframe review |
| NFR-U-4 | Single hero CTA per screen (not 30 competing CTAs like UC) | UX design principle; Figma component library enforces |
| NFR-U-5 | Photo-first service browsing (images ≥ 320 px tall) | Design system spec |

### NFR-M — Maintainability & Cost

| ID | Requirement | Measurement |
|---|---|---|
| NFR-M-1 | ₹0/month operational infra at pilot scale (≤ 5000 bookings/mo) | Monthly Azure + Firebase cost reports |
| NFR-M-2 | ≤ ₹50,000/month at full scale (≤ 50000 bookings/mo) | Monthly cost reports + alerts |
| NFR-M-3 | Zero paid SaaS dependencies (any new paid SaaS requires ADR + approval) | Dependency audit + ADR count |
| NFR-M-4 | Test coverage ≥ 80% (unit) on all surfaces | Kover / Vitest / Paparazzi CI reports |
| NFR-M-5 | TypeScript `strict: true` and Kotlin `-Werror` — no warnings allowed | CI gate |
| NFR-M-6 | All code changes via PR with Codex-review-passed marker | Git policy + hook |
| NFR-M-7 | Every significant decision recorded as numbered ADR in `docs/adr/` | Review in code-review gate |
| NFR-M-8 | Runbook kept current: every incident type has documented resolution | Quarterly runbook review |
| NFR-M-9 | Free-tier limits monitored with alerts at 70% and 85% | Custom Azure Monitor dashboards |

---

## Open Questions

20 from Phase 1 brainstorm + 3 new ones surfaced during PRD writing. Recommended defaults listed — final decisions in Phase 3 (UX), Phase 4 (architecture), or via owner decision.

| # | Question | Recommended Default | Decision Phase |
|---|---|---|---|
| OQ-1 | Brand name | Brainstorm 5 candidates; Indian with `.in` + `.com` available | Phase 3 (before UX) |
| OQ-2 | Pilot city | Bengaluru (forces Karnataka compliance as MVP) OR Pune (less regulatory burden) | Phase 3 |
| OQ-3 | Initial 5 categories | AC Repair, Water Pump / Borewell, Plumbing, Electrical, RO / Water Purifier (revised 2026-05-01 for Ayodhya pilot — see umbrella spec §2.3) | Pre-launch |
| OQ-4 | Exact commission % | 22% for first 100 techs → ladder to 25% at 50-job/tech milestone | Pre-launch |
| OQ-5 | Default payout cadence | Weekly (with T-3 flexible options) | MVP |
| OQ-6 | Working capital source | Founder-funded or client-funded | Pre-launch (must confirm) |
| OQ-7 | Marketing budget for pilot | ₹5 lakh recommended (80% organic + 20% paid) | Pre-launch |
| OQ-8 | Insurance partner | ICICI Lombard (largest home market share) OR Acko (digital-native) | Phase 2 |
| OQ-9 | Pilot launch target date | 4 months after Phase 2 PRD approval | Phase 5 sprint planning |
| OQ-10 | Pilot success metric threshold | 5k bookings/mo contribution-margin-positive OR 500 bookings with NPS ≥ 65 | Pre-launch |
| OQ-11 | Brand visual identity budget | ₹30-50k via Toptal freelance designer | Phase 3 |
| OQ-12 | DigiLocker partner registration lead time | Apply Week 1; expect 2-3 weeks | Pre-launch |
| OQ-13 | Truecaller SDK registration lead time | Apply Week 1; expect 1-2 weeks | Pre-launch |
| OQ-14 | Razorpay business onboarding | Week 1; expect 1 week | Pre-launch |
| OQ-15 | Pilot technician exclusivity | 3-month soft exclusivity for top 20 techs (22% lock) | Pre-launch |
| OQ-16 | Customer data retention policy | 2 years active + 5 years archived (DPDP minimum) | Pre-launch |
| OQ-17 | Founder weekly time commitment | 4 hrs/day × 6 days sustainable | Ongoing |
| OQ-18 | iOS Phase 4 approach | SwiftUI (native best) OR Kotlin Multiplatform (shared logic) | Phase 4 |
| OQ-19 | Cosmos DB partition strategy | Per-city + per-month partitions for orders; per-tech for wallet | Phase 4 architecture |
| OQ-20 | Multi-city expansion trigger | 5k bookings/mo sustained × 3 months in pilot | Post-MVP |
| **OQ-21** (new) | Firebase Auth SMS fallback threshold | Truecaller-first; OTP fallback only if Truecaller unavailable (~5% of users) | MVP |
| **OQ-22** (new) | Service area polygon definition (pilot city) | 3-5 pin codes in pilot's IT-corridor | Pre-launch |
| **OQ-23** (new) | Razorpay Instant Settlement onboarding | Apply at MVP; use only if working capital float becomes critical | Post-MVP if needed |

## Locked Decisions (D1–D28)

Carried forward from brainstorm, unchanged:

- **D1–D20:** see `_bmad-output/planning-artifacts/product-brief.md` Appendix A
- **D21:** MVP = exactly 25 features (§Product Scope)
- **D22:** Pre-launch 2-week vendor recruitment sprint mandatory; coding does not start until 50 techs onboarded
- **D23:** Soft launch to 100 friends-and-family (not public) for first month post-MVP
- **D24:** Commission ladder starts at 22% for first 100 techs, ladders to 25% at 50-job milestone
- **D25:** Karnataka Platform Workers Act compliance is MVP, not Phase 2 (right-to-refuse architectural)
- **D26:** Women-safe defaults + SOS are MVP brand pillar (C-7, C-35)
- **D27:** Owner live-ops command centre (O-1, O-2, O-3) is MVP — solo-founder operability depends on it
- **D28:** Rating shield (C-36) is MVP — prevents launch-review catastrophe

## Appendix — Glossary & Abbreviations

**Domain terms:**

- **Aggregator levy:** 1–2% of GMV contributed to central social-security fund per Central Social Security Code 2025
- **Booking:** Customer's request for a service; lifecycle CREATED → SEARCHING → ASSIGNED → EN_ROUTE → REACHED → IN_PROGRESS → COMPLETED → PAID → CLOSED
- **Commission:** Owner's share of GMV (22-25% MVP) after Razorpay fees
- **Dispatch:** Process of matching a booking to the nearest qualified available technician
- **DigiLocker:** Government of India's digital document platform; used for Aadhaar verification (free, tokenized)
- **DPDP:** Digital Personal Data Protection Act 2023 (India)
- **FCM:** Firebase Cloud Messaging — unlimited free push notifications, used as universal messaging spine
- **GMV:** Gross Merchandise Value — total paid amount for all bookings in a period
- **Karnataka Act:** Karnataka Platform Based Gig Workers (Social Security and Welfare) Act 2025
- **KYC:** Know Your Customer — identity verification; for techs we use DigiLocker Aadhaar + Azure Form Recognizer PAN
- **NPS:** Net Promoter Score
- **Payout:** Transfer of tech's earned share from owner's Razorpay account to tech's linked bank account via Razorpay Route
- **PII:** Personally Identifiable Information
- **RBAC:** Role-Based Access Control
- **Razorpay Route:** Razorpay's split-payment product that auto-transfers portions of captured payment to multiple linked accounts
- **RU/s:** Request Units per second — Cosmos DB's throughput currency
- **SSC:** Social Security Code 2025 (central)
- **STRIDE:** Threat modeling framework (Spoofing, Tampering, Repudiation, Information-disclosure, DoS, Elevation-of-privilege)
- **Technician / Tech:** Service provider / gig worker who performs the booked service
- **Trust Dossier:** Customer-facing panel showing tech's verified identity, certifications, history (C-1)

**Abbreviations:**

- **API:** Application Programming Interface | **AAR:** Android Archive | **AAB:** Android App Bundle
- **AZ:** Availability Zone | **BAU:** Business As Usual | **CA:** Chartered Accountant (tax professional)
- **CAC:** Customer Acquisition Cost | **CDN:** Content Delivery Network | **CTA:** Call To Action
- **CI:** Continuous Integration | **DR:** Disaster Recovery | **DSS:** Data Security Standard (PCI)
- **ETA:** Estimated Time of Arrival | **FCM:** Firebase Cloud Messaging | **GST:** Goods and Services Tax
- **GSTIN:** GST Identification Number | **HNW:** High Net Worth | **HSN/SAC:** Tax classification codes
- **IRP:** Invoice Registration Portal (GST) | **ISO:** International Standards Organisation | **KYC:** Know Your Customer
- **LTV:** Lifetime Value | **MAU:** Monthly Active Users | **MVP:** Minimum Viable Product
- **NBFC:** Non-Banking Financial Company | **NPS:** Net Promoter Score | **OTP:** One-Time Password
- **OTel:** OpenTelemetry | **PaaS:** Platform as a Service | **PAN:** Permanent Account Number (tax ID)
- **PWA:** Progressive Web App | **RBI:** Reserve Bank of India | **RPO:** Recovery Point Objective
- **RTO:** Recovery Time Objective | **RU:** Request Unit (Cosmos DB) | **SaaS:** Software as a Service
- **SDK:** Software Development Kit | **SDET:** Software Development Engineer in Test | **SLO:** Service Level Objective
- **TOTP:** Time-based One-Time Password | **UC:** Urban Company | **UAT:** User Acceptance Testing
- **WCAG:** Web Content Accessibility Guidelines | **WFH:** Work From Home

## Document Map & Next BMAD Steps

**Sections in this PRD (step traceability):**

| Section | BMAD Step | Lines (approx) |
|---|---|---|
| Executive Summary + Project Classification | step-02c-executive-summary | ~40 |
| Success Criteria + Product Scope | step-03-success | ~200 |
| User Journeys | step-04-journeys | ~120 |
| Domain-Specific Requirements | step-05-domain | ~90 |
| Innovation & Novel Patterns | step-06-innovation | ~60 |
| Project-Type Specific Requirements | step-07-project-type | ~180 |
| Project Scoping & Phased Development | step-08-scoping | ~130 |
| Functional Requirements | step-09-functional | ~320 |
| Non-Functional Requirements | step-10-nonfunctional | ~140 |
| Open Questions + Locked Decisions + Glossary | step-11-polish + step-12-complete | ~80 |

**Next BMAD phases to execute:**

1. **Phase 3 — UX Design** (`/bmad-create-ux-design`, output: `docs/ux-design.md`) — screen flows + design system + frontend-design skill engagement for visual identity
2. **Phase 4 — Architecture + ADRs** (`/bmad-create-architecture`, output: `docs/architecture.md` + `docs/adr/0001-*.md`) — zero-cost stack blueprint, dispatch logic, Cosmos schema, FCM topology
3. **Phase 4.5 — Threat Model + Runbook** — `docs/threat-model.md` (STRIDE) + `docs/runbook.md` (incident response, oncall)
4. **Phase 5 — Epics + Stories** (`/bmad-create-epics-and-stories`) — decompose the 25 MVP features into implementation-ready stories in `docs/stories/`
5. **Phase 5.5 — Readiness Gate** (`/bmad-check-implementation-readiness` + `/bmad-validate-prd`) — on pass, write `.bmad-readiness-passed` marker; code work unlocked
6. **Per-story development loop** — each story: fresh session → `/superpowers:brainstorming` → `/superpowers:writing-plans` → fresh session → `/superpowers:executing-plans` → TDD → verification → 5-layer review including Codex CLI authoritative gate → CI gate → merge

---

**PRD v1.0 complete.** Ready for Phase 3 UX design.
