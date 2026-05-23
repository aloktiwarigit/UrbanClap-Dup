# Pattern: Devanagari Web Typography

**Applies to:** Any Next.js admin or web surface using Noto Sans Devanagari for Hindi locale (`:lang(hi)`)  
**Established in:** E12-S03b (2026-05-06) — architect verdict from principal UI/UX review  
**Font stack:** Geist Sans (Latin/digits) + Noto Sans Devanagari (Hindi), both loaded via `next/font/google`

---

## Problem

Noto Sans Devanagari at default Tailwind settings looks optically different from Geist at the same `font-size` and `font-weight`:
- Line-height 1.5–1.55 (Tailwind default) appears loose because Devanagari has no descenders — the space below the shirorekha is wasted.
- Geist at weight 400 reads visually heavier than Noto Devanagari at weight 400 — body text looks thin in HI locale.
- Geist's default font-feature-settings (`ss01`, `cv11`) are Latin-specific stylistic sets that don't help Devanagari and may suppress conjunct shaping (क्ष, त्र, ज्ञ).
- Negative letter-spacing on table cells (from Tailwind utilities) can push devanagari matras (ि ी े) into adjacent letters.

---

## Solution — CSS block (scoped to `:lang(hi)`)

```css
/* Devanagari typography — scoped to HI locale only. EN styles untouched. */

:lang(hi) {
  --font-body: var(--font-devanagari), "Noto Sans Devanagari", sans-serif;

  /* 5% tighter than Tailwind default — Devanagari has no descenders. */
  line-height: 1.45;

  /* Override Latin-specific Geist features; calt + clig required for
     correct conjunct shaping (क्ष त्र ज्ञ द्ध). */
  font-feature-settings: "kern" 1, "calt" 1, "liga" 1, "clig" 1;

  /* Noto ships genuine 500/600 weights — synthesized bold causes
     double-stroke on the shirorekha on Chrome/Blink. */
  font-synthesis: none;

  text-rendering: optimizeLegibility;
}

/* Mixed Latin-numeral + Devanagari table cells */
:lang(hi) table td,
:lang(hi) table th {
  letter-spacing: 0;        /* prevents matra collision */
  vertical-align: baseline; /* Latin numerals "float high" vs Devanagari visual center */
  line-height: 1.45;
  /* tnum + lnum keep ₹ amounts tabular-aligned next to status text */
  font-feature-settings: "kern" 1, "calt" 1, "liga" 1, "clig" 1, "tnum" 1, "lnum" 1;
}

:lang(hi) table th {
  font-weight: 500;  /* bump TH only — body stays 400 to preserve weight semantics */
}
```

---

## Key decisions (do not revert without re-reviewing)

| Decision | Rationale |
|---|---|
| `line-height: 1.45` (not body weight bump) | Noto at 400 reads lighter than Geist, but bumping body to 500 breaks weight semantics in tables; use line-height to compensate density instead |
| `font-synthesis: none` | Prevents synthesized bold/italic on Noto glyphs — double-stroke on shirorekha is visually broken |
| `letter-spacing: 0` on table cells | Geist tracks slightly negative; Devanagari matras are sensitive to tracking changes |
| `vertical-align: baseline` on table cells | Visual center of Devanagari sits ~0.08em below Latin; baseline alignment with `line-height: 1.45` is more stable than `middle` |
| Skip unicode-range @font-face split | `next/font/google` loads each family with disjoint cmap coverage; manual @font-face would bypass self-hosting and re-introduce Google CDN dependency |
| Skip body weight bump to 500 | Jump to 500 makes body text feel bold next to EN; only apply 500 to `<th>` |

---

## Sidebar nav labels

"एडमिन उपयोगकर्ता" (14 clusters) at 13px Noto: ~133px advance vs ~192px usable space in 240px sidebar. Fits, but reset letter-spacing explicitly:

```css
:lang(hi) nav[aria-label="Primary navigation"] a span,
:lang(hi) nav[aria-label="Primary navigation (mobile)"] a span {
  letter-spacing: 0;
}
```

---

## Datetime formatting

Use `Intl.DateTimeFormat` with locale-aware options:

```typescript
// Date only (profile pages, invoice dates)
new Intl.DateTimeFormat('hi-IN', { dateStyle: 'medium' }).format(d)
// → "5 मई 2026"

// Date + time (audit logs, order timestamps — must preserve time precision)
new Intl.DateTimeFormat('hi-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(d)
// → "5 मई 2026, 10:30 am"
```

**Do not use `dateStyle` without `timeStyle` in audit log contexts** — Codex P2 finding: drops time precision needed to distinguish events on the same day.

---

## Currency formatting

```typescript
// hi-IN produces lakh grouping: ₹1,23,456.00 (not ₹1,23,456)
new Intl.NumberFormat('hi-IN', { style: 'currency', currency: 'INR' }).format(rupees)
```

These are wrapped in `src/lib/format/intl.ts` → `formatINR(paise, locale)`, `formatDate(d, locale)`, `formatDateTime(d, locale)`.

---

## What this pattern does NOT cover

- Printing / PDF rendering — Noto Devanagari web font may not be available in print context; add a system-font fallback for `@media print`
- RTL support — Devanagari is LTR; no `direction` changes needed
- Customer-app Android — use `values-hi/strings.xml` + locale switching via `SetAppLocaleUseCase` (separate pattern)
