# Plan: E12-S02a — Customer-app Hindi sweep

**Story:** E12-S02a
**Tier:** Foundation (large codemod)
**Branch:** feat/e12-s02a-customer-app-hindi-sweep
**Author:** Claude Sonnet 4.6
**Date:** 2026-05-12

## Pattern files consulted

- `docs/patterns/paparazzi-cross-os-goldens.md` — HI goldens on CI Linux only
- `docs/patterns/kotlin-explicit-api-public-modifier.md` — public modifier on new Kotlin files

## Work streams

```
WS-A: Shared utilities (CurrencyFormat.kt) + LocaleRepository flip + FirstLaunchVM flip
      Runs first. Subsequent streams depend on formatInr + locale default.

WS-B: strings.xml (EN + HI) — all new keys for 12 screens
      Runs in parallel with WS-A (no code dependency).

WS-C: Source file i18n sweep — auth + tracking group (4 files)
      Depends on WS-B (string keys must exist). Parallel with WS-D.

WS-D: Source file i18n sweep — booking + complaint + rating group (5 files)
      Depends on WS-B. Parallel with WS-C.

WS-E: Source file i18n sweep — catalogue group (2 files) + BookingViewModel errors
      Depends on WS-B. Parallel with WS-C and WS-D.

WS-F: Noto Sans Devanagari font + Typography.kt wiring
      Independent of WS-B through WS-E.

WS-G: Detekt rule (NoHardcodedComposeText)
      Independent. Can run any time.

WS-H: ADR-0018 + story file + plan
      Already done before code work.

WS-I: Pre-Codex smoke gate → Codex review → push → PR
      Runs after all WS-A through WS-G complete.
```

## Work-stream detail

### WS-A: Utilities + locale defaults
- Create `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/util/CurrencyFormat.kt`
  - `public fun formatInr(paise: Long): String` using `NumberFormat.getCurrencyInstance(Locale("en","IN"))`
  - Thread-safe: `NumberFormat` is not thread-safe; use `ThreadLocal` or create per-call
- Flip `LocaleRepositoryImpl.DEFAULT_LOCALE = "hi"`
- Flip `FirstLaunchLanguageViewModel._selectedTag = MutableStateFlow("hi")`

### WS-B: String resources
- Add ~90 new EN keys to `values/strings.xml`
- Add ~90 HI translations to `values-hi/strings.xml`
- Key naming convention: `<screen>_<element>` e.g. `auth_checking_truecaller`
- Flag uncertain translations with `<!-- HI-REVIEW -->` comments

### WS-C through WS-E: Source file sweeps
Each file:
1. Add `import androidx.compose.ui.res.stringResource` where missing
2. Replace every `Text("...")` with `Text(stringResource(R.string.key))`
3. Replace `OutlinedTextField(label = { Text("...") })` with string resource
4. Replace `contentDescription = "..."` with string resource
5. Replace `formatRupees(...)` with `formatInr(...)` from CurrencyFormat.kt
6. Non-composable functions (`statusLabel`, `label()`, `displayLabel()`) — these return `String`
   and cannot call `stringResource`. They remain as English-only helpers for now (marked with
   `// TODO(E12-S02a): convert to CompositionLocal locale when E18 refactors status labels`).
   Compose callers wrap them only in composable context so TalkBack reads the correct locale string
   from the calling composable's stringResource.

### WS-F: Font
- Create `customer-app/app/src/main/res/font/` directory
- Place `noto_sans_devanagari.ttf` (OFL-1.1 — download from Google Fonts)
- Place `LICENSE_NOTO_SANS_DEVANAGARI.txt` (OFL-1.1 license text)
- Update `design-system/src/main/kotlin/com/homeservices/designsystem/theme/Typography.kt`:
  - Add `NotoSansDevanagariFontFamily` as fallback for `HomeservicesFontFamily`
  - Wire using `FontFamily(HomeservicesFontFamily, NotoSansDevanagariFontFamily)` composite

### WS-G: Detekt rule
- Create `customer-app/app/detekt/NoHardcodedComposeTextRule.kt`
- Add to `customer-app/app/detekt.yml` or create `customer-app/app/detekt/detekt.yml`
- Rule: flag `Text("` calls where literal starts with uppercase letter (A-Z)
- Exclusions: `**/test/**`, `**/androidTest/**`

### WS-I: Gates
1. `bash tools/pre-codex-smoke.sh customer-app`
2. Codex review
3. Push → trigger `paparazzi-record.yml` workflow_dispatch
4. PR create

## Key constraints from pattern files

- NEVER `git rm -r snapshots/images/` — add HI goldens additively
- NEVER record Paparazzi goldens on Windows
- `public` modifier required on every new public Kotlin declaration
- `-Werror` enforced — no unchecked warnings

## Risk: non-composable status labels

`statusLabel()`, `CustomerBookingStatus.label()`, `BookingPaymentMethod.label()`,
`ComplaintReason.displayLabel()` are pure Kotlin functions that return English strings.
Proper i18n requires accessing string resources which requires a `Context` or `CompositionLocal`.
**Decision:** Wrap these in composable context where they are used (pass the composed string from
the composable caller). For status enums, add a parallel `@Composable fun labelRes(): Int` extension
returning `R.string.*` that composables can call with `stringResource(status.labelRes())`.
This adds some boilerplate but avoids passing `Context` into pure functions.

## String key budget (estimated)

| Screen | New keys |
|---|---|
| AuthScreen | 22 |
| LiveTrackingScreen | 14 |
| SosBottomSheet | 5 |
| SosConsentDialog | 4 |
| ComplaintScreen | 10 |
| ComplaintViewModel errors | 3 |
| RatingScreen | 12 |
| CustomerBookingsScreen | 10 |
| AddressScreen | 8 (already partially done) |
| PriceApprovalScreen | 2 (already partially done) |
| CatalogueHomeScreen | 8 |
| ConfidenceScoreRow | 6 |
| BookingViewModel errors | 3 |
| **Total** | **~107** |
