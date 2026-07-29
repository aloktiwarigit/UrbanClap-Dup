# Admin Web Design Contract

This file is the local contract for `admin-web`. It derives from D1 in
`docs/design/design-language.md` and ADR-0029.

## Voice

Quiet, exact, operator-first. The admin surface is a command center for one expert user, not a
marketing site.

## Source Of Truth

Kotlin design-system color constants are canonical. `admin-web/app/globals.css` mirrors the D1 core
through `--d1-*` CSS custom properties and `tools/check-token-drift.py` fails CI if Kotlin, Figma
JSON, and CSS diverge.

## Color Tokens

Dark is the default.

```css
--d1-accent-dark: #E2A04A;
--d1-canvas-dark: #0E0B08;
--d1-surface-dark: #1A1610;
--d1-surface-raised-dark: #221C15;
--d1-text-strong-dark: #F1E9D8;
--d1-text-muted-dark: #9A9082;
--d1-text-faint-dark: #877A6D;
--d1-border-dark: #2E2719;
--d1-border-strong-dark: #3E3528;
```

Light mode exists only as an explicit user preference and mirrors D1 light roles:

```css
--d1-canvas-light: #FBF6E9;
--d1-surface-light: #F4EDDF;
--d1-surface-raised-light: #E9DFC6;
--d1-text-strong-light: #1A140F;
--d1-text-muted-light: #4A4135;
--d1-text-faint-light: #6E665B;
--d1-border-light: #D4C9AB;
--d1-border-strong-light: #B0A382;
```

## Expression

Keep the editorial command-center expression:

- Radii: `2px`, `4px`, `6px`, `999px`.
- Hairline rules and dense table layouts.
- Mono chips and tabular numeric alignment.
- Marigold for active decisions and selected emphasis, not decorative wash.
- Focus rings use `--color-focus-ring`, not marigold, because marigold fails 3:1 on light surfaces.

## Type

No serif. Display, body, and Devanagari all use Geist/Noto Sans Devanagari; numerals and chips use
JetBrains Mono.

```css
--font-display: var(--font-geist), var(--font-devanagari), system-ui, sans-serif;
--font-body: var(--font-geist), system-ui, sans-serif;
--font-mono: var(--font-jetbrains-mono), ui-monospace, Menlo, monospace;
```

## Spacing And Motion

Use the D1 4px grid: `0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96`.

Motion stays functional:

- `120ms` for press/hover.
- `220ms` for standard transitions.
- `420ms` for rare page-level reveal.
- `prefers-reduced-motion` must be respected.

## Anti-Patterns

- No Fraunces or other serif display face.
- No separate admin-only color core.
- No nested cards.
- No decorative gradients or blurred color blobs.
- No marigold focus ring on light surfaces.
