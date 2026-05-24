package com.homeservices.technician.data.activeJob

import com.homeservices.technician.data.activeJob.dto.PostLocationRequest
import com.homeservices.technician.data.network.defaultMoshi
import com.squareup.moshi.JsonAdapter
import kotlinx.coroutines.test.runTest
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit

/**
 * MockWebServer-based contract test for [ActiveJobApiService.postActiveJobLocation].
 *
 * Verifies:
 *  1. The request is sent to the correct URL path with POST method.
 *  2. The JSON body contains all required fields with correct types.
 *  3. A 204 No-Content response is parsed as [retrofit2.Response.isSuccessful] == true.
 *
 * Uses the same OkHttpClient + Retrofit stack as production (defaultMoshi + MoshiConverterFactory).
 */
public class ActiveJobApiServicePostLocationTest {
    private lateinit var mockServer: MockWebServer
    private lateinit var apiService: ActiveJobApiService

    @BeforeEach
    public fun setUp() {
        mockServer = MockWebServer()
        mockServer.start()

        apiService =
            Retrofit
                .Builder()
                .baseUrl(mockServer.url("/"))
                .client(OkHttpClient.Builder().build())
                .addConverterFactory(MoshiConverterFactory.create(defaultMoshi))
                .build()
                .create(ActiveJobApiService::class.java)
    }

    @AfterEach
    public fun tearDown() {
        mockServer.shutdown()
    }

    @Test
    public fun `apiService_postsCorrectShape — request body matches PostLocationRequest schema`() {
        // Arrange: server returns 204 No Content
        mockServer.enqueue(MockResponse().setResponseCode(204))

        val body =
            PostLocationRequest(
                lat = 26.7922,
                lng = 82.1998,
                accuracyMeters = 12.5,
                capturedAt = 1_716_000_000_000L,
                attestation = LocationAttestationDto(isMock = false, gpsAccuracyM = 12.5f),
            )

        // Act: call the suspend function (using runTest for structured concurrency)
        lateinit var response: retrofit2.Response<Unit>
        runTest {
            response = apiService.postActiveJobLocation("bk-test-1", body)
        }

        // Assert response is successful
        assertThat(response.isSuccessful).isTrue()
        assertThat(response.code()).isEqualTo(204)

        // Assert request shape
        val recorded =
            mockServer.takeRequest(REQUEST_TIMEOUT_S, TimeUnit.SECONDS)
                ?: error("No request reached MockWebServer within ${REQUEST_TIMEOUT_S}s")

        assertThat(recorded.method).isEqualTo("POST")
        assertThat(recorded.path).isEqualTo("/v1/technicians/active-job/bk-test-1/location")

        val requestJson = recorded.body.readUtf8()
        assertThat(requestJson).contains("\"lat\"")
        assertThat(requestJson).contains("\"lng\"")
        assertThat(requestJson).contains("\"accuracyMeters\"")
        assertThat(requestJson).contains("\"capturedAt\"")
        assertThat(requestJson).contains("\"attestation\"")
        assertThat(requestJson).contains("\"isMock\"")
        assertThat(requestJson).contains("\"gpsAccuracyM\"")
        assertThat(requestJson).contains("26.7922")
        assertThat(requestJson).contains("82.1998")
        assertThat(requestJson).contains("12.5")
        assertThat(requestJson).contains("1716000000000")
        assertThat(requestJson).contains("false")
    }

    @Test
    public fun `apiService_postsCorrectShape — null attestation is omitted from body`() {
        mockServer.enqueue(MockResponse().setResponseCode(204))

        val body =
            PostLocationRequest(
                lat = 26.7922,
                lng = 82.1998,
                accuracyMeters = 8.0,
                capturedAt = 1_716_000_000_001L,
                attestation = null,
            )

        runTest {
            apiService.postActiveJobLocation("bk-test-2", body)
        }

        val recorded =
            mockServer.takeRequest(REQUEST_TIMEOUT_S, TimeUnit.SECONDS)
                ?: error("No request reached MockWebServer within ${REQUEST_TIMEOUT_S}s")

        val requestJson = recorded.body.readUtf8()
        // Moshi @JsonClass skips nulls by default
        assertThat(requestJson).doesNotContain("\"attestation\"")
        assertThat(requestJson).contains("\"lat\"")
        assertThat(requestJson).contains("\"lng\"")
    }

    @Test
    public fun `PostLocationRequest serializes stable json keys`() {
        val adapter: JsonAdapter<PostLocationRequest> =
            defaultMoshi.adapter(PostLocationRequest::class.java)

        val json =
            adapter.toJson(
                PostLocationRequest(
                    lat = 26.8,
                    lng = 82.2,
                    accuracyMeters = 5.0,
                    capturedAt = 1_000_000L,
                    attestation = LocationAttestationDto(isMock = true, gpsAccuracyM = 5.0f),
                ),
            )

        assertThat(json).contains("\"lat\"")
        assertThat(json).contains("\"lng\"")
        assertThat(json).contains("\"accuracyMeters\"")
        assertThat(json).contains("\"capturedAt\"")
        assertThat(json).contains("\"attestation\"")
        // No obfuscated single-char keys
        assertThat(json).doesNotContain("\"a\"")
        assertThat(json).doesNotContain("\"b\"")
    }

    private companion object {
        const val REQUEST_TIMEOUT_S = 5L
    }
}
