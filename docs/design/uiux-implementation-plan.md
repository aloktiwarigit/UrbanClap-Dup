# UI/UX 2026 Implementation Plan — HomeHeroo

Last updated: 2026-07-26
Companion to `docs/design/uiux-audit-2026.md` (findings) and `docs/design/design-language.md` (D1).
Baseline: **D2 — Ayodhya / rural UP, Hindi-first.**

> **Every story below is executable by a Sonnet subagent without further design decisions.**
> Where a judgement call exists, it is resolved here, not deferred. Where a number matters, it is the
> *verified* number from `docs/design/_verified/`, not the raw inventory number.

---

## Read this before planning any token work

The raw inventory is wrong in specific, expensive ways. Verification corrected 53 of 214 claims.
These four corrections change scope materially:

| Do NOT believe | The verified truth | Consequence if ignored |
|---|---|---|
| "12 of 14 tokens are dead" | **6 of 14 names.** The 14 double-counts 7 token sets each dual-exposed as object + CompositionLocal *by design* (`Spacing.kt:4-8`) | You would demolish `HomeservicesRadius` (**26 app call sites** via `MaterialTheme.shapes`) and `HomeservicesElevation` (**37** via `HsSectionCard`) — the two healthiest layers |
| "HsPrimaryButton clips Hindi" | **`HsSecondaryButton`** (48dp) clips; `HsPrimaryButton` (64dp) fits | You would fix the wrong button and leave **23 call sites** broken |
| "9 money formatters" | **≥13** (7 Android + 6 web) | Under-scoped by ~45%; misses `PhotoFirstServiceCard.kt:238`, `HomeservicesFcmService.kt:325` |
| "97 colour literals" | **123 literals on 97 lines** — `grep -c` counts lines | Worst offender is `CatalogueVisualImage.kt` at **31**, not the 11 reported |

**Genuinely dead — safe to delete:** `HomeservicesMotion`, `HomeservicesEasing`,
`LocalHomeservicesMotion`, `HomeservicesShadow`, `HomeservicesElevationShadowsLight`,
`HomeservicesElevationShadowsDark`.

---

## Sequencing rationale

Five phases. The ordering is not preference — each phase unblocks the next.

1. **P0 safety** ships first because those defects are live in installed builds and are not
   cosmetic. Nothing else competes with them.
2. **Token core (D1)** lands second because every per-screen story depends on the palette,
   type stack and scales existing. Doing screens first means doing them twice.
3. **Enforcement** lands immediately after the core. Without detekt rules, the 123 colour literals
   and 465 off-scale values regenerate as fast as they are cleaned — there is currently **no rule in
   either app's `detekt.yml`** forbidding raw `.dp` or `Color(0x`.
4. **Systematic sweeps** (typography, money, states) are mechanical once 2+3 exist, and parallelise.
5. **Per-surface craft** is last, because it is the only phase where the visual bar is actually
   raised rather than merely made consistent.

---

# Phase 0 — P0 safety (in flight)

## S-00 · Customer SOS defects — **DONE**
Branch `fix/p0-safety-sos-joboffer`, commit `61d56257`. SAFE-SOS-001/002/003/004/006.
Full 6-step smoke gate green. SAFE-SOS-005 withdrawn as refuted.

## S-01 · Smoke-gate unblock — **DONE**
Commit `3794a333`. Both failures pre-dated the branch and were verified against the base commit.

## S-02 · Technician lock-screen job offer — SAFE-JOB-001/002/003
**Tier:** Feature · **App:** technician-app · **Est:** 1.5–2h

**Root cause (single, shared by all three):** `JobOfferFullScreenActivity` calls `setContent` once in
`onCreate` (`:101-109`) and **never observes the view model**, so it reacts to none of
`JobOfferUiState.Accepted` / `Declined` / `Expired`.

- **WS-A** — First task, mandatory per root CLAUDE.md: copy
  `customer-app/gradle/libs.versions.toml` → `technician-app/gradle/libs.versions.toml`.
- **WS-B** — Observe `JobOfferViewModel.uiState` in the Activity. On `Accepted` → navigate into the
  job then `finish()`. On `Declined` / `Expired` → brief confirmation, then `finish()`.
- **WS-C** — Fail closed on malformed payload: if `offerFromIntent(intent)` returns `null`
  (`:63-85`), `finish()` **before** `setContent` rather than rendering `Idle` over the lock screen.
- **WS-D** — Register an `OnBackPressedCallback` that sends a decline rather than silently
  discarding a timed offer.
- **WS-E** — `bash tools/pre-codex-smoke.sh technician-app`, then Codex.

**Tests first:** Robolectric Activity tests asserting `isFinishing` after each terminal state; a
null-payload test asserting `finish()` with no composition; a back-press test asserting decline is
emitted.

**Acceptance:** no terminal state leaves the Activity on screen; a malformed FCM never renders; back
always resolves the offer.

---

# Phase 1 — Token core (D1)

> Blocks everything downstream. Do not start Phase 3+ before this merges.

## S-10 · Re-derive the token core to marigold / warm-ink
**Tier:** Foundation · **Module:** design-system · **Est:** 3–4h

- **WS-A** — Rewrite `theme/Color.kt` to the D1 core (accent `#E2A04A`; light canvas `#FBF6E9`,
  surface `#F4EDDF`, text `#1A140F`, border `#D4C9AB`; dark canvas `#0E0B08`, surface `#1A1610`,
  text `#F1E9D8`, border `#2E2719`). Keep the four semantic colours — they already match spec and
  are the only tokens that never diverged.
  **Delete the stale "UX §5.1" header comments**; they claim conformance to a spec this file does
  not implement, which is how the divergence went unnoticed.
- **WS-B** — Add the **missing size/height token category**. This is the root cause of TOK-003:
  three button heights (64/48/52) exist because spacing tokens were borrowed as a stand-in.
  Define `HomeservicesSize` with control heights (e.g. 40/48/56) and retro-fit `HsPrimaryButton`,
  `HsSecondaryButton`, `HsActionButton` onto it.
- **WS-C** — Map the **5 unmapped M3 slots** (`displaySmall`, `headlineSmall`, `titleMedium`,
  `titleSmall`, `labelMedium`) so nothing falls back off the bundled stack. Add **JetBrains Mono**
  as `HomeservicesMonoFontFamily` — Android currently has no mono at all while web does, and
  tabular numerals are needed for money.
  **Do not add a serif.** Fraunces has no Devanagari coverage and cannot set Hindi.
- **WS-D** — Delete the 6 verified-dead token entry points (list above). **Do not touch
  `HomeservicesRadius` or `HomeservicesElevation`.**
- **WS-E** — design-system unit tests + contrast tests; `-PexcludePaparazzi` on Windows.

**Contrast acceptance (D2, non-negotiable):** every body-text pair ≥ 4.5:1, **target 7:1**. The known
offender is `onSurfaceVariant` — currently annotated in-code as "large-text per NFR-A-5" while
`ux-design.md:188` claims ≥4.5:1 is enforced. Fix the token, then fix the comment.

## S-11 · Three surface expressions
**Tier:** Feature · **Module:** design-system · **Est:** 2h · **Depends:** S-10

One core, three expressions (this is `ux-design.md` §1.2's original intent — the intent was right,
the core fractured):

| expression | default mode | radii | density |
|---|---|---|---|
| customer | **light** | 8/12/20 | airy, photo-first |
| technician | **light** | 4/8/12 | dense, tabular numerals |
| admin | dark | 2/4/6 | hairline, mono chips |

Light default for customer + technician is a D2 requirement (outdoor sunlight), not taste.

## S-12 · Align admin-web to the same core
**Tier:** Feature · **App:** admin-web · **Est:** 2h · **Depends:** S-10

Reconcile `globals.css` with the shared core. **Keep** the editorial expression — it is the
best-crafted work in the repo — but derive it from core tokens rather than a parallel set.
**Fill `admin-web/DESIGN.md`**, still the unedited scaffold template with literal `TODO: fill from
the client's brand guide` and placeholder `#...` values. Its emptiness is *why* the rebrand drifted
unchecked; leaving it empty guarantees recurrence.

---

# Phase 2 — Enforcement

## S-20 · Make the scales mechanically enforced
**Tier:** Codemod · **Est:** 1h · **Depends:** S-10

There is currently **no rule** in `customer-app/detekt.yml` or `technician-app/detekt.yml` forbidding
raw `.dp` or `Color(0x`. Add custom detekt rules (or a ktlint ruleset) that fail on:
- `Color(0x…)` literals outside `design-system/theme/`
- `.dp` values not on the spacing scale, **in spacing contexts**
- corner radii not on the radius scale

**Critical scoping note:** these are **three different token categories**, not one. The inventory's
"47.4% off-scale" figure applied a single spacing scale to four categories, which simultaneously
over-counted (1dp `BorderStroke` widths flagged as spacing violations — 40 in customer-app alone,
though **no border-width token exists to violate**) and hid radius violations (16dp is a valid
*spacing* value, so it scored compliant even as a corner radius).

Ship a **border-width token category** as part of this story, or the stroke literals stay
permanently unfixable.

Land this **before** the sweeps, or the sweeps regenerate.

---

# Phase 3 — Systematic sweeps (parallelisable after Phase 2)

## S-30 · Typography — eliminate 130 off-stack usages
**Tier:** Codemod · **Est:** 2h · **Depends:** S-10 WS-C

| app | total | titleMedium | headlineSmall | labelMedium | titleSmall | displaySmall |
|---|---|---|---|---|---|---|
| customer | **76** | 33 | 19 | 13 | 10 | 1 |
| technician | **54** | 18 | 17 | 11 | 5 | 3 |

Once S-10 WS-C maps all 15 slots this becomes a no-op for correctness, but the design-system's own
4 leak sites still need review: `HsComponents.kt:123,155,198` and `LanguagePickerCard.kt:67`
(blast radius: `HsSectionCard` **37** call sites, `HsTimelineStep` 10, `HsInfoRow` 5).

**Do not restate this as "Hindi renders in Roboto".** Roboto ships no Devanagari glyphs, so
Devanagari falls through to the *platform* Noto, not the bundled one. Real defect (uncontrolled,
device-variable font source), different fix.

## S-31 · One money formatter, 13 call sites
**Tier:** Feature · **Est:** 2–3h · **Depends:** S-10 WS-C (mono font)

**Size against 13, not 9.** Build one `formatRupees(paise, locale)` in shared code and replace all
of them. Requirements: ₹ glyph (never ASCII `"Rs"` — currently live at `HsComponents.kt:172` →
2 call sites and `TechnicianHomeScreen.kt:1350` → 5), no integer paise truncation
(`HsPriceText` truncates today), Indian lakh/crore grouping, tabular numerals, locale-aware.

Also remove the orphaned `TechnicianDashboardScreen.kt:129` (`"Rs 0"` hardcoded) — the whole
composable is unreferenced.

## S-32 · Colour literals — 123 across 97 lines
**Tier:** Codemod · **Est:** 2h · **Depends:** S-20

Worst first: `CatalogueVisualImage.kt` **31**, `DpdpConsentScreen.kt` 22, `CatalogueHomeScreen.kt`
20, `PhotoFirstCategoryCard.kt` 11, `ComplaintListScreen.kt` 10.
Also `admin-web/app/global-error.tsx`, which reimplements the design system inline with 7 raw hexes
and `system-ui` — including `#6E665B`, the exact value `globals.css:24` documents as a 3.33:1 AA
failure already remediated everywhere else, and `#2A251E`, which is in no token file at all.

## S-33 · States — empty, error, offline
**Tier:** Feature · **Est:** 3h

Convergent across 6+ clusters. Two specific verified items:
- **`ShieldReportSheet` + `RatingAppealSheet` are the same defect** — `:52,56,74,86` and
  `:52,56,74,81` mirror each other line-for-line, each hardcoding two Devanagari and one English
  literal, in an app whose resources are otherwise **100% translated** (verified: `comm -23` of the
  en/hi key sets returns empty). **Fix as one change.**
- **`PendingActionCard` countdown never ticks** — `:93` reads `System.currentTimeMillis()` once at
  composition, so "28s" stays "28s" until something else recomposes.

Error states must never render a raw exception string (convergent across 7 clusters).

## S-34 · admin-web i18n bypass
**Tier:** Feature · **Est:** 2h

**Hindi parity is already fine** — `hi.json` has **zero** missing keys vs `en.json`. The defect is
~35 user-facing strings that never route through `next-intl` at all, plus raw enums rendered as
labels. Includes the entire `setup` page (0 `next-intl` imports) and the absence of a language
switcher on login/setup (`LocaleSwitcher` mounts only in `(dashboard)/layout.tsx:69`).

## S-35 · admin-web missing sign-out
**Tier:** Codemod · **Est:** 30m

`logout` is implemented in `src/lib/auth/context.tsx:34` and provided at `:52`, but **no component
ever calls it**. There is no sign-out control in the authenticated shell.

---

# Phase 4 — Per-surface craft

Only start once Phases 1–3 have merged; before that, every screen fix is provisional.

Priority order follows commercial and safety weight, not screen count:

1. **S-40 Catalogue + service detail** (customer) — the commercial heart; photo-first merchandising,
   price presentation, trust signals. This is where Urban Company is beaten or matched.
2. **S-41 Booking funnel** — step indicators, edit affordances, a genuine moment of delight at
   confirmation.
3. **S-42 Technician earnings** — the single most-opened technician screen. Resolve the **two
   competing earnings surfaces** first: `EarningsScreen` and the Pay tab render different subsets of
   the same `EarningsSummary` with different currency glyphs (`pendingHeldPaise` renders only at
   `TechnicianHomeScreen.kt:557-566`).
4. **S-43 Admin tables** — sticky headers, sortable columns with `aria-sort`, bulk selection,
   row-density control, keyboard reachability. **None of these currently exist on any table**
   (verified by grep). Row click is `<tr onClick>` with no `tabIndex`/`role`/`onKeyDown`, so the
   entire refund workflow is mouse-only.
5. **S-44 Accessibility pass** — `heading()` appears **exactly once repo-wide**
   (`HsScreenTitle.kt:42`), and `HsScreenTitle` has **0** technician-app usages against 27 in
   customer-app: **technician-app has no TalkBack heading navigation at all.**

---

# Not scheduled — deliberately

- **~760 unverified observations.** They must survive the same adversarial pass before entering any
  story. Do not schedule work from `_inventory/` directly.
- **Photography + illustration.** `ux-design.md` §6.2 specifies "Prestige Shantiniketan-style
  IT-corridor flats" and §6.3 an unbuilt 25-illustration set — both written for the pre-pivot
  Bengaluru persona. Under D2 these need re-briefing for Ayodhya / rural UP before any commissioning
  spend. **Re-brief first; do not implement §6.2/§6.3 as written.**
- **Phosphor Icons** (`ux-design.md` §5.6). Not a dependency; 33 customer + 11 technician files use
  `material.icons`. Migrating is a large mechanical change with low user-visible payoff — defer
  until after Phase 4, or formally amend the spec to adopt Material icons.
- **`docs/design/prompts/earnings-screen-redesign.md`** — proposes a fourth direction ("Warm
  Authority", Sora) and references `theme/Theme.kt` / `theme/Type.kt`, which do not exist.
  Superseded by D1. **Delete it.**

---

# Housekeeping carried by whichever story touches it first

- `docs/UI_DEBT_REGISTER.md` (2026-04-30) lists most audited screens as "Polished". Mark it
  superseded by `uiux-audit-2026.md`.
- `docs/ux-design.md` personas are stale (Bengaluru / DLF Phase 3). Re-baseline to D2 or add a
  header marking §1.2, §6.2 and §6.3 as superseded.
- Root `CLAUDE.md` still calls the project placeholder `homeservices-mvp`; shipped code says
  **HomeHeroo** (`globals.css:4`).
- Duplicate/dead screens flagged across 5 clusters, incl. `PrivacyAndDataScreen` vs
  `PrivacyDataScreen` and the orphaned `TechnicianDashboardScreen`. Confirm against the nav graph
  and delete.
