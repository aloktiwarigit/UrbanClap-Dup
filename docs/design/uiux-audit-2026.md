# UI/UX Audit 2026 — HomeHeroo

Last updated: 2026-07-26
Baseline: **D2 — Ayodhya / rural Uttar Pradesh, Hindi-first** (see `SESSION-STATE.md`)
Direction: **D1 — marigold / warm-ink, one token core, three expressions** (see `design-language.md`)

## Status and provenance

| | |
|---|---|
| Surfaces inventoried | **123** (95 Phase 0 + 28 from cluster X2) |
| Raw observations | 978 + 31 from X2 |
| **Claims adversarially verified** | **214** |
| — CONFIRMED | 159 |
| — **CORRECTED** (real problem, wrong mechanism/scope/severity) | **53** |
| — REFUTED | 2 |
| Screenshot evidence | 35 PNG + 25 XML, `artifacts/uiux-2026/screens/` |

**Only verified findings appear below.** The remaining ~760 observations are in
`docs/design/_inventory/` and are **not** promoted. Verdict files: `docs/design/_verified/`.

A 25% correction rate is the headline process fact. Plausible, well-cited findings repeatedly had
the wrong mechanism. Two examples that would have caused real damage:

- *"12 of 14 design tokens are dead"* → only **6 of 14 names** are unreachable, and the 14 double-counts
  7 token sets that are each dual-exposed as object + CompositionLocal by design. Radius and elevation
  are **alive and healthy**. Acting on the original would have demolished the two best-functioning
  layers of the system.
- *"HsPrimaryButton clips Hindi labels"* → the clipping button is **HsSecondaryButton**. A developer
  would have fixed the wrong button and left 23 broken call sites untouched.

---

# P0 — Safety

These were invisible to Phase 0 because its glob was `*Screen.kt`; they live in sheets, dialogs and
activities. They are the most serious findings in this document.

## SAFE-SOS-001 — Any incidental gesture cancels an in-flight emergency

`SosBottomSheet.kt:34` — `ModalBottomSheet(onDismissRequest = onCancel, ...)`, wired at
`LiveTrackingScreen.kt:152` to `sosViewModel.onCancel`.

Swipe-down, scrim tap, and system back **all cancel the SOS**, with no confirmation. A customer
fumbling a phone during the exact incident SOS exists for will silently disarm it. Nothing
distinguishes an accidental dismissal from a deliberate cancel.

**Fix:** `onDismissRequest` must not cancel. Require explicit confirmation to abort an armed SOS;
treat dismissal as "keep running, minimise".

## SAFE-SOS-002 — SOS is unreachable during EN_ROUTE and REACHED

`LiveTrackingScreen.kt:100` — `if (isInProgress) {` wraps the entire SOS `IconButton`.

The control exists only once work has started. It is **absent** while the technician is travelling to
the address and while they are at the door. Those are the windows in which a customer is alone with
an arriving stranger and has the least context — the highest-risk period of the entire booking.

**Fix:** SOS must be present from assignment through completion, and in the post-completion window.

## SAFE-SOS-003 — Emergency control is icon-only, 24dp, unlabelled

`LiveTrackingScreen.kt:101-107` — `IconButton { Icon(Icons.Filled.Warning, ...) }`.

Directly violates the owner-locked baseline rule *icon + text, never icon alone* — on the one control
where a wrong guess has physical consequences, for a mixed-literacy user who has likely never seen
this iconography. `contentDescription` helps TalkBack only; it does nothing for a sighted user who
cannot read the glyph's intent.

**Fix:** labelled control ("SOS / आपात"), danger-coloured, minimum 48dp target.

## SAFE-SOS-004 — Send and Cancel are visual peers, and Send is brand-coloured

`SosBottomSheet.kt:59-69` stacks `HsPrimaryButton` (bare M3 `Button` with theme colours,
`HsComponents.kt:41-47`) directly above the cancel action.

The irreversible emergency action carries **brand primary**, not danger styling, and has the same
weight as the reversible one. Semantic colour exists (`error #D73C3C`) and is unused here.

## ~~SAFE-SOS-005 — 30s countdown with no immediate-send path~~ **REFUTED 2026-07-26**

**This finding was wrong and is withdrawn.** Verified against source: `SosViewModel.onSendNow()`
(`SosViewModel.kt:85-90`) cancels the countdown job and fires immediately, and it is wired to the
**primary** button of the countdown sheet (`LiveTrackingScreen.kt:152` → `SosBottomSheet.kt:59-63`,
`R.string.sos_send_now`).

The 30s countdown is therefore a grace period with an always-available immediate override — which is
correct emergency UX, not a defect. No work required.

*Recorded rather than deleted: the inventory claim reached the audit and would have caused someone to
add a second immediate-send path that already exists.*

## SAFE-SOS-006 — Evidence-upload failure discards the error and cannot be retried

`SosBottomSheet.kt:124-127` — `@Suppress("UnusedParameter") internal fun SosEvidenceUploadErrorSheet(message: String, onDismiss: () -> Unit)`.

The `message` parameter is suppressed and unused: the real failure reason is computed, passed in, and
thrown away. The sheet offers dismissal only — no retry — so safety evidence tied to an emergency is
lost silently.

## SAFE-JOB-001 — Lock-screen offer Activity never finishes

`JobOfferFullScreenActivity.kt:101-119` contains **no** `finish()` call, no back-press callback, and
no state collection.

After Accept, Decline, or Expiry the technician is left on a static full-screen message over the lock
screen with no button and no navigation. The only escape is the system task switcher.

## SAFE-JOB-002 — Malformed FCM payload renders a dead full-screen over the lock screen

`JobOfferFullScreenActivity.kt:63-85` — `offerFromIntent` returns `null` when any extra is missing,
and `emitIntentOffer` (`:117-119`) proceeds regardless. The failure mode is a blank interactive-dead
page over the lock screen rather than failing closed.

## SAFE-JOB-003 — System back discards a timed offer without declining

No `OnBackPressedCallback` is registered anywhere in `JobOfferFullScreenActivity.kt`. On a screen
whose entire purpose is a timed accept/decline decision, back silently drops the offer — the
technician neither accepts nor declines, and dispatch learns nothing.

---

# P0 — Flow blockers

## CUST-LANG-001 — First-run language picker can block entry

*(Retained from the 2026-07-26 capture session; screenshot-verified, mechanism still to be pinned.)*

Evidence: `artifacts/uiux-2026/screens/customer-app/language-picker-emulator-enhi-light-720x1600.png`,
`post-english-continue-emulator-light-720x1600.png`, `post-language-emulator-hi-light-720x1600.png`.

In emulator the picker remained visible after tapping Continue with English selected, and after the
Hindi path. XML exposed Continue as enabled/clickable but the state did not advance to auth. The
Hindi row was not exposed as a separate clickable node.

Suspected mechanism: `SetAppLocaleUseCase.kt:17` applies `AppCompatDelegate.setApplicationLocales(...)`,
which its own comment notes can recreate the Activity; `FirstLaunchLanguageScreen.kt:85` waits on
`confirmedFlow` before `onConfirmed`; `AppNavigation.kt:193` routes only on that callback. If
recreation precedes delivery, the event is lost.

**Fix:** route from persisted `firstLaunchPending == false` on restart rather than a transient
in-composable flow; add an instrumented test asserting auth is reached for both languages.

## TECH-LOC-001 — Technician onboarding dead-ends on location capture

> **Corrected during verification.** An earlier draft claimed `ServiceSelectionViewModel.kt:120`
> clears `isLocating` "only when `onLocateFailed` is called" and implied error handling was missing.
> Both were wrong. `isLocating` is cleared at **`:105`, `:112`, `:123`**, and failure listeners exist
> at `ServiceSelectionScreen.kt:511` and `:516`.

Two independent defects, different fixes:

**(a) The spinner can never terminate.** `ServiceSelectionScreen.kt:498` calls
`getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, null)` — the second argument is the
`CancellationToken`, so there is no timeout and no cancellation path. Every *terminal* outcome is
handled; a `Task` that never terminates fires no listener at all, so none of the three resets run.
`Save and continue`, disabled on `!uiState.isLocating` (`:219`), stays dead permanently. No
`addOnCanceledListener` and no app-level timeout exist (`:492-519`).

**(b) GPS is a hard gate with no fallback — the larger risk.** `validate()`
(`ServiceSelectionViewModel.kt:178-183`) rejects submission without a fix.
`grep -c "manual|city|locality|pincode"` returns **0** across both files. The
`?: DEFAULT_SERVICE_LAT/LNG` defaults in `submit()` (`:139-142`) are **unreachable dead code** that
make a fallback appear to exist. This blocks onboarding **even after (a) is fixed** — for any
technician indoors, in dense construction, or on a weak-GPS handset.

**Fix (a):** real `CancellationTokenSource` + ~10-15s app timeout calling `onLocateFailed`; try
`lastLocation` first; add `addOnCanceledListener`.
**Fix (b):** locality-first manual selector (**not** lat/lng fields — no target user will complete
those); relax `validate()`; delete the unreachable defaults.

---

# P1 — Systemic: the design language has fractured four ways

Not one token matches across all three shipped surfaces.

| | `ux-design.md` §5 (spec) | `design-system/` (Android) | `admin-web` |
|---|---|---|---|
| primary | `#0E4F47` teal | `#0B3D2E` forest | `#E2A04A` marigold |
| accent | `#EF6F4B` coral | `#B68A2C` brass | marigold |
| canvas | `#FFFFFF` | `#FBF7EF` cream | `#0E0B08` ink, dark-default |
| radii | 4/8/12/20 | 4/8/12/20 | **2/4/6 — "editorial = sharp"** |
| display | Geist Bold | Geist Bold | **Fraunces serif** |
| mono | Geist Mono | **none** | JetBrains Mono |
| motion | 150/200/300/500 | 150/200/300/500 | **120/220/420** |

Evidence: `ux-design.md:170-188,230-265` · `theme/Color.kt:16-45` · `globals.css:10-64,137-175` ·
`layout.tsx:4-32`. A fourth, unexecuted direction ("Warm Authority", Sora) sits in
`docs/design/prompts/earnings-screen-redesign.md` and is **superseded by D1 — delete it**.

Supporting integrity defects:
- `Color.kt` header cites "UX §5.1" while diverging from it on every brand and neutral value. Only
  the four semantic colours match spec.
- `admin-web/DESIGN.md` is still the **unfilled scaffold template** — literal `TODO: fill from the
  client's brand guide`, placeholder `#...` values. The web surface has no token contract, which is
  how the editorial rebrand drifted unchecked.
- §5.6 mandates **Phosphor Icons**; Phosphor is not a dependency. 33 customer + 11 technician files
  use `material.icons`.
- §5.4 defines `motion.base`/`medium` as **springs**; `Motion.kt:477-479` states springs are
  "intentionally absent". The spec's default transition does not exist on Android.

## TOK-001 — Six token entry points are genuinely unreachable

> **Corrected.** The inventory claimed 12 of 14. All 14 grep counts were exactly right, but the
> framing was wrong twice over: there are **7 token sets**, each dual-exposed as object +
> CompositionLocal (that dual exposure is documented, intentional design — `Spacing.kt:4-8`), and a
> zero direct-reference count does not mean dead. The argument self-destructs on
> `HomeservicesTypography`, which also greps to 0 yet reaches all **533** `Text` calls.

**Genuinely dead (no path from declaration to pixel):** `HomeservicesMotion`, `HomeservicesEasing`,
`LocalHomeservicesMotion`, `HomeservicesShadow`, `HomeservicesElevationShadowsLight`,
`HomeservicesElevationShadowsDark`.

`HomeservicesShadow`: all 11 repo-wide references are its own declarations (`Elevation.kt:42`,
`:59-71`, `:81-93`). Its docblock (`:36-41`) describes a `Modifier.shadow` consumption that never
happened.

**Alive and healthy — do not touch:** radius reaches **26 app call sites** (customer 19, technician 7)
plus 3 design-system sites via the `MaterialTheme.shapes` mapping at `HomeservicesTheme.kt:52-59`;
elevation reaches **37** `HsSectionCard` call sites via `HsComponents.kt:117`; colour and typography
reach every screen via `HomeservicesTheme.kt:39,51`.

## TOK-002 — 130 unmapped-M3-slot usages fall back off the bundled type stack

`Typography.kt:145-147,149-221` maps only 10 of 15 slots; the omission is deliberate and documented.

| app | total | titleMedium | headlineSmall | labelMedium | titleSmall | displaySmall |
|---|---|---|---|---|---|---|
| customer | **76** | 33 | 19 | 13 | 10 | 1 |
| technician | **54** | 18 | 17 | 11 | 5 | 3 |

The design system leaks these into consumers at 4 sites — `HsComponents.kt:123,155,198` and
`LanguagePickerCard.kt:67`. Blast radius: `HsSectionCard` **37** call sites, `HsTimelineStep` 10,
`HsInfoRow` 5.

> **Corrected — and this corrects a claim I made earlier in this engagement.** For **Latin** text
> these render in Roboto instead of Geist. For **Devanagari** they do *not*: Roboto ships no
> Devanagari glyphs, so `हिन्दी` at `LanguagePickerCard.kt:67` falls through to the *platform* Noto
> rather than the *bundled* one. Still a defect — uncontrolled font source, version-variable across
> devices — but milder and different from "Hindi renders in Roboto".

Note in the system's favour: the `Hs*` buttons' own labels **do** render in Geist, because M3 `Button`
supplies `labelLarge`, which is mapped.

## TOK-003 — No size/height token category exists, producing three button heights

`HsComponents.kt:44,60,77` — 64dp, 48dp, 52dp, from three different sourcing strategies, because the
module has no height token category and spacing tokens are borrowed as a stand-in
(`Spacing.kt:43,46`).

**HsSecondaryButton (48dp) is the one that clips Hindi**, not HsPrimaryButton. Two lines of
`labelLarge` (14sp/20sp, `Typography.kt:207-213`) plus `ButtonDefaults` padding ≈ 56dp: fits inside
64dp, overflows 48dp by 8dp. `HsSecondaryButton` has **13 customer + 10 technician** call sites.
`HsActionButton` is already immune via `maxLines = 1` + `TextOverflow.Ellipsis` (`:101-102`).

`HsActionButton` is also a true scale contradiction on four values that exist on neither scale —
52dp height, 14dp radius, 22dp icon box, 10dp spacer (`:77,78,92,95`).

## TOK-004 — Scale compliance, measured correctly

> **Corrected.** The inventory reported "47.4% off-scale" by applying one spacing scale to four token
> categories. That simultaneously **overstated** (counting 1dp `BorderStroke` widths as spacing
> violations when no border-width token exists to violate — 40 in customer-app alone) and **hid**
> radius violations (16dp is a valid *spacing* value, so it scored compliant even as a corner radius).

| | spacing violations | radius violations |
|---|---|---|
| customer-app | 316 / 727 (43.5%) | **67 / 93** |
| technician-app | 149 / 338 (44.1%) | **20 / 30** |
| design-system | 11 | — |

A third bucket of 48 stroke/border literals is **not** a violation — it is a missing token category.
Radius violations were never quantified before this pass.

## TOK-005 — 123 raw colour literals, and nothing mechanically prevents more

> **Corrected.** "97 literals" was a `grep -c` **line** count. There are **123** literals on 97 lines,
> and the per-file ranking was wrong.

Worst offenders: `CatalogueVisualImage.kt` **31**, `DpdpConsentScreen.kt` 22, `CatalogueHomeScreen.kt`
20, `PhotoFirstCategoryCard.kt` 11, `ComplaintListScreen.kt` 10.

No rule in `customer-app/detekt.yml` or `technician-app/detekt.yml` forbids raw `.dp` or `Color(0x`.
**Nothing enforces any of the three scales** — which is why all of the above drifts.

## TOK-006 — Design-system adoption is low; containers are the worst case

`customer-app` uses raw `Surface(` **98** times against **10** `HsSectionCard` usages.

---

# P1 — Accessibility

## A11Y-001 — technician-app has no TalkBack heading navigation at all

`heading()` appears **exactly once repo-wide** — `HsScreenTitle.kt:42`. `HsScreenTitle` has **0**
technician-app usages against **27** in customer-app. A TalkBack user cannot navigate technician
screens by heading.

## A11Y-002 — Money renders 13 different ways

> **Corrected upward.** The inventory said 9 formatters; there are **at least 13** (7 Android +
> 6 admin-web), producing ≥6 different outputs for the same amount. Three were missed entirely,
> including `PhotoFirstServiceCard.kt:238` and `HomeservicesFcmService.kt:325`. **Any remediation
> sized against "9" will under-scope.**

ASCII `"Rs"` ships at 2 live Android sites (`HsComponents.kt:172` → 2 call sites;
`TechnicianHomeScreen.kt:1350` → 5 call sites) plus 1 dead site
(`TechnicianDashboardScreen.kt:129`, orphaned composable). `HsPriceText` also integer-truncates paise.

## A11Y-003 — Contrast

`onSurfaceVariant` `#5F6C66` on surface `#FFFDF8` is annotated in-code as "large-text per NFR-A-5"
(`Color.kt:123,158`) — i.e. knowingly sub-AA at body size — while `ux-design.md:188` asserts
"Contrast ratios ≥ 4.5:1 enforced (NFR-A-5)". Against the D2 sunlight target of 7:1 this fails across
every secondary-text run in both apps.

> **Corrected down:** admin mobile bottom-bar targets compute to ~46px and **meet** 44px — no defect.
> Desktop rail links compute to ~35px: below the AAA 44px guideline, but they pass WCAG 2.2 AA's
> 24×24 minimum and this is a mouse-driven console. Severity: low.

---

# P2 — Content, state and motion

- **ShieldReportSheet + RatingAppealSheet are the same defect** — `ShieldReportSheet.kt:52,56,74,86`
  and `RatingAppealSheet.kt:52,56,74,81` mirror each other line-for-line, each hardcoding two
  Devanagari and one English literal, in an app whose string resources are otherwise **100%
  translated** (verified: `comm -23` of the en/hi key sets returns empty). Fix as one change.
- **`PendingActionCard` countdown never ticks** — `:93` reads `System.currentTimeMillis()` once at
  composition, so a card reading "28s" keeps reading "28s" until something else recomposes.
- **admin-web Hindi parity is fine; the defect is bypass** — `hi.json` has **zero** missing keys
  against `en.json`; ~35 user-facing strings never route through `next-intl` at all.
- **`TechnicianDashboardScreen` is orphaned** — no reference anywhere in technician-app.

---

# Not covered — read before trusting scope

- **~760 observations remain unverified** and must not be promoted without the same treatment.
- **Admin authenticated surfaces have no screenshot evidence.** All admin contrast figures other than
  those already annotated in `globals.css` are computed from hex, not measured in a browser.
- **No Hindi screenshots exist.** The first customer state rendered English on the emulator despite
  the Hindi-first decision — verify locale initialisation separately.
- **The authenticated technician capture is no longer reproducible.** The production Firebase audit
  accounts were deleted 2026-07-26 at the owner's direction; existing screenshots remain valid
  evidence. Use a non-prod project or the Auth emulator for future capture.
- **`docs/UI_DEBT_REGISTER.md` (2026-04-30) is superseded by this document.** It lists most of these
  screens as "Polished".
- **`docs/ux-design.md` personas are stale** — "Riya, Bengaluru marketing manager", "DLF Phase 3",
  and §6.2's "Prestige Shantiniketan-style IT-corridor flats" photography direction all predate the
  Ayodhya pivot and contradict D2. §6.3's 25-illustration library is unbuilt.
