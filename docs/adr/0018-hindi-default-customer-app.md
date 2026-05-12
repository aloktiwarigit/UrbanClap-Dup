# ADR-0018 — Customer-app Hindi-default pivot

**Status:** Accepted
**Date:** 2026-05-12
**Deciders:** Alok Tiwari (owner), Claude Sonnet 4.6 (author)
**Story:** E12-S02a
**Supersedes:** `LocaleRepositoryImpl` English-default (implicit in `0016-admin-web-bilingual-from-mvp.md`)

---

## Context

The Ayodhya/UP rural pivot (see `docs/superpowers/specs/2026-05-01-ayodhya-hindi-pivot-design.md`)
establishes Hindi (`hi`) as the primary language for the homeservices pilot. The target demographic
is rural and semi-urban Ayodhya residents whose comfort language is Hindi. A customer who launches
the app for the first time should see Hindi UI immediately — not after navigating a language-picker
that itself is in English.

Prior to this ADR, `LocaleRepositoryImpl.DEFAULT_LOCALE = "en"` and
`FirstLaunchLanguageViewModel._selectedTag = MutableStateFlow("en")`. A new user whose device
language is set to any language other than Hindi (common for entry-level Android devices sold
pre-configured) would see English first.

The admin-web bilingual pivot (PRs #186 + #194 / ADR-0016) established that the admin panel would
be bilingual from MVP. This ADR extends the commitment to the customer-facing Android app and
locks in Hindi as the default for the customer-app specifically.

## Decision

1. **`LocaleRepositoryImpl.DEFAULT_LOCALE` is changed from `"en"` to `"hi"`.**
   This affects `deviceSupportedLocale()` fallback only — users who previously persisted a locale
   via `setLocale(tag)` retain their choice.

2. **`FirstLaunchLanguageViewModel._selectedTag` initial value is changed from `"en"` to `"hi"`.**
   The first-launch language picker pre-selects Hindi. Users can still choose English before
   confirming.

3. **All new customer-app strings added from this story onward must have both EN and HI translations
   committed simultaneously in the same PR.** Missing HI translation = PR blocked.

4. **`NumberFormat.getCurrencyInstance(Locale("en","IN"))` is the canonical currency formatter.**
   The `formatRupees(paise)` helper in `CustomerBookingsScreen.kt` is replaced by a shared
   `formatInr(paise, locale)` utility at `ui/util/CurrencyFormat.kt`. Indian Rupee formatting
   (₹ symbol + comma-separated thousands, e.g. ₹1,299) is locale-invariant within IN.

## Rationale

- **User research alignment:** Rural UP users have limited English literacy. Showing English on first
  launch creates immediate friction and increases drop-off before first booking.
- **Low risk:** The language picker still gives users control. The change only alters the
  *pre-selected* choice, not removes the option.
- **Consistency with admin-web:** Admin-web already defaults to Hindi for owner UI.
- **Rollback:** Reverting to `"en"` requires one-line code change + redeploy. No data migration.

## Consequences

### Positive
- New users on devices with non-Hindi system locale immediately see HI strings.
- TalkBack narration in Hindi for all content-described elements (AC-7).
- Consistent brand experience for Ayodhya target demographic.

### Negative
- A small set of non-Hindi-speaking customers (e.g., English-medium users) see Hindi first and
  must switch to English via the language picker. Mitigation: The first-launch picker is shown
  prominently; "हिंदी" / "English" toggle is always visible in Settings.
- All new strings require HI translation, adding minor overhead per story.

### Neutral
- `deviceSupportedLocale()` still returns `"hi"` for Hindi device locales and `"hi"` (new default)
  for all others (previously `"en"`).

## Alternatives considered

| Option | Verdict |
|---|---|
| Keep `"en"` default, add Hindi as option | Rejected — conflicts with Ayodhya-first strategy |
| Auto-detect from device locale only | Rejected — too many entry-level devices ship with non-Hindi OS locale |
| Separate pilot vs mainstream app build | Rejected — increases build complexity; not needed at pilot scale |

## Links

- `docs/superpowers/specs/2026-05-01-ayodhya-hindi-pivot-design.md`
- `docs/adr/0016-admin-web-bilingual-from-mvp.md`
- Story `E12-S02a` (this implementation)
- `customer-app/app/src/main/kotlin/com/homeservices/customer/data/locale/LocaleRepositoryImpl.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/locale/FirstLaunchLanguageViewModel.kt`
