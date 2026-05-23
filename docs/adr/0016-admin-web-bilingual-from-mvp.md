# ADR 0016 — admin-web Bilingual (EN/HI) from MVP

**Status:** Accepted  
**Date:** 2026-05-05  
**Supersedes:** `docs/architecture.md:56` — "Admin-web exempt for MVP (English-only)"  
**Author:** Alok Tiwari

## Context

`docs/architecture.md:56` explicitly exempted admin-web from MVP i18n scope on the assumption that the sole admin user is an English-fluent solo founder. The Ayodhya/UP pivot (memory `project_pivot_ayodhya_hindi.md`) changes the operating model: the first ops hire in Ayodhya will be Hindi-first. Hindi-everywhere is a binding constraint across all sub-projects.

Admin-web is a primary operational surface for this persona. Deferring i18n to Phase 2 means the ops operator cannot use the admin console effectively at pilot launch. This is a launch-blocker, not a nice-to-have.

## Decision

1. Promote admin-web bilingual support (EN + HI) to **MVP scope**.
2. Pull E12-S03 from Phase 2 to MVP, split into E12-S03a (infrastructure) + E12-S03b (content population).
3. Build E09-S07 (Tech Roster + Customer list) alongside, as these screens are required for the ops persona to do their job.
4. Default locale = `hi` (Hindi-first per Ayodhya pilot).

## Library Choice: next-intl

- **next-intl** (MIT, Vercel-authored, Next.js 15 App Router native, ₹0 cost).
- URL-prefix locale routing (`/hi/dashboard`, `/en/dashboard`) — SEO-clean, bookmark-stable, avoids cookie-only ambiguity.
- `localePrefix: 'always'` — explicit locale in every URL; no ambiguity.
- Alternative `i18next/react-i18next`: more ecosystem, but not App Router native; extra adapter boilerplate. Rejected.

## Icon System: lucide-react (decision for E09-S07)

- **lucide-react** (MIT, ISC, tree-shakeable, ~30 KB), replaces the existing 2-letter abbreviation "icons" in Rail.tsx.
- Passes ₹0 + zero-paid-SaaS constraint (ADR 0007).

## Persona Update

The admin persona model expands from single (Alokt, English-fluent) to dual:
- **Primary A — Ayodhya ops operator**: Hindi-first, smartphone + laptop fluent, not English-fluent, handles day-to-day dispatch/support/finance approvals.
- **Primary B — Founder/super-admin (Alokt)**: English-fluent power user, full override authority, audit, configuration.

## Consequences

- All existing English-only strings become message catalog keys (E12-S03b).
- All dashboard routes gain a `/{locale}/` prefix — a breaking URL change for any bookmarks. Acceptable at pre-launch pilot scale.
- `middleware.ts` is modified to compose next-intl routing with JWT auth. Security review required (see E12-S03a story plan).
- `ADMIN_ROUTE_CAPABILITIES` and `canAccessAdminPath()` must strip locale prefix before path matching.
- `safe-next-path.ts` allowlist logic must accept locale-prefixed paths in `next` query param.
