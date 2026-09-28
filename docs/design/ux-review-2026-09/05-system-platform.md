# 05 — Design system, information architecture, platform conformance, account & settings

Reviewer lane 5 of 5 · 2026-09-26 · baseline `main` @ `6a79f198` (REL-3, customer 0.1.9) · read-only.
Method: impeccable `audit.native.md` (5-dimension technical audit against `android.md`) followed by the
brief's sections F–I. All counts below were produced by the commands shown, run from
`customer-app/app/src/main/kotlin/com/homeservices/customer/` unless stated; `ui` = that `ui/` folder
(91 `.kt` files, 16,461 lines).

**Evidence caveat that shapes this whole file.** The two goldens named for this lane are not evidence of
the current app. `SettingsScreenPaparazziTest` and `SmokeScreenPaparazziTest` are both `@Ignore`d
(`…/settings/SettingsScreenPaparazziTest.kt:11`, `…/ui/SmokeScreenPaparazziTest.kt:18`); their PNGs were
last written on **2026-05-03** (`git log -- <png>` → `1057ebfb`), twelve weeks before the D1 marigold
core landed (`80bc37ed`, 2026-07-28). Opened with the Read tool they show the superseded **forest-green**
palette, and the "dark" Settings golden is pixel-identical to the light one. The design-system
`TokenGalleryPaparazziTest` golden *is* marigold, which proves the tokens moved and the app goldens did
not. Everything about settings-lane pixels below is therefore inferred from source; where a judgement
needs an emulator I say so.

---

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|:-----:|-------------|
| 1 | Accessibility | **2** | Every back arrow in the lane (8 screens) and the Settings gear ship `contentDescription = null`; bottom-nav items expose no `selected` state; 10 controls are `size(44.dp)`. Text is 100 % `sp` and `HsScreenTitle` gives 27 real headings, which keeps this off 1. |
| 2 | Performance | **3** | Lazy lists everywhere that matters; skeleton animates in the draw phase; 3 `items()` without `key`; 0 Coil `crossfade`/`ImageRequest`; 24 dp blurred shadow under a 74 %-alpha glass bar redraws on every scroll frame. |
| 3 | Appearance & Theming | **2** | The token core is genuinely good (15/15 slots mapped, contrast-tested). Adoption is not: 24 `Color(0x` literals + 18 file-private colour constants in `ui`, 184/889 `.dp` off-grid, 84 `RoundedCornerShape(` literals vs 21 `MaterialTheme.shapes`, and the whole delete-account flow paints light-only pink surfaces that invert badly in dark. |
| 4 | Platform Conformance | **2** | Edge-to-edge and insets are done properly. But top-level navigation is a hand-rolled glass bar held in `remember {}`, not a `NavigationBar` + graph: system Back from Bookings/Support/Profile exits the app, rotation snaps to Home, the `NavHost` uses the 700 ms default cross-fade on all 25+ destinations, and 8 screens hand-roll a `Row + IconButton` instead of `TopAppBar`. |
| 5 | Adaptivity | **1** | Zero `WindowSizeClass`/`BoxWithConstraints`/`LocalConfiguration` use; no `imePadding` under edge-to-edge on the one screen with a fixed bottom submit bar; Paparazzi covers PIXEL_5/6 only, no `fontScale` or landscape golden; a tablet gets a stretched phone UI with a 20 dp gutter. |
| **Total** | | **10/20** | **Acceptable — significant work needed** (band 10–13; one point above "Poor") |

### Platform Conformance verdict

**Fail, narrowly.** A fluent Android user would trust the *leaf* screens — M3 `Button`, `OutlinedTextField`,
`AlertDialog`, `Snackbar`, `ModalBottomSheet` (6), `Scaffold` (12), `TopAppBar` (8), edge-to-edge with 55
inset calls across 24 files, predictive-back-capable stack (targetSdk 36, navigation-compose 2.8.9). They
would trip on the *shell*: the glass bottom bar (`CatalogueHomeScreen.kt:793-864`) looks iOS-2023 and
behaves like neither platform — Back does not return to Home, tabs do not survive rotation, the selected
tab is not announced, labels are hard-set to `10.sp`. Specific violations, in order of user impact:

1. Off-platform global nav: custom bar, tab index in `remember { mutableIntStateOf(0) }` (`:226`), not
   in the back stack (`android.md` → "Material navigation, matched to size"; "System Back always works").
2. `NavHost(...)` at `AppNavigation.kt:178` sets no `enterTransition`/`exitTransition` → navigation-compose
   default `fadeIn/fadeOut(tween(700))` for every push and pop. D1 §Motion asks for 200–220 ms
   shared-axis for screen settle and names booking confirmation as a moment that must not be instant-cut.
3. Hand-rolled top bars (`Row { IconButton(size 44) ; HsScreenTitle }`) in 8 files instead of
   `TopAppBar` — no scroll behaviour, no title-collapse, inconsistent 44 dp hit area.
4. `BackHandler { onBack() }` in `DeleteAccountConfirmScreen.kt:92` and `RatingScreen.kt:72` is the
   non-progress overload → predictive-back preview is suppressed while those screens are resumed.
5. Icon set is single-source (`material.icons`) — no drift. Good.

### Executive summary

- Audit Health Score **10/20 (Acceptable)**.
- Findings in this file: **P0 1 · P1 9 · P2 7 · P3 3** (19), plus a compact carried table.
- Top five: (1) the DPDP "Download my data" screen exists but is unreachable — no route registered and the
  only entry point is wired to `null`; (2) top-level IA is a local-state tab bar that breaks Back,
  rotation and deep links, and it triplicates Settings/Profile/Support; (3) every back control in the
  lane is unlabelled for TalkBack; (4) the delete-account flow hard-codes a light pink palette that
  inverts in dark mode and bypasses the existing `HsDangerButton`/`errorContainer` roles; (5) the
  design-system component layer is 11 composables deep, so screens hand-roll list rows (4 variants),
  top bars, icon tiles and cards — `HsSectionCard` has **1** customer usage against **90** raw `Surface(`.
- Next steps: land a real `NavigationBar` + nested graphs (M), collapse Profile/Settings/Support into one
  Account destination (S), register `DATA_EXPORT` (XS), add `HsTopBar`/`HsListRow`/`HsIconTile`/
  `HsEmptyState` to the system and migrate the settings lane onto them (M), then re-record this lane's
  goldens on CI in both locales and both themes (S).

---

## 1. Design system module — verdict

**Would a 12-person team recognise this as a design system?** The *token* half, yes — it is better than
most Series-A Android codebases. The *component* half, no.

**Tokens (strong).** `theme/` exposes eight token sets, each object + CompositionLocal
(`Spacing`, `Radius` per-expression, `Elevation`, `Motion`, `Size`, `BorderWidth`, `ExtendedColors`,
`Typography`), all wired in `HomeservicesTheme.kt:53-73`. `Color.kt` is disciplined: raw constants are
`internal`, every role pair carries a measured contrast figure, and the one known trap (marigold as text
on paper = 2.08:1) is solved by a dedicated `accentInk` role (`ExtendedColors.kt:75-84`). All 15 M3 type
slots map to the bundled Geist + Noto Devanagari family with explicit line heights (`Typography.kt:198-305`)
and this is locked by `D1TypographyCoverageTest`. Contrast is tested (`HomeservicesColorsContrastTest`).

**Components (thin).** `HsComponents.kt` + `HsScreenTitle.kt` + `LanguagePickerCard.kt` = 12 public
composables. Usage in customer `ui/` + `navigation/`:

```
grep -rhoE "\bHs[A-Z][A-Za-z]+\(" --include=*.kt ui navigation | sort | uniq -c | sort -rn
 31 HsPrimaryButton(   27 HsScreenTitle(   26 HsSkeletonBlock(   15 HsSecondaryButton(
  4 HsTrustBadge(       3 HsTimelineStep(   3 HsActionButton(     1 HsSectionCard(
  1 HsPriceText(        1 HsInfoRow(        1 HsDangerButton(
```

Against what screens reach for instead (same grep root, `ui` only):

```
Surface(  90     Card( (M3, \bCard\() 3     RoundedCornerShape(  84    MaterialTheme.shapes  21
TopAppBar( 8 files   hand-rolled "Row + IconButton(44.dp) + HsScreenTitle" top bar  8 files
private fun *Row(/ListItem(/Tile(  19 definitions   (SettingsRow, PrivacyListItem ×2, MenuRow, …)
ModalBottomSheet( 6   Snackbar 34   AssistChip( 7   FilterChip( 2   Switch( 3   Badge( 4
CircularProgressIndicator( 14   LinearProgressIndicator( 2   OutlinedTextField( 13
```

**Missing from the system, hand-rolled in screens:** list row (4 incompatible variants: 88/80/72/~50 dp
tall, 20/20/20/12 dp radius, titleLarge-Bold / titleMedium-Bold / titleMedium-SemiBold / raw 15sp-Medium
— `SettingsScreen.kt:105-145`, `PrivacyDataScreen.kt:137-179`, `PrivacyAndDataScreen.kt:109-147`,
`ProfileScreen.kt:341-391`); top app bar; icon tile (`RoundedCornerShape(14.dp)` × 15 sites); navigation
bar; chip family; bottom sheet scaffold; snackbar styling; empty/error state (D1 §State Grammar requires
one per major screen — there is no `HsEmptyState`); banner/callout (the pink warning card is re-implemented
three times in `deleteaccount/`); badge; avatar (`ProfileScreen.kt:277-289` hand-rolls one); stepper;
text field wrapper; dialog wrapper; section header. `HsSecondaryButton` now uses `defaultMinSize` so the
July "48 dp clips Hindi" defect is fixed (`HsComponents.kt:107`) — preserve.

**Motion tokens are still unconsumed.** `HomeservicesMotion`/`HomeservicesEasing`/`LocalHomeservicesMotion`
(`Motion.kt:24-60`) were declared "genuinely dead — safe to delete" in the July plan; they still exist and
are still provided at `HomeservicesTheme.kt:57`. Consumers in customer-app: **0**
(`grep -rnE "HomeservicesMotion|HomeservicesEasing|LocalHomeservicesMotion" --include=*.kt . | wc -l` → 0).
`rememberReducedMotion` has 1 app consumer (`CatalogueHomeScreen.kt:546`) + `HsSkeletonBlock`. D1 §Motion:
"Shared motion tokens must have real consumers; TokenGallery-only tokens do not count."

**Enforcement (what is mechanical today).**

| Rule | Where | Verdict |
|---|---|---|
| Palette values, contrast, slot coverage, scale values | `design-system/src/test/.../theme/*Test.kt` (13 classes) | Real, but they test the *token module*, not consumers |
| Raw `fontWeight` overrides inside the design system | `HsComponentsTypographyLeakTest` | Real, module-only |
| New `Color(0x`, off-scale spacing/radius **in the apps** | `tools/verify-android-design-tokens.py`, wired to `detekt` and `check` (`customer-app/app/build.gradle.kts:948-956`) | Real but a **ratchet**: passes if debt does not grow vs `tools/android-design-token-baseline.json` — **295 grandfathered lines** for customer-app (227 spacing, 36 radius, 32 raw_color). Also invoked as `python` (build.gradle.kts:953); on this Windows machine `python` is not on PATH, so the local smoke gate cannot run it |
| English literal inside `Text(` | `verifyNoEnglishTextLiterals` Gradle task (`build.gradle.kts` ~:930-946) | Real, but pattern is `Text(` only — misses `HsTrustBadge(text = "Settings")` (`LanguageSettingsScreen.kt:49`) and `HsPrimaryButton(text = "Continue")` (`FirstLaunchLanguageScreen.kt:116`) |
| Cross-surface colour drift (Kotlin vs Figma vs CSS) | `tools/check-token-drift.py` in design-system/admin workflows | Real |
| detekt design rules | `customer-app/detekt.yml`, `design-system/detekt.yml` | **None.** Both files are stock style/complexity/naming; no `ForbiddenMethodCall`, no custom rule set. S-20 said "add custom detekt rules"; what shipped was the Python ratchet |
| Pixel regression | `verifyPaparazziDebug` in CI (`customer-ship.yml:151`) | **30 of 41** customer Paparazzi classes are `@Ignore`d (`grep -rlE "Paparazzi\(" src/test \| xargs grep -l "@Ignore" \| wc -l`); the 11 live ones are all catalogue/trust-dossier. This lane has **zero** live goldens |

---

## 2. Information architecture — verdict

The observation in the brief is literally true and substantively false. `grep -rnE "NavigationBar|
NavigationBarItem|NavigationRail|BottomAppBar" --include=*.kt .` → **1 hit**, and it is
`MainActivity.kt:87: window.isNavigationBarContrastEnforced = false`. There *is* a bottom bar; it is just
not Material's and not a navigation destination.

**How the user actually moves.** `ROUTE_MAIN` starts at `CatalogueRoutes.HOME` (`MainGraph.kt:63`), whose
single composable is `CatalogueHomeScreen`. Inside it, `var selectedNav by remember { mutableIntStateOf(0) }`
(`CatalogueHomeScreen.kt:226`) drives a `Scaffold` whose `bottomBar` is `HomeBottomNav` (`:243`, defined
`:793-828`) with four `navItems` — Home, Bookings, Support, Profile (`:146-152`) — and whose body is a
`when (selectedNav)` (`:289-327`) that inlines `CatalogueTab`, `CustomerBookingsScreen`, `SupportTab` and
`ProfileScreen` as plain composables. Wallet, Settings, Language, Privacy & data, complaints, delete
account and every booking screen are separate `NavHost` destinations pushed on top. Settings is reached
only from the gear in the Home hero (`HeroTopRow`, `:471-519`); it is unreachable from the other three tabs.

**Consequences (all verified in source):**

| Behaviour | Why | Top-tier expectation |
|---|---|---|
| System Back on Bookings / Support / Profile **exits the app** | tab index is not a back-stack entry; no `BackHandler` resets it | Back returns to Home (UC, Zomato, Swiggy all do this) |
| Rotation, or **saving a language**, snaps to the Home tab | `remember`, not `rememberSaveable`; locale change recreates the Activity (comment at `LanguageSettingsScreen.kt:34-36`) | State survives config change |
| No deep link can land on Profile/Bookings | `CustomerRouteSpec.Profile`/`Settings`/`Wallet` exist (`CustomerRoutes.kt:36-38`) but there is no route to navigate to | Notification "your booking is confirmed" opens Bookings |
| Tab switch is a hard cut | `when` branch swap; no `AnimatedContent`/`Crossfade` (`grep … ui navigation` → 6 animation lines in 3 files, none here) | Fade-through, 200 ms |
| TalkBack never says "selected" for the current tab; reads each label twice | `GlassNavItem` uses `Modifier.clickable` (`:846`) with no `Role.Tab`/`selected`; `Icon(contentDescription = label)` (`:851`) **and** `Text(label)` (`:853`) | `NavigationBarItem` gives role + selected + single label for free |
| Hindi labels "प्रोफ़ाइल"/"बुकिंग" at **10 sp** | `labelSmall.copy(fontSize = 10.sp)` (`:858`), `maxLines = 1` | ≥ 12 sp label, wraps or scales |
| Gear icon is a mystery button | `IconButton(size 42.dp)` + `contentDescription = null` (`:502-516`) | Labelled, 48 dp, or removed in favour of the Account tab |

**Duplication.** The same eight actions are spread across three surfaces:

- **Settings** (`SettingsGraph.kt:42-49`): Language · Privacy & data · My complaints.
- **Profile tab** (`ProfileScreen.kt:156-224`): Edit name · Language · Booking history (→ Bookings tab) ·
  Customer service (tel) · Privacy policy (dialog) · Manage privacy (consent) · Privacy and data.
- **Support tab** (`CatalogueHomeScreen.kt:949-995`): Call · My bookings (→ Bookings tab) · Safety card ·
  Profile & language (→ Profile tab).

Three privacy rows in one card (`ProfileScreen.kt:203-222`) with near-identical shield/lock icons is a
recognised cognitive-load failure; "My complaints" is only findable via Home → gear.

**The right IA** for this product and market: a Material `NavigationBar` with **three** destinations —
**Home · Bookings · Account** — each a nested graph with `saveState/restoreState`, Back popping to Home.
Account absorbs profile header, bookings shortcut, language, help/support (call + complaints), privacy
(one row → one sub-screen holding consent, export, delete), sign-out. Support stops being a top-level
tab (Urban Company: Home / Bookings / Rewards / Account; Swiggy/Zomato keep Help inside Account and
inside each order). Remove the gear or make it a shortcut to Account. Wallet, when the flag is on, becomes
a chip on Home and a row in Account, not a fourth tab.

**Transitions, back, haptics, shared element** (customer-app `src/main`):

```
enterTransition|exitTransition|popEnterTransition            0    (NavHost at AppNavigation.kt:178 — defaults)
AnimatedContent|animateContentSize|Crossfade|AnimatedVisibility|animate*AsState   6 lines / 3 files (catalogue + address picker)
sharedElement|SharedTransition                                0
BackHandler                                                   2    (DeleteAccountConfirmScreen.kt:92, RatingScreen.kt:72; both non-progress)
HapticFeedback|performHapticFeedback                          0
enableOnBackInvokedCallback in manifest                       absent → defaults ON for targetSdk 36 (fine)
```

---

## 3. Account & settings screens — A–E condensed

**A. Design specificity.** Could an unrelated product ship these unchanged? **Yes, every one of them.**
Settings is two outlined 88 dp cards with `surfaceVariant` icon tiles and forward arrows — the Compose
tutorial pattern. Profile is an initials avatar + three white cards. Delete-account is a red warning card,
a bulleted "what gets deleted" card and a red button. Data export is a card with a cloud icon. Nothing
carries the D1 promise ("local, legible, trust-led, photo-first"): no photography, no locality, no
technician/trust cue, no brand voice in copy. The only screen with any character is Language settings,
and it opens with an English "Settings" badge on a Hindi UI.

**B. Top-tier gap (one reference per screen).**

- *Profile/Account → Revolut "Account" / Urban Company "Account".* Reference does: full-bleed header with
  name, verification state and a **single** primary trust cue (UC: "Member since · 12 bookings"; Revolut:
  plan badge), grouped `ListItem`s with one-line meaning ("Addresses · 2 saved"), a distinct danger zone
  at the bottom, chevrons only where a push happens. Ours: 64 dp initials disc on 10 %-alpha marigold,
  four privacy-flavoured rows, `+91 xxxxxx1234` literal (`ProfileScreen.kt:299`), a support number that
  reads like a placeholder (`1800-123-456`, `:199-200`), and a sign-out card styled like a menu row.
- *Settings → Airbnb "Settings".* Reference: sectioned list, current value on the trailing edge
  ("Language · हिंदी"), 56 dp rows, no borders — hierarchy from type and spacing. Ours: three 88 dp
  bordered cards with 20 dp radius that look like promo tiles, subtitle only on one row.
- *Delete account → Revolut "Close account" / Apple "Delete Apple ID".* Reference: neutral surfaces, a
  **calm** explanation of consequence and timeline, consequences as a plain list, danger colour reserved
  for the single destructive control, keyboard never covers the CTA, explicit "you can cancel within 7
  days" reassurance *before* the phrase gate, countdown in the user's language. Ours: three pink cards in a
  row (warning, instruction, countdown) so red loses meaning; the English-only countdown string
  ("6 days, 14 hours", `DeleteAccountCoolOffScreen.kt:335-342`) on a Hindi UI; submit bar outside the
  scroll with no IME inset.
- *Data export → Google Takeout mobile.* Reference: explains format and what is included, shows progress,
  confirms where the file went. Ours: fine structurally (Idle/Loading/Error/Saved states exist,
  `HsSectionCard` privacy note) — but unreachable (see F-01).
- *Language → Duolingo language picker.* Reference: native-script name first, flag/glyph, one tap applies.
  Ours is close (`LanguagePickerCard` with radio semantics — a genuine strength) minus the stray English
  badge and an unnecessary Save step.

**C. Nielsen 10 (lane-wide, 0–4).** Visibility of status **3** (states exist; countdown ticks) ·
Match to real world **2** (English countdown, "Privacy and data" vs "Manage privacy" vs "Privacy policy" are
indistinguishable to Riya) · User control **1** (Back exits app from three of four tabs; tab lost on
rotation) · Consistency **1** (four list-row designs, three back-bar designs, two Privacy screens, two
red palettes `#B3261E`/`#DC2626`/`#B00020`) · Error prevention **3** (phrase + last-4 gate, 7-day cool-off,
revoke) · Recognition over recall **2** (Settings only via a hidden gear on one tab) · Flexibility **n/a** ·
Aesthetic & minimalist **2** (bordered cards everywhere; three pink cards on one screen) · Error recovery **3**
(retry on export, snackbar on delete) · Help & docs **2** (privacy policy is a dialog paragraph; no link).

**D. Cognitive load & emotional journey.** Profile's Support card presents **4** rows of which 3 concern
privacy; the Support tab presents 4 cards of which 2 merely switch tabs. High-stakes moment without
reassurance: the delete entry screen states consequence (good) but not the **7-day undo** until after
submission; the cool-off screen's primary CTA is "Revoke" in marigold while the countdown is red — the
emotional read is "something is wrong" rather than "you are safe for 7 days".

**E. Hindi + field conditions.** All lane string keys have Hindi values (`values-hi/strings.xml:393-401,
513-516, 550-562`) — good. Bypasses: `HsTrustBadge(text = "Settings")` (`LanguageSettingsScreen.kt:49`);
English countdown builder (`DeleteAccountCoolOffScreen.kt:335-342`); `FirstLaunchLanguageScreen.kt:105-116`
English literals on the pre-locale screen (defensible for line 69's bilingual title, not for "Continue").
Devanagari fit: nav labels at 10 sp with `maxLines = 1` are the tightest text in the app; `SettingsRow`
title is `titleLarge` (18/26) Bold — matras fit. Sunlight: `onSurfaceVariant` is now 9.27:1 (D1 fix) —
good; the delete flow's `#B3261E` on `#FFF0EE` is ~5.9:1, below the 7:1 field target on the one screen
where reading matters most. Font-scale 1.3: no golden; `SettingsRow` is `height(88.dp)` fixed
(`SettingsScreen.kt:119`) and `PrivacyListItem` `height(80.dp)`/`72.dp` — two-line Hindi at 1.3× will
clip inside a fixed-height row. One-hand reach: primary CTAs are bottom-anchored (good). Offline: no
offline state on any lane screen; export error is generic.

---

## 4. Mechanical checks over `ui/` (commands shown; `ui` = `…/customer/ui`)

| # | Check | Command (from `…/com/homeservices/customer`) | Result |
|---|---|---|---|
| 1 | Raw colour literals | `grep -roE 'Color\(0x' --include=*.kt ui \| wc -l` | **24** occurrences in 11 files (CustomerHomeTabContent 7, WalletScreen 3, PrivacyDataScreen 2, DeleteAccount× 3 files 2 each, CustomerBookingsScreen 2, Profile/DataExport/PhotoFirstServiceCard/AuthScreen 1 each). July verified **123**; S-32 shipped; residue is baselined, not zero |
| 1b | File-private colour constants | `grep -rnE "^private val [A-Za-z]+ = Color\(" --include=*.kt ui` | **18** declarations in 9 files; three different "danger reds" (`#B3261E`, `#DC2626`, `#B00020`) |
| 2 | `.dp` literals / off 4-pt grid | `grep -roE '\b[0-9]+(\.[0-9]+)?\.dp\b' --include=*.kt ui \| wc -l` → 889; off-grid via awk (`n%4!=0 && n>2`, or fractional) | **184 / 889 (20.7 %)**: 14 dp ×54, 6 dp ×32, 10 dp ×29, 18 dp ×25, 22 dp ×7, 3 dp ×6, 5 dp ×5, 0.5 dp ×4 … |
| 2b | Spacing-token references in `ui` | `grep -roE 'HomeservicesSpacing\.' … \| wc -l` = 2; `spacing\.(space…)` = 4 | **≈6** token reads vs 889 literals |
| 2c | Radius | `RoundedCornerShape(` 84 · `MaterialTheme.shapes` 21 · `CircleShape` 18 | Theme shapes lose 4:1 |
| 3 | Type overrides | `fontSize\s*=` **58** · `TextStyle(` **1** (`DpdpConsentScreen.kt:540`, alignment only) · `fontWeight\s*=` **124** | ProfileScreen carries raw `fontSize = 15.sp`/`24.sp` with no `style` (`:252, :284, :370`) |
| 4 | `sp` vs `dp` for text | `\b[0-9]+(\.[0-9]+)?\.sp\b` → **50**, all `fontSize`/`lineHeight`; 0 `TextUnit` in dp | Clean — text scales |
| 5 | `contentDescription = null` | **78** of 103 `contentDescription` lines | Sample of 10, classified: **decorative-OK** `AuthScreen.kt:304,317` (leading icons in text fields with labels), `BookingConfirmedScreen.kt:165` (check icon next to headline), `WomenSafeFilterToggle.kt:36` (icon inside labelled toggle), `CatalogueHomeScreen.kt:581` (promo image beside text); **defect** `SettingsScreen.kt:53` (back), `PrivacyDataScreen.kt:89` (back), `DeleteAccountScreen.kt:126` (back), `CatalogueHomeScreen.kt:513` (Settings gear — the *only* content of the button), `AddressPickerScreenContent.kt:174` (Close/clear icon button). Rule of thumb from the sample: icons *inside labelled text* are fine; every **icon-only `IconButton`** in the lane is unlabelled |
| 6 | `Modifier.clickable` without 48 dp floor | `\.clickable` **20** · `minimumInteractiveComponentSize\|minTouchTarget\|sizeIn(min\|heightIn(min = 48\|size(48\|defaultMinSize` **7** · `size(44.dp)` **10** · `IconButton(` 22 | The 8 hand-rolled back buttons and the 42 dp gear are below `HomeservicesSize.minTouchTarget` (`Size.kt:39`); an explicit outer `.size(44.dp)` caps M3's internal 48 dp enforcement |
| 7 | Lazy items without `key` | `\bitems\(` 8 · with `key\s*=` 4 · `LazyColumn(` 10 · `LazyRow(` 0 | Without key: `CatalogueHomeScreen.kt:417`, `ComplaintListScreen.kt:100`, `WalletScreen.kt:127`, `ServiceListScreen.kt:376` (`items(3)` skeleton — fine). Grep evidence only for the middle two; not opened |
| 8 | Coil | `AsyncImage(` **4** · `rememberAsyncImagePainter` 0 · `crossfade` **0** · `ImageRequest` **0** | No crossfade or explicit request sizing anywhere; catalogue lane owns the fix |
| 9 | Insets | `WindowInsets\|statusBarsPadding\|navigationBarsPadding\|imePadding\|safeDrawingPadding\|systemBarsPadding\|contentWindowInsets` → **55** lines / 24 files; `enableEdgeToEdge()` at `MainActivity.kt:85` | Good coverage; `imePadding` not separately counted — see F-14 |
| 10 | Adaptivity | `LocalConfiguration\|WindowSizeClass\|calculateWindowSizeClass\|BoxWithConstraints\|currentWindowAdaptiveInfo` | **0**. No `screenOrientation` lock in the manifest either — rotation is allowed and (F-02) loses the tab |
| 11 | Hard-coded `Text(` literals | `Text\(\s*"\|text\s*=\s*"[^"$]` minus `stringResource` → **18**; Devanagari `[\x{0900}-\x{097F}]` → **2** (1 comment, 1 intentional bilingual title at `FirstLaunchLanguageScreen.kt:69`) | Real bypasses: `LanguageSettingsScreen.kt:49` "Settings"; `FirstLaunchLanguageScreen.kt:105,110,116`; `SmokeScreen.kt:37,43` (dead code). Rest are brand name, counters, phone mask, "G" glyph. `stringResource(` = 476 |
| 12 | Dark-theme traps | `isSystemInDarkTheme` in `ui` **0** (theme-level only, `HomeservicesTheme.kt:45`); `Color\.(White\|Black…)` **30** lines | 26 of 30 sit on fixed photo/black scrims with a comment explaining why (acceptable); the remaining 4 are white-on-fixed-`ErrorRed` in `DeleteAccountScreen.kt:218` and `DeleteAccountConfirmScreen.kt:323,325,331` — correct given the container, but the container itself is the defect (F-04) |

---

## 5. Section F — Findings

### [P0] "Download my data" (DPDP right-to-access) is unreachable in the shipped app — NEW — confidence high
- **Where:** `navigation/SettingsGraph.kt:60` (`onDownloadData = null`); `navigation/AppNavigation.kt:45`
  declares `LocaleRoutes.DATA_EXPORT` but `grep -rn "DATA_EXPORT\|DataExportScreen(" --include=*.kt .`
  finds **no** `composable(...)` registration; `ui/settings/PrivacyDataScreen.kt:100-108` hides the row
  when the callback is null.
- **What:** `DataExportScreen` (`ui/dataexport/DataExportScreen.kt`, 323 lines, four states, SAF writer,
  tests) is fully built and orphaned. The graph comment says "until Stream 2.3 / PR #211 merges"; the
  screen merged, the wiring never did. The user-visible result is that Privacy & data shows *Manage
  consent* and (flag-on) *Delete account*, never *Download my data*.
- **Why it matters:** Riya cannot exercise a statutory right the product advertises in its privacy copy;
  a Play reviewer or DPDP auditor checking the flow finds a dead end. Also a wasted screen.
- **Top-tier reference:** every regulated consumer app (Revolut, Swiggy) exposes export next to delete.
- **Fix:** register `composable(LocaleRoutes.DATA_EXPORT) { DataExportScreen(onBack = { navController.popBackStack() }) }`
  in `settingsGraph`, pass `onDownloadData = { navController.navigate(LocaleRoutes.DATA_EXPORT) }`, delete
  the "FIX 3 / PR #211" comments in both files.
- **Verification:** navigation test asserting `DATA_EXPORT` resolves; emulator: Settings → Privacy & data
  → Download my data → SAF picker opens. Re-record `PrivacyDataScreen` golden with the row present.

### [P1] Top-level navigation is local state, not navigation — NEW — confidence high
- **Where:** `ui/catalogue/CatalogueHomeScreen.kt:226` (`remember { mutableIntStateOf(0) }`), `:243`
  (`bottomBar = HomeBottomNav`), `:289-327` (`when (selectedNav)` inlining four screens), `:793-864`
  (`HomeBottomNav`/`GlassNavItem`); `navigation/MainGraph.kt:63-75` (single `HOME` destination).
- **What:** Home/Bookings/Support/Profile are branches of a `when`, not destinations. Back from any
  non-Home tab exits the app; rotation or the Activity recreation caused by saving a language resets to
  Home; deep links cannot target a tab; tab switch is a hard cut; the bar items are `clickable` Columns
  with no `Role.Tab`/`selected` semantics and a doubled label.
- **Why it matters:** Riya checks a booking, presses Back to go home, and the app closes. On a language
  save she lands on Home instead of where she was. A notification "technician assigned" cannot open
  Bookings.
- **Top-tier reference:** Urban Company / Zomato: `NavigationBar` destinations are back-stack entries;
  Back from any tab returns to Home; state restores per tab.
- **Fix:** `NavigationBar` + `NavigationBarItem` (M3, animated indicator, semantics for free) in a shell
  `Scaffold`; nested graphs `home/`, `bookings/`, `account/` with `popUpTo(start) { saveState = true }`,
  `launchSingleTop`, `restoreState`; `AnimatedContent` fade-through 200 ms between tabs using
  `HomeservicesMotion.base`; labels `labelMedium` (12 sp) minimum; drop the 24 dp shadow + 74 % alpha glass
  in favour of tonal `surfaceContainer`.
- **Verification:** Robolectric/Compose nav test: navigate to Bookings, press Back → Home destination;
  rotate on Profile → Profile still selected; TalkBack announces "Bookings, tab, 2 of 3, selected".

### [P1] Account IA is triplicated across Settings, Profile tab and Support tab — NEW — confidence high
- **Where:** `navigation/SettingsGraph.kt:42-49`; `ui/profile/ProfileScreen.kt:156-224`;
  `ui/catalogue/CatalogueHomeScreen.kt:949-995` (`SupportTab`), `:471-519` (`HeroTopRow` gear, the only
  path to Settings).
- **What:** Language appears in Settings, Profile and Support; "Bookings" is a tab, a Profile row and a
  Support card; privacy is three rows in Profile (policy dialog, consent, export/delete) plus a Settings
  row; complaints are only in Settings behind a gear that exists on one tab.
- **Why it matters:** Riya has to learn three menus to find one thing; the three shield/lock rows read as
  the same item. Duplication is also why `PrivacyAndDataScreen.kt` and `PrivacyDataScreen.kt` both exist.
- **Top-tier reference:** UC "Account": one screen — profile header, bookings, help & support, settings
  group (language, notifications), privacy & legal group, sign out.
- **Fix:** Three tabs (F-02). Account = Profile + Settings merged; Support becomes an "Help & support" row
  (call, complaints, safety) inside Account and a contextual entry on each booking; one "Privacy & data"
  row → one sub-screen holding consent / export / delete; remove the gear; delete `PrivacyAndDataScreen.kt`
  and the duplicate `LocaleRoutes.PRIVACY_AND_DATA` constant (`AppNavigation.kt:43-44`, same value as
  `PRIVACY_DATA`).
- **Verification:** card-sort with 5 pilot users finds Language/Complaints/Export in ≤2 taps; code: one
  route per feature, `grep -c "settings_language" ui` reaches one screen.

### [P1] Every back control in the lane is unlabelled and under 48 dp — NEW — confidence high
- **Where:** `ui/settings/SettingsScreen.kt:52-53`, `ui/settings/PrivacyDataScreen.kt:86-90`,
  `ui/settings/PrivacyAndDataScreen.kt:74-78`, `ui/deleteaccount/DeleteAccountScreen.kt:123-128`,
  `ui/deleteaccount/DeleteAccountConfirmScreen.kt:162-167`, `ui/deleteaccount/DeleteAccountCoolOffScreen.kt:166-171`,
  `ui/dataexport/DataExportScreen.kt:158-163`, plus the Settings gear `ui/catalogue/CatalogueHomeScreen.kt:502-516`
  (`size(42.dp)`, `contentDescription = null`).
- **What:** `IconButton(onClick = onBack, modifier = Modifier.size(44.dp)) { Icon(ArrowBack, contentDescription = null) }`
  copy-pasted 8 times. TalkBack announces "Button". The outer `size(44.dp)` caps M3's 48 dp minimum.
- **Why it matters:** A TalkBack user cannot leave any settings screen except by system Back; a
  low-vision user in sunlight gets a 44 dp target at the screen's top-left, the hardest one-handed spot.
- **Top-tier reference:** M3 `TopAppBar(navigationIcon = { IconButton { Icon(…, contentDescription = stringResource(R.string.back)) } })`
  — 48 dp, labelled, scroll-aware.
- **Fix:** introduce `HsTopBar(title, onBack, actions)` in the design system wrapping `TopAppBar`, with
  `contentDescription = stringResource(R.string.a11y_back)` and Hindi value; migrate the 8 screens;
  label the gear `settings_title` and size it `LocalHomeservicesSize.current.minTouchTarget`.
- **Verification:** `grep -rn 'contentDescription = null' ui/settings ui/deleteaccount ui/dataexport` → 0
  on `IconButton` lines; Accessibility Scanner run on Settings shows 0 "item label" and 0 "touch target"
  items.

### [P1] Delete-account and privacy screens hard-code a light-only palette; dark theme inverts — CARRIED:TOK-005 (count) / NEW (dark consequence) — confidence high
- **Where:** `ui/deleteaccount/DeleteAccountScreen.kt:50-51` (`ErrorRed #B3261E`, `ErrorRedSurface #FFF0EE`)
  used at `:141-143, :159, :214-218`; `DeleteAccountConfirmScreen.kt:58-59` (`:180-181, :230, :239, :321-325`);
  `DeleteAccountCoolOffScreen.kt:58-59` (`:186-188, :202, :209, :226, :231`); `ui/dataexport/DataExportScreen.kt:56-59`
  (`:294-296`); `ui/settings/PrivacyDataScreen.kt:40-41` (`ShieldBlue #E8EDF5`/`#1A4B8C`, `:114-115`);
  `ui/profile/ProfileScreen.kt:59` (`DangerRed #DC2626`).
- **What:** In dark mode (`HomeservicesDarkColorScheme`, warm ink `#0E0B08`) these render as bright pink
  and pale blue cards on a near-black canvas — the "quick invert" `android.md` forbids. The scheme already
  provides `error`/`errorContainer`/`onErrorContainer` in both modes (`Color.kt:171-175, 208-211`) and
  `HsDangerButton` (`HsComponents.kt:76-95`) exists — customer usage **1**. The delete CTA is a raw `Button`
  with `containerColor = ErrorRed, contentColor = Color.White` (`DeleteAccountScreen.kt:208-219`).
- **Why it matters:** Riya's phone is likely on battery-saver dark mode; the highest-stakes screen in the
  app becomes the ugliest and least legible one. Three different danger reds also mean "danger" has no
  single visual identity.
- **Top-tier reference:** Revolut "Close account": `errorContainer` surfaces in both themes, one danger
  colour role.
- **Fix:** replace the six private constants with `colorScheme.error` / `errorContainer` /
  `onErrorContainer`; replace the three raw red `Button`s with `HsDangerButton`; add an `HsCallout(tone =
  Danger|Info|Success)` component and use it for warning/instruction/countdown cards; delete `ShieldBlue`
  in favour of `secondaryContainer`.
- **Verification:** `grep -rn "Color(0x" ui/deleteaccount ui/settings ui/dataexport ui/profile` → 0;
  dark-theme Paparazzi goldens for all four delete/export screens recorded on CI.

### [P1] Cool-off countdown is English-only — NEW — confidence high
- **Where:** `ui/deleteaccount/DeleteAccountCoolOffScreen.kt:321-349` (`formatCountdown`), specifically
  `:337` (`"$days day${if (days != 1L) "s" else ""}"`) and `:341`.
- **What:** The remaining-time string is built by concatenating English words with ASCII pluralisation.
  On the Hindi UI the headline of the cool-off screen reads "6 days, 14 hours" under a Hindi title.
- **Why it matters:** This is the screen that tells Riya whether her account still exists. The one number
  she must understand is in the wrong language, and Hindi pluralisation differs anyway.
- **Top-tier reference:** any localised countdown: `plurals.xml` + `pluralStringResource` (already used
  once in `RatingScreen.kt:420`), or `RelativeDateTimeFormatter`.
- **Fix:** `R.plurals.cooloff_days` / `cooloff_hours` in `values/` and `values-hi/`, composed via
  `stringResource(R.string.cooloff_remaining, daysText, hoursText)`; keep `formatCountdown` pure but return
  `(days, hours)`.
- **Verification:** unit test for the pair; Paparazzi `locale = "hi"` golden of the cool-off screen.

### [P1] English literals on Hindi screens slip past the literal gate — NEW — confidence high
- **Where:** `ui/settings/LanguageSettingsScreen.kt:49` (`HsTrustBadge(text = "Settings")`);
  `ui/locale/FirstLaunchLanguageScreen.kt:105, 110, 116` ("Choose your language", "Language can be
  changed anytime from Settings.", `HsPrimaryButton(text = "Continue")`); gate at
  `customer-app/app/build.gradle.kts` (`verifyNoEnglishTextLiterals`, pattern anchored on `Text(`).
- **What:** The Gradle guard only inspects `Text(`; design-system components take `text =` and are
  invisible to it. The Hindi-first product's language screen shows an English badge, and the first-run
  screen's primary CTA is English before any locale is chosen.
- **Why it matters:** A Hindi-only user's first tap is on a word she cannot read; the D1 §Content rule
  ("Hindi and English are co-equal … no English-only button labels") is broken on the two screens whose
  whole purpose is language.
- **Top-tier reference:** first-run pickers (Duolingo, Google) render each option in its own script and
  the CTA bilingual or icon-led until a locale is chosen.
- **Fix:** move the four strings to resources; on first-run render the CTA as "जारी रखें · Continue";
  widen the gate regex to `(Text|Hs[A-Za-z]+)\(\s*(text\s*=\s*)?"[A-Za-z]` and prove it catches
  `LanguageSettingsScreen.kt:49` before merging (per the "prove a new guard catches its class" rule).
- **Verification:** gate fails on current `main`, passes after the move; `locale = "hi"` golden of both
  screens shows no Latin words except the brand name.

### [P1] Component layer too thin; four list-row implementations in one lane — CARRIED:TOK-006 — confidence high
- **Where:** `ui/settings/SettingsScreen.kt:105-145` (88 dp, r20, titleLarge Bold);
  `ui/settings/PrivacyDataScreen.kt:137-179` (80 dp, r20, titleMedium Bold);
  `ui/settings/PrivacyAndDataScreen.kt:109-147` (72 dp, r20, titleMedium SemiBold);
  `ui/profile/ProfileScreen.kt:341-391` (padding 14, r12, raw 15 sp Medium); icon tiles
  `RoundedCornerShape(14.dp)` × 15 sites; `HsSectionCard` usage 1 vs `Surface(` 90.
- **What:** The system offers no list row, top bar, icon tile, callout, empty state, avatar or nav bar,
  so each screen invents them with different heights, radii, type roles and borders; the app-local
  "component library" is `ui/components/CountdownChip.kt` (103 lines) and `ui/shared/TrustDossierCard.kt`.
- **Why it matters:** Nothing looks like it belongs to the same product; every craft fix must be made
  four times; D1 §State Grammar cannot be met without an `HsEmptyState`.
- **Top-tier reference:** Airbnb DLS / Cred's component layer — a screen composes rows, headers and
  callouts; it never draws a `Surface` with a border.
- **Fix:** add `HsTopBar`, `HsListRow(leading, headline, supporting, trailing, onClick)` (56/72 dp, no
  border, `surface` on `background`), `HsIconTile`, `HsCallout`, `HsEmptyState`, `HsAvatar`,
  `HsSectionHeader`, `HsNavigationBar`; write the `Hs*` Paparazzi goldens in both themes and `hi`; then a
  codemod story per lane. Enforce with a detekt `ForbiddenMethodCall`-style rule for `Surface(` +
  `.clickable` outside `design-system/`.
- **Verification:** `grep -rc "private fun .*Row(" ui/settings ui/profile` → 0; `HsSectionCard`/`HsListRow`
  usages > raw `Surface(` in `ui`.

### [P1] Navigation has no motion; motion tokens have no consumers — CARRIED:TOK-001 (tokens) / NEW (NavHost) — confidence high
- **Where:** `navigation/AppNavigation.kt:178` (`NavHost` without transitions);
  `design-system/…/theme/Motion.kt:24-60` (declared, provided at `HomeservicesTheme.kt:57`, 0 app reads);
  `ui/catalogue/CatalogueHomeScreen.kt:289-327` (tab hard-cut); `HapticFeedback` 0 hits.
- **What:** All pushes/pops use navigation-compose's default 700 ms fade; booking-confirmed, payment and
  delete-account arrive with the same tired cross-fade as a settings row; no haptic on any confirm.
- **Why it matters:** D1 §Motion names booking confirmation and payment success as moments that must not
  be instant-cut; 700 ms fades also make the app feel slower than it is on a Moto G.
- **Top-tier reference:** M3 shared-axis X for forward/back (200–300 ms emphasized decelerate), fade-through
  between tabs, container transform from service card to detail; a light `HapticFeedbackType.Confirm` on
  booking success.
- **Fix:** `NavHost(enterTransition = sharedAxisXIn(HomeservicesMotion.medium), popExit = …)`; per-route
  overrides for modals (slide-up) and the confirmation moment; `rememberReducedMotion()` → instant cut;
  `LocalHapticFeedback` on primary confirmations. Delete the tokens or use them — not both.
- **Verification:** `grep -rn "enterTransition" navigation` ≥ 1; `grep -rn "HomeservicesMotion\." ui navigation` ≥ 3;
  emulator with Remove animations ON shows instant cuts.

### [P1] Lane has no live pixel regression net; committed goldens show the superseded palette — NEW — confidence high
- **Where:** `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/settings/SettingsScreenPaparazziTest.kt:11`,
  `…/ui/SmokeScreenPaparazziTest.kt:18`, `…/ui/settings/PrivacyAndDataScreenPaparazziTest.kt` (all `@Ignore`);
  goldens `…/snapshots/images/*SettingsScreenPaparazziTest_settings_{light,dark}.png` (last written
  `1057ebfb` 2026-05-03; forest green; light == dark); 30 of 41 Paparazzi classes ignored.
- **What:** CI runs `verifyPaparazziDebug` (`customer-ship.yml:151`) but for this lane there is nothing to
  verify. The goldens that exist would fail if enabled, which is presumably why they stay ignored.
- **Why it matters:** Every finding above about dark mode, Hindi fit and 44 dp targets is invisible to CI
  and will regress silently; a green pipeline is being read as "settings look fine".
- **Top-tier reference:** one golden per screen × {light, dark} × {en, hi} × {1.0, 1.3 font scale}, recorded
  on CI Linux (per repo memory).
- **Fix:** re-record on CI via `paparazzi-record.yml` after the component migration, un-`@Ignore`, delete
  `SmokeScreen.kt` and its test (no call sites: `grep -rn "SmokeScreen(" --include=*.kt .` → definition only).
- **Verification:** `grep -rl "@Ignore" src/test/**/*PaparazziTest.kt | wc -l` drops from 30; settings
  goldens are marigold and light ≠ dark.

### [P2] `PrivacyAndDataScreen.kt` is a dead duplicate — NEW — confidence high
- **Where:** `ui/settings/PrivacyAndDataScreen.kt` (147 lines; `grep -rn PrivacyAndDataScreen --include=*.kt .`
  → only its own file); `ui/settings/PrivacyDataScreen.kt:58-59` and `PrivacyAndDataScreen.kt:48-49` each
  carry a "whichever merges first wins" note; `navigation/AppNavigation.kt:43-44` two constants, one value.
- **What/Why:** Two parallel stories both scaffolded the screen; neither cleaned up. It confuses the next
  implementer and keeps a second row design alive.
- **Fix:** delete the file, its ignored test, and `PRIVACY_AND_DATA`. **Verification:** build green; grep → 0.

### [P2] Ten interactive controls below the 48 dp token — NEW — confidence high
- **Where:** `grep -rn 'size(44.dp)' --include=*.kt ui` → 10 (the 8 back buttons + `CatalogueHomeScreen.kt`
  ×2); gear `:505` 42 dp; `HomeservicesSize.minTouchTarget` (`Size.kt:39`) reads in `ui`: ≤ 7 combined
  with other min-size idioms.
- **Fix:** `HsTopBar` (F-04) removes 8; size the rest from `LocalHomeservicesSize`. **Verification:**
  `grep -rn 'size(4[0-7].dp)' ui | grep -i iconbutton` → 0.

### [P2] Fixed-height rows will clip Hindi at font-scale 1.3 — NEW — confidence med (needs emulator)
- **Where:** `ui/settings/SettingsScreen.kt:119` (`height(88.dp)`), `ui/settings/PrivacyDataScreen.kt:153`
  (`80.dp`), `PrivacyAndDataScreen.kt:121` (`72.dp`); title `titleLarge` Bold + `bodyMedium` subtitle.
- **What:** Two-line Hindi title + subtitle at 1.3× exceeds 88 dp minus 2×16 padding; `Surface.height`
  is fixed so text clips rather than the row growing. `HsSecondaryButton` learned this lesson
  (`HsComponents.kt:107`, `defaultMinSize`); the rows did not.
- **Fix:** `heightIn(min = …)`; `HsListRow` grows. **Verification:** Paparazzi `fontScale = 1.3f, locale = "hi"`.

### [P2] Bottom submit bar not IME-aware under edge-to-edge — NEW — confidence med (needs emulator)
- **Where:** `ui/deleteaccount/DeleteAccountConfirmScreen.kt:113-156` — scrollable column `weight(1f)`,
  `DeleteAccountConfirmSubmitBar` outside it, no `imePadding()`/`navigationBarsPadding()`; Activity is
  `enableEdgeToEdge()` (`MainActivity.kt:85`) with no `windowSoftInputMode`.
- **What:** With decor no longer fitting system windows, `adjustResize` does nothing; the keyboard opened
  for the phrase/PIN fields overlays the submit bar, and the bar also sits under the gesture nav bar.
- **Fix:** `Modifier.imePadding().navigationBarsPadding()` on the bar, or host in `Scaffold(bottomBar)`
  with `contentWindowInsets = WindowInsets.safeDrawing`. **Verification:** emulator, gesture nav, keyboard
  open — Submit fully visible.

### [P2] Support phone number and phone mask are literals — NEW — confidence med
- **Where:** `ui/profile/ProfileScreen.kt:199-200` (`"1800-123-456"`, `tel:1800123456`),
  `ui/catalogue/CatalogueHomeScreen.kt:966` (same number), `ProfileScreen.kt:299` (`"+91 xxxxxx${…}"`).
- **What:** `1800-123-456` has the shape of a placeholder; it is duplicated in two screens; the phone
  mask is hand-built Latin. **Fix:** single `BuildConfig`/remote-config support number; `phone_masked`
  string resource with Hindi variant. **Verification:** owner confirms the number (see §I); grep → 1 source.

### [P2] Typography overrides bypass the ramp in this lane — CARRIED:TOK-002/S-30 (sweep miss) — confidence high
- **Where:** `ui/profile/ProfileScreen.kt:252, 284, 293, 370` (raw `fontSize = 15.sp / 24.sp / 20.sp`, no
  `style`); `ui/catalogue/CatalogueHomeScreen.kt:858` (`10.sp` nav label); lane-wide `fontWeight` overrides
  on `titleMedium`/`titleLarge` which are already SemiBold (`SettingsScreen.kt:131`, `PrivacyDataScreen.kt:168`).
- **What:** `ProfileScreen.kt` (mtime 2026-05-23) predates S-30 and was not swept; 58 `fontSize =` and 124
  `fontWeight =` remain in `ui`. **Fix:** map to `bodyLarge`/`headlineSmall`/`titleLarge`; extend
  `HsComponentsTypographyLeakTest`'s regex to `ui/settings`, `ui/profile`, `ui/deleteaccount`.
  **Verification:** `grep -rn "fontSize =" ui/profile ui/settings ui/deleteaccount ui/dataexport` → 0.

### [P2] Scales are a ratchet, not a rule — CARRIED:TOK-004/TOK-005 — confidence high
- **Where:** `tools/verify-android-design-tokens.py` (baseline diff, `check_app`), baseline
  `tools/android-design-token-baseline.json` (customer 295 lines: 227 spacing, 36 radius, 32 raw_color);
  `customer-app/detekt.yml` (no design rule); `build.gradle.kts:953` invokes `python` (absent on this
  Windows host → local gate silently cannot run it).
- **What:** New debt is blocked; existing debt is frozen at 184 off-grid dp, 84 radius literals and 24
  colour literals, with ~6 spacing-token reads in `ui`. `HomeservicesSpacing.space5/space10` (20/40 dp)
  were added to close the holes (`Spacing.kt:36-43`) but nobody reads them.
- **Fix:** a burn-down story per lane with `--update-baseline` shrinking each PR; a detekt custom rule
  (`Color(0x` outside `design-system/`) so the rule lives with the other lint; invoke `python3`/`py` with
  a fallback. **Verification:** baseline line count trends to 0 across the Phase 4 stories.

### [P3] Dark theme has no in-app choice — NEW — confidence high
- **Where:** `design-system/…/theme/HomeservicesTheme.kt:40-41, 45` (system-driven; docblock promises a
  DataStore wrapper); Settings has no appearance row. D1 §Palette: dark "available on the Android apps as a
  user choice". **Fix:** Account → Appearance (System/Light/Dark) once dark is actually clean (F-05).

### [P3] `SmokeScreen.kt` ships in the production source set — NEW — confidence high
- **Where:** `ui/SmokeScreen.kt` (English literals `:37, 43`; `displayLarge` in `primary` marigold on paper
  = 2.08:1 per `Color.kt:32`); no call sites. **Fix:** delete with its `@Ignore`d test.

### [P3] Language save is a two-step where one tap would do — NEW — confidence med
- **Where:** `ui/settings/LanguageSettingsScreen.kt:54-63` (picker + `HsPrimaryButton` Save; `onSaved`
  pops). **Fix:** apply on select with a snackbar undo, or keep Save but drop the English badge (F-07).
  Reference: Duolingo, Android system language picker.

### Carried findings (compact)

| July id | Status now | Evidence |
|---|---|---|
| TOK-001 six dead token entry points | **Partly carried** — shadows deleted (`Elevation.kt:37-42`); `HomeservicesMotion`/`Easing`/`LocalHomeservicesMotion` still declared and provided, 0 consumers | `Motion.kt`, `HomeservicesTheme.kt:57` |
| TOK-002 unmapped M3 slots | **Fixed** — 15/15 mapped, test-locked | `Typography.kt:198-305`, `D1TypographyCoverageTest` |
| TOK-003 three button heights | **Fixed** — `HomeservicesSize` category; `defaultMinSize` on all three | `Size.kt`, `HsComponents.kt:61,86,107,124` |
| TOK-004 scale compliance | **Carried** — 184/889 dp off-grid, 84 radius literals; ratchet only | §4 rows 2, 2c |
| TOK-005 colour literals | **Carried, reduced** — 123 → 24 in `ui`; 18 private constants | §4 row 1 |
| TOK-006 low adoption | **Carried** — `HsSectionCard` 1 vs `Surface(` 90 | §1 |
| A11Y-002 money | Not this lane; `formatRupees` now exists (`format/Money.kt`), 1 literal `₹` left at `PhotoFirstServiceCard.kt:238` | catalogue lane |
| A11Y-003 contrast | **Fixed** — `onSurfaceVariant` 9.27:1 | `Color.kt:148-151` |
| P2 "TechnicianDashboard orphan / Devanagari literals in sheets" | Out of lane; new orphans found here: `DataExportScreen`, `PrivacyAndDataScreen`, `SmokeScreen` | F-01, F-11, F-19 |
| Systemic: Phosphor icons mandated by ux-design §5.6 | **Not carried** — D1 §Iconography now allows a single Material set; conformance is clean | — |

---

## 6. Section G — Aspirational moves

1. **Account as a trust surface, not a menu.** Header = photo/initials, name, "सदस्य 2026 से · 3 बुकिंग",
   verified-phone tick; first card = "आपकी सुरक्षा" (SOS number, women-safe preference, who can see your
   address). Reference: Urban Company Account + Cred profile. Cost **M**. Dependency: `HsListRow`,
   `HsAvatar`, booking-count API field.
2. **Material 3 shell with fade-through tabs and shared-axis pushes**, predictive back previews intact,
   haptic on confirmation. Reference: Google Play Store / M3 catalog app. Cost **M**. Dependency: F-02
   graph refactor, motion tokens.
3. **Calm deletion.** Neutral surfaces, timeline graphic ("आज → 7 दिन → हट जाएगा"), single red control,
   Hindi countdown as `"6 दिन 14 घंटे बाकी"`, "आप कभी भी रद्द कर सकते हैं" *before* the phrase gate.
   Reference: Revolut close-account, Apple delete-ID. Cost **S**. Dependency: `HsCallout`, plurals.
4. **A living component gallery** — extend `TokenGallery` with `Hs*` components in both themes and both
   locales, recorded on CI, published as the design contract for subagents. Reference: Airbnb DLS
   gallery, Storybook. Cost **S**. Dependency: none (module exists).
5. **Sunlight mode toggle in Account** (higher-contrast variant using `textStrong` everywhere, 1.15×
   type) for the field persona. Reference: Google Maps "high-contrast" / Revolut accessibility.
   Cost **M**. Dependency: an `HsExpression.CustomerHighContrast` scheme + F-17 appearance row.

## 7. Section H — Strengths (preserve)

- **The token core and its tests.** `Color.kt`/`ExtendedColors.kt` reason about contrast in code
  (`accentInk`, `focusRing`); 15/15 type slots with explicit line heights for Devanagari; contrast, scale
  and slot coverage are all unit-tested. This is rarer than it should be.
- **`LanguagePickerCard`** — `selectable(role = Role.RadioButton)` with a real `RadioButton`, native-script
  first, theme roles only, goldens in 4 variants (`design-system/src/test/snapshots/images/…LanguagePickerCard…`).
- **Edge-to-edge done properly** — `enableEdgeToEdge()`, 55 inset calls across 24 files, nav-bar contrast
  not enforced, bottom bar `navigationBarsPadding()`.
- **`HsSkeletonBlock`** — resting fill, draw-phase animation, reduced-motion aware; 26 usages.
- **Delete-account safety model** — phrase + last-4 gate, 7-day cool-off, revoke, `BackHandler` resets
  ViewModel so the confirm screen cannot trap the user.

## 8. Section I — Questions for the owner

1. Is `1800-123-456` a real, staffed support line? It is hard-coded in two places and dialled from both.
2. Was the DPDP "Download my data" flow deliberately left unreachable pending a policy decision, or is
   this simply the un-merged wiring the comment describes? (Determines whether F-01 ships as a one-line fix.)
3. Approve the three-tab IA (Home · Bookings · Account) and the removal of Support as a top-level tab?
   This is the one change every other lane will inherit.
4. Is dark mode a supported pilot surface (test it, fix it, expose a toggle) or should the customer app
   force light until Phase 4 lands? Today it is system-driven and visibly unfinished in this lane.
5. `python` is not on the Windows PATH, so `verifyDesignTokenUsage` cannot run in the local smoke gate;
   should the gate hard-fail when the interpreter is missing rather than passing silently?

---

## Scorecard

| Screen | Specificity (0-4) | Craft (0-4) | Trust (0-4) | Hindi/field (0-4) | Gap-to-top-tier (one phrase) |
|---|:-:|:-:|:-:|:-:|---|
| Bottom-nav shell (`HomeBottomNav`) | 1 | 2 | 2 | 1 | Local-state glass bar; needs M3 `NavigationBar` + graph |
| Settings | 1 | 2 | 2 | 2 | Tutorial cards behind a hidden gear; fold into Account |
| Language settings | 2 | 3 | 3 | 2 | English "Settings" badge; extra Save step |
| Privacy & data | 1 | 2 | 2 | 2 | Export row hidden; duplicate screen file; light-only blue tile |
| Profile tab | 1 | 2 | 1 | 2 | Three privacy rows, placeholder phone, raw type; no trust cue |
| Support tab | 1 | 2 | 2 | 2 | Two of four cards just switch tabs; should be a row in Account |
| Delete account (entry) | 1 | 2 | 2 | 2 | Hard-coded pink palette; 7-day undo not stated up front |
| Delete account (confirm) | 1 | 2 | 3 | 2 | Keyboard likely covers Submit; red used three times |
| Delete account (cool-off) | 1 | 2 | 2 | 1 | English countdown on the one screen that must be understood |
| Data export | 2 | 3 | 3 | 3 | Well-built and unreachable |
