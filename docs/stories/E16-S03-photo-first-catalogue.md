---
status: in_progress
epic: E16
story: S03
tier: Feature
security: false
dependencies: []
---

# E16-S03 — Photo-First Catalogue UI

## Context

The service catalogue currently renders `CategoryCard` and `ServiceCard` with icon/text
layouts. CDN photo URLs are already flowing through the DTO → domain pipeline:

- `CategoryDto.heroImageUrl` → `Category.imageUrl`
- `ServiceDto.heroImageUrl` / `ServiceDto.imageUrl` → `Service.imageUrl`
- `ServiceDetailScreen` already uses `AsyncImage` for the hero when `service.imageUrl` is set.

The photo assets (13 service + 5 category photos) are not yet commissioned.
The feature flag `customer.photo-first-catalogue.enabled` keeps both new card
designs dark until assets land in Firebase Storage and the flag is flipped ON.

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC-1 | `CategoryCard` photo-first variant: full-bleed `AsyncImage` from `category.imageUrl`; fallback to `categoryStyle` icon tile when URL is blank or load fails. |
| AC-2 | `ServiceCard` photo-first variant: tall card with hero `AsyncImage` from `service.imageUrl`, name + short-description overlay; fallback to initials placeholder when URL is blank or load fails. |
| AC-3 | `ServiceDetailScreen` hero already sources from `service.imageUrl` CDN URL with local-drawable and gradient fallbacks — no change required (verified). |
| AC-4 | Photo URLs sourced from DTO pipeline — `Category.imageUrl` / `Service.imageUrl` — already in place; no new mapping needed. |
| AC-5 | Coil `AsyncImage` (already in dependency graph at 2.7.0) used with `contentScale = ContentScale.Crop`. |
| AC-6 | Feature flag `customer.photo-first-catalogue.enabled` gates new card designs. When OFF, original cards render unchanged. |
| AC-7 | Paparazzi tests `@Ignored`: `CategoryCard` with photo URL, `CategoryCard` fallback, `ServiceCard` with photo, `ServiceCard` fallback. |
| AC-8 | Unit tests: image URL sourcing from DTO, fallback logic (blank URL → fallback, non-blank → CDN path used). |
| AC-9 | ≥80% coverage on new paths (Kover). |

## Notes

- Photo assets not yet commissioned — feature flag ensures dark-ship until assets land.
- Do NOT remove existing local drawable fallback in `ServiceDetailScreen` — CDN may be unavailable offline.
- Do NOT touch `WalletBalanceChip`, `BookingCard`, or any non-catalogue screens.
- Keep existing card shape/token system (`RoundedCornerShape`, `CardBorder`, `WarmIvory`).
