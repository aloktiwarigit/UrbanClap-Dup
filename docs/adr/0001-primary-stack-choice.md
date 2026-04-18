# ADR-0001: Primary stack choice — Kotlin+Compose × 2 + Next.js + Node, monorepo

- **Status:** accepted
- **Date:** 2026-04-17
- **Deciders:** Alok Tiwari (founder), Winston (architect persona)

## Context

homeservices-mvp needs three surfaces (customer Android, technician Android, owner web admin) plus a backend API. The founder is a solo operator using BMAD + Claude Code; build-cost is effectively founder time. Infra is constrained to ₹0/month at pilot scale (≤5,000 bookings/mo) per NFR-M-1.

The project must ship in ~6 months end-to-end with a 25-feature MVP. Picking a stack that fights us wastes months.

## Decision

- **Mobile (both apps):** **Kotlin 2.x + Jetpack Compose + Material Design 3.** Two separate Android Gradle codebases (`customer-app/`, `technician-app/`) sharing a single design-system Gradle module. Android-only at MVP; iOS deferred to Phase 4 with a separate ADR.
- **Web admin:** **Next.js 15 App Router + TypeScript strict + Tailwind + Storybook.** Hosted on Azure Static Web Apps free tier.
- **Backend API:** **Node 22 LTS + Fastify + Zod + OpenAPI 3.1.** Running on Azure Functions Consumption plan.
- **Monorepo layout** at project root (see architecture.md §6).

## Consequences

**Positive:**
- Each stack maps to an existing agency-baseline template (`client-baseline-android`, `client-baseline-nextjs`, `client-baseline-node`), already wired with the enterprise floor: Sentry, GrowthBook, PostHog, Storybook/Paparazzi, Semgrep, ship.yml CI, Codex-review gate. Zero custom scaffolding.
- Kotlin + Compose is Google's recommended Android stack and is used by CRED, Zomato, Swiggy. Native performance and smaller binary than Flutter.
- Next.js 15 + Static Web Apps free tier meets the zero-cost constraint and gives SSR + CDN for free.
- Node 22 on Azure Functions Consumption has zero idle cost and free 1M execs/month.

**Negative:**
- Two Android codebases (customer, technician) duplicate some scaffolding. Mitigated by shared design-system Gradle module and shared build configurations in `buildSrc`.
- iOS will need a third codebase (SwiftUI) or KMP refactor at Phase 4. This is acknowledged debt — see AQ-1.
- Fastify is slightly less common than Express in Indian hiring pool; mitigated because the founder + Claude Code are the dev pair, not a team.

**Neutral:**
- We accept the discipline of three distinct tech stacks (Kotlin, TypeScript, Node TS). Each is small and proven; no team-size multiplier cost.

## Alternatives considered

- **Flutter for both Android apps** — rejected because (a) template already uses Kotlin, losing Paparazzi/Detekt/ktlint integration, and (b) Flutter engine adds ~5 MB to APK. Flutter would help with iOS in Phase 4, but Phase 4 is 9+ months out.
- **React Native** — same iOS-sharing argument as Flutter, plus bridging complexity. Not used by CRED/Zomato/Swiggy tier apps for good reason.
- **SwiftUI-only iOS-first** — Indian market is 95% Android; wrong priority.
- **Django for backend** — slower startup, heavier footprint than Node Fastify, harder to host on free-tier Functions. Expressive but wrong trade-off here.
- **Ruby on Rails** — same as Django argument; also smaller Indian hiring pool.

## References

- `_bmad-output/planning-artifacts/product-brief.md` §9.2 Scale, §9.9 Observability
- `docs/prd.md` §Project-Type Specific Requirements
- `docs/ux-design.md` §7 Design Directions
- `_bmad-output/planning-artifacts/architecture.md` §2 Boring-Technology Manifesto
- Agency templates: `C:/Alok/Business Projects/agency-templates/`
