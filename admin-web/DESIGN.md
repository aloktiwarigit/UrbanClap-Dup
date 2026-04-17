# DESIGN — Client Brand Tokens

TODO: fill from the client's brand guide during Phase 3 (UX).
Reference: https://github.com/VoltAgent/awesome-design-md for token structure examples (Stripe, Linear, Apple, etc.) to adapt.

## Voice
One sentence describing brand tone (e.g. "confident, quiet, expert — never playful or loud").

## Color tokens
```
--color-surface: #...
--color-text: #...
--color-accent: #...
--color-muted: #...
--color-danger: #...
```

## Type tokens
```
--font-display: <family>
--font-body: <family>
--font-mono: <family>
```
Scale: 12, 14, 16, 18, 24, 32, 48, 64.

## Spacing
4px base grid. Tokens: `--space-1` = 4, `--space-2` = 8, `--space-3` = 12, etc.

## Motion
Default duration: 200ms. Easing: `cubic-bezier(0.4, 0, 0.2, 1)`. Reduce-motion respected.

## Anti-patterns (Impeccable / frontend-design guardrails)
- No purple gradients unless client brand IS purple
- No nested cards
- No generic rounded-card + Inter aesthetic
- Purposeful motion only — no decorative animation
- Contrast meets WCAG AA minimum

## References
- Client brand guide: <link or TODO>
- Design system Storybook: `pnpm storybook`
