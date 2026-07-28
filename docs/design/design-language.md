# UI/UX 2026 Design Language

Last updated: 2026-07-26

This is the enforceable Phase 1 contract for the UI/UX 2026 audit and implementation plan. It supersedes the older `docs/ux-design.md` visual foundation where the two conflict.

## Direction

Chosen direction: **Marigold / warm-ink, light-first for field users**.

The product should feel local, legible, fast, and premium under Ayodhya / rural Uttar Pradesh conditions: Hindi-first, mixed literacy, outdoor sunlight, low-end Android, and intermittent network. Premium means better hierarchy, better trust cues, and better perceived speed, not expensive visual effects.

The design system has one token core with three surface expressions:

| Surface | Default | Expression |
|---|---|---|
| Customer app | Light | Airy, photo-first, trust-led, 8/12/20 radius scale |
| Technician app | Light | Dense, high-contrast, thumb-fast, tabular numerals, 4/8/12 radius scale |
| Admin web | Dark | Information-dense command surface, hairline rules, 2/4/6 radius scale |

Do not reintroduce a separate teal/coral Android brand, the admin-only Fraunces editorial direction, or a new Sora "Warm Authority" direction. Those are superseded.

## Palette

Core roles:

| Role | Light | Dark | Notes |
|---|---:|---:|---|
| Brand accent | `#E2A04A` | `#E2A04A` | Marigold; use sparingly for primary decisions, active states, and selected emphasis |
| Canvas | `#FBF6E9` | `#0E0B08` | Warm paper / warm ink |
| Surface | `#F4EDDF` | `#1A1610` | Cards, panels, rows |
| Surface raised | `#E9DFC6` | `#221C15` | Modals, bottom sheets, hovered rows |
| Text strong | `#1A140F` | `#F1E9D8` | Main readable text |
| Text muted | `#4A4135` | `#9A9082` | Secondary text; still body-safe |
| Text faint | `#6E665B` | `#877A6D` | Metadata only; minimum AA, avoid long body copy |
| Border | `#D4C9AB` | `#2E2719` | Hairlines and separators |
| Border strong | `#B0A382` | `#3E3528` | Focused / selected / structural dividers |

Measured contrast pairs:

| Pair | Ratio |
|---|---:|
| Light text strong on canvas | 16.91:1 |
| Light text muted on canvas | 9.27:1 |
| Light text faint on canvas | 5.24:1 |
| Dark text strong on canvas | 16.25:1 |
| Dark text muted on canvas | 6.25:1 |
| Dark text faint on canvas | 4.71:1 |
| Ink on brand accent | 8.75:1 |

> Corrected 2026-07-28 during S-10. This row previously read **8.39:1**, which reproduces for no ink
> in the palette — canvas-dark `#0E0B08` measures **8.748**, text-strong `#1A140F` 8.134,
> surface-dark `#1A1610` 8.027. The other six rows reproduce to the decimal, so this was a single
> stale entry. `onPrimary` binds to canvas-dark, hence 8.75. Verified by
> `D1TokenCoreTest.ink_on_brand_accent_is_8_75`.

Accessibility floor: WCAG 2.2 AA. Target body contrast is 7:1 where practical because field usage includes sunlight and low-quality screens.

Semantic colors may keep existing green/warn/danger roles, but implementation must consolidate values across Android and web in WS-0. Money, rating, complaint, and safety colors must not vary by surface without a named role.

## Typography

Fonts:

| Role | Typeface |
|---|---|
| Latin/body/display | Geist Sans |
| Devanagari | Noto Sans Devanagari |
| Mono/admin numeric | JetBrains Mono |

No serif display face. Fraunces is rejected because it has no Devanagari coverage and creates a web-only brand voice.

Core ramp:

| Token | Size / line | Weight | Use |
|---|---:|---:|---|
| `display.lg` | 40 / 48 | 700 | Web hero-scale or rare admin section moment only |
| `title.xl` | 28 / 36 | 600 | Screen title |
| `title.lg` | 22 / 30 | 600 | Card title, service name |
| `title.md` | 18 / 26 | 600 | Section heading |
| `body.lg` | 16 / 24 | 400 | Customer and technician default body |
| `body.md` | 14 / 22 | 400 | Admin body/table text |
| `body.sm` | 12 / 18 | 500 | Metadata only |
| `label.lg` | 14 / 20 | 600 | Buttons and tabs |
| `label.sm` | 11 / 16 | 600 | Compact chips |

Rules:

- Customer and technician body text defaults to at least 16sp unless density is clearly task-critical.
- Admin body text may use 14px, but Hindi labels must be checked for truncation.
- Every Material 3 typography slot used by shared components must map to `HomeservicesFontFamily`; no Roboto fallback in production shared components.
- Hindi is a primary design language. Validate line height, wrapping, and clipping against Devanagari metrics, not English-first approximations.
- Follow `docs/patterns/devanagari-web-typography.md` for admin web and `docs/patterns/compose-locale-init-sync.md` for Android locale startup.

## Shape

One core rhythm, different expression by surface:

| Token | Customer | Technician | Admin |
|---|---:|---:|---:|
| Small | 8 | 4 | 2 |
| Medium | 12 | 8 | 4 |
| Large | 20 | 12 | 6 |
| Full | 999 | 999 | 999 |

Admin may stay sharper because density and scan speed matter. Customer should never inherit admin sharpness. Technician should sit between them: compact but still touch-friendly.

## Spacing

Use a 4px base grid. Avoid one-off gaps except where optical alignment demands it and the value is documented in the component.

Canonical steps: `0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96`.

On Android, expose these as dp tokens. On web, keep Tailwind theme tokens aligned to the same scale. `2px` hairlines are allowed for admin detail only, not layout spacing.

## Motion

Motion must be light enough for Moto G-class devices.

| Token | Duration | Easing | Use |
|---|---:|---|---|
| `fast` | 120-150ms | standard | Press, hover, checkbox, chip select |
| `base` | 200-220ms | emphasized decelerate | Screen content settle, tabs, list item reveal |
| `medium` | 300ms | emphasized decelerate | Bottom sheets, dialogs |
| `slow` | 420-500ms | emphasized decelerate | Rare celebration / onboarding only |

Rules:

- Honor reduced-motion on web and Android.
- Prefer opacity/translation over blur and shader-heavy effects.
- Navigation should not be instant-cut for major emotional moments such as job offers, booking confirmation, or payment success.
- Shared motion tokens must have real consumers; TokenGallery-only tokens do not count.

## Imagery And Illustration

Use Ayodhya / rural-UP context, not Bengaluru IT-corridor apartments. Imagery should show actual services, real tools, technicians, and homes similar to the pilot market.

Customer app should use imagery where it helps users understand the service. Technician and admin should use imagery only when it improves trust or recognition.

Illustrations are allowed for empty/error states, but must be lightweight and culturally specific. Do not create a large illustration library before the core UI is stable.

## Iconography

Use a single icon source per platform family. The audit may propose replacing raw Material Icons where useful, but the implementation plan must account for dependency cost, bundle size, and Android parity.

For this market, icon-only controls are not acceptable for primary actions. Use icon plus text unless the control is a universal utility inside a dense toolbar and has an accessible label.

## State Grammar

Every major screen needs explicit states:

| State | Required behavior |
|---|---|
| Loading | Skeleton that mirrors final layout for lists/cards; no bare spinner for primary content |
| Empty | One clear explanation, one next action, local-language copy |
| Error | Human-readable recovery path; never raw exception text |
| Offline / slow network | Preserve local context and explain what will retry |
| Success | Confirm what changed and where the user can go next |
| Destructive | Require confirmation and name the consequence |

## Content

Hindi and English are co-equal. Do not ship English-only metadata, empty states, errors, button labels, or browser titles on Hindi routes.

Money must be formatted with locale-aware INR helpers, including Indian digit grouping and paise handling. Do not render ASCII `Rs` or truncate paise with integer division.

Tone:

- Direct, respectful, and specific.
- Avoid urban-premium slang and abstract product copy.
- For lower-literacy flows, prefer concrete action language and visible consequences.

## Verification Bar

A screen is acceptable only when it scores at least 3/4 on every Phase 2 lens:

- Visual craft
- Interaction and motion
- Information architecture and flow
- Content and i18n
- Accessibility and resilience

Target average after implementation: 3.5+ with no screen below 3.
