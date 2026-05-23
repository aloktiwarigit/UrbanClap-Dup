package com.homeservices.customer.data.device

import kotlinx.coroutines.test.runTest
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory

/**
 * Wire-format test for [DeviceApi.unregisterDevice].
 *
 * SEC-06 fix: the token must travel as an X-Device-Token header on
 * DELETE /v1/devices/me — NOT in the URL path where it leaks to proxy logs.
 *
 * These tests will FAIL against the current `@DELETE("v1/devices/{deviceToken}")`
 * declaration. They will pass once the interface is updated to:
 *   @DELETE("v1/devices/me")
 *   suspend fun unregisterDevice(@Header("X-Device-Token") deviceToken: String)
 */
public class DeviceApiWireTest {
    private lateinit var server: MockWebServer
    private lateinit var api: DeviceApi

    @Before
    public fun setUp() {
        server = MockWebServer()
        server.start()
        api = Retrofit.Builder()
            .baseUrl(server.url("/"))
            .client(OkHttpClient())
            .addConverterFactory(MoshiConverterFactory.create())
            .build()
            .create(DeviceApi::class.java)
    }

    @After
    public fun tearDown() {
        server.shutdown()
    }

    @Test
    public fun `unregisterDevice sends DELETE to slash-v1-slash-devices-slash-me`(): Unit = runTest {
        server.enqueue(MockResponse().setResponseCode(204))
        api.unregisterDevice("test-fcm-token-xyz")
        val request = server.takeRequest()
        assertThat(request.path).isEqualTo("/v1/devices/me")
    }

    @Test
    public fun `unregisterDevice sends token as X-Device-Token header`(): Unit = runTest {
        server.enqueue(MockResponse().setResponseCode(204))
        api.unregisterDevice("test-fcm-token-xyz")
        val request = server.takeRequest()
        assertThat(request.getHeader("X-Device-Token")).isEqualTo("test-fcm-token-xyz")
    }

    @Test
    public fun `unregisterDevice does NOT include token in URL path`(): Unit = runTest {
        server.enqueue(MockResponse().setResponseCode(204))
        api.unregisterDevice("test-fcm-token-xyz")
        val request = server.takeRequest()
        assertThat(request.path).doesNotContain("test-fcm-token-xyz")
    }
}
