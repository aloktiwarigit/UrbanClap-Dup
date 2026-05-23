---
id: E12-S02a
epic: E12
story: S02a
title: "Customer-app Hindi sweep + Noto Devanagari + Hindi-default ADR-0018"
tier: Foundation
status: in_progress
created: 2026-05-12
author: Claude Sonnet 4.6
branch: feat/e12-s02a-customer-app-hindi-sweep
---

# E12-S02a — Customer-app Hindi sweep

## Context

The bilingual pivot (E12) targets Ayodhya's predominantly Hindi-speaking user base.
Admin-web was completed in PRs #186 + #194. This story closes the customer-app gap:
~120 hardcoded English literals on 12 high-stakes screens, missing Hindi translations,
no Noto Sans Devanagari font, and the default locale still set to `"en"`.

## Acceptance criteria

- [ ] **AC-1** Every Compose `Text("...")` / `OutlinedTextField label=...` literal in the listed
      files moved to `R.string.*` with EN + HI translations.
      Files: `AuthScreen.kt`, `LiveTrackingScreen.kt`, `SosBottomSheet.kt`,
      `SosConsentDialog.kt`, `ComplaintScreen.kt`, `ComplaintViewModel.kt` (errors),
      `RatingScreen.kt`, `CustomerBookingsScreen.kt`, `AddressScreen.kt`,
      `PriceApprovalScreen.kt`, `BookingViewModel.kt` (errors), `CatalogueHomeScreen.kt`,
      `ConfidenceScoreRow.kt`.
- [ ] **AC-2** `formatRupees` / `"Rs ..."` literals replaced with shared `formatInr(paise, locale)`
      using `NumberFormat.getCurrencyInstance(Locale("en","IN"))`.
- [ ] **AC-3** `LocaleRepositoryImpl.DEFAULT_LOCALE` → `"hi"`;
      `FirstLaunchLanguageViewModel._selectedTag` initial state → `"hi"`. ADR-0018 committed.
- [ ] **AC-4** Noto Sans Devanagari bundled at `res/font/noto_sans_devanagari.ttf` (OFL-1.1);
      wired into design-system `Typography` as Devanagari fallback.
- [ ] **AC-5** Paparazzi goldens recorded on CI Linux (workflow_dispatch), never locally on Windows.
- [ ] **AC-6** Custom Detekt rule / config forbids `Text\("[A-Z]` literals outside test sources.
      Baseline added; new code fails.
- [ ] **AC-7** TalkBack content descriptions use `stringResource` so HI locale narration is HI.

## Out of scope

- Technician-app (E12-S02b, future)
- Admin-web (already done, PRs #186 + #194)
- Dispatcher ranking (Karnataka invariant, ADR-0006/0011 — DO NOT TOUCH)

## Files modified

### New files
- `customer-app/app/src/main/res/font/noto_sans_devanagari.ttf`
- `customer-app/app/src/main/res/font/LICENSE_NOTO_SANS_DEVANAGARI.txt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/util/CurrencyFormat.kt`
- `customer-app/app/detekt/NoHardcodedComposeTextRule.kt`
- `docs/adr/0018-hindi-default-customer-app.md`
- `docs/stories/E12-S02a-customer-app-hindi-sweep.md`

### Modified files
- `customer-app/app/src/main/res/values/strings.xml` — ~90 new EN keys
- `customer-app/app/src/main/res/values-hi/strings.xml` — ~90 HI translations
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthScreen.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/LiveTrackingScreen.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/SosBottomSheet.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/SosConsentDialog.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint/ComplaintScreen.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint/ComplaintViewModel.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/bookings/CustomerBookingsScreen.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/AddressScreen.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/PriceApprovalScreen.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/BookingViewModel.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeScreen.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/ConfidenceScoreRow.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/data/locale/LocaleRepositoryImpl.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/locale/FirstLaunchLanguageViewModel.kt`
- `design-system/src/main/kotlin/com/homeservices/designsystem/theme/Typography.kt`
- `customer-app/app/detekt.yml` (or new `customer-app/app/detekt/detekt.yml`)

## Definition of done

- [ ] All AC checkboxes above ticked
- [ ] Pre-Codex smoke gate: `bash tools/pre-codex-smoke.sh customer-app` → exit 0
- [ ] Codex review passed (`.codex-review-passed` marker)
- [ ] Paparazzi HI goldens committed from CI Linux run
- [ ] PR merged on CI green
