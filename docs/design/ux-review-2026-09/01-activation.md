# 01 — Activation: first run, language, consent, auth

Reviewer lane: the first 90 seconds of Riya's life with the app. Baseline `main` @ `6a79f198`, working tree as-is, 2026-09-26.

## Evidence status (read first)

| Source | State | Consequence |
|---|---|---|
| `artifacts/uiux-2026/screens/customer-app/*.png` (9 files) | **Corrupt.** Every file begins `FF FE FD FF 50 00 4E 00` — a PNG re-encoded as UTF-16 text, in the tree since `b925e083` (2026-07-27). The Read tool rejects them. | No emulator pixels for consent or language picker. I used the sibling uiautomator `*.xml` dumps for text, bounds, and clickability instead. Note the dumps are mislabelled: `dpdp-consent-*.xml` contain the language picker, `first-launch-emulator-window.xml` and `language-picker-*.xml` contain the consent screen. |
| Paparazzi goldens `*auth_*`, `*locale_*` | Present but **stale and partial.** Recorded 2026-05-03 on the pre-D1 dark-green palette; both test classes are `@Ignore`d (`AuthScreenPaparazziTest.kt:89`, `FirstLaunchLanguageScreenPaparazziTest.kt:25`). Only 5 auth goldens exist on disk (idle, otpSending, otpVerifying, truecallerLoading ×2) although the test declares 12 states. The locale golden renders a **test-only static layout** (`StaticFirstLaunchLayout`, test file :53-79), not `FirstLaunchLanguageScreen`. No consent golden exists on disk. | Zero current pixel evidence for method selection, phone entry, OTP entry, error state, consent, or the real language picker. Everything below on those screens is from source + XML dumps. Judgements that need an emulator are marked **[needs emulator]**. |

What the goldens do show (opened with Read): four cream `#FBF6E9`-ish canvases, each empty except a 4-px dark-green dot (the `CircularProgressIndicator` frozen at frame 0) and two lines of centred text ("Checking Truecaller / We are verifying your number before falling back to OTP.", "Sending OTP / Keep this screen open…", "Verifying code / This usually takes a few seconds."). Dark variant: near-black canvas, teal dot. No logo, no hero, no brand colour anywhere in the frame. The two locale goldens show a bilingual headline, two pale-green option cards with radio buttons, and a bilingual "Continue / जारी रखें" pill — none of which matches current source (see F-06).

## Cold install → home: the actual sequence

Traced from `AppNavigation.kt:93-101, 137-149, 181-201`, `AuthGraph.kt:26-28`, `AuthViewModel.kt:45-63`, `AppNavigation.kt:224-237`.

| # | What Riya sees | Taps | Keys | Source |
|---|---|---|---|---|
| 0 | System window background (`Theme.AppCompat.DayNight.NoActionBar`, no `windowBackground`, no SplashScreen API) → blank cream `Surface` until two DataStore flows emit → possibly a second blank `Surface` while `authState` is `Initializing` | 0 | 0 | `themes.xml:3-6`, `MainActivity.kt:84-118`, `AppNavigation.kt:99,138` |
| 1 | DPDP consent: dark hero, leaf icon, 3 toggles (2 pre-ON), "Agree and continue" / "Reject all" | 1 | 0 | `AppNavigation.kt:145` |
| 2 | Language picker: marigold hero "HomeHeroo / भाषा चुनें", English body copy, Hindi pre-selected, "Continue" | 1 | 0 | `AppNavigation.kt:146` |
| 3 | Auth: one frame of "Checking Truecaller" spinner (`Idle`), then either the Truecaller sheet or method selection: **Google → Email → Phone** | 1 | 0 | `AuthScreen.kt:98-109, 290-323` |
| 4 | Phone entry: `OutlinedTextField`, placeholder `+91 98765 43210`, "Get OTP" | 2 | 10 | `AuthScreen.kt:517-560` |
| 5 | "Sending OTP" bare spinner → OTP entry: single text field, "Verify and continue", "Resend code" | 2 | 6 | `AuthScreen.kt:563-595` |
| 6 | "Verifying code" bare spinner → home, and immediately the Android 13+ `POST_NOTIFICATIONS` system dialog | 1 | 0 | `AppNavigation.kt:233-237` |
| **Total (no Truecaller, best case)** | 7 screens, 3 of them spinners | **8** | **16** | |

Truecaller path (if the Partner clientId is configured in prod, which this review could not verify): consent 1 + language 1 + Truecaller sheet 1 + notifications 1 = 4 taps. Firebase SMS auto-retrieval is wired (`FirebasePhoneOtpSender.kt:39-58`, channel stays open after `onCodeSent`), so on a Play-Services device with the SMS hash configured the 6 keystrokes may vanish — but the UI gives no sign that it is listening.

Removable without losing anything: method-selection screen (−1 tap: phone-first with "other ways to sign in" link), consent as a separate pre-brand gate (−1 tap: fold into the auth hero or move after auth), typed phone number (−1 tap −10 keys: Google Identity `GetPhoneNumberHintIntent`, free), "Verify and continue" (−1 tap: auto-submit at 6 digits), notification prompt at sign-in (−1 tap now, ask at first booking). Reachable floor: **3 taps, 0–6 keys, 3 screens.** Urban Company's cold start is 2–3 taps; Zomato's is 2.

Answers to the lane's questions, in one line each:
- Premium brand or permissions form? **Permissions form.** The first two screens are a consent gate and a settings screen; the brand name appears as plain text in a gradient block; the value proposition is one unverified line ("Trusted service · 30-day guarantee").
- Consent a trust moment or a wall of text? Neither — it is short, but it is a **pre-ticked opt-out form shown before the app has earned anything**, with a broken legal sentence.
- OTP best-in-class? **No.** Single plain field, `NumberPassword` keyboard, no cells, no autofill hint, no resend timer, no auto-submit, and a wrong code throws you back to phone entry.
- Value-prop onboarding? **None.** ux-design §7.1 specified 3 onboarding screens and §8.1 a 1-s splash; neither exists.
- Language persists and changeable in ≤2 taps? Persists (DataStore, `SetAppLocaleUseCase.kt:12-17`). Change is **3 taps + Save** from home (settings icon → Language → option → Save) or 3 via the profile row; not ≤2.

## A. Design specificity

| Screen | Could another product ship it unchanged? | Why |
|---|---|---|
| Cold-start frame | Yes — it is the platform default | No asset, no colour, no motion. |
| DPDP consent | Yes | Generic "Your privacy, your choice" + three toggles + leaf icon (`Icons.Default.Eco`, `DpdpConsentScreen.kt:258`). Nothing says home services, Ayodhya, or technicians. The dark brown→black hero (`:176-177`) contradicts the airy light-first direction. |
| Language picker | Mostly | Marigold hero with the wordmark is the only brand cue; the card below is a stock radio list. |
| Auth method selection | Yes | Three outlined buttons + two footnotes. The Google mark is a typed "G" (`AuthScreen.kt:351-357`). |
| Phone / OTP entry | Yes | Stock `OutlinedTextField`s. |
| Loading states | Yes | Centred `CircularProgressIndicator` + two lines (`:598-628`). |

## B. Top-tier gap

**Reference: Urban Company login (2026) and Zomato phone login; for OTP craft, PhonePe / Cred.**

What they do that this flow does not:

1. **Brand arrives before any ask.** UC opens on a full-bleed service photograph with the wordmark and a single phone field; the first tap is the phone number. Here the first tap is a data-consent decision and the brand is a `Text("HomeHeroo")` on a gradient (`FirstLaunchLanguageScreen.kt:67`, `AuthScreen.kt:211`).
2. **Phone is the only visible method.** UC/Zomato: phone field + country pill, "Continue", and a small "other ways" row (Google as an icon). Here phone is the **third** button under Google and email (`AuthScreen.kt:291-322`), on a product whose own ADR-0005 rejects email/password for customers and whose PRD FR-1.1 orders Truecaller → OTP → Google.
3. **The number is one tap.** Both call the phone-number hint picker; the SIM number appears as a chip. Here Riya types 10 digits into a field whose placeholder suggests she must also type `+91`.
4. **OTP is a stage, not a form.** Six cells, cursor advancing, "Auto-reading SMS…" shimmer, a 30-s countdown before "Resend", auto-submit on the sixth digit, and a wrong code shakes the cells red and clears them **in place**. Here: one field, "Verify and continue", resend always live, and a wrong code navigates to a full-screen "We could not sign you in" whose only exit returns to the **phone number** screen (`AuthViewModel.kt:299-309`).
5. **Loading keeps the shell.** UC dims the sheet and animates the button; the hero never leaves. Here five of the eleven states replace the entire screen with a bare spinner on blank canvas (`AuthScreen.kt:98-102, 111-115, 127-136, 161-171`).
6. **Trust is shown, not claimed.** UC's login footer carries "Verified professionals · Insured service" with icons and links. Here the hero states "30-day guarantee" (`strings.xml:582`) which the PRD does not define (PRD names a **7-day** fix warranty, `docs/prd.md:74, 259`).
7. **Consent is contextual.** Apple ATT / Revolut ask for analytics permission after value is visible, one purpose per card, default OFF, with a one-line "why". Here consent is screen 1, analytics and crash default ON (`ConsentUiState.kt:4-6`), and "Reject all" is a muted text button under a 56-dp filled CTA.
8. **Motion.** Sheet slides up over the hero (`base` 200 ms), OTP cells fill with a tick, success crossfades to home. Here every transition is a `NavHost` instant cut; the only animation in the lane is the M3 spinner.

## C. Heuristics (0–4; `n/a` allowed)

| Heuristic | Consent | Language | Method | Phone | OTP | Error | Loading |
|---|---|---|---|---|---|---|---|
| 1 Visibility of status | 2 | 3 | 3 | 3 | 1 | 2 | 2 |
| 2 Real-world match | 2 | 2 | 1 | 2 | 2 | 2 | 1 |
| 3 Control & freedom | 3 | 3 | 3 | 1 | 1 | 1 | 1 |
| 4 Consistency | 2 | 2 | 3 | 3 | 3 | 3 | 1 |
| 5 Error prevention | 2 | 3 | 3 | 3 | 1 | n/a | n/a |
| 6 Recognition > recall | 3 | 3 | 3 | 3 | 3 | 1 | 3 |
| 7 Flexibility | n/a | 3 | 2 | 1 | 1 | n/a | n/a |
| 8 Aesthetic / minimal | 2 | 3 | 2 | 3 | 3 | 3 | 1 |
| 9 Error recovery | 0 | n/a | n/a | 3 | 1 | 1 | n/a |
| 10 Help | 2 | 2 | 1 | 2 | 2 | 1 | n/a |
| **Total / max** | 18/36 (50%) | 24/32 (75%) | 21/32 (66%) | 24/40 (60%) | 18/40 (45%) | 14/28 (50%) | 9/20 (45%) |

Evidence for every score < 3:

- Consent H1 2: `isLoading` swaps the CTA label for a spinner but success gives no confirmation; the screen just vanishes. H2 2: "Improve app quality / We learn how the app is used" is a euphemism, not the real-world fact ("we send usage events to PostHog"). H4 2: raw M3 `Button` and `Switch` instead of `HsPrimaryButton` (`DpdpConsentScreen.kt:392, 494`); the sole activation screen not on the shared button. H5 2: pre-ticked toggles make the wrong default the easy one. H8 2: dark hero + glow circles + three coloured icon tiles on a screen that asks three yes/no questions. H9 **0**: `ConsentViewModel.kt:82,103` set `error`; `DpdpConsentScreenContent` never reads it — a failed save re-enables the button and says nothing. H10 2: only the Privacy Policy link, and its sentence is broken (F-05).
- Language H2 2: headline and subtitle English, CTA English, while Hindi is pre-selected (`FirstLaunchLanguageScreen.kt:105-116`). H4 2: the same picker in Settings uses different copy, a "Settings" badge and "Save" instead of "Continue". H10 2: "Language can be changed anytime from Settings." is the only help, in English only.
- Method H2 **1**: order Google → email → phone; "Email sign-up requires verification before booking access" is developer language shown to every user (`AuthScreen.kt:325-331`). H7 2: no phone hint, no remembered method. H8 2: two footnotes + security note + terms note = four lines of grey small print under three buttons. H10 1: "Terms of Service and Privacy Policy" in `auth_terms_note` are plain text, not links (`strings.xml:164`, `AuthScreen.kt:332-338`).
- Phone H3 **1**: no back to method selection (compare `EmailEntryContent`, `:410-412`, which has one). H7 1: no phone-number hint, no SIM read. H10 2: `auth_mobile_note` explains why, not format.
- OTP H1 **1**: no countdown, no "auto-reading SMS", no indication that Firebase auto-retrieval is even active. H3 1: no back, no "change number". H5 1: resend unthrottled (`AuthViewModel.kt:294-297`) → the rate-limit path is one impatient thumb away. H7 1: no autofill semantics, `KeyboardType.NumberPassword` (`AuthScreen.kt:580`) suppresses IME suggestions. H9 1: see F-01.
- Error H3 **1** / H6 1 / H9 1 / H10 1: single "Try again" (`AuthScreen.kt:656-660`), no back, no context of which step failed, body text hardcoded English (`AuthViewModel.kt:354-364, 377, 383…`), title "We could not sign you in" for a one-digit typo.
- Loading H2 1: "Checking Truecaller" shown for the `Idle` frame on every device, including ones without Truecaller (`AuthScreen.kt:98-102`); "Truecaller" is jargon in Hindi (`values-hi:112`). H3 1: `TruecallerLoading` has no timeout and no cancel (`AuthViewModel.kt:49-57`) — if the SDK never calls back the user has no exit. H4 1 / H8 1: shell disappears, spinner floats on blank canvas.

## D. Cognitive load and emotional journey

Checklist (8 items) failures per screen: Consent **4** (single focus, one thing at a time, minimal choices — 3 toggles + 2 CTAs + link = 6 interactive targets on install, progressive disclosure) → high load, and it is the first screen. Method selection **2** (visual hierarchy: three equal outlined buttons, no primary; noise: four footnote lines). Phone **1**. OTP **1**. Error **2** (working memory: the user must remember whether they were at phone or OTP; the screen does not say; the "attempts remaining" counter counts down across an action that forces a new SMS anyway, so the number is meaningless).

Emotional journey against ux-design §3 "First open: curiosity + warmth, not overwhelm":

- **0–5 s** — blank frame(s). No brand, no warmth. Compared with §8.1 row 1 ("Splash — logo + subtle animation, 1 s") this is a regression against the spec, not just the market.
- **5–20 s** — asked to decide about data collection. Nothing has been shown that is worth trusting yet. Riya's #1 anxiety (a stranger in the home) is not addressed anywhere in the activation flow; "Trusted service" is asserted, never evidenced (no Aadhaar/police-verified cue, no photo of a technician, no fixed-price promise).
- **20–40 s** — sign-in offered as Google or email first. A rural Hindi-first customer reading "Continue with Google" above "फोन से जारी रखें" is being told this app was built for someone else.
- **OTP failure** — the highest-stakes moment in the lane. A typo produces a full-screen failure with a headline meant for account lockout, and the way out re-sends an SMS (₹0.40 each) and demands the number again. This is where the pilot loses its least-confident users.
- **First success** — cut straight to home with a system permission dialog on top. No "नमस्ते Riya", no arrival.

## E. Hindi and field conditions

- **Devanagari fit.** Good news: all 15 M3 slots now map to `HomeservicesFontFamily` with explicit line heights (`Typography.kt:160-200`), so July's `LanguagePickerCard.kt` Roboto/Noto fallthrough is resolved (`LanguagePickerCard.kt:70` still uses `titleMedium`, but the slot is mapped). Risk remains where the ramp is overridden: `DpdpConsentScreen.kt:271` forces `fontSize = 26.sp` onto `headlineSmall` (20/28) — a 26-sp Devanagari headline on a 28-sp line height leaves ~2 sp for matras; "गोपनीयता आपकी, चुनाव आपका" is exactly the kind of string that clips **[needs emulator]**. The hi dump shows it fitting one line at 720 px (`[69,274][651,334]`, 60 px tall) at default scale only.
- **Hindi copy quality.** Auth strings are solid ("सुरक्षित साइन इन। बुकिंग और पेमेंट के लिए हमेशा आपकी पुष्टि जरूरी है।"). But: the language picker's body copy and CTA are English literals (`FirstLaunchLanguageScreen.kt:105, 110, 116`), the Settings language screen shows a hardcoded English "Settings" badge (`LanguageSettingsScreen.kt:49`), the brand eyebrow is "होमसर्विसेज" while the hero says "HomeHeroo" (`values-hi:124` vs `AuthScreen.kt:211`), and every auth error body is English (`AuthViewModel.kt:76-410`), so the Hindi error screen reads Hindi eyebrow + Hindi title + English body + Hindi button. The consent legal line renders "जारी रखकर आप हमारीगोपनीयता नीतिसे सहमत हैं" — three words fused (F-05).
- **Mixed-script money.** None in this lane.
- **Font scale 1.3+.** The 200 % dump of the language picker shows "Continue" still fitting its 56-dp pill (`[262,1470][458,1535]`) and the hero title wrapping cleanly; the option cards grow (English row 184 px tall) and push nothing off-screen because the button is anchored by `weight(1f)` (`FirstLaunchLanguageScreen.kt:115`). Consent at 200 % Hindi was not captured. Auth sheet at 1.3+ with IME open **[needs emulator]** — the sheet is a fixed 65 % of height (`AuthScreen.kt:244`) and the hero 38 % (`:188`), so on a 720×1600 device with the keyboard up the scrollable form area is roughly 1600×0.65 − IME(~700 px) ≈ 340 px for badge, title, body, field and button.
- **Sunlight / contrast.** Canvas/text pairs are the D1 tokens (9.27:1 muted, 16.9:1 strong). Weak spots: `HERO_SUBTITLE_ALPHA 0.70f` white on the consent gradient's lighter top (`#6F4818`) — ~5:1 at best, on 14 sp; `onPrimary.copy(alpha = 0.65f)` for the guarantee line on marigold (`AuthScreen.kt:220`) — ink at 65 % on `#E2A04A` is ~4.5:1 on an 11-sp `labelSmall`; under direct sun this line disappears (which, given F-11, may be for the best).
- **One-hand reach.** Consent and language CTAs are bottom-pinned (good). Auth CTAs live inside the sheet's scroll; on method selection the phone button is the lowest of three (reachable) but is visually the last choice.
- **Offline / slow network.** No offline state anywhere in the lane. OTP send failure → English "Failed to send OTP. Check your number and connection." on the full-screen error (`AuthViewModel.kt:275`); consent save failure → silent (F-12); Truecaller check → no timeout. Nothing says "retrying" or "we will keep your number".

## F. Findings

### [P0] A wrong OTP throws the user back to phone entry and forces a new SMS — NEW — confidence high
- **Where:** `AuthViewModel.kt:299-309` (`onRetry` sets `currentVerificationId = null` and returns `OtpEntry(phoneNumber = …)` with `verificationId = null`), `:372-380` (WrongCode → `AuthUiState.Error`), `AuthScreen.kt:146-159` (`verificationId == null` renders `PhoneEntryContent`), `:631-662` (`ErrorContent` offers only "Try again"). `AuthViewModelTest.kt:645-657` pins this behaviour under the name "returns to OTP entry".
- **What:** One mistyped digit navigates to a full-screen "We could not sign you in", and the only button returns to the phone-number form. The user must tap "Get OTP" again, receive a second SMS, and retype. The "N attempts remaining" counter (`MAX_OTP_RETRIES = 3`, `:33`) is displayed but semantically void because every "attempt" is a fresh verification.
- **Why it matters:** OTP typos are the most common auth failure for low-confidence typists; each one costs Riya ~40 s and the business ₹0.40, and three of them hit Firebase's per-number rate limit → "Too many attempts. Try again later." with `retriesLeft = 0` and, again, a "Try again" that leads to phone entry. This is the single most likely place the pilot loses a first-time customer.
- **Top-tier reference:** PhonePe / Cred / UC: wrong code shakes the six cells, clears them, keeps the verification session, shows "Incorrect OTP, 2 tries left" inline, and the resend timer keeps counting.
- **Fix:** Add `otpError: String?` to `AuthUiState.OtpEntry`; on `WrongCode` emit `OtpEntry(phone, verificationId, otpError = …, attemptsLeft)` instead of `Error`. Reserve `Error` for `RateLimited`, `CodeExpired` and `General`, and give `ErrorContent` a second action "Change number" and a third "Other ways to sign in". Keep `currentVerificationId` until `CodeExpired`.
- **Verification:** ViewModel test: `WrongCode` → state is `OtpEntry` with same `verificationId` and `otpError != null`; Paparazzi golden `otpEntry_wrongCode_hi`; emulator: enter wrong code, confirm the field is still on screen and no second SMS is requested.

### [P1] Sign-in methods are ordered Google → email → phone, inverting the product's own strategy — NEW — confidence high
- **Where:** `AuthScreen.kt:290-323`; `AuthViewModel.kt:59-61` (fallback lands on `MethodSelection`, not phone); strategy at `docs/adr/0005-…md:18-19, 49-50`, `docs/prd.md` FR-1.1.
- **What:** When Truecaller is unavailable the user sees three equal outlined buttons with Google first and phone last, plus two footnotes about email verification and terms. ADR-0005 defines phone OTP as the fallback and Google as an "alternative entry", and explicitly rejects passwords for customers; the PRD acceptance criterion is Truecaller → OTP → Google.
- **Why it matters:** Riya's mental model is "app asks for my number". Presenting Google and an email/password account first adds a decision she cannot evaluate and signals the app is not for her. It also adds one screen and one tap to every non-Truecaller activation.
- **Top-tier reference:** UC / Zomato / Swiggy: phone field on the first auth screen, Google as a small secondary row ("or continue with").
- **Fix:** Delete `MethodSelection` as a destination. `FallbackToOtp` → `OtpEntry(phone = "")` rendering the phone form with a phone-hint chip; place a single `TextButton` "साइन इन के और तरीके" under it that opens a bottom sheet with Google and email. Move `auth_email_verification_note` into the email flow only.
- **Verification:** ViewModel test: `FallbackToOtp` → `OtpEntry`; golden `phoneEntry_hi_light` shows the phone field above the fold with no Google/email buttons.

### [P1] No brand moment: the app opens on one or two blank frames — NEW — confidence high
- **Where:** `AppNavigation.kt:99` (blank `Surface` until both DataStore flows emit), `:138` (second blank `Surface` while `authState is Initializing`), `MainActivity.kt:84-118` (no `installSplashScreen()`), `themes.xml:3-6` (no `windowBackground`, no `windowSplashScreen*`), spec at `docs/ux-design.md` §8.1 row 1 and §7.1 item 1.
- **What:** Cold start shows the AppCompat default window colour, then a cream rectangle, then (returning users) a second cream rectangle, then the first screen — an instant cut each time. The spec called for a 1-s logo splash and a three-screen onboarding.
- **Why it matters:** Perceived speed and brand recall are set in the first second. A blank frame reads as "loading forever" on a Moto G-class device where DataStore + Firebase init can take 400–800 ms.
- **Top-tier reference:** Airbnb / UC: SplashScreen API icon on brand canvas, crossfade into the hero (~400 ms).
- **Fix:** Add `androidx.core:core-splashscreen`; `windowSplashScreenBackground = @color/canvas`, launcher icon foreground; `setKeepOnScreenCondition { firstLaunchPending == null || consentRequired == null }`; replace the two blank `Surface`s with the splash. Follow with an `AnimatedContent` crossfade (`Motion.slow`) into the first destination.
- **Verification:** Emulator cold start recording; no frame without brand canvas + icon between tap and first screen.

### [P1] Consent pre-ticks analytics and crash ON, subordinates "Reject all", and asks before showing any value — NEW — confidence high
- **Where:** `ConsentUiState.kt:4-6` (`analyticsOptIn = true, crashOptIn = true`), `DpdpConsentScreen.kt:392-423` (56-dp filled "Agree and continue"), `:426-436` (muted `TextButton` "Reject all"), `AppNavigation.kt:145` (consent is the very first destination). July's V3 item on the hardcoded `#5F6C66` reject colour is fixed (now `textMuted`); the pre-tick and hierarchy are new observations.
- **What:** The first screen after install asks Riya to make three data decisions with two of them already answered "yes", a filled primary button that ratifies the defaults, and a grey text button for the alternative. DPDP Act 2023 §6 requires consent to be "free, specific, informed, unconditional and unambiguous with a clear affirmative action"; a pre-ticked toggle is the canonical example of what that wording excludes.
- **Why it matters:** Trust is the product's wedge (PRD §"What makes this special"). Opening with a nudge pattern spends it. It is also a compliance exposure for a company whose privacy policy URL is hard-coded in this file (`:70`).
- **Top-tier reference:** Apple ATT / Revolut: asked after first value, one purpose per card, default OFF, equal-weight "Allow" / "Not now", one plain sentence of why.
- **Fix:** Defaults OFF for analytics and marketing (crash may stay ON only if counsel classifies it as legitimate-interest and it is labelled so). Two equal `HsSecondaryButton`s ("सभी स्वीकार करें" / "केवल ज़रूरी"). Move the gate to after auth, before first booking, with the technician-address-sharing promise (`profile_privacy_policy_body`) as the first card — that is the consent Riya actually cares about. Bump `CURRENT_CONSENT_VERSION`.
- **Verification:** `ConsentViewModelTest`: defaults are `false`; golden shows two equal CTAs; emulator: fresh install lands on brand/auth, consent appears after sign-in.

### [P1] Consent legal sentence renders with missing spaces in both languages — NEW — confidence high
- **Where:** `strings.xml:278-280` (`…agree to our </string>` — trailing space unquoted, so aapt trims it), `values-hi/strings.xml:245-247` (both leading and trailing spaces trimmed), `DpdpConsentScreen.kt:509-535` (concatenates prefix + link + suffix). Evidence: uiautomator dump text `By continuing, you agree to ourPrivacy Policy.` (`first-launch-emulator-window.xml`, bounds `[216,1537][864,1575]`) and `जारी रखकर आप हमारीगोपनीयता नीतिसे सहमत हैं` (`language-picker-emulator-enhi-light-720x1600.xml`).
- **What:** Android strips unquoted leading/trailing whitespace in string resources; the three-part annotated string fuses into one word at each seam.
- **Why it matters:** The one legally load-bearing sentence on the screen is visibly broken, in the user's own language, on the first screen. It reads as carelessness exactly where care is being claimed.
- **Top-tier reference:** Any — this is a defect, not a gap.
- **Fix:** Quote the strings (`"By continuing, you agree to our "`) or, better, use one string with a `%1$s` placeholder and `buildAnnotatedString` around the match, which also fixes Hindi word order.
- **Verification:** Golden `consentScreen_lightTheme_hi` shows spaces; unit test asserting `getString(R.string.dpdp_consent_legal_prefix).endsWith(" ")`.

### [P1] First-launch language screen is English-first with five hardcoded literals — CARRIED:V2-i18n-hindi (FirstLaunchLanguageScreen literals) — confidence high
- **Where:** `FirstLaunchLanguageScreen.kt:67` ("HomeHeroo"), `:69` ("भाषा चुनें"), `:105` ("Choose your language"), `:110` ("Language can be changed anytime from Settings."), `:116` ("Continue"); `FirstLaunchLanguageViewModel.kt:23` pre-selects "hi".
- **What:** Hindi is pre-selected per ADR-0018, yet the headline, helper text and CTA are English literals, so the screen argues with itself. The May golden's bilingual "Continue / जारी रखें" was a test-only layout, never the shipped screen. None of the five strings can be translated, tested for existence, or read by TalkBack in Hindi.
- **Why it matters:** ADR-0018's stated reason for the pivot is "a language-picker that itself is in English" creates drop-off. This is that picker.
- **Top-tier reference:** Google Pay India first run: bilingual headline ("Choose a language / भाषा चुनें"), each option in its own script, CTA rendered in the currently selected language.
- **Fix:** Move all five to resources; render headline bilingual; bind the CTA label to `selected` ("जारी रखें" when hi). Drop the helper line or make it bilingual. Consider folding this into the consent/auth hero as a two-chip toggle (EN | हिं) to remove a screen entirely.
- **Verification:** `grep -c '"' FirstLaunchLanguageScreen.kt` shows no user-facing literals; golden `hindiSelected_light` shows Hindi CTA.

### [P1] OTP entry is a plain text field: no cells, no autofill hint, no timer, no auto-submit, unthrottled resend — NEW — confidence high
- **Where:** `AuthScreen.kt:576-583` (`OutlinedTextField`, `KeyboardType.NumberPassword`), `:585-590` (manual "Verify and continue"), `:591-594` (resend always enabled), `AuthViewModel.kt:294-297` (`onOtpResendRequested` has no cooldown), `FirebasePhoneOtpSender.kt:28` (60-s auto-retrieval window exists but the UI never surfaces it).
- **What:** The field accepts up to six digits but gives no per-digit feedback, no "reading SMS…" state, and no countdown. `NumberPassword` makes Gboard treat the field as a password (no suggestions, no OTP chip). Resend is one tap at any time, so an impatient user hits Firebase rate limiting before the first SMS arrives.
- **Why it matters:** On patchy Ayodhya networks the SMS can take 20–40 s; without a visible timer the natural reaction is to tap Resend, which is precisely what triggers the "Too many attempts" dead end.
- **Top-tier reference:** PhonePe / Cred / UC OTP: six 48-dp cells, `ContentType.SmsOtpCode` autofill, "SMS पढ़ रहे हैं…" with a subtle progress bar for the first 30 s, "Resend in 0:27" countdown, auto-submit on the sixth digit.
- **Fix:** New `HsOtpCells` component (6 cells, `BasicTextField` + `KeyboardType.Number`, `Modifier.semantics { contentType = ContentType.SmsOtpCode }`); auto-call `onOtpEntered` at length 6; `resendAvailableAt` in `OtpEntry` state with a 30-s countdown label; show an "auto-verify listening" caption while the Firebase channel is open.
- **Verification:** Golden `otpEntry_hi_light` shows six cells and "फिर भेजें 0:30"; ViewModel test: resend before cooldown is a no-op; emulator: Gboard shows the OTP chip.

### [P1] "30-day guarantee" on the auth hero is not a product commitment the PRD defines; brand name is inconsistent — NEW — confidence high
- **Where:** `strings.xml:582` / `values-hi:566` (`auth_hero_guarantee`), rendered at `AuthScreen.kt:217-221`; also `strings.xml:537, 545, 556`. PRD defines a **7-day** fix warranty (`docs/prd.md:74, 259`) and a ₹500 no-show credit. Brand: `strings.xml:157` `auth_method_eyebrow = "Homeservices"`, `values-hi:124` "होमसर्विसेज", while the hero and `app_name` say "HomeHeroo" (`AuthScreen.kt:211`, `strings.xml:3`).
- **What:** The first trust claim a customer reads is one the business has not committed to in writing; the eyebrow badge names a different product than the wordmark two centimetres above it.
- **Why it matters:** PR #370 (Play compliance pack) already had to remove an unsubstantiated rating claim; this is the same class. A guarantee claim in the sign-in hero is also the kind of thing a complaint escalates on.
- **Top-tier reference:** UC's login footer: "Verified professionals · Fixed prices · Insured service" — each backed by a policy page.
- **Fix:** Replace with three evidenced chips: "आधार-सत्यापित तकनीशियन · तय कीमत · अयोध्या में स्थानीय" (or the 7-day warranty if that is the policy). Set `auth_method_eyebrow` to the brand name or drop the badge.
- **Verification:** `grep -rn "30-day\|30 दिन" customer-app/app/src/main/res` returns only strings backed by a policy the owner confirms; golden shows the new chips.

### [P1] Consent save failure is silent — NEW — confidence high
- **Where:** `ConsentViewModel.kt:81-82, 102-103` set `error`; `DpdpConsentScreen.kt` has no reference to `uiState.error` (grep: 0 matches in the file).
- **What:** If `GrantConsentUseCase` throws (DataStore I/O, disk full on a sub-₹10k phone), the spinner stops, the button re-enables, and nothing else happens. The user taps again, and again.
- **Why it matters:** State grammar in `design-language.md` requires every major screen to have an explicit error state with a recovery path; this is the first screen in the app.
- **Fix:** Render `uiState.error` as an inline `HsInlineError` above the CTAs with localised copy and a retry; log to Sentry.
- **Verification:** `ConsentViewModelTest` already covers the state; add a Paparazzi state `consentScreen_error_hi`.

### [P1] Loading states drop the branded shell — CARRIED:V4-states-motion ("six of eleven auth states … bare spinner") — confidence high
- **Where:** `AuthScreen.kt:98-102, 111-115, 127-136, 161-171` → `LoadingContent` `:598-628`. Goldens `otpSendingState_lightTheme.png`, `otpVerifyingState_lightTheme.png`, `truecallerLoadingState_*.png` show it: blank cream/black canvas, 4-px dot, two lines of text.
- **What:** Every async step replaces hero + sheet with a centred spinner. Between phone entry and OTP entry the app visually disappears twice.
- **Fix:** Keep `AuthFrame`; render loading inside the `HsSectionCard` (button → progress label, fields disabled at 60 % alpha). Reserve full-screen loading for `TruecallerLoading` only, and give it a brand mark and a 8-s timeout to `MethodSelection`.
- **Verification:** Goldens for `otpSending` and `otpVerifying` show the hero.

### [P1] Auth error copy is hardcoded English in the ViewModel — CARRIED:V2-i18n-hindi (AuthViewModel literals) — confidence high
- **Where:** `AuthViewModel.kt:76, 149, 181, 212, 227, 245, 275, 318, 336, 344, 352-364, 377, 383, 387, 393` (count: `grep -c '"[A-Z][a-z].*\."' AuthViewModel.kt` → 22 lines).
- **What:** On the Hindi UI the error screen is Hindi eyebrow + Hindi title + English body + Hindi button.
- **Fix:** Emit an `AuthError` enum from the ViewModel; map to `R.string` in `ErrorContent`. Strings already exist for most cases in the pattern of `auth_*`.
- **Verification:** `grep -c '"' AuthViewModel.kt` for user-facing sentences → 0; golden `errorState_hi`.

### [P2] Phone and OTP screens have no way back or sideways — NEW — confidence high
- **Where:** `AuthScreen.kt:517-560` (phone), `:563-595` (OTP), `:631-662` (error) — none call `onBackToMethodSelection`; `EmailEntryContent` does (`:410-412`).
- **What:** Once on phone entry, Google/email are unreachable except via system back (which, with `popUpTo(FIRST_LAUNCH) inclusive`, exits the app). On OTP there is no "change number".
- **Fix:** "नंबर बदलें" text button on OTP; "और तरीके" link on phone; both on the error screen.
- **Verification:** Golden shows the links; navigation test: back from phone entry does not finish the Activity.

### [P2] Notification permission is demanded at the moment of sign-in with no pre-prompt — NEW — confidence high
- **Where:** `AppNavigation.kt:233-237`.
- **What:** The instant `Authenticated` fires, before home has rendered, the OS dialog appears. Android grants one refusal before permanently silencing the prompt.
- **Why it matters:** Live tracking and add-on approvals ride on FCM; a reflexive "Don't allow" here breaks Journey 1's climax later.
- **Fix:** Ask after the first booking is placed, with an in-app pre-prompt ("अपडेट पाने के लिए सूचनाएं चालू करें") and a "बाद में" option.
- **Verification:** Emulator: fresh sign-in shows home with no system dialog; dialog appears after booking confirmation.

### [P2] Language change is 3–4 taps, needs an explicit Save, and the settings screen is under-built — NEW — confidence high
- **Where:** `MainGraph.kt:93-94` (home settings icon → `SETTINGS`; profile row → `LANGUAGE_SETTINGS`), `LanguageSettingsScreen.kt:44-65` (no back affordance, `HsTrustBadge(text = "Settings")` English literal at `:49`, "Save" required), `LanguageSettingsViewModel.kt:22` (`"en"` initial value → English flashes selected before DataStore loads on a Hindi device).
- **What:** From home: settings icon → "भाषा" row → tap option → "सेव करें" = 4 taps; via profile row = 3. The picker itself could apply on tap.
- **Fix:** Apply on selection (the locale change already persists first, `SetAppLocaleUseCase.kt:12-17`); add a top bar with back; initialise the VM from `getCurrentLocale()` synchronously or start as `null`; put a compact EN|हिं toggle in the home top row.
- **Verification:** Emulator: two taps from home change the UI language; golden `languageSettings_hi` shows no English badge.

### [P2] Consent hero is a dark brown→black gradient with a leaf icon, on the light-first customer surface — CARRIED:TOK-005 (22 literals → 7 remain) + NEW (semantics) — confidence high
- **Where:** `DpdpConsentScreen.kt:176-178` (`accentDim` → `onSurface`), `:258` (`Icons.Default.Eco`), `:271` (`fontSize = 26.sp` override), colour literals at `:178, 214, 224, 254, 409, 420, 502` (`grep -c "Color.White\|Color(0x"` → 7).
- **What:** The one screen every customer sees first uses the darkest surface in the app and an icon that means "eco-friendly", not "privacy" or "home". `Switch`/`Button` are raw M3, bypassing the shared components.
- **Fix:** Light hero on canvas with a marigold accent illustration (shield-over-house, culturally specific per design-language "Imagery"); `HsPrimaryButton`/`HsSecondaryButton`; drop the sp overrides and use `headlineMedium`.
- **Verification:** Literal count 0; golden `consentScreen_lightTheme_hi`.

### [P2] Phone field expects the user to know about `+91` and offers no hint — NEW — confidence med
- **Where:** `AuthScreen.kt:529-537`, `strings.xml:191` (placeholder `+91 98765 43210`). `PhoneNumberNormalizer.kt:11-33` already accepts bare 10-digit input, so the placeholder over-asks.
- **Fix:** Fixed `+91` prefix pill inside the field, placeholder `98765 43210`, `KeyboardType.Phone` → `Number`, and Google Identity phone hint on focus.
- **Verification:** Golden; emulator shows SIM number chip.

### [P3] Google button uses a typed "G" in `#1A73E8` instead of the brand asset — NEW — confidence high
- **Where:** `AuthScreen.kt:343-359`.
- **Fix:** Bundle the official G logo vector (permitted asset); or, if Google moves behind "other ways", this disappears from the primary path.
- **Verification:** Visual.

### [P3] `Idle` renders "Checking Truecaller" on every device for at least one frame — NEW — confidence high
- **Where:** `AuthScreen.kt:98-102` (`Idle` and `TruecallerLoading` share the branch), `AuthGraph.kt:26-28` (`initAuth` fires in `LaunchedEffect`).
- **Fix:** `Idle` → branded neutral frame; only `TruecallerLoading` names Truecaller, and in Hindi say "आपका नंबर जांच रहे हैं" without the vendor name.

Carried items not re-argued (compact): CUST-LANG-001 (picker could block entry) — the working tree now navigates on `confirmedFlow` (`FirstLaunchLanguageScreen.kt:85-90`) and persists before applying the locale; still unproven by an instrumented test, status **CARRIED / unverified**. V1 `LanguagePickerCard.kt` unmapped slot — **resolved** (all slots mapped). V3 hardcoded reject-button colour — **resolved** (S-32).

## G. Aspirational moves

| # | Idea | Reference | Cost | Dependency |
|---|---|---|---|---|
| 1 | **One-screen "नमस्ते" activation.** Full-bleed Ayodhya technician-at-door photo, wordmark, EN/हिं chip in the hero, phone field with SIM-hint chip and `+91` pill, three evidenced trust chips, "और तरीके" link. Consent moves to post-auth. | UC login, Zomato login | M | Photo asset (Ayodhya, not stock), Google Identity phone hint (free), consent-version bump |
| 2 | **OTP as a stage.** `HsOtpCells` (6 cells), "SMS पढ़ रहे हैं…" shimmer for the 60-s Firebase window, "फिर भेजें 0:30", auto-submit, in-place shake on error, success tick → crossfade to home. | PhonePe, Cred | M | None — Firebase auto-retrieval already wired |
| 3 | **Consent as a trust moment.** After sign-in, before first booking: "आपका डेटा, आपका नियंत्रण" — first card is the address-sharing promise (only assigned technician + support), then analytics/crash/offers, all OFF, equal-weight buttons, one-line "why" each. | Apple ATT, Revolut privacy centre | S–M | Counsel sign-off on defaults; `CURRENT_CONSENT_VERSION++` |
| 4 | **Splash + arrival.** SplashScreen API icon on marigold canvas, 400-ms crossfade into hero; on first success a 1-s "नमस्ते, Riya" card with the technician-verification promise before home. | Airbnb, Cred | S | `core-splashscreen`, icon vector |
| 5 | **Truecaller as a promise, not a spinner.** If Truecaller is usable, show the phone sheet with a one-tap "Truecaller से जारी रखें" primary and the field as secondary, instead of launching the SDK blind over a spinner. | UC (one-tap when installed) | S | Confirm Partner clientId is configured in prod |

## H. Strengths (preserve)

- **Firebase SMS auto-retrieval is correctly wired** — the callback channel stays open after `onCodeSent` and closes on auto-verify or timeout (`FirebasePhoneOtpSender.kt:39-58`); most apps get this wrong. The UI just needs to show it.
- **Forgiving phone normaliser** — accepts spaces, hyphens, leading 0, leading 91, E.164 (`PhoneNumberNormalizer.kt:11-33`).
- **Locale write-before-apply** (`SetAppLocaleUseCase.kt:12-17`) and Hindi default with device-locale respect (`LocaleRepositoryImpl.kt:26-49`, ADR-0018); Settings "Manage consent" shows stored values, not factory defaults (`ConsentViewModel.kt:34-50`).
- **Hindi plurals done properly** (`AuthScreen.kt:641-646`), `HsActionButton` grows to two lines rather than ellipsising Devanagari, and the typography ramp now maps all 15 slots with explicit line heights.

## I. Questions for the owner

1. Is "30-day guarantee" a written policy? The PRD commits to a 7-day fix warranty. One of the two must change everywhere (`strings.xml:537, 545, 556, 582`).
2. May Google and email/password move behind an "other ways" link for the Ayodhya pilot, per ADR-0005's own ordering? Email/password was rejected for customers in that ADR yet exists in the app.
3. Consent defaults: will counsel accept pre-ticked analytics/crash under DPDP §6, or should defaults be OFF? And may consent move to after sign-in?
4. Is the Truecaller Partner clientId configured in the production build? If not, "Checking Truecaller" is shown to 100 % of users and never succeeds.
5. Is "HomeHeroo" the final brand? Three names appear in this lane (HomeHeroo, Homeservices, होमसर्विसेज).

## Scorecard

| Screen | Specificity (0-4) | Craft (0-4) | Trust (0-4) | Hindi/field (0-4) | Gap-to-top-tier |
|---|---|---|---|---|---|
| Cold-start frame | 0 | 0 | 1 | 2 | No splash; two blank frames |
| DPDP consent | 1 | 2 | 1 | 2 | Pre-ticked opt-out gate before any value; broken legal line |
| First-launch language picker | 2 | 2 | 2 | 1 | English chrome on a Hindi-default screen; whole screen is removable |
| Auth: Idle / Truecaller loading | 0 | 1 | 1 | 1 | Vendor-name spinner, no timeout, no brand |
| Auth: method selection | 1 | 2 | 2 | 2 | Phone buried third; four lines of small print |
| Auth: phone entry | 1 | 2 | 2 | 2 | No SIM hint, no +91 pill, no way back |
| Auth: OTP entry | 1 | 1 | 2 | 2 | Plain field; no cells/timer/autofill; wrong code ejects user |
| Auth: sending / verifying | 0 | 1 | 1 | 2 | App disappears into a spinner twice |
| Auth: error | 1 | 2 | 1 | 1 | Lockout-grade copy for a typo; English body on Hindi UI; one exit |
| Language settings (in-app) | 1 | 2 | 3 | 2 | 3–4 taps + Save; English "Settings" badge; no back |
| **Average** | **0.8** | **1.5** | **1.6** | **1.7** | |
