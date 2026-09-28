# 2026 Home-Services App Benchmark: Ayodhya / Rural UP, Hindi-First

Scope note: based on current public app/store/site signals for Urban Company, Snabbit, Pronto, Housejoy as available, plus Indian commerce craft references. Urban Company, Snabbit, Pronto show current public signals; Housejoy is weaker as a current Android reference, so use it mostly as a legacy broad-catalog caution.

## 1. Per-Screen Best-In-Class Patterns

| Screen | Reference App(s) | Hierarchy | Imagery Approach | Motion / Micro-Interaction | Trust Cue | Copy Pattern |
|---|---|---|---|---|---|---|
| First-run + phone/OTP auth | Urban Company, Pronto, Blinkit, Revolut | 1. Language choice 2. Phone field 3. OTP 4. permission asks only after value | Plain Hindi-first screen, small service icons, no splash-carousel bloat | Auto-read SMS OTP, 30s resend countdown, numeric keypad, shake only on invalid OTP | “नंबर सुरक्षित है”, WhatsApp/SMS fallback, no forced email | “मोबाइल नंबर डालें। बुकिंग अपडेट इसी पर आएंगे।” |
| Home / discovery | Urban Company, Snabbit, Pronto, Blinkit | 1. Search 2. urgent services 3. top local categories 4. rebook | Real category thumbnails: plumber, सफाई, AC, बिजली; avoid abstract gradients | Sticky search, shimmer skeleton under 1 sec, tap category gives pressed state | Location pin + “आपके इलाके में उपलब्ध”; ratings near category | “आज क्या करवाना है?” “10-30 मिनट में मदद” |
| Service detail | Urban Company, Airbnb, Swiggy | 1. service name + price 2. what’s included 3. add-ons 4. reviews 5. policies | Before/after photos, worker-in-uniform photo, simple checklist diagrams | Expandable “क्या शामिल है”, quantity stepper, bottom CTA updates price | “ट्रेंड/वेरिफाइड प्रो”, warranty, no-extra-payment badge | “इसमें शामिल: 1 पंखा, 1 स्विचबोर्ड। पार्ट्स अलग से।” |
| Slot picker | Snabbit, Pronto, Urban Company, Airbnb | 1. instant vs scheduled 2. date chips 3. time slots 4. reschedule rule | Minimal; calendar not photo-heavy | Slots animate from loading to available; unavailable slots explain why | “30 मिनट पहले तक बदल सकते हैं” from Snabbit-like promise | “आज 4:30-5:00 उपलब्ध” not “slot available” |
| Address | Blinkit, Zomato/Swiggy, Airbnb | 1. detect location 2. house/landmark 3. contact person 4. map confirmation | Map only when useful; large landmark field for rural addressing | GPS confidence meter; “use current location” spinner with timeout | “प्रो को सिर्फ बुकिंग के लिए पता दिखेगा” | “घर के पास की पहचान: मंदिर, स्कूल, दुकान” |
| Checkout / summary | Urban Company, Airbnb, Cred | 1. service 2. date/time 3. address 4. exact total 5. pay options | Receipt-like summary, not marketing cards | Price row expansion, coupon applied tick, pay button disabled until review | “ऐप के बाहर भुगतान न करें”; cancellation/refund line visible | “कुल ₹499। इससे अधिक न दें जब तक आप ऐप में मंजूरी न दें।” |
| Booking confirmed | Swiggy, Airbnb, Urban Company | 1. confirmed state 2. pro assignment status 3. what happens next 4. help | Calm success screen, booking ID copy button | Check animation under 500ms; progress steps appear | Booking ID, support entry, cancellation rule | “बुकिंग हो गई। प्रो मिलने पर फोटो और नाम दिखेगा।” |
| Live tracking + safety | Swiggy/Zomato, Urban Company, Blinkit | 1. pro photo/name 2. ETA 3. route/status 4. call/chat 5. safety | Map lite mode; pro card more important than map on low-end phones | Status chips: assigned, रास्ते में, पहुंच गए; haptic on arrival | Masked calling, OTP at arrival, emergency contact, “don’t pay outside app” | “दरवाज़ा खोलने से पहले OTP मिलाएं: 4821” |
| Rating / review | Airbnb, Urban Company, Zomato | 1. star/NPS 2. reason chips 3. photo issue 4. tip optional | Pro face + completed service thumbnail | Star hover/tap labels; chips appear after rating | “आपकी रेटिंग क्वालिटी जांच में मदद करेगी” | “काम कैसा हुआ?” “समय पर आए”, “अतिरिक्त पैसे मांगे” |
| Wallet / credits | Cred, Revolut, Urban Company | 1. usable balance 2. expiry 3. where usable 4. ledger | Ledger rows with icons, no casino visuals | Count-up balance; copy coupon code | Clear refund/credit origin, expiry warning | “₹120 क्रेडिट। अगली सफाई में अपने-आप लगेगा।” |
| Bookings list | Airbnb, Urban Company, Swiggy | 1. active booking 2. upcoming 3. past 4. rebook/help | Compact status cards with service icon + date | Pull-to-refresh, status pill color changes | Invoice, pro details, support timeline | “आज 5 बजे: बाथरूम सफाई” “फिर से बुक करें” |
| Empty / error / offline | Blinkit, Swiggy, Revolut | 1. problem 2. what user can still do 3. retry / call | Lightweight local illustration; no huge SVG payload | Offline banner, cached last categories, retry button with backoff | Phone support for paid bookings; saved draft | “नेट कमजोर है। आपकी बुकिंग अभी नहीं हुई है।” |

## 2. Ten Table-Stakes Expectations In 2026 India

1. Hindi-first UI with easy switch to English; no Hinglish-only critical instructions.
2. Phone + OTP login that works with SMS delay, dual-SIM confusion, and weak network.
3. Clear final price before booking, including visit fee, parts, GST, platform fee, and cancellation fee.
4. UPI, cash, and wallet/credit support; UPI is mandatory at Indian scale.
5. “No payment outside app” warning repeated at checkout, tracking, and completion.
6. Verified professional card: photo, name, rating, ID status, language, and skill tags.
7. Exact arrival promise: instant, today, tomorrow, or unavailable; no fake “few minutes”.
8. Address model that supports landmarks, village/locality names, nearby shop/temple/school, and alternate contact.
9. Low-end Android performance: fast cold start, compressed images, cached home, graceful offline.
10. Human support path for paid or safety-sensitive bookings, not only FAQ chat.

## 3. Ten Cheap Compose Delight Patterns

1. Hindi voice search chip: mic icon + “बोलकर खोजें”.
2. One-tap “फिर से बुक करें” from past booking card.
3. Arrival OTP card with large digits and “नाम/फोटो मिलाएं”.
4. Slot chips with live labels: “सबसे जल्दी”, “कम भीड़”, “कल सुबह”.
5. Price lock badge: “बुकिंग के बाद कीमत नहीं बदलेगी बिना आपकी मंजूरी”.
6. Landmark suggestions after address entry: “मंदिर के पास”, “स्कूल के सामने”.
7. Add-on steppers that update total instantly in sticky bottom bar.
8. Skeleton loaders shaped like actual category cards, not generic grey blocks.
9. Offline saved draft banner: “नेट आने पर यहीं से जारी रखें”.
10. Post-service photo receipt: before/after or completed-work photo in booking history.

## 4. Five Anti-Patterns To Avoid

1. Hiding extra charges under “inspection” until the professional arrives.
2. Asking for location, contacts, notifications, and storage on first launch before trust is earned.
3. Showing English legal copy for refund/cancellation in a Hindi-first journey.
4. Replacing human support with circular chatbot FAQs after payment failure or no-show.
5. Using tiny grey text for safety, cancellation, parts-not-included, or outside-payment warnings.

## 5. 12-Row Screen Review Rubric, Score 0-4

| Criterion | 0 | 2 | 4 |
|---|---|---|---|
| Hindi clarity | English-first, jargon | Hindi visible but mixed | Natural Hindi, critical info unambiguous |
| Price transparency | Total hidden | Total shown, caveats hidden | Total + exclusions + approval rule visible |
| Trust before action | No proof | Generic rating | Verified pro/service proof near CTA |
| Low-end performance | Heavy, janky | Acceptable on Wi-Fi | Fast on weak 4G, cached, compressed |
| Rural address fit | Flat/urban only | Landmark optional | Landmark, alternate phone, map fallback |
| Error recovery | Dead end | Retry only | Explains state, preserves progress, support path |
| Payment confidence | One payment mode | UPI + card | UPI/cash/credits, clear failure handling |
| Safety | Buried | Visible in tracking | OTP, masked call, emergency, outside-pay warning |
| Slot honesty | Fake urgency | Some unavailable states | Real ETA, unavailable reasons, reschedule rule |
| Copy specificity | Generic | Some specifics | Concrete inclusions/exclusions in local language |
| Accessibility | Tiny text | Meets basics | Large touch targets, readable contrast, TalkBack labels |
| Post-booking control | No manage options | Cancel only | Reschedule, help, invoice, rebook, issue report |

## Sources

- Urban Company Play listing: current “InstaHelp & more”, under-30-minute services, 4.8+ rated professionals, support/review signals.  
  https://play.google.com/store/apps/details?id=com.urbanclap.urbanclap
- Snabbit Play listing: 10-minute help, trained/background-verified experts, scheduling and rescheduling.  
  https://play.google.com/store/apps/details?id=com.snabbit.customer
- Pronto site: 15-minute help, 20 services, cart, instant/scheduled/recurring booking, OTP signup.  
  https://www.withpronto.com/
- Pronto service coverage: 11 Indian cities and service catalog.  
  https://www.withpronto.com/services/
- Blinkit Play listing: last-minute commerce, smooth doorstep delivery expectations.  
  https://play.google.com/store/apps/details?id=com.grofers.customerapp
- Airbnb 2026 UX reference: listing detail, upfront totals, booking flow, reviews.  
  https://typenorm.com/apps/airbnb
- Swiggy app page: track-on-the-go food delivery expectation.  
  https://www.swiggy.com/app
- India telecom survey 2025: rural smartphone/internet/UPI usage context.  
  https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=2132330
- NPCI UPI statistics: UPI scale and payment expectation.  
  https://www.npci.org.in/product/upi/product-statistics