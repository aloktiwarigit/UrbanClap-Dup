# E02-S04 Design — Admin Web Login: Email + Password + TOTP 2FA + RBAC

**Story:** E02-S04  
**Date:** 2026-04-19  
**FR:** FR-1.3 (PRD §FR-1.3), NFR-S-1/5/6/7/8  
**Sub-projects:** `admin-web/` (Next.js 15 + TypeScript strict) + `api/` (Node 22 + Azure Functions)  
**Status:** Approved — proceed to implementation plan

---

## 1. Scope

**In scope:**
- Email + password login via Firebase Auth client SDK + TOTP 2FA verification (RFC 6238, `otplib`)
- First-login TOTP enrollment wizard (`/setup` page) — QR code + 6-digit confirm
- Session management: httpOnly cookies, 15-min access JWT, 8h refresh token, 30-min inactivity enforcement via Cosmos-backed session
- `requireAdmin` higher-order function wrapping all `/v1/admin/*` Azure Functions handlers
- Audit log infrastructure: sync write to Cosmos `audit_log` on every admin action
- Cosmos schema: `admin_users` + `admin_sessions` containers
- Next.js middleware route guard on `/(dashboard)/*`

**Out of scope (deferred to E09):**
- Admin user invite / deactivation UI
- Role editing by super-admin
- Marketing-manager role (Phase 2 per PRD)

---

## 2. Architecture

### 2.1 Component diagram

```
Browser (admin.homeservices.com — Azure Static Web Apps)
  │
  │  Same-origin via SWA linked-backend proxy
  │
  ├─ /login, /setup, /(dashboard)/* ──► Next.js 15 App Router
  │     middleware.ts (Edge runtime, jose JWT verify → redirect if expired)
  │     Server Components: cookies() → read hs_access for SSR data fetches
  │     Client Components: openapi-fetch client.ts (cookies auto-sent same-origin)
  │
  └─ /api/v1/admin/* ─────────────────► Azure Functions (Node 22, @azure/functions)
        requireAdmin HOF (cookie → JWT verify → session liveness → RBAC)
        auth handlers: login, refresh, logout, setup-totp-get, setup-totp-post
        Cosmos DB: admin_users, admin_sessions, audit_log
        Firebase Admin SDK: verifyIdToken
```

### 2.2 SWA linked-backend

`admin-web/staticwebapp.config.json` routes `/api/*` to the linked Azure Functions app. In local dev: `swa-cli start` provides the same proxy. This makes all API calls same-origin, enabling httpOnly `SameSite=Strict` cookies without CORS configuration.

### 2.3 New packages

| Sub-project | Package | Purpose |
|---|---|---|
| `api/` | `otplib` | RFC 6238 TOTP (generate secret, verify token) |
| `api/` | `qrcode` | Generate QR code data URI for TOTP enrollment |
| `api/` | `jose` | JWT sign + verify (Node runtime) |
| `api/` | `@azure/cosmos` | Cosmos DB SDK |
| `admin-web/` | `firebase` | Firebase client SDK (email/password sign-in) |
| `admin-web/` | `jose` | JWT verify in Next.js Edge middleware |

All OSS, zero cost.

---

## 3. Session Model

### 3.1 Cookies

| Cookie | Value | Attributes | TTL |
|---|---|---|---|
| `hs_access` | Signed JWT (HS256) | httpOnly; Secure; SameSite=Strict; Path=/ | 15 min (900 s) |
| `hs_refresh` | Opaque UUID (= sessionId) | httpOnly; Secure; SameSite=Strict; Path=/api/v1/admin/auth/refresh | 8h (28 800 s) |

`hs_refresh` is Path-scoped to the refresh endpoint — it is never sent to any other route.

### 3.2 Access JWT payload

```json
{
  "sub": "<adminId>",
  "role": "super-admin | ops-manager | finance | support-agent",
  "sessionId": "<uuid>",
  "type": "access",
  "iat": 1234567890,
  "exp": 1234568790
}
```

Signed with `process.env.JWT_SECRET` (Azure Function App Setting → Key Vault reference).

### 3.3 30-min inactivity enforcement

Every `/v1/admin/*` request passes through `requireAdmin`. The HOF:
1. Verifies the `hs_access` JWT (signature + expiry)
2. Reads the `admin_sessions` record by `sessionId` from Cosmos (point read, ~1 RU)
3. Rejects with 401 if `lastActivityAt` > 30 min ago **or** `hardExpiresAt` has passed
4. Patches `lastActivityAt = now()` (non-blocking, ~1 RU)

Session Cosmos container TTL = 28 800 s — expired sessions auto-purged.

### 3.4 Silent refresh

The existing `client.ts` `errorMiddleware` intercepts non-OK responses. **This story extends it:** on 401 → call `POST /api/auth/refresh` (Next.js Route Handler, which reads `hs_refresh` httpOnly cookie and proxies to Azure Functions) → if 200, retry the original request once → if refresh also returns 401, throw `ApiError` with `status: 401` which `AdminAuthContext` catches and redirects to `/login`.

The `HeadersProvider` slot in `client.ts` remains empty: cookies travel automatically.

---

## 4. TOTP

### 4.1 Library

`otplib` `authenticator` (RFC 6238, HMAC-SHA1, 30-second step, 6 digits, ±1 step window for clock drift). Verification uses `authenticator.verify({ token, secret })`.

### 4.2 Secret storage

- Stored in `admin_users.totpSecret` (Cosmos `admin_users` container)
- Encrypted at rest: AES-256-GCM, key = `process.env.TOTP_ENCRYPTION_KEY` (Azure Key Vault reference → NFR-S-9)
- Encryption/decryption via Node built-in `crypto` module — no extra dependency
- `totpSecretPending` holds the secret during enrollment; promoted to `totpSecret` only after the first valid 6-digit confirmation

### 4.3 Enrollment flow (first login)

```
1. POST /api/v1/admin/auth/login { idToken }
   └─ totpEnrolled = false
   └─ Response: 200 { requiresSetup: true, setupToken: <5-min JWT, scope="totp-setup"> }

2. Client redirects to /setup?token=<setupToken>

3. GET /api/v1/admin/auth/setup-totp  (Authorization: Bearer <setupToken>)
   └─ Generates TOTP secret, encrypts, stores in totpSecretPending
   └─ Returns: { qrCodeDataUri: "data:image/png;base64,..." , issuer: "homeservices-admin" }

4. User scans QR with Google Authenticator, enters 6-digit code

5. POST /api/v1/admin/auth/setup-totp { totpCode }  (Authorization: Bearer <setupToken>)
   └─ Verifies code against totpSecretPending
   └─ Promotes totpSecretPending → totpSecret, sets totpEnrolled = true
   └─ Creates admin_sessions record, sets hs_access + hs_refresh cookies
   └─ Response: 200 → client redirects to /dashboard
```

### 4.4 Normal login flow

```
1. /login page: email + password + TOTP code (3 fields, single form)

2. Firebase Auth client SDK: signInWithEmailAndPassword() → Firebase ID token

3. POST /api/v1/admin/auth/login { idToken, totpCode }
   └─ verifyIdToken (Firebase Admin SDK) → adminId, email
   └─ Load admin_users by adminId
   └─ Decrypt totpSecret, authenticator.verify({ token: totpCode, secret })
   └─ Create admin_sessions record (sessionId, lastActivityAt = now, hardExpiresAt = now + 8h)
   └─ Sign access JWT, set hs_access + hs_refresh cookies
   └─ Response: 200 { adminId, role, email }

4. Client redirects to /dashboard
```

---

## 5. RBAC Middleware

### 5.1 HOF signature

```typescript
// api/src/middleware/requireAdmin.ts
export function requireAdmin(roles: AdminRole[]) {
  return (handler: AdminHandler): HttpHandler =>
    async (req, ctx) => {
      const token = parseCookies(req.headers.get('cookie') ?? '')['hs_access'];
      if (!token) return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };

      const payload = await verifyAccessJwt(token).catch(() => null);
      if (!payload) return { status: 401, jsonBody: { code: 'TOKEN_INVALID' } };

      const session = await sessionService.touchAndGet(payload.sessionId);
      if (!session) return { status: 401, jsonBody: { code: 'SESSION_EXPIRED' } };

      if (!roles.includes(payload.role as AdminRole))
        return { status: 403, jsonBody: { code: 'FORBIDDEN', requiredRoles: roles } };

      return handler(req, ctx, {
        adminId: payload.sub,
        role: payload.role as AdminRole,
        sessionId: payload.sessionId,
      });
    };
}
```

Usage on every admin route:
```typescript
app.http('adminGetOrders', {
  methods: ['GET'], route: 'v1/admin/orders', authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminGetOrdersHandler),
});
```

### 5.2 Role matrix (MVP)

| Endpoint group | super-admin | ops-manager | finance | support-agent |
|---|:---:|:---:|:---:|:---:|
| Orders R | ✓ | ✓ | ✓ | ✓ |
| Orders W (override) | ✓ | ✓ | — | — |
| Technicians R | ✓ | ✓ | — | — |
| Technicians W (deactivate) | ✓ | — | — | — |
| Customers R | ✓ | ✓ | — | ✓ (lookup only) |
| Finance R/W | ✓ | — | ✓ | — |
| Complaints R/W | ✓ | ✓ | — | ✓ (assigned only) |
| Audit log R | ✓ | — | ✓ | — |
| Catalogue R/W | ✓ | — | — | — |
| Admin user management | ✓ | — | — | — |

403 response body: `{ code: "FORBIDDEN", requiredRoles: ["super-admin"] }` — consumed by admin-web to render an "Access denied" screen rather than a generic error.

---

## 6. Audit Log

### 6.1 Write pattern

Sync write after the admin action succeeds. If Cosmos write fails, the API returns 500 — the admin action is considered incomplete (consistent with compliance intent of NFR-S-6).

```typescript
// api/src/middleware/auditLog.ts
export interface AuditEntry {
  adminId: string;
  role: AdminRole;
  action: AuditAction;
  entityType: string;
  entityId: string;
  ip: string;
  reasonCode?: string;
  beforeStateHash?: string; // SHA-256 of serialised before-state
  afterStateHash?: string;  // SHA-256 of serialised after-state
}

export type AuditAction =
  | 'LOGIN' | 'LOGOUT' | 'TOTP_SETUP'
  | 'ORDER_OVERRIDE' | 'TECH_DEACTIVATE'
  | 'REFUND_APPROVE' | 'PAYOUT_APPROVE'
  | 'COMPLAINT_RESOLVE' | 'CATALOGUE_EDIT'
  | 'ADMIN_USER_CHANGE';

export async function writeAuditEntry(entry: AuditEntry): Promise<void> {
  const partitionKey = new Date().toISOString().slice(0, 7); // yyyy-mm
  await auditLogContainer.items.create({
    id: crypto.randomUUID(),
    partitionKey,
    timestamp: new Date().toISOString(),
    ...entry,
  });
}
```

### 6.2 Cosmos container policy

`audit_log` container: `defaultTtl = -1` (no TTL — entries are permanent), Cosmos role-based access policy grants the API service principal INSERT only (no update, no delete). This enforces the append-only invariant at the data plane.

---

## 7. Cosmos Schema

### `admin_users` container (partition key: `/adminId`)

```typescript
{
  id: string;                    // = adminId (Firebase uid)
  adminId: string;
  email: string;
  role: AdminRole;
  totpEnrolled: boolean;
  totpSecret: string | null;     // AES-256-GCM encrypted base32 TOTP secret
  totpSecretPending: string | null; // cleared after enrollment
  createdAt: string;             // ISO 8601 UTC
  updatedAt: string;
  deactivatedAt: string | null;
}
```

### `admin_sessions` container (partition key: `/sessionId`, TTL: 28 800 s)

```typescript
{
  id: string;              // = sessionId
  sessionId: string;
  adminId: string;
  role: AdminRole;
  lastActivityAt: string;  // ISO 8601 UTC — updated on every requireAdmin pass
  hardExpiresAt: string;   // createdAt + 8h, immutable
  refreshTokenHash: string; // SHA-256(opaque refresh UUID) — for revocation
}
```

### `audit_log` container (partition key: `/partitionKey` = `yyyy-mm`)

Per existing architecture §4.4 — no schema change needed; `AuditEntry` above maps to existing design.

---

## 8. Next.js Route Structure (admin-web)

```
app/
  login/
    page.tsx           Client component — email/password/TOTP form, Firebase SDK sign-in
  setup/
    page.tsx           Client component — TOTP enrollment wizard (QR code + confirm code)
  (dashboard)/
    layout.tsx         Server component — reads cookies(), passes role to ClientProviders
  api/
    auth/
      login/route.ts   Route Handler — proxies to Azure Functions, sets httpOnly cookies
      refresh/route.ts Route Handler — reads hs_refresh cookie, proxies refresh, sets new hs_access
      logout/route.ts  Route Handler — clears hs_access + hs_refresh cookies
src/
  lib/
    auth/
      firebase.ts      Firebase client SDK init (singleton)
      context.tsx      AdminAuthContext — role, adminId, logout action
```

`middleware.ts` (root): matches `/(dashboard)(.*)`, reads `hs_access` cookie, verifies with `jose`, redirects to `/login?next=<path>` if missing or invalid.

---

## 9. API Route Inventory

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| POST | `/v1/admin/auth/login` | Firebase ID token | — | Verify email+password+TOTP, issue session cookies |
| POST | `/v1/admin/auth/logout` | `requireAdmin(all)` | any | Invalidate session, clear cookies |
| POST | `/v1/admin/auth/refresh` | `hs_refresh` cookie | — | Rotate access token (check inactivity) |
| GET | `/v1/admin/auth/setup-totp` | setupToken (Bearer) | — | Return QR code for TOTP enrollment |
| POST | `/v1/admin/auth/setup-totp` | setupToken (Bearer) | — | Verify enrollment code, complete setup, issue session |
| GET | `/v1/admin/me` | `requireAdmin(all)` | any | Current admin profile + role (used by ClientProviders on boot) |

---

## 10. Test Strategy

### Unit tests (`api/tests/unit/`)

| File | What it covers |
|---|---|
| `totp.service.test.ts` | Secret generation, AES-256-GCM encrypt/decrypt round-trip, valid TOTP verify, invalid code → false, ±1 step clock-drift tolerance, replay (same code twice → false) |
| `requireAdmin.test.ts` | Missing cookie → 401, tampered JWT → 401, expired session (mocked `lastActivityAt` > 30 min) → 401, correct role → 200 + context, wrong role for each of 4 roles → 403 |
| `session.service.test.ts` | Create session, `touchAndGet` updates `lastActivityAt`, inactivity check math, `hardExpiresAt` enforcement |
| `auditLog.test.ts` | Entry has all required fields, partition key is `yyyy-mm`, Cosmos error propagates as thrown exception |

### Integration tests (`api/tests/integration/`)

| File | What it covers |
|---|---|
| `auth.integration.test.ts` | Happy path: mocked Firebase `verifyIdToken`, TOTP setup → login → cookies set with correct attributes; wrong TOTP → 422; unregistered admin → 401; refresh → new `hs_access`; logout → cookies cleared |
| `rbac.integration.test.ts` | For each role × each admin endpoint: 403 matrix matches §5.2; 200 when role is permitted; fixtures pre-seed one `admin_users` record per role |
| `auditLog.integration.test.ts` | Admin action succeeds → `audit_log` record written with correct `adminId`, `action`, `entityId`, `partitionKey` |

### E2E tests (`admin-web/tests/e2e/`)

| File | What it covers |
|---|---|
| `totp-enrollment.spec.ts` | Full first-login: email + password → redirect to `/setup` → QR displayed → enter code → redirect to `/dashboard` |
| `login.spec.ts` | Subsequent login with TOTP code → dashboard; wrong TOTP → inline error; wrong password → Firebase error displayed |
| `session-timeout.spec.ts` | Mock 30-min inactivity (intercept refresh endpoint → 401) → UI redirects to `/login` |
| `rbac-403.spec.ts` | Log in as `finance`, attempt `ops-manager`-gated action → see 403 "Access denied" UI |

---

## 11. Security Checklist (NFR-S cross-reference)

| NFR | Requirement | Implementation |
|---|---|---|
| NFR-S-1 | TLS 1.2+ | Azure Functions + SWA default; enforced in CI |
| NFR-S-5 | RBAC on all admin endpoints | `requireAdmin` HOF on every `/v1/admin/*` handler; integration tests |
| NFR-S-6 | Immutable audit log | Cosmos insert-only access policy; sync write; all admin actions covered |
| NFR-S-7 | Force TOTP 2FA for super-admin | All roles require TOTP at login (consistent policy, not just super-admin) |
| NFR-S-8 | 30-min inactivity timeout | Cosmos-backed `lastActivityAt` check on every request |
| NFR-S-9 | Secrets in Key Vault | `JWT_SECRET` + `TOTP_ENCRYPTION_KEY` are Key Vault references in App Settings |
| NFR-S-10 | Rate limits | Existing 10 req/min auth rate limit (NFR-S-10) covers TOTP brute force |

**Note on NFR-S-7:** The PRD specifies "TOTP mandatory for super-admin; other roles optional 2FA in MVP." For simplicity and defence-in-depth, TOTP is **required for all roles** in this implementation. Any admin account with access to the system is a high-privilege surface; optional 2FA creates an attack path to admin-level data. If a future role needs 2FA waived, it requires an explicit ADR.

---

## 12. Story Dependencies

- **Blocks:** E09 (all owner operations stories — RBAC middleware + audit log infrastructure this story creates is the foundation they use)
- **Depends on:** E01-S01 (api/ skeleton), E01-S02 (admin-web/ skeleton), E01-S06 (openapi client with `HeadersProvider` hook — this story fills the hook indirectly via cookies)
- **Integration point:** E01-S06 `client.ts` `HeadersProvider` remains empty — `hs_access` cookie travels automatically via SWA proxy. No change to the generated OpenAPI client needed.
