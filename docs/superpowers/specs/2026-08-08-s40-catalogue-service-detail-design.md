# S-40 — Catalogue + service detail (customer-app)

Date: 2026-08-08
Branch: `feat/s40-catalogue` (worktree `../homeservices-s40-catalogue`)
Base: `main` @ `6603bbcc`
Tier: Feature (upper end — see §9)
Phase: 4 (per-surface craft), priority #1 of `docs/design/uiux-implementation-plan.md`

Baseline: **D2 — Ayodhya / rural UP, Hindi-first.** Contract: `docs/design/design-language.md` (D1).

---

## 1. Verification corrections

The standing instruction is to say so when a claim turns out to be wrong rather than implement
around it. Four claims carried into this story do not survive contact with current source.

| Claim as briefed | Verified state | Consequence |
|---|---|---|
| `CatalogueVisualImage.kt` is the worst colour-literal offender (31 literals) | S-32 already tokenised it — **0 literals remain**. It is also **dead code**: no call site anywhere in `main/`. Only `detekt-baseline.xml:52-69` (stale ghost entries naming the removed `0xFF00796B` teal) and a Kover exclusion still reference it. | Delete the file, its Kover exclusion, and the stale baseline entries. Do not restyle it. |
| "Neither app has an animating skeleton anywhere" | `CustomerHomeTabContent.kt:487` `DurableHooksSkeleton` has a working 1200ms `rememberInfiniteTransition` shimmer — in this same package. | Do not invent a shimmer. Promote the proven one, and fix the defect it carries (§4). |
| The committed catalogue goldens show current state | Every catalogue Paparazzi test **except** `CatalogueHomeScreenTest` is `@Ignore`d. Their PNGs date **2026-04-25 → 2026-05-08**; the marigold token core landed **2026-07-28** (`Color.kt`, `80bc37ed`). The dark-green `ServiceDetailScreen` golden is the *pre-D1* palette. | The most commercially important screen in the app has had **no enforced visual regression coverage since April**. Restoring it is in scope. |
| S-32 cleaned the catalogue colour literals | It cleaned `CatalogueHomeScreen.kt` and `CatalogueVisualImage.kt`. It did **not** clean `ServiceDetailScreen.kt:66-67,351,359` or `ServiceListScreen.kt:54`, which still carry `MetricNeutralBg #F5F4F0`, `SkeletonLine #EDE7DD` (×2), `#5F6C66` and `#18231F` — the last two are pre-pivot green-greys, retained behind a `@Suppress("MagicNumber")` at `:324`. | In scope. See §5. |

### 1.1 Two defects found by pixel inspection, not in any prior document

**V-1 — the home skeleton renders as nothing on first paint.**
`DurableHooksSkeleton` builds its brush as `[background, outline@55%, background]` with
`start = Offset(shimmerOffset * 400f, 0f)`, `end = Offset((shimmerOffset + 1f) * 400f, 0f)`,
`shimmerOffset` animating `-1f → 2f`. At the initial `-1f` the gradient spans x ∈ [-400, 0]; every
pixel of the box lies past `end` and clamps to the end colour — which *is* the background. The
skeleton has **no resting fill, only a travelling highlight**, so for most of each 1200ms cycle it is
invisible against the canvas, and on frame one it is entirely invisible.

This is the ~350px void in the committed `catalogue_home_success_state` golden. It is not a layout
gap. On a slow rural connection the first paint of the home screen is genuinely blank space.

**V-2 — the search field is inert.**
`CatalogueHomeScreen.kt:513-547` `HeroSearchBar` holds `query` in local `remember` state and exposes
no callback; nothing in the app consumes it, and there is no search route, no `onSearch`, and no
filtering logic anywhere in `customer-app`. It occupies the most valuable position on the primary
landing surface and its hint promises "Search AC, plumber, electrician…" / "AC, प्लंबर,
इलेक्ट्रीशियन खोजें…" in both locales.

---

## 2. Design thesis

On a Pixel 5, the current home screen spends its entire first screenful on furniture — wordmark,
location row, dead search bar, ~350px of invisible skeleton, a 196dp auto-advancing carousel, a chip
strip — and the category grid, the reason the user opened the app, begins **below the fold**. On a
Moto G-class device it is worse.

The user this is built for is standing outside in sunlight, on a budget phone, one-handed, deciding
whether to let a stranger into their home. The screen currently answers "what is this brand" before
it answers "what can I get, and what does it cost".

Three principles, in priority order:

1. **The grid is the screen.** "What can I get, what does it cost" resolves in the first screenful.
   Merchandising furniture earns its place after that, or not at all.
2. **Trust is attached, not ambient.** A floating "4.8★ rating" chip is decoration. Verification,
   fixed price and guarantee *on the service being booked* are decision inputs.
3. **Every state is designed.** Under intermittent rural network, loading / error / empty are the
   common case. Beautiful-when-loaded and blank-when-not is not finished.

Premium here means hierarchy, legibility and concrete trust — not effects. Per D1 §Motion, nothing
added may be heavier than opacity/translation, and everything animated must honour reduced-motion.

---

## 3. Screen designs

### 3.1 Catalogue home (`CatalogueHomeScreen.kt`)

**Structure — invert the fold.**

| Order | Now | After |
|---|---|---|
| 1 | Wordmark + location (2 rows) | Compact header: wordmark, location, settings in one row |
| 2 | Search bar (inert) | Search bar (functional, §3.1.1) |
| 3 | `CustomerHomeTabContent` (invisible skeleton / durable hooks) | unchanged position — but skeleton now visible (§4) |
| 4 | Promo slider (196dp, auto-advancing) | **Category grid** |
| 5 | Trust chip strip | Promo slider, demoted; auto-advance gated on reduced-motion |
| 6 | "Our services" + category grid (below fold) | Trust reassurance line, sized for the longer of EN/HI |

The durable-hooks block (pending actions / active booking) stays above the grid: a user with a
booking in flight is answering a different question, and that block self-hides when empty.

**Category card.** Height rises from 126dp — cramped for a two-line Devanagari name plus price.
Price becomes a first-class element in tabular numerals (S-10 WS-C shipped `HomeservicesMonoFontFamily`;
money should align down the grid column) in marigold — the one accent use on this screen that earns
it. Trust signals fold onto the card, which retires the chip strip that truncates `30-day guara…`
in English (audit A11Y-004; the Hindi string fits, so the strip must be sized for the longer of the
two, not the shorter).

**States.** All three states get real treatments — see §6.

#### 3.1.1 Search

Client-side filter over the already-loaded, already-localised category list. No API work; the
catalogue is small enough that this is correct rather than a compromise.

- `CatalogueHomeViewModel` gains `query: StateFlow<String>` and `onQueryChange(String)`.
- Filtering runs over **localised** names, so a Hindi user filters Hindi text.
- The predicate lives in its own file as a pure function — `filterCategories(categories, query)` —
  so it is unit-testable and does not push a Composable below the Kover floor (§8).
- A query matching nothing gets its own state, distinct from "no categories exist at all", with a
  clear-the-query action. Two different problems must not share one empty state.

### 3.2 Service list (`ServiceListScreen.kt`)

The empty state at `:166` is well-designed — icon, bold title, supporting line. The error state at
`:121-129`, forty lines above it in the same file, is a naked centred `Text`. Bring the error state
up to the empty state's standard and add recovery.

Hierarchy: the 22sp price currently out-shouts the 16sp service name. The name should lead and the
price should be the confident second beat. Price gains tabular numerals.

Skeleton moves to the shared primitive; the private `PlaceholderLine` and the hardcoded
`SkeletonLine` literal are deleted.

### 3.3 Service detail (`ServiceDetailScreen.kt`)

- **One authoritative price.** It currently renders twice at two treatments — `ServiceMetricTile`
  (22sp) and `ServiceBookingBar` (24sp). The sticky booking bar is the authoritative instance; the
  metric row keeps "typical visit" and gives its price slot to a trust signal.
- **Raise the trust dossier.** It is the strongest trust asset on the page and currently sits below
  a metric row. Under principle 2 it belongs directly beneath the hero.
- **Palette leaks → tokens.** `MetricNeutralBg #F5F4F0`, `#5F6C66`, `#18231F`, `SkeletonLine
  #EDE7DD`. Beyond being off-palette, `MetricNeutralBg` is a *fixed light* surface, so in dark mode
  the metric tile is a light-grey slab on a `#0E0B08` canvas. Removing these retires the
  `@Suppress("MagicNumber")` at `:324`.
- **Error state** gets recovery (§6).

### 3.4 Trust dossier card (`ui/shared/TrustDossierCard.kt`)

Craft-level, never previously touched:

- `:205` hardcodes `"Rating ${"%.1f".format(review.rating)}/5"` — an English literal with a
  locale-default `String.format`, in an app whose resources are otherwise 100% translated. Move to a
  parameterised string resource in both locales.
- `:211` renders `review.date.take(10)` — a raw ISO-8601 substring shown to the user. D1 §Content
  forbids raw machine values in user-facing text; format it locale-aware.
- The header icon is `Icons.Default.Lock`. A padlock reads *security/locked*, not *verified*. Swap
  for a verification mark. D1 §Iconography: semantic iconography, and icon-only controls are not
  acceptable for primary actions — this is a decorative icon beside a label, so the label stays.

---

## 4. Shared: `HsSkeletonBlock` (design-system)

Today: a static `Surface(color = surfaceVariant)` rectangle (`HsComponents.kt:167-178`).

After: a resting fill **plus** a shimmer highlight composited over it — the fix for V-1. The resting
fill is what makes a skeleton read as a skeleton; the highlight is decoration on top, never the base.
When reduced-motion is active the primitive renders the resting fill only, satisfying D1 §Motion
("Honor reduced-motion on web and Android"), which the current `DurableHooksSkeleton` does not.

Android has no first-class reduced-motion API in Compose. The predicate reads
`Settings.Global.ANIMATOR_DURATION_SCALE` and lives in its own file as a pure function taking the
scale value, so it is unit-testable independently of the Composable (§8).

This single change unblocks the private duplicates it replaces:

| Call site | Replaced |
|---|---|
| `ServiceListScreen.kt:390` | `PlaceholderLine` + `SkeletonLine` literal |
| `ServiceDetailScreen.kt:599,611` | `PlaceholderLine`, `PlaceholderBlock` + `SkeletonLine` literal |
| `ui/shared/TrustDossierCard.kt:349,361` | `PlaceholderLine`, `PlaceholderBlock` |
| `CustomerHomeTabContent.kt:487` | `DurableHooksSkeleton`'s inline brush (defect V-1) |
| `booking/BookingSummaryScreen.kt`, `booking/PriceApprovalScreen.kt` | existing `HsSkeletonBlock` callers — inherit the fix |

Existing `HsSkeletonBlock` callers gain the animation without changing their call sites; the
signature is additive.

---

## 5. Dead code and duplication

- **Delete `CatalogueVisualImage.kt`** (239 lines, zero call sites), plus its `build.gradle.kts:663-666`
  Kover exclusion and the stale `detekt-baseline.xml` entries naming colour literals it no longer has.
- **Dedupe `categoryStyle`.** Two implementations exist — `CatalogueHomeScreen.kt:145` (`CategoryStyle`)
  and `PhotoFirstCategoryCard.kt:196` (`CategoryStyleTokens`) — with an explanatory comment at
  `:193-195` acknowledging the copy. They **disagree**: the `else` branch tints
  `onSurfaceVariant` in one and `primary` in the other, so an unrecognised category id renders
  differently depending on a feature flag. One internal definition, one data class.

---

## 6. State grammar

D1 §State Grammar is the contract. Current compliance across the three screens:

| Screen | Loading | Empty | Error |
|---|---|---|---|
| Catalogue home | invisible (V-1) | **missing entirely** — heading renders over blank space | no retry, message discarded |
| Service list | static skeleton | present, good | naked `Text`, no retry |
| Service detail | static skeleton | n/a | no retry, message discarded |

After: every state present, every error recoverable, no raw exception text reaching the user
(all three ViewModels currently build `Error(it.message ?: "Unknown error")` — the message must stay
diagnostic-only and never render).

**Retry requires ViewModel work.** All three ViewModels share one shape: a single
`combine(...).collect{}` inside `init`, with no re-trigger. Each gains a retry trigger that
re-enters `Loading` and re-collects. This is the same change three times:

```
CatalogueHomeViewModel.kt:30-46
ServiceListViewModel.kt:31-46
ServiceDetailViewModel.kt:49-67
```

---

## 7. Explicitly out of scope

**Imagery — owner decision, 2026-08-08.** S-40 touches nothing under `res/`. Recorded for a future
story:

- 16 PNGs totalling ~31 MB ship in the APK (`banner_image_1-3`, 13 × `service_hero_*`), each ~1.9 MB.
  Heroes sit in `drawable-nodpi`, so a single full-resolution bitmap is decoded per device
  (order-of-13 MB of heap each on a Moto G-class device). WebP at equivalent quality would cut this
  by roughly 90%.
- The photography is off-brief on two axes. The technicians, tools and service depictions are right;
  the *environments* are cove-lit wood-slat ceilings, fluted panelling, floor-to-ceiling balcony
  glass, designer vessel basins and spa towels — the Bengaluru/Gurgaon interior D1 §Imagery
  explicitly rules out. And **every uniform is dark green**, the pre-pivot brand colour, so the
  photography actively fights the marigold identity.
- `docs/design/uiux-implementation-plan.md` "Not scheduled" already requires re-briefing
  `ux-design.md` §6.2/§6.3 for D2 before any commissioning spend. That re-brief remains unwritten.

Also out of scope: the `photoFirstCatalogueEnabled` flag stays OFF and its two card composables are
left as they are, apart from the `categoryStyle` dedupe in §5.

---

## 8. Testing

**Unit (JUnit, TDD — test file committed before implementation):**
- `filterCategories` — match, no-match, case-insensitivity, Devanagari input, blank query returns all.
- Reduced-motion predicate — scale `0f` → reduced, `1f` → not.
- Three ViewModel retry tests — error state, retry re-enters `Loading`, then success.
- Catalogue empty-vs-no-results distinction.

**Paparazzi:** un-ignore `ServiceDetailScreenTest`, `ServiceListScreenPaparazziTest` and the
catalogue home tests; record EN + HI × light + dark. **Record on CI Linux only** via
`paparazzi-record.yml` `workflow_dispatch`, download, unzip inside the Gradle root, commit
(`docs/patterns/paparazzi-cross-os-goldens.md`). Never record on Windows. Never
`git rm -r snapshots/images/` — existing goldens for other screens must survive.

**Traps to design around from the start, not discover:**
- `ConfidenceScoreRow.kt:78` contains a `ModalBottomSheet`. Snapshotting a `ModalBottomSheet`
  directly yields byte-identical blank goldens — the `SheetValue.Hidden` animation never settles in
  Paparazzi's single frame. If the methodology sheet needs a golden, extract a `*Content` composable
  and snapshot that (the `ShieldReportSheet` / `EarningsContent` split from S-33).
- Adding `remember`/`LaunchedEffect` to previously-static Composables drops Kover coverage below the
  80% floor. Both new pieces of logic (search predicate, reduced-motion predicate) are therefore
  pure functions in their own files, covered by unit tests. Only add a `*Kt` Kover exclusion if a
  wrapper is genuinely untestable — precedent block exists in `customer-app/app/build.gradle.kts`.

**Gate:** `bash tools/pre-codex-smoke.sh customer-app` with `-PexcludePaparazzi` on Windows —
6 steps, non-zero exit stops the story.

---

## 9. Size and risk

Touches 3 screens, 1 design-system primitive, 3 ViewModels, 1 shared card; deletes 1 file; ~8 test
files. Against the split gate: new files < 20, domain and data layers untouched, no external SDK
integrations. **No split required**, but it sits at the upper end of Feature tier. Owner approved a
single PR (2026-08-08).

Principal risk is the `HsSkeletonBlock` change reaching ~7 call sites, two of them outside the
catalogue (`BookingSummaryScreen`, `PriceApprovalScreen`). The signature change is additive and the
visual change is intended everywhere it lands, but those two screens' goldens will move and must be
re-recorded in the same pass.

---

## 10. Acceptance

1. Category grid is reachable in the first screenful on a Pixel 5 viewport.
2. Every state on all three screens renders something designed; every error offers recovery; no raw
   exception text or raw ISO date reaches the user.
3. Skeletons are visible on frame one and animate; reduced-motion renders them static.
4. Search filters the category list in both locales, with a distinct no-results state.
5. Zero raw `Color(0x…)` literals remain in the three screens; the `@Suppress("MagicNumber")` at
   `ServiceDetailScreen.kt:324` is gone.
6. `CatalogueVisualImage.kt`, its Kover exclusion and its stale detekt baseline entries are gone;
   one `categoryStyle` definition remains.
7. Trust chip does not truncate in either locale.
8. Paparazzi goldens for all three screens are un-ignored, current, and recorded on CI in EN + HI ×
   light + dark.
9. Six-step smoke gate green; Codex review clean.
10. Nothing under `customer-app/app/src/main/res/` (imagery) is modified.
