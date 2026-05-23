package com.homeservices.customer.data.wallet

import com.homeservices.customer.data.wallet.remote.WalletApiService
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory

public class WalletRepositoryImplHttpTest {
    private val server = MockWebServer()
    private lateinit var sut: WalletRepositoryImpl

    @Before
    public fun setUp() {
        server.start()
        val moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()
        val api =
            Retrofit
                .Builder()
                .baseUrl(server.url("/"))
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .build()
                .create(WalletApiService::class.java)
        sut = WalletRepositoryImpl(api)
    }

    @After
    public fun tearDown() {
        server.shutdown()
    }

    @Test
    public fun `getBalance happy path 200 returns success with balance`(): Unit =
        runTest {
            server.enqueue(
                MockResponse()
                    .setResponseCode(200)
                    .setBody("""{"balanceInPaise":500000,"lastUpdatedAt":"2026-05-20T10:00:00Z"}"""),
            )
            val result = sut.getBalance().first()
            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrThrow().balanceInPaise).isEqualTo(500000L)
        }

    @Test
    public fun `getBalance returns failure on 401`(): Unit =
        runTest {
            server.enqueue(MockResponse().setResponseCode(401).setBody("""{"error":"Unauthorized"}"""))
            val result = sut.getBalance().first()
            assertThat(result.isFailure).isTrue()
        }

    @Test
    public fun `getBalance returns failure on 404`(): Unit =
        runTest {
            server.enqueue(MockResponse().setResponseCode(404).setBody("""{"error":"Not Found"}"""))
            val result = sut.getBalance().first()
            assertThat(result.isFailure).isTrue()
        }

    @Test
    public fun `getBalance returns failure on 500`(): Unit =
        runTest {
            server.enqueue(MockResponse().setResponseCode(500).setBody("""{"error":"Server Error"}"""))
            val result = sut.getBalance().first()
            assertThat(result.isFailure).isTrue()
        }

    @Test
    public fun `getBalance returns failure on malformed JSON`(): Unit =
        runTest {
            server.enqueue(
                MockResponse()
                    .setResponseCode(200)
                    .setBody("""{ not valid json ]"""),
            )
            val result = sut.getBalance().first()
            assertThat(result.isFailure).isTrue()
        }
}
