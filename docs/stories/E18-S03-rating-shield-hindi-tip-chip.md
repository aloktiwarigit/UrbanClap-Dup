---
status: in_progress
epic: E18
story: S03
tier: Feature
security: false
dependencies: []
---

# E18-S03 — Rating Shield Hindi Copy + Tip-Chip Marker + ADR-0021

## Summary

Ensure all `ShieldBottomSheet` copy is in string resources (no hardcoded literals), HI
translations are present, add a `TODO(C-19)` tip-chip placeholder in `RatingScreen.kt`,
write ADR-0021 documenting the ≤2★ shield threshold decision, and add an `@Ignored`
Paparazzi test for the shield sheet in HI locale.

## Acceptance Criteria

| # | Criterion | Done |
|---|-----------|------|
| AC-1 | All text in `ShieldBottomSheet` uses `stringResource()`. No hardcoded English literals. | [x] |
| AC-2 | HI translations for shield keys exist in `res/values-hi/strings.xml` | [x] |
| AC-3 | `TODO(C-19)` marker at tip-chip placeholder in `RatingScreen.kt` | [ ] |
| AC-4 | `docs/adr/0021-rating-shield-threshold.md` written (Context / Decision / Consequences / Alternatives) | [ ] |
| AC-5 | Paparazzi test `shieldBottomSheetHiLocale` with `@org.junit.Ignore` added to `RatingScreenPaparazziTest.kt` | [ ] |
| AC-6 | ≥80% coverage on new/changed logic (trivially met — string-resource-only change) | [ ] |

## Notes

- AC-1 and AC-2 are already satisfied by prior work (E12-S02a / E13-S02 landed shield
  strings in both resource files). Story validates and documents this, and adds AC-3/4/5.
- The `ShieldBottomSheet` composable lives inline in `RatingScreen.kt` (not a separate file).
- Paparazzi tests for new screens must be `@Ignored` on Windows-local runs; goldens recorded
  on CI via `paparazzi-record.yml` workflow_dispatch. See `docs/patterns/paparazzi-cross-os-goldens.md`.
- ADR-0019 is intentionally skipped (numbering gap in repo); ADR-0021 is the next assigned number.
