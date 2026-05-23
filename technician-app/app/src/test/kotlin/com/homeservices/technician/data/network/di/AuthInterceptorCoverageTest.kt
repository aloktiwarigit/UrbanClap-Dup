package com.homeservices.technician.data.network.di

import com.homeservices.technician.data.activeJob.ActiveJobApiService
import com.homeservices.technician.data.availability.remote.TechnicianAvailabilityApiService
import com.homeservices.technician.data.complaint.remote.ComplaintApiService
import com.homeservices.technician.data.earnings.remote.EarningsApiService
import com.homeservices.technician.data.erasure.remote.ErasureApiService
import com.homeservices.technician.data.integrity.IntegrityApiService
import com.homeservices.technician.data.jobOffer.JobOfferApiService
import com.homeservices.technician.data.jobs.remote.TechnicianJobsApiService
import com.homeservices.technician.data.kyc.KycApiService
import com.homeservices.technician.data.payout.remote.PayoutApiService
import com.homeservices.technician.data.photo.PhotoApiService
import com.homeservices.technician.data.rating.remote.RatingApiService
import com.homeservices.technician.data.serviceprofile.remote.ServiceProfileApiService
import com.homeservices.technician.data.shield.remote.ShieldApiService
import io.mockk.every
import io.mockk.mockk
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DynamicTest
import org.junit.jupiter.api.TestFactory
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.HEAD
import retrofit2.http.OPTIONS
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.PUT
import java.util.concurrent.TimeUnit
import kotlin.reflect.KClass

/**
 * The regression-gate scaffold for W1. Two layers:
 *
 *   1. A smoke test that exercises the same interceptor wiring used by
 *      [NetworkModule.provideAuthOkHttpClient] and asserts an outgoing request gets
 *      `Authorization: Bearer <token>` on the wire. Verifies the interceptor pattern
 *      itself, not any individual ApiService.
 *
 *   2. A dynamic-test factory over [AUTH_BEARING_APIS] that asserts each listed
 *      ApiService class declares no `@Header("Authorization")` method parameters
 *      (those would bypass the interceptor) and carries at least one HTTP-annotated
 *      method. This is a structural assertion — it does not invoke methods over the
 *      wire (that path has Body-type and Continuation reflection traps), so it
 *      complements the Semgrep rule `no-header-authorization-in-apiservice` rather
 *      than replacing it.
 *
 * Maintenance: when a new auth-bearing ApiService is added, append it to
 * [AUTH_BEARING_APIS]. The paired [AuthInterceptorCoverageCompletenessTest] fails if
 * a new `*ApiService.kt` is added without being categorized.
 */
public class AuthInterceptorCoverageTest {
    private lateinit var mockServer: MockWebServer
    private lateinit var authClient: OkHttpClient

    @BeforeEach
    public fun setUp() {
        mockServer = MockWebServer()
        mockServer.start()
        val idTokenCache: com.homeservices.technician.data.network.auth.IdTokenCache = mockk()
        every { idTokenCache.cachedToken } returns TEST_TOKEN
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
                }.build()
    }

    @AfterEach
    public fun tearDown() {
        mockServer.shutdown()
    }

    @org.junit.jupiter.api.Test
    public fun `auth interceptor adds Bearer Authorization header to outgoing requests`() {
        mockServer.enqueue(MockResponse().setResponseCode(200).setBody("ok"))

        authClient
            .newCall(Request.Builder().url(mockServer.url("/v1/whatever")).build())
            .execute()
            .close()

        val recorded =
            mockServer.takeRequest(REQUEST_TIMEOUT_S, TimeUnit.SECONDS)
                ?: error("no request reached MockWebServer within ${REQUEST_TIMEOUT_S}s")
        assertThat(recorded.getHeader("Authorization")).isEqualTo("Bearer $TEST_TOKEN")
    }

    @TestFactory
    public fun `every auth-bearing ApiService has no Authorization header param and at least one HTTP method`(): List<DynamicTest> =
        AUTH_BEARING_APIS.map { apiClass ->
            DynamicTest.dynamicTest(apiClass.simpleName ?: apiClass.java.name) {
                val httpMethods =
                    apiClass.java.declaredMethods.filter { m ->
                        m.annotations.any { it.annotationClass.java in HTTP_VERB_ANNOTATIONS }
                    }
                assertThat(httpMethods)
                    .describedAs("ApiService ${apiClass.simpleName} should declare at least one HTTP-annotated method")
                    .isNotEmpty
                val offendingMethods =
                    httpMethods.filter { method ->
                        method.parameterAnnotations.any { paramAnns ->
                            paramAnns.any { ann ->
                                ann is retrofit2.http.Header && ann.value == "Authorization"
                            }
                        }
                    }
                assertThat(offendingMethods.map { it.name })
                    .describedAs(
                        "ApiService ${apiClass.simpleName} must not declare @Header(\"Authorization\") method params — " +
                            "use the @AuthOkHttpClient interceptor in NetworkModule. " +
                            "Offending methods: ${offendingMethods.map { it.name }}",
                    ).isEmpty()
            }
        }

    private companion object {
        const val TEST_TOKEN = "test-token-xyz"
        const val REQUEST_TIMEOUT_S = 5L

        val HTTP_VERB_ANNOTATIONS: Set<Class<out Annotation>> =
            setOf(
                GET::class.java,
                POST::class.java,
                PATCH::class.java,
                PUT::class.java,
                DELETE::class.java,
                HEAD::class.java,
                OPTIONS::class.java,
            )

        /**
         * Single source of truth for auth-bearing ApiServices in technician-app.
         * Add new ApiService entries here when a new feature lands. The paired
         * AuthInterceptorCoverageCompletenessTest fails if a `*ApiService.kt` file
         * exists in the source tree without being categorized here OR in
         * `AuthInterceptorCoverageCompletenessTest.UNAUTH_API_SIMPLE_NAMES`.
         */
        val AUTH_BEARING_APIS: List<KClass<*>> =
            listOf(
                ActiveJobApiService::class,
                TechnicianAvailabilityApiService::class,
                ComplaintApiService::class,
                EarningsApiService::class,
                ErasureApiService::class,
                IntegrityApiService::class,
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
