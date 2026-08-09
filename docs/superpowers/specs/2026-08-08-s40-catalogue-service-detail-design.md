# S-40 — Catalogue + service detail (customer-app)

Date: 2026-08-08
Branch: `feat/s40-catalogue` (worktree `../homeservices-s40-catalogue`)
Base: `main` @ `6603bbcc`
Tier: Feature (upper end — see §9)
Phase: 4 (per-surface craft), priority #1 of `docs/design/uiux-implementation-plan.md`

Baseline: **D2 — Ayodhya / rural UP, Hindi-first.** Contract: `docs/design/design-language.md` (D1).

**Revision history**
- rev 1 (2026-08-08) — initial draft.
- rev 2 (2026-08-08) — adversarial review pass. Two claims in rev 1 were verified **false** and are
  corrected here (§1 row 3, §1.1 V-1). Search is **cut** and the inert field deleted instead
  (owner, reversing the rev-1 decision). D1 §Shape added to scope (§3.5). Retry extended to
  `ServiceDetailViewModel`'s second coroutine. Un-ignore list corrected from 3 tests to 5.
  Items raised in review but deliberately **not** folded in are listed in §11.
- rev 3 (2026-08-09) — design-direction pass. Adds §3.6: the accent is used as a *foreground* at
  20 sites on these screens and measures 2.08:1. Owner approved including the fix in S-40 rather
  than splitting it into a token story.

---

## 1. Verification corrections

The standing instruction is to say so when a claim turns out to be wrong rather than implement
around it. That applies to this document's own earlier revision as much as to the briefing.

| Claim | Verified state | Consequence |
|---|---|---|
| `CatalogueVisualImage.kt` is the worst colour-literal offender (31 literals) | S-32 already tokenised it — **0 literals remain**. It is also **dead code**: `CatalogueVisualImage` and its enum `CatalogueVisualSize` have zero references outside their own file across `main/`, `test/` and `androidTest/`. Only `detekt-baseline.xml:52-69` (stale ghost entries naming the removed `0xFF00796B` teal) and a Kover exclusion still name it. | Delete the file, its Kover exclusion, and the stale baseline entries. Do not restyle it. |
| "Neither app has an animating skeleton anywhere" | `CustomerHomeTabContent.kt:487` `DurableHooksSkeleton` has a working 1200ms `rememberInfiniteTransition` shimmer — in this same package. | Do not invent a shimmer. Promote the proven one, and fix the defect it carries (§4). |
| ~~"Every catalogue Paparazzi test except `CatalogueHomeScreenTest` is `@Ignore`d"~~ **rev 1 said this. It is false.** | `ConfidenceScoreRowPaparazziTest.kt:9` carries **no `@Ignore`**, at class or method level, and CI enforces it — `customer-ship.yml:105` runs `verifyPaparazziDebug`. The real defect is different and worse: at `:12-15` it sets Paparazzi's `theme` to `android:Theme.Material3.DayNight.NoActionBar` and **never wraps `HomeservicesTheme`**, unlike `CatalogueHomeScreenTest.kt:20` and `ServiceDetailScreenTest.kt:23`. It renders stock Material3 baseline colours, which the D1 token core cannot affect — which is exactly why its 2026-04-25 golden still passes. | The catalogue does not have *absent* visual coverage. It has **false** coverage: the one catalogue screenshot CI enforces guards a rendering no user will ever see. Fixing the theme is in scope (§8). |
| The remaining catalogue goldens show current state | `ServiceDetailScreenTest:19`, `ServiceListScreenPaparazziTest:13`, `CustomerHomeScreenPaparazziTest:25` and `TrustDossierCardPaparazziTest:13` are all `@Ignore`d, with PNGs dated 2026-04-25 → 2026-05-08. The marigold core landed 2026-07-28 (`Color.kt`, `80bc37ed`). The dark-green `ServiceDetailScreen` golden is the pre-D1 palette. | These four *are* genuinely stale and unenforced. Restoring them is in scope. |
| S-32 cleaned the catalogue colour literals | It cleaned `CatalogueHomeScreen.kt` and `CatalogueVisualImage.kt`. It did **not** clean `ServiceDetailScreen.kt:66-67,351,359` or `ServiceListScreen.kt:54` — `MetricNeutralBg #F5F4F0`, `SkeletonLine #EDE7DD` (×2), `#5F6C66` and `#18231F`, the last two pre-pivot green-greys retained behind a `@Suppress("MagicNumber")` at `:324`. | In scope. See §5. |

### 1.1 Defects found by pixel inspection, not in any prior document

**V-1 — the home skeleton has no resting fill, and is invisible on frame one.**

> **Corrected in rev 2.** Rev 1 said the skeleton "is invisible for most of each 1200ms cycle".
> That is wrong and the arithmetic refutes it. The valid finding is narrower and stated below.

`CustomerHomeTabContent.kt:506-517` builds the brush as `[resolvedBg, outline@55%, resolvedBg]`
across `start = Offset(400·off, 0f)` → `end = Offset(400·(off+1), 0f)`, with `off` animating
`-1f → 2f` (`:493-502`). `resolvedBg` resolves to `colorScheme.background` (`:491`) — identical to
the `Scaffold` container colour.

Two consequences, only the second of which rev 1 got right:

- **The base colour of the gradient is the canvas colour**, so everything outside the 400px gradient
  window renders as bare background. The skeleton reads as a narrow travelling smear on empty
  canvas rather than as a block. This is the substantive defect: *a skeleton needs a resting fill,
  with the shimmer as a highlight on top.*
- **At `off = -1f` the gradient spans x ∈ [−400, 0]**, so with `TileMode.Clamp` every pixel of the
  box takes `colors.last()` — the background. Frame one is entirely blank, and Paparazzi captures
  frame one. This is the ~350px void in the committed `catalogue_home_success_state` golden: the
  four strips total 60+76+56+56dp plus 30dp spacing plus padding ≈ 290dp ≈ 340px at the golden's
  1.17 scale.

For the record, the highlight *is* within the box for most of the cycle — its midpoint sits at
x = 400·off + 200, inside a ~993px-wide Pixel 5 box for `off ∈ [−0.5, 1.98]`, about 83% of the
1200ms period. Do not restate the rev-1 claim; it is refutable in one calculation, and a reader who
refutes it will discard the valid finding with it.

**V-2 — the search field is inert.**
`CatalogueHomeScreen.kt:513-547` `HeroSearchBar` holds `query` in local `remember` state and exposes
no callback. Nothing consumes it; there is no search route, no `onSearch`, and no filtering logic
anywhere in `customer-app`. It occupies the most valuable position on the primary landing surface
and its hint promises "Search AC, plumber, electrician…" / "AC, प्लंबर, इलेक्ट्रीशियन खोजें…" in
both locales. **Resolution: delete it — see §3.1.1.**

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
2. **Trust is attached, not ambient.** A floating "4.8★ rating" chip is decoration. Verification,
   fixed price and guarantee *on the service being booked* are decision inputs.
3. **Every state is designed.** Under intermittent rural network, loading / error / empty are the
   common case.

Premium here means hierarchy, legibility and concrete trust — not effects. Per D1 §Motion, nothing
added may be heavier than opacity/translation, and everything animated must honour reduced-motion.

---

## 3. Screen designs

### 3.1 Catalogue home (`CatalogueHomeScreen.kt`)

**Structure — invert the fold.**

| Order | Now | After |
|---|---|---|
| 1 | Wordmark + location (2 rows) | Compact header: wordmark, location, settings in one row |
| 2 | Search bar (inert) | **removed** (§3.1.1) |
| 3 | `CustomerHomeTabContent` | unchanged position — skeleton now visible (§4) |
| 4 | Promo slider (196dp, auto-advancing) | **Category grid** |
| 5 | Trust chip strip | Promo slider, demoted; auto-advance gated on reduced-motion |
| 6 | "Our services" + category grid (below fold) | Trust reassurance, sized per §3.1.2 |

Removing the search field and collapsing the header to one row reclaims roughly 100dp above the
fold before the grid moves at all — the two changes compound.

The durable-hooks block stays above the grid: a user with a booking in flight is answering a
different question, and that block self-hides when empty.

**Category card.** Height rises from 126dp — cramped for a two-line Devanagari name plus price.
Price becomes a first-class element in tabular numerals, in marigold — the one accent use on this
screen that earns it. `HomeservicesMonoFontFamily` exists (`Typography.kt:142`), but note
`Money.kt:33`: `formatRupees` returns a plain `String` and the mono family must be applied by the
caller. Budget this as per-call-site styling, not a formatter change.

#### 3.1.1 Search — cut

**Decision (owner, rev 2): delete `HeroSearchBar` rather than wire it.** Rev 1 proposed client-side
filtering over the loaded category list. That fails its first realistic query: the home screen loads
*categories*, not services, so a user typing "AC gas" — precisely what the hint invites — matches
nothing, because `ac-gas-refill` lives behind a category fetch that has not happened. A search box
that fails on the obvious query is worse than no box: it teaches the user the feature is broken.

Delete the composable and its call site. Retain `catalogue_search_hint` in both `strings.xml` files
— a real search is a legitimate future story and the copy is already translated. Removing it now and
re-adding it later costs more than leaving two orphaned strings.

#### 3.1.2 Trust reassurance and A11Y-004

The audit's A11Y-004 is that `30-day guarantee` truncates to `30-day guara…` where `30 दिन गारंटी`
fits. Rev 1 claimed folding trust signals onto category cards resolves this. **It does not** — a
2-up card is *narrower* than a third of screen width, so the same string in less space truncates
harder.

Follow the audit's own prescription instead: size for the longer of the two locales, or drop
`maxLines`/ellipsis in favour of a wrapping or scrollable row. Explicitly not by shortening the
English copy, which hides the sizing bug rather than fixing it. Per-card trust signals may still
carry short, verified badges, but the guarantee statement stays in one reassurance element sized
correctly for both locales.

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
  (22sp) and `ServiceBookingBar` (24sp). The sticky booking bar is authoritative; the metric row
  keeps "typical visit" and gives its price slot to a trust signal.
- **Raise the trust dossier** directly beneath the hero — it is the strongest trust asset on the
  page and currently sits below a metric row.
- **Palette leaks → tokens.** `MetricNeutralBg #F5F4F0`, `#5F6C66`, `#18231F`, `SkeletonLine
  #EDE7DD`. Beyond being off-palette, `MetricNeutralBg` is a *fixed light* surface, so in dark mode
  the metric tile is a light-grey slab on a `#0E0B08` canvas. Removing these retires the
  `@Suppress("MagicNumber")` at `:324`.
- **Error state** gets recovery (§6).

### 3.4 Trust dossier card (`ui/shared/TrustDossierCard.kt`)

- `:205` hardcodes `"Rating ${"%.1f".format(review.rating)}/5"` — an English literal with a
  locale-default `String.format`, in an app whose resources are otherwise 100% translated. Move to a
  parameterised string resource in both locales.
- `:211` renders `review.date.take(10)` — a raw ISO-8601 substring shown to the user. D1 §Content
  forbids raw machine values in user-facing text; format it locale-aware.
- The header icon is `Icons.Default.Lock`. A padlock reads *security/locked*, not *verified*. Swap
  for a verification mark.

### 3.5 Shape conformance (D1 §Shape) — new in rev 2

D1 sets the customer radius scale at **8 / 12 / 20 / 999**. The three screens currently use **8
distinct off-scale radii across 18 occurrences**:

| Radius | Occurrences | On D1 customer scale? |
|---:|---:|---|
| 18dp | 4 | no |
| 28dp | 3 | no |
| 24dp | 3 | no |
| 16dp | 3 | no |
| 12dp | 3 | **yes** (medium) |
| 14dp | 2 | no |
| 22dp | 1 | no |
| 15dp | 1 | no |
| 3dp | 1 | no |
| `percent = 50` | 2 | yes (pill ≡ full) |
| 999dp | 1 | yes (full) |

**`20dp` — the customer "large" radius — appears zero times.** `customer-app/detekt.yml` contains no
radius rule, so S-20's promised "corner radii not on the radius scale" enforcement is not catching
any of this.

Map every value onto the scale: 14/15/16 → 12 or 20 by element weight; 18/22/24/28 → 20; the 3dp
promo dot indicator → 8 or a pill. `percent = 50` and 999dp are already "full" and stay.

This was absent from rev 1 entirely. For the story whose stated purpose is raising the visual bar,
leaving D1's shape contract unenforced on its own three screens was the largest omission in the
document.

### 3.6 Accent legibility (D1 §Palette) — new in rev 3

Marigold `#E2A04A` measures **2.08:1** on canvas `#FBF6E9` and **1.93:1** on surface `#F4EDDF`.
AA body text needs 4.5:1; the large-text floor is 3:1. D1's palette table never claims otherwise —
it publishes "ink *on* brand accent, 8.75:1", the inverse relationship. The accent is a **fill**
colour.

It is nonetheless used as a **foreground** at 20 sites across the S-40 surface: every price
(`CatalogueHomeScreen.kt:795`, `ServiceListScreen.kt:266`, `ServiceDetailScreen.kt:475,510`), the
trust-chip label at 10sp (`:713`), the wordmark, the location line, the trust-dossier header and
bullets. In a fixed-price marketplace the price is the most-scanned content on the screen, and it is
currently the least legible text on it.

This is not a new discovery. `ExtendedColors.kt:57-74` publishes the same **1.93:1** figure,
concludes "marigold on warm paper is inherently low-contrast", forbids substituting the accent for a
focus ring in light mode, and records the general case as "a gap in the contract rather than in this
implementation; **raised as a finding**." S-10 solved it for the focus-ring role only. The same
reasoning was never applied to text.

**Fix:** one additive token, `HomeservicesExtendedColors.accentInk`. Light `#6F4610` — measured
**7.61:1** on canvas and **7.04:1** on surface, both clearing D1's 7:1 D2 target. Dark keeps the raw
accent, which already measures 8.03:1 on dark canvas. No existing token value changes; no surface
outside these screens is affected until it opts in.

Owner approved inclusion in S-40 (2026-08-09) rather than splitting it into a separate token story.
The remaining accent-as-foreground sites elsewhere in the app are **not** swept here.

---

## 4. Shared: `HsSkeletonBlock` (design-system)

Today: a static `Surface(color = surfaceVariant)` rectangle (`HsComponents.kt:167-178`).

After: a resting fill **plus** a shimmer highlight composited over it — the fix for V-1. The resting
fill is what makes a skeleton read as a skeleton; the highlight is decoration on top, never the base.
When reduced-motion is active the primitive renders the resting fill only, satisfying D1 §Motion,
which the current `DurableHooksSkeleton` does not.

Android has no first-class reduced-motion API in Compose. The predicate reads
`Settings.Global.ANIMATOR_DURATION_SCALE` and lives in its own file as a pure function taking the
scale value, so it is unit-testable independently of the Composable (§8).

| Call site | Replaced |
|---|---|
| `ServiceListScreen.kt:390` | `PlaceholderLine` + `SkeletonLine` literal |
| `ServiceDetailScreen.kt:599,611` | `PlaceholderLine`, `PlaceholderBlock` + `SkeletonLine` literal |
| `ui/shared/TrustDossierCard.kt:349,361` | `PlaceholderLine`, `PlaceholderBlock` |
| `CustomerHomeTabContent.kt:487` | `DurableHooksSkeleton`'s inline brush (defect V-1) |
| `booking/BookingSummaryScreen.kt`, `booking/PriceApprovalScreen.kt` | existing `HsSkeletonBlock` callers — inherit the fix |

Existing callers gain the animation without changing their call sites; the signature is additive.

---

## 5. Dead code and duplication

- **Delete `CatalogueVisualImage.kt`** (239 lines, zero references to either the composable or the
  `CatalogueVisualSize` enum), plus its `build.gradle.kts:663-666` Kover exclusion and the stale
  `detekt-baseline.xml` entries naming colour literals it no longer has.
- **Dedupe `categoryStyle`.** Two implementations — `CatalogueHomeScreen.kt:145` (`CategoryStyle`)
  and `PhotoFirstCategoryCard.kt:196` (`CategoryStyleTokens`) — with a comment at `:193-195`
  acknowledging the copy. They **disagree**: the `else` branch tints `onSurfaceVariant` at
  `CatalogueHomeScreen.kt:154` and `primary` at `PhotoFirstCategoryCard.kt:232`, so an unrecognised
  category id renders differently depending on a feature flag. One internal definition, one data class.

---

## 6. State grammar

| Screen | Loading | Empty | Error |
|---|---|---|---|
| Catalogue home | invisible (V-1) | **missing entirely** — heading renders over blank space | no retry, message discarded |
| Service list | static skeleton | present, good | naked `Text`, no retry |
| Service detail | static skeleton | n/a | no retry, message discarded |

After: every state present, every error recoverable, no raw exception text reaching the user
(all three ViewModels build `Error(it.message ?: "Unknown error")` — diagnostic only, never rendered).

**Retry requires ViewModel work.** All three share one shape: a single `combine(...).collect{}`
inside `init`, with no re-trigger. Each gains a retry trigger that re-enters `Loading` and
re-collects.

```
CatalogueHomeViewModel.kt:30-46
ServiceListViewModel.kt:31-46
ServiceDetailViewModel.kt:49-86
```

**Corrected in rev 2:** rev 1 cited `ServiceDetailViewModel.kt:49-67` and would have wired retry to
the first coroutine only. The `init` block does not end at 67 — there is a **second**
`viewModelScope.launch` at `:68-85` loading the confidence score, guarded by `technicianId != null`.
A retry that re-fires only the first restores the service and leaves the confidence row stale or
hidden. Both coroutines must re-enter on retry, and the confidence row must return to
`ConfidenceScoreUiState.Loading` — not `Hidden` — when a technician id is present.

---

## 7. Explicitly out of scope

**Imagery — owner decision, 2026-08-08.** S-40 touches nothing under `res/`. Recorded for a future
story:

- 16 PNGs totalling ~31 MB ship in the APK (`banner_image_1-3`, 13 × `service_hero_*`), each ~1.9 MB.
  Heroes sit in `drawable-nodpi`, so a single full-resolution bitmap is decoded per device
  (order-of-13 MB of heap each on a Moto G-class device). WebP would cut this by roughly 90%.
- The photography is off-brief on two axes. Technicians, tools and service depictions are right; the
  *environments* are cove-lit wood-slat ceilings, fluted panelling, floor-to-ceiling balcony glass,
  designer vessel basins and spa towels — the Bengaluru/Gurgaon interior D1 §Imagery rules out. And
  **every uniform is dark green**, the pre-pivot brand colour, so the photography actively fights the
  marigold identity.
- `docs/design/uiux-implementation-plan.md` "Not scheduled" already requires re-briefing
  `ux-design.md` §6.2/§6.3 for D2 before any commissioning spend. That re-brief remains unwritten.

Also out of scope: the `photoFirstCatalogueEnabled` flag stays OFF and its two card composables are
left as they are, apart from the `categoryStyle` dedupe in §5.

---

## 8. Testing

**Unit (JUnit, TDD — test file committed before implementation):**
- Reduced-motion predicate — scale `0f` → reduced, `1f` → not.
- Three ViewModel retry tests — error state, retry re-enters `Loading`, then success. The
  `ServiceDetailViewModel` test must assert **both** coroutines re-fire (§6).
- Catalogue empty-state test (zero categories → designed empty state, not a bare heading).

**Paparazzi — five test classes, not three:**

| Test | Action |
|---|---|
| `ConfidenceScoreRowPaparazziTest` | **Fix the theme bug** — wrap in `HomeservicesTheme`, then re-record. Currently the only enforced catalogue screenshot and it guards the wrong rendering (§1). |
| `ServiceDetailScreenTest` | un-ignore, re-record |
| `ServiceListScreenPaparazziTest` | un-ignore, re-record |
| `CustomerHomeScreenPaparazziTest` | un-ignore, re-record — §4 changes `CustomerHomeTabContent.kt` |
| `TrustDossierCardPaparazziTest` | un-ignore, re-record — §3.4 and §4 both change that file |

Record EN + HI × light + dark. **Record on CI Linux only** via `paparazzi-record.yml`
`workflow_dispatch`, download, unzip inside the Gradle root, commit
(`docs/patterns/paparazzi-cross-os-goldens.md`). Never record on Windows. Never
`git rm -r snapshots/images/` — goldens for other screens must survive.

**Traps to design around from the start:**
- `ConfidenceScoreRow.kt:78` contains a `ModalBottomSheet`. Snapshotting one directly yields
  byte-identical blank goldens — the `SheetValue.Hidden` animation never settles in Paparazzi's
  single frame. If the methodology sheet needs a golden, extract a `*Content` composable and
  snapshot that (the `ShieldReportSheet` / `EarningsContent` split from S-33).
- Adding `remember`/`LaunchedEffect` to previously-static Composables drops Kover below the 80%
  floor. The reduced-motion predicate is therefore a pure function in its own file, covered by unit
  tests. Only add a `*Kt` Kover exclusion if a wrapper is genuinely untestable — precedent block
  exists in `customer-app/app/build.gradle.kts`.

**Gate:** `bash tools/pre-codex-smoke.sh customer-app` with `-PexcludePaparazzi` on Windows —
6 steps, non-zero exit stops the story.

---

## 9. Size and risk

Touches 3 screens, 1 design-system primitive, 3 ViewModels, 1 shared card; deletes 1 file and 1
composable; ~7 test files. Against the split gate: new files < 20, domain and data layers untouched,
no external SDK integrations. **No split required**, but upper-end Feature tier. Owner approved a
single PR (2026-08-08).

Cutting search removes the largest new-logic chunk from rev 1; §3.5 shape conformance adds mechanical
work of similar size but far lower risk.

Principal risk remains the `HsSkeletonBlock` change reaching ~7 call sites, two outside the catalogue
(`BookingSummaryScreen`, `PriceApprovalScreen`). The signature change is additive and the visual
change is intended everywhere it lands, but those screens' goldens will move and must be re-recorded
in the same pass.

---

## 10. Acceptance

1. Category grid is reachable in the first screenful on a Pixel 5 viewport.
2. Every state on all three screens renders something designed; every error offers recovery; no raw
   exception text or raw ISO date reaches the user.
3. Skeletons are visible on frame one and animate; reduced-motion renders them static.
4. `HeroSearchBar` is deleted; no inert control remains on the home screen.
5. Zero raw `Color(0x…)` literals remain in the three screens; the `@Suppress("MagicNumber")` at
   `ServiceDetailScreen.kt:324` is gone.
6. **Every corner radius in the three screens is on the D1 customer scale (8/12/20/999).**
6b. **No `colorScheme.primary` remains as a text or icon foreground on a light surface in the three
   screens; `accentInk` measures ≥ 7:1 on both canvas and surface, asserted by a token test.**
7. `CatalogueVisualImage.kt`, its Kover exclusion and its stale detekt baseline entries are gone;
   one `categoryStyle` definition remains.
8. The guarantee copy does not truncate in either locale, fixed by sizing or wrapping — not by
   shortening the English string.
9. `ConfidenceScoreRowPaparazziTest` wraps `HomeservicesTheme`; all five Paparazzi classes in §8 are
   un-ignored, current, and recorded on CI in EN + HI × light + dark.
10. Retry on `ServiceDetailViewModel` re-fires both coroutines.
11. Six-step smoke gate green; Codex review clean.
12. Nothing under `customer-app/app/src/main/res/` is modified.

---

## 11. Raised in review, not folded in

Surfaced by the rev-2 adversarial pass, deliberately left out of S-40. Listed so they are not lost.

- **D1 §State Grammar has six rows; §6 covers three.** "Offline / slow network", "Success" and
  "Destructive" are absent. The offline row is the awkward one, because this spec's own thesis is
  that intermittent network is the common case — yet it specifies no distinct offline treatment,
  only a generic error. Candidate for its own story.
- **Accessibility.** `heading()` semantics after the fold inversion; the 42dp settings `IconButton`
  at `CatalogueHomeScreen.kt:498`, below the 48dp target; TalkBack traversal order once the grid
  moves. S-44 is the scheduled home for this, but the fold inversion changes what S-44 will find.
- **Dynamic type.** A taller category card for Devanagari, hardcoded `.sp` and fixed card heights is
  the classic clipping combination. No `fontScale` coverage is specified anywhere.
- **Fold inversion has no evidence behind it.** Urban Company leads with merchandising because AOV
  comes from cross-sell, and that is a defensible position. The D2 argument is plausible but
  untested. Worth a flag-gated rollout with a before/after analytics baseline rather than a
  permanent assertion.
