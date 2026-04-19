# TOKEN-SYNC — Design Token Cross-Reference

## Source of truth

| Layer | Location | Role |
|---|---|---|
| **Kotlin constants** (authoritative) | `design-system/src/main/kotlin/com/homeservices/designsystem/theme/` | Single source of truth. Edit here first. |
| **Figma Variables JSON** (mirror) | `figma/variables.json` (W3C DTCG format) | Mirrors Kotlin. Import via Token Studio Figma plugin (free tier). |
| **Figma library** (downstream) | Imported into the Figma design file via Token Studio | Designers consume tokens here. |

ADR-0010 locks Kotlin as the canonical source. `figma/variables.json` is a derived mirror — update it whenever a Kotlin token changes.

---

## Cross-check rule

> **If you edit a Kotlin token constant, you MUST update `figma/variables.json` before pushing.**

The CI `design-system-ship.yml` runs `tools/check-token-drift.py` on every PR touching `design-system/**`, `figma/**`, or `tools/check-token-drift.py`. The PR **fails** if JSON and Kotlin diverge.

---

## Token inventory

### Color tokens — `design-system/theme/Color.kt` ↔ `figma/variables.json` `color.*`

| UX §5.1 token | Light Kotlin constant | Dark Kotlin constant | JSON path |
|---|---|---|---|
| `brand.primary` | `BrandPrimaryLight` `#0E4F47` | `BrandPrimaryDark` `#1E8378` | `color.brand.primary.light/dark` |
| `brand.primaryHover` | `BrandPrimaryHoverLight` `#0A3D37` | `BrandPrimaryHoverDark` `#2BA08F` | `color.brand.primaryHover.light/dark` |
| `brand.accent` | `BrandAccentLight` `#EF6F4B` | `BrandAccentDark` `#F78866` | `color.brand.accent.light/dark` |
| `semantic.success` | `SemanticSuccessLight` `#10A85E` | `SemanticSuccessDark` `#25C97B` | `color.semantic.success.light/dark` |
| `semantic.warning` | `SemanticWarningLight` `#EBA53A` | `SemanticWarningDark` `#F5B850` | `color.semantic.warning.light/dark` |
| `semantic.danger` | `SemanticDangerLight` `#D73C3C` | `SemanticDangerDark` `#EC5252` | `color.semantic.danger.light/dark` |
| `semantic.info` | `SemanticInfoLight` `#2E72D9` | `SemanticInfoDark` `#4F90EC` | `color.semantic.info.light/dark` |
| `neutral.0` | `Neutral0Light` `#FFFFFF` | `Neutral0Dark` `#0A0A0B` | `color.neutral.0.light/dark` |
| `neutral.50` | `Neutral50Light` `#FAFAFA` | `Neutral50Dark` `#141518` | `color.neutral.50.light/dark` |
| `neutral.100` | `Neutral100Light` `#F4F4F5` | `Neutral100Dark` `#1D1F23` | `color.neutral.100.light/dark` |
| `neutral.200` | `Neutral200Light` `#E4E4E7` | `Neutral200Dark` `#2A2D34` | `color.neutral.200.light/dark` |
| `neutral.500` | `Neutral500Light` `#71717A` | `Neutral500Dark` `#9CA3AF` | `color.neutral.500.light/dark` |
| `neutral.900` | `Neutral900Light` `#18181B` | `Neutral900Dark` `#FAFAFA` | `color.neutral.900.light/dark` |

Extended tokens (`color.extended.*`) are alias values — they reference the canonical tokens above and are not checked independently.

### Spacing — `design-system/theme/Spacing.kt` ↔ `figma/variables.json` `spacing.*`

| Token | dp | JSON path |
|---|---|---|
| `space0` | 0 | `spacing.space0` |
| `space1` | 4 | `spacing.space1` |
| `space2` | 8 | `spacing.space2` |
| `space3` | 12 | `spacing.space3` |
| `space4` | 16 | `spacing.space4` |
| `space6` | 24 | `spacing.space6` |
| `space8` | 32 | `spacing.space8` |
| `space12` | 48 | `spacing.space12` |
| `space16` | 64 | `spacing.space16` |
| `space24` | 96 | `spacing.space24` |

### Elevation — `design-system/theme/Elevation.kt` ↔ `figma/variables.json` `elevation.*`

| Token | dp | JSON path |
|---|---|---|
| `elev0` | 0 | `elevation.elev0` |
| `elev1` | 1 | `elevation.elev1` |
| `elev2` | 4 | `elevation.elev2` |
| `elev3` | 8 | `elevation.elev3` |
| `elev4` | 16 | `elevation.elev4` |

### Border Radius — `design-system/theme/Radius.kt` ↔ `figma/variables.json` `radius.*`

| Token | dp | JSON path |
|---|---|---|
| `sm` | 4 | `radius.sm` |
| `md` | 8 | `radius.md` |
| `lg` | 12 | `radius.lg` |
| `xl` | 20 | `radius.xl` |
| `full` | 9999 | `radius.full` |

### Motion — `design-system/theme/Motion.kt` ↔ `figma/variables.json` `motion.*`

| Token | ms | JSON path |
|---|---|---|
| `fast` | 150 | `motion.duration.fast` |
| `base` | 200 | `motion.duration.base` |
| `medium` | 300 | `motion.duration.medium` |
| `slow` | 500 | `motion.duration.slow` |

### Typography — `design-system/theme/Typography.kt` ↔ `figma/variables.json` `typography.*`

Typography font-size/weight/line-height values are documented in `figma/variables.json` `typography.*` but are not yet verified by the drift checker (cubic-bezier and text-style normalization deferred to Phase 2 token pipeline ADR). Verify manually when editing `Typography.kt`.

---

## Figma library setup

See `figma/README.md` for:
- Part 1 — importing `figma/variables.json` via Token Studio free Figma plugin
- Part 2 — figma-code-connect activation workflow (requires Dev Mode, Figma paid plan)
- Part 3 — sync update cadence

---

## How to update tokens

1. Edit the Kotlin constant in `design-system/src/main/kotlin/.../theme/`.
2. Update the corresponding entry in `figma/variables.json`.
3. Run `python tools/check-token-drift.py` locally to verify no drift.
4. Re-import `figma/variables.json` in Token Studio to refresh the Figma library.
5. Commit both files together in one commit.

The CI check (`design-system-ship.yml`) enforces step 3 on every PR — a mismatch blocks merge.
