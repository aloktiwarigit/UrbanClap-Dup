# 04 — Post-booking: bookings list, live tracking + SOS, rating, complaints, wallet, notifications

Reviewer lane 4 of 5 · baseline `main@6a79f198` (REL-3, customer 0.1.9) · 2026-09-26 · read-only.

**Evidence caveat, read first.** The three goldens in this lane (`*tracking_*`, `*rating_*`, `*complaint_*`)
were last committed 2026-05-03 / 05-23 / 05-03 (`git log -1 -- <png>`), i.e. **before** the marigold token
core landed on 2026-07-28 (`80bc37ed`, `primary = BrandAccent` in `Color.kt:155`). They render the superseded
forest-green/brass palette. Every snapshot test in this lane is `@Ignore`d ("record on CI Linux"), so nothing
has re-recorded them. I use the goldens for layout, hierarchy and copy only, never for colour. No emulator was
attached. States I could not see as pixels: bookings list (all states), SOS sheets, consent dialog, tracking
Loading / Assigned / Searching / Completed-with-UPI / with-map, rating shield + Hindi, complaint list, wallet,
no-show banner. Judgements on those are from source.

---

## Flow 1 — Bookings list (`ui/bookings/CustomerBookingsScreen.kt`)

**A. Specificity.** Interchangeable. A 20dp card with a status pill, price, service name, four grey icon rows
(date / time / address / payment) and stacked full-width buttons could ship in any booking app. Nothing says
"a person is coming to your home": no technician name or face, no "what's next" line, no photo.

**B. Top-tier gap — Urban Company "Bookings" tab.** UC splits Upcoming / Past, leads each card with the
professional's avatar + name + verification tick, gives the status a colour (green live, amber pending, grey
past), shows one contextual CTA per card, and puts Cancel/Reschedule under a visible overflow. Here: one flat
list (`bookings_subtitle` promises "Upcoming and completed" but the code has no grouping, `:148-171`), all
non-live statuses share one amber pill (`:290`), and there is no cancel anywhere.

**C/D/E.** Heuristics in the combined table below. Cognitive load: each card shows 7 information items plus
up to two full-width primary-weight buttons (`:213-216`, `:234-259`), all at equal visual weight; chunking and
hierarchy checklist items fail. Hindi: `bookings_rate_booking` "बुकिंग को रेट करें" and `bookings_file_complaint`
sit in 64dp/48dp buttons; `HsSecondaryButton` is the 48dp one that clips two-line Hindi (audit TOK-003,
CARRIED). Field: refresh is a 24dp icon-only `IconButton` (`:139-144`) against the design-language
"icon + text" rule; list re-fetches on VM init, `LaunchedEffect`, and every `ON_RESUME` (`:74-86`, VM `:23-36`)
and each fetch replaces `Ready` with `Loading`, so on patchy 3G the list blanks to a skeleton every time Riya
returns from tracking.

## Flow 2 — Live tracking (`ui/tracking/LiveTrackingScreen.kt`, `LiveTrackingViewModel.kt`)

**A. Specificity.** Interchangeable, and the golden confirms it: name in `headlineSmall`, two default
`AssistChip`s ("Work in progress", "ETA 12 min"), a 300dp pale block reading "Live location will appear here",
then a "Service progress" card with four square dots. No photo, no badge, no rating, no photo of the work.

**B. Top-tier gap — Uber trip screen / Urban Company "Professional on the way".** Both pin a card with the
person's face (56–72dp), name, a verification tick, star rating, and a one-line ETA sentence ("Ravi is 12 min
away") above everything else, and keep it visible while the status changes underneath. Here the face exists
only inside `TrustDossierCard` (`ui/shared/TrustDossierCard.kt:166`, 68dp avatar or initial), rendered
**fourth** in the column after header, 300dp map/placeholder and progress card (`:229-243`); the model has no
aggregate rating at all (`TechnicianProfile` carries `lastReviews` only); `techPhotoUrl` is in the UI state
(`LiveTrackingUiState.kt:9`) and never drawn. The status chip label comes from a hardcoded English `when`
(`:439-454`, with a `TODO(E12-S02a)`), so a Hindi user reads "Technician on the way" in English while
`status_technician_on_way` = "तकनीशियन रास्ते में" sits unused in `values-hi/strings.xml:201`. The timeline
(`:402-433`) is four stages with 10/14dp squares (`shapes.extraSmall`), no connector, no timestamps, no "next"
sentence; for Assigned/Searching `activeIndex` is -1 so every dot is grey. ETA chip renders whenever
`etaMinutes` is non-null (`:303-305`) — the golden shows "ETA 12 min" **during** "Work in progress".
`liveCapturedAt` is plumbed (`LiveTrackingViewModel.kt:70`) and never rendered, so a 20-minute-old position
looks live. Loading is a bare `CircularProgressIndicator` (`:207-211`) against the state-grammar rule.

Answering the lane question directly: **when the technician is assigned Riya sees a name (or "Your
technician"), an English status chip, and — if she scrolls past a 300dp empty block — a face and Aadhaar /
police badges. No rating, no ETA sentence, no photo above the fold.** That is not Uber/UC parity.

**C/D/E.** The emotional low point of the whole app is this screen between ASSIGNED and REACHED: a stranger is
minutes away and the dominant element is a placeholder. "What happens next" is nowhere in copy. Hindi header
chip is English (above). Sunlight: `onSurfaceVariant` secondary text throughout (audit A11Y-003, CARRIED).
One-hand: SOS is in the `TopAppBar` actions slot (`:108-131`), top-right, the least reachable point on a 6.5"
phone. Offline: no state; the flow just stops updating with no indication.

## Flow 3 — SOS (`SosBottomSheet.kt`, `SosConsentDialog.kt`, `SosViewModel.kt`)

**July P0s re-verified — all CARRIED-FIXED, no regression:**

| July id | Status | Evidence |
|---|---|---|
| SAFE-SOS-001 dismiss cancels SOS | FIXED | `SosBottomSheet.kt:40-43` `onDismissRequest = {}` + `shouldDismissOnBackPress = false`; cancel only via explicit button `:76-80` |
| SAFE-SOS-002 SOS only in IN_PROGRESS | FIXED | `BookingStatusSosEligibility.kt:23-28,42-43` Assigned/EnRoute/Reached/InProgress/AwaitingPriceApproval/Unknown → true; wired `LiveTrackingScreen.kt:85-86` |
| SAFE-SOS-003 icon-only 24dp | FIXED | `LiveTrackingScreen.kt:112-130` `TextButton` icon + "SOS"/"मदद", `defaultMinSize(48.dp)`, error colour |
| SAFE-SOS-004 Send is brand-coloured peer | FIXED | `SosBottomSheet.kt:70-74` `HsDangerButton`, cancel is `HsSecondaryButton` |
| SAFE-SOS-005 | REFUTED in July | `SosViewModel.kt:95-100` `onSendNow` still wired to primary |
| SAFE-SOS-006 evidence error discarded | FIXED | `SosBottomSheet.kt:141-182` shows reason + retry; VM `:230-242` retains bytes, re-entry guarded |

**A/B. Specificity and gap — Uber "Safety toolkit" / Ola "Emergency".** Those keep a shield-labelled control
at the bottom of the trip card, open a sheet that offers the emergency action in **one tap**, and never ask a
permission question at the moment of danger. Here, the first tap on SOS opens a **consent dialog about audio
recording** (`SosViewModel.kt:62-70` → `ShowConsent`), and if Riya taps "Allow" the VM emits
`RequestAudioPermission` (`:114`) which **no composable handles** — `SosOverlay`'s `else -> Unit`
(`LiveTrackingScreen.kt:194`) swallows it and `grep -rn RequestAudioPermission customer-app/app/src/main`
returns only `SosUiState.kt` and `SosViewModel.kt`. The countdown never starts; nothing appears on screen; and
because consent is now persisted `true` (`:75`), every later SOS tap takes the same dead path until the app
separately obtains `RECORD_AUDIO`. That is a P0 (details in F-1). Once past that, the countdown sheet itself is
good: 30 s grace, big red count, "Send now" danger, "Cancel alert" secondary, dismissal inert.

**C/D/E.** Consent-dialog scrim tap = `onDenied` (`SosConsentDialog.kt:16`) → stored as a permanent "no"
(`SosViewModel.kt:75`) with no path to change it. Hindi: label is "मदद" ("help") while English is "SOS"
(`values-hi:181` vs `values:214`); the icon is a warning triangle — three different metaphors for one
control. `sos_send_body` in Hindi keeps "Owner support" in Latin script. Reach: top-right.

## Flow 4 — Rating + shield (`ui/rating/RatingScreen.kt`, `RatingViewModel.kt`)

**A. Specificity.** Interchangeable — the golden is a generic feedback form: eyebrow pill, title, four labelled
star rows in a card, an outlined comment box with "23/500", one button.

**B. Top-tier gap — Uber post-trip rating / Zomato order rating.** One giant 5-star row (44–48dp targets)
with the driver's face and name; sub-attributes appear as **tap chips** only after a star is chosen; text is
optional; a tip strip follows; the whole thing is 2–3 taps. Here `canSubmit` requires all four rows
(`RatingViewModel.kt:220-226`), so the minimum is 4 taps and the button stays disabled with no explanation;
stars are `Text("★")` glyphs in `headlineSmall` with 6dp end padding (`RatingScreen.kt:413-421`), roughly
30×32dp targets; no technician name or face anywhere on the form; the tip is a `TODO(C-19)` (`:256-258`).
Sub-score labels "Skill quality"/"कौशल गुणवत्ता" are HR-form language for Riya.

**C/D/E.** The shield (`:332-375`) is genuinely good product thinking and the copy is clear in Hindi. Error
handling is the best in the lane: failures render above the button and preserve the form (`:233-235`,
`:268-290`); shield state survives process death (`RatingViewModel.kt:139-160`). The private-review chip
(`:377-401`) ticks every 60 s in `H:MM` and wraps a `SuggestionChip` with an empty `onClick`. Hindi: star
row labels wrap fine at `labelLarge`; "Ratings revealed / रेटिंग सामने आई" is abstract for a double-blind
concept nobody explained.

## Flow 5 — Complaints (`ComplaintScreen.kt`, `ComplaintListScreen.kt`, both VMs)

**A. Specificity.** Interchangeable — golden: eyebrow, title, dropdown, textarea, outlined "Attach photo"
button, one CTA. Any SaaS support form.

**B. Top-tier gap — Swiggy "Help with this order".** Reason chips with icons (Late / Not done / Behaviour /
Billing), one tap each; the order it concerns (service, date, technician) is shown at the top; photo attach
shows a thumbnail; success state names the SLA in a sentence and offers "Chat with support". Here the six
reasons hide in an `ExposedDropdownMenuBox` (`:164-184`); the booking is never shown; the 10-character
minimum (`ComplaintViewModel.kt:176`) is undisclosed so Submit is simply dead; a failed photo upload sets
`photoStoragePath = null` silently (`:109-113`) and the button just reads "Attach photo" again; while the photo
uploads the whole screen becomes `LoadingState` whose copy is "Submitting complaint" (`:102`, `:256`); the
error state prints `e.message` raw (`:272`, VM `:143`, `:166`).

Complaint **list**: card title is the raw server `reasonCode` (`ComplaintListScreen.kt:134`), date is the raw
ISO `createdAt` (`:157`), back button has `contentDescription = null` (`:65`), and tapping a card calls
`onComplaintClick(complaint.id)` (`:103`) into a route whose argument is `{bookingId}`
(`ComplaintRoutes.kt:4`, `MainGraph.kt` `complaintDestination`), so `ComplaintScreen.loadStatus(bookingId =
<complaintId>)` runs; unless the status use case tolerates that, the user lands on a blank new-complaint form
for the wrong entity (confidence med — I did not open the repository query).

**C/D/E.** Success state's countdown chip (`:231-234`, `ui/components/CountdownChip.kt`) ticks every second in
`HH:MM:SS` — a different component and format from the rating chip. Hindi copy is clean; "Owner support" is
Latin in four Hindi strings (`values-hi:254,266,268`).

## Flow 6 — Wallet + no-show credit (`WalletScreen.kt`, `NoShowCreditBanner.kt`)

**A. Specificity.** Interchangeable fintech ledger: gradient hero card with a balance, "Transaction History",
icon rows with +/− amounts.

**B. Top-tier gap — Cred "Rewards" / Swiggy "Money".** Both answer, on the screen, *what this money is and
when it will be used* ("Auto-applies at checkout"), tie each entry to the order that produced it, and speak the
user's language for dates. Here nothing explains a credit; the empty state is one line ("No transactions
yet."); each row is a server `entry.reason` string (`:265`); dates use `Locale.ENGLISH` (`:329`) so Hindi users
get "3 Sep 2026, 4:10 pm"; the hero gradient is `primary → Color(0xFF1A5C44)` (`:63`, `:172`) — since 07-28
`primary` is marigold, so this is a **marigold-to-forest-green gradient**, the two palettes the design language
says not to mix. Credit/debit colours are literals (`:61-62`). Balance uses `displaySmall`, an unmapped M3 slot
(audit TOK-002).

The **no-show moment** — Journey 2's emotional trough — is handled by a 5-second auto-dismissing toast
(`NoShowCreditBanner.kt:32,46-49`) with hardcoded `14.sp` (`:78`) reading "You received ₹500 credit! Will apply
on next booking." An exclamation mark and a wallet icon at the moment a technician failed to show. Nothing
persistent tells her who is coming now; the bookings pill just says "Reassigning" in the same amber as
"Completed".

## Flow 7 — Notification → screen (`CustomerNotificationRouter.kt`, `PendingActionNavObserver.kt`)

Router parses four types (`:16-21`); `pendingActionNavRoute` (`PendingActionNavObserver.kt:40-44`) routes only
`ADDON_APPROVAL_REQUESTED` and `RATING_PROMPT_CUSTOMER`. `COMPLAINT_UPDATE` and `SUPPORT_FOLLOWUP` return
`null` (no navigation on tap), and tracking pushes "are handled by TrackingEventBus — not persisted"
(`:21`), so **the pushes that matter most ("Suresh is on the way", "reached", "no-show, finding replacement")
cannot land Riya on the tracking screen** from a tap. Cold-start `CustomerRouteResolver.kt:49-50` maps
`COMPLAINT_UPDATE → Complaint` with a complaintId into the bookingId route (same mismatch as Flow 5).

---

## C. Heuristics (0–4; `n/a` where the surface has no such affordance)

| # | Heuristic | Bookings | Tracking | SOS | Rating | Complaint | Wallet | Notif |
|---|---|---|---|---|---|---|---|---|
| 1 | Visibility of status | 2 | 2 | 2 | 3 | 2 | 3 | 1 |
| 2 | Match real world | 3 | 2 | 3 | 3 | 3 | 1 | 3 |
| 3 | User control | 1 | 2 | 3 | 3 | 2 | 3 | 2 |
| 4 | Consistency | 2 | 2 | 3 | 3 | 2 | 1 | 2 |
| 5 | Error prevention | 2 | 2 | 1 | 2 | 1 | n/a | n/a |
| 6 | Recognition | 3 | 3 | 2 | 3 | 2 | 2 | 2 |
| 7 | Flexibility | 1 | 1 | 2 | 1 | 1 | n/a | n/a |
| 8 | Aesthetic/minimal | 2 | 2 | 3 | 2 | 3 | 3 | n/a |
| 9 | Error recovery | 3 | 2 | 3 | 4 | 1 | 3 | 1 |
| 10 | Help | 1 | 1 | 2 | 2 | 2 | 1 | n/a |
| | **Total** | **20/40** | **19/40** | **24/40** | **26/40** | **19/40** | **17/32** | **11/24** |
| | Band | Acceptable | Poor | Acceptable | Acceptable | Poor | Acceptable | Poor |

Evidence for scores < 3 (one line each, grouped):
- Bookings — 1: `Loading` replaces `Ready` on every resume (VM `:29`); status pill colour carries no meaning (`:290`). 3: no cancel/reschedule; UNFULFILLED card has zero actions (`:234-259`). 4: `Color(0xFFB68A2C)` brass from the superseded palette (`:299`). 5: no confirmation surface exists because no destructive action exists. 7: no split, filter, or re-book. 8: 4 equal-weight icon rows + 2 stacked full-width buttons. 10: none.
- Tracking — 1: no last-updated, ETA during in-progress, spinner load. 2: English status chip in Hindi (`:439-454`); "Professional trust dossier" jargon. 3: back only; no call/chat/cancel. 4: chip + pill + timeline three status idioms. 5: no guard against acting on stale location. 7: one path. 8: 300dp placeholder dominates. 9: no offline/error state at all. 10: none.
- SOS — 1: post-"Allow" the UI goes silent (`LiveTrackingScreen.kt:194`). 5: consent + OS permission interposed at emergency; scrim = permanent deny. 6: top-right text control. 7: no long-press / lock-screen path. 10: body copy explains silent alert — ok but only inside the sheet.
- Rating — 5: all four rows mandatory with no hint (`RatingViewModel.kt:220-226`). 7: 20-star grid, no chips. 8: form, not a moment. 10: double-blind never explained.
- Complaint — 1: photo upload shows "Submitting complaint"; silent photo failure. 3: no draft, no cancel; success routes to Home. 4: second countdown component; raw codes in list. 5: hidden 10-char rule. 6: reasons in a dropdown. 7: one path. 9: raw `e.message`. 10: SLA sentence only after submit.
- Wallet — 2: no explanation of credit; English dates; server reason strings. 4: marigold→forest gradient; literals. 6: no link from a ledger row to its booking. 10: none.
- Notif — 1/9: complaint and tracking taps land nowhere. 3/4/6: only 2 of 4 types navigate.

## D. Cognitive load & emotional journey (lane-level)

Checklist failures: bookings card (chunking, hierarchy — 7 items + 2 CTAs); rating (one-thing-at-a-time — 4
parallel decisions gating one button); complaint (minimal choices — 6 hidden in a dropdown; working memory —
must recall which booking she came from, it is never shown). Decision points > 4 options: complaint reason
(6). High-stakes moments without reassurance: **stranger arrival** (no face/badge above fold, English status,
placeholder block); **no-show** (5 s toast, then an amber "Reassigning" pill identical to "Completed");
**emergency** (a permission question, then possible silence); **payment at completion** (UPI declaration card is
correct and honest — the disclaimer is the best copy in the lane — but arrives with no "service complete"
moment before it). Peak-end: the flow ends on a form (rating) or on "Ratings revealed / Thanks for keeping the
marketplace fair" — an abstract institutional sentence rather than a thank-you about *her* home.

## E. Hindi + field conditions (lane-level)

- Devanagari fit: no clipping seen in source paths that use `HsPrimaryButton` (64dp); `HsSecondaryButton`
  (48dp) is used 6× in this lane (`bookings_file_complaint`, `bookings_retry`, `tracking_file_complaint`,
  `sos_cancel_alert`, `complaint_attach_photo`, `rating_back_home`) and clips two-line Hindi (TOK-003
  CARRIED). Mixed-script money: `formatRupees` is used consistently — good.
- English leaks on Hindi routes: tracking header status chip (hardcoded); wallet dates (`Locale.ENGLISH`);
  complaint list reason codes and ISO dates; wallet `entry.reason`; "Owner support" in Latin inside 6 Hindi
  strings (`values-hi:188,217,254,266,268,310`).
- Sunlight: secondary text is `onSurfaceVariant` everywhere; A11Y-003 CARRIED. Amber pill text
  `#B68A2C` on `#F2E7CF` is roughly 2.9:1 (fails AA for 11sp `labelMedium`) — computed from hex, not measured.
- Font scale 1.3+: `NoShowCreditBanner` hardcodes `14.sp` (scales, but bypasses the ramp); rating stars are
  glyphs so they scale — targets grow with text, which is the one place hardcoding helps.
- One-hand: SOS top-right; bookings refresh top-right; rating/complaint submit at bottom — fine.
- Offline/slow: bookings error copy is excellent ("Your latest booking is still saved"); tracking has no
  offline state; no "last updated" anywhere; every resume blanks the bookings list.

---

## F. Findings

### [P0] SOS dead-ends after "Allow" on the audio-consent dialog — NEW — confidence high
- **Where:** `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/SosViewModel.kt:108-116`
  emits `SosUiState.RequestAudioPermission`; `LiveTrackingScreen.kt:166-195` handles every other state and
  swallows this one at `:194` (`else -> Unit`). `grep -rn "RequestAudioPermission\|onAudioPermissionResult"
  customer-app/app/src/main` → only `SosUiState.kt:8-9` and `SosViewModel.kt:104,114`.
- **What:** First SOS tap → consent dialog. Tap "Allow" → consent persisted `true` (`:75`) → `startCountdown`
  finds `RECORD_AUDIO` not granted → emits `RequestAudioPermission` and returns. No launcher exists. The
  sheet never opens, no snackbar, no countdown. Every subsequent tap repeats it because consent is remembered.
- **Why it matters:** The customer who said "yes, help me more" gets *nothing*. In the exact moment SOS exists
  for, the control looks broken. PR #293 fixed the four July P0s; this is a fifth that sits behind them.
- **Top-tier reference:** Uber never asks a permission inside the emergency flow; recording consent is a
  Safety-Toolkit setting.
- **Fix:** (1) In `SosOverlay`, handle `RequestAudioPermission` with `rememberLauncherForActivityResult
  (RequestPermission())` for `RECORD_AUDIO` and call `onAudioPermissionResult`. (2) Better: start the countdown
  **immediately** on tap regardless of audio, and request audio in parallel; if denied, proceed without it.
  (3) Move the consent question to booking-confirmed or Settings › Safety (see F-2).
- **Verification:** `SosViewModelTest` case: consent=true, permission not granted → UI test asserts the
  countdown sheet is visible within 1 s; emulator: fresh install → SOS → Allow → countdown appears.

### [P1] Audio-consent dialog is interposed at the moment of emergency; scrim tap is a permanent "no" — NEW — high
- **Where:** `SosViewModel.kt:62-70` (`onSosTapped` → `ShowConsent`), `:73-77` (`setAudioConsent(granted)`),
  `SosConsentDialog.kt:15-16` (`onDismissRequest = onDenied`).
- **What:** Up to three modal steps (consent → OS permission → countdown) before the 30 s grace even begins.
  Dismissing the dialog stores `false` forever; nothing in Settings can flip it.
- **Why it matters:** Riya, frightened, is asked a privacy question in Hindi legalese ("अलर्ट के साथ ऑडियो
  रिकॉर्ड करें?"). Every second of hesitation here is the cost.
- **Top-tier reference:** Uber Safety Toolkit — "Record audio" is opted into calmly, once, outside the trip.
- **Fix:** Ask on the booking-confirmed screen ("Extra safety: let us record 30 s of audio if you ever press
  SOS") and in Settings › Safety with a toggle; at SOS time never block. Treat dialog dismissal as "not now",
  not "never".
- **Verification:** `SosViewModelTest`: `onSosTapped` with `consent == null` → state is `Countdown` (not
  `ShowConsent`); a consent toggle exists in Settings golden.

### [P1] Tracking status chip is hardcoded English; Hindi strings exist and are unused — NEW — high
- **Where:** `LiveTrackingScreen.kt:302` calls `statusLabel(state.status)` → `:439-454` string literals with a
  `TODO(E12-S02a)`. Hindi equivalents: `values-hi/strings.xml:193-209`.
- **What:** The single most-read line on the highest-anxiety screen renders "Technician on the way" in English
  for a Hindi user.
- **Why it matters:** Design-language "Content" rule: no English-only status on Hindi routes. This is the
  status.
- **Top-tier reference:** UC renders status headlines in the app locale with the professional's name inline.
- **Fix:** Replace `statusLabel` with a `@Composable` mapping to the existing `status_*` resources and rewrite
  them as name-bearing headlines: "रवि रास्ते में हैं · 12 मिनट".
- **Verification:** Hindi Paparazzi golden of `TrackingBody` in `EnRoute`; unit test that no `BookingStatus`
  maps to a literal.

### [P1] At assignment there is no face, badge, rating or ETA sentence above the fold — NEW — high
- **Where:** `LiveTrackingScreen.kt:229-243` (order: header → 300dp map → progress card → `TrustDossierCard`);
  `:291-308` header draws name + two chips only; `LiveTrackingUiState.kt:9` `techPhotoUrl` unused;
  `TechnicianProfile.kt` has no aggregate rating field.
- **What:** The trust cues the PRD promises at Journey 1 ("Suresh, 4.8★, 340 jobs, DigiLocker-verified") are
  either below the fold (photo, Aadhaar/police chips, jobs count) or absent (rating, ETA sentence).
- **Why it matters:** Trust is Riya's #1 anxiety (brief). A stranger is arriving and the screen leads with an
  empty map.
- **Top-tier reference:** Uber trip card: 64dp photo, name, 4.9★, plate, verification, "Arriving in 4 min",
  pinned; UC: "Professional assigned" card with photo, rating, jobs, badges, ETA.
- **Fix:** New `TechnicianArrivalCard` at the top of `TrackingBody`: 72dp `ProfileAvatar` (reuse from
  `TrustDossierCard`), name `title.lg`, badges row, "N jobs · N yr", status headline with ETA, "Call"
  (masked) and "Safety" actions. Map/timeline move below. Gate ETA chip to `EnRoute` only. Aggregate rating
  needs an API field (owner question 2).
- **Verification:** New golden `liveTrackingAssigned_hi`, `liveTrackingEnRoute_hi`; assert avatar and badges
  render in the first 400dp.

### [P1] Bookings status pill has no colour semantics; brass literal from the superseded palette — NEW — high
- **Where:** `CustomerBookingsScreen.kt:59` (`WarningSoft = Color(0xFFF2E7CF)`), `:193-196`, `:284-302`
  (`Color(0xFFB68A2C)`), `:429-436` (`TRACKABLE_STATUSES`).
- **What:** Binary styling: five live statuses get `surfaceVariant`+`primary`; **every other** status —
  Completed, Closed, Cancelled, Unfulfilled, Payment pending, Searching, Reassigning — gets the same amber
  "warning" pill. Completed looks like a problem; Reassigning looks like Completed.
- **Why it matters:** A scannable list is the whole point of this tab; Riya must read every pill.
- **Top-tier reference:** UC/Zomato: green = live/on-track, amber = needs you / pending, grey = past, red =
  cancelled/failed.
- **Fix:** A `BookingStatusTone` enum (Live / Attention / Done / Failed / Neutral) mapped from
  `CustomerBookingStatus`, coloured from `HomeservicesColors.semantic` roles (success/warn/danger + muted);
  delete both literals.
- **Verification:** Golden with five cards (EnRoute, Completed, PendingPayment, Cancelled, Reassigning) light +
  dark; detekt rule forbidding `Color(0x` in `ui/`.

### [P1] Customer cannot cancel or reschedule a confirmed booking; UNFULFILLED is a dead card — NEW — high
- **Where:** `CustomerBookingsScreen.kt:234-259` (no cancel branch; UNFULFILLED / CANCELLED render zero
  actions), `LiveTrackingScreen.kt` (no cancel), `api/src/functions/bookings.ts` cancel handler:
  `if (booking.status !== 'PENDING_PAYMENT') return 409 BOOKING_NOT_CANCELLABLE`.
- **What:** Once paid, the only exit is to phone the owner. PRD FR at `docs/prd.md:930` requires that on
  UNFULFILLED the customer gets "reschedule, cancel for full refund, manual owner assignment"; the card offers
  nothing.
- **Why it matters:** "Is cancellation possible and humane?" — it is not possible. Plans change; a trapped user
  no-shows the technician instead, which costs Suresh.
- **Top-tier reference:** UC: Cancel/Reschedule in the booking card overflow with a plain fee sentence before
  confirm.
- **Fix:** Product decision first (owner question 1). Then: server allow cancel from PAID/SEARCHING/ASSIGNED
  with a policy window; client `BookingCardActions` gains "Cancel booking" (secondary, confirmation names the
  consequence per state grammar) and, on UNFULFILLED, "Reschedule" primary + "Refund and cancel" secondary.
- **Verification:** VM test for each status → allowed actions; golden of UNFULFILLED card with two actions.

### [P1] Rating is a four-mandatory-row form with ~30dp glyph stars, not a 10-second moment — NEW — high
- **Where:** `RatingViewModel.kt:220-226` (all four rows required), `RatingScreen.kt:216-224`, `:403-425`
  (`Text("★")` in `headlineSmall`, 6dp padding, `clickable`), `:253` (`enabled = canSubmit` with no hint),
  `:256-258` (tip TODO). Golden confirms the layout.
- **What:** Minimum 4 taps on sub-44dp targets before the button wakes up; no technician identity; sub-score
  vocabulary ("Skill quality") is evaluative jargon; no tip; no thanks.
- **Why it matters:** Rating is the peak-end moment and the marketplace's data engine; friction here lowers
  completion and biases toward only angry ratings.
- **Top-tier reference:** Uber: face + name, one 5-star row at 48dp, then compliment chips, then tip.
- **Fix:** Step 1: `TechnicianArrivalCard` compact header + one 48dp `HsStarRow` (proper `Icon` with
  `minimumInteractiveComponentSize`). Step 2: after a star, chips ("समय पर आए", "साफ़-सुथरा काम", "विनम्र" /
  negatives when ≤3★) that derive the three sub-scores; comment optional. Step 3: tip chips (C-19) once the
  ADR-0024 hook exists. Keep the shield exactly as is.
- **Verification:** Golden `ratingStep1_hi`; test that `canSubmit` is true after a single overall star.

### [P1] Complaint list → detail passes a complaintId into the `{bookingId}` route — NEW — med
- **Where:** `ComplaintListScreen.kt:100-104` (`onComplaintClick(complaint.id)`), `ComplaintRoutes.kt:4`,
  `MainGraph.kt` `complaintDestination` → `ComplaintScreen(bookingId = <that id>)` → `ComplaintViewModel.
  loadStatus(bookingId)` `:61-77`. Same mismatch for cold-start `CustomerRouteResolver.kt:49-50`.
- **What:** If the status query is by bookingId (I did not open the repository), the lookup misses and the
  user sees a blank "File a complaint" form instead of her existing complaint.
- **Why it matters:** She came to check on a complaint and is asked to file a new one.
- **Top-tier reference:** Swiggy help: ticket detail with timeline.
- **Fix:** Add `ComplaintRoutes.detail(complaintId)` and a `ComplaintDetailScreen` (status, SLA countdown,
  reopen). Route `COMPLAINT_UPDATE` there (see next finding).
- **Verification:** Nav test: list tap → detail shows the same complaint id; repository test confirms lookup
  key.

### [P1] Tracking and complaint pushes cannot land on their screens — NEW — high
- **Where:** `PendingActionNavObserver.kt:40-44` (only two types routed), `CustomerNotificationRouter.kt:21`
  (tracking types not persisted as pending actions).
- **What:** Tapping "Suresh is on the way" / "No-show confirmed, finding replacement" / "Complaint update"
  opens the app wherever it was. Only add-on approval and rating prompt deep-link.
- **Why it matters:** ux-design §10.5 specifies a "Track" action on FCM; Journey 2's recovery depends on the
  push taking her straight to the reassigned technician.
- **Top-tier reference:** Zomato/UC pushes always open the order/booking tracking screen.
- **Fix:** Add `BOOKING_STATUS_UPDATE` (or reuse the tracking type) with `bookingId` → `BookingRoutes.
  liveTrackingRoute`; `COMPLAINT_UPDATE` → complaint detail. Add "Track" action button on tracking pushes.
- **Verification:** `PendingActionNavObserverTest` cases for both types; manual: send a status push, tap,
  land on tracking.

### [P1] Wallet hero is a marigold→forest-green gradient; credits are never explained — NEW — high
- **Where:** `WalletScreen.kt:63` (`BrandGreenDark = Color(0xFF1A5C44)`), `:172`, `:61-62`, `:329`
  (`Locale.ENGLISH`), `:265` (`entry.reason`), `:286-297` (empty state).
- **What:** Since `primary` became `#E2A04A` (`Color.kt:155`, 07-28) the hero card blends the D1 brand into the
  rejected forest palette. The screen never says what a credit is, when it applies, or which booking earned it.
- **Why it matters:** "Does the wallet explain credits in plain Hindi?" — no. The ₹500 no-show credit is the
  product's reliability promise (C-11); it should read as a promise kept, not a ledger line.
- **Top-tier reference:** Swiggy Money / Cred rewards: balance + "auto-applies at checkout" + entry ↔ order
  link.
- **Fix:** Hero on `surfaceRaised` with marigold accent only; explainer row "यह क्रेडिट अगली बुकिंग पर अपने-आप
  लग जाएगा"; entries titled from `LedgerEntryType` via string resources with the booking's service name; dates
  via `DateTimeFormatter.ofLocalizedDateTime(...).withLocale(Locale.getDefault())`. Delete the three literals.
- **Verification:** Wallet golden light/dark/hi; unit test that no literal remains (detekt).

### [P1] Complaint form: hidden 10-char rule, silent photo failure, wrong loading copy, raw exception text — NEW — high
- **Where:** `ComplaintViewModel.kt:176` (min length), `:109-113` (`getOrNull()` swallows upload failure),
  `ComplaintScreen.kt:102` + `:256` (`PhotoUploading` shows "Submitting complaint"), `:272` and VM `:143,166`
  (raw `e.message`).
- **What:** Four state-grammar violations on one screen.
- **Why it matters:** A frustrated customer meets a dead button, a photo that vanished, and "Unknown error".
- **Top-tier reference:** Swiggy: inline "Tell us a bit more (10 characters)" hint; thumbnail with retry.
- **Fix:** `supportingText` on the description field showing the rule; dedicated `PhotoUploading` inline
  progress on the button; photo failure → inline error + retry; map exceptions to `complaint_error_*` resources.
- **Verification:** VM tests for each branch; golden `complaintPhotoFailed`.

### [P2] Location staleness and offline are invisible on tracking — NEW — high
- **Where:** `LiveTrackingViewModel.kt:70` (`liveCapturedAt`), `LiveTrackingScreen.kt:311-336` (never read),
  `:207-211` (bare spinner).
- **What / Why:** On patchy network a 20-minute-old pin looks live; no "last updated", no offline banner, and
  the loading state is a spinner where the grammar demands a skeleton.
- **Fix:** "अपडेट: 2 मिनट पहले" caption under the status headline; offline banner from a connectivity flow;
  skeleton mirroring the arrival card + timeline.
- **Verification:** Golden `liveTrackingStale`; VM test that `liveCapturedAt` surfaces.

### [P2] 300dp map placeholder dominates every state without a fix — NEW — high
- **Where:** `LiveTrackingScreen.kt:317-335`, `:373-399`.
- **What / Why:** Before `EnRoute` there is never a location, so the largest element on the screen is a pale
  block promising something that has not started. With no map-SDK budget beyond free tier, a status-first
  layout is the honest default.
- **Fix:** Collapse the map to 0dp until a fix exists; when it exists, 180dp with the arrival card overlapping
  its bottom edge (UC pattern). Placeholder becomes a one-line caption, not a hero.
- **Verification:** Golden `liveTrackingAssigned` shows no placeholder block.

### [P2] No-show reassurance is a 5-second toast — NEW — high
- **Where:** `NoShowCreditBanner.kt:32,46-49` (auto-dismiss), `:78` (`14.sp`), `CustomerBookingsScreen.kt:412`
  (`NO_SHOW_REDISPATCH` → "Reassigning" in the shared amber pill).
- **What / Why:** Journey 2's trough gets one transient line with an exclamation mark, then nothing persistent
  says a replacement is being found or that ₹500 is hers.
- **Fix:** Persistent `ReassignmentCard` on tracking and the booking card: "रमेश नहीं आ सके। ₹500 क्रेडिट जुड़
  गया। नया तकनीशियन ढूंढ रहे हैं…" with a wallet link and live dispatch status; drop the "!"; use the type ramp.
- **Verification:** Golden of the card in hi; VM test that the event is not cleared until the user dismisses.

### [P2] Bookings list triple-fetches on entry and blanks to skeleton on every resume — NEW — high
- **Where:** VM `:23-25` (`init { refresh() }`), screen `:74-76` (`LaunchedEffect(viewModel)`), `:77-86`
  (`ON_RESUME`), VM `:29` (`Loading` before fetch).
- **Fix:** Keep `Ready` while refreshing (`isRefreshing` flag + pull-to-refresh), fetch once per entry.
- **Verification:** VM test that a refresh from `Ready` never emits `Loading`.

### [P2] Two countdown components, two formats, one dead chip — NEW — high
- **Where:** `RatingScreen.kt:377-401` (`H:MM`, 60 s tick, `SuggestionChip(onClick = {})`),
  `ui/components/CountdownChip.kt:98-103` (`HH:MM:SS`, 1 s tick).
- **Fix:** One `HsCountdownChip(deadline, granularity)`; rating uses it with minute granularity.
- **Verification:** Delete the private composable; both screens compile against the shared one.

### [P2] SOS control is top-right, text-only, and its Hindi label means "help" — NEW — med
- **Where:** `LiveTrackingScreen.kt:108-131`; `values/strings.xml:214` "SOS" vs `values-hi:181` "मदद".
- **What / Why:** Least reachable point one-handed; "मदद" reads as customer support, while the sheet says it
  alerts owner support silently — the metaphors disagree. Not alarming, but not discoverable either.
- **Fix:** A persistent bottom "सुरक्षा" pill (shield icon + text, 48dp) on the arrival card, danger-tinted
  outline; keep the app-bar action as a secondary.
- **Verification:** Golden shows the pill in the bottom third; TalkBack label matches visible text.

### [P2] Timeline has no "what happens next", timestamps or connector — NEW — high
- **Where:** `LiveTrackingScreen.kt:402-433`, `:405-409` (four stages only).
- **Fix:** `HsTimelineStep`-based vertical stepper with Searching/Assigned included, timestamps, and a
  single next-step sentence under the active step ("अगला: रवि दरवाज़े पर फोटो भेजेंगे").
- **Verification:** Golden per stage in hi.

### [P3] Latin "Owner support" inside six Hindi strings; dossier jargon — NEW — high
- **Where:** `values-hi/strings.xml:188,217,254,266,268,310`; `values/strings.xml:46-50` ("Professional trust
  dossier", "Professional assigned before confirmation").
- **Fix:** "सहायता टीम"; rename dossier to "तकनीशियन की जांच" / "Verified technician".

### [P3] Complaint list shows raw reason codes and ISO dates; unlabeled back — NEW — high
- **Where:** `ComplaintListScreen.kt:134`, `:157`, `:65`.
- **Fix:** Map `reasonCode` via `ComplaintReason.displayLabel()`; localized date; `contentDescription =
  stringResource(R.string.tracking_back_desc)`.

### Carried from July (open, listed once)
| July id | Where in this lane | Status |
|---|---|---|
| TOK-005 raw colour literals | `CustomerBookingsScreen.kt` 2, `WalletScreen.kt` 3 (`grep -c "Color(0x"`) | CARRIED |
| TOK-002 unmapped M3 slots | `headlineSmall` (bookings/tracking/rating), `titleMedium`, `labelMedium`, `displaySmall` (wallet `:229`) | CARRIED |
| TOK-003 `HsSecondaryButton` 48dp clips Hindi | 6 call sites in lane (Flow E list) | CARRIED |
| TOK-004 off-grid spacing | bookings 18/14dp, tracking 3/6/14dp, rating 6dp | CARRIED |
| A11Y-003 `onSurfaceVariant` secondary text | every screen in lane | CARRIED |
| Design-language icon-only rule | bookings refresh `IconButton` `:139-144` | CARRIED (rule), NEW instance |

## G. Aspirational moves

1. **Technician Arrival Card as the spine of post-booking.** One component (72dp photo, name, badges, jobs,
   status headline + ETA, Call / Safety) reused on tracking (top), bookings card (compact), rating (header),
   complaint (context). Reference: Uber trip card / UC professional card. Cost **M**. Dependency: API aggregate
   rating field; otherwise none (photo, badges, jobs already in `TechnicianProfile`).
2. **"Service complete" moment before the UPI card.** Full-bleed marigold-tinted success with the technician's
   before/after photos (PRD C-5 says the tech app captures them), final price, then the UPI declaration, then
   "Rate Ravi". Reference: UC completion screen, Zomato "Delivered" confetti (light, 420 ms per motion token).
   Cost **M**. Dependency: photos API on the booking.
3. **Rating as a 3-step sheet with chips and tip.** Reference: Uber. Cost **S/M**. Dependency: tip endpoint
   (C-19, ADR-0024).
4. **Reassignment story card for no-show.** Persistent, name-bearing, credit-bearing, with live dispatch status
   and wallet link. Reference: Swiggy "We're finding a new partner" card. Cost **S**. Dependency: none (event
   bus + status already exist).
5. **Bookings tab = Upcoming / Past with tone-coloured pills and re-book.** Reference: UC Bookings. Cost **S**.
   Dependency: none.

## H. Strengths — preserve

- **SOS countdown sheet semantics** (`SosBottomSheet.kt:30-84`): inert dismissal, explicit cancel, always-on
  "Send now" in danger colour, silent-alert body copy in both languages. Post-#293 this is correct emergency
  UX; do not "simplify" it.
- **SOS eligibility fails open** (`BookingStatusSosEligibility.kt:20-53`): exhaustive `when`, `Unknown → true`
  with the reasoning written down. Keep the comment.
- **Rating error handling** (`RatingScreen.kt:233-302`, `RatingViewModel.kt:79-105,139-160`): specific,
  actionable copy in both languages, form preserved, shield restored after process death, escalation errors
  reported where the tap happened. Best error craft in the app.
- **UPI declaration disclaimer** (`tracking_payment_declaration_disclaimer`, en/hi): honest, specific, and
  tells her what to do. Model copy.
- **Bookings error copy**: "Your latest booking is still saved. Retry when the network is stable." — exactly
  the field-conditions tone the design language asks for.

## I. Questions for the owner

1. **Cancellation policy for paid bookings.** The API refuses anything but `PENDING_PAYMENT`. Is there a
   free-cancel window (e.g. > 2 h before slot), a fee, or owner-only? The client cannot offer humane
   cancellation until this is decided.
2. **Expose an aggregate technician rating?** PRD Journey 1 promises "4.8★, 340 jobs"; the profile model has
   no rating. Product call (rating-shield fairness vs trust cue).
3. **Is the technician app streaming live location in the pilot?** If not, the tracking screen should be
   status-first and the map removed until it is — the 300dp placeholder is currently the hero of the app's most
   anxious screen.
4. **Where should audio-evidence consent live** — booking confirmation, Settings › Safety, or both? It must
   leave the SOS tap path either way.
5. **Tipping (C-19) timing** — it is a `TODO` in the rating form; is it in scope for the next release?

## Scorecard

| Screen | Specificity (0-4) | Craft (0-4) | Trust (0-4) | Hindi/field (0-4) | Gap-to-top-tier |
|---|---|---|---|---|---|
| Bookings list | 1 | 2 | 1 | 2 | No upcoming/past split, no tech identity, no status colour, no cancel |
| Tracking (Assigned → En route) | 1 | 1 | 1 | 1 | English status, empty map hero, face below the fold, no ETA sentence |
| Tracking (In progress / Completed) | 1 | 2 | 2 | 2 | No work photos, no completion moment; UPI card honest but arrives cold |
| SOS entry + consent | 2 | 2 | 1 | 2 | Dead-end after Allow; permission question at the emergency |
| SOS countdown / evidence sheets | 3 | 3 | 3 | 3 | Bottom-anchored control and calmer post-send copy |
| Rating form | 1 | 2 | 2 | 3 | 4 mandatory rows, glyph stars, no face, no chips, no tip |
| Rating shield + states | 3 | 3 | 3 | 3 | Explain double-blind; end on a thank-you about her home |
| Complaint file + success | 1 | 2 | 2 | 2 | Dropdown not chips; hidden rule; silent photo failure; raw errors |
| Complaint list | 1 | 1 | 1 | 1 | Raw codes/dates; wrong id into detail route |
| Wallet + no-show banner | 1 | 1 | 1 | 1 | Palette clash; credit never explained; English dates; 5 s toast at the low point |

Row averages: Specificity **1.5**, Craft **1.9**, Trust **1.7**, Hindi/field **2.0**. Against the design-language
verification bar (≥ 3 on every lens), only the SOS countdown sheets and the rating shield pass.
