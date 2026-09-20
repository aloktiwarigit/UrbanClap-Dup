# Play Console Listing Pack — Technician App

**App:** HomeHeroo Technician (partner-facing)
**Package:** `in.homeheroo.technician`
**Current bundle:** `0.1.12` / versionCode 13 (`artifacts/technician-app-0.1.12-vc13-release.aab`, built 2026-08-10)
**Prepared:** 2026-08-30
**Scope:** every Play Console field for the technician app, with the exact value to enter and the code evidence behind it. Companion to `docs/play-store-listing-customer.md` §11 (which sketched these deltas before this pack existed).

> Every claim here was verified against the repository on 2026-08-30. Where a field depends on
> a decision only the owner can make, it is marked **[DECIDE]**. Where a value cannot be entered
> until a code or infra change lands, it is marked **[BLOCKED]**.

---

## 0. Blockers — resolve before you submit

### 0.1 [BLOCKED] Target API level 36 — deadline is today (2026-08-30)

`technician-app/app/build.gradle.kts` still ships `compileSdk = 35` / `targetSdk = 35`, identical to
the customer app's unresolved item in §0.1 of that pack. Both apps share this blocker and should be
bumped together in one story (shared Compose edge-to-edge / predictive-back pass, one round of
Paparazzi re-recording, one Codex pass) rather than twice. **This is now overdue, not upcoming** —
treat it as the top priority ahead of anything else in this document.

### 0.2 [BLOCKED — functional bug, not just a listing gap] Full-screen job-offer alert will silently degrade on Android 14+

`HomeservicesFcmService.kt:328` calls `.setFullScreenIntent(fullScreenPi, true)` to pop
`JobOfferFullScreenActivity` (the `showWhenLocked` + `turnScreenOn` activity that shows an incoming
job to the technician). The manifest does **not** declare
`android.permission.USE_FULL_SCREEN_INTENT`.

Since Android 14 (API 34), a full-screen intent from an app that isn't a phone/alarm-category app
needs this permission declared and granted, or the system silently downgrades it to a normal
heads-up notification — the technician gets a quiet notification instead of the urgent full-screen
job-offer alert the whole flow is designed around. At `targetSdk 35` this is not a hypothetical: it
is the app's core "new job" interaction breaking on any Android 14+ device, review or production.

**Fix:** add `<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />` to the
manifest. Play Console will then surface a **"Use full screen intent"** declaration form on
submission — fill it citing the job-dispatch alert use case. Verify on a real Android 14+ device
(not just an emulator) that the full-screen activity actually appears before you submit.

### 0.3 [BLOCKED or DECIDE] `ACCESS_BACKGROUND_LOCATION` is declared but never requested at runtime

The manifest declares `ACCESS_BACKGROUND_LOCATION` and two `foregroundServiceType="location"`
services (`ActiveJobForegroundService`, `LocationForegroundService`). But a full repo search of
`app/src/main/kotlin` for `ACCESS_BACKGROUND_LOCATION` finds it **only in the manifest** — no
Kotlin call site ever requests this permission from the user (only `ACCESS_FINE_LOCATION` /
`ACCESS_COARSE_LOCATION` are requested, in `ServiceSelectionScreen.kt`). The location-sharing
notification text (`active_job_location_notification_body`: *"Only during active booking"*)
describes foreground-only tracking, which needs only the foreground permission plus the
`FOREGROUND_SERVICE_LOCATION` type you already declare — it does **not** need background location.

Two ways to close this, pick one:

1. **[Recommended] Remove `ACCESS_BACKGROUND_LOCATION` from the manifest.** If live tracking only
   ever runs while a job is active and the app is expected to be in use, you don't need it, and
   removing it means you skip Play's Background Location Access declaration form and the
   screen-recorded demo video entirely — both are slow (weeks) and this permission is currently
   dead weight that only adds review risk.
2. **If background tracking is an intentional future feature** (e.g. technician availability/ETA
   updates while the app is backgrounded, not just during an active job), implement the proper
   runtime request flow (in-app prominent disclosure screen → system "Allow all the time" dialog),
   then fill Play's Background Location form with a demo video showing that disclosure. Budget
   weeks for this review, not days.

Don't leave it declared-but-unused — that is the worst of both options.

### 0.4 Play Billing — does not apply, confirmed

No `com.android.billingclient` dependency in `technician-app/app/build.gradle.kts`, consistent with
the customer app's AAB metadata check in the customer pack §0.2. Technicians are paid via wallet
payout / Razorpay linked account (`technicians.razorpayLinkedAccountId`, admin/API-side), not through
Play Billing, and are independent contractors performing real-world services — out of Play Billing's
scope either way.

### 0.5 App name and privacy/deletion URLs — already correct, no action needed

Unlike the customer app (which had the `app_name`/URL bugs fixed in PR #314), the technician app
already ships clean:

```
values/strings.xml:3     <string name="app_name">HomeHeroo Technician</string>
values-hi/strings.xml:3  <string name="app_name">HomeHeroo तकनीशियन</string>
values/strings.xml:218   <string name="privacy_policy_url">https://aloktiwarigit.github.io/homeheroo-privacy/technician/</string>
values/strings.xml:94    <string name="deletion_request_url">https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/</string>
```

Both URLs verified live and returning HTTP 200 on 2026-08-30. One thing to eyeball before
submitting: the deletion-request page is shared with the customer app — confirm its copy covers
technician-specific retained data (masked Aadhaar, PAN, wallet ledger — see §8 below), not just
customer-shaped data.

---

## 1. Main store listing

### 1.1 App name — 30 characters max

**`HomeHeroo Technician`** (21 chars) — already the shipped launcher name, use it verbatim so
Console and in-app branding match exactly (this is the mismatch that tripped up the customer app).

### 1.2 Short description — 80 characters max

**Recommended (78):**

```
Get verified home-repair jobs near you. Fixed pay, fast payouts, your hours.
```

Alternative, keyword-forward:

```
Find AC, plumbing, electrical & RO repair jobs in Ayodhya. Get paid fast.   (75)
```

**Hindi (`hi-IN`):**

```
अपने पास वेरिफाइड होम-रिपेयर जॉब्स पाएं। तय भुगतान, तेज़ पेआउट, अपने समय पर।
```

### 1.3 Full description — 4000 characters max

Verified against shipped code only. **Do not** describe features not yet in the app — no insurance,
no loyalty tiers, no guaranteed minimum jobs/week — the retrospective and story docs don't show
these as implemented.

**English (~1,850 characters):**

```
HomeHeroo Technician connects verified home-repair professionals in Ayodhya with real jobs — fixed pay, no bidding, no haggling.

GET JOB OFFERS THAT MATCH YOUR SKILLS
AC repair, plumbing, electrical, RO/water purifier and pump servicing jobs are offered based on your registered skills and location. Accept or decline — no penalty for declining a job that doesn't work for you.

SIMPLE VERIFICATION
Sign in with your phone number. Complete one-time KYC with your Aadhaar (via DigiLocker) and PAN — verified quickly so you can start accepting jobs.

KNOW THE JOB BEFORE YOU ACCEPT
See the service type, fixed price, customer address and time window before you accept. Once on the job, guide the customer through any add-on work and its price — nothing is charged without their approval.

TRACK YOUR EARNINGS
See your payouts, completed jobs and pending wallet balance in one place. Fixed-price jobs mean you always know what you're earning before you start.

BUILD YOUR REPUTATION
Customers rate you after every job. See your rating history and, if you believe a rating was unfair, file an appeal directly from the app.

STAY ON TOP OF ACTIVE JOBS
Get an alert the moment a new job is offered near you. Once you accept, the app guides you through each stage — arrival, work in progress, photo proof, completion.

SUPPORT WHEN YOU NEED IT
Raise a complaint about a job or a customer directly from the app, with photo evidence if needed. Partner support follows up.

HINDI AND ENGLISH
The whole app works in Hindi and English. Switch anytime from Settings.

YOUR DATA, YOUR CONTROL
Download a copy of everything we hold about you, or delete your account and KYC data permanently — all from inside the app.

HomeHeroo Technician is currently for verified partners in Ayodhya and nearby areas. This app is intended for onboarded service technicians, not general job-seekers browsing without an active partner agreement.
```

**Hindi (`hi-IN`):**

```
HomeHeroo Technician अयोध्या में वेरिफाइड होम-रिपेयर प्रोफेशनल्स को असली जॉब्स से जोड़ता है — तय भुगतान, कोई बोली नहीं, कोई मोल-भाव नहीं।

अपनी स्किल के हिसाब से जॉब ऑफर पाएं
आपकी रजिस्टर्ड स्किल और लोकेशन के आधार पर एसी रिपेयर, प्लंबिंग, इलेक्ट्रिकल, आरओ/वाटर प्यूरीफायर और पंप सर्विसिंग जॉब्स ऑफर होती हैं। एक्सेप्ट करें या मना करें — मना करने पर कोई पेनल्टी नहीं।

आसान वेरिफिकेशन
अपने फ़ोन नंबर से साइन इन करें। एक बार आधार (डिजिलॉकर के ज़रिए) और पैन से केवाईसी पूरा करें — जल्दी वेरिफाई होकर जॉब्स लेना शुरू करें।

एक्सेप्ट करने से पहले जॉब की पूरी जानकारी
एक्सेप्ट करने से पहले सर्विस टाइप, तय दाम, ग्राहक का पता और समय देखें। जॉब पर पहुँचकर, किसी भी अतिरिक्त काम और उसके दाम के बारे में ग्राहक को बताएं — उनकी मंज़ूरी के बिना कोई शुल्क नहीं।

अपनी कमाई ट्रैक करें
अपने पेआउट, पूरे किए गए काम और पेंडिंग वॉलेट बैलेंस एक ही जगह देखें।

अपनी प्रतिष्ठा बनाएं
हर काम के बाद ग्राहक आपको रेट करते हैं। अपनी रेटिंग हिस्ट्री देखें और अगर कोई रेटिंग अनुचित लगे तो ऐप से सीधे अपील करें।

एक्टिव जॉब्स पर नज़र रखें
पास में नई जॉब ऑफर होते ही अलर्ट पाएं। एक्सेप्ट करने के बाद ऐप हर स्टेज में आपकी मदद करता है।

ज़रूरत पड़ने पर सपोर्ट
जॉब या ग्राहक की शिकायत सीधे ऐप से दर्ज करें। पार्टनर सपोर्ट उसे आगे बढ़ाएगा।

हिंदी और अंग्रेज़ी
पूरा ऐप हिंदी और अंग्रेज़ी दोनों में चलता है।

आपका डेटा, आपका नियंत्रण
अपना पूरा डेटा डाउनलोड करें, या अपना अकाउंट और केवाईसी डेटा हमेशा के लिए डिलीट करें — सब ऐप के अंदर से।
```

---

## 2. Graphics assets — already produced

Unlike the customer app (which still needs assets), the technician app's assets already exist in
`play-store-assets/technician/`:

| Asset | Status |
|---|---|
| App icon 512×512 | `technician-app-icon-512.png` ✓ |
| Feature graphic 1024×500 | `technician-feature-graphic-1024x500.png` ✓ |
| Screenshots (7) | `01-new-job-request.png`, `02-active-job-progress.png`, `03-payout-dashboard.png`, `04-ratings.png`, `05-pan-upload-review.png`, `06-partner-support.png`, `07-secure-sign-in.png` ✓ |

**Before uploading:** open each screenshot and confirm it reflects the *current* UI — several of
these predate the D1/D2 design-system refactor (tokens/typography/elevation pass) from the
2026-07-21 week and may show the old visual language. If any look stale, re-capture rather than
ship a listing that looks worse than the live app.

**Missing vs. the customer pack's storyboard:** no Hindi-locale screenshot set. Consider adding one
`hi-IN` screenshot (e.g. the Hindi job-offer screen) since bilingual support is a real differentiator
for Ayodhya-based technicians, same reasoning as the customer pack §2.

---

## 3. Store settings

| Field | Value |
|---|---|
| App or game | **App** |
| Category | **Business** (this is a work/job app for partners, not a household consumer app — different from the customer app's House & Home) |
| Tags | Jobs, Business, Productivity, Local Services (pick up to 5 from Play's fixed list) |
| Email address | `support@homeheroo.in` (or a dedicated `partners@homeheroo.in` if you want to route technician mail separately) |
| Phone | **[DECIDE]** |
| Website | **[DECIDE]** |

---

## 4. App access — the same top rejection risk, harder to satisfy here

The customer app's reviewer test account just needs a phone number that logs in. This app also
gates behind **KYC approval** (`KycOrchestrator`, `DigiLockerConsentUseCase`, `PanOcrUseCase`) before
a technician can see job offers — a reviewer who logs in but sits in "KYC pending" will hit a dead
end, same failure mode the customer pack warns about but one layer deeper.

**Select:** *All or some functionality is restricted*

**Recommended setup before submitting:**

1. Configure a Firebase test phone number (same mechanism as the customer app — Firebase Console →
   Authentication → Phone → *Phone numbers for testing*).
2. **Pre-approve that test technician's KYC status directly in Cosmos** (mark Aadhaar/PAN as
   verified for that one seeded account) so a reviewer logging in lands straight in the working app
   instead of stuck at DigiLocker/PAN upload — Play reviewers cannot complete a real DigiLocker
   consent flow or PAN OCR check.
3. **Seed at least one open job offer** dispatched to that test technician's account/location so the
   reviewer sees the core "accept a job" flow without waiting for real dispatch.

Instruction set to enter:

```
Name: Technician login (phone OTP)
Username: +91 98765 43210
Password: 123456
Any other instructions:
  1. Launch the app and sign in with the phone number and code above.
  2. This test account's KYC (Aadhaar/PAN) is pre-verified — no DigiLocker
     or document upload is required to proceed.
  3. An open job offer has been seeded for this account. It will appear
     as a full-screen alert; accept it to see the active-job flow.
```

**Verified 2026-08-30:** `+91 98765 43210` already exists as a Firebase Auth user
(uid `UotUlLV3AqUtq3CL4v7NhZ4N7yU2`, last login 2026-08-11) in `homeservices-prod-001` — the
single Firebase project both `in.homeheroo.customer` and `in.homeheroo.technician` share. It's the
same test number the customer pack's action item 5 configured with the fixed OTP `123456` in
Identity Platform's phone-testing config, and since test numbers are configured at the *project*
level, not per-app, it works for technician sign-in too — no new Firebase config needed.

**Still open, and not something I can verify or fix from here:** whether this uid has a
`technicians/{uid}` document in Cosmos DB, and if so whether its KYC status is `verified`. Firebase
Auth only proves the phone number can log in — the technician-side profile/KYC record lives in
Cosmos DB, which isn't reachable from this session. **Before you submit, check directly:**
- If no `technicians/{UotUlLV3AqUtq3CL4v7NhZ4N7yU2}` doc exists yet, the reviewer will sign in and
  land in onboarding/KYC with nothing to test — you need to create it with KYC pre-marked verified.
- If it exists but KYC isn't verified, update that one field for this account only.
- Then seed one open job offer dispatched to this technician (§4 step 3) so there's something to
  accept.

**Same integrity caveat as the customer app applies here too** — confirm `PLAY_INTEGRITY_STRICT` on
`func-homeservices-prod` (per the customer pack §4, currently unset → not enforced) doesn't block a
reviewer's device from confirming job status transitions.

---

## 5. Ads

**Select: No, my app does not contain ads.** No ad SDK in the dependency list.

---

## 6. Content rating (IARC questionnaire)

| Question | Answer | Why |
|---|---|---|
| Category | **Utility, Productivity, Communication or Other** | Work/dispatch tool, not a game or social app |
| Violence / fear, sexuality, language, controlled substances, gambling | No | — |
| **Does the app share the user's current location with other users?** | **Yes** | Technician location is shown live to the customer during an active booking (`LocationForegroundService`, tracking map) |
| **Does the app allow users to interact or communicate with each other?** | **No** | No technician-to-technician or technician-to-customer chat; "support" routes to the owner, not another user |
| **Does the app allow users to share user-generated content with other users?** | **No** — different from the customer app | `MyRatingsScreen` shows a technician *their own* ratings/comments from customers, scoped privately to that technician's account. There is no surface where one technician's content (ratings, profile, complaints) is shown to another technician or to the public. Confirm this stays true before answering — if a public technician-directory or leaderboard feature ever ships, this answer changes. |
| Digital purchases | No | Real-world labour paid via wallet/Razorpay payout, not Play purchases |
| Personal information shared with third parties | Yes | See Data safety below |

**Expected outcome:** 3+ / Everyone, same as the customer app — the location-sharing descriptor
applies but doesn't raise the age band for a utility/business app.

---

## 7. Target audience and content

| Field | Value |
|---|---|
| Target age groups | **18 and over — only.** Technicians must be legal working adults; KYC (Aadhaar/PAN) already implies this. |
| Appeals to children | **No** |

---

## 8. Data safety

Derived from code plus `docs/dpdp-data-inventory.md` (technician-specific rows verified around
lines 51–66 of that file).

### 8.1 Overall answers

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all user data encrypted in transit? | **Yes** — `usesCleartextTraffic="false"`, HTTPS only |
| Do you provide a way for users to request data deletion? | **Yes** — in-app (`ui/deleteaccount/DeleteAccountScreen.kt`) + web URL (§0.5) |
| Independently reviewed against a security standard? | **No** |

### 8.2 Data types

| Play data type | Collected | Shared | Required? | Purposes | Evidence |
|---|---|---|---|---|---|
| **Personal info → Name** | Yes | Yes | Required | Account mgmt, App functionality | `technicians.displayName`, shown to customers on the booking/tracking screen |
| **Personal info → Phone number** | Yes | Yes | Required | Account mgmt, App functionality | Firebase Phone Auth + Truecaller SDK (`queries` block for `com.truecaller`); shared with customer as job contact |
| **Personal info → Government IDs** | **Yes** | No | Required | Account verification (KYC compliance) | `technicians.kyc.aadhaarMaskedNumber` (masked, via DigiLocker), `technicians.kyc.panNumber` + `panImagePath` (`PanOcrUseCase`). Not shared outside HomeHeroo — auditor/compliance use only. **This row did not exist in the customer pack — treat it as its own line item, Play scrutinizes government-ID collection closely.** |
| **Location → Approximate location** | Yes | Yes | Required | App functionality | Dispatch matching to nearby jobs |
| **Location → Precise location** | Yes | Yes | Required | App functionality | `ACCESS_FINE_LOCATION`, live tracking shown to customer during active job (see §0.3 re: background location) |
| **Financial info → Purchase history** | Yes | No | Required | App functionality | Earnings/payout history, wallet ledger |
| **Financial info → Other financial info** | Yes | No | Required | Payouts | `razorpayLinkedAccountId` — payout routing, not exported to the technician themselves per the data inventory (sensitive) |
| **Photos and videos → Photos** | Yes | No | Optional | App functionality | Active-job proof photos (`PhotoCaptureScreen`, `CAMERA` permission), PAN document photo |
| **App activity → App interactions** | Yes | No | Analytics | PostHog (`PostHogInitializer`, screen-view capture explicitly disabled, lifecycle events on) |
| **App info and performance → Crash logs** | Yes | No | Analytics, App functionality | **Both** Sentry and Firebase Crashlytics are present (`crashlytics` plugin + `firebase-crashlytics-ktx`) — unlike the customer app, which has Sentry only |
| **App info and performance → Diagnostics** | Yes | No | Analytics | Sentry performance |
| **Device or other IDs** | Yes | No | Required | App functionality, Analytics | FCM token (job-offer push), PostHog distinct ID |

**Explicitly NOT collected:** Contacts, Calendar, SMS/Messages, Health & fitness, Files & docs,
Music, Web browsing history, Installed apps, Search history, Race/ethnicity, Political/religious
beliefs, Sexual orientation, Payment card info (payout is bank/UPI-linked via Razorpay, the app
itself doesn't collect card numbers).

### 8.3 Deletion-request URL

Enter the shared `https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/` from §0.5 —
verify its copy explicitly covers KYC document deletion (Aadhaar/PAN), not just profile data, since
that's the technician-specific sensitive category.

---

## 9. Other App content declarations

| Declaration | Answer |
|---|---|
| **Background location permission** | **[BLOCKED — see §0.3.]** Fill this form only if you keep the permission and implement the disclosure flow; otherwise remove the permission and skip the form entirely. |
| **Full-screen intent permission** | **[BLOCKED — see §0.2.]** Add the manifest permission first, then fill this form describing the job-dispatch alert use case. |
| **Camera permission** | `CAMERA` is used for active-job photo proof and PAN document capture — no separate Play declaration form exists for camera, but make sure the Data safety photos row (§8.2) is accurate. |
| **News app / COVID-19 tracing / Government app** | No |
| **Financial features** | None of Play's listed categories (lending, banking, crypto, investment, insurance, debt mgmt, tax, betting) apply — this is a gig-work payout, not a financial product. |
| **Health apps** | No |
| **Advertising ID** | Declare **not used** — no `play-services-ads-identifier` dependency, PostHog config sets no ad-ID capture. Verify this the same way the customer pack did (§9 there) before answering. |

---

## 10. Countries, tracks and distribution model

| Item | Value |
|---|---|
| Countries | **India only**, matching the Ayodhya pilot |
| Pricing | Free app, no in-app purchases |
| **Distribution track** | **[DECIDE, and worth revisiting]** This app is only useful to onboarded HomeHeroo technicians who have a partner agreement and completed KYC — an open Play Store production listing invites installs from the general public who will hit a dead end at KYC (or a rejected/never-verified account). Consider a **closed testing track** (invite-only, e.g. via a Google Group of onboarded technician emails) instead of open production. This also sidesteps the "12 testers / 14 days" personal-developer-account gate from the customer pack §10, since closed testing doesn't require that path — only *production* access does. |

If you do want production distribution (e.g. so technicians can find and self-apply via Play
Store search), that's a legitimate model too — just make sure the onboarding funnel outside the app
(how someone becomes a "partner" before they even open it) is ready for that, since right now KYC
gates *inside* the app with no visible path for a rejected/unverified applicant.

---

## 11. Ordered action list

1. **[code, urgent]** Bump `compileSdk`/`targetSdk` to 36 for both apps in one shared story — deadline was 2026-08-30 (today).
2. **[code]** Add `USE_FULL_SCREEN_INTENT` permission; verify job-offer full-screen alert actually fires on a real Android 14+ device.
3. **[code/decide]** Resolve `ACCESS_BACKGROUND_LOCATION` — remove it (recommended) or implement the disclosure flow + demo video.
4. **[infra]** Seed a KYC-pre-approved test technician account with an open job offer, for reviewer access.
5. **[verify]** Confirm `PLAY_INTEGRITY_STRICT` doesn't block a reviewer device (should already be clear per customer pack §4 — same backend).
6. **[verify]** Open each of the 7 existing screenshots and confirm they match the post-D1/D2 design system; re-capture any that look stale.
7. **[design]** Add one Hindi-locale screenshot to the existing set.
8. **[decide]** Confirm distribution track — closed (recommended) vs. open production (§10).
9. **[content]** Confirm the shared deletion-request page's copy covers Aadhaar/PAN deletion explicitly.
10. **[build]** Rebuild the AAB once items 1–3 land, then fill the Console using this document.
