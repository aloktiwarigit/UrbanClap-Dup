# Story E02-S04: Admin auth — email + TOTP 2FA, httpOnly-cookie sessions, RBAC middleware, audit log

Status: shipped (PR #8, merged 2026-04-19, commit `7500cf6`) — **retroactive docs**

> **Epic:** E02 — Authentication & Onboarding (`docs/stories/README.md` §E02)
> **Sprint:** S1 (wk 1–2) · **Estimated:** ≤ 1 dev-day · **Priority:** **P0 — blocks every E09 owner-operations story**
> **Sub-projects:** `api/` + `admin-web/`
> **Ceremony tier:** Foundation (auth-sensitive; cross-cutting api + admin-web; introduces RBAC primitive every admin endpoint reuses)
> **FR reference:** FR-1.3
> **Prerequisite:** E01-S02 admin-web skeleton + E01-S01 API skeleton merged
> **Retroactive note:** This story file is being written *after* the implementation merged. PR #8 landed `plans/E02-S04.md` but never committed `docs/stories/E02-S04-*.md`. Acceptance criteria below are reverse-engineered from the merged code under `api/src/{services,middleware,functions/admin}/**` and `admin-web/src/lib/auth/**`.

---

## Story

As **the solo founder-operator** (and in future, any owner-trusted ops/finance/support staff),
I want a hardened admin sign-in flow with email + password + TOTP 2FA, httpOnly-cookie session management with strict 30-min inactivity timeout, role-based access control on every `/v1/admin/*` endpoint, and a sync audit-log entry on every admin action,
so that **the owner web console is dramatically harder to compromise than a single password, every privileged action is traceable, role boundaries are enforced server-side (not just hidden in the UI), and adding new admin roles later is a one-line change to a HOF — not a refactor**.

---

## Acceptance Criteria

### AC-1 · Email + password authentication via Firebase client SDK
- **Given** the admin is on `admin-web/app/login/page.tsx` (no longer a 501 stub)
- **When** they enter email + password and submit
- **Then** the Firebase client SDK signs them in and returns a Firebase ID token
- **And** the client POSTs the ID token + TOTP code to `/v1/admin/auth/login`
- **And** invalid credentials return 401 (no detail leakage about which field failed)

### AC-2 · TOTP 2FA enforced on every login
- **Given** the api/ login handler (`src/functions/admin/auth/login.ts`)
- **Then** it calls `totp.service.ts:verifyTotp(adminId, code)` after Firebase ID-token verification
- **And** the TOTP secret is stored AES-256-GCM-encrypted in Cosmos (decrypted only for verification)
- **And** invalid TOTP codes return 401
- **And** missing TOTP enrollment forces redirect to `/setup` (TOTP enrollment wizard at `admin-web/app/setup/page.tsx`)

### AC-3 · TOTP enrollment wizard on first login
- **Given** an admin who has not yet enrolled TOTP
- **When** they hit `/setup`
- **Then** `GET /v1/admin/auth/setup-totp` returns a QR-code-ready URI (built via `qrcode` package on the client, secret generated server-side via `otplib`)
- **And** the admin scans with Google Authenticator / Authy and submits the first 6-digit code
- **And** `POST /v1/admin/auth/setup-totp` verifies the code and persists the AES-256-GCM-encrypted secret in `admin_users` Cosmos container
- **And** `tests/e2e/totp-enrollment.spec.ts` (Playwright) covers the happy path + replay-attack detection

### AC-4 · Two httpOnly cookies (`hs_access` 15 min + `hs_refresh` 8 h) — SameSite=Strict
- **Given** a successful login
- **Then** the api/ response sets two `Set-Cookie` headers:
  - `hs_access` — JWT signed with `jose`, TTL 15 min, `httpOnly`, `Secure`, `SameSite=Strict`, `Path=/`
  - `hs_refresh` — JWT signed with a separate refresh secret, TTL 8 h, same flags
- **And** JS cannot read either cookie (httpOnly enforces this; `parseCookies` test verifies header-only access)
- **And** `staticwebapp.config.json` (admin-web) declares the SWA linked-backend proxy rule routing `/api/*` to Azure Functions same-origin so cookies travel automatically

### AC-5 · 30-min inactivity timeout enforced via Cosmos session touch-and-get
- **Given** a `requireAdmin` request
- **When** the middleware reads `hs_access` and decodes the JWT
- **Then** `adminSession.service.ts:touchAndGet(sessionId)` does a Cosmos point-read, checks `lastSeenAt`
- **And** if `now - lastSeenAt > 30 minutes` → returns 401 + clears the cookies
- **And** otherwise updates `lastSeenAt = now` and returns the session
- **And** `tests/e2e/session-timeout.spec.ts` covers this

### AC-6 · `requireAdmin(roles)` HOF wraps every `/v1/admin/*` handler
- **Given** any admin handler in `src/functions/admin/**`
- **Then** it is wrapped in `requireAdmin(['super-admin', 'ops-manager'])` (or a subset)
- **And** the HOF: parses `hs_access` cookie → verifies JWT → loads session → checks `lastSeenAt` → checks `role ∈ allowedRoles`
- **And** failures return 401 (no session) or 403 (wrong role) — no 500
- **And** `tests/integration/rbac.integration.test.ts` covers the 4 role × N-handler matrix

### AC-7 · 4 admin roles defined + AdminContext in handlers
- **Given** `api/src/types/admin.ts`
- **Then** `AdminRole` is the union: `'super-admin' | 'ops-manager' | 'finance' | 'support-agent'`
- **And** every handler that passes `requireAdmin` receives an `AdminContext` argument with `{ adminId, role, sessionId }`
- **And** the context is the only authoritative identity — request body fields are not trusted

### AC-8 · Sync audit-log entry on every admin action
- **Given** any privileged admin action
- **When** the handler completes
- **Then** `auditLog.ts:writeAuditEntry(...)` synchronously writes to Cosmos `audit_log` container
- **And** the entry includes: `adminId`, `role`, `action` (one of the `AuditAction` enum), `targetId`, `details`, `timestamp`, `requestId`
- **And** the write is sync (NOT fire-and-forget) — failure to log = failure of the action (audit trail is non-negotiable per NFR-S-6)
- **And** `AuditAction` enum covers: `LOGIN`, `LOGOUT`, `TOTP_SETUP`, `ORDER_OVERRIDE`, `TECH_DEACTIVATE`, `REFUND_APPROVE`, `PAYOUT_APPROVE`, `COMPLAINT_RESOLVE`, `CATALOGUE_EDIT`, `ADMIN_USER_CHANGE`

### AC-9 · Refresh + logout endpoints
- **Given** a near-expiry `hs_access` cookie
- **When** the admin-web client `errorMiddleware` catches a 401
- **Then** it calls `POST /v1/admin/auth/refresh` with the `hs_refresh` cookie
- **And** the api/ issues a fresh `hs_access` (15 min) and updates `lastSeenAt`
- **And** the original request retries automatically (transparent to the user)
- **And** `POST /v1/admin/auth/logout` deletes the Cosmos session + clears both cookies via `Set-Cookie ... Max-Age=0`

### AC-10 · `/v1/admin/me` endpoint for client identity hydration
- **Given** the admin-web `AdminAuthContext` (`src/lib/auth/context.tsx`)
- **When** the admin lands on a `(dashboard)` route
- **Then** the layout fetches `GET /v1/admin/me` and populates context with `{ adminId, role }`
- **And** the response is cached for the session and revalidated on tab focus

### AC-11 · Edge middleware redirects unauthenticated users to `/login`
- **Given** `admin-web/middleware.ts`
- **When** an unauthenticated user hits any `(dashboard)` route
- **Then** the middleware verifies the `hs_access` cookie via `jose` at the Edge runtime (no api/ round-trip on every nav)
- **And** missing/invalid → redirect to `/login`
- **And** valid → request proceeds with the JWT payload available to RSC pages

### AC-12 · Comprehensive Vitest + Playwright coverage
- **Given** the test suite
- **Then** the following files pass:
  - `api/tests/unit/cookies.test.ts` (28) — `parseCookies`
  - `api/tests/unit/totp.service.test.ts` (55) — TOTP encrypt/decrypt + verify
  - `api/tests/unit/jwt.service.test.ts` (52) — sign + verify access + refresh + setup tokens
  - `api/tests/unit/adminUser.service.test.ts` (56) — Cosmos CRUD
  - `api/tests/unit/adminSession.service.test.ts` (90) — create / touchAndGet / delete + 30-min eviction
  - `api/tests/unit/requireAdmin.test.ts` (75) — HOF semantics + role check
  - `api/tests/integration/auth.integration.test.ts` (197) — full login / refresh / logout
  - `api/tests/integration/rbac.integration.test.ts` (82) — role × handler matrix
  - `api/tests/integration/handlers.integration.test.ts` (148) — wrapping verification
  - `admin-web/tests/auth-context.test.tsx` (63) — context state machine
  - `admin-web/tests/e2e/login.spec.ts` (96), `totp-enrollment.spec.ts` (119), `session-timeout.spec.ts` (9), `rbac-403.spec.ts` (16)

### AC-13 · `seed-admin.ts` provisioning script for the first super-admin
- **Given** an empty `admin_users` Cosmos container
- **When** the operator runs `pnpm tsx scripts/seed-admin.ts <email>`
- **Then** the script creates a Firebase Auth user (if not present), generates a TOTP setup token, and prints the QR-code URL for first-login enrollment
- **And** the script is one-time-use (idempotent — re-running for the same email is a no-op)

---

## Tasks / Subtasks (as actually shipped)

> Implementation merged via PR #8. The 13-task plan in `plans/E02-S04.md` was followed sequentially with TDD cadence.

- [x] **T1 — Deps + types + Cosmos client + cookie parser**
  - [x] api/ deps: `@azure/cosmos`, `otplib`, `qrcode`, `jose`, `firebase-admin` (+ `@types/qrcode`)
  - [x] admin-web/ deps: `firebase`, `jose`
  - [x] `api/src/types/admin.ts` (19) — `AdminRole`, `AuditAction`, `AdminContext`
  - [x] `api/src/cosmos/client.ts` (17) — singleton with COSMOS_ENDPOINT/KEY guards
  - [x] `api/src/shared/cookies.ts` (13) + `tests/unit/cookies.test.ts` (28) — RED→GREEN

- [x] **T2 — `adminUser.service.ts` (Cosmos CRUD)** — 59 lines + 56-line test

- [x] **T3 — `totp.service.ts`** — 53 lines + 55-line test (AES-256-GCM encrypt/decrypt + `otplib.authenticator.verify`)

- [x] **T4 — `jwt.service.ts`** — 69 lines + 52-line test (sign/verify access, refresh, setup tokens via `jose`)

- [x] **T5 — `firebaseAdmin.ts`** — 21 lines (singleton wrapping `firebase-admin/auth`)

- [x] **T6 — `adminSession.service.ts`** — 62 lines + 90-line test (create / touchAndGet / delete; 30-min inactivity eviction in `touchAndGet`)

- [x] **T7 — `requireAdmin.ts` HOF** — 36 lines + 75-line test (parses cookie, verifies JWT, loads session, checks role)

- [x] **T8 — `auditLog.ts` + `AuditAction` enum** — 31 lines (sync Cosmos write to `audit_log` container)

- [x] **T9 — Auth handlers**
  - [x] `login.ts` (116) — Firebase ID-token verify + TOTP verify + cookie set
  - [x] `setup-totp.ts` (131) — GET (issue secret + QR URI) + POST (verify + persist encrypted)
  - [x] `refresh.ts` (43) — refresh-token rotation
  - [x] `logout.ts` (45) — session delete + cookie clear
  - [x] `me.ts` (26) — identity hydration
  - [x] OpenAPI registry: `src/openapi/admin-auth.ts` (50)
  - [x] `src/schemas/admin-auth.ts` (12) — Zod request schemas

- [x] **T10 — Integration tests** — `auth.integration.test.ts` (197), `rbac.integration.test.ts` (82), `handlers.integration.test.ts` (148)

- [x] **T11 — admin-web client wiring**
  - [x] `app/login/page.tsx` — replace 501 stub with `LoginForm` (Firebase client SDK)
  - [x] `app/setup/page.tsx` — TOTP enrollment wizard
  - [x] `app/(dashboard)/layout.tsx` — route group shell
  - [x] `src/lib/auth/firebase.ts` (15) — Firebase client SDK singleton
  - [x] `src/lib/auth/context.tsx` (48) — `AdminAuthContext` (role, adminId, logout)
  - [x] `src/lib/auth/types.ts` (1)
  - [x] `src/api/client.ts` (32) — extended `errorMiddleware` with 401 → refresh
  - [x] `middleware.ts` — Edge JWT verify → redirect to `/login`
  - [x] `staticwebapp.config.json` (15) — SWA linked-backend proxy `/api/*`
  - [x] `tests/auth-context.test.tsx` (63)
  - [x] Playwright e2e: `login.spec.ts` (96), `totp-enrollment.spec.ts` (119), `session-timeout.spec.ts` (9), `rbac-403.spec.ts` (16)
  - [x] `tests/e2e/helpers/make-token.ts` (26) — test token helper

- [x] **T12 — Provisioning + Cosmos setup scripts**
  - [x] `scripts/seed-admin.ts` (70)
  - [x] `scripts/setup-cosmos.ts` (35) — creates `admin_users`, `admin_sessions`, `audit_log` containers

- [x] **T13 — OpenAPI client regeneration**
  - [x] `api/openapi.json` (154) regenerated
  - [x] `admin-web/src/api/generated/openapi.json` (154) + `schema.d.ts` (216) regenerated

---

## Dev Notes

### What was actually shipped (per PR #8 file list)

63 files changed, 23,762 insertions:

```
api/src/services/                        5 services (adminUser, adminSession, totp, jwt, firebaseAdmin)
api/src/middleware/                      2 middlewares (requireAdmin, auditLog)
api/src/functions/admin/auth/            4 handlers (login, logout, refresh, setup-totp)
api/src/functions/admin/me.ts            identity hydration
api/src/types/admin.ts                   AdminRole, AuditAction, AdminContext
api/src/cosmos/client.ts                 singleton
api/src/shared/cookies.ts                parseCookies
api/src/schemas/admin-auth.ts            Zod request schemas
api/src/openapi/admin-auth.ts            OpenAPI path registrations
api/scripts/                             seed-admin.ts (70), setup-cosmos.ts (35)
api/tests/unit/                          7 unit tests (~511 lines)
api/tests/integration/                   3 integration tests (~427 lines)
admin-web/middleware.ts                  Edge JWT verify
admin-web/app/{login,setup,(dashboard)}  3 page routes
admin-web/src/lib/auth/                  firebase.ts, context.tsx, types.ts
admin-web/src/api/client.ts              errorMiddleware extended (401→refresh)
admin-web/src/api/generated/             openapi.json + schema.d.ts (regenerated)
admin-web/tests/                         auth-context.test.tsx + 4 Playwright e2e + helpers
admin-web/staticwebapp.config.json       SWA linked-backend proxy
docs/reviews/codex-E02-S04-20260419-1344.md  18756-line Codex review log
```

### Why this story is being written retroactively

The 2026-04-26 audit (`docs/audit/story-completeness-2026-04-26.md`) found that PR #8 landed `plans/E02-S04.md` but never committed `docs/stories/E02-S04-*.md`. This file closes the gap.

### Why the SWA linked-backend proxy

Cookies cannot travel cross-origin without `SameSite=None` (which weakens CSRF protection). Azure Static Web Apps' linked-backend feature proxies `/api/*` to the Azure Functions same-origin, so `SameSite=Strict` works without any cookie-domain workarounds. `staticwebapp.config.json` declares the proxy rule.

### Why sync audit log (and why it must NEVER be fire-and-forget)

NFR-S-6 mandates audit immutability — every admin action must produce a log entry. A fire-and-forget pattern (`writeAuditEntry().catch(...)`) silently drops entries on Cosmos transient failures. This story enforces sync writes: if the audit log can't be written, the action fails with 500. The Cosmos `audit_log` container will be made append-only via stored-procedure deny-write/update in E09-S05 (pending).

### Why two cookies (`hs_access` 15 min + `hs_refresh` 8 h)

Short access tokens limit the blast radius of token theft. Refresh-token rotation on each refresh prevents replay. Both cookies are httpOnly so JS can't exfiltrate them via XSS.

### Pattern adherence

| Pattern | Used here |
|---|---|
| Sealed result types (TypeScript discriminated unions) | All service-layer returns are typed unions, never throw for expected failures |
| Cosmos point-read + merge + upsert | `adminSession.service.touchAndGet` + `adminUser.service` updates |
| Zod-first schemas | Every request body validated via `parseBody` helper |
| OpenAPI registration | Every admin endpoint registers in `src/openapi/admin-auth.ts` (regenerates `openapi.json` on change) |

### References

- [Source: `plans/E02-S04.md` — implementation plan (13 tasks, full TDD)]
- [Source: `docs/prd.md` §FR-1.3, §NFR-S-6 (audit immutability)]
- [Source: `docs/threat-model.md` — admin auth section]
- [Source: `docs/reviews/codex-E02-S04-20260419-1344.md` — Codex review log]
- [Source: `docs/stories/README.md` §E02-S04 row]

---

## Definition of Done

- [x] `cd api && pnpm test:coverage && pnpm build && pnpm lint && pnpm typecheck` green (verified on PR #8 CI)
- [x] `cd admin-web && pnpm test:coverage && pnpm test:e2e && pnpm build` green
- [x] All 13 ACs pass via 7 api unit tests (~511 lines) + 3 integration tests (~427) + 1 admin-web unit test (63) + 4 Playwright e2e (~240)
- [x] Coverage ≥ 80% on lines/branches/functions/statements (api + admin-web)
- [x] No paid-SaaS dependencies introduced; ADR-0007 verified
- [x] Pre-Codex smoke gates exited 0 for both api and admin-web
- [x] `.codex-review-passed` marker shipped in PR #8; full review log in `docs/reviews/codex-E02-S04-20260419-1344.md`
- [x] CI green on `main` after merge (commit `7500cf6`)
- [x] OpenAPI regenerated (api + admin-web `src/api/generated/`) — drift-check would have caught any miss

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per PR #8 commit attribution)

### Completion Notes
PR #8 merged 2026-04-19 as commit `7500cf6`. The `requireAdmin` HOF + sync audit-log primitive are reused by every E09 owner-operations endpoint — no E09 story has needed to re-implement either. The sync-audit-log decision (over fire-and-forget) was specifically called out in the Codex review as a high-confidence positive — Cosmos transient failures during owner overrides would otherwise corrupt the audit trail.

### File List
See PR #8: 63 files. Key surfaces — 5 api services, 2 middlewares, 4 admin-auth handlers, `/v1/admin/me`, Edge JWT middleware, TOTP enrollment wizard, SWA linked-backend config, 7 unit + 3 integration api tests, 4 Playwright e2e, OpenAPI regeneration. Codex review log (`docs/reviews/codex-E02-S04-20260419-1344.md`) is the authoritative pass record.
