# प्रोजेक्ट प्रस्ताव — होम सर्विसेज़ ऐप (4 विकल्प)

**तैयार किया गया:** 16 अप्रैल 2026
**प्रस्तुतकर्ता:** Alok Tiwari
**प्राप्तकर्ता:** [Client का नाम]
**प्रोजेक्ट कोड:** HSV-PROP-2026

---

## क्यों 4 विकल्प?

होम सर्विसेज़ ऐप बनाने का एक भी "सही" तरीक़ा नहीं है — यह आपके बजट, समय, और risk appetite पर निर्भर है। इसलिए हमने 4 अलग-अलग विकल्प तैयार किए हैं — सबसे छोटे validation test से लेकर full Urban Company जैसे multi-city platform तक।

आप अपनी position के हिसाब से एक चुन सकते हैं, या एक से शुरू करके धीरे-धीरे ऊपर बढ़ सकते हैं।

---

## एक नज़र में तुलना (Quick Comparison)

| पैरामीटर | **Tier A**<br>Validation MVP | **Tier B**<br>Lean MVP | **Tier C**<br>Growth-Ready Pilot | **Tier D**<br>Full UC-style Platform |
|---|---|---|---|---|
| **लक्ष्य** | Market validate करें | 1 city में profitable run करें | Paid marketing के लिए तैयार हों | Multi-city, multi-product scale |
| **समय** | 4–6 हफ़्ते | 3–4 महीने | 5–6 महीने | 9–12 महीने |
| **Investment (Build)** | **₹2–4 लाख** | **₹10–15 लाख** | **₹20–35 लाख** | **₹60 लाख – 1.5 करोड़** |
| **Marketing budget** | ₹1–2 लाख | ₹5–10 लाख | ₹15–25 लाख | ₹50 लाख+ |
| **Working capital** | ₹2–3 लाख | ₹10–15 लाख | ₹20–30 लाख | ₹50 लाख+ |
| **कुल cash needed** | **₹5–9 लाख** | **₹25–40 लाख** | **₹55–90 लाख** | **₹1.5–2.5 करोड़** |
| Customer App | Android (basic) | Android (full) | Android (full + polished) | Android + iOS |
| Technician App | ❌ (Admin manually calls techs) | Android (full) | Android (full + polished) | Android + iOS |
| Owner Web Dashboard | ✅ (basic order list) | ✅ (full real-time visibility) | ✅ (full + analytics + marketing tools) | ✅ (multi-city + ML insights) |
| Auto-dispatch (नज़दीकी tech) | ❌ (manual) | ✅ | ✅ | ✅ + ML ranking |
| Razorpay Payment | ✅ (basic checkout) | ✅ + Route auto-split | ✅ + Route + advanced refunds | ✅ + multi-PG |
| Weekly auto-payouts to techs | ❌ (manual UPI) | ✅ | ✅ | ✅ |
| Reviews & Ratings | ❌ | ✅ Basic | ✅ Both-way + moderation | ✅ Advanced |
| Complaint Module + SLA | ❌ | Basic | ✅ Full SLA-tracked | ✅ + auto-escalation |
| Coupons / Referrals | ❌ | ❌ | ✅ | ✅ |
| WhatsApp Business confirmations | ❌ | ❌ | ✅ | ✅ |
| KYC Integration (IDfy) | ❌ (manual verify) | Basic | ✅ Automated | ✅ |
| Insurance Integration | ❌ | ❌ | ✅ | ✅ |
| Multi-city support | ❌ | ❌ | ❌ | ✅ |
| iOS Apps | ❌ | ❌ | ❌ | ✅ |
| Subscriptions / Membership | ❌ | ❌ | ❌ | ✅ |
| Native Products Marketplace | ❌ | ❌ | ❌ | ✅ |
| 15-min Instant Service | ❌ | ❌ | ❌ | ✅ |
| Multi-language (Hindi/Regional) | ❌ | ❌ | Basic | ✅ Full |
| Loyalty Program | ❌ | ❌ | ❌ | ✅ |
| Service Categories | 1–2 | 3–5 | 5–8 | 15+ |
| Vendors | 20 | 50–200 | 200–500 | 1000+ per city |
| Cities | 1 (1 locality) | 1 | 1 | 5+ |
| Target Bookings/Month | 100 | 1,000 | 5,000 | 50,000+ |
| **हमारी सिफ़ारिश** | "क्या यह business काम करेगा" test करना है | **पहली बार launch (Recommended start)** | Paid ads + scale के लिए | 12+ महीने बाद, validated business पर |

---

# Tier A — Validation MVP

> *"क्या लोग सच में यह pay करेंगे?" — यह सवाल सबसे पहले answer करना है*

## क्या मिलेगा (Scope)

### Apps
- **Customer Android App** (basic):
  - Phone OTP signup
  - 1–2 categories (recommend: AC repair + plumbing) में 5–8 services
  - Address pin (Google Maps)
  - Slot booking (next-day or specific time)
  - Razorpay payment (UPI/Card)
  - Booking status tracking (basic — "Searching", "Assigned", "Done")
  - Rate the service (1–5 stars)

### कोई Technician App नहीं
- Admin (आप या आपका manager) **WhatsApp/phone पर technicians को manually call करेगा**
- Technician को job confirmation WhatsApp पर भेजी जाएगी
- यह intentional है — जब तक 100 bookings नहीं हो जातीं, technician app बनाने का मतलब नहीं

### Owner Web Dashboard (Basic)
- सभी orders की list (status, customer, address, amount)
- Manual technician assignment (dropdown से tech select करें, WhatsApp message auto-trigger)
- Order details: timeline, payment status, customer rating
- Excel/CSV export
- 1 admin user (आप)

### Backend
- Razorpay payment basic (no Route — यानी पैसा सीधे आपके account में, technician को आप UPI से अलग pay करेंगे)
- Postgres database
- Cloud hosting (Firebase या DigitalOcean — सस्ता)
- कोई complex auto-dispatch नहीं

## क्या नहीं होगा (Boundary)

❌ Technician app
❌ Auto-dispatch (नज़दीकी tech automatically मिलना)
❌ Weekly auto-payout (आप हर tech को manually UPI करेंगे)
❌ Reviews दूसरे customers को नहीं दिखेंगे
❌ Complaint module
❌ Coupons / referrals
❌ KYC automation
❌ WhatsApp Business automated messages

## Timeline

| हफ़्ता | क्या |
|---|---|
| 1 | Brand, wireframes, Razorpay account, Google Maps setup, **20 vendors की recruitment** |
| 2–3 | Customer app + basic admin web build |
| 4 | Internal testing, payment flow verification |
| 5 | Soft launch — 10 friends-and-family customers |
| 6 | Public launch in 1 locality (e.g. एक colony/sector) |

## Investment

| Item | Cost |
|---|---|
| Solo full-stack freelancer (5 हफ़्ते full-time) | ₹1.25–2 लाख |
| UI/UX (basic) | ₹25–40k |
| Infra + APIs (3 महीने) | ₹15–30k |
| Razorpay/Maps/Domain/Play Store | ₹10–20k |
| Buffer | ₹25–50k |
| **Total Build** | **₹2–4 लाख** |

### अलग से रखना है
- Marketing pilot (100 customers × ₹500–1500 CAC): **₹0.5–1.5 लाख** (mostly RWA tie-ups + WhatsApp society groups)
- Working capital (1 हफ़्ते की GMV float): **₹2–3 लाख**

**कुल cash needed: ₹5–9 लाख**

## Payment Milestones (Tier A)

| Milestone | % | राशि (₹3 लाख base पर) |
|---|---|---|
| Kickoff | 30% | ₹90,000 |
| Customer app demo (हफ़्ता 3) | 40% | ₹1,20,000 |
| Public launch (हफ़्ता 6) | 30% | ₹90,000 |

## सफलता के मानक (Success Criteria)

- 6 हफ़्तों में app live in 1 locality
- 8 हफ़्तों में 100 paid bookings (₹50k+ GMV)
- 60%+ customer satisfaction (4★+ rating)
- Repeat booking rate ≥ 15%

## क्यों इस tier से शुरू करें?

✅ कम risk — अगर market response खराब हो तो ज़्यादा cash नहीं डूबा
✅ जल्दी real-world feedback मिलेगा
✅ Vendor pipeline test हो जाएगा
✅ अगले tier में invest करने का confidence बनेगा

## Tier A में क्या risk है?

⚠️ Manual operations (admin को हर booking phone पर coordinate करनी होगी) — 100 bookings/month तक OK, उसके बाद breakdown
⚠️ Customer experience उतनी polished नहीं होगी — bare-bones design
⚠️ Scale नहीं कर सकते इसी app पर — Tier B के लिए कुछ rebuild होगा

---

# Tier B — Lean MVP

> *यह असली product है — 1 city में profitable run करने के लिए तैयार*

> **हमारी सबसे बड़ी सिफ़ारिश यह tier है** अगर client यह business serious होकर start करना चाहता है

## क्या मिलेगा (Scope)

### Customer Android App (Full)
- Tier A के सभी features +
- Live tracking — technician कहाँ है, कब पहुँचेगा (Ola/Uber जैसा map view)
- Multi-step bookings (एक booking में कई services जोड़ें)
- Saved addresses (Home, Office, etc.)
- Saved payment methods (Razorpay tokenization)
- Booking history + re-book one-tap
- In-app chat with technician (FCM-based)
- Push notifications (booking updates)

### Technician Android App (Full)
- KYC upload (Aadhaar, PAN, photo)
- Skills + serviceable area set करना
- Availability schedule (working hours, off-days)
- **Job offer in 30 seconds** (Accept/Reject)
- Google Maps navigation handoff
- "Reached", "Started", "Completed" workflow
- Photo upload (before/after work)
- Wallet — earnings + payout history
- In-app chat with customer
- Earnings dashboard (today/week/month)

### Owner Web Dashboard (Full Real-time Visibility)
यह वही "full visibility" है जो आपने माँगी थी:

**Live Operations View (default screen):**
- शहर का live map — हर active technician (idle/en-route/on-job/offline color-coded) और हर live booking दिखेगी
- Real-time order feed: नई booking → assigned → in-progress → completed
- आज के counters: bookings, GMV, commission, payouts pending

**Orders Module — पूरी visibility का दिल:**
- हर order की searchable + filterable list
- Drill-down view: full timeline, contacts, photos, payment refs, refunds, complaints
- Override controls: re-assign, manual complete, refund issue, complaint escalate, internal notes
- CSV export

**Technician Module:**
- सभी vendors की list + KYC, weekly earnings, lifetime GMV, rating, current location
- Activate/deactivate, commission % adjust per tech
- In-app chat with vendor

**Customer Module:**
- सभी customers + lifetime spend, last booking, complaint count, blacklist toggle

**Finance Module:**
- Daily P&L: GMV, commission, payout, refunds, gateway fees → contribution margin
- Weekly payout queue → approve → Razorpay auto-settles
- GST output register auto-generated

**Audit Log:**
- हर override, refund, deactivate non-deletable record (legal protection)

### Backend
- **PostgreSQL + PostGIS** (नज़दीकी tech geo-query)
- **Real-time auto-dispatch** — booking आते ही 5 km radius में top 3 nearest available techs को 30 सेकंड का job offer push (Socket.io + FCM)
- **Razorpay Route** — split payment automatic: customer payment → आपका commission + tech का share
- **Weekly automatic payouts** — हर हफ़्ते technician के bank में direct
- **Cancellation/refund logic** — slot से कितना पहले cancel = कितनी fee
- AWS Mumbai hosting (production-grade)

## क्या नहीं होगा (Boundary)

❌ iOS apps
❌ Multi-city (architecture ready है, but launch सिर्फ़ 1 city में)
❌ Coupons / referrals system
❌ WhatsApp Business automated messages (basic SMS only)
❌ Advanced analytics dashboards
❌ Insurance integration
❌ Subscription/membership tier
❌ Native products marketplace
❌ 15-min instant service

## Timeline

| Phase | समय | क्या |
|---|---|---|
| **Phase 0 — Foundation** | हफ़्ता 1–2 | Brand, wireframes, GST/Razorpay/Maps account setup, **पहले 50 vendors की recruitment** |
| **Phase 1 — Walking Skeleton** | हफ़्ता 3–6 | Basic OTP login, service catalogue, manual booking + payment end-to-end |
| **Phase 2 — Auto-dispatch** | हफ़्ता 7–10 | नज़दीकी technician को 30 सेकंड में push, live tracking, accept/reject flow |
| **Phase 3 — Money + Trust** | हफ़्ता 11–14 | Razorpay Route split-payment, weekly payouts, basic ratings |
| **Phase 4 — Owner Control + Launch** | हफ़्ता 15–16 | पूरा owner dashboard, soft launch + public launch |

**Public Launch:** ~4 महीने में

## Investment

### Lean Team Approach

| Item | Cost |
|---|---|
| Project Manager (आधा time, 4 महीने) | ₹3–5 लाख |
| 1 Mobile Developer (Flutter, 4 महीने FT) | ₹4–6 लाख |
| 1 Backend Developer (NestJS, 4 महीने FT) | ₹4–6 लाख |
| Part-time Frontend (Admin web, 2 महीने) | ₹2–3 लाख |
| UI/UX Designer (1 महीना) | ₹1–1.5 लाख |
| QA (आख़िरी 1 महीना) | ₹1 लाख |
| **Subtotal — People** | **₹15–22 लाख** |
| Infra + APIs (4 महीने) | ₹1–2 लाख |
| Misc (legal, accounts, buffer) | ₹50k–1 लाख |
| **Total Build** | **₹10–15 लाख** *(optimised lean estimate)* |

### अलग से रखना है

- Marketing pilot (1,000 customers × ₹500–1,000 CAC): **₹5–10 लाख**
- Working capital: **₹10–15 लाख**

**कुल cash needed: ₹25–40 लाख**

## Payment Milestones (Tier B)

| Milestone | % | राशि (₹12 लाख base पर) |
|---|---|---|
| Kickoff | 15% | ₹1.8 लाख |
| Phase 1 demo | 20% | ₹2.4 लाख |
| Phase 2 demo (auto-dispatch live) | 25% | ₹3 लाख |
| Phase 3 demo (payments + payouts) | 20% | ₹2.4 लाख |
| Phase 4 + public launch | 15% | ₹1.8 लाख |
| 30-day stability | 5% | ₹60k |

## सफलता के मानक (Success Criteria)

- 70%+ bookings auto-assigned within 30 seconds
- Average rating ≥ 4.5★, complaint rate < 5%
- 1,000 bookings/month by month 6
- Contribution margin per booking positive
- 25%+ customers re-book within 60 days
- 60%+ technicians still active after 90 days

## Tier B क्यों recommended है?

✅ यह असली product है — manual hacks नहीं
✅ Owner को पूरा control + visibility
✅ Unit economics validate हो जाएगी (positive या negative)
✅ अगर metrics अच्छी रहीं तो Tier C में invest करना easy decision

## Tier B में क्या risk है?

⚠️ Tier A से 4–5 गुना cash needed
⚠️ Vendor liquidity build करना major operational challenge
⚠️ Marketing acquisition expensive — paid ads से बचें, organic से शुरू करें
⚠️ Working capital squeeze (Razorpay T+2 vs weekly tech payout)

---

# Tier C — Growth-Ready Pilot

> *Paid marketing से scale करने के लिए ready — हर feature production-grade*

## क्या मिलेगा (Scope)

Tier B के सभी features +

### Advanced Customer Experience
- **Coupons & Promo Codes** — first-booking discount, festive offers, category-specific
- **Referral Program** — refer-a-friend with credit reward
- **Loyalty points** (basic) — हर booking पर points, redeem on next
- **WhatsApp Business confirmations** — booking confirm, tech assigned, on-the-way सब WhatsApp पर
- **In-app help/chat** — customer support real-time

### Advanced Trust Layer
- **Reviews moderation** — abusive reviews auto-flag + admin review
- **Both-way ratings** — tech भी customer को rate करेगा (helps catch abusive customers)
- **KYC Automation (IDfy)** — Aadhaar + PAN + criminal record verification automatic, 1-day turnaround
- **Insurance Integration** — हर booking पर ₹5 लाख तक liability cover (ICICI Lombard partnership)
- **Background check renewal** — 6 महीने में auto re-verify

### Complaint Module — Production Grade
- SLA-tracked (किसी complaint का जवाब 2 घंटे, resolution 24 घंटे)
- Auto-escalation अगर SLA breach
- Resolution categories + analytics
- Support agent assignment + workload distribution

### Marketing Module
- Push notification campaigns (city/category/cohort-targeted)
- A/B testing of copy
- Cohort analytics (कौन से customers repeat करते हैं, कौन churn)
- Referral funnel analytics

### Advanced Owner Analytics
- Cohort retention curves
- Tech utilization heatmaps (कब कौन सी tech busy, कब free)
- Demand heatmap (कौन से locality में ज़्यादा demand)
- LTV:CAC ratio per channel
- Predictive payout forecasts

### Service Quality
- Photo verification (before/after photos AI-checked for quality)
- Mandatory tech check-in/check-out at customer location (geo-fence verified)
- Customer satisfaction survey (NPS) post-booking

### Backend Hardening
- Multi-AZ AWS (high availability)
- Daily backups + disaster recovery plan
- Load tested for 10,000 concurrent users
- API rate limiting + DDoS protection

## क्या नहीं होगा (Boundary)

❌ iOS apps (अभी भी सिर्फ़ Android)
❌ Multi-city support (architecture ready, launch 1 city में)
❌ Subscription / membership tier
❌ Native products marketplace
❌ 15-min instant service

## Timeline

| Phase | समय | क्या |
|---|---|---|
| Tier B के सभी 4 phases | हफ़्ता 1–16 | (पहले बताए गए) |
| **Phase 5 — Trust + Quality** | हफ़्ता 17–20 | KYC automation, insurance, both-way ratings, complaints SLA |
| **Phase 6 — Marketing + Analytics** | हफ़्ता 21–22 | Coupons, referrals, WhatsApp, marketing tools, advanced analytics |
| **Phase 7 — Hardening + Public Launch** | हफ़्ता 23–24 | Load test, multi-AZ deploy, public launch |

**Public Launch:** ~6 महीने में

## Investment

### Standard Team Approach

| Item | Cost |
|---|---|
| Project Manager (FT, 6 महीने) | ₹9–15 लाख |
| 2 Mobile Developers (Flutter, 6 महीने) | ₹12–18 लाख |
| 2 Backend Developers (NestJS, 6 महीने) | ₹12–18 लाख |
| 1 Frontend Developer (4 महीने) | ₹4–6 लाख |
| 1 UI/UX Designer (3 महीने) | ₹3–5 लाख |
| 1 QA (4 महीने) | ₹3–5 लाख |
| **Subtotal — People** | **₹43–67 लाख** |
| Infra + APIs (6 महीने) | ₹3–5 लाख |
| Third-party integrations (IDfy KYC, Insurance APIs, WhatsApp Business) | ₹2–3 लाख |
| **Total Build** | **₹20–35 लाख** *(optimized lean estimate, scope cut from full)* |

### अलग से रखना है

- Marketing pilot (5,000 customers × ₹500–1,000 CAC): **₹15–25 लाख**
- Working capital: **₹20–30 लाख**

**कुल cash needed: ₹55–90 लाख**

## Payment Milestones (Tier C)

| Milestone | % | राशि (₹25 लाख base पर) |
|---|---|---|
| Kickoff | 15% | ₹3.75 लाख |
| Phase 1–4 (Tier B equivalent) | 50% | ₹12.5 लाख (split across 4 demos) |
| Phase 5 demo (Trust layer) | 15% | ₹3.75 लाख |
| Phase 6 demo (Marketing tools) | 10% | ₹2.5 लाख |
| Public launch + 60-day stability | 10% | ₹2.5 लाख |

## सफलता के मानक (Success Criteria)

- 5,000 bookings/month within 3 months of launch
- Tech utilization ≥ 50% (तकनीशियन का busy time)
- Repeat customer rate ≥ 35%
- LTV:CAC ratio ≥ 3:1
- Complaint resolution time < 24 hours
- 80%+ insurance-attached bookings

## Tier C क्यों चुनें?

✅ Paid marketing से aggressive scale कर सकते हैं
✅ Trust layer (insurance, KYC) से higher-value customers attract होंगे
✅ Marketing automation से CAC time के साथ कम होगी
✅ अगर 5K bookings/month achieve हो, तो business clearly profitable + sellable

## Tier C में क्या risk है?

⚠️ ₹55–90 लाख cash commitment — अगर pilot fail, यह डूब सकता है
⚠️ Marketing budget में discipline ज़रूरी — easy है ₹25 लाख जलाना
⚠️ Vendor scale (200–500) के लिए dedicated ops team चाहिए

---

# Tier D — Full Urban-Company-style Platform

> *Multi-city, multi-product, full UC clone — long-term play*

## क्या मिलेगा (Scope)

Tier C के सभी features +

### Geographic Scale
- **Multi-city support** (5+ cities) — unified dashboard, city-wise P&L
- City-specific pricing, vendor pools, marketing campaigns
- Multi-language UI (Hindi, English + 3 regional — Tamil/Bengali/Marathi)
- Cross-city analytics + market expansion playbooks

### Platform Surfaces
- **iOS apps** — Customer + Technician (same Flutter codebase, App Store submission)
- Web booking surface (PWA) for customers who don't want to download
- WhatsApp chatbot booking (for older users)

### Revenue Diversification
- **Subscription / Membership tier** — UC Plus जैसा (e.g. ₹999/year for 10% discount + priority booking)
- **Native Products Marketplace** — own-branded RO purifiers, smart locks, ACs (UC Native model)
- Product catalog + cart + delivery + installation flow
- Inventory management for product sales

### Speed Tier
- **15-min Instant Service** (UC Insta-style) — quick household help (cleaning, dishwashing, laundry)
- Standby vendor pool with hourly stipend
- Real-time supply matching algorithm

### Advanced Tech
- **ML-based dispatch** — historical performance + customer preference + time-of-day patterns
- **Demand prediction** — schedule vendors based on predicted demand
- **Dynamic pricing** — surge during high-demand slots
- **Fraud detection** — fake booking, fake review, payment fraud ML models
- **Recommendation engine** — "जिन्होंने AC service ली, उन्होंने pest control भी ली"

### Loyalty + Engagement
- Points-based loyalty program with tier benefits (Silver/Gold/Platinum)
- Birthday/anniversary offers
- Refer-and-earn with multi-level rewards
- Gamification (streak rewards, milestone badges)

### Enterprise Features
- B2B portal (for offices, societies, corporates)
- Bulk booking API
- White-label option for societies (society-branded version)
- Subscription contracts (e.g. monthly cleaning for entire building)

### Operations Excellence
- **Automated background check renewal** (every 6 months)
- **Vendor training portal** — videos, quizzes, certification
- **Customer success team** dashboard
- **24×7 support** with multilingual agents (chat + voice)
- Vendor mental health support (UC after the 2026 protests added this)

### Compliance + Legal
- Karnataka Platform Workers Act compliance built-in (right-to-refuse without ranking penalty)
- Rajasthan / Bihar / Jharkhand state welfare board integrations
- Central Social Security Code 1–2% aggregator levy automated calculation + remittance
- GST e-invoicing automation
- Data residency compliance (DPDP Act India)

## Timeline

| Phase | समय | क्या |
|---|---|---|
| Tier C complete (foundation) | महीना 1–6 | (पहले बताए गए) |
| **Phase 8 — iOS launch** | महीना 7–8 | Both customer + tech iOS, App Store submission |
| **Phase 9 — Multi-city architecture** | महीना 8–9 | DB + ops re-architecture, second city launch |
| **Phase 10 — Native products** | महीना 9–10 | Product marketplace, cart, delivery, inventory |
| **Phase 11 — Subscriptions + Loyalty** | महीना 10–11 | UC Plus equivalent + gamification |
| **Phase 12 — ML + Advanced features** | महीना 11–12 | ML dispatch, fraud detection, dynamic pricing |
| **Phase 13 — B2B + Enterprise** | महीना 12 | B2B portal, bulk APIs, white-label |

**Multi-city launch:** ~12 महीने में

## Investment

### Full Team Approach

| Item | Cost |
|---|---|
| Engineering Lead / CTO (FT, 12 महीने) | ₹30–50 लाख |
| Project / Product Manager (FT, 12 महीने) | ₹15–25 लाख |
| 4 Mobile Developers (Flutter + iOS specialist, 12 महीने) | ₹40–60 लाख |
| 4 Backend Developers (NestJS + ML engineer, 12 महीने) | ₹40–60 लाख |
| 2 Frontend Developers (Admin + customer web, 12 महीने) | ₹15–25 लाख |
| 2 UI/UX Designers (12 महीने) | ₹12–20 लाख |
| 2 QA Engineers + 1 SDET (12 महीने) | ₹12–20 लाख |
| 1 DevOps / SRE (12 महीने) | ₹8–15 लाख |
| 1 Data Engineer (6 महीने from month 7) | ₹4–8 लाख |
| **Subtotal — People** | **₹1.76–2.83 करोड़** |
| Infra + APIs (12 महीने, multi-city scale) | ₹15–30 लाख |
| Third-party integrations (KYC, Insurance, WhatsApp, ML platforms, payment gateways) | ₹8–15 लाख |
| Compliance + Legal (multi-state, DPDP) | ₹5–10 लाख |
| **Total Build** | **₹60 लाख – 1.5 करोड़** *(optimised — full agency rates would be 3-4 करोड़)* |

### अलग से रखना है

- Marketing (multi-city, paid acquisition, brand): **₹50 लाख – 2 करोड़**
- Working capital (multi-city scale): **₹50 लाख – 1 करोड़**
- Inventory for Native products: **₹25–50 लाख**

**कुल cash needed: ₹2–5 करोड़**

## Payment Milestones (Tier D)

Quarterly milestones with deliverable demos. Suggested split:

| Quarter | Deliverables | % |
|---|---|---|
| Q1 (Months 1–3) | Foundation + Tier B equivalent | 25% |
| Q2 (Months 4–6) | Tier C trust layer + first paid launch | 25% |
| Q3 (Months 7–9) | iOS + Multi-city architecture | 25% |
| Q4 (Months 10–12) | Subscriptions + Loyalty + ML + Public multi-city launch | 25% |

## सफलता के मानक (Success Criteria)

- 5+ active cities by end of year 1
- 50,000+ bookings/month
- ₹50 करोड़+ annual GMV trajectory
- 40%+ repeat customer rate
- Native products = 15%+ of revenue
- Subscription members = 25%+ of active customer base
- 80%+ multi-city tech retention

## Tier D क्यों चुनें?

✅ Long-term defensible business (UC जैसा moat)
✅ Multiple revenue streams (services + products + subscriptions)
✅ Investor-ready scale (Series A राउंड के लिए valid)
✅ Acquisition target potential (UC, JioMart, या Amazon खरीद सकते हैं)

## Tier D में क्या risk है?

⚠️ Massive cash burn — ₹2–5 करोड़ commitment
⚠️ Operational complexity multi-city में 5x बढ़ जाती है
⚠️ Competition direct UC + Amazon + JioMart से होगी
⚠️ Funding raise करनी होगी — bootstrapped नहीं हो सकता
⚠️ 12 महीनों तक revenue subset रहेगा cost के मुक़ाबले
⚠️ "Build it and they will come" trap — बिना validated पहले Tier B/C के direct Tier D suicide है

---

# Common Sections (सभी Tiers के लिए)

## Technology Stack (बदलता नहीं — सभी tiers में same foundation)

| Layer | Choice |
|---|---|
| Mobile | **Flutter 3.x** (Tier D में iOS भी) |
| Backend | **NestJS (Node 20)** + TypeScript |
| Database | **PostgreSQL + PostGIS** |
| Cache / Realtime | **Redis + Socket.io** |
| Web admin | **Next.js 14** + Tailwind |
| Payments | **Razorpay + Razorpay Route** |
| Maps | **Google Maps Platform** |
| Notifications | FCM + MSG91 (SMS) + WhatsApp Business (Tier C+) |
| KYC | IDfy (Tier C+ automated) |
| Hosting | **AWS Mumbai** (Firebase for Tier A — सस्ता) |
| Monitoring | Sentry + PostHog + CloudWatch |

## Compliance (हर tier में लागू)

- **GST registration** + invoicing (GSTIN + HSN/SAC) — Tier A से
- **Aggregator levy** (Central Social Security Code, 1–2% of GMV to social-security fund) — Tier B+ से budget में
- **Karnataka Platform Workers Act** — अगर Bengaluru pilot, then Tier B से dispatch logic compliant
- **Background checks** — Tier A में manual verify, Tier C+ में IDfy automation
- **Insurance** — liability cover Tier C से mandatory

## हम क्यों? (Why Us)

[यह section client-specific fill करें — Alok की team की strengths, similar projects, references etc.]

## अगले कदम (Next Steps)

1. **Tier selection call** (60 मिनट) — आप अपनी position के हिसाब से tier चुनें या हम मिलकर decide करें
2. **Discovery call** (90 मिनट) — चुने हुए tier के लिए specific scope, city, vendor pipeline, marketing budget
3. **Final SOW** (Statement of Work) + Contract
4. **Advance payment** (15–30%) → Phase 0 शुरू
5. **Weekly demo calls** + monthly business review

## इस प्रस्ताव की validity

30 दिन (16 May 2026 तक)

---

# हमारी सिफ़ारिश (Our Recommendation)

| आपकी situation | सिफ़ारिश |
|---|---|
| बिल्कुल नया business, no validation | **Tier A** से शुरू, 100 bookings होने पर Tier B में move |
| Vendor network ready, market understood | **Tier B** — सीधा real product launch करें |
| Tier B run हो चुका है, paid scale करना है | **Tier C** — growth tools + automation |
| Already 1 city successful, multi-city expand करना है | **Tier D** — full platform |

**सबसे common pattern:** Tier A → 3 महीने में validate → Tier B → 6 महीने में optimise → Tier C → multi-city decide → Tier D।

**Aggressive option:** Tier B से सीधा शुरू करें अगर आप confident हैं — 70% clients इसी से शुरू करते हैं।

---

**सम्पर्क:**
Alok Tiwari
[Email] | [Phone] | [Website]

*यह प्रस्ताव confidential है, बिना अनुमति किसी और के साथ share न करें।*
