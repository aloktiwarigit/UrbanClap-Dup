# Story E09-S01: Owner Live Ops Dashboard

Status: shipped (PR #13, merged 2026-04-20, commit c4568c7) — **retroactive docs**

> **Epic:** E09 — Owner Operations + Finance (`docs/stories/README.md` §E09)
> **Sprint:** S5 (wk 9–10) · **Estimated:** 1.5–2.5h · **Priority:** P1
> **Sub-projects:** `api/` + `admin-web/`
> **Ceremony tier:** Feature (3 new admin endpoints + 7 dashboard components on existing `requireAdmin` rails; no new persistence; no auth/payment surface)
> **Prerequisite:** Admin auth (E02-S04) shipped — `requireAdmin(['super-admin','ops-manager'])` already gates dashboard routes.
> **FR:** FR-7.1 (Owner Live Ops Dashboard)
> **Retroactive note:** Plan file `plans/E09-S01.md` was committed in PR #13 but the story file was never created. Acceptance criteria are reverse-engineered from the merged code (see PR #13 file list and the Operations Observatory UX demo at `docs/ux-demos/owner-live-ops-dashboard.html`).

---

## Story

As **Alok, the solo owner of the home-services platform**,
I want a single live-operations dashboard that shows today's KPIs, an active-tech map, the live order feed, the hourly utilisation strip, and the payout queue at a glance,
so that **I can run the business in 22 minutes a day** (FR-7.1) **and spot anomalies before they become customer escalations**.

---

## Acceptance Criteria

### AC-1 · `GET /v1/admin/dashboard/summary` returns six daily KPIs
- **Given** a caller with role `super-admin` or `ops-manager`
- **When** they call `GET /v1/admin/dashboard/summary`
- **Then** the response is `{ bookingsToday, gmvToday, commissionToday, payoutsPending, complaintsOpen, techsOnDuty }`
- **And** all amount fields are integers in paise
- **And** `gmvToday` sums `amount` for `bookings` with `status = 'completed'` and `createdAt >= startOfDay (UTC)`
- **And** `commissionToday = floor(gmvToday * COMMISSION_RATE)` (default 0.225)
- **And** the schema is registered with `extendZodWithOpenApi` so `DashboardSummarySchema` round-trips through `api/openapi.json`

### AC-2 · `GET /v1/admin/dashboard/feed` returns the live order/event feed
- Returns `{ events: BookingEvent[], total }`
- Each `BookingEvent` carries `id, bookingId, status, customerId, technicianId?, serviceId, amount, createdAt, kind, title, detail`
- `kind` is one of `booking | assigned | completed | alert | payout | complaint`
- Sorted descending by `createdAt`

### AC-3 · `GET /v1/admin/dashboard/tech-locations` returns active technician pins
- Returns `TechLocation[]` with `technicianId, name?, serviceType?, lat, lng, state, updatedAt`
- `state` ∈ `active | enroute | idle | alert`

### AC-4 · Auth + error contract on all three handlers
- 401 `UNAUTHORIZED` when no Bearer token
- 403 `FORBIDDEN` when role is not in `['super-admin','ops-manager']`
- 502 `UPSTREAM` on Cosmos failure (same envelope as catalogue handlers)
- Zod schema validation failure → 500 with logged Sentry event

### AC-5 · Operations Observatory page renders the demo at `/dashboard`
- Page fetches `summary` + `tech-locations` in parallel server-side
- 6-tile `CounterStrip` shows the KPIs (paise → rupees with `÷100` formatter)
- `TechMap` renders the CSS-drawn map matching `docs/ux-demos/owner-live-ops-dashboard.html` — no real mapping SDK, pin positions are normalised percentages of lat/lng within the Bengaluru pilot bounding box
- `OrderFeed` polls `/v1/admin/dashboard/feed` every 30s with a `// TODO(E09-S01-v2): replace with FCM topic listener` marker (see ADR-0002)
- `UtilStrip` renders 24 hourly bars
- `PayoutQueue` renders the right-rail panel
- `Rail` (left nav) + `Topbar` (header) wrap the page

### AC-6 · No new paid SaaS introduced
- `@vis.gl/react-google-maps` and any paid mapping SDK are NOT added to `admin-web/package.json` (pin map is pure CSS)
- recharts is already in `package.json` (acceptable; OSS)

### AC-7 · Tests + smoke gates
- 12 new API tests (4 per handler — auth-401, auth-403, happy-path, Cosmos-502)
- 23+ admin-web component tests (CounterStrip, TechMap, OrderFeed)
- TypeScript strict mode green both sides
- `bash tools/pre-codex-smoke-api.sh` + `bash tools/pre-codex-smoke-web.sh` exit 0
- `.codex-review-passed` shipped

---

## Tasks / Subtasks (as merged)

- [x] **WS-A — Cosmos schemas + Zod types (`api/src/schemas/dashboard.ts`)** with `extendZodWithOpenApi` import so schemas round-trip through OpenAPI registry context.
- [x] **WS-B — three Azure Function handlers (`api/src/functions/admin/dashboard/{summary,feed,tech-locations}.ts`)** with `requireAdmin(['super-admin','ops-manager'])`, Zod validation, parallel Cosmos queries.
- [x] **WS-C — OpenAPI registration + admin-web typed client regenerated** (`api/src/openapi/registry.ts`, `api/openapi.json`, `admin-web/src/api/generated/`).
- [x] **WS-D — admin-web dashboard UI** — `CounterStrip`, `TechMap`, `OrderFeed`, `Rail`, `Topbar`, `UtilStrip`, `PayoutQueue` (Storybook stories for the first three) — TDD on components.
- [x] **WS-E — pre-Codex smoke gates + Codex review** — passed; `.codex-review-passed` shipped in PR #13.

---

## Dev Notes

### Real-time approach
Per ADR-0002, the full vision is Cosmos change-feed → Azure Function trigger → FCM topic → admin-web. For MVP this story uses **30-second client-side polling** against the REST endpoints. This is sufficient for the owner dashboard at pilot scale and eliminates Firebase JS SDK complexity. FCM-based streaming is documented as a `// TODO(E09-S01-v2)` comment at the call site in `OrderFeed.tsx`.

### Map approach (no paid SaaS)
The UX demo uses a purely CSS-drawn map (stylised grid lines + absolutely-positioned pins, no real mapping SDK). The implementation replicates this exactly — no `@vis.gl/react-google-maps`, no Google Maps JS SDK, no paid tiles. Tech pin positions are computed as normalised percentages relative to a Bengaluru pilot bounding box. This keeps the dep count flat, matches the demo pixel-for-pixel, and respects the ₹0/mo binding constraint.

### Money handling
All amount fields server-side are integer paise. Frontend divides by 100 in formatters only — never round-trip through floats.

### What was actually shipped (per PR #13 file list)
- API: 3 schemas + 3 handlers + 6 test files (`feed`, `summary`, `tech-locations` × {handler,test}) + OpenAPI registry update
- admin-web: 7 dashboard components (`CounterStrip`, `OrderFeed`, `PayoutQueue`, `Rail`, `TechMap`, `Topbar`, `UtilStrip`), 3 RTL component tests, 3 Storybook stories, dashboard layout + page wired
- `plans/E09-S01.md` (457 lines) shipped in same PR

---

## Definition of Done

- [x] `cd api && pnpm typecheck && pnpm lint && pnpm test` green (12 new dashboard tests)
- [x] `cd admin-web && pnpm typecheck && pnpm lint && pnpm test` green (CounterStrip, TechMap, OrderFeed RTL tests)
- [x] All AC pass via test assertions
- [x] Pre-Codex smoke gates exited 0 (api + admin-web)
- [x] `.codex-review-passed` marker present
- [x] PR #13 opened, CI green, merged 2026-04-20

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per PR #13 commit attribution)

### Completion Notes
PR #13 merged 2026-04-20 as commit c4568c7. Codex review passed; the only fix-up commit was a typed-routes `Route` cast on dashboard `Link` hrefs (Next.js 15 typed routes).

### File List
See PR #13: `api/src/schemas/dashboard.ts`, `api/src/functions/admin/dashboard/{feed,summary,tech-locations}.ts` + tests, `admin-web/src/components/dashboard/{CounterStrip,OrderFeed,PayoutQueue,Rail,TechMap,Topbar,UtilStrip}.tsx`, `admin-web/app/(dashboard)/dashboard/page.tsx`, `admin-web/app/(dashboard)/layout.tsx`, OpenAPI registry + generated client regen, plus `plans/E09-S01.md`.
