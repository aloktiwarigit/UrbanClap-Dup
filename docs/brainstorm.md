# Brainstorming Report — homeservices-mvp (BMAD Phase 1)

**Facilitator:** Mary (Strategic Business Analyst persona)
**Participant:** Alokt (Founder)
**Date:** 2026-04-17
**Approach:** Progressive Technique Flow — Role Playing → Mind Mapping → SCAMPER → Reverse Brainstorming (Pre-mortem)
**Session file (full transcript):** `_bmad-output/brainstorming/brainstorming-session-2026-04-17-2349.md`
**Feeds:** `docs/prd.md` (Phase 2 PRD)

---

## 1. Session Framing

### Scope (narrowed from product brief)

Small-scale (1 city max) **3-app home services marketplace** replicating Urban Company's **core business loop only** — customer request → nearest qualified technician → FCM-push to owner → owner receives payment → owner settles technician. Role-based visibility: customer sees their world, technician sees theirs, owner sees everything.

**Scope deferred to Phase 2+ (after core works):** multi-city, iOS, subscriptions (UC Plus equivalent), Native products marketplace, 15-min InstaHelp, ML dispatch, multi-language, B2B portal, international.

### Constraints

- **₹0/month operational infra** at pilot scale (Firebase + Azure free tiers; FCM universal spine)
- **Impeccable, world-class UI/UX** — the primary competitive wedge vs UC's 1.4★ experience
- **Solo founder + Claude Code** build using BMAD + Superpowers
- **Fair-to-vendor commission** — 22–25% vs UC's 28%
- **Karnataka Platform Workers Act + Central SSC** compliance from day 1

### Session Goals (confirmed by participant)

1. Prioritised **differentiator ideas** (especially UX angles that beat UC's 1.4★ NPS)
2. **Open questions** to feed Phase 2 PRD
3. **Unconventional angles** within scope
4. **Stress-tested assumptions** from the product brief

### Lens

**Role-first brainstorming.** Each of the 3 app users — Customer, Technician, Owner — has a distinct world of features needed. Each was brainstormed separately via Role Playing, then integrated via Mind Mapping, refined via SCAMPER, and stress-tested via Reverse Brainstorming.

---

## 2. Phase 1 — Role Playing Ideation

Total ideas generated: **91** across 3 roles × 28 domain pivots (anti-bias protocol: every ~10 ideas, pivoted to an orthogonal domain).

### 2.1 Customer's World — 37 ideas

Persona: **Riya**, 32, marketing manager, Bengaluru, Prestige Shantiniketan apartment. Books 2–4× / month. Premium-LTV. Judges apps on first 5 seconds.

| ID | Title | Concept (one-line) | Novelty vs UC |
|---|---|---|---|
| **Functional** | | | |
| C-1 | Trust Dossier per Technician | Tap tech → gov ID, bg-check, jobs count, certifications, languages, last 3 reviews on one screen | Airbnb-host-level transparency applied to a ₹600 service |
| C-2 | Fixed-Price Menu w/ Transparent Variables | Hero price + pre-listed add-ons with trigger conditions | UC hides variables till tech arrives |
| C-3 | One-Tap Re-book of Recurring Service | System suggests next slot with same tech; 1-tap confirm | Category shift for recurring (cleaning, pest, gardening) |
| C-4 | Bundled Visit (Multiple Services) | Book plumber + electrician same slot, coordinated arrival, single checkout | UC forces separate bookings + separate fees |
| C-5 | Live Service-in-Progress Updates | Tech pushes granular FCM stages (Started → Opened → Found Issue → Fixed → Testing) | Zomato-level granularity vs UC's "In Progress" 45-min silence |
| **Emotional / Trust** | | | |
| C-6 | Neighbourhood-Verified Tech Badge | "🏠 5 jobs in Shantiniketan" badge for society-regular techs | UC has no locality-level proof |
| C-7 | Women-Safe Filter (Default ON late-hours + beauty) | Default: women techs for beauty; enhanced-verified for any service after 7 PM | UC has it as buried filter |
| C-8 | Pre-Booking Confidence Score | "95% on-time • 4.7★ avg in your area • 2 techs within 3 km" | Quantified confidence vs UC's "Book Now" |
| C-9 | "What to Expect" Preview Video | 30s carousel for first-time booker of a category | UC assumes everyone knows |
| C-10 | 7-Day Fix Warranty (surfaced) | Auto-warranty displayed pre-booking as trust signal | UC has 30-day warranty but buries it |
| **Edge Case** | | | |
| C-11 | Tech No-Show Guarantee (₹500 credit) | Auto-compensation if tech fails 30-min window | UC is ambiguous on no-show compensation |
| C-12 | Price Locked at Booking | Booked price can't be changed; add-ons only with approval | UC has upcharging complaints |
| **Discovery** | | | |
| C-13 | Diagnose-My-Problem Quiz | 6 visual questions → AI triages to right service + ballpark | UC forces self-categorisation |
| C-14 | Society-Specific Service Feed | "Popular in Prestige Shantiniketan this week" | UC has no locality-level personalisation |
| C-15 | Photo-First Service Browse | Large photos of service being performed, not icon grid | UC uses 2012-era icon grid |
| C-16 | Emergency vs Planned Toggle | ⚡ Emergency (+25% surge) vs 📅 Planned (regular) | UC blurs urgency pricing |
| **Post-Service** | | | |
| C-17 | Auto-Generated Service Report PDF | Full report: work done, parts, photos, warranty, next-service date | UC sends bare invoice |
| C-18 | Home Maintenance Calendar | Timeline per home with FCM reminders (AC next, filter due, etc.) | UC treats bookings as independent |
| C-19 | Contextual Tipping Flow | After 4★+ rating: "Thank Suresh? ₹30/50/100/custom" | UC has no tipping |
| C-20 | Personal Home Photo Archive | Every before/after saved to private "My Home" gallery | UC discards photos post-verification |
| C-21 | 3-Day Post-Service Health Check | FCM: "How's the AC?" 😊/😐/😟 → 😟 triggers warranty | UC asks for review (annoying) |
| **Social** | | | |
| C-22 | Neighbour-Only Review Filter | Tech profile: filter reviews to My Society / Neighbourhood / Similar home | UC shows all reviews generically |
| C-23 | WhatsApp Share-My-Service Card | Rich WhatsApp card with invoice + next-service + referral link | UC sends PDF attachments nobody opens |
| C-24 | Gift a Service | Send deep-cleaning to mom in another city for Diwali | UC has no gifting — NRI + festive fit |
| C-25 | Society Group Booking Coordinator | 3 neighbours in same society = 15% off for all | UC is pure 1:1 |
| **Engagement** | | | |
| C-26 | Pre-Service Smart Checklist | FCM night before: "Clear kitchen, secure pets, parking at Block C" | UC expects customer to figure out |
| C-27 | Home Services Wrapped (Year-End) | Dec 31 shareable: "23 bookings, ₹15,400, fave tech Suresh 🐕" | UC has no annual moment |
| **Accessibility** | | | |
| C-28 | Low-Literacy Visual Booking Mode | Emoji-only flow with voice prompts in 6 languages | UC is English-first, text-dense |
| C-29 | Voice-First Booking (6 languages) | Speak Hindi/Bengali/Tamil/Telugu/Marathi/Kannada, AI transcribes | UC is text-only EN + HI |
| C-30 | Caregiver Dual-Access Mode | Daughter in Bengaluru books + tracks for father in Kanpur | UC treats each booking as single-user |
| **Money** | | | |
| C-31 | Transparent Payment Breakdown | Customer sees tech₹, owner₹, platform₹, tax₹ split | UC is opaque on splits |
| C-32 | Split Bill Between Roommates | At checkout: split via multiple UPI transactions | UC forces single payer |
| C-33 | Wallet with Auto-Top-Up | Pre-load ₹2k + 2% bonus; 1-sec checkout for repeats | UC runs full payment flow every time |
| C-34 | Corporate / GST Billing Mode | Toggle for WFH professionals → GST e-invoice to CA | UC's GST is buried + manual |
| **Dispute** | | | |
| C-35 | Discreet Safety SOS | Silent safety icon during service → owner alert + audio + police info | UC has no live-service safety escalation |
| C-36 | Rating Shield (Pre-Review Call) | <3★ about to post → "Let owner fix first? 2 hr SLA" | UC just posts 1★ publicly |
| C-37 | 60-Second Insurance Claim | Photo → select category → partner contacts in 24 hr | UC insurance claim = support ticket labyrinth |

### 2.2 Technician's World — 24 ideas

Persona: **Suresh**, 28, AC tech from Faridabad, ITI-certified, 4 years independent + 1 rough year on UC (quit over 28% commission + opaque ratings + ID-blocking). Married, one kid, saving for Activa.

| ID | Title | Concept | Novelty vs UC |
|---|---|---|---|
| **Earnings** | | | |
| T-1 | Pre-Acceptance Earnings Preview | Card shows customer₹, tech₹, owner₹, platform₹, travel km, est. duration BEFORE accept | UC shows location + service only |
| T-2 | Real-Time Earnings Dashboard | Today/week/month with goal progress, Robinhood-style | UC has dated ledger |
| T-3 | Flexible Payout Cadence | Weekly (free) / Next-Day (₹15) / Instant (₹25) — tech chooses | UC is fixed T+2 weekly |
| **Job Acquisition** | | | |
| T-4 | Rich Job-Offer Context | Customer first-name, society, special reqs, parking, "why you got this" reasoning | UC sends bare "Job offer: AC Service, 4.2 km" |
| T-5 | "I'm Here Now" Beacon | Tap "Available in Koramangala 30 min" → priority rank for cluster | UC dispatches off last-known location |
| T-6 | Slot Commitments for Priority | Commit to Tuesday 10-1 PM → priority + 0.5% commission reward | UC is pure on-demand |
| **Tools / Workflow** | | | |
| T-7 | Guided Photo Capture at Each Stage | "Started" → camera opens with AR prompt; 100% compliance | UC relies on tech remembering |
| T-8 | In-Job Parts Catalog (Scan + Add) | Barcode-scan capacitor → preset price → customer approval → line item | UC techs WhatsApp owner for approvals |
| T-9 | Auto-Gen Service Report (Tech Side) | 3-question template → combined with photos/parts → customer PDF | UC has no structured reporting |
| **Dignity** | | | |
| T-10 | Rating Transparency + Written Feedback | See numeric + written + sub-scores (punctuality/skill/attitude) | UC shows only aggregate numeric |
| T-11 | Abusive Customer Shield | 1-tap report → auto-block that customer from that tech; repeat escalated | UC has no tech→customer reporting |
| T-12 | Professional Profile Page (Public) | Customer-visible profile: certs, specialties, languages, portfolio, years | UC techs are faceless |
| **Career** | | | |
| T-13 | Skill Progression Levels | Apprentice → Junior → Senior → Expert → Master; better commission at higher levels | UC keeps everyone flat "professional" |
| T-14 | In-App Training Library (Vernacular) | 100+ 3-5 min videos in HI/TA/BN; skill badges on completion | UC has minimal post-onboarding training |
| T-15 | OEM Certification Partnerships | Daikin/Voltas/Kent official certs → priority on brand jobs + rate premium | UC doesn't broker OEM partnerships |
| T-16 | Featured Work Portfolio | Pin 10 past jobs (photos + testimonials) on profile | UC techs are interchangeable |
| **Safety** | | | |
| T-17 | Health Insurance + ESIC Auto-Enrollment | In-app enrollment: ESIC (free) or group private (₹300/mo) | UC added this only after 2026 protests |
| T-18 | Fatigue & Safety Guard | 10 hr/day, 60 hr/week limits — auto-pause new offers | UC dispatches indefinitely |
| T-19 | Weather / Emergency Dispatch Pause | Heavy rain/flood/48°C/AQI-450 → auto-cancel outdoor jobs + tech travel-reimbursement | UC dispatches through Delhi 2024 floods |
| **Community** | | | |
| T-20 | Tech Community Board (Per City) | Per-city peer forum: questions, tips, photos; karma points | UC has no peer forum |
| T-21 | Ride-Share Between Tech Jobs | Same-area techs share auto/cab; mentoring in transit | UC doesn't connect techs |
| T-22 | Tool / Equipment Financing | ₹15k tool kit upgrade → ₹500/mo deduction from earnings | UC has no financing |
| **Conflict** | | | |
| T-23 | Rating Appeal with Evidence | <3★ disputed → evidence → owner review 48 hr → remove if valid | UC ratings are immutable |
| T-24 | Force-Majeure Protection | Customer no-show / wrong address / flood → 50% fee + no rating impact | UC no-show policy is ambiguous |

### 2.3 Owner's World — 30 ideas

Persona: **Alokt**, founder-operator. Needs full real-time visibility, override authority, audit trail for legal protection, predictable margins. Builds solo with BMAD + Claude Code.

| ID | Title | Concept | Novelty vs UC |
|---|---|---|---|
| **Live Ops** | | | |
| O-1 | Real-Time City Map | Every tech + every booking as live pins, colour-coded status (idle/en-route/on-job/offline) | UC admin is list-based, not spatial |
| O-2 | Live Order Feed (Event Stream) | Websocket feed: booking created → assigned → completed, with timestamps | UC ops have dated reports, not real-time |
| O-3 | Today's Counters | GMV / commission / bookings / payouts pending / complaints — updating live | UC's admin shows yesterday's numbers |
| **Orders** | | | |
| O-4 | Master Orders Table | Searchable by status/city/category/tech/date/amount/phone | UC's internal tool not productised |
| O-5 | Order Drill-Down Detail | Timeline, photos, payments, refunds, complaints, internal notes on one screen | UC ops bounce across systems |
| O-6 | Override Controls | Re-assign / manual-complete / refund / waive-fee / escalate from detail view | UC requires support ticket for most overrides |
| **Tech Management** | | | |
| O-7 | Tech Roster View | KYC status, weekly earnings, lifetime GMV, rating, location, decline rate | UC tech data is scattered |
| O-8 | Per-Tech Commission Tuning | Top performers → lower commission; individual adjustments with reason | UC's commission tiers are rigid |
| O-9 | Activate / Deactivate / Ban Flows | With audit log + reason codes; Karnataka-compliant (no algorithmic penalty for protest) | UC notoriously ID-blocks protesters silently |
| **Customer Management** | | | |
| O-10 | Customer List (LTV + Complaint Count) | Lifetime spend, last booking, complaint ratio, blacklist toggle | UC has no customer-management surface |
| O-11 | VIP Customer Tagging | High-LTV tagged → priority dispatch + concierge complaint handling | UC treats all customers equally |
| O-12 | Lost Customer Alerts | "Riya hasn't booked in 45 days, usually monthly" → win-back flow trigger | UC doesn't surface churn signals |
| **Finance** | | | |
| O-13 | Daily P&L Dashboard | GMV, commission, payouts, refunds, gateway fees → contribution margin per day | UC does monthly P&L |
| O-14 | Weekly Payout Queue | Per-tech amount, approve/hold, auto-submit to Razorpay Route | UC's payout is fire-and-forget |
| O-15 | GST Output Register | Auto-generated e-invoices, HSN/SAC summary, ready for CA filing | UC's GST is manual Excel export |
| **Marketing** | | | |
| O-16 | Coupon CRUD with Usage Analytics | Create promos + track redemption / CAC impact / cohort | UC has internal tool, not ops-facing |
| O-17 | Referral Program Config | Multi-level (customer → friend → friend) reward rules, tracked | UC has basic one-level |
| O-18 | Push Campaigns (FCM Topics + A/B) | City/category/cohort-targeted pushes with A/B on copy | UC's marketing team has this, not ops owner |
| **Complaints** | | | |
| O-19 | Complaints Inbox with SLA Timer | Every complaint timed; auto-escalate on breach | UC has SLAs but enforcement is manual |
| O-20 | Resolution Categorisation | Refund / re-service / compensation / no-action — tracked for trends | UC lumps all into "resolved" |
| O-21 | Repeat-Offender Detection | Flag techs / customers with recurring complaints; propose action | UC's pattern detection is manual |
| **Analytics** | | | |
| O-22 | Cohort Retention Curves | Customer cohort × month; tech cohort × month | UC has BI team, not owner-facing |
| O-23 | Demand Heatmap | By locality, service, time-of-day, day-of-week | UC has internal data, not productised for ops |
| O-24 | Predictive Forecasts (7-day) | Tomorrow's GMV, tech demand, cash-flow 7 days out | UC doesn't expose forecasts to ops |
| **Catalog** | | | |
| O-25 | Service Catalog CRUD | Categories, services, pricing, includes/excludes, FAQs, photos | UC catalogue is centrally managed |
| O-26 | Dynamic Pricing Rules | Surge for peak, loyalty discounts, category-specific rules | UC has internal surge; opaque |
| O-27 | Tech-Service Matching Matrix | Which techs qualify for which services, with cert + experience gating | UC's matching logic is a black box |
| **Compliance** | | | |
| O-28 | Immutable Audit Log | Every admin action (override, deactivate, refund, payout) logged with who/when/why | UC has internal audit; not owner-accessible |
| O-29 | RBAC (super-admin / ops / finance / support / marketing) | Scoped permissions, force-2FA | UC has this for internal team, not small-shop owner |
| O-30 | Regulatory Dashboard | Central SSC levy (1-2%), Karnataka welfare board contributions, GST filings status | UC's regulatory compliance is legal-team-only |

### 2.4 Phase 1 Summary

- **91 ideas across 3 roles × 28 domain pivots**
- Anti-bias protocol (pivot every ~10 ideas) successfully broke semantic clustering
- Every idea has explicit Novelty vs Urban Company = differentiation story built in

---

## 3. Phase 2 — Mind Mapping (Feature Themes + Cross-Role Flows)

### 3.1 Per-Role Feature Themes

**Customer themes (10 derived from 37 ideas):**

1. **Trust Infrastructure** — C-1, C-6, C-8, C-10, C-22 (dossier, neighbourhood badge, confidence score, warranty, local reviews)
2. **Price Transparency** — C-2, C-12, C-31 (fixed menu, price lock, split breakdown)
3. **Live-Tracking Theatre** — C-5, C-26 (granular status, pre-service checklist)
4. **Service Completion Dossier** — C-17, C-18, C-20, C-21 (PDF report, maintenance calendar, photo archive, health check)
5. **Safety-First for Women & Seniors** — C-7, C-35, C-30 (default women-tech filter, SOS, caregiver dual-access)
6. **Cultural Moments** — C-24, C-27, C-25 (gifting, year-end wrapped, society group booking)
7. **Money Flexibility** — C-32, C-33, C-34 (split payment, wallet, GST mode)
8. **Voice + Vernacular** — C-28, C-29 (visual mode, voice booking in 6 languages)
9. **Recovery Engineering** — C-11, C-36, C-37 (no-show guarantee, rating shield, insurance claim)
10. **Personalised Discovery** — C-13, C-14, C-15, C-16, C-19 (diagnosis quiz, society feed, photo-browse, urgency toggle, contextual tipping)

**Technician themes (8 derived from 24 ideas):**

1. **Transparent Earnings** — T-1, T-2, T-3 (pre-accept preview, dashboard, flexible payout)
2. **Dispatch Respect** — T-4, T-5, T-6 (rich context, beacon, slot commitment)
3. **Job Execution Tools** — T-7, T-8, T-9 (guided photos, parts catalog, auto-report)
4. **Professional Identity** — T-10, T-12, T-16 (rating transparency, profile, portfolio)
5. **Career Elevator** — T-13, T-14, T-15, T-22 (levels, training, OEM certs, equipment financing)
6. **Vendor Welfare** — T-17, T-18, T-19 (health insurance, fatigue guard, weather pause)
7. **Peer Network** — T-20, T-21 (community board, ride-share)
8. **Protection Layer** — T-11, T-23, T-24 (abusive-customer shield, rating appeal, force majeure)

**Owner themes (10 derived from 30 ideas):**

1. **Live Ops Command Centre** — O-1, O-2, O-3
2. **Order Control Surface** — O-4, O-5, O-6
3. **Tech Governance** — O-7, O-8, O-9
4. **Customer Lifecycle** — O-10, O-11, O-12
5. **Finance Plane** — O-13, O-14, O-15
6. **Growth Engine** — O-16, O-17, O-18
7. **Trust & Resolution** — O-19, O-20, O-21
8. **Decision Support / BI** — O-22, O-23, O-24
9. **Product Catalog** — O-25, O-26, O-27
10. **Compliance + Audit** — O-28, O-29, O-30

### 3.2 Cross-Role Integration Patterns (the 7 flows that touch all 3 apps)

| Flow | Customer | Technician | Owner | Complexity |
|---|---|---|---|---|
| **F-A: Booking Lifecycle** | C-1 to C-17 (browse → book → track → done) | T-4 to T-9 (offer → accept → execute) | O-2, O-5, O-6 (observe + override) | HIGH — core loop |
| **F-B: Payment + Payout** | C-31 to C-34 | T-1 to T-3 | O-13, O-14, O-15 | HIGH — money movement |
| **F-C: Complaint + Dispute** | C-35, C-36, C-37 | T-11, T-23, T-24 | O-19, O-20, O-21 | MEDIUM — resolution |
| **F-D: Rating + Reputation** | C-22 | T-10, T-12, T-16, T-23 | O-7, O-8, O-21 | MEDIUM — two-sided trust |
| **F-E: Service Quality / Photos** | C-5, C-20, C-21 | T-7, T-9 | O-5 | LOW — one-way data flow |
| **F-F: Marketing / Promos** | C-24, C-25 | — | O-16, O-17, O-18 | LOW — owner-driven |
| **F-G: Compliance / Audit** | — | T-17 (SSC levy impact) | O-28, O-29, O-30 | MEDIUM — legal infrastructure |

### 3.3 Gap Analysis

- **Owner-Technician direct communication:** thin — only T-11 (shield) + O-8 (commission tuning). Might need a tech-chat surface.
- **Customer education on unusual services:** C-9 covers video preview but no "ask the owner" surface.
- **Cross-customer anonymised insights** (e.g. "your neighbour also had this issue") — touched by C-14 but could be deeper.
- **Emergency services** (24×7): implicit in C-16 (emergency toggle) but no dedicated tech-availability-for-emergency flag.

### 3.4 Dependency Map (what blocks what)

- F-A Booking Lifecycle **blocks** everything — must be rock-solid before F-C/F-D/F-E ship
- F-B Payment **blocks** T-3 payout flexibility, O-13 P&L
- F-D Rating **blocks** T-10, T-23 (both depend on rating data model)
- C-14 Society feed **blocks on** 30+ bookings in that society (data bootstrap)
- O-22 Cohort analytics **blocks on** 3 months of data
- O-24 Forecasts **blocks on** ML model (Phase 3 of overall build, not MVP)

---

## 4. Phase 3 — SCAMPER Development (Top 10 Themes)

Each of the top 10 themes (most-leveraged for differentiation × most-achievable on ₹0 infra) put through the 7 SCAMPER lenses, each asking *"how does this beat UC's 1.4★ experience?"*

### SCAMPER-T1: Trust Infrastructure (C-1, C-6, C-8, C-10, C-22)

- **Substitute:** Replace "Book Now" CTA with "Meet your tech" as the final step — forces trust decision as the hero action, not an afterthought
- **Combine:** Merge tech dossier (C-1) + neighbourhood badge (C-6) + neighbour-only reviews (C-22) into one "Trust Card" on tech profile
- **Adapt:** Steal Airbnb's "verified" layering (ID + payment + reviews → different trust tiers) and apply to tech profile
- **Modify:** Add "trust score" (0-100) calculated from dossier + badges + reviews + jobs + rating; visible and explainable
- **Put to other uses:** Trust Card becomes the ONLY way customers can "favourite" a tech — saves it to their trusted-techs list
- **Eliminate:** No anonymous techs. Every tech has real name, real face, real portfolio. Never "technician" as placeholder.
- **Reverse:** Instead of customer trusting tech, make it explicit that TECH TRUSTS THIS CUSTOMER (both-way rating shown). Mutual respect framing.
- **Differentiation vs UC:** UC techs are faceless + reviews are generic. Our Trust Card + neighbourhood proof + mutual rating = Airbnb-host-tier trust. **Rating ambition: 4.8★.**

### SCAMPER-T2: Price Transparency (C-2, C-12, C-31)

- **Substitute:** Replace "estimated price" with "maximum price with variables shown" — customer sees worst case before committing
- **Combine:** Fixed menu + price lock + split breakdown → one "Price Promise" visible pre-book and on receipt
- **Adapt:** Steal Uber's upfront-price model — "₹599 fixed, no surge, no surprises"
- **Modify:** Show split (tech/owner/platform/tax) as a visual bar chart, not numbers
- **Put to other uses:** Post-service receipt frames tech's earnings prominently — "Suresh earned ₹450 today" → reinforces fair-commission brand
- **Eliminate:** No "starting from" pricing. Every service has exact price or exact formula.
- **Reverse:** Publish our competitor comparison — "UC charges ₹749 for same service, we're ₹599 with better tech earnings"
- **Differentiation:** UC upcharging is the #1 complaint. Price Promise is both a feature and a brand positioning. **Reduces pre-booking anxiety to near-zero.**

### SCAMPER-T3: Service Completion Dossier (C-17, C-18, C-20, C-21)

- **Substitute:** Replace SMS/WhatsApp invoice with full-page in-app report + email PDF + WhatsApp share card
- **Combine:** Report (C-17) + maintenance calendar (C-18) + photo archive (C-20) + health check (C-21) into one "My Home Health" hub
- **Adapt:** Steal Carfax's "vehicle history report" concept — every home has a service history
- **Modify:** Make the report branded, beautiful, downloadable — something a customer would actually save
- **Put to other uses:** Home Health hub is a retention engine — customers come back to see their history even between bookings
- **Eliminate:** No bare-bones invoice. Never send something that looks like "chore-done."
- **Reverse:** Instead of customer having to remember to book AC service, system nudges them via calendar reminder — inversion: service platform becomes a home-maintenance assistant
- **Differentiation vs UC:** UC's post-service is a transactional drop-off. Our dossier → home-health-hub is a sustained relationship surface. **Drives 30%+ repeat rate.**

### SCAMPER-T4: Transparent Earnings (T-1, T-2, T-3)

- **Substitute:** Replace "offer card" with "earnings card" — the offer IS about the earnings, frame accordingly
- **Combine:** Pre-accept preview + real-time dashboard + flexible payout → one "My Money" tab (always accessible)
- **Adapt:** Steal Robinhood's motivational dashboard — progress bars, streaks, goal tracking
- **Modify:** Add "hourly effective rate" (earnings / time) — helps tech decide which jobs are worth it
- **Put to other uses:** Earnings data becomes basis for T-22 financing (credit history), T-17 insurance premiums (income proof)
- **Eliminate:** No mystery about what tech will earn. Ever.
- **Reverse:** Let techs set their own minimum acceptable per-hour rate → system only offers jobs above that. Inverts dispatch from platform-decides to tech-decides.
- **Differentiation:** UC earnings are calculated *after* many jobs. Real-time + transparent + tech-controlled payout cadence is category-shifting. **Vendor liquidity moat.**

### SCAMPER-T5: Live-Tracking Theatre (C-5, C-26)

- **Substitute:** Replace "Tech is on the way" with "Tech is 3.2 km away, ETA 12 min • Currently heading up Richmond Road"
- **Combine:** Pre-service checklist (C-26) + live status (C-5) + tech chat → one "Service in Progress" screen that evolves
- **Adapt:** Steal Uber Eats' live-order theatre + Zomato's driver photo/name/vehicle display
- **Modify:** Add optional tech-audio greetings ("Hi Riya, I'm Suresh, on my way") for premium feel
- **Put to other uses:** Tracking screen becomes the trust-building surface during the first 15 min after booking — most CAC-recovery happens in this window
- **Eliminate:** No "In Progress" silent periods. Every 5 min max between updates.
- **Reverse:** Customer can opt OUT of tracking (privacy) and just get a 30-min-before push. Not everyone wants Uber-levels of surveillance.
- **Differentiation vs UC:** UC's live tracking is basic location dot. Our theatre = confidence-building ritual. **Removes the "where are they?" anxiety that drives 1-star reviews.**

### SCAMPER-T6: Vendor Welfare (T-17, T-18, T-19)

- **Substitute:** Replace "gig worker" language with "service professional" — dignity baked into product language
- **Combine:** Insurance + fatigue guard + weather pause → one "Your Care" tab for tech
- **Adapt:** Steal corporate HRIS patterns — leave tracker, benefits enrolment, payslip
- **Modify:** Insurance enrollment UX: 3-tap via DigiLocker (free, govt-backed)
- **Put to other uses:** Welfare data → regulatory dashboard (O-30) auto-populated → compliance is a byproduct, not a burden
- **Eliminate:** No "contractor" fine-print hiding away from protections
- **Reverse:** Make welfare OPT-OUT, not opt-in. Default everyone protected.
- **Differentiation vs UC:** UC retrofitted welfare after 2026 protests. We lead with it. **Vendor loyalty weapon + regulatory moat.**

### SCAMPER-T7: Live Ops Command Centre (O-1, O-2, O-3)

- **Substitute:** Replace traditional "dashboard" with a Figma-FigJam-style live canvas — drag panels, pin things, share with team
- **Combine:** City map + order feed + counters → one default landing view for owner
- **Adapt:** Steal Flight Radar 24's real-time map aesthetic — planes = techs, flight paths = routes
- **Modify:** Dark mode default + 3-minute auto-refresh + sound alerts for urgent events
- **Put to other uses:** Stream the map to a TV in ops room for shared awareness
- **Eliminate:** No old data. Nothing on screen > 60 sec stale.
- **Reverse:** Let techs SEE demand heatmap in their app (with their ranking) — they self-route to hot areas. Inversion: owner's tool becomes dispatch intelligence for techs.
- **Differentiation vs UC:** UC ops tool is internal, slow, and hides behind permissions. Ours is the owner's primary workspace. **Makes solo-owner operation feasible.**

### SCAMPER-T8: Professional Identity (T-10, T-12, T-16)

- **Substitute:** Replace "technician profile" with "service professional portfolio" — craft-focused framing
- **Combine:** Rating transparency + profile + portfolio → customer-facing "Meet Suresh" page
- **Adapt:** Steal architect/photographer portfolio aesthetic — photos of craft, credentials, testimonials
- **Modify:** Auto-generate portfolio from service photos (with tech approval before publish)
- **Put to other uses:** Tech profile becomes marketing asset — shareable to customers who haven't installed the app yet
- **Eliminate:** No anonymous placeholder photos. Every tech has real headshot.
- **Reverse:** Customer picks tech by portfolio (not by rating alone). Shifts from "cheapest nearest" to "best match for this job."
- **Differentiation:** UC homogenises techs. We celebrate their craft. **Premium positioning + tech pride + retention driver.**

### SCAMPER-T9: Safety-First for Women (C-7, C-35, C-30)

- **Substitute:** Replace "women professionals filter" with "safety defaults that work"
- **Combine:** Women-safe filter + SOS + caregiver mode → one "Safety Centre" in customer app
- **Adapt:** Steal banking app's "trusted contacts" pattern — customer adds family who gets pinged when tech arrives
- **Modify:** Auto-enable SOS for beauty services and all late-hour services (opt-out, not opt-in)
- **Put to other uses:** Safety Centre data (nothing incidents occurred, trust built) becomes positive marketing — "10,000 late-hour services, zero incidents"
- **Eliminate:** No opt-in check-boxes for safety. Safety is default.
- **Reverse:** Women's safety is the DEFAULT product for EVERYONE. Men customers also benefit from SOS and verified techs.
- **Differentiation:** UC's safety is a buried filter. Ours is a brand pillar. **Unlocks women-premium segment (high-LTV).**

### SCAMPER-T10: Compliance + Audit (O-28, O-29, O-30)

- **Substitute:** Replace reactive compliance with proactive dashboard — regulators can be shown the dashboard live
- **Combine:** Audit log + RBAC + regulatory dashboard → one "Trust Centre" for owner
- **Adapt:** Steal SOC 2 compliance dashboard pattern — live attestation of controls
- **Modify:** Every admin action has a reason-code required (forces deliberate overrides, prevents casual bans)
- **Put to other uses:** Audit log + SSC levy tracker → automated quarterly regulatory filings (reduces legal cost to ~0)
- **Eliminate:** No undocumented admin actions. Ever.
- **Reverse:** Let techs VIEW their own audit trail (every owner action affecting them). Transparency both ways. Radical.
- **Differentiation vs UC:** UC's 2026 protests exposed opaque ID-blocking. Our tech-visible audit log is the exact inverse posture. **Regulatory + reputational moat.**

### SCAMPER Summary

The 10 themes above are the **top-priority differentiators** that most directly beat UC while staying within ₹0 infra. Each has:
- Concrete feature set from Phase 1 ideation
- Narrative of HOW it beats UC
- Multiple implementation angles surfaced via SCAMPER
- At least one "Reverse" insight that's genuinely unconventional

---

## 5. Phase 4 — Reverse Brainstorming (Pre-mortem + Assumption Stress Tests)

**Prompt:** "It's 12 months since launch. homeservices-mvp failed. What killed it?"

### 5.1 Top 15 Failure Modes (ranked by probability × impact)

| # | Failure Mode | Probability | Impact | Mitigation |
|---|---|---|---|---|
| F-1 | **Scope creep** — tried to build all 91 ideas before core worked | HIGH | CRITICAL | Strict MVP = 20 features (the "walking skeleton"); defer 70 to Phase 2+ |
| F-2 | **Vendor liquidity collapse** — couldn't recruit/retain 50 techs | HIGH | CRITICAL | Recruit 100 BEFORE launch; week-1 orientation; 22% commission lock-in letter |
| F-3 | **Founder burnout** at month 6 | HIGH | HIGH | Phased timeline; weekly limit 40 hrs; freelance designer for visual identity |
| F-4 | **Working capital squeeze** — Razorpay T+2 vs weekly payouts | HIGH | MEDIUM | ₹15-20 lakh standby; T-3 flexible payout cadence may actually IMPROVE (tech pays ₹25 for instant, covers our float cost) |
| F-5 | **Quality variance** — one bad tech kills brand | HIGH | CRITICAL | Mandatory skill test; first 3 jobs supervised; auto-pause <3.5★ |
| F-6 | **UC price war in pilot city** — drops commission to 22% | MEDIUM | HIGH | Compete on vendor experience not customer price; exclusivity with top 20 techs |
| F-7 | **Regulatory ambush** — Karnataka blocks dispatch algorithm | MEDIUM | HIGH | Right-to-refuse built in day 1; algorithm publishing ready; legal review quarterly |
| F-8 | **Marketing CAC too high** → burn rate exceeds revenue | MEDIUM | HIGH | RWA tie-ups + society WhatsApp + referrals (C-23, C-25) before paid ads |
| F-9 | **Free-tier ceiling hit faster than expected** | MEDIUM | MEDIUM | Monitoring + documented migration to paid tier + ₹50k/mo budget standby |
| F-10 | **Bad first 20 customers' reviews** → app store drops to 2★ | MEDIUM | CRITICAL | Soft launch friends-and-family; intervene on every <4★ via C-36 rating shield |
| F-11 | **Tech safety incident** → massive legal + reputational hit | LOW | CATASTROPHIC | DigiLocker KYC from day 1; insurance integration; SOS (C-35) |
| F-12 | **Data breach / DPDP violation** | LOW | CATASTROPHIC | Azure India residency; Aadhaar via DigiLocker (never stored); annual pentest |
| F-13 | **Founder loses access to BMAD/Claude Code** (tool change) | LOW | HIGH | Artifacts are portable markdown; could continue with other AI; repo is standard |
| F-14 | **Firebase or Azure free tier revoked** | LOW | HIGH | Architecture doc flags migration paths for each service |
| F-15 | **Personal health event** for solo founder | LOW | HIGH | Process documented for 2-week handoff; part-time dev on retainer as insurance |

### 5.2 Assumption Stress-Test (10 brief assumptions re-examined)

| # | Brief Assumption | Holds? | Notes |
|---|---|---|---|
| A-1 | Founder commits 4–6 hrs/day × 12 months | ⚠️ RISK | Sustainable at 4 hr; 6 hr courts burnout (F-3). Recommend 4 hr + AI leverage. |
| A-2 | Pilot city has ≥2 lakh middle-class households | ✅ HOLDS | Bengaluru / Pune / Hyderabad / Delhi-NCR all qualify |
| A-3 | Can recruit 50-100 vendors in 4 weeks | ⚠️ RISK | Needs dedicated 2-week recruitment sprint BEFORE any code; not an afterthought |
| A-4 | Working capital of ₹15-20 lakh available | ❓ UNCONFIRMED | Client-funded or founder-funded? OQ-17 |
| A-5 | Razorpay Route + Instant Settlement at current pricing | ✅ HOLDS | Verified as of Apr 2026 |
| A-6 | DigiLocker remains free + reliable | ✅ HOLDS | Govt mandate; risk low |
| A-7 | Truecaller SDK remains free | ✅ HOLDS | Truecaller business model depends on it; stable |
| A-8 | Insurance partner at 1-2% of GMV | ❓ UNCONFIRMED | ICICI Lombard / Bajaj / Acko — OQ-18; might be higher initially |
| A-9 | Firebase Spark/Blaze + Azure free tiers stable | ✅ HOLDS | Multi-year track record; migration paths documented if revoked |
| A-10 | **Full UC parity scope** | ❌ **REVISED** | **Narrowed to core-loop MVP.** All amplifiers (subscriptions, native products, insta, multi-city, ML) deferred to Phase 2+ after MVP proves unit economics. This is the most consequential assumption revision from the brainstorm. |

### 5.3 Pre-Mortem Insights Pushed Back Into Design

- **F-1 + A-10 revision** → Locked decision: Phase 1 MVP includes ONLY the 20 "walking skeleton" features listed in §6.1. Everything else is Phase 2+.
- **F-5 + F-10** → Soft launch to 100 friends-and-family BEFORE public launch; C-36 rating shield is MVP-critical
- **F-7** → Karnataka right-to-refuse + transparent algorithm + no-penalty-for-decline baked into MVP dispatch logic, not Phase 2
- **F-2 + F-6 + A-3** → **2-week pre-launch vendor recruitment sprint** added as an explicit Phase 0.5 before coding starts

---

## 6. Synthesis — Deliverables for Phase 2 PRD

### 6.1 Prioritised Differentiators (Top 25, ranked for MVP vs Post-MVP)

**🟢 MVP (Phase 1 — the walking skeleton, first 3 months):**

| # | Feature (ID) | Why it's MVP |
|---|---|---|
| 1 | Trust Dossier per tech (C-1) | Foundation of trust layer; differentiator visible on first booking |
| 2 | Fixed-Price Menu + Price Lock (C-2, C-12) | Eliminates UC's #1 complaint |
| 3 | Pre-Booking Confidence Score (C-8) | First-5-seconds wedge |
| 4 | Photo-First Service Browse (C-15) | Airbnb-tier premium feel |
| 5 | Live Service-in-Progress Updates (C-5) | Zomato-tier tracking; kills anxiety |
| 6 | Auto-Gen Service Report PDF (C-17) | Post-service differentiator |
| 7 | Women-Safe Filter defaults (C-7) | Safety brand pillar + SOS (C-35) |
| 8 | 7-Day Fix Warranty (surfaced) (C-10) | Trust signal pre-booking |
| 9 | Tech No-Show Guarantee (₹500) (C-11) | Reliability promise |
| 10 | Pre-Acceptance Earnings Preview (T-1) | Vendor liquidity wedge |
| 11 | Real-Time Earnings Dashboard (T-2) | Tech motivation + retention |
| 12 | Flexible Payout Cadence (T-3) | Vendor-choice = loyalty |
| 13 | Rich Job-Offer Context (T-4) | Better tech decisions |
| 14 | Guided Photo Capture (T-7) | Enables customer-side trust features |
| 15 | Rating Transparency + Written Feedback (T-10) | Tech growth tool |
| 16 | Abusive Customer Shield (T-11) | Mutual respect + tech loyalty |
| 17 | Rating Appeal with Evidence (T-23) | Fairness = Karnataka-compliant |
| 18 | Owner Live Ops Command Centre (O-1, O-2, O-3) | Single-operator feasibility |
| 19 | Master Orders Table + Drill-Down (O-4, O-5) | Core ops surface |
| 20 | Override Controls (O-6) | Owner agency |
| 21 | Daily P&L Dashboard (O-13) | Finance visibility |
| 22 | Weekly Payout Queue (O-14) | Vendor settlement infrastructure |
| 23 | Complaints Inbox with SLA (O-19) | Accountability infrastructure |
| 24 | Immutable Audit Log (O-28) | Legal protection + Karnataka-compliant |
| 25 | Rating Shield Pre-Review (C-36) | Prevents catastrophic review launch |

**🟡 Phase 2+ (after MVP proves unit economics):**
- All other features from the 91 — Home Maintenance Calendar (C-18), Gift a Service (C-24), Society Group Booking (C-25), Voice Booking (C-29), Caregiver Mode (C-30), Tech Career Levels (T-13), OEM Certs (T-15), Health Insurance auto-enrollment (T-17), Lost Customer Alerts (O-12), Dynamic Pricing (O-26), etc.

### 6.2 Open Questions for Phase 2 PRD (OQ-1 to OQ-20)

| # | Question | Recommended Default |
|---|---|---|
| OQ-1 | Brand name | Brainstorm 5 options in Phase 2; recommend Indian name with `.in` + `.com` available |
| OQ-2 | Pilot city | Bengaluru (Karnataka Act sets compliance bar high; good forcing function) — or Pune (less regulatory burden, strong RWA culture) |
| OQ-3 | Initial 5 categories | AC Repair, Deep Cleaning, Plumbing, Electrical, Pest Control |
| OQ-4 | Exact commission % | 22% for first 100 techs (vendor acquisition rate) → ladder up to 25% after 50-job milestone |
| OQ-5 | Payout cadence default | Weekly (with T-3 flexible option available) |
| OQ-6 | Working capital source | Founder-funded or client-funded — must be confirmed before Phase 2 |
| OQ-7 | Marketing budget for pilot | ₹5 lakh recommended (80% organic, 20% paid) |
| OQ-8 | Insurance partner | ICICI Lombard (largest home insurance market share) — alt Acko (digital-native UX) |
| OQ-9 | Pilot launch target date | 4 months after Phase 2 PRD approved |
| OQ-10 | Pilot success metric | 5k bookings/mo contribution-margin-positive OR 500 bookings with NPS ≥ 65 |
| OQ-11 | Brand visual identity budget | ₹30-50k (Toptal freelance designer) |
| OQ-12 | DigiLocker integration partner registration lead time | Start Week 1; expect 2-3 weeks |
| OQ-13 | Truecaller SDK business registration lead time | Start Week 1; expect 1-2 weeks |
| OQ-14 | Razorpay business onboarding | Start Week 1; expect 1 week |
| OQ-15 | Pilot technician exclusivity | 3-month soft exclusivity for top 20 techs (22% commission lock + priority dispatch) |
| OQ-16 | Customer data retention policy | 2 years active, 5 years archive (DPDP minimum) |
| OQ-17 | Founder weekly time commitment | 4 hrs/day sustainable OR 5 hrs with part-time dev on retainer as burnout insurance |
| OQ-18 | SwiftUI for iOS OR Kotlin Multiplatform for shared logic | Defer to Phase 4 Architecture |
| OQ-19 | Cosmos DB partition strategy | Per-city + per-role partitions; defer to Phase 4 |
| OQ-20 | Multi-city expansion trigger | 5K bookings/mo sustained × 3 months in pilot city = Phase 2 expansion |

### 6.3 Stress-Tested Assumptions — Summary of Changes

| Assumption Status | Count |
|---|---|
| ✅ Holds as originally stated in brief | 6 |
| ⚠️ Holds with caveat / risk flag | 2 (A-1 founder time, A-3 vendor recruitment) |
| ❓ Unconfirmed — OQ required | 2 (A-4 working capital, A-8 insurance partner) |
| ❌ Revised (major change) | 1 (A-10: full UC parity → MVP-only scope) |

**The most consequential change: scope narrowed from full UC parity to 25-feature MVP.** Everything in the 91-idea inventory is still on the roadmap — just sequenced behind the MVP.

### 6.4 Locked Decisions (D1–D28)

Carrying forward all 20 decisions from initial brainstorming PLUS 8 new ones from this session:

**D1–D20:** See `_bmad-output/planning-artifacts/product-brief.md` §Appendix A and prior brainstorm — unchanged.

**New D21–D28:**

- **D21** — MVP scope = exactly the 25 features in §6.1 above. Nothing more. Nothing less.
- **D22** — Pre-launch 2-week vendor recruitment sprint (Phase 0.5) is mandatory; coding does not start until 50 techs onboarded.
- **D23** — Soft launch to 100 friends-and-family (not public) for first month post-MVP-complete; use C-36 rating shield aggressively during this window.
- **D24** — Commission starts at 22% for first 100 techs; ladders to 25% only after 50-job milestone per tech.
- **D25** — Karnataka Platform Workers Act compliance is MVP, not Phase 2 (right-to-refuse without ranking penalty, transparent algorithm, immutable audit log).
- **D26** — Women-safe defaults (C-7, C-35) are MVP, not Phase 2. Marketing pillar from day 1.
- **D27** — Owner live-ops command centre (O-1 to O-3) is MVP. Solo-founder operability depends on it.
- **D28** — Rating shield (C-36) is MVP. Prevents catastrophic early reviews.

---

## 7. Handoff to Phase 2 — PRD

**Next BMAD skill:** `/bmad-agent-pm` (Persona: John) → `/bmad-create-prd`
**Output:** `docs/prd.md`
**PRD must expand:**
- The 25 MVP features in §6.1 into full user stories + acceptance criteria
- The 70 Phase-2+ features into prioritised backlog
- The 20 open questions (§6.2) into explicit decision points with recommended defaults
- The stress-tested assumptions (§6.3) into testable NFRs
- The 28 locked decisions (§6.4) into PRD constraints

**Input to PRD:** This document + `_bmad-output/planning-artifacts/product-brief.md` + `_bmad-output/brainstorming/brainstorming-session-2026-04-17-2349.md` (session transcript).

---

## 8. Session Highlights

**User Creative Strengths:**
- Tight scope articulation once the 3-app frame was established
- Decisive delegation ("go with your recommendation") enabled efficient facilitation
- Clear constraint setting (₹0 infra, FCM spine, 1 city pilot) kept brainstorming disciplined

**AI Facilitation Approach:**
- Role-first technique (Role Playing) matched user's domain-first framing
- Anti-bias domain pivot every ~10 ideas maintained true divergence
- Progressive flow (divergent → organise → refine → stress-test) produced PRD-ready deliverables
- Shifted to autonomous mode when explicitly requested, surfaced only at milestone boundaries

**Breakthrough Moments:**
- SCAMPER-T1 "Reverse" lens: Make tech's trust of customer explicit (not just customer trusting tech) → mutual rating as UX pattern
- Pre-mortem F-1 + A-10: Scope narrowing from full UC parity to 25-feature MVP — the single most important decision from the session
- SCAMPER-T4 "Reverse" lens: Techs set own minimum per-hour rate, platform filters — inverts dispatch control
- SCAMPER-T10 "Reverse" lens: Techs see owner's audit trail about them — radical transparency

**Energy Flow:**
- Sustained focus across 91 ideas without semantic clustering
- Participant engagement characterised by quick, high-agency delegation — trusted facilitator to maintain quality
- Session duration: ~2 hours of concentrated work; no visible fatigue

---

**End of Phase 1 Brainstorming Report.**
