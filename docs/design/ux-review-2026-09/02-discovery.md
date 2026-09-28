# 02 — Discovery lane: home, catalogue, service list, service detail, trust dossier

Reviewer lane 2 of 5 · baseline `main` @ `6a79f198` (REL-3, customer 0.1.9) · 2026-09-26 · read-only.

Evidence used: source under `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/{catalogue,shared,booking}/`,
`navigation/MainGraph.kt` + `CatalogueRoutes.kt`, `values/strings.xml` + `values-hi/strings.xml`, the
current Paparazzi goldens for `catalogue_*`, `CustomerHomeScreen*`, `ServiceList*`, `ServiceDetail*`,
`ConfidenceScoreRow*`, `shared_TrustDossier*` (EN + Hindi, all states), the July inventory cluster
`docs/design/_inventory/C2.json`, and the bundled photo assets in `res/drawable*`.

**Blockers hit.** (1) No emulator; every "what Riya sees in prod" statement is derived from the code
path plus the known dead-bucket hazard, not a live capture. (2) The only prior emulator captures of a
post-language home (`artifacts/uiux-2026/screens/customer-app/post-language-emulator-hi-light-720x1600.png`,
`post-english-continue-…png`) are not PNGs — their first bytes are `ff fe fd ff 50 00 4e 00`, a UTF-16
transcoding of a PNG header — so they cannot be opened. (3) Photo-first goldens
(`PhotoFirstCategoryCardPaparazziTest`, `PhotoFirstServiceCardPaparazziTest`) are `@Ignore`d and have
no PNG; the photo-first path has never been pixel-verified. (4) The `CustomerHomeScreen*` goldens render
under M3 baseline purple (see the lavender "Active booking" card), not `HomeservicesTheme`, so they prove
layout only, not brand craft.

## 0. What Riya actually sees (prod path, not the golden)

| Surface | Code path that fires in prod | Result |
|---|---|---|
| Home category grid | `photoFirstCatalogueEnabled()` is a GrowthBook flag defaulting `false` (`FeatureFlags.kt:86`); test header says it "stays OFF in prod". `CatalogueHomeScreen.kt:433-437` → `CategoryCard` | Five bordered cream cards, one Material glyph each, name, "From ₹399". No photo, ever. Even with the flag on, all 5 category URLs 404 → `PhotoFirstCategoryCard.kt:487` icon fallback. **Home is never photo-first.** |
| Service list | Same flag → `ServiceListScreen.kt:150` `ServiceCard` | Text-only cards. The 13 hero photos already in the APK (`drawable-nodpi/service_hero_*.png`) are unreachable from this screen: `PhotoFirstServiceCard` reads only `service.imageUrl` (`:232-251`) and falls back to a two-letter initials tile (`:254-272`), never to the local drawable. |
| Service detail hero | `serviceHeroImageRes()` 13-entry map (`ServiceDetailScreen.kt:290-306`) → else `AsyncImage(service.imageUrl)` with no `error`/`placeholder` (`:198-205`) → else gradient | 13 services get a real photo. Anything else with a dead non-blank URL gets a **transparent hero**: cream background with a black gradient scrim and white text on top (medium confidence — Coil renders nothing on error without an error painter). |
| Trust dossier + confidence chips on detail | `ServiceList → serviceDetail(id)` passes no `techId` (`MainGraph.kt:147`, `CatalogueRoutes.kt:10-15`) → `ServiceDetailViewModel.kt:38,45,50` | In the real journey the dossier is **always `Unavailable`** and `ConfidenceScoreRow` is **always `Hidden`**. The "Suresh, 4.8★, 340 jobs, 12 min" moment from PRD Journey 1 never appears before booking. |
| Home durable hooks | `CustomerHomeViewModel` stays `Loading` until `getMyBookings()` returns (`:96-131`) | Every cold start paints four grey skeleton slabs above "Our services" (`DurableHooksSkeleton`, `CustomerHomeTabContent.kt:479-491`), then for most users (0 bookings) they vanish and the grid jumps up ~280dp. |

## 1. Home (`CatalogueHomeScreen.kt` + `CustomerHomeTabContent.kt`)

### A. Design specificity
Could ship unchanged under another brand: **yes**. Strip the wordmark literal `"HomeHeroo"` (`:480`)
and nothing on the first viewport says home-services, Ayodhya, or trust. The top of the screen is
wordmark + static location + gear; then either skeleton slabs or nothing; then a 2×N grid of icon
cards; the only photography (promo pager) is *below* the grid (`CatalogueTab` order `:350-377`). There
is no hero, no greeting, no search, no "book again", no live number (technicians online, jobs done this
week), no offer that works. Verdict: **generic utility grid, not a brand screen.**

### B. Top-tier gap — reference: Urban Company home (2026), Zomato home for the above-fold rhythm
- **Hierarchy.** UC opens with location as a *tappable* row, a persistent search field, then a
  horizontally scrolling photo-tile category strip, then one large editorial hero. Here the promo hero
  is item 4 of 5 and the trust strip is item 5; both are effectively hidden below the fold on a 720×1600
  device once the hooks skeleton has taken the top 280dp.
- **Imagery.** UC's category tiles are photographs of the actual service with a soft mask; the pilot
  categories here are `Icons.Default.Plumbing` etc. on tinted squares (`CategoryStyle.kt:264-268`).
  Real, market-appropriate photos exist in the APK for 13 services but none for the 5 categories.
- **Motion.** UC tiles ripple; category cards here use `pointerInput/detectTapGestures` with a 0.96
  scale (`:731-740`) — no ripple, no click semantics/role for TalkBack.
- **Trust cues.** UC puts "4.8 ★ (2.1k bookings)" on the tile and "UC Cover" on the hero. Here the trust
  strip is three 10sp chips ("Skill match", "Customer rated", "30-day guarantee" — `:659-700`) with no
  numbers behind them.
- **Copy.** Promo copy is hardcoded and seasonal in the wrong season: "AC service before summer" in
  September (`strings.xml:533`), a coupon "PEHLI" whose validity nobody can verify from the app.
- **Micro-interactions.** The promo CTA "Book now →" is a `Text` inside a `Box` with **no clickable
  modifier** (`:570-638`). Three banners, three calls to action, zero taps go anywhere.

### C. Heuristics (0–4)
| # | Heuristic | Score | Evidence |
|---|---|---|---|
| 1 | Visibility of status | 2 | Skeletons exist for grid and hooks, but hooks skeleton is shown for sections that are usually empty; pager auto-advances with no pause; no offline indication. |
| 2 | Match real world | 2 | `Icons.Default.Book` for "Bookings" (`:149`); a bell for every pending-action type (`CustomerHomeTabContent.kt:185`); unknown action types render `RATING_PROMPT_CUSTOMER`-style enum words even in Hindi (`:226-230`). |
| 3 | Control & freedom | 1 | "Cancel booking" on the payment banner fires `cancelPendingBooking` immediately with no confirmation (`CatalogueHomeScreen.kt:195-198`, `PendingBookingResumeBanner.kt:452-457`). Location not changeable. |
| 4 | Consistency | 2 | Radii 20/16/14/12/10 on one screen (`:728`, `CustomerHomeTabContent.kt:169,276,385,397`); mono font for prices vs sans everywhere else. |
| 5 | Error prevention | 2 | Retry exists now (`ErrorState`, `:924-946`); no undo on cancel. |
| 6 | Recognition vs recall | 2 | No search, no recents-as-shortcuts, no "book again" — repeat customers must re-navigate category → list → detail. |
| 7 | Flexibility | 1 | No search, no filters, no saved services. `catalogue_search_hint` is `tools:ignore="UnusedResources"` (`strings.xml:381`) — the July search bar was removed in S-40 (#310) rather than wired up. |
| 8 | Aesthetic & minimal | 2 | Airy, warm palette is right; but empty skeleton slabs, a duplicated card recipe and 10sp labels drag it. |
| 9 | Error recovery | 3 | Error copy human, retry present. Message from VM still discarded (`CatalogueHomeViewModel.kt:227`) — fine, since it is raw exception text. |
| 10 | Help & docs | n/a | — |

### D. Cognitive load & emotional journey
- Decision points >4: bottom nav (4) is fine; the grid is 5 categories — fine. The real problem is
  the opposite: **too little to decide with** (no price context beyond "From", no rating, no ETA).
- Emotional gaps: first open should be "curiosity + warmth" (ux-design §3). Instead a returning user's
  first frame is four grey slabs. A user with an unpaid booking sees a red `errorContainer` banner
  (`PendingBookingResumeBanner.kt:421`) — alarm colour for a recoverable state. Cognitive-load checklist
  fails: visual hierarchy, progressive disclosure (skeleton for absent content), single focus (three
  competing surfaces — hooks, grid, pager). **3 failures = moderate.**

### E. Hindi + field conditions
- Trust chips at **10sp** Devanagari (`:693`), nav labels **10sp** (`:858`): below any sunlight floor
  and below the D1 "body ≥16sp / label.sm 11sp" ramp. Hindi golden shows them legible only because
  Paparazzi renders at 1.0 scale indoors.
- English chip "30-day guarantee" still `maxLines=1` + ellipsis (`:696-697`) — A11Y-004 not closed.
- Category card is a fixed `148.dp` (`:706`) with a 2-line 15sp name + 13sp mono price; at fontScale
  1.3 the stack reaches ~139dp of 148 (icon row 36 + 8 + 2×23.4 + 3 + 21 + 24 padding); at 1.5 it clips.
- Mixed-script money "₹399 से" is correct; `formatRupees` handles grouping.
- Offline: no offline state at all in this lane — a cold start without network yields the generic
  "Something went wrong" (`catalogue_error`) with no "showing last catalogue" or "will retry".

## 2. Service list (`ServiceListScreen.kt`)

### A. Design specificity
Generic: title is the literal "Services" (`service_list_title`) — the category the user just tapped is
not named, not pictured, not counted. A gradient top bar unique to this screen (`:68-100`). Verdict:
**could be any catalogue app's list.**

### B. Top-tier gap — reference: Urban Company category page ("AC Repair & Service")
UC: category name + photo header, filter chips (Repair / Service / Install), each service row = photo
thumbnail, name, "4.81 (2.3M reviews)", price, duration, "Add" button, and a sticky cart. Here: subtitle
sentence, then N identical bordered cards with name / 2-line description / duration chip / mono price /
36dp pill (`:248-340`). No thumbnail although 13 hero photos exist in the APK. No rating, no review count,
no "most booked" badge, no filter, no sort. The 36dp button and the card share one `onClick` (`:150`,
`:268`), so the button is a decoy.

### C. Heuristics
| # | Score | Evidence (<3 only) |
|---|---|---|
| 1 | 3 | Skeleton mirrors layout; retry present. |
| 2 | 2 | Duration chip uses a wrench glyph (`Icons.Filled.Build`, `:354`) — a wrench for "60 min" is not a clock. |
| 3 | 3 | Back present. |
| 4 | 2 | Third header treatment in three screens (no bar → gradient bar → photo hero); CTA 36dp here vs 52dp on detail (`:318` vs `ServiceDetailScreen.kt:561`). |
| 5 | 3 | — |
| 6 | 2 | Category context lost; user must remember what they tapped. |
| 7 | 1 | No filter/sort/search. |
| 8 | 2 | Flat identical cards, no imagery. |
| 9 | 3 | Error state now matches empty-state craft (July inversion fixed). |
| 10 | n/a | |

### D/E. Load, Hindi, field
Three choices per category — low load, but the *comparison* the subtitle promises ("Compare fixed-price
services…", `:131-136`) has no comparable attributes beyond price and minutes. Hindi wraps cleanly in the
golden ("एसी गैस रीफिल"), 16sp names, 13sp descriptions (below D1 16sp body floor). "Book Now" at 36dp is
a thumb miss in a moving auto-rickshaw.

## 3. Service detail (`ServiceDetailScreen.kt`, `ConfidenceScoreRow.kt`)

### A. Design specificity
Better than the two screens above: photo hero with eyebrow/title/description, sticky price bar with a
52dp CTA. Still, everything below the hero is the same bordered rectangle four times (dossier, metric
tiles, quality panel, includes, add-ons — `CardShape` at `:71`, identical `Surface` recipe at
`:332-337`, `:368-373`, `:403-408`, `:434-439`). Verdict: **recognisably a services detail page, not
recognisably ours.**

### B. Top-tier gap — reference: Urban Company service detail
UC sells with, in order: photo *carousel* (3–6 shots, before/after), name + "4.82 ★ (1.2M reviews)" +
"₹599 · 60 mins", "What's included" as illustrated steps, "How it works", FAQ, then reviews with
photos, then the sticky "Add" bar. Here:
- **Photos:** one image, no carousel, no before/after although Journey 1 is built on them.
- **Rating/reviews:** none on the page. The dossier's `lastReviews` only renders when a tech is loaded —
  never in this flow. No service-level rating exists in the `Service` model at all.
- **Trust:** first card is a *promise* card — "Professional assigned before confirmation" with bullets
  "Identity checked / Background status / Reviewed jobs" (`TrustDossierCard.kt:105-132`, `:255-261`).
  Those bullets read as verified facts; they are section labels. Given dispatch does not check
  `kycStatus` (live hazard), "Identity checked" is currently an unbacked claim on the conversion page.
  The "Verified pro" metric tile (`:366-399`) is likewise static text with no data behind it.
- **Price transparency:** good — single price source in the sticky bar, add-ons as "+₹" pills. Missing:
  "what could change the price" trigger conditions the PRD specifies (only name + price per add-on,
  `:486-516`).
- **Micro:** hero back button 40dp (`:248`); sticky-bar support line truncates in English
  ("Trust checks shown before confirmati…", `:550-556`, visible in the EN golden) while Hindi fits.

### C. Heuristics
| # | Score | Evidence (<3 only) |
|---|---|---|
| 1 | 3 | Skeleton + retry; confidence chips have shimmer (dead path). |
| 2 | 2 | "Home-ready service" eyebrow (`service_detail_eyebrow`) is marketing filler that means nothing in Hindi ("होम-रेडी सेवा"); "Typical visit / 60 min" fine. |
| 3 | 3 | Back in hero; sticky CTA. |
| 4 | 2 | Sticky CTA 52dp pill vs list 36dp; mono price here (`:547`) vs sans price in `PhotoFirstServiceCard` (`:322`). |
| 5 | 3 | Add-ons "billed only after approval" copy is good prevention. |
| 6 | 3 | — |
| 7 | 2 | No share, no save, no "ask a question". |
| 8 | 2 | Five bordered rectangles of equal weight; hero does the only real work. |
| 9 | 2 | Error card has retry but no back affordance (hero back lives in Success branch only, `:238-256` vs `:582-616`). |
| 10 | 3 | Confidence methodology sheet (`ConfidenceScoreRow.kt:648-663`) is genuinely good — when it can show. |

### D. Cognitive load & emotional journey
Single decision (book or not) — good. The high-stakes reassurance ("who will come into my home") is
answered with a placeholder card. Emotional journey target "calm confidence: this person is real,
verified, skilled" (ux-design §3) is not delivered anywhere before payment in this lane. **Checklist:
2 failures (visual hierarchy, single focus) = moderate.**

### E. Hindi + field
Hero title uses `HsScreenTitle` (heading semantics, wraps). "सत्यापित पेशेवर" wraps to 2 lines by design
(`:394`); Devanagari body at 14sp in the includes list (`bodyMedium`) is under the 16sp floor. Sticky bar
support line ellipsis in EN. `aspectRatio(1.18f)` hero (`:187`) is ~330dp on a 393dp-wide device: fine
in portrait, but on a 720×1600 budget phone at fontScale 1.3 the title+description stack overlaps more of
the photo (scrim is fixed 160dp, `:228`).

## 4. Trust dossier (`shared/TrustDossierCard.kt`)

### A. Design specificity
Generic profile card. Header "Professional trust dossier" (`trust_dossier_title`) is internal
vocabulary — "dossier" is a police/HR word in English and transliterates as "डॉसियर", meaningless to Riya.

### B. Top-tier gap — reference: Urban Company professional sheet / Airbnb host card
Airbnb: large photo, name, "Superhost", "4.9 ★ · 312 reviews · 5 years hosting" as the headline row,
then verified-ID badge, then languages, then 2 review quotes with reviewer name and date. Here
(`ExpandedContent`, `:160-226`): 68dp initial-letter avatar (photo only if URL present — no
`error`/`placeholder`, `:329-334`), name, then "312 jobs, 5 yr exp" as `bodySmall` grey (`:176-182`), two
11sp badge pills, a "Trained by" pill, then certifications/languages/reviews as text blocks. There is no
star glyph anywhere; a rating renders as the sentence "Rated 4.8 out of 5" (`:210-214`). The strongest
number a home-services customer wants — rating × job count — is the smallest text on the card.

### C. Heuristics
| # | Score | Evidence (<3 only) |
|---|---|---|
| 1 | 3 | Loading/Error/Unavailable/Loaded all designed. |
| 2 | 1 | "Dossier"; "Background status" as a bullet with no status value; "Reviewed jobs" ambiguous. |
| 3 | n/a | |
| 4 | 3 | Uses `MaterialTheme.shapes`, zero colour literals — the cleanest file in the lane. |
| 5 | n/a | |
| 6 | 3 | — |
| 7 | 2 | No tap-through to full profile / all reviews / call. |
| 8 | 2 | Text-heavy, no rating hierarchy. |
| 9 | 3 | Error copy human. |
| 10 | n/a | |

### D/E
Unavailable state is where the stranger-arrival anxiety should be handled and instead it lists three
nouns. Hindi golden: "पुलिस वेरिफिकेशन पूरा" fits the 11sp pill at 1.0 scale; `maxLines=1` + ellipsis
(`:350-351`) will clip it first at fontScale 1.3. Languages come raw from the API `joinToString(", ")`
(`:200`) — not localised unless the API already sends Hindi.

## 5. Carried findings (compact — do not re-spend words)

| July id / inventory claim | Where now | Status |
|---|---|---|
| A11Y-004 "30-day guara…" chip truncation | `CatalogueHomeScreen.kt:693-697` | CARRIED |
| A11Y-002 money renders many ways | `PhotoFirstServiceCard.kt:385-387` `"₹${paise/100}"`; `PendingBookingResumeBanner.kt:441` + `strings.xml:521` `₹%2$d` | CARRIED (list/detail/home now use `formatRupees` — partially fixed) |
| TOK-005 colour literals | `CustomerHomeTabContent.kt:44-46,162-163,253,256` (7), `CatalogueHomeScreen.kt` (5 `Color.White/Black`), `PhotoFirstCategoryCard.kt` (3), `PhotoFirstServiceCard.kt:197` | CARRIED (down from 20 in home) |
| TOK-002 unmapped M3 slots / raw sp overrides | `CatalogueHomeScreen.kt:411,481,495,693,858`, `ServiceListScreen.kt:283,290,310` etc. | CARRIED |
| C2 settings button 42dp + `contentDescription=null` | `CatalogueHomeScreen.kt:502-517` | CARRIED |
| C2 category card `pointerInput` not `clickable` (no ripple/role) | `:731-740`, `PhotoFirstCategoryCard.kt:471-480` | CARRIED |
| C2 promo auto-advance, no pause-on-touch | `:552-562` (reduced-motion gate added — partial) | CARRIED |
| C2 glass nav alpha-only | `:812-813` | CARRIED |
| C2 static location string | `:494`, `strings.xml:382` | CARRIED |
| C2 flat-icon-card grid, `serviceCount`/`safetyTag` never rendered | `:709-789`; `Category.kt:7,9` | CARRIED |
| C2 service list: no imagery, 36dp CTA, card/button same onClick, no trust signals | `ServiceListScreen.kt:150,268,318` | CARRIED |
| C2 detail: no reviews/FAQ; identical bordered sections; back 40dp; includes unguarded | `ServiceDetailScreen.kt:158-163,248,332-460` | CARRIED |
| C2 detail hero 13-entry hardcoded map | `:290-306` | CARRIED |
| X2 dossier avatar `AsyncImage` no error handler | `TrustDossierCard.kt:329-334` | CARRIED |
| C2 home error state no retry; empty grid no state; bare spinner | `:883-946`, `:868-880` | **FIXED** in S-40 |
| C2 list error state naked Text | `ServiceListScreen.kt:202-245` | **FIXED** |
| X2 dossier `review.date.take(10)` | `:362-369` `formatReviewDate` | **FIXED** |
| C2 non-functional search bar | removed in #310 | **REGRESSED as a capability** — search now absent entirely (see F-03) |

## 6. Findings (NEW unless tagged)

### [P0] The pre-booking trust moment does not exist in the real journey — NEW — confidence high
- **Where:** `customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt:147`, `navigation/CatalogueRoutes.kt:10-15`, `ui/catalogue/ServiceDetailViewModel.kt:38,45,50`, `ui/catalogue/ServiceDetailScreen.kt:147-156`
- **What:** `ServiceListScreen` navigates with `serviceDetail(id)` and no `technicianId`, so `techId` is null, `confidenceScoreState` starts `Hidden`, `recommendedTechnicianId` is null and the dossier stays `Unavailable`. Both trust components on the detail page are therefore dead code in the only path users take; the detail page's first card is a permanent placeholder.
- **Why it matters:** Trust is Riya's #1 anxiety (brief; PRD Journey 1; ux-design Signature Moment 1). The screen that must answer "who is coming" answers with "we will tell you later".
- **Top-tier reference:** UC shows "Top professionals near you" with photo, rating, jobs on the detail page before add-to-cart; Airbnb shows the host card on the listing.
- **Fix:** Either (a) have the API return a `recommendedTechnicianId` (nearest online, skill-matched, KYC-approved) with the service detail and pass it to `loadProfile`, or (b) replace the Unavailable card with an honest *area* card fed by the confidence endpoint with GPS only: "12 verified technicians in Ayodhya · 94% on time · avg 4.7 ★" — the `ConfidenceScore` model already carries `onTimePercent`, `areaRating`, `nearestEtaMinutes`. Remove the Unavailable card from the top slot until one of these lands.
- **Verification:** Instrumented test on the list→detail route asserting `confidenceScoreState !is Hidden`; new golden `service_detail_success_state` showing a loaded dossier or area card.

### [P1] Home has no hero and no point of view; the only photograph is below the grid — CARRIED:C2 (flat-icon-card) + NEW ordering — confidence high
- **Where:** `ui/catalogue/CatalogueHomeScreen.kt:346-378` (item order), `:399-441` (grid), `:543-655` (pager), `:709-789` (icon card)
- **What:** First viewport = wordmark, static location, gear, skeleton slabs, "Our services", icon cards. The promo pager (the only imagery) is item 4; the trust strip item 5. With the flag off and category URLs dead, no photo appears above the fold in any state.
- **Why it matters:** ux-design §3 first-open goal is "curiosity + warmth"; the PRD calls for a photo-first home (C-15). This is the brand screen and it reads as a settings menu.
- **Top-tier reference:** UC home: tappable location → search → photo category strip → one editorial hero card → "Most booked" rail with rating and price.
- **Fix:** Reorder: greeting/location row → search → **one** hero (real Ayodhya photo, one message, one CTA that navigates) → category strip using local drawables as the category fallback (map `ac-repair`→`service_hero_ac_deep_clean` etc.) → "Book again"/recents → trust proof with numbers. Add `Category.localHeroRes` mapping alongside `serviceHeroImageRes` so dead URLs never produce a glyph tile.
- **Verification:** New home golden at 720×1600 shows a photo in the first viewport in Loading, Empty and Success; flag-off path asserted in `CatalogueHomeScreenTest`.

### [P1] Promo banners are non-interactive; their CTAs are decoration — NEW — confidence high
- **Where:** `ui/catalogue/CatalogueHomeScreen.kt:570-638` (page `Box` has no `clickable`), `:631-635` (CTA `Text`), `strings.xml:533-542`
- **What:** "Book now →", "Learn more →", "Apply coupon →" cannot be tapped. Copy is hardcoded and season-locked ("AC service before summer"); "10% off · coupon PEHLI" is a promise the client cannot verify and the booking flow may not honour.
- **Why it matters:** A CTA that does nothing teaches the user that the app is fake. A coupon that is not applied is a support call.
- **Top-tier reference:** Zomato/UC banners deep-link to a filtered list or pre-apply the offer with a confirmation toast.
- **Fix:** Give each `PromoBanner` a `route` and make the page `clickable(role = Button)`; drive banners from the API (or GrowthBook JSON) with start/end dates; drop the coupon banner unless a coupon engine exists. Pause auto-advance on touch (`pagerState.isScrollInProgress` / press).
- **Verification:** Compose UI test: tap page 0 → nav to `serviceList("ac-repair")`; owner confirms PEHLI or the banner is removed.

### [P1] Cold-start skeleton for content most users do not have, then a 280dp layout jump — NEW — confidence high
- **Where:** `ui/catalogue/CustomerHomeTabContent.kt:479-491`, `ui/catalogue/CustomerHomeViewModel.kt:96-131`, `ui/catalogue/CatalogueHomeScreen.kt:350-359`
- **What:** `Loading` paints four slabs (60+76+56+56dp + gaps) at the top of home until the bookings request returns; for a first-time or idle customer the `Ready` state hides all three sections and the grid snaps up.
- **Why it matters:** The first frame of the brand screen is grey rectangles; on patchy Ayodhya networks the slabs can persist for seconds, then everything moves under the thumb.
- **Top-tier reference:** UC/Swiggy skeleton only the surfaces that will render; "active order" cards slide in with `AnimatedVisibility` when they arrive, never pre-reserve space.
- **Fix:** Skeleton only the category grid (already done); render hooks with `AnimatedVisibility(expandVertically)` when `Ready` has content; if a cached bookings snapshot exists show it immediately.
- **Verification:** Golden `catalogue_home_success_state` with `homeUiState = Loading` shows no hook skeleton; UI test asserts no layout shift of "Our services" between Loading and Ready(empty).

### [P1] "Cancel booking" on the payment banner is one tap, no confirmation, red alarm styling — NEW — confidence high
- **Where:** `ui/booking/PendingBookingResumeBanner.kt:421,452-457`, `ui/catalogue/CatalogueHomeScreen.kt:195-198`
- **What:** `TextButton(onClick = onCancel)` calls `cancelPendingBooking` immediately. The banner uses `errorContainer` for a recoverable "payment pending" state.
- **Why it matters:** D1 state grammar: destructive actions require confirmation and name the consequence. A slip cancels the booking Riya spent 90 seconds building.
- **Top-tier reference:** Swiggy "Cancel order?" sheet with consequence copy; pending-payment shown in warning/brand tone, not error red.
- **Fix:** `HsConfirmSheet` ("Cancel this booking? Your slot will be released.") before cancel; switch container to `tertiaryContainer`/warm surface with a marigold left rule; format amount with `formatRupees`.
- **Verification:** UI test: tap Cancel → sheet visible, repository not called until confirm.

### [P1] The trust "Unavailable" card asserts checks that are not performed — NEW — confidence high
- **Where:** `ui/shared/TrustDossierCard.kt:105-132,255-261`, `strings.xml:49-53`, `ui/catalogue/ServiceDetailScreen.kt:366-399` ("Verified pro" tile)
- **What:** Bullets "Identity checked", "Background status", "Reviewed jobs" and a "Verified pro" metric tile render with no technician loaded. Dispatch does not filter on `kycStatus` (live hazard) and 0 of 17 technicians are KYC-approved.
- **Why it matters:** This is the conversion page making a safety claim the system cannot back. If a bad visit happens, this screenshot is the complaint.
- **Top-tier reference:** UC only shows "Background verified" on a specific professional after verification; Airbnb shows "Identity verified" per host.
- **Fix:** Rewrite Unavailable copy as future-tense, concrete: "Before your slot is confirmed we will show you your technician's photo, rating and ID check." Replace the static "Verified pro" tile with a data-backed metric (area rating or jobs completed) or with the duration+price pair. Never render a verification badge without a profile behind it.
- **Verification:** String review + golden; `ServiceDetailTrustDossierTest` asserts no "Verified"/"checked" text when `Unavailable`.

### [P1] No search, no recents, no "book again" — the repeat-booking path is as long as the first — NEW (search REGRESSED as capability) — confidence high
- **Where:** `ui/catalogue/CatalogueHomeScreen.kt:443-538` (header has no search), `strings.xml:381` (`catalogue_search_hint` unused), `ui/catalogue/CustomerHomeTabContent.kt:376-457` (recent card offers "Rate"/"Complaint" only)
- **What:** The July home had a (non-functional) search field; S-40 removed it. Recent bookings expose a "Complaint" chip as the default action once rated — the only re-engagement affordance on the screen is negative.
- **Why it matters:** Riya books 1–3×/month; PRD C-3 (one-tap re-book) is the retention lever. A "Complaint" button on every completed job primes dissatisfaction.
- **Top-tier reference:** UC "Book again" rail with the last service's photo and price; Zomato "Order again".
- **Fix:** Add a "Book again" primary chip on `RecentBookingCard` routing to `serviceDetail(serviceId)`; move "Complaint" into the bookings tab detail. Add a real search (client-side over the localised catalogue is enough at 14 services) — the strings already exist in EN/HI.
- **Verification:** UI test: tap "Book again" → detail of the same service; golden shows the chip.

### [P1] Service list ignores the 13 photos already in the APK — CARRIED:C2 (no imagery) + NEW mechanism — confidence high
- **Where:** `ui/catalogue/ServiceListScreen.kt:144-151,248-271`; `ui/catalogue/PhotoFirstServiceCard.kt:232-272`; `ui/catalogue/ServiceDetailScreen.kt:290-306` (private map)
- **What:** Flag-off cards are text-only; flag-on cards load only `imageUrl` and fall back to a two-letter initials tile, never to the local `service_hero_*` drawable that the detail page uses for the same id.
- **Why it matters:** The purchase decision is made here with zero imagery while real, market-appropriate photos ship in the binary.
- **Top-tier reference:** UC list rows carry a 72dp photo thumbnail; the photo is the scan anchor.
- **Fix:** Lift `serviceHeroImageRes` into `PhotoFirstImageResolver.kt` as `localHeroFor(serviceId)`; resolve order local → CDN → placeholder for both cards; make the default `ServiceCard` a leading-thumbnail row regardless of the flag.
- **Verification:** New golden `service_list_success_state` with thumbnails; unit test on the resolver order.

### [P1] Primary tap targets and labels below floor — CARRIED:C2 (36dp CTA, 42dp gear, 40dp back) + NEW 10sp labels — confidence high
- **Where:** `ui/catalogue/ServiceListScreen.kt:318` (36dp), `ui/catalogue/CatalogueHomeScreen.kt:506` (42dp), `:693` (10sp chips), `:858` (10sp nav), `ui/catalogue/ServiceDetailScreen.kt:248` (40dp)
- **What:** Three primary controls under 48dp; two label families at 10sp Devanagari.
- **Why it matters:** Sunlight + sub-₹10k screens + one hand; D1 minimum label.sm is 11sp and buttons 44dp+.
- **Fix:** `HsPrimaryButton` (defaultMinSize 48) for list CTA; `Size.kt` touch token for icon buttons; labels to `labelSmall` 11/16 minimum, nav to 12sp.
- **Verification:** Accessibility Scanner run on home/list/detail; goldens at fontScale 1.3.

### [P2] Money set in JetBrains Mono on customer surfaces — NEW — confidence med
- **Where:** `ui/catalogue/CatalogueHomeScreen.kt:782`, `ui/catalogue/ServiceListScreen.kt:312`, `ui/catalogue/ServiceDetailScreen.kt:547`
- **What:** D1 assigns mono to "admin numeric" only. In the goldens "₹1, 299" shows a visible gap after the comma and the price reads typewriter-like next to Geist body.
- **Why it matters:** Price is the most-read glyph run in the app; it should feel premium, not terminal.
- **Fix:** Geist Sans SemiBold with `FontFeatureSettings("tnum")` for tabular figures; keep mono for admin.
- **Verification:** Golden diff on list/detail.

### [P2] Service list has no category context — NEW — confidence high
- **Where:** `ui/catalogue/ServiceListScreen.kt:78-83`, `strings.xml:13`
- **What:** Title "Services"; the category name, photo and count are not shown; `Category.serviceCount` exists and is unused.
- **Fix:** Pass category name (and local hero) via route or VM; header = photo band + "AC Repair · 3 services".
- **Verification:** Golden shows category name in header.

### [P2] Sticky-bar support line truncates in English — NEW (mirror of A11Y-004) — confidence high
- **Where:** `ui/catalogue/ServiceDetailScreen.kt:550-556`, golden `…ServiceDetailScreenTest_service_detail_success_state.png`
- **What:** "Trust checks shown before confirmati…" at `maxLines=1`; Hindi fits.
- **Fix:** Drop the line (it restates the promise card) or allow 2 lines with the CTA top-aligned.
- **Verification:** EN + HI goldens at fontScale 1.0 and 1.3.

### [P2] Pending action cards are undifferentiated and can leak enum names — NEW — confidence high
- **Where:** `ui/catalogue/CustomerHomeTabContent.kt:185,200,226-230`
- **What:** Every type uses the bell icon and "Tap to continue"; unknown types render `type.name` prettified in English regardless of locale.
- **Fix:** Icon + verb per type (star for rate, rupee for approve, chat for complaint); fall back to a localised generic string.
- **Verification:** Unit test with an unknown `PendingActionType` in `hi` locale asserts no ASCII words.

### [P2] Dead non-blank hero URL yields a transparent hero — NEW — confidence med
- **Where:** `ui/catalogue/ServiceDetailScreen.kt:198-205`
- **What:** `AsyncImage` has no `error`/`placeholder`; when the CDN 404s (most pre-E22 URLs), the hero is background colour + black scrim + white text.
- **Fix:** `error = painterResource(localHeroRes ?: R.drawable.hero_fallback)`; ship one generic warm fallback illustration.
- **Verification:** Paparazzi with a failing image loader; emulator against prod for a non-mapped id.

### [P2] No offline/slow-network state anywhere in the lane — NEW — confidence high
- **Where:** `ui/catalogue/CatalogueHomeScreen.kt:924-946`, `ServiceListScreen.kt:202-245`, `ServiceDetailScreen.kt:582-616`
- **What:** All three error states are the same generic copy; nothing distinguishes offline, nothing says what will retry, no cached catalogue is shown.
- **Fix:** Detect connectivity in the VM; copy "You're offline — showing last saved services" with a stale badge; auto-retry on reconnect.
- **Verification:** UI test with airplane-mode fake; golden for offline.

### [P3] Semantic icon mismatches — NEW — confidence high
- **Where:** `ui/catalogue/CatalogueHomeScreen.kt:149` (book icon for Bookings), `ServiceListScreen.kt:354` and `PhotoFirstServiceCard.kt:369` (wrench for duration)
- **Fix:** `Icons.Outlined.ReceiptLong`/`EventNote` for bookings; `Schedule` for duration.

### [P3] "Dossier" vocabulary — NEW — confidence med
- **Where:** `strings.xml:46-48`, `values-hi/strings.xml:34-36`
- **Fix:** "Your technician" / "आपका तकनीशियन"; keep "trust" in the body, not the title.

## 7. Aspirational moves

1. **Hero that is the promise.** One full-bleed Ayodhya photo (technician at a customer's door,
   marigold uniform accent), overlay: "Verified technician at your door in 45 min" + live number
   ("11 online now"). Ref: UC home hero / Airbnb "Live anywhere". Cost M. Dependency: 1–2 commissioned
   photos, `GET /area-stats` (or reuse confidence endpoint with GPS).
2. **Area confidence card on detail, pre-tech.** "In Ayodhya: 94% on time · 4.7 ★ · nearest ~12 min"
   with the methodology sheet already built. Ref: UC "Top professionals near you". Cost S. Dependency:
   call `getConfidenceScore` without `technicianId` (API change or new endpoint).
3. **Book-again rail.** Horizontal cards from `recentBookings` with the service photo and last price,
   one tap to slot picker. Ref: Zomato "Order again". Cost S. Dependency: none (data already on home).
4. **Photo-led service rows + detail carousel.** Thumbnail rows now (local drawables); 3-shot carousel
   (service, tools, before/after) on detail. Ref: UC service detail. Cost M. Dependency: 2 extra photos
   per service, `Service.images: List`.
5. **Shared "sheet" motion for tab and detail transitions.** 200–220ms emphasized-decelerate content
   settle on tab switch and a shared-element hero from list thumbnail to detail. Ref: Airbnb listing
   open. Cost M. Dependency: `HomeservicesMotion` tokens (currently dead per TOK-001).

## 8. Strengths — preserve
- **Single price source + sticky 52dp CTA on detail** (`ServiceBookingBar`, `:519-579`): price, label,
  CTA in one thumb zone; "Any extra work needs your approval first" is exactly the right prevention copy.
- **State grammar largely met on home/list/detail** since S-40: skeletons mirror layout, retry present,
  empty state is calm and local-language.
- **Confidence methodology sheet** (`ConfidenceScoreRow.kt:648-663`): honest, plain-language explanation
  of on-time/area/ETA — rare in this sector; it just needs to be reachable.
- **TrustDossierCard hygiene:** tokens only, `formatReviewDate` locale-safe, both locales golden-covered.
- **Real service photography exists** (13 assets, Indian homes, uniformed technician, correct tools).
  Quality is good; it is a plumbing problem, not an asset problem.

## 9. Questions for the owner
1. Is the PEHLI 10% coupon real and enforced in the booking/payment flow? If not, the banner must go.
2. Should the detail page recommend a *specific* technician pre-booking (needs dispatch preview API) or
   an *area* score only? This decides F-01's shape.
3. Can the 5 category photos be commissioned now (or cropped from the 13 service photos) so the flag can
   be turned on with local fallbacks, independent of the dead-bucket fix?
4. Is "30-day guarantee" a real policy with terms? It appears on home twice and nowhere in booking.

## 10. Scorecard

| Screen | Specificity (0-4) | Craft (0-4) | Trust (0-4) | Hindi/field (0-4) | Gap-to-top-tier |
|---|---|---|---|---|---|
| Home — header / first viewport | 1 | 2 | 1 | 2 | No hero, no search, skeleton first frame |
| Home — category grid | 1 | 2 | 1 | 2 | Glyph tiles where photos should be |
| Home — durable hooks (pending / active / recent) | 2 | 2 | 2 | 2 | No "book again"; complaint as default action |
| Home — promo slider | 2 | 3 | 1 | 2 | Beautiful, untappable, wrong season |
| Home — trust strip | 1 | 1 | 1 | 1 | 10sp claims with no numbers |
| Pending-payment banner | 1 | 2 | 1 | 2 | Red alarm + one-tap cancel |
| Service list | 1 | 2 | 1 | 2 | Text rows; 36dp CTA; no category context |
| Service detail | 2 | 3 | 1 | 3 | Placeholder trust card in the hero slot; no reviews |
| Trust dossier (loaded / unavailable) | 2 | 3 | 2 | 3 | Rating buried; unavailable copy over-claims |
| Confidence score row | 3 | 3 | 3 | 3 | Never reachable in the real flow |

Column averages: Specificity **1.6**, Craft **2.3**, Trust **1.4**, Hindi/field **2.2**.
Verification bar (design-language §Verification: ≥3 on every lens, avg 3.5): **not met on any home
surface; detail and dossier meet craft/Hindi only.**
