# Customer App — Principal UI/UX Review (2026-09-26)

Baseline: `main` @ `6a79f198` (REL-3, customer 0.1.9 / vc15). Method: five isolated reviewer agents,
one shared brief (`docs/design/ux-review-2026-09/00-brief.md`), one external benchmark from Codex
(`06-codex-benchmark.md`), orchestrator re-verification of every P0 in source before it entered this
document. Lane files carry the full evidence with `file:line` citations:

| Lane | File | Findings |
|---|---|---|
| Activation (splash, language, consent, auth) | `ux-review-2026-09/01-activation.md` | 1 P0 · 10 P1 · 5 P2 · 2 P3 |
| Discovery (home, list, detail, trust) | `ux-review-2026-09/02-discovery.md` | 1 P0 · 8 P1 · 6 P2 · 2 P3 |
| Booking funnel (slot → confirmed, price approval, waitlist) | `ux-review-2026-09/03-booking-funnel.md` | 4 P0 · 10 P1 · 5 P2 · 2 P3 |
| Post-booking (bookings, tracking, SOS, rating, complaint, wallet) | `ux-review-2026-09/04-post-booking.md` | 1 P0 · 10 P1 · 7 P2 · 2 P3 |
| System (tokens, components, IA, platform, account) | `ux-review-2026-09/05-system-platform.md` | 1 P0 · 9 P1 · 7 P2 · 3 P3 |

Predecessor: `uiux-audit-2026.md` (July). Its token phases (S-10…S-33) shipped; its per-surface craft
phase (S-40…S-44) shipped only S-40. This review is the post-token-core re-baseline against the
top-tier bar, not a re-count of July's defects. Carried items are tagged `CARRIED:` inside the lanes.

---

## 1. Verdict

**The app is a correct, tokenised, safety-conscious form. It is not yet a product someone would
choose.** Against the owner's bar ("comparable to modern top-tier apps in this sector") every lane
scores between 1 and 2 on a 0–4 scale; no screen cluster reaches the ≥3 line except two safety
sheets and the confidence-score row, which the real flow never reaches.

| Lane | Specificity | Craft | Trust | Hindi / field | Read |
|---|:-:|:-:|:-:|:-:|---|
| Activation | 0.8 | 1.5 | 1.6 | 1.7 | A permissions form with no brand moment |
| Discovery | 1.6 | 2.3 | 1.4 | 2.2 | S-40 helped; home still a glyph grid, trust card is a placeholder |
| Booking funnel | 0.7 | 1.4 | 1.1 | 1.7 | Commits money without showing the amount |
| Post-booking | 1.5 | 1.9 | 1.7 | 2.0 | The anxious screen has an empty map as its hero |
| System / platform | — | — | — | — | Impeccable Audit Health **10 / 20 — Acceptable** (A11y 2 · Perf 3 · Theming 2 · Conformance 2 · Adaptivity 1) |

Three facts explain most of the gap, and none of them is "the designers were lazy":

1. **The July craft phase never ran.** Tokens, money formatter, colour sweep and states shipped. The
   screens that were supposed to consume them (S-41 funnel, S-44 a11y) did not. The system is good; its
   adoption is thin: `HsSectionCard` has 1 customer usage against 90 raw `Surface(`; 4 hand-rolled
   list-row variants; 8 hand-rolled top bars.
2. **The visual regression net is switched off.** 30 of 39 customer Paparazzi classes are
   `@Ignore`d. The committed goldens date from May, show the superseded forest/teal palette, a Razorpay
   chooser and Bengaluru addresses. CI is green because it verifies nothing. Nobody has *seen* most of
   these screens in the marigold theme except on a phone, and the July emulator PNGs in
   `artifacts/uiux-2026/` are now UTF-16-corrupted and unreadable.
3. **Several journeys are wired to the wrong truth.** The trust moment has no technician id, the summary
   has no price, the data-export screen has no route, the SOS permission event has no handler. These are
   plumbing gaps between well-built parts, and they are cheap to fix once named.

---

## 2. P0 — fix before the next Play upload

Each item below was independently re-opened by the orchestrator; the four marked ★ were traced
line-by-line in this session, the rest are the lane's own high-confidence evidence.

| # | Defect | Where | Why P0 |
|---|---|---|---|
| ★ P0-1 | **SOS dead-ends after "Allow" on the audio-consent dialog.** `SosViewModel.startCountdown` emits `RequestAudioPermission`; no composable handles it (`LiveTrackingScreen.kt` `else -> Unit`), `onAudioPermissionResult` has zero callers, no `RECORD_AUDIO` launcher exists. Consent is persisted, so **every later SOS tap does nothing.** | `ui/tracking/SosViewModel.kt:66-79,105-116`, `LiveTrackingScreen.kt:194` | Safety. A customer who opted *in* to evidence recording has a disarmed SOS for the life of the install. |
| ★ P0-2 | **A wrong OTP ejects the user to phone entry and forces a new SMS.** `WrongCode` → full-screen `Error`; Retry nulls `currentVerificationId` → `OtpEntry(verificationId=null)` renders `PhoneEntryContent`. Three typos hit Firebase rate limiting. | `ui/auth/AuthViewModel.kt:298-309,372-380`, `AuthScreen.kt:146-159` | Activation. The single most common auth error becomes a dead end on the first screen. |
| ★ P0-3 | **Booking summary commits money without showing the amount.** `BookingUiState.Ready` carries slot, address, lat, lng and nothing else; the CTA is "Book with Cash". No inclusions, no cancellation line anywhere in the app. | `ui/booking/BookingUiState.kt:9-14`, `BookingSummaryScreen.kt` | Trust. Violates Codex benchmark table-stake #3 and the design language's own "no surprises" promise. |
| ★ P0-4 | **"Download my data" is unreachable.** `DataExportScreen` is complete; no `composable(LocaleRoutes.DATA_EXPORT)` is registered and `SettingsGraph.kt:60` passes `onDownloadData = null`, which hides the row. | `navigation/SettingsGraph.kt:56-64`, `AppNavigation.kt:45` | DPDP right-to-access is advertised in the privacy policy and cannot be exercised. One-line fix. |
| P0-5 | **The pre-booking trust moment does not exist in the real flow.** `serviceDetail(id)` passes no technician id, so `TrustDossierCard` is permanently `Unavailable` and `ConfidenceScoreRow` permanently `Hidden` on the conversion page, while the placeholder card still lists "Identity checked / Verified pro". | `navigation/MainGraph.kt:147`, `ui/catalogue/ServiceDetailScreen.kt` | The PRD's "Suresh, 4.8★, 12 min" is the product's core differentiator and it is a placeholder that over-claims. |
| P0-6 | **Process death mid-funnel breaks the flow silently.** `BookingViewModel` holds slot/address in memory, no `SavedStateHandle`; after restore Address→Next is a dead tap and Summary renders blank. | `ui/booking/BookingViewModel.kt`, `navigation/MainGraph.kt:350-352` | Sub-₹10k phones kill background activities routinely; this is the common path, not the edge. |
| P0-7 | **Both address screens dead-end.** Legacy (live default) requires GPS coordinates to enable Next, no manual fallback; Places variant shows no pin until a search succeeds yet tells the user to drag it. Neither has a landmark field, in a town where the landmark *is* the address. | `ui/booking/AddressScreen.kt:306`, `AddressPickerScreenContent.kt` | Funnel abandonment at the step with the least tolerance for confusion. |

---

## 3. The five structural moves

These are the changes that raise the whole app rather than one screen. Each lane's "aspirational
moves" section converges on them; they are the shape of Phase 4 as it should have been.

**M1 — A real shell: three-tab M3 `NavigationBar` + nested graphs.** Today the tab bar is
`var selectedNav by remember { mutableIntStateOf(0) }` inside `CatalogueHomeScreen.kt:226`; Home,
Bookings, Support and Profile are `when` branches. System Back from three tabs exits the app, rotation
and a language save snap to Home, deep links cannot reach a tab, TalkBack gets no `selected` state,
labels are 10 sp. Replace with **Home · Bookings · Account** (Support becomes a row in Account; the
Settings gear, Profile tab and Support tab currently triplicate the same rows), fade-through between
tabs, shared-axis on push, predictive back intact. Everything else inherits this. Cost M.

**M2 — The Technician Arrival Card as the post-booking spine.** One component (72 dp photo, name,
verification badges, jobs count, status headline in Hindi, ETA sentence, Call / Safety) rendered at the
top of tracking, compact on the bookings card, as the header on rating and complaint. Today at
assignment Riya sees a 300 dp "Live location will appear here" block, an English status chip
(`LiveTrackingScreen.kt:439-454`, Hindi strings exist unused) and the face below the fold. This is the
Uber/Urban Company pattern and the whole trust proposition of the product. Cost M; needs only the data
already in `TechnicianProfile` plus an aggregate-rating decision (owner Q2).

**M3 — Order rail + receipt-as-hero through the funnel.** Service thumb, name and price pinned on
every step (slot → address → summary → confirmed); summary as an itemised bill with "what's included",
cancellation line, a cash icon that means cash and a CTA that carries the number ("Book · ₹599");
confirmed as a 480 ms tick with haptic and a receipt card that turns into the assigned technician in
place. Requires passing price + name + image into `BookingViewModel` and a `SavedStateHandle`. Cost M.
Depends on owner Q3 (cancellation policy) and Q4 (assignment promise).

**M4 — Photo-first discovery, for real.** Home hero (one commissioned Ayodhya photo: technician at a
door, marigold accent) with the promise and a live number; search; a "फिर से बुक करें" rail from
`recentBookings`; category tiles fed by local drawables today so the GrowthBook flag can be turned on
independently of the dead-bucket fix; service list rows using the 13 hero photos already in the APK
(`PhotoFirstServiceCard` never consults the local map); an area-confidence card on detail that does not
need a technician id. The promo pager's "Book now →" CTAs currently have no `clickable`. Cost M.

**M5 — Activation as a brand moment.** SplashScreen API on marigold; one-screen "नमस्ते": full-bleed
photo, EN/हिं chip, phone field with `+91` pill and SIM hint, phone primary and Google/email behind
"और तरीके" (restores ADR-0005 ordering); OTP as six cells with the already-wired Firebase auto-read
surfaced ("SMS पढ़ रहे हैं…"), 30 s resend timer, in-place shake on a wrong code; consent moved
post-auth, defaults OFF, equal-weight buttons, address-privacy promise first. Cold-install to home
drops from 8 taps + 16 keystrokes to roughly 3 taps. Cost M; consent defaults need counsel (owner Q6).

---

## 4. Sequenced backlog

Waves are ordered by dependency, not by screen count. Every story is Sonnet-executable once the
owner questions in §6 are answered. Cost: S ≤ ½ day, M 1–2 days, L 3+ days.

### Wave 0 — P0 hotfix train (one release, ~1 week)

| Story | Scope | Cost |
|---|---|---|
| W0-1 | SOS: add `RequestAudioPermission` handler with a `rememberLauncherForActivityResult(RequestPermission)` → `onAudioPermissionResult`; move the audio-consent question out of the SOS tap path (Settings › Safety, and a one-time card on booking confirmed); scrim-tap on consent must not persist "no" | S |
| W0-2 | Auth: `WrongCode` stays on `OtpCodeContent` with inline error + attempts left; Retry keeps `verificationId`; throttle resend behind a 30 s timer | S |
| W0-3 | Data export: register `composable(LocaleRoutes.DATA_EXPORT)`, wire `onDownloadData`; delete `PrivacyAndDataScreen.kt` (dead duplicate) | S |
| W0-4 | Summary: carry `serviceName`, `price`, `heroImage` in `BookingUiState.Ready`; CTA "Book · ₹N"; cash icon; cancellation line (text per Q3) | S |
| W0-5 | Funnel: `SavedStateHandle` in `BookingViewModel`; Address→Next never a dead tap; Summary never blank | S |
| W0-6 | Address: manual entry always enabled; landmark field (required copy: "घर के पास की पहचान: मंदिर, स्कूल, दुकान"); Places pin shown at current location with "Use my location"; reverse-geocode failure shows a sentence, not `Lat 26.79` | M |
| W0-7 | Detail: call confidence without `technicianId` (or area endpoint) so the trust slot shows *something true*; "Unavailable" copy stops asserting checks that are not performed | S (client) + S (API) |
| W0-8 | Golden reset: un-`@Ignore` the 30 classes, extract `*Content` composables where `ModalBottomSheet` blocks capture (pattern from S-33), record on CI in en+hi, light+dark, fontScale 1.0 and 1.3; delete the May goldens | M |

Exit: zero P0 open; `verifyPaparazziDebug` verifying ≥ 39 classes; goldens visibly marigold.

### Wave 1 — Shell and system (M1 + design-system depth)

W1-1 `NavigationBar` + nested graphs (Home · Bookings · Account), fade-through/shared-axis via the
existing motion tokens (currently zero consumers). W1-2 Collapse Settings/Profile/Support into Account.
W1-3 Component layer: `HsListRow`, `HsTopBar`, `HsAvatar`, `HsStatusPill` (with tone semantics),
`HsOtpCells`, `HsCallout`, `HsBookingRail`, `HsTechnicianCard`; migrate the 4 list-row and 8 top-bar
hand-rolls. W1-4 A11y sweep: every back/gear/icon gets `contentDescription`, 48 dp minimum, `selected`
semantics, `imePadding` on fixed bottom bars. W1-5 Delete-account flow onto `errorContainer` /
`HsDangerButton`, Hindi countdown plural. W1-6 Detekt: promote the token ratchet to a rule; make the
gate hard-fail when `python` is missing rather than pass silently. W1-7 Extend `TokenGallery` into an
`Hs*` component gallery recorded on CI in both themes and locales — the design contract subagents build
against.

Exit: Impeccable health ≥ 14/20; zero `contentDescription = null` on interactive controls; every
`Hs*` component has a golden.

### Wave 2 — Discovery and funnel craft (M3 + M4)

W2-1 Home hero + search + book-again rail + tappable promos + skeleton only where data is likely.
W2-2 Category tiles from local drawables; flag on. W2-3 Service list photo rows, category context, 48 dp
CTA. W2-4 Slot picker: "आज / कल" strip, 12-hour localised windows, earliest-available default, ASAP chip.
W2-5 Address sheet: saved addresses, landmark presets (Hanuman Garhi, Ram Path, Naya Ghat…), receiver
phone. W2-6 Summary bill + order rail. W2-7 Confirmed moment (tick, haptic, receipt → technician
in place). W2-8 Price approval as a fair-quote sheet: before/after totals, reason, equal-weight choices,
"Call technician", no biometric for cash. W2-9 Out-of-area as a warm waitlist hand-off, not an error.

Exit: Discovery and funnel lanes average ≥ 3.0 on the scorecard in a re-run of this review.

### Wave 3 — Post-booking trust (M2)

W3-1 Technician Arrival Card everywhere. W3-2 Tracking status-first (map only when the tech app is
actually streaming; owner Q5), Hindi status, "what happens next", timestamps, staleness/offline. W3-3
Bookings tab Upcoming/Past, tone-coloured pills, re-book, cancel/reschedule per policy (Q3; needs API
to allow cancel beyond `PENDING_PAYMENT`). W3-4 Completion moment before the UPI card (work photos,
final price). W3-5 Rating as a 3-step sheet (big stars, chips, optional text, tip when C-19 lands).
W3-6 Complaint: chips not dropdown, visible 10-char rule, photo failure surfaced, fix the
complaintId→bookingId route mismatch. W3-7 Wallet: explain credits in one Hindi sentence, drop the
marigold→green gradient, no-show reassurance as a persistent card not a 5 s toast.

Exit: post-booking lane ≥ 3.0; SOS reachable in every status with one tap and no dialog in the path.

### Wave 4 — Activation and delight (M5 + motion)

W4-1 Splash + one-screen नमस्ते. W4-2 OTP cells + auto-read surfacing. W4-3 Consent post-auth,
defaults per counsel. W4-4 Motion pass: NavHost transitions, confirmation choreography, arrival
haptic, count-up on wallet balance. W4-5 Sunlight/high-contrast expression toggle in Account.

Exit: activation lane ≥ 3.0; cold-install to home ≤ 4 taps; every lane ≥ 3.0; health ≥ 16/20.

---

## 5. The execution loop (how this gets built without regressing)

The July engagement proved that findings alone do not move the app: 214 verified findings produced a
token core and one craft story. The loop below is designed so that every wave closes with evidence,
and so that reviewer context never bleeds into builder context.

**Per story (inner loop)**

1. **Direction** — a 1-page design-direction brief written *before* code by the UI/UX architect agent
   (the mandatory first checkpoint in `feedback_uiux_review_gate`): reference screen, hierarchy,
   tokens used, states enumerated (loading / empty / error / offline / hi / dark / fontScale 1.3),
   motion, copy in both languages. Owner sees this; nothing else.
2. **Build** — Sonnet, TDD, `frontend-design` skill loaded, `Hs*` components only, no new literals
   (detekt rule from W1-6 makes this mechanical).
3. **Record** — Paparazzi goldens on CI for the enumerated states. The golden set *is* the acceptance
   test; a story without goldens is not done.
4. **Visual audit** — a fresh agent with only the brief + the goldens + `design-language.md`, scoring
   the story's rows on the same 4-column scorecard used here. Must return ≥ 3 on every row or the
   story loops to step 2 **once**; a second miss escalates to the owner instead of iterating.
5. **Codex review** (`codex review --base main`), then CI, then merge. One Codex round; fix in
   Claude; re-run once.

**Per wave (outer loop)**

- Re-run this five-lane review with the *same brief file* against the new `main`. Diff the scorecard
  and the health score. The delta, not the finding count, is the wave's report card.
- Any row that drops is a regression story at the top of the next wave.
- Update `SESSION-STATE.md` at the wave boundary only; per-story state lives in the PR.

**Fitness functions (ratcheted in CI where possible)**

| Signal | Today | Wave 2 | Wave 4 |
|---|---|---|---|
| Paparazzi classes verified (not ignored) | 9 / 39 | 39 / 39 + en/hi/dark/1.3× | + landscape, tablet |
| Impeccable health | 10 / 20 | ≥ 14 | ≥ 16 |
| Scorecard rows ≥ 3 | 3 / 50 | discovery + funnel lanes | all lanes |
| `Color(0x` literals in `ui/` | 24 (+18 constants) | 0 new (rule) | 0 |
| Interactive controls without `contentDescription` | ≥ 9 | 0 | 0 |
| Cold-install → home taps | 8 + 16 keys | — | ≤ 4 |

**Context-engineering rules that made this review reliable, keep them**

- One shared brief on disk; each agent gets a scoped file list and writes to disk before returning.
  The orchestrator reads headers, scorecards and aspirational sections, not transcripts.
- The orchestrator re-opens every P0 in source before it enters the report. Two July findings were
  costly precisely because the mechanism was right and the target wrong.
- Benchmarks come from an external model (Codex) so the reviewers are not grading against their
  own taste; the 12-row rubric in `06-codex-benchmark.md` is the tie-breaker for craft disputes.
- Five lanes, not thirteen. A 13-agent barrier lost all its returns once; five with disk writes lost
  nothing.

---

## 6. Decisions only the owner can make

1. **Approve the three-tab IA** (Home · Bookings · Account; Support becomes a row). Every other lane inherits it.
2. **Expose an aggregate technician rating** to customers? PRD promises "4.8★, 340 jobs"; the profile model has no rating field; the rating shield argues for fairness. Decides the shape of the Technician Arrival Card.
3. **Cancellation / reschedule policy for confirmed bookings.** API allows cancel only from `PENDING_PAYMENT`. Free window, fee, or owner-only? The summary and bookings list cannot show what is not decided.
4. **Assignment promise** for the Confirmed screen ("usually within 15 minutes"?).
5. **Is the technician app streaming live location in the pilot?** If not, tracking becomes status-first and the map goes until it is.
6. **Consent defaults** under DPDP §6: may analytics/crash default OFF and may consent move post-auth? Counsel question.
7. **"30-day guarantee"** appears on home and auth; PRD commits to 7-day fix warranty. Which is policy?
8. **Brand name.** HomeHeroo / Homeservices / होमसर्विसेज all ship in strings. Lock one.
9. **Photography.** Commission 1 hero + 5 category photos for Ayodhya now (unblocks M4 regardless of the dead-bucket fix)? The 13 existing service photos are good and unused.
10. **Dark mode** — supported pilot surface (fix, expose toggle) or force light until Wave 4? Today it is system-driven and visibly unfinished.
11. **Support line** `1800-123-456` — real and staffed? Hard-coded in two places.
12. **Price approval for cash** — should it require biometric at all?

---

## 7. What is genuinely good — protect it

- **Token core with contrast, scale and slot coverage under unit test**; 15/15 type slots with
  Devanagari line heights. Rare at this stage.
- **SOS countdown sheet semantics post-#293** (inert dismissal, explicit cancel, always-visible
  "Send now") and fail-open eligibility. Do not "simplify".
- **Firebase SMS auto-retrieval correctly wired** underneath the auth screen; the UI just has to show it.
- **Rating error craft** — specific bilingual copy, form preserved across process death.
- **Edge-to-edge and insets done properly** (55 inset calls across 24 files).
- **Women-safe preference, waitlist voice, UPI declaration copy, bookings offline copy** — the places
  where the product sounds like a person. That voice should spread.
- **Real service photography exists** (13 assets, Indian homes, uniformed technician). This is a
  plumbing problem, not an asset problem.

---

## 8. Evidence limits

- No emulator was attached. Pixel judgements use Paparazzi goldens where current (catalogue, detail,
  trust dossier, language card) and source only where goldens are May-era or ignored (auth, funnel,
  tracking, settings). Items marked `[needs emulator]` in the lanes are medium confidence.
- `artifacts/uiux-2026/screens/customer-app/*.png` are UTF-16-corrupted since `b925e083`; the XML
  dumps survive. Re-capture is part of W0-8.
- Complaint list → detail id mismatch and the Places-variant pin behaviour are medium confidence
  (repository query not opened; flag state in prod GrowthBook unknown).
