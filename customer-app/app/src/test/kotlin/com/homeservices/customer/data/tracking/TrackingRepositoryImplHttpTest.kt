package com.homeservices.customer.data.tracking

import com.homeservices.customer.data.booking.remote.BookingApiService
import com.homeservices.customer.domain.tracking.model.BookingStatus
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

public class TrackingRepositoryImplHttpTest {
    private val server = MockWebServer()
    private lateinit var sut: TrackingRepositoryImpl

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
                .create(BookingApiService::class.java)
        sut = TrackingRepositoryImpl(TrackingEventBus(), api)
    }

    @After
    public fun tearDown() {
        server.shutdown()
    }

    @Test
    public fun `trackBooking initial status is ASSIGNED from 200 response`(): Unit =
        runTest {
            server.enqueue(
                MockResponse()
                    .setResponseCode(200)
                    .setBody(
                        """{"bookingId":"bk-1","status":"ASSIGNED","amount":59900,"finalAmount":null,"pendingAddOns":[]}""",
                    ),
            )
            val result = sut.trackBooking("bk-1").first()
            assertThat(result.status).isEqualTo(BookingStatus.Assigned)
        }

    @Test
    public fun `trackBooking falls back to Unknown on 401`(): Unit =
        runTest {
            server.enqueue(MockResponse().setResponseCode(401).setBody("""{"error":"Unauthorized"}"""))
            val result = sut.trackBooking("bk-1").first()
            assertThat(result.status).isEqualTo(BookingStatus.Unknown)
        }

    @Test
    public fun `trackBooking falls back to Unknown on 500`(): Unit =
        runTest {
            server.enqueue(MockResponse().setResponseCode(500).setBody("""{"error":"Server Error"}"""))
            val result = sut.trackBooking("bk-1").first()
            assertThat(result.status).isEqualTo(BookingStatus.Unknown)
        }

    @Test
    public fun `trackBooking falls back to Unknown on malformed JSON`(): Unit =
        runTest {
            server.enqueue(
                MockResponse()
                    .setResponseCode(200)
                    .setBody("""{ not valid json ]"""),
            )
            val result = sut.trackBooking("bk-1").first()
            assertThat(result.status).isEqualTo(BookingStatus.Unknown)
        }
}
