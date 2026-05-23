# W1 — Technician-App Network Foundation

**Spec owner:** Alok Tiwari (Principal Solution Architect)
**Drafted:** 2026-05-12
**Tier:** Foundation (per `CLAUDE.md`)
**Branch:** `feat/w1-network-foundation`
**Parent program:** `C:\Users\alokt\.claude\plans\adaptive-growing-mochi.md` — Wave 1
**Audit findings:** P0-1 (de-scoped from W0-A) + 11x base-URL duplication + ad-hoc token plumbing

---

## 1. Goals & non-goals

### Goals

1. Single source of truth for the auth-bearing OkHttp client + Retrofit base URL across `technician-app/`.
2. Zero `@Header("Authorization")` method params anywhere in `technician-app/` ApiServices except `IntegrityApiService` (Play Integrity attestation token, intentionally not a Firebase ID token).
3. Zero manual `getIdToken()` callsites outside `data/network/auth/`.
4. Four Semgrep rules prevent regression on the above three invariants plus bare `OkHttpClient.Builder()` outside `NetworkModule`.
5. ADR-0021 captures the decision permanently, including the explicit deferral of per-buildType URL splitting.
6. Fold the HttpLoggingInterceptor leak fix (`Level.BODY` in release builds → `Level.NONE` in release) into this wave — contiguous with the bare-OkHttp consolidation, two-line cost.

### Non-goals

- **Per-buildType URL split** (debug → staging URL; release → prod URL). No staging Function App exists today; both URLs would be identical. ADR-0021 records the deferral; staging URL gets added when `func-homeservices-staging` exists.
- **App Check enforcement.** The `@UnauthOkHttpClient` qualifier introduced here is documented for App Check / Integrity use, but App Check wiring is a separate future story.
- **Detekt custom rule.** Plan §1 mentions it as optional; Semgrep covers the same surface and is simpler to maintain. Skipped.
- **Compose UI changes.** No screens touched.
- **API-side changes.** `api/` is unaffected; this is purely `technician-app/` Android.

---

## 2. Architecture

### 2.1 Target module structure

```
technician-app/app/src/main/kotlin/com/homeservices/technician/data/network/
├── auth/                                    (UNCHANGED — already exists)
│   ├── IdTokenCache.kt                      55-min refresh of cached Firebase ID token
│   └── FirebaseTokenAuthenticator.kt        OkHttp Authenticator that force-refreshes on 401
└── di/
    └── NetworkModule.kt                     NEW — owns all OkHttp + Retrofit + Moshi construction
```

### 2.2 NetworkModule.kt — providers

```kotlin
@Qualifier @Retention(AnnotationRetention.BINARY)
public annotation class AuthOkHttpClient        // MOVED from data/rating/di — 8 import updates

@Qualifier @Retention(AnnotationRetention.BINARY)
public annotation class UnauthOkHttpClient      // NEW — for IntegrityModule, future App Check

@Module @InstallIn(SingletonComponent::class)
public object NetworkModule {
    @Provides @Singleton public fun provideMoshi(): Moshi = ...         // single source

    @Provides @Singleton public fun provideLoggingInterceptor(): HttpLoggingInterceptor =
        HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) Level.BODY else Level.NONE   // PII leak fix
        }

    @Provides @Singleton @AuthOkHttpClient
    public fun provideAuthOkHttpClient(
        idTokenCache: IdTokenCache,
        authenticator: FirebaseTokenAuthenticator,
        logging: HttpLoggingInterceptor,
    ): OkHttpClient = ...                                               // interceptor + authenticator

    @Provides @Singleton @UnauthOkHttpClient
    public fun provideUnauthOkHttpClient(logging: HttpLoggingInterceptor): OkHttpClient = ...

    @Provides @Singleton
    public fun provideRetrofit(@AuthOkHttpClient client: OkHttpClient, moshi: Moshi): Retrofit =
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/")                    // already env-driven
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
}
```

`IntegrityModule` injects `@UnauthOkHttpClient OkHttpClient` + `Moshi` and builds its own `Retrofit` locally (one-line `.create(IntegrityApiService::class.java)` wrapper). No second `Retrofit` qualifier needed — only Integrity consumes the unauth client, and a future App Check story may want a different base URL anyway.

### 2.3 Per-feature module shape after migration

```kotlin
@Module @InstallIn(SingletonComponent::class)
public abstract class JobOfferModule {
    @Binds internal abstract fun bindJobOfferRepository(impl: JobOfferRepositoryImpl): JobOfferRepository

    public companion object {
        @Provides @Singleton
        public fun provideJobOfferApiService(retrofit: Retrofit): JobOfferApiService =
            retrofit.create(JobOfferApiService::class.java)
    }
}
```

Every per-feature module collapses to a `@Binds` + a one-liner `@Provides` that takes the injected `Retrofit`. No more `OkHttpClient.Builder()`, no more `.baseUrl(literal)`, no more local `Moshi.Builder()`.

### 2.4 Integrity exception

`IntegrityModule` consumes `@UnauthOkHttpClient OkHttpClient` + `Moshi` and constructs its own `Retrofit` locally. `IntegrityApiService` keeps its existing `@Header("Authorization") authHeader: String` method parameter — the value passed at the call site is the Play Integrity attestation token, not a Firebase ID token. The Semgrep rule `no-header-authorization-in-apiservice.yml` carries an explicit allowlist entry for `IntegrityApiService.kt` (path-based exclusion). Renaming the wire header to `X-Integrity-Token` would force an API-side contract change + redeploy and is explicitly out of scope per the user prompt's "api/ unaffected by W1" directive; tracked as a follow-up.

---

## 3. Migration tiers (single PR, all-in)

| Tier | Modules | Work |
|---|---|---|
| **Tier 1 — security-critical** | JobOffer, Photo, Kyc, ActiveJob | bare OkHttp → injected `Retrofit`; delete `@Header("Authorization")` from ApiService methods; delete manual `firebaseAuth.currentUser?.getIdToken(...)` callsites (10 sites across 7 files: `AcceptJobOfferUseCase`, `DeclineJobOfferUseCase`, `FcmTokenSyncUseCase`, `JobPhotoRepositoryImpl`, `DigiLockerConsentUseCase`, `ActiveJobRepositoryImpl` ×3, `MarkReachedUseCase`) |
| **Tier 3 — consolidation only** | Earnings, Complaint, Payout, Shield, ServiceProfile, TechnicianJobs, TechnicianAvailability, Rating | replace local `Retrofit.Builder()` / `Moshi.Builder()` with the injected `Retrofit` from NetworkModule; no auth changes (these already consume `@AuthOkHttpClient` via the `data.rating.di.AuthOkHttpClient` import, which gets repointed to `data.network.di.AuthOkHttpClient`) |
| **Integrity (special)** | IntegrityModule | switch to `@UnauthRetrofit`; document the exception in ADR-0021 and Semgrep rule allowlist |

Single PR. Splitting back into pre-/post-P0 sub-PRs is ceremony for no review benefit — Codex reviews the whole picture more accurately in one diff.

---

## 4. Test strategy

Three test artifacts. No per-module MockWebServer duplication.

### 4.1 `AuthInterceptorCoverageTest.kt` (the gate)

JVM unit test. Spins up a single `MockWebServer`. Iterates over an explicit, hand-maintained list of every auth-bearing `*ApiService` Kotlin class in the technician-app graph (one line per ApiService — maintenance cost is one line when a new ApiService is added). For each ApiService:

1. Build the ApiService through a `Retrofit.Builder()` that points at the MockWebServer URL and uses the real `provideAuthOkHttpClient(...)` chain (with a mock `IdTokenCache` returning `"test-token-xyz"`).
2. Reflectively invoke the FIRST `@GET`/`@POST`/etc-annotated method with null/default args (KFunction-driven; the test does not need to call every method, only verify each ApiService carries the header through the interceptor).
3. Pop the recorded request off the MockWebServer dispatcher.
4. Assert `Authorization: Bearer test-token-xyz` is present.

The hand-maintained list is the single source of truth; a missing entry is caught by a second test (`AuthInterceptorCoverageCompletenessTest`) that scans the codebase for `interface .*ApiService` declarations and fails if any are not in the allowlist (auth-bearing) or denylist (Integrity).

The completeness check uses a simple file-scan (`Files.walk` + regex) — no reflection / ClassGraph dependency.

### 4.2 `FirebaseTokenAuthenticator401RetryTest.kt`

JVM unit test. MockWebServer enqueues `[401, 200]`. Mock `FirebaseAuth.currentUser.getIdToken(true)` returns a NEW token on the refresh call. Assert:

- Exactly 2 requests dispatched.
- Request 1 carries the cached (stale) token.
- Request 2 carries the refreshed token.
- The third 200 is NOT followed by another retry (priorResponse guard).

### 4.3 `NetworkModuleHiltTest.kt`

Robolectric test (Type-2 per `docs/patterns/hilt-module-android-test-scope.md`). Verifies:

- The Hilt graph compiles with NetworkModule installed.
- `@AuthOkHttpClient OkHttpClient` and `@UnauthOkHttpClient OkHttpClient` resolve to **different** instances.
- Both clients carry the logging interceptor.
- Only the auth client carries the `FirebaseTokenAuthenticator`.

### 4.4 TDD ordering

Per `superpowers:test-driven-development`: each test file commits **red** (test exists, implementation missing or stubbed) before the corresponding implementation. Red→green commits are paired in WS-A and WS-B.

---

## 5. Semgrep rules

Four new rules under `technician-app/.semgrep/` (path confirmed by reading `.github/workflows/technician-ship.yml` at execution time).

| Rule file | Pattern | Excludes / allowlist |
|---|---|---|
| `no-header-authorization-in-apiservice.yml` | `@Header("Authorization") $X: String` in `*ApiService.kt` | `IntegrityApiService.kt` |
| `no-bare-okhttp-outside-network-module.yml` | `OkHttpClient.Builder()` | `data/network/di/NetworkModule.kt`, `src/test/**`, `src/androidTest/**` |
| `no-hardcoded-base-url.yml` | regex `https://func-[^"]+\.azurewebsites\.net` | `build.gradle.kts`, `src/test/**`, fixture files |
| `no-manual-getidtoken-outside-auth-package.yml` | `$X.getIdToken($Y)` | `data/network/auth/**`, `src/test/**` |

CI wiring extends the existing Semgrep step in `technician-ship.yml`. Seeded-violation smoke test (intentional violation committed to a throwaway branch, expected CI red) confirms each rule fires before W1 merges.

---

## 6. Work streams

### WS-A — NetworkModule + tests + qualifier move (sequential, single agent, this Opus session)

Output:
1. `NetworkModule.kt` complete (providers, both qualifiers, logging interceptor with debug/release split).
2. `@AuthOkHttpClient` qualifier MOVED from `data/rating/di/RatingModule.kt` to `NetworkModule.kt`. Touches 8 import lines in Tier-3 modules; these are mechanical edits done here (since the qualifier deletion from RatingModule would break compilation otherwise).
3. `AuthInterceptorCoverageTest.kt` written enumerating ALL 11 auth-bearing ApiServices on day one. Test will be RED for Tier-1 ApiServices (JobOffer/Photo/Kyc/ActiveJob) until WS-B lands — this is intentional TDD red. Coverage-completeness test scans for `interface .*ApiService` and fails if any are unlisted.
4. `FirebaseTokenAuthenticator401RetryTest.kt` and `NetworkModuleHiltTest.kt` written and GREEN (these don't depend on Tier-1 migration).

At WS-A completion, CI is intentionally red on `AuthInterceptorCoverageTest` for the 4 Tier-1 ApiServices, GREEN on everything else. WS-B's job is to turn those 4 red lines green.

### WS-B — Per-feature migration (4 parallel Sonnet subagents, after WS-A green)

| Stream | Modules | Files | TDD state |
|---|---|---|---|
| **B1** | JobOffer | `JobOfferModule.kt`, `JobOfferApiService.kt`, `AcceptJobOfferUseCase.kt`, `DeclineJobOfferUseCase.kt`, `FcmTokenSyncUseCase.kt` | starts RED (coverage test already written in WS-A); B1 makes JobOffer green |
| **B2** | Photo + Kyc | `PhotoModule.kt`, `PhotoApiService.kt`, `JobPhotoRepositoryImpl.kt`, `KycModule.kt`, `DigiLockerConsentUseCase.kt` | starts RED; B2 makes Photo + Kyc green |
| **B3** | ActiveJob | `ActiveJobModule.kt`, `ActiveJobApiService.kt`, `ActiveJobRepositoryImpl.kt` (3 callsites), `MarkReachedUseCase.kt` | starts RED; B3 makes ActiveJob green |
| **B4** | Tier-3 fanout | Earnings, Complaint, Payout, Shield, ServiceProfile, TechnicianJobs, TechnicianAvailability, Rating — DI-only edits (8x one-line `@Provides` change to consume `Retrofit` from NetworkModule) | already GREEN in WS-A on coverage test (they already had auth); WS-B4 collapses their Retrofit/Moshi duplication |

### WS-C — Integrity + ADR + Kover (Sonnet, parallel with WS-D, after WS-B)

- `IntegrityModule` switches to `@UnauthRetrofit` + `@UnauthOkHttpClient`.
- `IntegrityApiService` keeps its current header-passing pattern (App Check token, NOT Firebase token).
- ADR-0021 drafted and committed (template under `docs/adr/TEMPLATE.md`).
- Kover excludes block extended with `"*.data.network.di.*"` (matches rationale of other DI excludes).

### WS-D — Semgrep + CI (Haiku, parallel with WS-C, after WS-B)

- Four `.semgrep/*.yml` rules created.
- `technician-ship.yml` Semgrep step's `--config` argument extended to include `technician-app/.semgrep/`.
- Seeded-violation throwaway commit (one per rule) verifies CI fails as expected; revert the seed before merge.

### WS-E — Smoke + review

- `bash tools/pre-codex-smoke.sh technician-app` — non-zero exit = stop and fix.
- On green: `codex review --base main` AND `/security-review` invoked in parallel (auth-adjacent trigger fires).
- Target: pass in 1 Codex round. P0/P1 findings → fix in Claude, rerun Codex once.

---

## 7. ADR-0021

`docs/adr/0021-technician-app-network-module-and-auth-qualifier.md`. Skeleton:

- **Status:** Accepted
- **Context:** Audit P0-1 (silent unauth API calls on JobOffer/Photo/Kyc), 11x hardcoded `azurewebsites.net` literals, manual `getIdToken()` plumbing fragile against token expiry, `@AuthOkHttpClient` qualifier living in `data/rating/di/` (semantic mismatch).
- **Decision:** Centralize OkHttp + Retrofit + Moshi construction in `data/network/di/NetworkModule.kt`. `@AuthOkHttpClient` is the single qualifier for all Firebase-auth-bearing HTTP. `@UnauthOkHttpClient` for App Check / Play Integrity flows. Semgrep guards prevent future drift.
- **Alternatives rejected:**
  - Status quo per-module Retrofit construction — fails the security and consolidation goals.
  - Per-buildType URL split via `buildTypes { debug { buildConfigField ... } release { ... } }` — deferred until staging Function App exists; tracked as follow-up.
- **Consequences:** Tier-3 modules coupled to NetworkModule's `Retrofit` shape. New ApiServices added to the project MUST consume `NetworkModule.provideRetrofit` and MUST NOT declare `@Header("Authorization")` (enforced by Semgrep).
- **Deferred:** per-buildType URL split; App Check wiring; Detekt custom rule.

---

## 8. Risk register

| Risk | Mitigation | Layer |
|---|---|---|
| Auth regression — interceptor not firing for one or more ApiServices after migration | `AuthInterceptorCoverageTest` enumerates every `*ApiService` and asserts the `Authorization` header | Test |
| Integrity flow break — accidental routing of Play Integrity traffic through `@AuthOkHttpClient` (which adds a Firebase ID token the Integrity endpoint doesn't expect) | Separate `@UnauthOkHttpClient` qualifier; Semgrep `no-header-authorization-in-apiservice` rule allowlists `IntegrityApiService.kt` | Type + Lint |
| Hilt graph compilation regression | `assembleDebug` step in `tools/pre-codex-smoke.sh` exercises the Hilt annotation processor pre-Codex | Smoke |
| Kover coverage threshold drift on the new files | Add `*.data.network.di.*` to the existing `kover.reports.filters.excludes.classes` block (rationale matches other DI module exclusions) | Coverage |
| Cross-OS Paparazzi drift | N/A — no Compose UI changes in W1 | — |
| Token refresh path regression — interceptor adds Bearer, but Authenticator doesn't retry on 401 | `FirebaseTokenAuthenticator401RetryTest` asserts the 401-refresh-retry contract end-to-end | Test |
| 11 simultaneous module migrations create a giant diff that Codex can't review well | Per-tier conventional commits within the single PR; each subagent commits its own tier; final diff is reviewable by stream | Workflow |

---

## 9. Definition of done

- ✅ 0 occurrences of `azurewebsites.net` in `technician-app/app/src/main/` (grep).
- ✅ 0 `Bearer ` string literals in `technician-app/app/src/main/` outside `NetworkModule.kt`.
- ✅ 0 `@Header("Authorization")` annotations in `technician-app/app/src/main/` outside `IntegrityApiService.kt`.
- ✅ 0 `getIdToken(` callsites in `technician-app/app/src/main/` outside `data/network/auth/**`.
- ✅ `AuthInterceptorCoverageTest` enumerates ≥11 auth-bearing ApiServices and asserts header presence on all.
- ✅ `FirebaseTokenAuthenticator401RetryTest` green.
- ✅ `NetworkModuleHiltTest` green.
- ✅ Each of the 4 Semgrep rules confirmed to fire on a seeded violation (seed reverted pre-merge).
- ✅ ADR-0021 committed.
- ✅ Kover threshold still met (existing minBound values unchanged).
- ✅ `bash tools/pre-codex-smoke.sh technician-app` exits 0.
- ✅ `codex review --base main` passes in one round (target — one rerun budget if P1 surfaces).
- ✅ `/security-review` passes.
- ✅ CI green on `feat/w1-network-foundation`.

---

## 10. Out-of-scope / follow-ups

- Per-buildType URL split — open when staging Function App exists.
- App Check wiring — separate story.
- HttpLoggingInterceptor BODY-leak is fixed in this wave for `technician-app/` only. `customer-app/` parity is a separate codemod (Haiku tier).
- Detekt custom rule for `Retrofit.Builder().baseUrl(<literal>)` — Semgrep covers this; revisit if a literal escapes the Semgrep pattern.

---

## 11. References

- Plan: `C:\Users\alokt\.claude\plans\adaptive-growing-mochi.md` §4 Wave 1
- Patterns to apply: `docs/patterns/hilt-module-android-test-scope.md`, `docs/patterns/firebase-callbackflow-lifecycle.md` (auth callbacks are blast-radius adjacent), `docs/patterns/kotlin-explicit-api-public-modifier.md`
- Existing reference implementation: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/rating/di/RatingModule.kt` (the `@AuthOkHttpClient` pattern this wave generalizes)
- Existing infrastructure: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/network/auth/{IdTokenCache,FirebaseTokenAuthenticator}.kt`
