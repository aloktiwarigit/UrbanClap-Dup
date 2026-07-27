# UI/UX 2026 Session State

Last updated: 2026-07-26 | Session: recovery/review + emulator/admin/auth capture + first verified audit slice + **independent review & commit** | Phase: 1 repaired, screenshot capture partial, Phase 3 verification partial (214 of ~1009) | Worktree: `C:\Alok\Business Projects\Urbanclap-dup` | Branch: **`docs/uiux-2026-audit`**

This file is the handoff contract. Trust disk over older conversation history.

> **Parallel work in flight — read before touching customer-app.** The P0 SOS fixes are being done in a
> **separate worktree**, not here:
> `C:\Alok\Business Projects\homeservices-safety-p0` on branch **`fix/p0-safety-sos-joboffer`**
> (commits `61d56257` SAFE-SOS-001/002/003/004/006, `3794a333` smoke-gate unblock; 11 files).
> **This worktree still contains the unfixed code** — that is expected, not a regression. Do not
> re-fix SOS here, and do not cite `LiveTrackingScreen.kt` line numbers from this tree as current.

## Current Verdict

Phase 1 is now usable, but only after repair in this session.

- The owner decision from the previous agent stands: **Marigold / warm-ink, Hindi-first, rural-UP, one token core with three surface expressions**.
- The required Phase 1 artifact was missing. It now exists at `docs/design/design-language.md`.
- A Phase 1 review was added at `docs/design/phase1-review.md`.
- **UPDATE 2026-07-26 (later):** Phase 3 verification is complete and `docs/design/uiux-audit-2026.md`
  is now a real audit, not a stub. **214 claims adversarially verified: 159 CONFIRMED, 53 CORRECTED,
  2 REFUTED.** Verdict files in `docs/design/_verified/` (V1 typography/tokens, V2 i18n/Hindi,
  V3 money/a11y, V4 states/motion). Cluster `X2` closed the coverage gap: **+28 surfaces, 31 high**,
  including the SOS and lock-screen-offer surfaces that the `*Screen.kt` glob had hidden. Total
  inventoried surfaces: **123**.
- **Still missing: `docs/design/uiux-implementation-plan.md`.** That is the next artifact. Do not
  start screen implementation before it exists.
- The 53 CORRECTED verdicts matter more than the 159 confirmations. Two would have caused real damage
  if acted on unverified: "12 of 14 tokens dead" (actually 6 of 14 names; radius + elevation are the
  healthiest parts of the system and would have been demolished), and "HsPrimaryButton clips Hindi"
  (it is **HsSecondaryButton**, 23 call sites, that clips). **Read `_verified/` before planning any
  token work — the raw inventory numbers are wrong in specific, expensive ways.**

## Completed

- [x] Phase 0 inventory fragments exist for all recovered clusters:
  - `A1.json` 24 surfaces, 128 observations
  - `A2.json` 27 surfaces, 196 observations
  - `A3.json` 23 surfaces, 107 observations
  - `C1.json` 5 surfaces, 55 observations
  - `C2.json` 3 surfaces, 44 observations
  - `C3.json` 7 surfaces, 47 observations
  - `C4.json` 5 surfaces, 53 observations
  - `C5.json` 9 surfaces, 69 observations
  - `T1.json` 6 surfaces, 62 observations
  - `T2.json` 5 surfaces, 73 observations
  - `T3.json` 8 surfaces, 73 observations
  - `X1.json` 8 surfaces, 71 observations
- [x] Flattened observations exist in `docs/design/_inventory/_observations.json`.
- [x] Current flattened observation count: **978**.
- [x] Severity distribution: 310 high, 401 medium, 225 low, 42 blank/uncategorized.
- [x] Phase 1 decision captured and normalized into `docs/design/design-language.md`.
- [x] Emulator setup used for first evidence pass:
  - Device: `emulator-5554`
  - Customer debug APK installed from `customer-app/app/build/outputs/apk/debug/app-debug.apk`
  - Technician debug APK installed from `technician-app/app/build/outputs/apk/debug/app-debug.apk`
  - Target capture viewport used for audit screenshots: 720x1600, density 280
  - Emulator restored after capture to default size/density, light mode, font scale 1.0
- [x] Customer screenshot evidence captured for reachable first state:
  - `artifacts/uiux-2026/screens/customer-app/dpdp-consent-emulator-en-light-720x1600.png`
  - `artifacts/uiux-2026/screens/customer-app/dpdp-consent-emulator-en-dark-720x1600.png`
  - `artifacts/uiux-2026/screens/customer-app/dpdp-consent-emulator-en-dark-font200-720x1600.png`
  - XML dumps exist for light and dark/font200 variants.
- [x] Technician screenshot evidence captured for reachable first state:
  - `artifacts/uiux-2026/screens/technician-app/onboarding-gate-emulator-en-light-720x1600.png`
  - `artifacts/uiux-2026/screens/technician-app/onboarding-gate-emulator-en-dark-720x1600.png`
  - `artifacts/uiux-2026/screens/technician-app/onboarding-gate-emulator-en-dark-font200-720x1600.png`
  - XML dumps exist for light and dark/font200 variants.
- [x] Additional screenshot capture log written:
  - `docs/design/screenshot-capture-log.md`
- [x] Admin-web unauthenticated screenshots captured with Playwright:
  - `artifacts/uiux-2026/screens/admin-web/login-hi-desktop-1440.png`
  - `artifacts/uiux-2026/screens/admin-web/login-hi-mobile-390.png`
  - `artifacts/uiux-2026/screens/admin-web/login-en-desktop-1440.png`
  - `artifacts/uiux-2026/screens/admin-web/setup-hi-desktop-1440.png`
  - `artifacts/uiux-2026/screens/admin-web/setup-hi-mobile-390.png`
  - `artifacts/uiux-2026/screens/admin-web/capture-manifest.json`
- [x] Technician email login screenshots captured:
  - `artifacts/uiux-2026/screens/technician-app/email-login-emulator-en-light-720x1600.png`
  - `artifacts/uiux-2026/screens/technician-app/email-login-emulator-en-dark-720x1600.png`
  - `artifacts/uiux-2026/screens/technician-app/email-login-emulator-en-dark-font200-720x1600.png`
- [x] Firebase Auth access used:
  - Project: `homeservices-prod-001`
  - Dedicated UI-audit customer and technician Firebase Auth users created/updated and email-verified.
  - Credential was generated locally, verified with Firebase REST, used for emulator login, and then the temp file was overwritten with a non-secret marker.
- [x] Authenticated technician screenshots captured:
  - notification permission prompt after successful login
  - Step 3 of 3 service selection
  - service-selection bottom / location area
  - service-selection dark and 200% font variants
- [x] First Phase 3 verified audit slice written:
  - `docs/design/uiux-audit-2026.md`
  - `CUST-LANG-001`: customer first-run language picker can block entry.
  - `TECH-LOC-001`: technician onboarding can dead-end on location capture.

## Not Done

- [ ] Real UI screenshot coverage is still partial: **35 PNGs captured** and **25 XML dumps** under `artifacts/uiux-2026/screens/`, covering customer first-run language picker, technician sign-in/email login/authenticated service selection, and unauthenticated admin login redirects.
- [ ] Hindi-specific screenshots are not captured yet. The first customer state rendered English on the emulator despite the Hindi-first product decision; verify locale initialization separately.
- [ ] Authenticated technician dashboard screenshots are not captured yet; onboarding is blocked on location resolution.
- [ ] Authenticated customer screenshots are not captured yet; first-run language picker is blocked.
- [ ] Authenticated admin screenshots are not captured yet; Firebase Auth user alone is insufficient without admin user/session/TOTP setup data.
- [x] `docs/design/uiux-audit-2026.md`: **written** from verified findings only. P0 safety (9 findings),
      P0 flow blockers (2), P1 token fracture (6), P1 a11y (3), P2 content/state/motion (4).
- [ ] `docs/design/uiux-implementation-plan.md`: **not created — this is the next artifact.**
      Sequence it so the D1 token-core re-derivation lands first; every per-screen fix depends on it.
      Size money-formatting work against **13** formatters, not 9. Do **not** plan work against
      `HomeservicesRadius`/`HomeservicesElevation` — verified alive (26 and 37 call sites).
- [x] Adversarial verification: **214 claims done** (159/53/2). ~760 observations remain unverified
      and must get the same treatment before promotion — they are NOT in the audit.
- [x] **P0 customer SOS defects FIXED** — worktree `C:\Alok\Business Projects\homeservices-safety-p0`,
      branch `fix/p0-safety-sos-joboffer`, commit `61d56257`. SAFE-SOS-001/002/003/004/006.
      Adds `BookingStatus.isSosEligible` (exhaustive `when`, no `else`, so a new status fails
      compilation rather than silently defaulting to "no SOS") and `HsDangerButton` to the design
      system. Tests: `BookingStatusSosEligibilityTest` (9, red-then-green) + 2 `SosViewModelTest`
      cases. **Full 6-step smoke gate PASSED.**
- [x] **SAFE-SOS-005 WITHDRAWN as refuted.** `SosViewModel.onSendNow()` (`:85-90`) already cancels
      the countdown and fires immediately, wired to the sheet's primary button. The 30s countdown is
      a grace period with an override — correct emergency UX, not a defect. Recorded in the audit
      rather than deleted so nobody re-adds a second immediate-send path.
- [x] **Pre-existing gate blockers FIXED** — commit `3794a333`, same branch.
      (a) 8 `UnusedResources` (`booking_payment_*`, `booking_summary_pay_now`, orphaned by
      `13fa7280` cash-only pilot) marked `tools:ignore` with a note, NOT deleted, so their hi
      translations survive for when Razorpay returns; `booking_payment_cash_note_*` deliberately
      untouched, still in use. (b) `MatchingDeclarationName` on `LanguagePickerCard.kt` suppressed
      at file level, matching `Spacing.kt`/`Radius.kt`/`ExtendedColors.kt`.
      **Both failures pre-date the branch — verified against the unmodified base commit.**
      Until committed, `main` stays red on the mandatory gate for every branch.
- [ ] **SAFE-JOB-001/002/003 NOT STARTED** (technician-app, own PR). Root cause confirmed in source
      and shared across all three: `JobOfferFullScreenActivity` calls `setContent` once in `onCreate`
      (`:101-109`) and **never observes the view model**, so it reacts to none of
      `JobOfferUiState.Accepted` / `Declined` / `Expired` and never calls `finish()`. Same cause for
      the malformed-payload case — `emitIntentOffer` (`:117-119`) no-ops when `offerFromIntent`
      returns null, but `setContent` runs regardless, leaving `Idle` rendered over the lock screen.
      No `OnBackPressedCallback` anywhere, so back discards a timed offer without declining.
      Fix needs VM observation + finish-on-terminal + back-declines. Per root CLAUDE.md, step one of
      any technician-app story is copying `customer-app/gradle/libs.versions.toml` across.
- [ ] Codex review gate not yet run on `fix/p0-safety-sos-joboffer`. Nothing pushed; no PR opened.
- [x] **Commit/handoff DONE 2026-07-26.** All audit artifacts committed to branch
      **`docs/uiux-2026-audit`** (this worktree): `docs/design/{SESSION-STATE,design-language,
      phase1-review,screenshot-capture-log,uiux-audit-2026}.md`, `docs/design/_inventory/`,
      `docs/design/_verified/`, and `artifacts/uiux-2026/` (~10 MB: 2.0 MB JSON + 8.1 MB screenshots).
      Deliberately **excluded**: `artifacts/*.aab` release binaries, the pre-existing loose
      `artifacts/moto-g-*.png|xml` capture junk, `.serena/`, `.claire/` — none are audit evidence.
      Nothing pushed; no PR opened.

## Decisions Made

### D1: Canonical Direction

Use **Marigold / warm-ink, light-first for field users**.

Core palette:

| Role | Light | Dark |
|---|---:|---:|
| Brand accent | `#E2A04A` | `#E2A04A` |
| Canvas | `#FBF6E9` | `#0E0B08` |
| Surface | `#F4EDDF` | `#1A1610` |
| Text strong | `#1A140F` | `#F1E9D8` |
| Border | `#D4C9AB` | `#2E2719` |

Type stack: Geist Sans + Noto Sans Devanagari + JetBrains Mono. No Fraunces. No serif display voice.

Surface expressions:

- Customer: light-default, airy, photo-first, trust-led, 8/12/20 radius scale.
- Technician: light-default, dense, high-contrast, fast, 4/8/12 radius scale.
- Admin: dark-default, data-dense, hairline, mono-heavy, 2/4/6 radius scale.

### D2: Market Baseline

Judge against Ayodhya / rural Uttar Pradesh, Hindi-first, mixed literacy, low-end Android, outdoor sunlight, and intermittent network.

Stale references in `docs/ux-design.md` such as Bengaluru/DLF/IT-corridor personas and imagery are superseded.

### D3: One Core, Three Expressions

The architecture is one token core with surface-specific expression, not three unrelated brands.

## High-Confidence Direct Finding

The shipped design language has fractured across spec, Android, and admin web:

| Area | Old `docs/ux-design.md` | Android `design-system` | Admin web |
|---|---|---|---|
| Primary | `#0E4F47` teal | `#0B3D2E` forest | `#E2A04A` marigold |
| Accent | `#EF6F4B` coral | `#B68A2C` brass | marigold |
| Canvas | `#FFFFFF` | `#FBF7EF` | `#0E0B08` |
| Radius | 4/8/12/20 | 4/8/12/20 | 2/4/6 |
| Display face | Geist Sans | Geist Sans | Fraunces |
| Motion | 150/200/300/500 | 150/200/300/500 | 120/220/420 |

This should be the first audit theme and the first implementation work stream after verification.

## Cross-Session Review — 2026-07-26 (Claude, reviewing the Codex session's work)

Verdict: **work is sound and accepted, with one factual correction applied and one dropped finding restored.**

Verified independently:

- All 35 PNGs / 25 XML dumps exist. All 7 screenshot paths cited in `uiux-audit-2026.md` resolve on disk.
- Observation counts confirmed exactly: 978 total, 310 high / 401 medium / 225 low / 42 blank.
- The Codex session's self-catch about `dpdp-consent-*` filenames actually showing the language picker is correct and honest — good practice, keep doing that.

**Correction applied to `TECH-LOC-001`.** The finding was real but its stated mechanism was wrong:
it claimed `ServiceSelectionViewModel.kt:120` "clears `isLocating` only when `onLocateFailed` is
called", implying missing error handling. In fact `isLocating` is cleared at **:105, :112 and :123**,
and failure listeners **do** exist (`ServiceSelectionScreen.kt:511, :516`). The true defect is the
`null` `CancellationToken` at `ServiceSelectionScreen.kt:498` — a `Task` that never terminates fires
no listener at all, so none of the three resets run. Verification also surfaced a **second, larger**
defect the draft missed: GPS is a hard gate (`validate()`, `ServiceSelectionViewModel.kt:178-183`)
with **zero** manual fallback (`grep -c "manual|city|locality|pincode"` → 0), and the
`?: DEFAULT_SERVICE_LAT/LNG` defaults in `submit()` (`:139-142`) are unreachable dead code. Both are
now documented separately in the audit because they need different fixes.

**Lesson: this is why adversarial verification is mandatory.** A plausible, well-cited finding still
had an incorrect mechanism. Reviewers acting on the original text would have added a redundant
clear-on-success and left the real hang in place.

**✅ RESOLVED — production test accounts deleted 2026-07-26.** The capture session had created and
email-verified two UI-audit users in `homeservices-prod-001`, the production auth project. Owner
directed deletion; both were removed and the removal was verified.

| email | UID | status |
|---|---|---|
| `uiux.audit.customer@homeheroo.test` | `qvlOwe9VtehrWFEzSkxAxKbC6TB2` | DELETED |
| `uiux.audit.technician@homeheroo.test` | `HvfNJD45eVX0RdZg61lHMPrBt893` | DELETED |

Method: `POST identitytoolkit.googleapis.com/v1/projects/homeservices-prod-001/accounts:batchDelete`
with `force: true`, authenticated via `gcloud auth print-access-token` as the project owner plus an
`x-goog-user-project: homeservices-prod-001` header (ADC user credentials require the quota-project
header for this API — the call 403s without it). Response `{}` with no `errors` array = success.
Verified afterwards: `auth_get_users` for both emails returns `{"users":[]}`.

**Consequence for future capture sessions:** the authenticated technician screenshots already in
`artifacts/uiux-2026/screens/technician-app/` remain valid as evidence, but **the credentials behind
them no longer exist** — that flow is not reproducible as-is. Do **not** recreate accounts in
`homeservices-prod-001`. Use a dedicated non-production Firebase project or the Firebase Auth
emulator (`firebase emulators:start --only auth`) for any further authenticated capture.

## RESTORED — Phase 0 coverage gaps (dropped in the 2026-07-26 rewrite; do not drop again)

The `gap-critic` confirmed **100% coverage of the three globs** (29 customer + 19 technician
`*Screen.kt`, 20 admin `page.tsx`; no phantom paths) and **15/17 citations CONFIRMED**. But it found
the glob itself was the wrong shape. These surfaces have **no inventory record at all**:

**Safety-critical, entirely unaudited — highest priority to close:**
- `customer-app/.../ui/tracking/SosBottomSheet.kt` — emergency surface on live tracking
- `customer-app/.../ui/tracking/SosConsentDialog.kt` — legally/safety-sensitive consent gate
- `technician-app/.../ui/jobOffer/JobOfferFullScreenActivity.kt` — the lock-screen presentation of
  the job offer. `T2` audited `JobOfferScreen.kt` but never the Activity that presents it, so its
  chrome, dismissal and 30s-timeout behaviour are unverified.

**Modals / sheets / banners / chips — first-class UI with their own states, excluded by `*Screen.kt`:**
`CompletionConfirmationDialog.kt`, `ShieldReportSheet.kt`, `RatingAppealSheet.kt`,
`PhotoUploadRetryBanner.kt` (×2 — duplicated in `activeJob/` and `kyc/`), `PendingActionCard.kt`,
`PendingBookingResumeBanner.kt`, `NoShowCreditBanner.kt`, `CountdownChip.kt`,
`WomenSafeFilterToggle.kt`, `WalletBalanceChip.kt`

**Extracted `*Content` composables that hold the actual UI:**
`AddressPickerScreenContent.kt`, `WaitlistScreenContent.kt`, `CustomerHomeTabContent.kt`,
`PhotoFirstCategoryCard.kt`, `PhotoFirstServiceCard.kt`, `CatalogueVisualImage.kt`,
`ConfidenceScoreRow.kt`, `TrustDossierCard.kt`
— note `X1` names `CustomerHomeTabContent.kt` and `TrustDossierCard.kt` among the **worst**
off-scale-value and Roboto-fallback offenders, yet neither has a surface record.

**Admin router special files (user-visible states, uninventoried):**
`(dashboard)/error.tsx`, `[locale]/not-found.tsx`, `finance/loading.tsx`, `technicians/loading.tsx`.
Given that "error and empty look identical" is a convergent theme across 6 fragments, leaving the
error and not-found boundaries unaudited is material.

**Also flagged by A2:** `TechnicianRosterClient.tsx` was not in the A2 assignment, so the technicians
roster table itself is uninventoried — only its route shell and loader were read.

→ **~22 additional surfaces.** True surface count is ~90 Android + admin, not 68. Close this with one
`X2` cluster before writing the full audit.

## Gaps And Risks

- Screenshots are still the biggest evidentiary gap. Source-only UI review cannot prove Hindi clipping, 200% text behavior, visual hierarchy, or actual contrast in context. The emulator pass only covers two first-launch states.
- ~~Firebase test credentials~~ — **superseded 2026-07-26. Both UI-audit Auth users were DELETED from
  `homeservices-prod-001`; see the "RESOLVED — production test accounts deleted" section above, which is
  authoritative.** Do **not** recreate accounts in the production project and do **not** reset passwords
  there. For further authenticated capture use a dedicated non-production Firebase project or the Auth
  emulator (`firebase emulators:start --only auth`).
  *(This bullet previously instructed the opposite. It was stale and contradicted the resolved section;
  corrected during the 2026-07-26 review.)*
- Customer first-run is currently blocked in emulator: the language picker remains on-screen after tapping English/Continue and Hindi/Continue. The Hindi option also was not exposed as a clickable node in inspected XML. Promoted to `CUST-LANG-001` in `docs/design/uiux-audit-2026.md`; exact failure mechanism still needs an instrumented UI test.
- Some first-pass customer filenames say `dpdp-consent-*`, but XML inspection shows the visible state is the language picker. Use `docs/design/screenshot-capture-log.md` and XML contents before citing screenshots.
- Technician authenticated onboarding is blocked on "Finding your location" after permissions and emulator geo fix. Promoted to `TECH-LOC-001` in `docs/design/uiux-audit-2026.md`; source confirms there is no explicit timeout around the current-location task.
- `_observations.json` contains 42 blank/uncategorized severity values. Normalize or review before ranking.
- Some cluster names differ from the master prompt (`C5`, `customer/account-privacy`, `customer/booking-funnel`, `customer/onboarding-auth`). Preserve the existing files but normalize naming in the audit.
- The repo is on `main`; the original protocol wanted an isolated worktree/branch. Create one before large implementation work.

## Next Session Starts With

Proceed with **Phase 3-style adversarial verification**, not implementation.

Recommended next actions:

1. Verify the customer language-picker blocker and technician location-resolution blocker against source.
2. Load `docs/design/design-language.md` and `docs/design/_inventory/_observations.json`.
3. Verify high-severity observations in batches by theme:
   - token fracture
   - typography/Roboto fallback
   - i18n/Hindi parity
   - money formatting
   - missing empty/error/offline states
   - motion/token dead code
   - accessibility/touch target/contrast
4. Continue `docs/design/uiux-audit-2026.md` with only verified findings.
5. Only then write `docs/design/uiux-implementation-plan.md`.

Resume prompt to use: **R5-style verification**, adjusted for the fact that findings are currently in `_inventory/_observations.json`, not `docs/design/findings/*.json`.
