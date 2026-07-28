# TOKEN-SYNC

## Rule

Kotlin is the source of truth for the D1 core color roles:

`design-system/src/main/kotlin/com/homeservices/designsystem/theme/Color.kt`

The mirrors are:

- `figma/variables.json`
- `admin-web/app/globals.css`

ADR-0029 chooses verification over generation. `tools/check-token-drift.py` fails when any D1 core
color differs across Kotlin, Figma JSON, and admin CSS.

## Checked Roles

The checker verifies light and dark values for these D1 roles:

- `accent`
- `canvas`
- `surface`
- `surfaceRaised`
- `textStrong`
- `textMuted`
- `textFaint`
- `border`
- `borderStrong`

These are byte-identical core roles. Radius, spacing, motion, and typography are intentionally not
checked against admin CSS because D1 defines separate surface expressions for those.

## Update Sequence

1. Edit the Kotlin constant in `Color.kt`.
2. Update the matching `color.core.*` value in `figma/variables.json`.
3. Update the matching `--d1-*` value in `admin-web/app/globals.css`.
4. Run `python tools/check-token-drift.py`.
5. Commit all changed token mirrors together.

## Admin CSS Shape

Admin keeps its editorial names (`--ink-*`, `--fog-*`, `--paper-*`) for compatibility, but they must
derive from `--d1-*` primitives where they represent a D1 core role. Do not introduce new hex values
for core neutrals directly into component CSS.
