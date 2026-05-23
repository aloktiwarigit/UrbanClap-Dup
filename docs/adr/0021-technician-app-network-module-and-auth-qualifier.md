# ADR-0021: Technician-App NetworkModule + Auth Qualifier Consolidation

**Status:** Accepted
**Date:** 2026-05-12
**Owner:** Alok Tiwari
**Supersedes:** —
**Superseded by:** —

## Context

A multi-agent Principal-Architect audit (2026-05-11) of `technician-app/` surfaced three
problems in the network layer:

1. **Silent unauthenticated API calls** — `JobOfferModule`, `PhotoModule`, `KycModule`,
   and `ActiveJobModule` constructed their own bare `OkHttpClient.Builder()` instances
   with no auth interceptor. The Tier-1 ApiServices accepted the Firebase ID token via
   an `@Header("Authorization") authHeader: String` method param, with each use case /
   repository fetching the token manually via
   `firebaseAuth.currentUser?.getIdToken(false)` and prepending `"Bearer "` at the call
   site. Token refresh on 401 was absent — a stale token would cause cascading 401s
   with no recovery.
2. **11x hardcoded base URL duplication** — every `data/*/di/*Module.kt` re-stated
   `"https://func-homeservices-prod.azurewebsites.net/api/"` inline.
3. **`@AuthOkHttpClient` qualifier semantic mismatch** — the only existing interceptor
   pattern (`RatingModule`) defined the qualifier inside `data/rating/di/`, and 8 other
   modules imported it from there.

A separate finding noted that `HttpLoggingInterceptor` was set to `Level.BODY` for
both debug and release variants — a PII log leak in release builds.

## Decision

Introduce `data/network/di/NetworkModule.kt` as the single source of truth for all
HTTP / Retrofit / Moshi construction in `technician-app/`. This module:

- Owns the `@AuthOkHttpClient` qualifier (moved from `data/rating/di/RatingModule.kt`).
- Defines a new `@UnauthOkHttpClient` qualifier reserved for future App Check flows.
- Provides a shared `Retrofit` instance built from `@AuthOkHttpClient` + `Moshi` +
  `BuildConfig.API_BASE_URL`.
- Sets `HttpLoggingInterceptor.Level` to `BODY` in debug and `NONE` in release.

Every per-feature module collapses to a one-line `@Provides` that calls
`retrofit.create(XxxApiService::class.java)`. Every `*ApiService` interface drops the
`@Header("Authorization")` method param — the interceptor injects the header on every
request. `FirebaseTokenAuthenticator` handles auto-retry on 401 with a force-refreshed
token. Every manual `firebaseAuth.currentUser?.getIdToken(false)` callsite is deleted
from feature code (the `data/network/auth/` package is the only place those token
fetches live now).

### Integrity: auth-bearing, not the special case the design spec implied

The design spec (`docs/specs/2026-05-12-w1-network-foundation.md` §2.4) proposed that
`IntegrityModule` would consume `@UnauthOkHttpClient` and that `IntegrityApiService`
would keep its `@Header("Authorization")` method param. Investigation during WS-C
revealed this was incorrect:

- `IntegrityApiService.getNonce()` requires Firebase ID auth — the call sites in
  `MarkReachedUseCase` and `DigiLockerConsentUseCase` were already passing
  `"Bearer $firebaseIdToken"` via the `@Header` param.
- The Play Integrity attestation token is a *different* value, attached to subsequent
  business calls (e.g. `ActiveJobApiService.transitionStatus`) via the
  `@Header("X-Integrity-Token")` parameter — that pattern is preserved and continues
  to live on its specific endpoints, not on the Integrity nonce endpoint.

Revised decision: `IntegrityApiService` is auth-bearing and goes through
`@AuthOkHttpClient` like every other ApiService. `IntegrityModule` consumes the
shared `Retrofit` from `NetworkModule`. The `@UnauthOkHttpClient` qualifier remains
defined and documented for *future* App Check usage but has no consumer in W1.

Four Semgrep rules under `technician-app/.semgrep/` prevent regression:

- `no-header-authorization-in-apiservice.yml`
- `no-bare-okhttp-outside-network-module.yml`
- `no-hardcoded-base-url.yml`
- `no-manual-getidtoken-outside-auth-package.yml`

`AuthInterceptorCoverageTest` enumerates every auth-bearing ApiService via a
hand-maintained `AUTH_BEARING_APIS` list and asserts each has at least one
HTTP-annotated method and zero `@Header("Authorization")` method parameters.
`AuthInterceptorCoverageCompletenessTest` scans the source tree for `*ApiService.kt`
files and fails if any is not categorized.

## Alternatives considered

- **Status quo (per-module Retrofit construction).** Rejected — fails the security goal
  (silent unauth Tier-1 calls) and leaves the URL-duplication and qualifier-location
  smells.
- **Per-buildType base-URL split** (`debug → staging URL`, `release → prod URL`).
  Deferred. No staging Function App exists today (`func-homeservices-staging` is not
  provisioned). Both URLs would be identical; the buildType split is added when staging
  exists.
- **App Check enforcement** (Firebase App Check tokens attached to all unauth
  requests). Deferred. The `@UnauthOkHttpClient` qualifier introduced here reserves
  the seam.
- **Detekt custom rule** for `Retrofit.Builder().baseUrl(<literal>)`. Skipped —
  Semgrep covers the same surface and is simpler to maintain.
- **`IntegrityModule` on `@UnauthOkHttpClient`** (the original spec). Rejected after
  reading the call-site code: the Integrity nonce endpoint is Firebase-authed.

## Consequences

**Positive**

- Single migration point for future networking concerns (mTLS, certificate pinning,
  cache, retry policy, OpenTelemetry tracing).
- Auth correctness enforced by Semgrep + the coverage tests.
- 12 base-URL literals collapse to one `BuildConfig.API_BASE_URL` reference.
- HttpLoggingInterceptor leak in release builds is closed.
- All 13 ApiServices (including IntegrityApiService) consistently route through the
  same auth chain — no per-ApiService special-casing.

**Negative / managed**

- Per-feature modules are coupled to NetworkModule's `Retrofit` shape. If we ever need
  per-feature interceptors (e.g., a tracing interceptor scoped to a single ApiService),
  the abstraction needs a per-feature qualifier extension. Re-evaluate at that time.
- New ApiServices added in future stories MUST be added to
  `AuthInterceptorCoverageTest.AUTH_BEARING_APIS` or
  `AuthInterceptorCoverageCompletenessTest.UNAUTH_API_SIMPLE_NAMES`. The completeness
  test enforces this — the cost is one line per ApiService.
- `@UnauthOkHttpClient` has no current consumer. Documented for the App Check follow-up;
  if that story never lands, this qualifier should be deleted in a future cleanup.

## Deferred

- Per-buildType URL split — open when `func-homeservices-staging` exists.
- App Check wiring — separate story; `@UnauthOkHttpClient` qualifier reserves the seam.
- `customer-app` parity for the HttpLoggingInterceptor leak fix (separate codemod).

## References

- Design spec: `docs/specs/2026-05-12-w1-network-foundation.md`
- Plan: `plans/W1-network-foundation.md`
- Audit findings (P0-1): `C:\Users\alokt\.claude\plans\adaptive-growing-mochi.md` §1
- Foundation infrastructure (pre-existing): `data/network/auth/IdTokenCache.kt`,
  `data/network/auth/FirebaseTokenAuthenticator.kt`
