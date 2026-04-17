# प्रोजेक्ट प्रस्ताव — होम सर्विसेज़ ऐप (Urban Company जैसा मॉडल)

**तैयार किया गया:** 16 अप्रैल 2026
**प्रस्तुतकर्ता:** Alok Tiwari
**प्राप्तकर्ता:** [Client का नाम]
**प्रोजेक्ट कोड:** HSV-PILOT-2026

---

## 1. एक पन्ने में पूरी कहानी (Executive Summary)

आप एक ऐसा प्लेटफ़ॉर्म लॉन्च करना चाहते हैं जहाँ ग्राहक अपने घर के लिए AC रिपेयर, प्लम्बिंग, इलेक्ट्रिकल, क्लीनिंग जैसी सेवाएँ ऐप से बुक कर सकें — और हर बुकिंग नज़दीकी टेक्नीशियन के पास automatically पहुँच जाए। ग्राहक का पैसा सीधा आपके (Owner के) account में आएगा, फिर आप commission काट कर technician को settle करेंगे।

**यह प्रस्ताव आपको देता है:**

| पैरामीटर | विवरण |
|---|---|
| क्या बनेगा | 3 ऐप — Customer Android, Technician Android, Owner Web Dashboard |
| Pilot कहाँ | 1 शहर, 3–5 service categories, 50–200 verified vendors |
| समय | **6 महीने** (foundation से public launch तक) |
| कुल निवेश | **₹55–85 लाख** (lean team approach) — code, infra, launch marketing सब included |
| Owner को क्या मिलेगा | हर order, हर payment, हर technician की **real-time पूरी visibility**, single dashboard में |
| बाज़ार का आकार | भारत में home services बाज़ार **₹5.1 लाख करोड़** का है, जिसमें organized online players का हिस्सा सिर्फ़ 0.8% है |

**सीधी बात:** Urban Company FY25 में ₹1,144 करोड़ का revenue कमा चुकी है (38% growth) और sept 2025 में IPO आया जो 109 गुना subscribe हुआ। मतलब model proven है। मगर unorganized 99% बाज़ार अभी भी खुला है — एक city में disciplined operator बहुत बड़ा share ले सकता है।

---

## 2. व्यापारिक अवसर (Business Opportunity)

### बाज़ार के तथ्य

- **Total Addressable Market (TAM):** ₹5.1 लाख करोड़ (~$60 billion) FY25 में, FY30 तक ₹8.4 लाख करोड़ का अनुमान।
- **Online organized share:** आज सिर्फ़ 0.8%, FY30 तक 1.3% — मतलब 18–22% सालाना growth।
- **Top 200 शहरों में addressable households:** 5.3 करोड़।
- **Urban Company की market position:** category leader, मगर 1.4★ की customer rating (PissedConsumer पर 1,234 reviews) से साफ़ है कि execution gap बहुत बड़ा है।

### इसमें आपका Edge क्या है

1. **एक शहर पर पूरा focus** — UC 30+ शहरों में बिखरी हुई है; आप एक शहर में बेहतर service quality दे सकते हैं।
2. **Vendor-friendly approach** — UC के technicians जनवरी-फ़रवरी 2026 में देशव्यापी हड़ताल कर चुके हैं। आप fair commission (28% की जगह 22–25%) देकर top vendors को आसानी से खींच सकते हैं।
3. **Personal relationship management** — Owner के तौर पर आप खुद vendors और बड़े customers से जुड़े रहेंगे, जो UC के algorithmic distance के मुक़ाबले बहुत बड़ा trust factor बनाएगा।
4. **Marketing leverage** — आपके पास पहले से vendor network और local market knowledge है।

---

## 3. प्रस्तावित Solution

### 3 Apps + 1 Dashboard

#### क. Customer App (Android)
ग्राहक के लिए सरल, साफ़ अनुभव:
- Phone OTP से signup
- Service category चुनें → service चुनें → slot चुनें → address pin करें (Google Maps)
- Price quote तुरंत दिखेगा
- Booking confirm करें → 30 सेकंड में technician assign
- Live tracking — technician कहाँ है, कब पहुँचेगा (Ola/Uber जैसा)
- Service complete → final price approve → UPI/Card से payment
- Rating दें, complaint registar करें

#### ख. Technician App (Android)
Vendor के लिए practical tool:
- KYC upload (Aadhaar, PAN, background verification)
- Skills + working area set करें
- Job offer आएगा (30 सेकंड का window) — accept या decline
- Google Maps से navigation handoff
- "Reached", "Started", "Completed" mark करना (with photos)
- Wallet में weekly earnings दिखेगी
- Payout हर हफ़्ते बैंक में automatically

#### ग. Owner Web Dashboard — **आपका Control Center**
यह आपका सबसे important tool है। आप जो माँग रहे हैं — हर order की पूरी visibility — यहाँ मिलेगी:

**Live Operations View** (default screen):
- शहर का map, हर active technician और हर live booking दिख रही होगी
- Real-time order feed: नई booking → assigned → in-progress → completed
- आज के counters: कितने orders, कितनी GMV, कितना commission, कितनी payout pending

**Orders Module** — *पूरी visibility का दिल*:
- हर एक order की searchable + filterable list (status, category, date, amount, customer phone, technician से filter)
- किसी भी order में drill down करें — पूरी timeline, customer-tech contacts, before/after photos, payment details, refunds, complaints, internal notes
- आप कुछ भी override कर सकते हैं — दूसरा technician assign, manual complete, refund issue, complaint escalate
- Excel/CSV export — GST और finance reconciliation के लिए

**Technician Module:**
- सभी vendors की list — KYC status, weekly earnings, lifetime GMV, rating, current location
- Activate/deactivate, commission % adjust करना (top performers को बेहतर deal), in-app chat

**Customer Module:**
- सभी customers की list — lifetime spend, complaint count, blacklist toggle

**Finance Module:**
- Daily P&L: GMV, commission, payouts, refunds, marketing, gateway fees → contribution margin
- Weekly payout queue — हर tech का amount approve करें, Razorpay अपने आप settle करेगी
- GST output register auto-generated

**Complaints Module:**
- सभी open complaints का inbox, SLA timer के साथ
- Support agent को assign करें, resolution code के साथ close करें

**Marketing Module:**
- Coupons, referral program, push notifications (city/category/cohort के basis पर targeted)

**Audit Log:**
- हर override, refund, deactivation, payout-approval का record — कौन ने, कब, क्यों किया
- Non-deletable — कोई vendor आगे dispute करे तो आप legally protected हैं

**Access Control (बाद में जब team बड़ी हो):**
- Super-admin (आप): सब कुछ
- Operations Manager: live ops + orders + complaints (finance hidden)
- Finance: सिर्फ़ finance + audit log
- Support Agent: सिर्फ़ अपने को assigned complaints

---

## 4. Payment Flow (पैसे का रास्ता) — सबसे important हिस्सा

```
ग्राहक (UPI/Card)
       ↓
   ₹600 का payment
       ↓
   Razorpay Payment Gateway
       ↓
   Razorpay Route (auto split):
       ├── ₹150 (25% commission) → आपका bank account (तुरंत)
       └── ₹450 → Technician का linked account (T+2 दिनों में)
```

**आपको सीधा कैसे फ़ायदा होता है:**
1. हर booking पर 22–25% commission (आप चाहें तो category-wise अलग रखें)
2. Razorpay Route से पैसा आपके पास escrow में आता है, automatic split होता है — manual hisaab-kitab नहीं
3. Refund आए तो आपके payment से होता है, fund hold भी system manage करता है
4. GST invoice automatic generate, accountant के लिए ready

**Working Capital का सच:**
- Customer पैसा देता है booking complete होने पर
- आप technician को weekly settle करते हैं
- Razorpay का settlement T+2 days
- मतलब लगभग **₹15–20 लाख का working capital line** चाहिए होगा (1 हफ़्ते की GMV float के लिए) — यह budget में अलग से जोड़ा गया है

---

## 5. Technology — क्या use होगा और क्यों

| क्या | कौन सा | क्यों |
|---|---|---|
| Mobile apps | **Flutter 3.x** | एक codebase से दोनों Android apps बनेंगी, बाद में iOS भी same code से |
| Backend | **Node.js (NestJS)** + TypeScript | Real-time job dispatch के लिए सबसे मज़बूत, India में developers आसानी से मिलते हैं |
| Database | **PostgreSQL + PostGIS** | "नज़दीकी technician" खोजने वाली geo-query सबसे fast इसी में |
| Real-time | **Socket.io + Redis** | Job offer 30 सेकंड में technicians के पास push होगा |
| Maps | **Google Maps Platform** | Address pin, ETA, navigation — industry standard |
| Payments | **Razorpay + Razorpay Route** | India का #1 PG, split-payment built-in, PCI compliance आपके सर पर नहीं आएगी |
| Notifications | **FCM + MSG91 (SMS) + WhatsApp Business** | Booking confirmation WhatsApp पर भेजने से no-show 30% कम होते हैं |
| KYC/Background | **IDfy** | Aadhaar + PAN + criminal record verification — 1 day turnaround |
| Hosting | **AWS Mumbai (ap-south-1)** | India का data India में रहे, latency कम |
| Monitoring | **Sentry + PostHog + CloudWatch** | Bugs जल्दी पकड़े जाएँ, user behaviour समझ में आए |

**यह सब industry-standard है** — यानी कल को आपको कोई और developer/agency hire करनी हो तो कोई vendor lock-in नहीं।

---

## 6. Timeline — 6 महीने में Public Launch

| Phase | समय | क्या होगा |
|---|---|---|
| **Phase 0 — Foundation** | हफ़्ता 1–2 | Brand, wireframes, GST/Razorpay/Maps account setup, **पहले 50 vendors की recruitment शुरू** |
| **Phase 1 — Walking Skeleton** | हफ़्ता 3–6 | Basic OTP login, service catalogue, manual booking + payment end-to-end |
| **Phase 2 — Auto-dispatch** | हफ़्ता 7–10 | नज़दीकी technician को 30 सेकंड में push, live tracking, accept/reject flow |
| **Phase 3 — Money + Trust** | हफ़्ता 11–14 | Razorpay Route split-payment, weekly payouts, ratings, complaints + SLA |
| **Phase 4 — Owner Control + Growth** | हफ़्ता 15–18 | पूरा owner dashboard, coupons, referrals, **soft launch 200 customers को** |
| **Phase 5 — Hardening + Public Launch** | हफ़्ता 19–24 | Load testing, bug fixes, Play Store submission, **public launch + paid marketing** |

**Public Launch Date:** आज से ~6 महीने बाद (Oct 2026)

---

## 7. निवेश का Breakdown (Investment)

### Lean Team Approach (Recommended)

| Item | Cost | Notes |
|---|---|---|
| Project Manager (आधा time, 6 महीने) | ₹6–9 लाख | scope/timeline manage करेगा |
| 2 Mobile Developers (Flutter, 6 महीने) | ₹18–24 लाख | दोनों apps के लिए |
| 1 Backend Developer (NestJS, 6 महीने) | ₹12–18 लाख | API + dispatch + payments |
| 1 Frontend Developer (Admin web, 4 महीने) | ₹8–12 लाख | Owner dashboard |
| 1 UI/UX Designer (3 महीने part-time) | ₹4–6 लाख | wireframes, design system |
| 1 QA (3 महीने) | ₹3–6 लाख | testing, bug catch |
| **Subtotal — People** | **₹51–75 लाख** | |
| Infra + APIs (6 महीने) | ₹3–6 लाख | AWS + Razorpay + Maps + MSG91 + WhatsApp |
| Marketing for pilot (₹500–1000 CAC × 2,000 customers) | ₹10–20 लाख | digital ads + RWA tie-ups + referral incentives |
| **कुल Project Cost** | **₹64–101 लाख** | |
| **जो आपको हम बता रहे हैं (अनुमानित)** | **₹55–85 लाख** | lean team optimisation के साथ |

### अलग से रखना है

| Item | Amount | क्यों |
|---|---|---|
| Working Capital float | ₹15–20 लाख | Razorpay T+2 settlement vs weekly tech payouts gap |
| Insurance (liability cover) | GMV का 1–2% | किसी customer के घर में damage हो जाए तो |
| Legal/CA (entity, GST, contracts) | ₹2–3 लाख | one-time setup |

---

## 8. Payment Milestones (आप हमें कैसे pay करेंगे)

| Milestone | % | अनुमानित राशि (₹70 लाख base पर) |
|---|---|---|
| Project kickoff (Phase 0 शुरू) | 15% | ₹10.5 लाख |
| Phase 1 demo — Walking skeleton ready | 20% | ₹14 लाख |
| Phase 2 demo — Auto-dispatch live | 20% | ₹14 लाख |
| Phase 3 demo — Payments + payouts working | 20% | ₹14 लाख |
| Phase 4 demo — Owner dashboard signed off | 15% | ₹10.5 लाख |
| Public Launch + 30-day stability | 10% | ₹7 लाख |

**Refund policy:** अगर किसी phase के बाद आप project बंद करना चाहें, तो उस phase तक का काम और code आपका है, आगे का payment cancel।

---

## 9. क्या मिलेगा हर Phase के बाद (Deliverables)

हर phase के अंत में आपको मिलेगा:
1. **Working demo** — आप खुद app पर book कर सकेंगे, dashboard पर देख सकेंगे
2. **Source code access** (private GitHub repo) — पूरा code आपका
3. **Documentation** — हर API, हर screen, हर decision documented
4. **Test report** — क्या काम कर रहा है, क्या pending है
5. **Sprint demo call** — 30 minute video call जिसमें हम walk-through करेंगे

---

## 10. जोखिम और हम कैसे संभालेंगे

| जोखिम | संभावना | हम कैसे संभालेंगे |
|---|---|---|
| **Vendor liquidity collapse** — 20 techs एक हफ़्ते में छोड़ दें तो dispatch fail | मध्यम | Launch से पहले 100+ vendors recruit, weekly 1-on-1, fair commission policy |
| **Working capital squeeze** — पैसा फँसे | उच्च | ₹15–20 लाख की standby line अलग रखी, T+2 settlement Razorpay handle करता है |
| **Quality variance** — एक खराब tech NPS गिरा दे | उच्च | Mandatory skill test, पहले 3 jobs supervised, 3.5★ से नीचे जाने पर auto-pause |
| **Regulatory** — Karnataka/केंद्रीय Labour Code 1–2% aggregator levy | निश्चित | Day 1 से unit economics में बजट किया, dispatch logic Karnataka right-to-refuse compliant |
| **Single-city CAC ज़्यादा** — paid ads महँगे | मध्यम | RWA tie-ups, society WhatsApp groups, referral program — paid ads पहले 3 महीने minimal |
| **Owner over-reach** — UC-clone 6 महीने में नहीं बनती | उच्च | Pilot launch के बाद पहले 6 महीने नई city या नई category नहीं — discipline |

---

## 11. हम क्यों? (Why Us)

[यह section अपने हिसाब से fill करें — Alok की team की क्या strengths हैं, पिछले projects, references etc.]

---

## 12. अगले कदम (Next Steps)

अगर आप आगे बढ़ना चाहते हैं:

1. **Discovery call** (60 मिनट) — हम आपकी specific city, target customer, vendor pipeline, budget पर detailed बात करेंगे
2. **Final scope + commercial proposal** — Discovery के 3 दिन बाद हम final SOW (Statement of Work) देंगे
3. **Contract sign + advance** (15%) — Phase 0 शुरू
4. **Phase 0 के अंत तक** — आपके हाथ में wireframes, brand identity, और pilot city का operational plan होगा

**इस प्रस्ताव की validity:** 30 दिन (16 May 2026 तक)

---

## Appendix — Urban Company के Numbers जो हमने इस्तेमाल किए

| Metric | Value | Source |
|---|---|---|
| FY25 Revenue | ₹1,144 करोड़ (+38%) | Business Standard |
| FY25 Net Profit | ₹240 करोड़ (deferred-tax credit सहित) | Business Standard |
| Q3 FY26 Net Loss | (₹21.3 करोड़) | Samco |
| IPO Subscription | 109× | Chittorgarh |
| IPO Listing Premium | +57.5% (₹103 → ₹162.25) | Business Standard |
| Standard Take Rate | 28% | StartupTalky |
| India Home Services TAM | ₹5.1 लाख करोड़ | HDFC TRU |
| Average Tech Earning (FY26) | ₹28,322/month | Startup News |
| InstaHelp Daily Bookings (Feb 2026) | 51,520 | ScanX |
| Active Workers Protests | जनवरी–फ़रवरी 2026 (देशव्यापी) | Countercurrents |

---

**सम्पर्क:**
Alok Tiwari
[Email] | [Phone] | [Website]

*यह प्रस्ताव confidential है, बिना अनुमति किसी और के साथ share न करें।*
