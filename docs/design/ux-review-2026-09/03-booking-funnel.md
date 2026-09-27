# 03 — Booking funnel: slot → address → summary → confirmed, price approval, waitlist

Reviewer lane 3 of 5. Baseline `main` @ `6a79f198` (REL-3, customer 0.1.9), working tree as-is,
2026-09-26. Read-only. No emulator attached; judgements that need one are marked.

**Pilot truth applied:** cash-only (Razorpay chooser hidden, `strings.xml:92-108`), technician-side
UPI/QR exists (E24), price approval fires when a technician revises the quote on-site.

## 0. What the funnel actually is today

| Step | Route (`BookingRoutes.kt`) | Screen | Live? |
|---|---|---|---|
| 1 | `booking/slot/{serviceId}/{categoryId}` | `SlotPickerScreen` | yes |
| 2a | `booking/address` | `AddressScreen` (free text + GPS) | **default** — `placesAutocompleteEnabled()` defaults `false` (`FeatureFlags.kt:88`, GrowthBook key `customer.places-autocomplete.enabled`, "default off" per `docs/superpowers/specs/2026-05-16-week5-foundation-stories-design.md:121`). Runtime flag state not verifiable from source. |
| 2b | `booking/address-picker/{serviceId}` | `AddressPickerScreen` (Places + map) | only if flag on |
| 2c | `booking/waitlist?…` | `WaitlistScreen` | from 2b refusal only — the legacy 2a never geo-fences |
| 3 | `booking/summary` | `BookingSummaryScreen` | yes |
| 4 | `booking/confirmed/{bookingId}/{appliedCredit}` | `BookingConfirmedScreen` | yes; `popUpTo(BOOKING_GRAPH){inclusive}` (`MainGraph.kt:370-372`) |
| — | `booking/price-approval/{bookingId}` | `PriceApprovalScreen` | pushed by `PendingActionsNavEffect` (`AppNavigation.kt:266-295`) over whatever the user is doing |

**Answers to the lane questions, one line each (evidence in §F):**

- *Progress indicator across the funnel?* **No.** None of the four screens renders a step, count or
  breadcrumb; each has a full-width `HsScreenTitle` and a different app-bar title
  ("Choose Date & Time" / "Your Address" / "Booking Summary"). Carried from July (`obs/customer.booking-slot-picker`).
- *Is the slot picker a calendar a rural first-timer understands?* **Half.** Morning/Afternoon/Evening
  buckets exist and are translated (सुबह/दोपहर/शाम). But the 7 date chips are `"EEE, d MMM"` with no
  "Today/Tomorrow" (`SlotPickerScreen.kt:52,166`) and the windows are raw `"10:00-12:00"` API strings
  (`:283`) — 24-hour, no AM/PM, no Devanagari, no "≈2-hour window" explanation.
- *Does address capture use device location, map pin, landmarks?* **Legacy (live): GPS mandatory, no pin,
  no landmark field.** `Next` is disabled until `lat/lng` are captured (`AddressScreen.kt:306`); a user who
  denies location, or whose GPS fails, is dead-ended. **Places variant: no "use my location", and the pin
  only appears after a successful Places search** (`AddressPickerScreenContent.kt:310-312`). Neither
  variant has a landmark / floor / "near ___ mandir" field, which is how addresses work in Ayodhya.
- *Does the summary make price, inclusions, cancellation, payment mode unmistakable?* **No to all four.**
  `BookingUiState.Ready` carries no amount, no service name (`BookingUiState.kt:501-506`); the screen shows
  slot + address + a "Cash payment selected" card with a **padlock** icon (`BookingSummaryScreen.kt:265`),
  and the subtitle still says "Choose online payment or pay cash" (`strings.xml:88`). There is no
  cancellation copy anywhere in the app (`grep -i cancellation values/strings.xml` → 0 hits).
- *Does confirmation deliver a peak moment with "what happens next" and an ETA expectation?* **No.**
  Static `CheckCircle`, no motion (`BookingConfirmedScreen.kt:157-170`), no recap of what/when/where/how
  much, no ETA-to-assignment, no "we'll call you on …". The three timeline steps use identical primary
  dots and speak in dispatch jargon ("queued for dispatch").
- *Is price approval calm and fair, or alarming?* **Alarming by omission.** It arrives as a full-screen
  push with no back affordance (`PriceApprovalScreen.kt:248`), shows the add-on and its trigger but not the
  original price, the new total, the technician's name/photo or any evidence, defaults the filled primary
  to **Approve**, and then demands a fingerprint to approve a cash charge (`PriceApprovalViewModel.kt:488-496`,
  English-only prompt).
- *Where is reassurance missing at the highest-stakes taps?* "Book with Cash" (no amount, no what-happens-
  next), "Confirm address" (address you are confirming is 12sp grey, `AddressPickerScreenContent.kt:367-373`),
  "Approve" (no total, no recourse), and the moment after process death mid-funnel (silent dead tap, §F P0-2).

---

## A. Design specificity

| Screen | Could another product ship it unchanged? | Why |
|---|---|---|
| Slot picker | **Yes** | M3 `FilterChip` grid inside plain `Card`s, raw M3 `Button` CTA (`SlotPickerScreen.kt:144,170,297`). Only the सुबह/दोपहर/शाम buckets are ours. |
| Address (legacy) | **Yes** | Outlined 4-line text field + grey status box + outlined "Use current location". Generic form. |
| Address picker | **Mostly** | Full-bleed Google map + search field + bottom sheet is the Ola/Uber/Zomato template; the Ayodhya-centred camera and refusal banner are the only product-specific bits. |
| Summary | **Yes** | Two `HsInfoRow`s in a card and a CTA. No service imagery, no price, no brand voice. |
| Confirmed | **Yes** | Check icon + title + three-dot timeline + two stacked buttons. Indistinguishable from a template. |
| Price approval | **Yes** | Title, card list, total strip, CTA. |
| Waitlist | **Yes** | One text field and a button. Copy ("No spam — promise.") is the only voice. |

Verdict: the funnel has zero visual signature. The D1 direction ("airy, photo-first, trust-led") is
absent — not one photo, technician face or service illustration appears between "Book now" and
"Booking confirmed".

## B. Top-tier gap (the section that matters)

**Reference: Urban Company checkout (slot → address → summary), 2025–26 build.**

1. **Persistent order rail.** UC keeps the service name, thumbnail and price pinned in a compact header
   on every checkout step; the price never leaves the screen. Ours drops the service the moment you leave
   service detail — nothing between `ServiceDetailScreen` and the API response knows the price
   (`BookingViewModel.startBooking` sends `serviceId` only, `:166-177`).
2. **Slot picker as a horizontal date strip with "Today / Tomorrow" pills and 12-hour, localised windows
   ("9 AM – 11 AM"), plus an "earliest available" default pre-selected.** We render `Fri, 1 May` and
   `10:00-12:00`, nothing pre-selected, and a CTA that just says "Confirm Slot".
3. **Address = saved addresses first, then "Use current location" as a primary pill on the map, then a
   detail sheet: House/Flat, Landmark, Save as Home/Work, Receiver name + phone.** We have a single free
   text box (legacy) or a bare map (Places). No landmark, no receiver phone, no saved addresses. In a city
   where "Ram Path ke peeche, Hanuman Garhi ke paas" *is* the address, landmark is the primary field.
4. **Summary = itemised bill (base, add-on triggers, taxes, total), "What's included" accordion,
   cancellation policy line ("Free cancellation until 2h before slot"), payment mode with an icon that means
   cash, and a CTA that carries the number: "Book · ₹599".** We show "Book with Cash".
5. **Confirmation = Lottie tick with haptic, then a card that repeats service + slot + address + amount,
   "Professional will be assigned within N min", and a live-tracking CTA.** We show a static tick and a
   raw booking ID.

**Reference for price approval: Zomato / Swiggy "item unavailable — approve substitution" sheet and
Urban Company's on-site "additional work" approval.** Both show the *before* and *after* totals, a photo
or reason, a neutral pair of equal-weight choices, a "talk to us" escape, and no biometric step. Ours
shows only the delta, nudges to Approve, and adds a fingerprint prompt.

**Reference for motion: Cred payment success / Apple Wallet "Done".** D1 §Motion is explicit —
"Navigation should not be instant-cut for major emotional moments such as … booking confirmation". This is
a documented requirement we do not meet.

## C. Heuristics (Nielsen, 0–4; evidence for every <3)

| # | Heuristic | Slot | Addr (legacy) | Addr picker | Summary | Confirmed | Price appr. | Waitlist |
|---|---|---|---|---|---|---|---|---|
| 1 | System status | 2 | 1 | 2 | 1 | 2 | 2 | 2 |
| 2 | Real-world match | 2 | 2 | 2 | 1 | 2 | 1 | 3 |
| 3 | Control & freedom | 3 | 1 | 1 | 2 | 2 | 1 | 1 |
| 4 | Consistency | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| 5 | Error prevention | 3 | 1 | 1 | 1 | n/a | 2 | 1 |
| 6 | Recognition > recall | 2 | 2 | 2 | 1 | 1 | 1 | 2 |
| 7 | Flexibility | 1 | 1 | 1 | 1 | n/a | 1 | n/a |
| 8 | Minimalist | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
| 9 | Error recovery | 1 | 1 | 0 | 1 | n/a | 0 | 1 |
| 10 | Help | 1 | 2 | 1 | 1 | 1 | 1 | 2 |

Evidence (one line per <3, grouped):

- **H1** Slot 2: no step indicator; loading resets selection (`SlotPickerViewModel.kt:386,400`). Addr legacy 1: six status messages share one grey box with no semantic colour (`AddressScreen.kt:365-374`); the disabled `Next` gives no reason. Addr picker 2: `Searching` shows a bar, but `Error` has no UI branch (`AddressPickerScreenContent.kt:354`). Summary 1: no price/total; `Idle` renders blank (`BookingSummaryScreen.kt:196`). Confirmed 2: timeline dots identical (`HsComponents.kt:290-297`). Price 2: `BiometricPending` collapses to the same skeleton as `Loading` (`PriceApprovalScreen.kt:264-266`). Waitlist 2: CTA replaced by a bare spinner (`WaitlistScreenContent.kt:239-248`).
- **H2** Slot 2: `10:00-12:00`, `Fri, 1 May`. Addr 2/2: Google's `formattedAddress` / `"Lat 26.79, Lng 82.19"` (`AddressPickerViewModel.kt:208`) presented as an address. Summary 1: "Cash payment selected" under a padlock; ISO date. Confirmed 2: "queued for dispatch", "We match based on service skill, distance, and availability" (`strings.xml:127,129`). Price 1: "कीमत अनुमोदन / अनुमोदित करें" is Sanskritised office register; "billing changes"; fingerprint for cash.
- **H3** Addr legacy 1: no path forward without GPS (`AddressScreen.kt:306`). Addr picker 1: no pin until a Places hit; "drag the pin" instruction when there is no pin (`:207` vs `:310-312`). Summary 2: rows are not tappable to edit (`:233-240`). Confirmed 2: system back lands on Service Detail, not Home (graph popped, `MainGraph.kt:370-372`; needs emulator to confirm the exact landing). Price 1: no back/close (`PriceApprovalScreen.kt:248`), no "decide later", no "call technician". Waitlist 1: `RateLimited` and `Confirmed` are terminal with no CTA (`WaitlistScreenContent.kt:124-128, 206-236`).
- **H4** All 2: raw M3 `Button`/`Card` on Slot vs `Hs*` elsewhere; CTA heights 56/52/48 across the funnel (`SlotPickerScreen.kt:144`, `BookingSummaryScreen.kt:295,416,423`, `BookingConfirmedScreen.kt:146,152`, `HsComponents.kt:107` controlMd=48 for secondary); two different address screens behind a flag.
- **H5** Addr legacy 1: nothing prevents "Ayodhya" alone as the full address. Addr picker 1: out-of-area is only discovered after pin drag; legacy never geo-fences at all, so out-of-area bookings reach dispatch (ties to `project_dispatch_radius_coverage_gap`). Summary 1: one tap commits with no amount shown. Price 2: `Confirm` needs every add-on decided (good) but an empty list yields an enabled button over nothing (`:312`). Waitlist 1: placeholder `+91 98765 43210` fails the regex `^\+91[6-9]\d{9}$` (`WaitlistScreenContent.kt:185` vs `WaitlistViewModel.kt:312`).
- **H6** Summary 1 / Confirmed 1 / Price 1: the user must remember what service, what price, what was already agreed. Nothing is recapped.
- **H7** all 1: no saved addresses, no "book again with same slot", no "earliest available", no "decline all".
- **H9** Slot 1: raw `err.message` (`SlotPickerScreen.kt:211`, VM `:391`). Addr legacy 1: `"GPS_ERROR"` is swallowed into one generic string; addr picker 0: no error UI. Summary 1: `BookingError` prints the raw message with no retry or exit (`:431-449`). Price 0: `"Error: %s"` raw, no retry, no exit (`:267-275`). Waitlist 1: raw `throwable.message` (`WaitlistViewModel.kt:397`).
- **H10** No contextual help anywhere: no "what is an arrival window", no "why do we need your location", no "what if the technician asks for more money".

## D. Cognitive load & emotional journey

Checklist (impeccable §Cognitive Load), failures per screen: Slot **2** (working memory: what am I
booking / how much; hidden navigation: where am I in the flow), Address legacy **3** (working memory;
hidden nav; one-thing-at-a-time — text + GPS + privacy note compete), Address picker **2**, Summary **4 —
critical** (working memory: price; visual hierarchy: cash card and slot card have equal weight; progressive
disclosure: women-safe toggle pops in after an async fetch, `BookingViewModel.kt:324-331`, shifting layout;
hidden nav), Confirmed **2**, Price approval **3** (working memory: original price; single focus: fingerprint
interrupt; grouping: total strip is far from the cards), Waitlist **1**.

Decision points with >4 visible options: Slot picker — 7 date chips + up to ~9 window chips visible at
once (fixture in `SlotPickerScreenPaparazziTest.kt` builds 4–5 per bucket); acceptable because bucketed,
but no default selection means the user must scan all of them.

**Emotional map, Riya's terms:**

| Moment | What she feels | What the screen does |
|---|---|---|
| "Book now" → Slot | "OK, when can they come?" | Asks the question well, but the price she just read is gone. |
| Slot → Address | "Will they find my house?" | Legacy: asks for GPS with a grey crosshair box; if she says no to the permission dialog, the flow silently dies. No landmark field to reassure her. |
| Summary | "How much, and is this it?" | Shows *no* amount. Padlock icon says "secure payment" when the truth is "cash to a stranger". |
| Tap "Book with Cash" | commitment | 3 skeleton bars, then hard cut to a tick. No breath, no celebration. |
| Confirmed | "Now what? When? Who?" | "We are assigning a technician for your slot." No time expectation, no name, no phone-call promise. |
| Later: price-approval push | "He wants more money" — anxiety spike | Full-screen takeover, no exit, filled Approve, fingerprint prompt. This is the single most trust-sensitive moment in the product and it is the least designed. |
| Waitlist | disappointment | Copy is kind; the form then rejects the format it suggested. |

Reassurance missing at the highest-stakes taps: amount + "pay only after the work" on Summary; technician
name/photo/ETA on Confirmed; before/after total + "talk to us" on Price approval; "your address is only
shared with your technician" is present on legacy (`address_privacy_note`) but **absent** on the Places
variant.

## E. Hindi + field conditions

- **Translation coverage:** every `slot_picker_*`, `address_*`, `address_picker_*`, `booking_*`,
  `price_approval_*`, `waitlist_*`, `pending_payment_*`, `women_safe_*` key has a `values-hi` entry
  (verified by the two greps in this session). Good.
- **English leaks below the resource layer (all NEW unless noted):** biometric prompts
  `"Confirm Payment"/"Authenticate to authorise…"` (`BookingViewModel.kt:137-138`) and
  `"Confirm Price Approval"/"Authenticate to approve add-on charges"` (`PriceApprovalViewModel.kt:494-495`);
  `"Unknown error"` (`SlotPickerViewModel.kt:391,403`); `"Booking failed"/"Confirmation failed"`
  (`BookingViewModel.kt:28-29`); `"Session expired…"`, `"Please enter a valid Indian mobile number…"`,
  `"Something went wrong."` (`WaitlistViewModel.kt:334,370,397` — CARRIED); `"Lat $lat, Lng $lng"`,
  `"Failed to resolve place"`, `"Search failed"` (`AddressPickerViewModel.kt:108,187,208` — CARRIED);
  `"Failed to load add-ons"`, `"Authentication context unavailable"`, `"Biometric authentication failed"`,
  `"Approval failed"` (`PriceApprovalViewModel.kt:466,484,500,516`).
- **Register:** `कीमत अनुमोदन`, `अनुमोदित करें`, `निर्णय कन्फर्म करें` read like a government form. Riya says
  "मंज़ूर" / "हाँ, करवा दो". Compare the good colloquial `स्लॉट पक्का करें`.
- **Devanagari fit:** headings use `headlineSmall` 20/28 and `headlineMedium` 22/30 — adequate. Risk points:
  `FilterChip` labels for dates ("शुक्र, 1 मई") fit; the Places confirm bar shows the address in
  `bodySmall` 12/18 with `maxLines = 2` (`AddressPickerScreenContent.kt:367-373`) — Devanagari matras at
  12sp on a sub-₹10k panel in sunlight is below the D1 rule "body.sm = metadata only". Same 12sp body
  problem: cash note body (`BookingSummaryScreen.kt:277-281`), timeline bodies (`HsComponents.kt:303-307`),
  address note and assign-help (`AddressScreen.kt:257-261, 392-397`), add-on trigger description
  (`PriceApprovalScreen.kt:331-335`).
- **Mixed-script money:** `₹%1$s क्रेडिट लागू करें` fine. Price approval now uses `formatRupees` for both the
  line and the total (`PriceApprovalScreen.kt:337,383`) — the July "Rs 1200 vs ₹0.00" observation is fixed
  in code; the golden still shows it (see §F P1-10).
- **Font scale 1.3+:** `BookingConfirmedScreen` column is not scrollable (`:92`) — with Hindi bodies and the
  two 56/52dp CTAs it will overflow on a 5" 720p device; the CTAs sit below `Spacer(weight(1f))` so they are
  the first thing pushed off. `WaitlistScreenContent` has no scroll/imePadding (CARRIED). Summary and Price
  approval scroll correctly.
- **Sunlight/contrast:** D1 tokens are in force (`Color.kt:155,193` primary = `#E2A04A`); `onSurfaceVariant`
  at 12sp is the concern, not the ratio.
- **One-hand reach:** all primary CTAs are bottom-anchored; date chips top-of-screen are a two-row
  `FlowRow`, reachable. Price approval's per-card Approve/Decline pairs scroll — fine.
- **Offline/slow:** Slot has retry; Summary has `NetworkError` + retry (good, `:451-479`); Address picker
  has no error UI; Price approval has no retry; nothing tells the user they are offline before they tap.
- **Pixels:** all eight goldens in this lane were recorded 2026-05-08/12 (`git log` on the PNGs), before D1
  (2026-07-26) and before the cash-only change; every lane Paparazzi class is `@Ignore`d at class level. The
  goldens show a **green/teal palette, a Razorpay radio group, "Pay Now", and a Trust Dossier card** — none
  of which current code renders. Slot picker, Address picker and Waitlist have **no golden on disk**. Treat
  the PNGs as historical, not as evidence of today's UI.

---

## F. Findings

### [P0] Summary commits money without ever showing the amount — CARRIED:obs/customer.booking-summary — confidence high
- **Where:** `BookingUiState.kt:501-506`; `BookingSummaryScreen.kt:232-241, 288-296`; `BookingViewModel.kt:166-177`
- **What:** `Ready(slot, addressText, lat, lng)` has no price, no service name, no inclusions. The screen renders Slot + Address + a cash note and a CTA "Book with Cash". The last time the user saw a number was on Service Detail two screens ago.
- **Why it matters:** Riya is committing a stranger to her home and cash from her purse; the app asks her to do it blind. This is the single biggest driver of "the tech upcharged me" complaints, because there is no anchor to argue from.
- **Top-tier reference:** UC/Snabbit summary: itemised bill, total in `title.lg`, CTA "Book · ₹599".
- **Fix:** Carry `serviceName`, `heroImageUrl`, `basePricePaise`, `includes[]`, `addOnTriggers[]` from `ServiceDetailViewModel` into `BookingViewModel` (set alongside `pendingServiceId`). Render a service header card (thumb + name + `HsPriceText`), an "Included" list, "Possible extras (only with your approval)" list, and put the amount in the CTA: `Book · ₹599 · cash after service`.
- **Verification:** new `BookingSummaryScreenPaparazziTest.ready_withPrice_hindi` recorded on CI; unit test asserts `Ready` carries `basePricePaise`.

### [P0] Process death mid-funnel produces a silent dead tap or a blank screen — NEW — confidence high
- **Where:** `BookingViewModel.kt:43-63` (no `SavedStateHandle`; `grep SavedStateHandle ui/booking` → 0 hits); `MainGraph.kt:301-306, 348-355` (`?: return@…` when `Ready` is missing); `BookingSummaryScreen.kt:196` (`else -> Unit`)
- **What:** NavController restores the back stack after process death but the graph-scoped VM restarts as `Idle`. On the Address step, filling the (saveable) form and tapping Next does nothing — the callback returns early. On Summary, the screen is blank under a "Booking Summary" app bar.
- **Why it matters:** Sub-₹10k Androids kill background apps constantly; a user who answers a WhatsApp mid-booking comes back to a form that ignores taps. There is no error, so she assumes the app is broken.
- **Top-tier reference:** Any checkout on Swiggy/Zomato survives backgrounding; cart state is persisted.
- **Fix:** Persist `slot`, `pendingServiceId/categoryId`, and `addressText/lat/lng` in `SavedStateHandle` (or pass slot as a nav arg to the address routes). Replace `?: return` with navigation back to the slot step plus a snackbar. Make `Idle` on Summary render a "Session expired — start again" card, never nothing.
- **Verification:** `adb shell am kill` at Address and at Summary, resume; both must show a usable screen. Unit test: VM restored from `SavedStateHandle` yields `Ready`.

### [P0] Legacy address (the live default) dead-ends anyone who refuses or lacks GPS — CARRIED:obs/customer.booking-address-legacy (promoted from medium) — confidence high
- **Where:** `AddressScreen.kt:306` (`enabled = … && selectedLat != null && selectedLng != null`); `:119, 129-131` (denied/GPS error only change a message)
- **What:** Coordinates are mandatory, and the only source is `FusedLocationProvider`. Denied permission, airplane mode, or an indoor GPS miss leaves `Next` disabled forever with no map, no pincode, no pin.
- **Why it matters:** Permission-deny rates on first run in this segment are high; each denial is a lost booking with no signal to the owner.
- **Top-tier reference:** UC falls back to a map pin at city centre plus manual entry; location is a convenience, not a gate.
- **Fix:** Enable `Next` on non-blank text + landmark; when no GPS, send `lat/lng = null` and let dispatch geocode server-side, or show the map centred on Ayodhya with a draggable pin as the fallback (the Places variant already has the map). Explain the disabled state in-line when it must stay disabled.
- **Verification:** emulator with location permission denied — booking must still complete; Paparazzi state `permissionDenied_lightTheme`.

### [P0] Places variant: no pin exists until a search succeeds, and the fallback tells the user to drag it — CARRIED:obs/customer.booking-address-picker (promoted) — confidence high
- **Where:** `AddressPickerScreenContent.kt:310-312` (`if (hasMarker) Marker(...)`), `:205-211` (`address_picker_search_unavailable_drop_pin`), `:354` (Error → default disabled CTA)
- **What:** On open the map is empty. If Places returns nothing (quota, offline, rural gaps) the panel says "drag the pin on the map" while no pin is rendered; `Error` has no UI at all.
- **Why it matters:** If the flag is ever flipped, every user whose village is not in Places autocomplete is blocked.
- **Fix:** Always render a centre-pinned marker (camera-centre pin pattern, not draggable marker), add a "Use my location" FAB, reverse-geocode on camera idle, and give `Error` a card with retry.
- **Verification:** Paparazzi `idle_showsPin`, `error_showsRetry`; VM test for `Error` branch rendering.

### [P1] No progress indicator or order rail across the four steps — CARRIED:obs/customer.booking-slot-picker — confidence high
- **Where:** `SlotPickerScreen.kt:110-137`, `AddressScreen.kt:184-209`, `BookingSummaryScreen.kt:214-231`
- **What:** Each screen opens with a fresh title; nothing says "1 of 3", nothing shows the service being booked.
- **Why it matters:** First-time users abandon when they cannot see the end; the July plan already named "step indicators" as S-41's first deliverable and it did not ship.
- **Top-tier reference:** UC's pinned service header + 3-dot stepper.
- **Fix:** A shared `HsBookingRail(service, price, step, of=3)` composable under the app bar on Slot/Address/Summary; app-bar titles become the step names in one voice ("When · Where · Confirm").
- **Verification:** golden per step in en+hi; TalkBack reads "Step 2 of 3".

### [P1] Slot chips are machine strings: no Today/Tomorrow, 24-hour windows, locale frozen at class load — CARRIED:obs/customer.booking-slot-picker — confidence high
- **Where:** `SlotPickerScreen.kt:52` (`ofPattern("EEE, d MMM")`, no `Locale`), `:166-175`, `:283` (`Text(slot.window)`)
- **What:** Dates are `Fri, 1 May`; windows are `10:00-12:00`. The file-level formatter takes the JVM default locale once per process, so an in-app hi↔en switch does not re-render the chips until restart.
- **Why it matters:** A rural first-timer thinks in "आज / कल / परसों" and "सुबह 10 से 12". `14:00-16:00` requires arithmetic.
- **Top-tier reference:** UC date strip: "Today 26", "Tomorrow 27", then weekday; windows "10 AM – 12 PM".
- **Fix:** Build labels in Compose with `LocalConfiguration.locales[0]`; first two chips `Today`/`Tomorrow` (आज/कल); format windows via a `SlotWindowFormatter` that emits "10–12 बजे सुबह" in hi and "10 AM – 12 PM" in en; pre-select the earliest available window.
- **Verification:** `SlotPickerScreenPaparazziTest` hi variant; unit test for formatter with `Locale("hi","IN")`.

### [P1] Summary copy and iconography contradict the cash-only truth — NEW — confidence high
- **Where:** `strings.xml:88` ("Choose online payment or pay cash…"), `:104` ("Cash payment selected"); `BookingSummaryScreen.kt:265` (`Icons.Filled.Lock`)
- **What:** The subtitle offers a choice that does not exist; the cash card says "selected" though nothing was selected; the icon is a padlock (secure online payment) for cash-in-hand.
- **Why it matters:** Wrong reassurance is worse than none — the padlock implies the app holds the money.
- **Fix:** Subtitle: "Pay cash after the work is done. No advance." Card: `Icons.Outlined.Payments`/a rupee-note glyph, title "Pay ₹599 in cash when the work is finished", body "Your technician can also show a UPI QR." (E24). Keep the dormant online strings, drop the chooser copy.
- **Verification:** string review + golden.

### [P1] Confirmation is an instant cut with no recap, no ETA expectation, no motion — CARRIED:obs/customer.booking-confirmed — confidence high
- **Where:** `BookingConfirmedScreen.kt:96-115, 157-170, 172-190`; `strings.xml:122, 126-131`
- **What:** Static tick; body "We are assigning a technician for your slot."; raw booking ID; three identical-dot steps written from the dispatcher's point of view. Nothing about which service, when, where, how much cash to keep, or how long assignment usually takes. D1 §Motion names this screen as one that must not be an instant cut.
- **Why it matters:** Peak-end rule: this *is* the peak. Today it is the flattest screen in the funnel.
- **Top-tier reference:** Cred/UC: 400 ms scale-in tick + haptic, then a receipt card, then "Assigning within ~15 min — we'll notify you".
- **Fix:** `slow` motion token (420–500 ms, emphasized decelerate) scale+fade on the tick with `HapticFeedbackType.Confirm`; a recap card (service, `Today · 10–12 AM`, first line of address, `₹599 cash after service`); step 1 done-state dot, steps 2–3 muted; body "Usually assigned within 15 min. We'll notify you and share the technician's name and photo."; make the column scrollable.
- **Verification:** golden en+hi at font scale 1.3; motion honours `reduced-motion`.

### [P1] Price approval is a no-exit takeover that nudges toward Approve and gates cash with a fingerprint — NEW (exit/biometric) + CARRIED:obs/customer.booking-price-approval (selection state, equal weight) — confidence high
- **Where:** `PriceApprovalScreen.kt:248` (no navigation icon), `:339-360` (filled Approve / outlined Decline), `:278` (`remember`, not `rememberSaveable`); `PriceApprovalViewModel.kt:488-503`; `AppNavigation.kt:288-292` (`navigate(route) { launchSingleTop }` from a Room observer, i.e. pushed over any screen)
- **What:** The screen appears on top of whatever Riya is doing, with no back/close, shows only the delta (no base price, no new total, no technician identity, no photo), gives Approve the brand fill, loses decisions on rotation, and then asks for a fingerprint with an English-only prompt — for a cash charge that will be settled hand-to-hand.
- **Why it matters:** This is the "he upcharged me ₹800" moment from the PRD's opening scene. It needs to feel like a fair, reviewable offer, not a demand.
- **Top-tier reference:** UC additional-work approval: bottom sheet with "Original ₹599 → New total ₹1,799", technician name + photo, reason, "Approve" / "Decline" as equal-weight pills, "Call technician", "Talk to support".
- **Fix:** Present as a modal bottom sheet over Live Tracking with a close affordance ("Decide later — the technician is waiting"); show base, each add-on with reason, new total, technician card; equal-weight tonal buttons whose selected state fills; hold decisions in the VM; remove the biometric gate for `CASH_ON_SERVICE` bookings (keep for online); localise every prompt.
- **Verification:** golden `pendingApproval_hindi`, `oneApproved_oneDeclined`; VM test that cash bookings skip `biometricGate`.

### [P1] The funnel has zero live pixel coverage; the goldens on disk are from May and show a different product — NEW — confidence high
- **Where:** class-level `@Ignore` on `SlotPickerScreenPaparazziTest.kt:12`, `AddressScreenPaparazziTest.kt:10`, `AddressPickerScreenPaparazziTest.kt:16`, `BookingSummaryScreenPaparazziTest.kt:12`, `BookingConfirmedScreenPaparazziTest.kt:12`, `PriceApprovalScreenPaparazziTest.kt:11`, `WaitlistScreenPaparazziTest.kt:8`; goldens dated 2026-05-08/12
- **What:** The Summary golden shows a Razorpay radio group and "Pay Now" in a teal palette; Confirmed shows a Trust Dossier card that `MainGraph.kt:423-428` never enables (no `technicianId` passed). None of this is what ships.
- **Why it matters:** Every UI finding above can regress silently; the S-41 work will have no before/after.
- **Fix:** Re-record on CI Linux via `paparazzi-record.yml` (per `feedback_paparazzi_cross_os.md`), un-ignore at method level, add hi + font-scale-1.3 variants. Delete the dead `technicianId` plumbing or wire it.
- **Verification:** goldens dated after this review; CI diff job green.

### [P1] The address the user is confirming is 12sp grey text — NEW — confidence high
- **Where:** `AddressPickerScreenContent.kt:367-373` (`bodySmall`, `onSurfaceVariant`, `maxLines = 2`)
- **What:** The only thing worth reading on the confirm bar is styled as metadata.
- **Why it matters:** Wrong-address dispatches are the costliest failure for a 10 km-radius pilot.
- **Fix:** `titleMedium` on `onSurface`, 3 lines, with a leading `LocationOn`; add a "Landmark / house details" field above the CTA.
- **Verification:** golden; TalkBack reads the address before the button.

### [P1] No landmark, floor, receiver phone or saved-address concept on either address screen — NEW — confidence high
- **Where:** `AddressScreen.kt:265-271` (single 4-line field); `AddressPickerScreenContent.kt` (no detail fields at all)
- **What:** The data model is `addressText + lat/lng`. Nothing structured for "near Hanuman Garhi, blue gate, 2nd floor".
- **Why it matters:** In Ayodhya the landmark *is* the address; technicians will phone anyway, defeating the screen's own promise ("reach you without follow-up calls", `strings.xml:71`).
- **Top-tier reference:** UC/Swiggy address sheet: Flat/House, Landmark (required), Save as Home/Work, receiver name + phone.
- **Fix:** Add `landmark` (required) and `houseDetails` fields, "Save as Home" toggle; render saved addresses as chips at the top on repeat visits. API needs the extra fields — pair with an API story.
- **Verification:** booking payload contains `landmark`; golden.

### [P1] Confirmed screen is not scrollable and stacks 56 + 52 dp CTAs — CARRIED:obs/customer.booking-confirmed — confidence med (needs emulator at 1.3×)
- **Where:** `BookingConfirmedScreen.kt:92-95, 143-153`
- **What:** `Column` with `Spacer(weight(1f))`; at Hindi + large font on a short display the CTAs leave the viewport.
- **Fix:** `verticalScroll` + bottom-anchored CTA surface (the Slot picker already does this pattern, `SlotPickerScreen.kt:140-154`); unify on `controlLg`.
- **Verification:** emulator 720×1280 @ fontScale 1.3, hi.

### [P1] Waitlist rejects its own placeholder format and never shows why — NEW (regex/placeholder mismatch) + CARRIED:obs/customer.waitlist (silent validation) — confidence high
- **Where:** `WaitlistScreenContent.kt:185` (`"+91 98765 43210"`), `WaitlistViewModel.kt:312` (`^\+91[6-9]\d{9}$`), no `KeyboardOptions` anywhere in the file
- **What:** Typing what the field suggests keeps the button disabled with no message; default alpha keyboard.
- **Fix:** Normalise input (strip spaces, accept 10 digits and prepend +91), `KeyboardType.Phone`, `isError` + supporting text, pre-fill from session when full number is available.
- **Verification:** VM test `"+91 98765 43210"` → valid; golden `form_error`.

### [P2] Out-of-area refusal is styled as an error — NEW — confidence high
- **Where:** `AddressPickerScreenContent.kt:388-414` (`errorContainer`)
- **What:** "We don't serve this area yet" in red. The user did nothing wrong.
- **Fix:** `surfaceVariant`/tertiary container, a small Ayodhya-outline illustration, warm copy already present.

### [P2] Raw exception text reaches the user on five screens — CARRIED:obs/* (slot, summary, price approval, waitlist, address picker) — confidence high
- **Where:** `SlotPickerScreen.kt:211`; `BookingSummaryScreen.kt:443-447`; `PriceApprovalScreen.kt:270`; `WaitlistScreenContent.kt:140-144`; `AddressPickerViewModel.kt:108,187,208`
- **Fix:** Map `Throwable` → a small sealed `UiError(titleRes, bodyRes, retryable)` in each VM; never pass `message` through.

### [P2] Women-safe toggle appears after an async fetch and shifts the layout — NEW — confidence med
- **Where:** `BookingViewModel.kt:324-331`; `BookingSummaryScreen.kt:250-256`
- **What:** Visibility depends on a catalogue fetch that completes after first frame; the card pops in above the cash note.
- **Fix:** Resolve `safetyTag` before navigating to Summary (it is known at Service Detail) or reserve the slot with a placeholder.

### [P2] Booking ID is a raw string with no copy affordance — NEW — confidence high
- **Where:** `BookingConfirmedScreen.kt:111-115`
- **Fix:** Short human ID or last-6 chars, tap-to-copy, `labelLarge`.

### [P2] Slot picker uses raw M3 `Button`/`Card` while the rest of the funnel uses `Hs*` — CARRIED:obs/customer.booking-slot-picker — confidence high
- **Where:** `SlotPickerScreen.kt:144, 297`
- **Fix:** `HsPrimaryButton`, `HsSectionCard`; drop the duplicated app-bar title + `HsScreenTitle` pair (`:73` and `:118`).

### [P3] Back from Confirmed lands on Service Detail — NEW — confidence med (needs emulator)
- **Where:** `MainGraph.kt:370-372, 425`
- **What:** `popUpTo(BOOKING_GRAPH){inclusive}` removes the funnel but the entry below is Service Detail, which shows "Book now" again for the service just booked.
- **Fix:** `popUpTo(CatalogueRoutes.HOME)` and make Home's active-booking card the landing.

### [P3] `Lat 26.79, Lng 82.19` shown as an address when reverse-geocode fails — CARRIED:obs/customer.booking-address-picker — confidence high
- **Where:** `AddressPickerViewModel.kt:208`
- **Fix:** Show "Pin set — add a landmark below" and require the landmark field.

## G. Aspirational moves

1. **Order rail + receipt-as-hero.** One `HsBookingRail` on every step and a receipt card on Confirmed that
   *looks* like a receipt (service thumb, dotted rule, `₹599 · cash`). Reference: Apple Wallet pass /
   UC summary. Cost **M**. Dependency: pass price + name + image into `BookingViewModel` (none external).
2. **"आज / कल" slot strip with an "earliest available" default and a one-tap "Jaldi se jaldi" (ASAP)
   chip** that books the first open window. Reference: Snabbit/Pronto 10-minute framing. Cost **S**.
   Dependency: none (client-side over existing availability API).
3. **Landmark-first address sheet with Ayodhya presets** ("Hanuman Garhi", "Ram Path", "Naya Ghat" …) as
   quick chips, then house details, then a centre-pin map with "Use my location". Reference: Swiggy
   address flow + Rapido landmark search. Cost **M**. Dependency: API accepts `landmark`; local preset list.
4. **Confirmation moment:** 480 ms tick with haptic, then a live "Finding your technician" pulse card
   that turns into the technician's face + name + ETA in place (no navigation). Reference: Uber match
   animation, Cred success. Cost **M**. Dependency: motion tokens exist; needs assignment push already
   implemented (FCM).
5. **Fair-quote sheet for price approval:** before/after totals, technician card, reason + optional photo
   from the tech app, equal-weight choices, "Call technician" and "Talk to support" secondary actions,
   no biometric for cash. Reference: UC additional-work sheet. Cost **M**. Dependency: tech-app sends
   photo/reason (check E24 payload); API exposes base price on the pending-add-ons response.

## H. Strengths to preserve

- **Morning/Afternoon/Evening bucketing with past windows greyed** (`SlotPickerScreen.kt:224-248`,
  `SlotPickerViewModel.kt:422-432`) — the right mental model; only the labels are wrong.
- **Duplicate-tap guard and network-error retry on booking creation** (`BookingViewModel.kt:154-158,
  182-186`, `BookingSummaryScreen.kt:451-479`) — the commit path is robust.
- **Context-aware women-safe preference** (evening slots or safety-tagged categories,
  `BookingViewModel.kt:324-331`) — a genuinely differentiated trust feature; keep it, fix the timing.
- **Waitlist voice** ("No spam — promise." / "जिस दिन हम आपके क्षेत्र में शुरू करेंगे — हम SMS करेंगे।") and the
  legacy address privacy line — the only copy in the lane that sounds like a person.

## I. Questions for the owner

1. Is `customer.places-autocomplete.enabled` on in prod GrowthBook? The answer decides whether P0-3 or
   P0-4 is the live blocker. Both should be fixed, but one is urgent.
2. Cancellation policy for the pilot: is there one (free until X hours before, penalty after)? The summary
   cannot show what has not been decided.
3. Should price approval require any authentication at all for cash bookings, or is "tap Approve" the
   intended consent? Current behaviour asks for a fingerprint.
4. Expected time-to-assignment we are willing to promise on the Confirmed screen ("usually within 15 min")?
5. Should the funnel let a user book outside the 10 km radius with a warning (and land on the waitlist),
   or hard-refuse? Legacy currently allows it silently; Places variant refuses.

---

## Scorecard

| Screen | Specificity (0-4) | Craft (0-4) | Trust (0-4) | Hindi/field (0-4) | Gap-to-top-tier |
|---|---|---|---|---|---|
| Slot picker | 1 | 2 | 2 | 2 | machine dates/times, no Today/Tomorrow, no default, no rail |
| Address (legacy, live) | 0 | 1 | 1 | 2 | GPS-gated dead end, no landmark, free-text only |
| Address picker (Places) | 1 | 2 | 1 | 1 | empty map, no pin, no my-location, 12sp address, no error UI |
| Waitlist | 1 | 1 | 2 | 2 | rejects its own placeholder, terminal states with no exit |
| Booking summary (Ready) | 0 | 1 | 0 | 2 | no price, no inclusions, no cancellation, padlock for cash |
| Summary error / network states | 1 | 2 | 1 | 1 | raw messages, `BookingError` has no exit |
| Booking confirmed | 0 | 1 | 1 | 1 | instant cut, no recap, no ETA, not scrollable |
| Price approval | 1 | 2 | 0 | 1 | no exit, no totals, Approve-nudge, fingerprint for cash |
| Funnel navigation / process death | n/a | 0 | 1 | n/a | in-memory VM; dead tap / blank screen on restore |
| Pending-payment resume banner (home) | 1 | 2 | 2 | 3 | errorContainer for a neutral state; dormant in cash pilot |

Column means (10 rows; n/a excluded): Specificity **0.7**, Craft **1.4**, Trust **1.1**, Hindi/field **1.7**.
