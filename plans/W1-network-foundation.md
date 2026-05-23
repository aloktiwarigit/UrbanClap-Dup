# W1 — Technician-App Network Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize all `technician-app/` networking (OkHttp client + Retrofit + Moshi) into a single `NetworkModule`, eliminate `@Header("Authorization")` method-param plumbing, add four Semgrep regression guards, and commit ADR-0021. Closes audit P0-1 (de-scoped from W0-A) plus 11x base-URL duplication.

**Architecture:** A single `data/network/di/NetworkModule.kt` owns the `@AuthOkHttpClient` qualifier (moved from `data/rating/di/`), a new `@UnauthOkHttpClient` qualifier for Play Integrity, the auth-bearing `Retrofit` instance, and a shared `Moshi`. Per-feature modules shrink to a `@Binds` + a one-liner `@Provides` that calls `.create(XxxApiService::class.java)` on the injected `Retrofit`. `IntegrityModule` remains the one exception, building its own `Retrofit` from the injected `@UnauthOkHttpClient`. Four Semgrep rules prevent regression. Test gate: an `AuthInterceptorCoverageTest` that enumerates every auth-bearing `*ApiService` and asserts `Authorization: Bearer ...` is on the wire.

**Tech Stack:** Kotlin (`-Xexplicit-api=strict`, `-Werror`), Hilt, OkHttp 4.x, Retrofit 2, Moshi, MockWebServer, Robolectric, JUnit 5, MockK, Semgrep, GitHub Actions.

**Branch:** `feat/w1-network-foundation`
**Worktree:** `C:\Alok\Business Projects\Urbanclap-dup-w1`
**Design spec:** `docs/specs/2026-05-12-w1-network-foundation.md` (committed `cbededca`)

---

## Pattern files (READ BEFORE STARTING)

| Pattern file | Why it applies |
|---|---|
| `docs/patterns/hilt-module-android-test-scope.md` | NetworkModuleHiltTest must use Robolectric (Type 2), not `@HiltAndroidTest` |
| `docs/patterns/kotlin-explicit-api-public-modifier.md` | Every new public Kotlin declaration in this plan needs explicit `public` |
| `docs/patterns/firebase-callbackflow-lifecycle.md` | Auth callbacks are blast-radius adjacent (not directly touched) |

Paparazzi gotchas don't apply — no Compose UI in W1.

---

## File structure

### Created
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/network/di/NetworkModule.kt`
- `technician-app/app/src/test/kotlin/com/homeservices/technician/data/network/di/AuthInterceptorCoverageTest.kt`
- `technician-app/app/src/test/kotlin/com/homeservices/technician/data/network/di/AuthInterceptorCoverageCompletenessTest.kt`
- `technician-app/app/src/test/kotlin/com/homeservices/technician/data/network/auth/FirebaseTokenAuthenticator401RetryTest.kt`
- `technician-app/app/src/test/kotlin/com/homeservices/technician/data/network/di/NetworkModuleHiltTest.kt`
- `technician-app/.semgrep/no-header-authorization-in-apiservice.yml`
- `technician-app/.semgrep/no-bare-okhttp-outside-network-module.yml`
- `technician-app/.semgrep/no-hardcoded-base-url.yml`
- `technician-app/.semgrep/no-manual-getidtoken-outside-auth-package.yml`
- `docs/adr/0021-technician-app-network-module-and-auth-qualifier.md`

### Modified
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/rating/di/RatingModule.kt` — qualifier + provider deleted, RatingApiService consumes `Retrofit`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/shield/di/ShieldModule.kt` — import repointed, `provideMoshi` deleted, `provideShieldApiService` consumes `Retrofit`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/serviceprofile/di/ServiceProfileModule.kt` — import repointed, provider consumes `Retrofit`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/payout/di/PayoutModule.kt` — import repointed, provider consumes `Retrofit`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/jobs/di/TechnicianJobsModule.kt` — import repointed, provider consumes `Retrofit`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/availability/di/TechnicianAvailabilityModule.kt` — import repointed, provider consumes `Retrofit`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/di/EarningsModule.kt` — import repointed, provider consumes `Retrofit`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/complaint/di/ComplaintModule.kt` — import repointed, provider consumes `Retrofit`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/jobOffer/di/JobOfferModule.kt` — bare client deleted, provider consumes `Retrofit`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/jobOffer/JobOfferApiService.kt` — 3 `@Header("Authorization")` params removed
- `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/jobOffer/AcceptJobOfferUseCase.kt` — `firebaseAuth` ctor param + manual token fetch deleted
- `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/jobOffer/DeclineJobOfferUseCase.kt` — same
- `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/jobOffer/FcmTokenSyncUseCase.kt` — same
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/photo/di/PhotoModule.kt` — bare client deleted, provider consumes `Retrofit`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/photo/PhotoApiService.kt` — `@Header("Authorization")` removed
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/photo/JobPhotoRepositoryImpl.kt` — `getIdToken` removed
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/kyc/di/KycModule.kt` — bare client deleted, provider consumes `Retrofit`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/kyc/DigiLockerConsentUseCase.kt` — `getIdToken` removed
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/activeJob/di/ActiveJobModule.kt` — bare client deleted, provider consumes `Retrofit`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/activeJob/ActiveJobApiService.kt` — 2 `@Header("Authorization")` params removed (X-Integrity-Token retained)
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/activeJob/ActiveJobRepositoryImpl.kt` — 3 `getIdToken` callsites removed
- `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/activeJob/MarkReachedUseCase.kt` — `getIdToken` removed
- `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/integrity/di/IntegrityModule.kt` — consumes `@UnauthOkHttpClient`
- `technician-app/app/build.gradle.kts` — Kover excludes extended
- `.github/workflows/technician-ship.yml` — Semgrep step config extended

---

## Test gate (the regression net)

`AuthInterceptorCoverageTest` is the single source of truth that EVERY auth-bearing `*ApiService` interface routes through `@AuthOkHttpClient`. It uses a hand-maintained allowlist (one line per ApiService) and is paired with `AuthInterceptorCoverageCompletenessTest` (a file-scan over `*ApiService.kt` files that fails if any new ApiService is not categorized as auth-bearing OR explicitly excluded).

Migration is "done" when this test goes from red on Tier-1 ApiServices to green on all 11 auth-bearing ApiServices.

---

# WS-A — NetworkModule + tests + qualifier move (THIS SESSION, model: opus → sonnet at execution)

WS-A is sequential and lands first. WS-B subagents depend on WS-A's committed state.

### Task A1: Rebase onto latest origin/main + snapshot current state

**Files:** None (read-only + rebase).

- [ ] **Step 1: Fetch + rebase onto latest origin/main**

PR #205 (W3-3D Photo + FCM hygiene) merged to main on 2026-05-12 and touched three files that overlap with WS-B2's surface area:
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/photo/JobPhotoRepositoryImpl.kt` (added `deleteLocalPhoto()` method)
- `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/photo/JobPhotoRepository.kt` (added `deleteLocalPhoto` interface method)
- `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/photo/UploadJobPhotoUseCase.kt`

PR #205's changes do NOT overlap with W1's planned modifications (W1 only touches the `getIdToken` callsite + the `recordPhoto` API call signature in `JobPhotoRepositoryImpl.kt`; PR #205 added an unrelated cleanup method). But they share files. Rebase brings the new surface into the branch before WS-B2 dispatches; if a textual conflict surfaces, the new `deleteLocalPhoto()` method MUST be preserved — only the `getIdToken` block changes per W1's spec.

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1"
git fetch origin main
git rebase origin/main
git log --oneline origin/main..HEAD
```
Expected: rebase completes cleanly OR with conflicts ONLY in unrelated files (the spec + plan markdown won't conflict). If the rebase reports `Successfully rebased`, the two W1 commits (`cbededca` + `b09b382b`) now sit on top of the latest main. The `git log` should show 2 commits ahead of `origin/main`.

If conflicts surface in any technician-app file, resolve preserving PR #205's additions; only Tier-1 code changes are W1's territory.

- [ ] **Step 2: Verify worktree + branch state**

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1"
git status
git rev-parse --abbrev-ref HEAD
```
Expected: clean working tree on branch `feat/w1-network-foundation`.

- [ ] **Step 3: Confirm baseline build is green before any edits**

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1/technician-app"
./gradlew assembleDebug --quiet 2>&1 | tail -5
```
Expected: `BUILD SUCCESSFUL`.

If this fails, STOP — there is a pre-existing issue on the rebased branch tip. Investigate before continuing.

---

### Task A2: Create NetworkModule.kt

**Files:**
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/network/di/NetworkModule.kt`

- [ ] **Step 1: Write the file**

```kotlin
package com.homeservices.technician.data.network.di

import com.homeservices.technician.BuildConfig
import com.homeservices.technician.data.network.auth.FirebaseTokenAuthenticator
import com.homeservices.technician.data.network.auth.IdTokenCache
import com.homeservices.technician.data.network.defaultMoshi
import com.squareup.moshi.Moshi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Qualifier
import javax.inject.Singleton

@Qualifier
@Retention(AnnotationRetention.BINARY)
public annotation class AuthOkHttpClient

@Qualifier
@Retention(AnnotationRetention.BINARY)
public annotation class UnauthOkHttpClient

@Module
@InstallIn(SingletonComponent::class)
public object NetworkModule {
    @Provides
    @Singleton
    public fun provideMoshi(): Moshi = defaultMoshi

    @Provides
    @Singleton
    public fun provideLoggingInterceptor(): HttpLoggingInterceptor =
        HttpLoggingInterceptor().apply {
            level =
                if (BuildConfig.DEBUG) {
                    HttpLoggingInterceptor.Level.BODY
                } else {
                    HttpLoggingInterceptor.Level.NONE
                }
        }

    @Provides
    @Singleton
    @AuthOkHttpClient
    public fun provideAuthOkHttpClient(
        idTokenCache: IdTokenCache,
        authenticator: FirebaseTokenAuthenticator,
        logging: HttpLoggingInterceptor,
    ): OkHttpClient =
        OkHttpClient
            .Builder()
            .addInterceptor { chain ->
                val token = idTokenCache.cachedToken
                val req =
                    if (token != null) {
                        chain
                            .request()
                            .newBuilder()
                            .header("Authorization", "Bearer $token")
                            .build()
                    } else {
                        chain.request()
                    }
                chain.proceed(req)
            }.addInterceptor(logging)
            .authenticator(authenticator)
            .build()

    @Provides
    @Singleton
    @UnauthOkHttpClient
    public fun provideUnauthOkHttpClient(logging: HttpLoggingInterceptor): OkHttpClient =
        OkHttpClient
            .Builder()
            .addInterceptor(logging)
            .build()

    @Provides
    @Singleton
    public fun provideRetrofit(
        @AuthOkHttpClient client: OkHttpClient,
        moshi: Moshi,
    ): Retrofit =
        Retrofit
            .Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/")
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
}
```

- [ ] **Step 2: Run assembleDebug — will FAIL (duplicate `AuthOkHttpClient` qualifier vs the one still in RatingModule)**

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1/technician-app"
./gradlew assembleDebug --quiet 2>&1 | tail -20
```
Expected: build fails. The Hilt processor will complain about duplicate `@AuthOkHttpClient` qualifier OR duplicate `@Provides Moshi`. This is expected — Task A6 resolves it.

---

### Task A3: Write the AuthInterceptorCoverageTest (red)

**Files:**
- Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/data/network/di/AuthInterceptorCoverageTest.kt`

- [ ] **Step 1: Write the test**

```kotlin
package com.homeservices.technician.data.network.di

import com.homeservices.technician.data.activeJob.ActiveJobApiService
import com.homeservices.technician.data.availability.remote.TechnicianAvailabilityApiService
import com.homeservices.technician.data.complaint.remote.ComplaintApiService
import com.homeservices.technician.data.earnings.remote.EarningsApiService
import com.homeservices.technician.data.jobOffer.JobOfferApiService
import com.homeservices.technician.data.jobs.remote.TechnicianJobsApiService
import com.homeservices.technician.data.kyc.KycApiService
import com.homeservices.technician.data.network.auth.FirebaseTokenAuthenticator
import com.homeservices.technician.data.network.auth.IdTokenCache
import com.homeservices.technician.data.network.defaultMoshi
import com.homeservices.technician.data.payout.remote.PayoutApiService
import com.homeservices.technician.data.photo.PhotoApiService
import com.homeservices.technician.data.rating.remote.RatingApiService
import com.homeservices.technician.data.serviceprofile.remote.ServiceProfileApiService
import com.homeservices.technician.data.shield.remote.ShieldApiService
import io.mockk.every
import io.mockk.mockk
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DynamicTest
import org.junit.jupiter.api.TestFactory
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import kotlin.reflect.KClass

/**
 * The regression gate for W1. Asserts that every auth-bearing ApiService in the
 * technician-app graph emits an `Authorization: Bearer <token>` header on the wire
 * when invoked through the @AuthOkHttpClient interceptor chain.
 *
 * Maintenance: when a new ApiService is added, append it to AUTH_BEARING_APIS. The
 * paired AuthInterceptorCoverageCompletenessTest fails if a new *ApiService.kt
 * file appears in the source tree without being added here OR to the IntegrityApiService
 * exclusion list.
 */
public class AuthInterceptorCoverageTest {
    private lateinit var mockServer: MockWebServer
    private lateinit var authClient: OkHttpClient

    @BeforeEach
    public fun setUp() {
        mockServer = MockWebServer()
        mockServer.start()
        val idTokenCache: IdTokenCache = mockk()
        every { idTokenCache.cachedToken } returns TEST_TOKEN
        val authenticator: FirebaseTokenAuthenticator = mockk()
        authClient =
            OkHttpClient
                .Builder()
                .addInterceptor { chain ->
                    val token = idTokenCache.cachedToken
                    val req =
                        if (token != null) {
                            chain
                                .request()
                                .newBuilder()
                                .header("Authorization", "Bearer $token")
                                .build()
                        } else {
                            chain.request()
                        }
                    chain.proceed(req)
                }.authenticator(authenticator)
                .build()
    }

    @AfterEach
    public fun tearDown() {
        mockServer.shutdown()
    }

    @TestFactory
    public fun `every auth-bearing ApiService emits Authorization header`(): List<DynamicTest> =
        AUTH_BEARING_APIS.map { apiClass ->
            DynamicTest.dynamicTest(apiClass.simpleName ?: apiClass.java.name) {
                mockServer.enqueue(MockResponse().setResponseCode(200).setBody("{}"))
                val api = Retrofit
                    .Builder()
                    .baseUrl(mockServer.url("/"))
                    .client(authClient)
                    .addConverterFactory(MoshiConverterFactory.create(defaultMoshi))
                    .build()
                    .create(apiClass.java)
                invokeFirstMethod(api, apiClass)
                val recorded = mockServer.takeRequest()
                assertThat(recorded.getHeader("Authorization"))
                    .describedAs("ApiService ${apiClass.simpleName} should emit Authorization header via interceptor")
                    .isEqualTo("Bearer $TEST_TOKEN")
            }
        }

    /**
     * Reflectively invokes a deterministically-chosen HTTP-annotated method on the
     * ApiService interface. JVM `declaredMethods` ordering is undefined and varies by
     * JVM version, so we:
     *
     *   1. Filter for methods that carry a Retrofit HTTP-verb annotation (@GET, @POST,
     *      @PATCH, @PUT, @DELETE, @HEAD, @OPTIONS) — these are the only methods that
     *      will actually emit an HTTP request through the interceptor.
     *   2. Sort by method name to make selection deterministic across JVM versions.
     *   3. Pick the first.
     *
     * This is enough to exercise the OkHttp interceptor chain — we are NOT testing the
     * method's response handling, just that the Authorization header lands on the wire.
     */
    private fun <T : Any> invokeFirstMethod(
        api: T,
        apiClass: KClass<T>,
    ) {
        val httpAnnotations = setOf(
            retrofit2.http.GET::class.java,
            retrofit2.http.POST::class.java,
            retrofit2.http.PATCH::class.java,
            retrofit2.http.PUT::class.java,
            retrofit2.http.DELETE::class.java,
            retrofit2.http.HEAD::class.java,
            retrofit2.http.OPTIONS::class.java,
        )
        val method = apiClass.java.declaredMethods
            .filter { m -> m.annotations.any { it.annotationClass.java in httpAnnotations } }
            .sortedBy { it.name }
            .firstOrNull()
            ?: error("ApiService ${apiClass.simpleName} has no HTTP-annotated methods")
        val args =
            method.parameterTypes.map { type ->
                when (type) {
                    String::class.java -> "test"
                    java.lang.Integer.TYPE, java.lang.Integer::class.java -> 0
                    java.lang.Long.TYPE, java.lang.Long::class.java -> 0L
                    java.lang.Boolean.TYPE, java.lang.Boolean::class.java -> false
                    else -> null
                }
            }.toTypedArray()
        runCatching { method.invoke(api, *args) }
        // Ignore reflective invocation result — we only care that the network call fires.
    }

    private companion object {
        const val TEST_TOKEN = "test-token-xyz"

        /**
         * Single source of truth for auth-bearing ApiServices in technician-app.
         * Add new ApiService entries here when a new feature lands.
         */
        val AUTH_BEARING_APIS: List<KClass<*>> = listOf(
            ActiveJobApiService::class,
            TechnicianAvailabilityApiService::class,
            ComplaintApiService::class,
            EarningsApiService::class,
            JobOfferApiService::class,
            TechnicianJobsApiService::class,
            KycApiService::class,
            PayoutApiService::class,
            PhotoApiService::class,
            RatingApiService::class,
            ServiceProfileApiService::class,
            ShieldApiService::class,
        )
    }
}
```

- [ ] **Step 2: Run the test — verify it compiles**

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1/technician-app"
./gradlew compileDebugUnitTestKotlin --quiet 2>&1 | tail -10
```
Expected: compiles successfully (Tier-1 ApiServices still have `@Header("Authorization")` params, but the test's reflective call accepts any signature — the test compiles fine).

Test will FAIL when run because Tier-1 ApiServices currently emit the `Authorization` header via their `@Header` param (which the reflective invocation passes as `"test"`, NOT `"Bearer test-token-xyz"`). That's the expected red state. Don't run `testDebugUnitTest` yet — Tasks A4/A5/A6 need to land first.

---

### Task A4: Write AuthInterceptorCoverageCompletenessTest

**Files:**
- Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/data/network/di/AuthInterceptorCoverageCompletenessTest.kt`

- [ ] **Step 1: Write the test**

```kotlin
package com.homeservices.technician.data.network.di

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.io.File
import java.nio.file.Files
import java.util.stream.Collectors

/**
 * Catches the failure mode: someone adds a new XxxApiService.kt and forgets to wire
 * it through the @AuthOkHttpClient interceptor + AuthInterceptorCoverageTest's allowlist.
 *
 * Scans technician-app/app/src/main/kotlin for `interface .*ApiService` declarations
 * and asserts each is either listed in AuthInterceptorCoverageTest.AUTH_BEARING_APIS
 * (auth-bearing) or in UNAUTH_API_FILE_NAMES (Integrity exception).
 */
public class AuthInterceptorCoverageCompletenessTest {
    @Test
    public fun `every ApiService is categorized as auth-bearing or explicitly unauth`() {
        val sourceRoot = locateSourceRoot()
        val apiServiceFiles =
            Files.walk(sourceRoot.toPath()).use { stream ->
                stream
                    .filter { p -> p.toString().endsWith("ApiService.kt") }
                    .collect(Collectors.toList())
            }
        assertThat(apiServiceFiles).isNotEmpty
        val discoveredSimpleNames =
            apiServiceFiles.map { p ->
                p.fileName.toString().removeSuffix(".kt")
            }.toSet()

        val authBearing =
            AuthInterceptorCoverageTest::class.java
                .getDeclaredField("Companion")
                .also { it.isAccessible = true }
                .let { field ->
                    val companion = field.get(null)
                    val apisField =
                        companion.javaClass.getDeclaredField("AUTH_BEARING_APIS")
                    apisField.isAccessible = true
                    @Suppress("UNCHECKED_CAST")
                    val kClasses = apisField.get(companion) as List<kotlin.reflect.KClass<*>>
                    kClasses.mapNotNull { it.simpleName }.toSet()
                }

        val uncategorized = discoveredSimpleNames - authBearing - UNAUTH_API_SIMPLE_NAMES
        assertThat(uncategorized).describedAs(
            "Every *ApiService.kt must be listed in AuthInterceptorCoverageTest.AUTH_BEARING_APIS " +
                "OR in AuthInterceptorCoverageCompletenessTest.UNAUTH_API_SIMPLE_NAMES. " +
                "Uncategorized: $uncategorized",
        ).isEmpty()
    }

    private fun locateSourceRoot(): File {
        val cwd = File("").absoluteFile
        val candidates =
            listOf(
                File(cwd, "app/src/main/kotlin"),
                File(cwd, "technician-app/app/src/main/kotlin"),
            )
        return candidates.first { it.isDirectory }
    }

    private companion object {
        /** ApiServices explicitly excluded from the @AuthOkHttpClient interceptor (e.g. Play Integrity). */
        val UNAUTH_API_SIMPLE_NAMES = setOf("IntegrityApiService")
    }
}
```

- [ ] **Step 2: Compile-check**

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1/technician-app"
./gradlew compileDebugUnitTestKotlin --quiet 2>&1 | tail -5
```
Expected: `BUILD SUCCESSFUL`.

---

### Task A5: Write FirebaseTokenAuthenticator401RetryTest

**Files:**
- Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/data/network/auth/FirebaseTokenAuthenticator401RetryTest.kt`

- [ ] **Step 1: Write the test**

```kotlin
package com.homeservices.technician.data.network.auth

import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GetTokenResult
import io.mockk.every
import io.mockk.mockk
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class FirebaseTokenAuthenticator401RetryTest {
    private lateinit var server: MockWebServer

    @BeforeEach
    public fun setUp() {
        server = MockWebServer()
        server.start()
    }

    @AfterEach
    public fun tearDown() {
        server.shutdown()
    }

    @Test
    public fun `on 401 the authenticator refreshes the ID token and retries once`() {
        val staleToken = "stale-token"
        val freshToken = "fresh-token"

        val firebaseAuth: FirebaseAuth = mockk()
        val firebaseUser: FirebaseUser = mockk()
        val tokenResult: GetTokenResult = mockk()
        every { firebaseAuth.currentUser } returns firebaseUser
        every { tokenResult.token } returns freshToken
        every { firebaseUser.getIdToken(true) } returns Tasks.forResult(tokenResult)

        val authenticator = FirebaseTokenAuthenticator(firebaseAuth)
        val client =
            OkHttpClient
                .Builder()
                .addInterceptor { chain ->
                    val req =
                        chain
                            .request()
                            .newBuilder()
                            .header("Authorization", "Bearer $staleToken")
                            .build()
                    chain.proceed(req)
                }.authenticator(authenticator)
                .build()

        server.enqueue(MockResponse().setResponseCode(401))
        server.enqueue(MockResponse().setResponseCode(200).setBody("ok"))

        client.newCall(
            Request.Builder().url(server.url("/v1/whatever")).build(),
        ).execute().close()

        assertThat(server.requestCount).isEqualTo(2)
        val first = server.takeRequest()
        val second = server.takeRequest()
        assertThat(first.getHeader("Authorization")).isEqualTo("Bearer $staleToken")
        assertThat(second.getHeader("Authorization")).isEqualTo("Bearer $freshToken")
    }

    @Test
    public fun `on second 401 the authenticator does not retry again`() {
        val freshToken = "fresh-token"
        val firebaseAuth: FirebaseAuth = mockk()
        val firebaseUser: FirebaseUser = mockk()
        val tokenResult: GetTokenResult = mockk()
        every { firebaseAuth.currentUser } returns firebaseUser
        every { tokenResult.token } returns freshToken
        every { firebaseUser.getIdToken(true) } returns Tasks.forResult(tokenResult)

        val authenticator = FirebaseTokenAuthenticator(firebaseAuth)
        val client =
            OkHttpClient
                .Builder()
                .addInterceptor { chain ->
                    val req = chain.request().newBuilder()
                        .header("Authorization", "Bearer initial").build()
                    chain.proceed(req)
                }.authenticator(authenticator)
                .build()

        server.enqueue(MockResponse().setResponseCode(401))
        server.enqueue(MockResponse().setResponseCode(401))

        client.newCall(
            Request.Builder().url(server.url("/v1/whatever")).build(),
        ).execute().close()

        assertThat(server.requestCount).isEqualTo(2)
    }
}
```

- [ ] **Step 2: Run the test alone**

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1/technician-app"
./gradlew testDebugUnitTest --tests "*.FirebaseTokenAuthenticator401RetryTest" --quiet 2>&1 | tail -20
```
Expected: `BUILD SUCCESSFUL` with 2 tests passing.

---

### Task A6: Write NetworkModuleHiltTest

**Files:**
- Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/data/network/di/NetworkModuleHiltTest.kt`

- [ ] **Step 1: Write the test**

This test is JVM-unit-level (no Hilt runner) per `docs/patterns/hilt-module-android-test-scope.md` — manual construction of NetworkModule providers.

```kotlin
package com.homeservices.technician.data.network.di

import com.homeservices.technician.data.network.auth.FirebaseTokenAuthenticator
import com.homeservices.technician.data.network.auth.IdTokenCache
import io.mockk.mockk
import okhttp3.logging.HttpLoggingInterceptor
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class NetworkModuleHiltTest {
    @Test
    public fun `auth and unauth clients are different instances`() {
        val logging = NetworkModule.provideLoggingInterceptor()
        val idTokenCache: IdTokenCache = mockk()
        val authenticator: FirebaseTokenAuthenticator = mockk()

        val authClient = NetworkModule.provideAuthOkHttpClient(idTokenCache, authenticator, logging)
        val unauthClient = NetworkModule.provideUnauthOkHttpClient(logging)

        assertThat(authClient).isNotSameAs(unauthClient)
    }

    @Test
    public fun `auth client carries the authenticator`() {
        val logging = NetworkModule.provideLoggingInterceptor()
        val idTokenCache: IdTokenCache = mockk()
        val authenticator: FirebaseTokenAuthenticator = mockk()

        val authClient = NetworkModule.provideAuthOkHttpClient(idTokenCache, authenticator, logging)

        assertThat(authClient.authenticator).isSameAs(authenticator)
    }

    @Test
    public fun `unauth client does not carry the authenticator`() {
        val logging = NetworkModule.provideLoggingInterceptor()

        val unauthClient = NetworkModule.provideUnauthOkHttpClient(logging)

        // OkHttp's default Authenticator.NONE is a singleton — confirm we did not attach FirebaseTokenAuthenticator
        assertThat(unauthClient.authenticator)
            .isNotInstanceOf(FirebaseTokenAuthenticator::class.java)
    }

    @Test
    public fun `logging interceptor level depends on BuildConfig DEBUG`() {
        val logging = NetworkModule.provideLoggingInterceptor()
        // In unit tests, BuildConfig.DEBUG resolves to true (debug variant). Verify BODY level.
        // If this assertion fails when running release-variant tests, that's also correct behavior.
        assertThat(logging.level).isIn(
            HttpLoggingInterceptor.Level.BODY,
            HttpLoggingInterceptor.Level.NONE,
        )
    }
}
```

- [ ] **Step 2: Compile**

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1/technician-app"
./gradlew compileDebugUnitTestKotlin --quiet 2>&1 | tail -5
```
Expected: `BUILD SUCCESSFUL` (will still fail to RUN until Task A7 lands because the duplicate qualifier in RatingModule blocks Hilt processing).

---

### Task A7: Delete `@AuthOkHttpClient` qualifier + provider from RatingModule, repoint Tier-3 imports

**Files:**
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/rating/di/RatingModule.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/shield/di/ShieldModule.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/serviceprofile/di/ServiceProfileModule.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/payout/di/PayoutModule.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/jobs/di/TechnicianJobsModule.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/availability/di/TechnicianAvailabilityModule.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/di/EarningsModule.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/complaint/di/ComplaintModule.kt`

- [ ] **Step 1: Rewrite RatingModule.kt**

Replace the file content with:

```kotlin
package com.homeservices.technician.data.rating.di

import com.homeservices.technician.data.rating.RatingRepository
import com.homeservices.technician.data.rating.RatingRepositoryImpl
import com.homeservices.technician.data.rating.remote.RatingApiService
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class RatingModule {
    @Binds
    internal abstract fun bindRatingRepository(impl: RatingRepositoryImpl): RatingRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideRatingApiService(retrofit: Retrofit): RatingApiService =
            retrofit.create(RatingApiService::class.java)
    }
}
```

The `@AuthOkHttpClient` qualifier and `provideAuthOkHttpClient` provider are now solely defined in `NetworkModule`.

- [ ] **Step 2: Repoint ShieldModule.kt**

Replace the file content with:

```kotlin
package com.homeservices.technician.data.shield.di

import com.homeservices.technician.data.shield.ShieldRepositoryImpl
import com.homeservices.technician.data.shield.remote.ShieldApiService
import com.homeservices.technician.domain.shield.ShieldRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class ShieldModule {
    @Binds
    internal abstract fun bindShieldRepository(impl: ShieldRepositoryImpl): ShieldRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideShieldApiService(retrofit: Retrofit): ShieldApiService =
            retrofit.create(ShieldApiService::class.java)
    }
}
```

Note: the duplicate `provideMoshi` is deleted — `NetworkModule.provideMoshi` is the single source. The `@AuthOkHttpClient` import is removed because the module no longer references the qualifier directly (it just consumes `Retrofit`).

- [ ] **Step 3: Repoint ServiceProfileModule.kt**

Read the file:
```bash
cat "technician-app/app/src/main/kotlin/com/homeservices/technician/data/serviceprofile/di/ServiceProfileModule.kt"
```

Replace it with the same shape as ShieldModule above, swapping in `ServiceProfileApiService` / `ServiceProfileRepositoryImpl` / `ServiceProfileRepository`. Preserve any `@Binds` for `ServiceProfileRepository` (if present in the original) and ApiService class. Keep the `public abstract class ServiceProfileModule { ... }` / `public companion object { ... }` shape per `kotlin-explicit-api-public-modifier.md`.

The pattern is:

```kotlin
package com.homeservices.technician.data.serviceprofile.di

import com.homeservices.technician.data.serviceprofile.remote.ServiceProfileApiService
// + repository imports
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class ServiceProfileModule {
    // @Binds entries preserved from original file

    public companion object {
        @Provides
        @Singleton
        public fun provideServiceProfileApiService(retrofit: Retrofit): ServiceProfileApiService =
            retrofit.create(ServiceProfileApiService::class.java)
    }
}
```

- [ ] **Step 4: Repoint PayoutModule.kt, TechnicianJobsModule.kt, TechnicianAvailabilityModule.kt, EarningsModule.kt, ComplaintModule.kt**

Apply the same pattern to each — read the original, preserve any `@Binds`, replace the ApiService provider with the one-liner `retrofit.create(...)` form, drop any `OkHttpClient.Builder()`, drop any local `Moshi` provider, drop the hardcoded `azurewebsites.net` baseUrl.

After each module, the file should:
- Import `retrofit2.Retrofit`.
- NOT import `okhttp3.OkHttpClient`, `okhttp3.logging.HttpLoggingInterceptor`, `retrofit2.converter.moshi.MoshiConverterFactory`, `com.homeservices.technician.data.rating.di.AuthOkHttpClient`, or `com.homeservices.technician.data.network.defaultMoshi`.
- Have exactly one `@Provides` method per ApiService that takes `retrofit: Retrofit` and returns `retrofit.create(XxxApiService::class.java)`.

- [ ] **Step 5: Run assembleDebug — verify Hilt graph compiles**

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1/technician-app"
./gradlew assembleDebug --quiet 2>&1 | tail -10
```
Expected: `BUILD SUCCESSFUL`. If it fails with `[Dagger/DuplicateBindings]` or `cannot find symbol AuthOkHttpClient`, audit the file in the error message — it likely still imports from `data.rating.di.AuthOkHttpClient` (delete the import) or has a leftover `@AuthOkHttpClient` annotation (delete the provider that uses it).

- [ ] **Step 6: Run unit tests — Tier-3 ApiServices should now be GREEN in AuthInterceptorCoverageTest**

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1/technician-app"
./gradlew testDebugUnitTest --tests "*.AuthInterceptorCoverageTest" --quiet 2>&1 | tail -30
```
Expected: 12 dynamic tests run. 8 PASS (Rating, Shield, ServiceProfile, Payout, TechnicianJobs, TechnicianAvailability, Earnings, Complaint). 4 FAIL (ActiveJob, JobOffer, Photo, Kyc — these still go through the per-feature bare OkHttp clients with `@Header("Authorization")` params getting `"test"` as a literal). This is the intended red state for WS-B.

Also run completeness:
```bash
./gradlew testDebugUnitTest --tests "*.AuthInterceptorCoverageCompletenessTest" --quiet 2>&1 | tail -10
```
Expected: 1 test PASS (all 13 `*ApiService` files are categorized — 12 auth-bearing + IntegrityApiService).

- [ ] **Step 7: Commit WS-A**

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1"
git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/network/di/NetworkModule.kt \
        technician-app/app/src/test/kotlin/com/homeservices/technician/data/network/ \
        technician-app/app/src/main/kotlin/com/homeservices/technician/data/rating/di/RatingModule.kt \
        technician-app/app/src/main/kotlin/com/homeservices/technician/data/shield/di/ShieldModule.kt \
        technician-app/app/src/main/kotlin/com/homeservices/technician/data/serviceprofile/di/ServiceProfileModule.kt \
        technician-app/app/src/main/kotlin/com/homeservices/technician/data/payout/di/PayoutModule.kt \
        technician-app/app/src/main/kotlin/com/homeservices/technician/data/jobs/di/TechnicianJobsModule.kt \
        technician-app/app/src/main/kotlin/com/homeservices/technician/data/availability/di/TechnicianAvailabilityModule.kt \
        technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/di/EarningsModule.kt \
        technician-app/app/src/main/kotlin/com/homeservices/technician/data/complaint/di/ComplaintModule.kt

git commit -m "$(cat <<'EOF'
feat(W1): introduce NetworkModule + move AuthOkHttpClient qualifier

Adds technician-app/data/network/di/NetworkModule.kt as the single source
of truth for OkHttp + Retrofit + Moshi construction. Hosts the
@AuthOkHttpClient qualifier (moved from RatingModule) and a new
@UnauthOkHttpClient qualifier for Play Integrity / future App Check
flows. HttpLoggingInterceptor level is BODY in debug, NONE in release
(closes a BODY-in-release PII log leak).

Adds three tests:
- AuthInterceptorCoverageTest: dynamic tests over every auth-bearing
  ApiService, asserting Authorization: Bearer is on the wire.
- AuthInterceptorCoverageCompletenessTest: file-scan that fails if a
  new *ApiService.kt appears without being categorized.
- FirebaseTokenAuthenticator401RetryTest: 401 → refresh → retry contract.
- NetworkModuleHiltTest: manual-construction wiring assertions.

Tier-3 modules (Rating, Shield, ServiceProfile, Payout, TechnicianJobs,
TechnicianAvailability, Earnings, Complaint) now consume Retrofit from
NetworkModule. Tier-1 modules (JobOffer/Photo/Kyc/ActiveJob) are
intentionally left in their broken state — AuthInterceptorCoverageTest
is RED for their 4 ApiServices. WS-B turns them green.

Refs design spec docs/specs/2026-05-12-w1-network-foundation.md.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

Expected: clean commit. Verify with `git log -1 --stat`.

---

# WS-B — Per-feature migration (4 PARALLEL SUBAGENTS, model: sonnet)

Dispatch all 4 streams as parallel subagents using `superpowers:dispatching-parallel-agents`. Each subagent receives its own task spec (below) plus the worktree path. **No streams share files — they can run truly in parallel.**

After all 4 subagents complete + commit on the same branch, the parent session pulls and runs `BMerge` to verify the consolidated state.

## WS-B subagent task specs

### WS-B1: JobOffer

**Subagent prompt scaffolding:**
> Worktree: `C:\Alok\Business Projects\Urbanclap-dup-w1`
> Branch: `feat/w1-network-foundation` (already checked out)
> Model: sonnet
> Task: Migrate JobOffer to NetworkModule. Below is the complete task spec.

**Files to modify (only these):**
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/jobOffer/di/JobOfferModule.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/jobOffer/JobOfferApiService.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/jobOffer/AcceptJobOfferUseCase.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/jobOffer/DeclineJobOfferUseCase.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/jobOffer/FcmTokenSyncUseCase.kt`

#### Subtask B1.1: Rewrite JobOfferModule.kt

Replace file content with:

```kotlin
package com.homeservices.technician.data.jobOffer.di

import com.homeservices.technician.data.jobOffer.JobOfferApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public object JobOfferModule {
    @Provides
    @Singleton
    internal fun provideJobOfferApiService(retrofit: Retrofit): JobOfferApiService =
        retrofit.create(JobOfferApiService::class.java)
}
```

#### Subtask B1.2: Strip `@Header("Authorization")` from JobOfferApiService.kt

Replace file content with:

```kotlin
package com.homeservices.technician.data.jobOffer

import com.squareup.moshi.JsonClass
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.PATCH
import retrofit2.http.Path

internal interface JobOfferApiService {
    @PATCH("v1/technicians/job-offers/{bookingId}/accept")
    suspend fun acceptOffer(
        @Path("bookingId") bookingId: String,
    ): Response<Unit>

    @PATCH("v1/technicians/job-offers/{bookingId}/decline")
    suspend fun declineOffer(
        @Path("bookingId") bookingId: String,
    ): Response<Unit>

    @PATCH("v1/technicians/fcm-token")
    suspend fun syncFcmToken(
        @Body body: FcmTokenRequest,
    ): Response<Unit>
}

@JsonClass(generateAdapter = true)
internal data class FcmTokenRequest(
    val fcmToken: String,
)
```

#### Subtask B1.3: Strip manual token plumbing from AcceptJobOfferUseCase.kt

Replace file content with:

```kotlin
package com.homeservices.technician.domain.jobOffer

import com.homeservices.technician.data.jobOffer.JobOfferApiService
import com.homeservices.technician.domain.jobOffer.model.JobOfferResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class AcceptJobOfferUseCase
    @Inject
    internal constructor(
        private val api: JobOfferApiService,
    ) {
        public suspend operator fun invoke(bookingId: String): JobOfferResult {
            val response = api.acceptOffer(bookingId)
            return when {
                response.isSuccessful -> JobOfferResult.Accepted(bookingId)
                response.code() == 410 -> JobOfferResult.Expired(bookingId)
                else -> throw RuntimeException("Accept offer failed: HTTP ${response.code()}")
            }
        }
    }
```

Note: `FirebaseAuth` ctor param, `kotlinx.coroutines.tasks.await` import, and the manual token-fetch block are deleted. The interceptor handles auth.

#### Subtask B1.4: DeclineJobOfferUseCase.kt — same transformation

Read the file. The shape is identical to AcceptJobOfferUseCase (different endpoint, otherwise same). Delete the `FirebaseAuth` ctor param + token-fetch block; change the API call from `api.declineOffer("Bearer $token", bookingId, ...)` to `api.declineOffer(bookingId, ...)`. Preserve any case-mapping logic (decline reason, etc.) that exists below the token block.

#### Subtask B1.5: FcmTokenSyncUseCase.kt — same transformation, slightly different API call

Read the file. It calls `api.syncFcmToken("Bearer $token", FcmTokenRequest(fcmToken))`. After: `api.syncFcmToken(FcmTokenRequest(fcmToken))`. Delete the `FirebaseAuth` ctor param + token-fetch block.

#### Subtask B1.6: Run tests + commit

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1/technician-app"
./gradlew assembleDebug --quiet 2>&1 | tail -5
./gradlew testDebugUnitTest --tests "*.AuthInterceptorCoverageTest" --quiet 2>&1 | tail -20
./gradlew testDebugUnitTest --tests "com.homeservices.technician.domain.jobOffer.*" --quiet 2>&1 | tail -20
```
Expected: assembleDebug GREEN. AuthInterceptorCoverageTest: `JobOfferApiService` now PASSES (3 of 4 Tier-1 ApiServices still red — Photo, Kyc, ActiveJob). JobOffer use-case tests still pass (they didn't depend on the `Bearer $token` arg directly — verify the test fixtures don't pass the header explicitly; if they do, fix the test).

If any existing JobOffer use-case test breaks (e.g., test mocks `api.acceptOffer("Bearer X", ...)`), update the mock signature to drop the bearer arg.

Commit:
```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/jobOffer/ \
        technician-app/app/src/main/kotlin/com/homeservices/technician/domain/jobOffer/
git commit -m "$(cat <<'EOF'
feat(W1-B1): migrate JobOffer to NetworkModule interceptor

- JobOfferModule consumes injected Retrofit (drops bare OkHttp client).
- JobOfferApiService methods drop @Header("Authorization") params.
- AcceptJobOfferUseCase / DeclineJobOfferUseCase / FcmTokenSyncUseCase
  drop FirebaseAuth ctor param + manual getIdToken() plumbing.

Auth is now handled by the @AuthOkHttpClient interceptor +
FirebaseTokenAuthenticator (auto-retry on 401).

AuthInterceptorCoverageTest goes green for JobOfferApiService.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### WS-B2: Photo + Kyc

**Subagent prompt scaffolding:**
> Worktree: `C:\Alok\Business Projects\Urbanclap-dup-w1`
> Branch: `feat/w1-network-foundation`
> Model: sonnet
> Task: Migrate Photo and Kyc to NetworkModule.

**Files to modify:**
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/photo/di/PhotoModule.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/photo/PhotoApiService.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/photo/JobPhotoRepositoryImpl.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/kyc/di/KycModule.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/kyc/DigiLockerConsentUseCase.kt`

#### Subtask B2.1: Rewrite PhotoModule.kt

```kotlin
package com.homeservices.technician.data.photo.di

import com.homeservices.technician.data.photo.PhotoApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public object PhotoModule {
    @Provides
    @Singleton
    internal fun providePhotoApiService(retrofit: Retrofit): PhotoApiService =
        retrofit.create(PhotoApiService::class.java)
}
```

#### Subtask B2.2: Strip header from PhotoApiService.kt

```kotlin
package com.homeservices.technician.data.photo

import com.squareup.moshi.JsonClass
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Path

internal interface PhotoApiService {
    @POST("v1/technicians/active-job/{bookingId}/photos")
    suspend fun recordPhoto(
        @Path("bookingId") bookingId: String,
        @Body body: RecordPhotoBody,
    ): Response<Unit>
}

@JsonClass(generateAdapter = true)
internal data class RecordPhotoBody(
    val stage: String,
    val storagePath: String,
)
```

#### Subtask B2.3: Strip getIdToken from JobPhotoRepositoryImpl.kt

Read the file. The relevant block (around line 50) reads roughly:
```kotlin
val token = firebaseAuth.currentUser?.getIdToken(false)?.await()?.token
    ?: throw IllegalStateException("...")
api.recordPhoto("Bearer $token", bookingId, RecordPhotoBody(...))
```

Replace with:
```kotlin
api.recordPhoto(bookingId, RecordPhotoBody(...))
```

Delete the `firebaseAuth: FirebaseAuth` ctor param if it is no longer used elsewhere in the class. If it IS used elsewhere (e.g. for `firebaseAuth.currentUser?.uid` to derive a path key), keep the ctor param; only the `getIdToken` block + the `await()` import need to go.

#### Subtask B2.4: Rewrite KycModule.kt

```kotlin
package com.homeservices.technician.data.kyc.di

import com.google.firebase.storage.FirebaseStorage
import com.homeservices.technician.data.kyc.FirebaseStorageUploaderImpl
import com.homeservices.technician.data.kyc.KycApiService
import com.homeservices.technician.data.kyc.KycRepository
import com.homeservices.technician.data.kyc.KycRepositoryImpl
import com.homeservices.technician.domain.kyc.FirebaseStorageUploader
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class KycModule {
    @Binds
    @Singleton
    public abstract fun bindKycRepository(impl: KycRepositoryImpl): KycRepository

    @Binds
    @Singleton
    public abstract fun bindFirebaseStorageUploader(impl: FirebaseStorageUploaderImpl): FirebaseStorageUploader

    public companion object {
        @Provides
        @Singleton
        internal fun provideKycApiService(retrofit: Retrofit): KycApiService =
            retrofit.create(KycApiService::class.java)

        @Provides
        @Singleton
        public fun provideFirebaseStorage(): FirebaseStorage = FirebaseStorage.getInstance()
    }
}
```

#### Subtask B2.5: KycApiService.kt — strip header if present

Read the file. If any method declares `@Header("Authorization") authHeader: String`, remove it. The grep at audit time showed `KycApiService` did NOT have an `@Header("Authorization")` param (it was not in the initial grep hit list), but verify in the worktree. If no headers are present, no change needed in this file.

#### Subtask B2.6: Strip getIdToken from DigiLockerConsentUseCase.kt

Read the file. The relevant block (around line 31) reads:
```kotlin
val token = firebaseAuth.currentUser?.getIdToken(false)?.await()?.token
    ?: throw IllegalStateException("...")
// ... uses token in some API call OR a URL builder
```

Replace any `api.someKycCall("Bearer $token", ...)` with `api.someKycCall(...)` and delete the token-fetch block. If `token` is used to build a URL string (e.g., as a query param for DigiLocker redirect), it is NOT the Firebase ID token — leave any non-`Bearer` token-fetching that exists for a non-auth purpose. Read carefully.

If the only use of `firebaseAuth` was the deleted getIdToken block, remove the ctor param + the `FirebaseAuth` import. Otherwise leave them.

#### Subtask B2.7: Test + commit

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1/technician-app"
./gradlew assembleDebug --quiet 2>&1 | tail -5
./gradlew testDebugUnitTest --tests "*.AuthInterceptorCoverageTest" --quiet 2>&1 | tail -20
./gradlew testDebugUnitTest --tests "com.homeservices.technician.data.photo.*" --tests "com.homeservices.technician.data.kyc.*" --tests "com.homeservices.technician.domain.kyc.*" --quiet 2>&1 | tail -30
```
Expected: assembleDebug GREEN. AuthInterceptorCoverageTest: PhotoApiService + KycApiService PASS. Existing photo/kyc tests still PASS (fix mock signatures if any reference `"Bearer X"` literals).

Commit:
```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/photo/ \
        technician-app/app/src/main/kotlin/com/homeservices/technician/data/kyc/ \
        technician-app/app/src/main/kotlin/com/homeservices/technician/domain/kyc/
git commit -m "$(cat <<'EOF'
feat(W1-B2): migrate Photo + Kyc to NetworkModule interceptor

- PhotoModule + KycModule consume injected Retrofit.
- PhotoApiService drops @Header("Authorization") param.
- JobPhotoRepositoryImpl + DigiLockerConsentUseCase drop manual
  getIdToken() plumbing.

AuthInterceptorCoverageTest green for PhotoApiService + KycApiService.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### WS-B3: ActiveJob

**Subagent prompt scaffolding:**
> Worktree: `C:\Alok\Business Projects\Urbanclap-dup-w1`
> Branch: `feat/w1-network-foundation`
> Model: sonnet
> Task: Migrate ActiveJob to NetworkModule. The X-Integrity-Token header on transitionStatus is NOT touched.

**Files to modify:**
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/activeJob/di/ActiveJobModule.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/activeJob/ActiveJobApiService.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/activeJob/ActiveJobRepositoryImpl.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/activeJob/MarkReachedUseCase.kt`

#### Subtask B3.1: Rewrite ActiveJobModule.kt

```kotlin
package com.homeservices.technician.data.activeJob.di

import android.content.Context
import androidx.room.Room
import com.homeservices.technician.data.activeJob.ActiveJobApiService
import com.homeservices.technician.data.activeJob.ActiveJobRepositoryImpl
import com.homeservices.technician.data.activeJob.db.ActiveJobDao
import com.homeservices.technician.data.activeJob.db.ActiveJobDatabase
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class ActiveJobModule {
    @Binds
    @Singleton
    public abstract fun bindActiveJobRepository(impl: ActiveJobRepositoryImpl): ActiveJobRepository

    public companion object {
        @Provides
        @Singleton
        internal fun provideActiveJobApiService(retrofit: Retrofit): ActiveJobApiService =
            retrofit.create(ActiveJobApiService::class.java)

        @Provides
        @Singleton
        public fun provideActiveJobDatabase(
            @ApplicationContext context: Context,
        ): ActiveJobDatabase =
            Room
                .databaseBuilder(context, ActiveJobDatabase::class.java, "active_job_db")
                .fallbackToDestructiveMigration()
                .build()

        @Provides
        @Singleton
        internal fun provideActiveJobDao(db: ActiveJobDatabase): ActiveJobDao = db.activeJobDao()
    }
}
```

#### Subtask B3.2: Strip Authorization from ActiveJobApiService.kt (KEEP X-Integrity-Token)

Replace file content with:

```kotlin
package com.homeservices.technician.data.activeJob

import com.squareup.moshi.JsonClass
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.Path

internal interface ActiveJobApiService {
    @GET("v1/technicians/active-job/{bookingId}")
    suspend fun getActiveJob(
        @Path("bookingId") bookingId: String,
    ): Response<ActiveJobResponse>

    @PATCH("v1/technicians/active-job/{bookingId}/transition")
    suspend fun transitionStatus(
        @Path("bookingId") bookingId: String,
        @Body body: TransitionRequest,
        @Header("X-Integrity-Token") integrityToken: String? = null,
    ): Response<ActiveJobResponse>
}

@JsonClass(generateAdapter = true)
internal data class ActiveJobResponse(
    val bookingId: String,
    val customerId: String,
    val serviceId: String,
    val serviceName: String,
    val addressText: String,
    val addressLatLng: LatLngDto,
    val status: String,
    val slotDate: String,
    val slotWindow: String,
)

@JsonClass(generateAdapter = true)
internal data class LatLngDto(
    val lat: Double,
    val lng: Double,
)

@JsonClass(generateAdapter = true)
internal data class LocationAttestationDto(
    val isMock: Boolean,
    val gpsAccuracyM: Float,
)

@JsonClass(generateAdapter = true)
internal data class TransitionRequest(
    val targetStatus: String,
    val currentLocation: LatLngDto? = null,
    val attestation: LocationAttestationDto? = null,
)
```

The `@Header("X-Integrity-Token")` on `transitionStatus` is KEPT — it carries a per-call Play Integrity attestation, not the auth token.

#### Subtask B3.3: Strip 3 getIdToken callsites from ActiveJobRepositoryImpl.kt

Read the file. There are 3 sites (around lines 49, 74, 124) where:
```kotlin
val token = firebaseAuth.currentUser?.getIdToken(false)?.await()?.token
    ?: throw ...
val response = api.getActiveJob("Bearer $token", bookingId)
// or:
val response = api.transitionStatus("Bearer $token", bookingId, body, integrityToken)
```

Replace each with the API call minus the bearer arg:
```kotlin
val response = api.getActiveJob(bookingId)
// or:
val response = api.transitionStatus(bookingId, body, integrityToken)
```

Delete the 3 token-fetch blocks and any unused `firebaseAuth` references. If `firebaseAuth` ctor param is now unused, remove it from the `@Inject internal constructor(...)` signature; otherwise keep it.

Also remove the `import kotlinx.coroutines.tasks.await` import if no `.await()` calls remain in the file.

#### Subtask B3.4: Strip getIdToken from MarkReachedUseCase.kt

Read the file. Same pattern: delete the `firebaseAuth.currentUser?.getIdToken(false)?.await()?.token` block, change the api call from `api.transitionStatus("Bearer $token", bookingId, body, integrityToken)` to `api.transitionStatus(bookingId, body, integrityToken)`, drop `firebaseAuth` ctor param if no other use.

#### Subtask B3.5: Test + commit

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1/technician-app"
./gradlew assembleDebug --quiet 2>&1 | tail -5
./gradlew testDebugUnitTest --tests "*.AuthInterceptorCoverageTest" --quiet 2>&1 | tail -20
./gradlew testDebugUnitTest --tests "*.ActiveJobRepositoryImplTest" --tests "*.MarkReachedUseCaseTest" --quiet 2>&1 | tail -30
```
Expected: assembleDebug GREEN. AuthInterceptorCoverageTest: ActiveJobApiService PASSES. ActiveJobRepositoryImplTest + MarkReachedUseCaseTest still pass — fix any mock signature drift (mocks that referenced `"Bearer X"` literal args).

Commit:
```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/activeJob/ \
        technician-app/app/src/main/kotlin/com/homeservices/technician/domain/activeJob/
git commit -m "$(cat <<'EOF'
feat(W1-B3): migrate ActiveJob to NetworkModule interceptor

- ActiveJobModule consumes injected Retrofit (drops bare OkHttp + Room
  database provider intact).
- ActiveJobApiService methods drop @Header("Authorization") — but KEEP
  @Header("X-Integrity-Token") on transitionStatus (Play Integrity
  per-call attestation, not auth).
- ActiveJobRepositoryImpl drops 3 manual getIdToken() callsites.
- MarkReachedUseCase drops its manual getIdToken() block.

AuthInterceptorCoverageTest green for ActiveJobApiService. All 4 Tier-1
ApiServices now pass the coverage gate.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### WS-B4: Tier-3 fanout (NO-OP for auth, consolidation cleanup)

NOTE: WS-A already repointed the 8 Tier-3 modules to consume `Retrofit` from NetworkModule. WS-B4 is left as a placeholder — if any Tier-3 module still has a stale `OkHttpClient.Builder()` or hardcoded `azurewebsites.net` literal after WS-A, this is the cleanup stream. Run the verification first to determine if WS-B4 has any work.

**Subagent prompt scaffolding:**
> Worktree: `C:\Alok\Business Projects\Urbanclap-dup-w1`
> Branch: `feat/w1-network-foundation`
> Model: haiku (mechanical cleanup only)

#### Subtask B4.1: Verify whether WS-A left any tier-3 stragglers

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1"
grep -rn "OkHttpClient.Builder()" technician-app/app/src/main/kotlin/com/homeservices/technician/data/{shield,serviceprofile,payout,jobs,availability,earnings,complaint,rating}/ 2>&1
grep -rn "azurewebsites.net" technician-app/app/src/main/kotlin/com/homeservices/technician/data/{shield,serviceprofile,payout,jobs,availability,earnings,complaint,rating}/ 2>&1
grep -rn "data.rating.di.AuthOkHttpClient" technician-app/app/src/main/kotlin/ 2>&1
```
Expected: NO matches across all three. If WS-A was complete, B4 has no work — skip to B4.3.

#### Subtask B4.2: Clean up any remaining stragglers

For each file with a hit:
- Delete the `OkHttpClient.Builder()` call and any `HttpLoggingInterceptor` import + usage local to that file.
- Delete the hardcoded `azurewebsites.net` baseUrl line.
- Repoint imports: `com.homeservices.technician.data.rating.di.AuthOkHttpClient` → DELETE (the file should not need the qualifier directly; it just receives `Retrofit`).
- Collapse the `@Provides` method to `retrofit.create(XxxApiService::class.java)`.

#### Subtask B4.3: Verify nothing broke + commit (or no-op)

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1/technician-app"
./gradlew assembleDebug --quiet 2>&1 | tail -5
./gradlew testDebugUnitTest --tests "*.AuthInterceptorCoverageTest" --quiet 2>&1 | tail -20
```
Expected: assembleDebug GREEN, coverage test green for all 8 Tier-3 ApiServices.

If B4.2 made any changes, commit:
```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/
git commit -m "$(cat <<'EOF'
chore(W1-B4): clean up tier-3 module straggler references

Removes any leftover OkHttpClient.Builder() / azurewebsites.net /
data.rating.di.AuthOkHttpClient references that the WS-A repoint pass
missed. Pure consolidation; no behavioral change.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
EOF
)"
```

If nothing changed: do not create an empty commit. Report "WS-B4: no stragglers — no commit needed" back to the parent session.

---

### Task BMerge: Pull subagent commits + run consolidated tests

After all 4 subagents report done, the parent session verifies the consolidated state.

- [ ] **Step 1: Precondition — verify ALL 4 WS-B stream commits exist**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1"
git log --oneline origin/main..HEAD --grep='W1-B' --extended-regexp
```
Expected: at least 3 commits (B1, B2, B3) — B4 may be absent if no stragglers existed (legitimate per WS-B4.3). Verify each expected tag appears in the commit-message grep:

```bash
git log --oneline origin/main..HEAD | grep -E 'W1-B1|W1-B2|W1-B3'
```
Expected: 3 matching lines.

If any of B1/B2/B3 is missing, STOP and investigate the corresponding subagent's report — do NOT proceed to step 2 with an incomplete merge. (Re-dispatching the missing subagent is the correct recovery.)

- [ ] **Step 2: Inspect full commit graph**

Run:
```bash
git log --oneline origin/main..HEAD
```
Expected: 4 or 5 commits — WS-A + B1 + B2 + B3 + (optionally) B4.

- [ ] **Step 3: Run AuthInterceptorCoverageTest — must be FULLY green now**

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1/technician-app"
./gradlew testDebugUnitTest --tests "*.AuthInterceptorCoverageTest" --quiet 2>&1 | tail -30
```
Expected: 12 dynamic tests, ALL PASS.

- [ ] **Step 4: Full unit-test sweep**

Run:
```bash
./gradlew testDebugUnitTest --quiet 2>&1 | tail -10
```
Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 5: DoD grep checks**

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1"
grep -rn "azurewebsites.net" technician-app/app/src/main/ 2>&1 | wc -l
grep -rn "@Header(\"Authorization\")" technician-app/app/src/main/kotlin/com/homeservices/technician/ 2>&1 | grep -v "IntegrityApiService" | wc -l
grep -rn ".getIdToken(" technician-app/app/src/main/kotlin/com/homeservices/technician/ 2>&1 | grep -v "data/network/auth/" | wc -l
```
Expected outputs: `0`, `0`, `0`. Any non-zero is a missed migration site — fix before continuing.

---

# WS-C — Integrity + ADR + Kover (THIS SESSION, model: sonnet)

WS-C and WS-D run in parallel as separate streams after WS-B merges. Both are this-session linear tasks.

### Task C1: Refactor IntegrityModule to consume @UnauthOkHttpClient

**Files:**
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/integrity/di/IntegrityModule.kt`

- [ ] **Step 1: Replace file content**

```kotlin
package com.homeservices.technician.domain.integrity.di

import android.content.Context
import com.homeservices.technician.BuildConfig
import com.homeservices.technician.data.integrity.IntegrityApiService
import com.homeservices.technician.data.network.di.UnauthOkHttpClient
import com.homeservices.technician.domain.integrity.IntegrityAttestor
import com.homeservices.technician.domain.integrity.PlayIntegrityAttestor
import com.squareup.moshi.Moshi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public object IntegrityModule {
    @Provides
    @Singleton
    public fun providePlayIntegrityAttestor(
        @ApplicationContext context: Context,
    ): PlayIntegrityAttestor = PlayIntegrityAttestor(context, debugBypass = BuildConfig.DEBUG)

    @Provides
    @Singleton
    public fun provideIntegrityAttestor(impl: PlayIntegrityAttestor): IntegrityAttestor = impl

    @Provides
    @Singleton
    public fun provideIntegrityApiService(
        @UnauthOkHttpClient client: OkHttpClient,
        moshi: Moshi,
    ): IntegrityApiService =
        Retrofit
            .Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/")
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .client(client)
            .build()
            .create(IntegrityApiService::class.java)
}
```

- [ ] **Step 2: Verify**

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1/technician-app"
./gradlew assembleDebug --quiet 2>&1 | tail -5
./gradlew testDebugUnitTest --tests "*.AuthInterceptorCoverageCompletenessTest" --quiet 2>&1 | tail -10
```
Expected: assembleDebug GREEN. CompletenessTest GREEN (still only IntegrityApiService in the unauth exclusion).

---

### Task C2: Update Kover excludes

**Files:**
- Modify: `technician-app/app/build.gradle.kts`

- [ ] **Step 1: Add the exclusion**

Find the `kover.reports.filters.excludes.classes(...)` block (currently around line 300-550) and add this entry near the other `data.*.di.*` exclusions:

```kotlin
                    // Network DI module — @Provides for OkHttp/Retrofit/Moshi construction,
                    // same rationale as other data.*.di.* exclusions (framework wiring).
                    "*.data.network.di.*",
```

- [ ] **Step 2: Verify Kover passes**

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1/technician-app"
./gradlew koverVerify --quiet 2>&1 | tail -10
```
Expected: `BUILD SUCCESSFUL`. If coverage thresholds fail, the new tests in WS-A should counteract the new code — investigate which file dropped below threshold.

---

### Task C3: Write ADR-0021

**Files:**
- Create: `docs/adr/0021-technician-app-network-module-and-auth-qualifier.md`

- [ ] **Step 1: Read the template**

```bash
cat "C:/Alok/Business Projects/Urbanclap-dup-w1/docs/adr/TEMPLATE.md"
```

- [ ] **Step 2: Write the ADR matching the template's format**

```markdown
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
   repository fetching the token manually via `firebaseAuth.currentUser?.getIdToken(false)`
   and prepending `"Bearer "` at the call site. Token refresh on 401 was absent — a
   stale token would cause cascading 401s with no recovery.
2. **11x hardcoded base URL duplication** — every `data/*/di/*Module.kt` re-stated
   `"https://func-homeservices-prod.azurewebsites.net/api/"` inline.
3. **`@AuthOkHttpClient` qualifier semantic mismatch** — the only existing interceptor
   pattern (`RatingModule`) defined the qualifier inside `data/rating/di/`, then 8 other
   modules imported it from there.

A separate finding noted that the `HttpLoggingInterceptor` was set to `Level.BODY` for
both debug and release variants — a PII log leak in release builds.

## Decision

Introduce `data/network/di/NetworkModule.kt` as the single source of truth for all
HTTP / Retrofit / Moshi construction in `technician-app/`. This module:

- Owns the `@AuthOkHttpClient` qualifier (moved from `data/rating/di/RatingModule.kt`).
- Defines a new `@UnauthOkHttpClient` qualifier for the Play Integrity flow and any
  future App Check usage.
- Provides a shared `Retrofit` instance built from `@AuthOkHttpClient` + `Moshi` +
  `BuildConfig.API_BASE_URL`.
- Sets `HttpLoggingInterceptor.Level` to `BODY` in debug and `NONE` in release.

Every per-feature module collapses to a one-line `@Provides` that calls
`retrofit.create(XxxApiService::class.java)`. Every `*ApiService` interface drops the
`@Header("Authorization")` method param — the interceptor injects the header on every
request. `FirebaseTokenAuthenticator` handles auto-retry on 401 with a force-refreshed
token. Every manual `firebaseAuth.currentUser?.getIdToken(false)` callsite is deleted.

`IntegrityModule` is the documented exception: it consumes `@UnauthOkHttpClient` and
builds its own `Retrofit` locally because `IntegrityApiService` carries the Play
Integrity attestation token (not a Firebase ID token) via its existing
`@Header("Authorization")` method param. The Semgrep rule
`no-header-authorization-in-apiservice.yml` allowlists `IntegrityApiService.kt`.

Four Semgrep rules under `technician-app/.semgrep/` prevent regression:

- `no-header-authorization-in-apiservice.yml`
- `no-bare-okhttp-outside-network-module.yml`
- `no-hardcoded-base-url.yml`
- `no-manual-getidtoken-outside-auth-package.yml`

The regression-gate test (`AuthInterceptorCoverageTest`) enumerates every auth-bearing
ApiService and asserts `Authorization: Bearer <token>` is on the wire. A paired
completeness test fails if a new `*ApiService.kt` appears without being categorized.

## Alternatives considered

- **Status quo (per-module Retrofit construction).** Rejected — fails the security goal
  (silent unauth Tier-1 calls) and leaves the URL-duplication and qualifier-location
  smells.
- **Per-buildType base-URL split** (`debug → staging URL`, `release → prod URL`).
  Deferred. No staging Function App exists today (`func-homeservices-staging` is not
  provisioned). Both URLs would be identical; the buildType split is added when staging
  exists.
- **App Check enforcement** (Firebase App Check tokens attached to all unauth requests).
  Deferred to a separate story. The `@UnauthOkHttpClient` qualifier introduced here
  documents the pattern and reserves the seam.
- **Detekt custom rule** for `Retrofit.Builder().baseUrl(<literal>)`. Skipped — Semgrep
  covers the same surface and is simpler to maintain.

## Consequences

**Positive**

- Single migration point for future networking concerns (mTLS, certificate pinning,
  cache, retry policy, OpenTelemetry tracing).
- Auth correctness enforced by Semgrep + the coverage test.
- 11 base-URL literals collapse to one `BuildConfig.API_BASE_URL` reference.
- HttpLoggingInterceptor leak in release builds is closed.

**Negative / managed**

- Tier-3 modules are now coupled to NetworkModule's `Retrofit` shape. If we ever need
  per-feature interceptors (e.g., a tracing interceptor scoped to a single ApiService),
  the abstraction needs a per-feature qualifier extension. Re-evaluate at that time.
- New ApiServices added in future stories MUST be added to
  `AuthInterceptorCoverageTest.AUTH_BEARING_APIS` or `UNAUTH_API_SIMPLE_NAMES`. The
  completeness test enforces this — the cost is one line per ApiService.

## Deferred

- Per-buildType URL split (open when `func-homeservices-staging` exists).
- App Check wiring (separate story).
- Customer-app parity for the HttpLoggingInterceptor leak fix (separate Haiku codemod).

## References

- Design spec: `docs/specs/2026-05-12-w1-network-foundation.md`
- Plan: `plans/W1-network-foundation.md`
- Audit findings (P0-1): `C:\Users\alokt\.claude\plans\adaptive-growing-mochi.md` §1
- Reference implementation (pre-consolidation): `RatingModule.kt` git history
```

- [ ] **Step 3: Verify the file compiles as markdown**

Run:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1"
ls -la docs/adr/0021-*.md
```
Expected: file exists.

---

### Task C4: Commit WS-C

- [ ] **Step 1: Commit**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1"
git add technician-app/app/src/main/kotlin/com/homeservices/technician/domain/integrity/di/IntegrityModule.kt \
        technician-app/app/build.gradle.kts \
        docs/adr/0021-technician-app-network-module-and-auth-qualifier.md
git commit -m "$(cat <<'EOF'
feat(W1-C): IntegrityModule on @UnauthOkHttpClient + Kover + ADR-0021

- IntegrityModule consumes @UnauthOkHttpClient + Moshi from NetworkModule,
  builds its own Retrofit locally (Play Integrity contract preserved).
- Kover excludes the new data.network.di.* package (framework wiring).
- ADR-0021 captures the consolidation decision, alternatives, and
  explicit deferrals.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

# WS-D — Semgrep rules + CI (THIS SESSION, model: haiku)

WS-D runs in parallel with WS-C. Both are this-session linear.

### Task D1: Create Semgrep rule directory

- [ ] **Step 1: Create the directory**

```bash
mkdir -p "C:/Alok/Business Projects/Urbanclap-dup-w1/technician-app/.semgrep"
```

---

### Task D2: Write `no-header-authorization-in-apiservice.yml`

**Files:**
- Create: `technician-app/.semgrep/no-header-authorization-in-apiservice.yml`

- [ ] **Step 1: Write the rule**

```yaml
rules:
  - id: no-header-authorization-in-apiservice
    languages: [kotlin]
    severity: ERROR
    message: |
      ApiService methods must not declare @Header("Authorization") parameters.
      Use the @AuthOkHttpClient interceptor (NetworkModule) instead, which adds
      the Authorization header automatically and refreshes the token on 401.
      Exception: IntegrityApiService.kt is allowlisted because it carries a
      Play Integrity attestation token, not a Firebase ID token (ADR-0021).
    pattern: |
      @Header("Authorization") $X
    paths:
      include:
        - "technician-app/app/src/main/kotlin/**/*ApiService.kt"
      exclude:
        - "technician-app/app/src/main/kotlin/com/homeservices/technician/data/integrity/IntegrityApiService.kt"
```

---

### Task D3: Write `no-bare-okhttp-outside-network-module.yml`

**Files:**
- Create: `technician-app/.semgrep/no-bare-okhttp-outside-network-module.yml`

- [ ] **Step 1: Write the rule**

```yaml
rules:
  - id: no-bare-okhttp-outside-network-module
    languages: [kotlin]
    severity: ERROR
    message: |
      OkHttpClient construction must live in NetworkModule.kt. Per-feature
      modules consume the @AuthOkHttpClient / @UnauthOkHttpClient client by
      injection (ADR-0021).
    pattern: OkHttpClient.Builder()
    paths:
      include:
        - "technician-app/app/src/main/kotlin/**/*.kt"
      exclude:
        - "technician-app/app/src/main/kotlin/com/homeservices/technician/data/network/di/NetworkModule.kt"
        - "technician-app/app/src/test/**"
        - "technician-app/app/src/androidTest/**"
```

---

### Task D4: Write `no-hardcoded-base-url.yml`

**Files:**
- Create: `technician-app/.semgrep/no-hardcoded-base-url.yml`

- [ ] **Step 1: Write the rule**

```yaml
rules:
  - id: no-hardcoded-base-url
    languages: [kotlin, generic]
    severity: ERROR
    message: |
      Base URL string literals are forbidden in main source. Use
      BuildConfig.API_BASE_URL via NetworkModule (ADR-0021).
    pattern-regex: 'https://func-[^"]+\.azurewebsites\.net'
    paths:
      include:
        - "technician-app/app/src/main/**/*.kt"
      exclude:
        - "technician-app/app/src/test/**"
        - "technician-app/app/src/androidTest/**"
        - "technician-app/app/build.gradle.kts"
```

---

### Task D5: Write `no-manual-getidtoken-outside-auth-package.yml`

**Files:**
- Create: `technician-app/.semgrep/no-manual-getidtoken-outside-auth-package.yml`

- [ ] **Step 1: Write the rule**

```yaml
rules:
  - id: no-manual-getidtoken-outside-auth-package
    languages: [kotlin]
    severity: ERROR
    message: |
      Manual firebaseAuth.currentUser?.getIdToken() calls bypass the
      IdTokenCache + FirebaseTokenAuthenticator chain (no auto-refresh on 401,
      no shared cache). Let NetworkModule's @AuthOkHttpClient interceptor
      handle authentication (ADR-0021).
    pattern: $X.getIdToken($Y)
    paths:
      include:
        - "technician-app/app/src/main/kotlin/**/*.kt"
      exclude:
        - "technician-app/app/src/main/kotlin/com/homeservices/technician/data/network/auth/**"
        - "technician-app/app/src/test/**"
        - "technician-app/app/src/androidTest/**"
```

---

### Task D6: Extend technician-ship.yml Semgrep step

**Files:**
- Modify: `.github/workflows/technician-ship.yml`

- [ ] **Step 1: Edit the Semgrep step**

Find the block (currently lines 84-87):

```yaml
      - name: semgrep SAST
        uses: returntocorp/semgrep-action@v1
        with:
          config: p/kotlin p/owasp-top-ten p/secrets
```

Replace with:

```yaml
      - name: semgrep SAST
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/kotlin
            p/owasp-top-ten
            p/secrets
            technician-app/.semgrep/
```

The `technician-app/.semgrep/` path adds all four rule files to the Semgrep scan.

---

### Task D7: Seeded-violation smoke test (manual verification, NOT committed)

- [ ] **Step 1: Verify each rule fires on a known-bad pattern**

Run a local Semgrep scan against the four rules. If `semgrep` CLI is not installed, skip this step and rely on CI for the canary; document the skip in the WS-D commit message.

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1"
# Test #1: confirm the four rules currently produce 0 findings (clean state)
semgrep --config technician-app/.semgrep/ --quiet technician-app/app/src/main/ 2>&1 | tail -10
```
Expected: 0 findings (the migration is complete).

- [ ] **Step 2 (optional, do NOT commit the seed): smoke-test rule fires**

Create a throwaway file `technician-app/app/src/main/kotlin/com/homeservices/technician/data/_smoke/SmokeApiService.kt`:

```kotlin
package com.homeservices.technician.data._smoke

import retrofit2.http.GET
import retrofit2.http.Header

internal interface SmokeApiService {
    @GET("v1/smoke")
    suspend fun smoke(@Header("Authorization") authHeader: String)
}
```

Run:
```bash
semgrep --config technician-app/.semgrep/no-header-authorization-in-apiservice.yml technician-app/app/src/main/kotlin/com/homeservices/technician/data/_smoke/ 2>&1 | tail -10
```
Expected: 1 finding flagging the `@Header("Authorization")` line.

Then DELETE the smoke file:
```bash
rm -rf technician-app/app/src/main/kotlin/com/homeservices/technician/data/_smoke/
```

Repeat for the other 3 rules using the appropriate seed patterns (`OkHttpClient.Builder()` in a non-NetworkModule file; an `azurewebsites.net` literal; a `getIdToken(false)` outside `data/network/auth/`). DELETE each seed after confirming the rule fires.

---

### Task D8: Commit WS-D

- [ ] **Step 1: Commit**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1"
git add technician-app/.semgrep/ .github/workflows/technician-ship.yml
git commit -m "$(cat <<'EOF'
feat(W1-D): Semgrep regression guards + CI wiring

Adds four custom Semgrep rules under technician-app/.semgrep/ that
enforce ADR-0021's network-layer invariants:

- no-header-authorization-in-apiservice: bans @Header("Authorization")
  in *ApiService.kt (allowlist: IntegrityApiService.kt).
- no-bare-okhttp-outside-network-module: bans OkHttpClient.Builder()
  outside NetworkModule.kt.
- no-hardcoded-base-url: bans azurewebsites.net string literals in main
  source.
- no-manual-getidtoken-outside-auth-package: bans .getIdToken() outside
  data/network/auth/.

CI step in technician-ship.yml extended to include the new rules. Local
seeded-violation smoke confirms each rule fires; seeds deleted before
commit (no .smoke files in tree).

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
EOF
)"
```

---

# WS-E — Pre-Codex smoke + review (THIS SESSION, model: opus)

### Task E1: Run pre-Codex smoke gate

- [ ] **Step 1: Run the smoke**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1"
bash tools/pre-codex-smoke.sh technician-app 2>&1 | tail -40
```
Expected: prints `=== Smoke gate PASSED — safe to invoke /codex-review-gate ===`. Non-zero exit = STOP, investigate the failing step before invoking Codex.

---

### Task E2: Push branch

- [ ] **Step 1: Push**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1"
git push -u origin feat/w1-network-foundation 2>&1 | tail -10
```
Expected: pushes 4–5 commits to `origin/feat/w1-network-foundation`. CI fires; do not wait for green here — Codex review happens locally on the branch.

---

### Task E3: Codex review + /security-review (parallel, max 2 Codex rounds)

**Round budget:** Codex CLI is open as of 2026-05-12. Hard cap at 2 Codex rounds — if round 2 still surfaces P0/P1, push and let CI gate it (do not iterate beyond round 2). Per `~/.claude/memory/feedback_cross_model_review.md`. Recent PR #205 used 2 rounds and Codex caught real correctness bugs each round, so 2 is a real budget, not theoretical.

- [ ] **Step 1: Codex review round 1**

In a terminal:
```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1"
codex review --base main
```

- [ ] **Step 2: /security-review (parallel with round 1)**

In Claude Code, in the same session:
```
/security-review
```

Both surface findings into the session. Codex output is the authoritative gate per project CLAUDE.md.

---

### Task E4: Address findings (if any) — at most ONE re-run

If round 1 (Codex or `/security-review`) flagged P0 / P1:

- [ ] Fix in this session (Opus for synthesis if findings are contradictory, Sonnet for routine edits).
- [ ] Re-run `tools/pre-codex-smoke.sh technician-app`.
- [ ] Codex review round 2: `codex review --base main`.

**If round 2 STILL surfaces P0/P1:** stop iterating. Push the branch, let CI gate, and surface to user for direction. Do NOT run Codex round 3.

**If round 2 clean:** proceed to Task E5 (PR open).

Acceptable Codex P2 / P3 findings: address inline if quick (<10 min), defer to a follow-up issue if not.

---

### Task E5: Open PR

- [ ] **Step 1: Open PR**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup-w1"
gh pr create --base main --title "feat(W1): technician-app network foundation + auth-pattern unification" --body "$(cat <<'EOF'
## Summary

Wave 1 of the technician-app remediation program (audit-driven, plan at `C:\Users\alokt\.claude\plans\adaptive-growing-mochi.md`).

- Introduces `data/network/di/NetworkModule.kt` as the single source of truth for OkHttp + Retrofit + Moshi construction.
- Migrates 12 networking DI modules to consume the shared `Retrofit` instance.
- Removes 4 silent-unauth API call paths (audit P0-1, de-scoped from W0-A): JobOffer/Photo/Kyc/ActiveJob now go through the `@AuthOkHttpClient` interceptor + `FirebaseTokenAuthenticator` (auto-retry on 401).
- Eliminates 11 hardcoded `azurewebsites.net` literals and 10 manual `getIdToken()` callsites.
- Adds four Semgrep rules under `technician-app/.semgrep/` to prevent regression.
- Closes a `HttpLoggingInterceptor.Level.BODY`-in-release PII log leak.
- ADR-0021 captures the decision and explicit deferrals (per-buildType URL split, App Check wiring).

## Test plan

- [x] `AuthInterceptorCoverageTest` — 12 dynamic tests, all green (every auth-bearing ApiService emits `Authorization: Bearer ...`).
- [x] `AuthInterceptorCoverageCompletenessTest` — file-scan over `*ApiService.kt` passes (all 13 categorized).
- [x] `FirebaseTokenAuthenticator401RetryTest` — 401 → refresh → retry contract verified.
- [x] `NetworkModuleHiltTest` — manual-construction wiring assertions.
- [x] `bash tools/pre-codex-smoke.sh technician-app` exits 0.
- [x] `codex review --base main` clean.
- [x] `/security-review` clean.

## DoD verification

```
grep -rn "azurewebsites.net" technician-app/app/src/main/        # → 0
grep -rn "@Header(\"Authorization\")" technician-app/app/src/main/kotlin/com/homeservices/technician/ | grep -v IntegrityApiService  # → 0
grep -rn ".getIdToken(" technician-app/app/src/main/kotlin/com/homeservices/technician/ | grep -v "data/network/auth/"  # → 0
```

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL returned. Report URL back to user.

---

## Self-review (filled after plan-writing)

### Spec coverage check

- §1 spec Goal 1 (single source of truth for OkHttp + base URL) → Task A2 (NetworkModule), Task A7 (Tier-3 repointing). ✓
- §1 spec Goal 2 (zero `@Header("Authorization")` outside Integrity) → WS-B1/B2/B3 subtasks + WS-D Semgrep rule. ✓
- §1 spec Goal 3 (zero manual `getIdToken()` outside auth pkg) → WS-B subtasks + WS-D Semgrep rule. ✓
- §1 spec Goal 4 (four Semgrep rules) → Tasks D2-D5. ✓
- §1 spec Goal 5 (ADR-0021) → Task C3. ✓
- §1 spec Goal 6 (HttpLogging leak fix) → Task A2 NetworkModule code. ✓
- §2.4 spec Integrity exception → Task C1. ✓
- §3 spec migration tiers → WS-A (Tier-3) + WS-B1/B2/B3 (Tier-1) + WS-B4 (cleanup). ✓
- §4 spec test strategy (3 tests) → Tasks A3 + A4 (coverage), A5 (retry), A6 (Hilt). ✓
- §5 spec Semgrep rules (4) → Tasks D2-D5. ✓
- §6 spec work streams (A-E) → mapped 1:1. ✓
- §7 spec ADR-0021 → Task C3. ✓
- §8 spec risk register → mitigations baked into tasks (coverage test, Semgrep, smoke gate, Kover excludes). ✓
- §9 spec DoD → BMerge step 4 + PR DoD checklist. ✓

### Placeholder scan

- No "TBD" / "implement later" / "handle edge cases" / "similar to Task N". ✓
- Each code-changing step shows full code or a complete diff target. ✓

### Type consistency

- `@AuthOkHttpClient` / `@UnauthOkHttpClient` qualifier names consistent across NetworkModule, IntegrityModule, tests. ✓
- `AUTH_BEARING_APIS` list in `AuthInterceptorCoverageTest` cross-referenced by `AuthInterceptorCoverageCompletenessTest` via reflection — same name on both sides. ✓
- `provideRetrofit` signature consistent everywhere it's consumed. ✓

### Scope check

Foundation tier, plan is ~870 lines, well under the 1200-line warning threshold. Single PR. No split required.
