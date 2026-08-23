# Play Console Listing Pack — Customer App

**App:** HomeHeroo (customer)
**Package:** `in.homeheroo.customer`
**Current bundle:** `0.1.8` / versionCode 12
**Prepared:** 2026-08-14
**Scope:** every Play Console field for the customer app, with the exact value to enter and the code evidence behind it.

> Every claim in this pack was verified against the repository. Where a field depends on
> a decision only the owner can make, it is marked **[DECIDE]**. Where a value cannot be
> entered until a code or infra change lands, it is marked **[BLOCKED]**.

---

## 0. Blockers — resolve before you submit

These four items will either stop the upload or get the release rejected. Fix order matters.

### 0.1 [BLOCKED] Target API level 36 — hard deadline Aug 30, 2026

Play Console is correct. Both bundles ship `targetSdkVersion 35`:

```
artifacts/customer-app-0.1.8-vc12-release.aab  → targetSdkVersion 35
artifacts/technician-app-0.1.12-vc13-release.aab → targetSdkVersion 35
```

Source: `customer-app/app/build.gradle.kts` → `compileSdk = 35`, `targetSdk = 35`.

**This is not a one-line bump.** Targeting API 36 (Android 16) activates behaviour changes that
will visibly break a Compose app that has not been prepared:

| Android 16 change at `targetSdk 36` | Risk to this app |
|---|---|
| **Edge-to-edge enforced.** The `windowOptOutEdgeToEdgeEnforcement` escape hatch is ignored. | High — every screen must handle system-bar insets itself or content slides under the status/nav bar. Affects all 17 UI packages. |
| **Predictive back on by default.** | Medium — custom back handling in `AppNavigation` / SOS flows needs verifying. |
| **Orientation & resizability restrictions ignored on large screens (>600dp).** | Low–medium — app becomes resizable on tablets/foldables; check layouts don't break. |
| **Stricter JobScheduler quotas + intent redirect hardening.** | Low for customer app; re-check the `homeservices://` deep-link handler. |

**Recommended sequencing:** treat this as its own Feature-tier story, not a chore appended to
the release. `compileSdk`/`targetSdk` → 36, then an inset/edge-to-edge pass across all screens,
then re-record Paparazzi goldens on CI, then Codex. Do this *before* building the submission AAB
so you only go through review once.

You have ~2 weeks to the Aug 30 deadline.

### 0.2 Google Play Billing warning — does not apply to either of your bundles

I checked this directly rather than trusting the warning. **Neither app contains the Google
Play Billing Library at all.**

Evidence — the `BUNDLE-METADATA/com.android.tools.build.libraries/dependencies.pb` block inside
each AAB (this is the exact metadata Play Console reads to determine SDK versions) contains no
`com.android.billingclient` entry, in any of the four built bundles:

```
customer-app-0.1.7-vc11     → no billing entry
customer-app-0.1.8-vc12     → no billing entry
technician-app-0.1.11-vc12  → no billing entry
technician-app-0.1.12-vc13  → no billing entry
```

Confirmed independently by resolving `:app:dependencies --configuration releaseRuntimeClasspath`
for both apps — no `com.android.billingclient` node. The only `billing`-adjacent strings in the
DEX are a PostHog help URL ("billing limits") and Kotlin's `SpillingKt` — false positives.

**What to do:** In Play Console, open **App bundle explorer → (select the flagged version) → SDKs**
and read which bundle and which version it is actually flagging. Two likely explanations:

1. The warning is attached to a **different app** in your developer account.
2. It is attached to an **older bundle already uploaded** to a track that you have since rebuilt.
   Publishing the current bundle to that track clears it.

**Also worth knowing:** even if Play Billing were present, you would not need to *integrate* it.
Google Play's payments policy requires Play Billing only for in-app digital goods. HomeHeroo sells
real-world physical services performed at the customer's home, which is explicitly out of scope.
Your cash-on-service and (dormant) Razorpay flows are compliant. So the fix is only ever "remove or
upgrade the transitive library", never "add Play Billing".

### 0.3 [RESOLVED 2026-08-23 - PR #314] The launcher name is still a placeholder

```
customer-app/app/src/main/res/values/strings.xml:3
  <string name="app_name">homeservices customer</string>
values-hi/strings.xml:3
  <string name="app_name">होमसर्विसेज ग्राहक</string>
```

The app installs on the home screen as **"homeservices customer"** while the Play listing says
"HomeHeroo". Play's metadata policy treats a mismatch between store title and in-app branding as
a listing problem, and it looks unfinished to reviewers and users alike.

**Fix before the submission build:**

```xml
<!-- values/strings.xml -->
<string name="app_name">HomeHeroo</string>
<!-- values-hi/strings.xml -->
<string name="app_name">HomeHeroo</string>
```

Keep the brand name untranslated in Hindi (transliterated only) — brand names should not be
localised into a different word.

### 0.4 [RESOLVED 2026-08-23] Two URLs must exist and be live before the form will accept them

| URL | Status | Notes |
|---|---|---|
| Privacy policy | **RESOLVED** | `docs/runbook.md` says the policy is hosted at GitHub Pages `aloktiwarigit/homeheroo-privacy`. But `DpdpConsentScreen.kt:70` still points at `https://homeservices.app/privacy` — a domain that does not match your brand. **Fix the in-app constant to the real GitHub Pages customer URL, and use that same URL in Play Console.** The URL must be publicly reachable, non-geofenced, and must actually describe this app. |
| Account deletion | **RESOLVED** | Play requires a *web* URL where a user can request account deletion, in addition to the in-app flow. In-app deletion exists (`ui/deleteaccount/`, `POST /v1/users/me/erasure-request`) but there is no public web page. Add `/customer/delete-account` to the GitHub Pages site describing the in-app path, the `support@homeheroo.in` fallback, the 7-day cool-off, and what is retained (financial records 7y, audit log 5y) per `docs/dpdp-data-inventory.md`. |

---

## 1. Main store listing

### 1.1 App name — 30 characters max

**[DECIDE]** Two candidates:

| Option | Chars | Assessment |
|---|---|---|
| **`HomeHeroo: Home Services`** ← recommended | 25 | Clean, brand-first, zero policy risk. |
| `HomeHeroo: AC, Plumber, RO` | 27 | Better cold-start discovery in a market with no brand awareness, but flirts with Play's keyword-stuffing rule. |

I recommend the first. Play's Store Listing metadata policy specifically penalises titles that read
as keyword lists, and a suspension risk is not worth the marginal search lift — the short and full
descriptions already carry those keywords, and they are indexed.

Hard rules your title must respect: no ALL-CAPS (unless the brand is), no emoji or decorative
symbols, no "free", no "#1"/"best", no price or promo text, no other app's name.

### 1.2 Short description — 80 characters max

**Recommended (74):**

```
Verified home technicians. Fixed prices, live tracking, pay after service.
```

Alternatives:

```
Book AC, plumbing, electrical, RO and pump repairs at fixed prices.        (66)
AC, plumber, electrician & RO service in Ayodhya. Fixed price, pay cash.   (72)
```

The recommended line leads with the trust proposition, which is the actual wedge per `docs/prd.md`.
The third leads with keywords and the city — pick that one if you want the listing to convert
purely on local intent.

**Hindi (`hi-IN`):**

```
भरोसेमंद होम टेक्नीशियन। तय दाम, लाइव ट्रैकिंग, काम के बाद भुगतान।
```

### 1.3 Full description — 4000 characters max

Everything below is verified against the shipped code. **Do not add** the 7-day fix warranty,
₹500 no-show credit, insurance claims, or 60-second claim flow from `docs/prd.md` — I could not
find those implemented, and stating unimplemented features in a listing is a Misrepresentation
policy violation.

**English (2,408 characters — verified against the 4,000 limit):**

```
HomeHeroo brings verified home technicians to your door in Ayodhya — at prices you see before you book.

WHAT YOU CAN BOOK
• AC repair, deep cleaning, gas refill and installation
• Water pump and borewell repair and servicing
• Plumbing — leaks, taps, fittings and drainage
• Electrical — wiring, switches, fans and fittings
• RO and water purifier service, repair and filter change

FIXED PRICES, NO SURPRISES
Every service shows a fixed base price, exactly what is included, and how long it takes. If extra work is needed — a gas refill, a spare part, extra copper pipe — you see the add-on price and the reason for it, and nothing is charged until you approve it.

BOOK IN A FEW TAPS
Pick a service, choose a date and time window that suits you, confirm your address, and you're done. Pay cash to the technician after the work is finished.

KNOW WHO IS COMING
Before your technician arrives, open their professional profile: verification badges, years of experience, jobs completed, certifications, languages spoken, and recent reviews from other customers.

TRACK EVERY STEP
Follow your booking live from assignment to completion. See your technician's position on the map, their ETA, and each stage of the job as it happens. Notifications keep you updated even when the app is closed.

SAFETY, BUILT IN
A discreet SOS button is available while a technician is at your home. One tap silently alerts owner support — the technician is never notified. You can choose to attach a short audio recording to help support understand the situation. Nothing is recorded unless you ask for it.

IF SOMETHING GOES WRONG
Raise a complaint from the booking screen, attach a photo, and owner support will follow it up. Rate your technician after every job.

HINDI AND ENGLISH
The whole app works in Hindi and English. Switch anytime from Settings.

YOUR DATA, YOUR CONTROL
Download a copy of everything we hold about you, manage your privacy consent, or delete your account permanently — all from inside the app.

NOT IN AYODHYA YET?
Join the waitlist and we'll text you once we start serving your area. One message. No spam.

HomeHeroo is built for households in Ayodhya and nearby areas, and we're adding services and neighbourhoods steadily.
```

**Hindi (`hi-IN`) (1,958 characters):**

```
HomeHeroo अयोध्या में आपके घर तक भरोसेमंद टेक्नीशियन पहुँचाता है — और दाम आप बुकिंग से पहले ही देख लेते हैं।

आप क्या बुक कर सकते हैं
• एसी रिपेयर, डीप क्लीनिंग, गैस रीफिल और इंस्टॉलेशन
• वाटर पंप और बोरवेल रिपेयर व सर्विसिंग
• प्लंबिंग — लीक, नल, फिटिंग और ड्रेनेज
• इलेक्ट्रिकल — वायरिंग, स्विच, पंखे और फिटिंग
• आरओ और वाटर प्यूरीफायर सर्विस, रिपेयर व फ़िल्टर बदलना

तय दाम, कोई छुपा खर्च नहीं
हर सर्विस पर तय बेस प्राइस, उसमें क्या-क्या शामिल है, और कितना समय लगेगा — सब पहले से दिखता है। अगर कोई अतिरिक्त काम चाहिए, तो उसका दाम और कारण दोनों आपको पहले दिखाए जाते हैं, और आपकी मंज़ूरी के बिना कोई शुल्क नहीं लगता।

कुछ ही टैप में बुकिंग
सर्विस चुनें, अपनी सुविधा की तारीख और समय चुनें, पता कन्फ़र्म करें — बस हो गया। काम पूरा होने के बाद टेक्नीशियन को नकद भुगतान करें।

जानिए कौन आ रहा है
टेक्नीशियन के आने से पहले उनकी प्रोफ़ाइल देखें: वेरिफ़िकेशन बैज, अनुभव के वर्ष, पूरे किए गए काम, सर्टिफ़िकेशन, भाषाएँ, और दूसरे ग्राहकों के हाल के रिव्यू।

हर कदम की लाइव जानकारी
बुकिंग असाइन होने से लेकर पूरा होने तक लाइव फ़ॉलो करें। मैप पर टेक्नीशियन की लोकेशन, ETA और काम का हर चरण देखें। ऐप बंद होने पर भी नोटिफ़िकेशन आते रहेंगे।

सुरक्षा, ऐप में ही
टेक्नीशियन के आपके घर पर रहते हुए एक डिस्क्रीट SOS बटन उपलब्ध रहता है। एक टैप पर ओनर सपोर्ट को चुपचाप अलर्ट जाता है — टेक्नीशियन को पता नहीं चलता। आप चाहें तो एक छोटी ऑडियो रिकॉर्डिंग भी जोड़ सकते हैं। बिना आपकी अनुमति के कुछ भी रिकॉर्ड नहीं होता।

कुछ गड़बड़ हो तो
बुकिंग स्क्रीन से शिकायत दर्ज करें, फ़ोटो लगाएँ — ओनर सपोर्ट उसे आगे बढ़ाएगा। हर काम के बाद टेक्नीशियन को रेटिंग दें।

हिंदी और अंग्रेज़ी
पूरा ऐप हिंदी और अंग्रेज़ी दोनों में चलता है। सेटिंग्स से कभी भी बदलें।

आपका डेटा, आपका नियंत्रण
अपना पूरा डेटा डाउनलोड करें, प्राइवेसी कंसेंट मैनेज करें, या अकाउंट हमेशा के लिए डिलीट करें — सब ऐप के अंदर से।

अभी अयोध्या में नहीं हैं?
वेटलिस्ट जॉइन करें — आपके इलाके में शुरू होते ही हम आपको मैसेज करेंगे। सिर्फ़ एक मैसेज, कोई स्पैम नहीं।
```

---

## 2. Graphics assets

| Asset | Spec | Status |
|---|---|---|
| **App icon** | 512×512 px, 32-bit PNG **with alpha**, ≤1 MB. No drop shadow — Play applies its own masking. | Source from `mipmap-*/ic_launcher_homeheroo`. Export at 512 from the vector. |
| **Feature graphic** | 1024×500 px, PNG or JPEG, no alpha. Required. | **To produce.** Play may crop and overlay a play button — keep the brand mark and any text inside the centre ~80%. |
| **Phone screenshots** | 16:9 or 9:16, each side 320–3840 px. Hard minimum 2. | **Ship 8.** Use 1080×1920. |
| **7-inch tablet** | Optional, but omitting them limits tablet/Chromebook surfacing. | Skip for pilot. |
| **10-inch tablet** | Same. | Skip for pilot. |
| **Promo video** | Optional, YouTube URL. | Skip for pilot. |

**Screenshot storyboard** (order matters — most users only see the first 2–3):

1. Catalogue home — "Book trusted home services", 5 category cards with hero images
2. Service detail — AC Deep Clean, ₹599 fixed price, "what's included" list
3. Slot picker — date + time window
4. Live tracking — map, technician pin, ETA chip
5. Trust dossier — verification badges, experience, recent reviews
6. Before/after photo proof
7. SOS safety sheet
8. Hindi catalogue screen (proves bilingual — high value in this market)

Add a short caption band above each screenshot. Produce the whole set twice: `en-IN` and `hi-IN`.

**Do not** put fake ratings, "#1", awards, or Play Store badges into screenshot artwork.

---

## 3. Store settings

| Field | Value |
|---|---|
| App or game | **App** |
| Category | **House & Home** (best fit; `Lifestyle` is the fallback if you want a broader audience pool) |
| Tags | Choose up to 5 from Play's fixed list — suggest: Home Improvement, Home Services, Local Services, Repairs, Booking |
| Email address | `support@homeheroo.in` — **must be monitored**; Play emails policy notices here |
| Phone | **[DECIDE]** Optional. Only add a number you will actually answer. |
| Website | **[DECIDE]** GitHub Pages site is acceptable if it presents as a real product site, not a bare policy page. |
| External marketing | **[DECIDE]** Opt out unless you want Google promoting the app outside Play |

---

## 4. App access — the single highest rejection risk

The app is gated behind phone OTP login (`ui/auth/`, Firebase Phone Auth). A reviewer who cannot
get past the login screen will reject the release, and this is the most common cause of a first
submission failing.

**Select:** *All or some functionality is restricted*

Add one instruction set:

- **Name:** Customer login (phone OTP)
- **Username:** `+91 90000 00001` *(replace with your actual configured test number)*
- **Password:** `123456` *(the fixed OTP you configure)*
- **Any other instructions:**
  ```
  1. Launch the app and accept the privacy consent screen.
  2. Choose "Continue with phone number".
  3. Enter the number above. No real SMS is sent — this is a Firebase test number.
  4. Enter the 6-digit code above when prompted.
  5. The catalogue loads for Ayodhya, Uttar Pradesh. Services outside the
     Ayodhya coverage area show a waitlist screen instead — this is intended.
  ```

**Set this up first:** Firebase Console → Authentication → Sign-in method → Phone →
*Phone numbers for testing*. Add a fictional number and a fixed 6-digit code. These bypass real
SMS entirely and never consume quota.

**Two things to verify before submitting**, both of which can silently break the reviewer's session:

1. **Play Integrity.** `api/src/middleware/requireIntegrity.ts` returns `403 INTEGRITY_FAILED` on
   booking confirmation when `PLAY_INTEGRITY_STRICT=true`. Reviewers may test on emulators or
   non-certified devices, which fail attestation. Confirm the production setting, and if it is
   strict, either relax it for the review window or confirm the flow degrades gracefully.
2. **Coverage radius.** Per `docs/` notes, bookings outside the ~10 km Ayodhya radius never dispatch.
   The waitlist screen covers this for out-of-area addresses, but confirm a reviewer testing from
   a US IP with an Ayodhya address can still complete a booking end to end.

---

## 5. Ads

**Select: No, my app does not contain ads.**

Verified — no ad SDK in `releaseRuntimeClasspath`. PostHog is product analytics and GrowthBook is
feature flagging; neither is an advertising network and neither triggers the ads declaration.

---

## 6. Content rating (IARC questionnaire)

| Question | Answer | Why |
|---|---|---|
| Category | **Utility, Productivity, Communication or Other** | Not a game, not social, not a reference app |
| Violence / fear | No | — |
| Sexuality / nudity | No | — |
| Language | No | — |
| Controlled substances | No | — |
| Gambling / simulated gambling | No | — |
| **Does the app share the user's current location with other users?** | **Yes** | Booking address and pinned location go to the assigned technician; technician location is shown to the customer during tracking |
| **Does the app allow users to interact or communicate with each other?** | **No** | There is no in-app chat or user-to-user messaging. "Call support" dials the owner, not another user |
| **Does the app allow users to share user-generated content with other users?** | **Yes** | Confirmed: `trust_dossier_reviews_label` ("Recent Reviews") displays customer-written reviews on technician profiles to other customers |
| Digital purchases | **No** | Real-world services only; currently cash on service |
| Personal information shared with third parties | Yes | See Data safety below |

**Expected outcome:** Rated 3+ / "Everyone" in most territories. The location-sharing and UGC
answers add descriptors but do not raise the age band for a utility app.

⚠️ **Follow-on obligation from the UGC answer.** Because customer reviews are visible to other
customers, Play's User Generated Content policy applies. You need an in-app way to report
objectionable content and a stated moderation process. The complaints module (`ui/complaint/`) and
the owner's rating-shield/override tooling substantially cover this — but confirm a *customer* can
report an inappropriate review specifically, not just complain about a booking. If they cannot,
that is a small gap worth closing before production rollout.

---

## 7. Target audience and content

| Field | Value |
|---|---|
| Target age groups | **18 and over — only.** Do not tick any bracket below 18. |
| Appeals to children | **No** |
| Store presence for children | N/A once 18+ only |

Selecting 18+ exclusively keeps you out of the Families policy programme entirely, which is the
right call — the app involves paying money, home visits by strangers, and location sharing.

---

## 8. Data safety

This is the section Play audits most aggressively, and inaccuracy here is an enforcement issue, not
a paperwork issue. Every row below is derived from code and `docs/dpdp-data-inventory.md`.

### 8.1 Overall answers

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** — `usesCleartextTraffic="false"`; all API traffic is HTTPS |
| Do you provide a way for users to request that their data be deleted? | **Yes** — in-app (`ui/deleteaccount/`) + `POST /v1/users/me/erasure-request` + the web URL from §0.4 |
| Has your app been independently reviewed against a security standard? | **No** — do not claim this |
| Committed to Play Families Policy | **N/A** (18+) |

### 8.2 Data types

"Shared" below is answered conservatively: technicians are independent contractors, not employees,
so data reaching them is treated as a third-party transfer. Analytics and crash providers acting on
your behalf are declared as *collected*, not *shared*, which is the standard treatment for service
providers.

| Play data type | Collected | Shared | Required? | Purposes | Evidence |
|---|---|---|---|---|---|
| **Personal info → Name** | Yes | Yes | Required | App functionality, Account management | Firebase Auth display name; shown on receipts and to the assigned technician |
| **Personal info → Email address** | Yes | No | Optional | Account management | Only when the user signs in with Google (`googleid`, `androidx.credentials`) |
| **Personal info → Phone number** | Yes | Yes | Required | App functionality, Account management | Firebase Phone Auth; technician contact |
| **Personal info → Address** | Yes | Yes | Required | App functionality | `bookings.addressText` — service delivery; shared with assigned technician only |
| **Location → Approximate location** | Yes | Yes | Optional | App functionality | `ACCESS_COARSE_LOCATION`, address pinning + dispatch |
| **Location → Precise location** | Yes | Yes | Optional | App functionality | `ACCESS_FINE_LOCATION`, `bookings.addressLatLng`, live tracking map |
| **Financial info → Purchase history** | Yes | No | Required | App functionality | Booking and order history |
| **Financial info → Payment info** | **No** | — | — | — | Cash-only pilot; Razorpay checkout is present but dormant (`build.gradle.kts`: "Razorpay disabled for pilot"). **Must be re-declared the moment you enable online payment.** |
| **Photos and videos → Photos** | Yes | No | Optional | App functionality | Complaint photos via `ActivityResultContracts.GetContent()` → Firebase Storage |
| **Audio → Voice or sound recordings** | Yes | No | Optional | App functionality | SOS evidence recording, `RECORD_AUDIO`, explicit in-app consent (`sos_consent_title`) |
| **App activity → App interactions** | Yes | No | Optional | Analytics | PostHog |
| **App info and performance → Crash logs** | Yes | No | Optional | Analytics, App functionality | Sentry (no Crashlytics in the customer app) |
| **App info and performance → Diagnostics** | Yes | No | Optional | Analytics | Sentry performance |
| **Device or other IDs** | Yes | No | Required | App functionality, Analytics | FCM registration token (push), PostHog distinct ID |

**Explicitly NOT collected** — do not tick these: Contacts, Calendar, SMS/Messages, Health &
fitness, Files & docs, Music, Web browsing history, Installed apps, Search history, Race/ethnicity,
Political or religious beliefs, Sexual orientation.

### 8.3 Deletion-request URL

Enter the `/customer/delete-account` page from §0.4. Play validates that the URL loads.

---

## 9. Other App content declarations

| Declaration | Answer |
|---|---|
| **Sensitive permissions — background location** | **Not applicable.** The customer app requests foreground location only. No `ACCESS_BACKGROUND_LOCATION`. No declaration form or demo video required. *(The technician app is the opposite — see §11.)* |
| **Photo and video permissions** | **Not applicable.** No `READ_MEDIA_IMAGES` / `CAMERA`; complaint photos use the system picker, which needs no permission. |
| **Full-screen intent permission** | Not applicable for the customer app. |
| **News app** | No |
| **COVID-19 contact tracing / status** | No |
| **Government app** | No |
| **Financial features** | **None of these.** Play's list covers lending, banking, crypto, investments, insurance, debt management, tax and betting. Paying a technician for a home repair is none of them. |
| **Health apps** | No |
| **Data deletion** | Yes — in-app and via URL |
| **Advertising ID** | Declare *not used* unless PostHog is configured to collect GAID. **Verify this in the PostHog Android config before answering** — an incorrect answer here is an automatic policy flag. |

---

## 10. Countries, tracks and the production-access rule

| Item | Value |
|---|---|
| Countries | **India only** for the pilot. Adding more countries with no coverage produces installs that hit the waitlist screen and one-star reviews. |
| Pricing | Free app. In-app purchases: **No** (services are paid outside Play, which is permitted for physical services). |
| Launch track | Internal testing → Closed testing → Production |

⚠️ **If `aloktiwarigit`'s Play developer account is a personal (individual) account created after
Nov 2023, you cannot publish to production until you have run a closed test with at least 12
testers opted in continuously for 14 days,** then applied for and been granted production access.
Recruit the 12 testers now — that clock is the long pole, not the code.

If it is an **organisation** account, this requirement does not apply and you can go straight to
production.

---

## 11. Technician app — what differs (for when we do it next)

Not for filling in yet, but these are the deltas so you can start the long-lead items:

- **`ACCESS_BACKGROUND_LOCATION` + two `foregroundServiceType="location"` services.** This requires
  Play's Background Location declaration form *and* a screen-recorded demo video showing the in-app
  prominent disclosure, the permission prompt, and the feature working. That review takes weeks —
  start it early.
- **`CAMERA`** for guided photo capture → additional data-safety entries.
- **KYC: Aadhaar (masked) and PAN.** These are government IDs. Data safety must declare
  *Personal info → Other info* / government ID handling, and the privacy policy must cover it
  explicitly. Higher scrutiny.
- **`RECEIVE_BOOT_COMPLETED`, `showWhenLocked`, `turnScreenOn`** on the job-offer activity — expect
  questions about full-screen intent usage.
- **Firebase Crashlytics** is present in the technician app (unlike the customer app) — extra
  data-safety rows.
- **Not a public-facing consumer app.** Consider whether it should be a closed/unlisted distribution
  rather than open production, since only onboarded technicians should install it.

---

## 12. Ordered action list

1. **[code]** Bump `compileSdk`/`targetSdk` to 36 + edge-to-edge inset pass + re-record goldens on CI → Codex → merge. *(Deadline Aug 30.)*
2. ~~**[code]** Fix `app_name` in both locales.~~ **DONE** - PR #314, set to `HomeHeroo` in `values/` and `values-hi/` (brand stays Latin, matching `HomeHeroo तकनीशियन`).
3. ~~**[code]** Point `PRIVACY_POLICY_URL` at the real GitHub Pages URL.~~ **DONE** - PR #314. Was `https://homeservices.app/privacy`, a domain that does not resolve.
4. ~~**[web]** Publish the account-deletion page.~~ **DONE** - `/customer/` and `/customer-deletion/` live, both HTTP 200 (homeheroo-privacy@cfe4266, 2f11a2e).
5. ~~**[infra]** Configure Firebase test phone numbers for review access.~~ **DONE** - test number `+91 98765 43210` / `123456` already in the Identity Platform config, plus a pre-verified email account `playreview@homeheroo.in` (uid `YyIpkWtkowQL3dyN4LSPEBHq87w1`, `emailVerified` set server-side to clear the `AuthOrchestrator.startEmailSignIn` gate).
6. ~~**[infra]** Confirm `PLAY_INTEGRITY_STRICT` will not 403 a reviewer's device.~~ **DONE 2026-08-23** - `func-homeservices-prod` has 29 app settings and **zero** `PLAY_*` entries, so `isStrictMode()` is false. Per `requireIntegrity.ts:61-90` a missing token then warns to Sentry and passes through, so a reviewer will not be 403d on `confirmBooking` or job status transitions. (Corollary: integrity is **not enforced** in production today - a deliberate decision to revisit after review clears.)
7. ~~**[verify]** Confirm whether PostHog collects the Advertising ID.~~ **DONE 2026-08-23** - no `AD_ID` permission, no `play-services-ads-identifier` dependency, and no `AD_ID` in the merged release manifest. PostHog is initialised with defaults (`PostHogAnalyticsFacade.kt:41`) and does not gather GAID. Declare **no** Advertising ID in Data safety.
8. **[verify]** Confirm a customer can report an inappropriate technician review (UGC policy).
9. **[design]** Produce icon 512, feature graphic 1024×500, and 8 screenshots × 2 locales.
10. **[build]** Rebuild the AAB at versionCode 13 with all of the above, then fill the Console using this document.
11. **[ops]** Recruit 12 closed testers if the developer account is personal.
