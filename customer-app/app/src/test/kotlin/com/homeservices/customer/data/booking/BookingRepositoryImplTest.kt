package com.homeservices.customer.data.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.remote.BookingApiService
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.BookingRequest
import com.homeservices.customer.domain.booking.model.BookingSlot
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.unmockkAll
import io.mockk.verify
import io.sentry.Sentry
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Test

public class BookingRepositoryImplTest {
    private val api: BookingApiService = mockk()
    private val repo = BookingRepositoryImpl(api)

    @After
    public fun tearDown() {
        unmockkAll()
    }

    private val fakeSlot = BookingSlot(date = "2026-06-01", window = "10:00-12:00")

    private val fakeRequest =
        BookingRequest(
            serviceId = "svc-1",
            categoryId = "cat-1",
            slot = fakeSlot,
            addressText = "123 Main St",
            addressLat = 28.7041,
            addressLng = 77.1025,
            paymentMethod = BookingPaymentMethod.RAZORPAY,
        )

    @Test
    public fun `createBooking captures exception in Sentry on API failure`(): Unit =
        runTest {
            mockkStatic("io.sentry.Sentry")
            coEvery { api.createBooking(any(), any()) } throws RuntimeException("network error")
            every { Sentry.captureException(any()) } returns mockk()

            val result = repo.createBooking(fakeRequest, "idem-key").toList()

            assertThat(result.first().isFailure).isTrue()
            verify { Sentry.captureException(any()) }
            unmockkAll()
        }

    @Test
    public fun `getMyBookings captures exception in Sentry on API failure`(): Unit =
        runTest {
            mockkStatic("io.sentry.Sentry")
            coEvery { api.getMyBookings() } throws RuntimeException("network error")
            every { Sentry.captureException(any()) } returns mockk()

            val result = repo.getMyBookings().toList()

            assertThat(result.first().isFailure).isTrue()
            verify { Sentry.captureException(any()) }
            unmockkAll()
        }

    @Test
    public fun `confirmBooking captures exception in Sentry on API failure`(): Unit =
        runTest {
            mockkStatic("io.sentry.Sentry")
            coEvery {
                api.confirmBooking(any(), any(), any())
            } throws RuntimeException("network error")
            every { Sentry.captureException(any()) } returns mockk()

            val result =
                repo
                    .confirmBooking(
                        bookingId = "bk-1",
                        paymentId = "pay-1",
                        orderId = "ord-1",
                        signature = "sig",
                    ).toList()

            assertThat(result.first().isFailure).isTrue()
            verify { Sentry.captureException(any()) }
            unmockkAll()
        }

    @Test
    public fun `getPendingAddOns captures exception in Sentry on API failure`(): Unit =
        runTest {
            mockkStatic("io.sentry.Sentry")
            coEvery { api.getBooking(any()) } throws RuntimeException("network error")
            every { Sentry.captureException(any()) } returns mockk()

            val result = repo.getPendingAddOns("bk-1").toList()

            assertThat(result.first().isFailure).isTrue()
            verify { Sentry.captureException(any()) }
            unmockkAll()
        }

    @Test
    public fun `approveFinalPrice captures exception in Sentry on API failure`(): Unit =
        runTest {
            mockkStatic("io.sentry.Sentry")
            coEvery { api.approveFinalPrice(any(), any()) } throws RuntimeException("network error")
            every { Sentry.captureException(any()) } returns mockk()

            val result = repo.approveFinalPrice("bk-1", emptyList()).toList()

            assertThat(result.first().isFailure).isTrue()
            verify { Sentry.captureException(any()) }
            unmockkAll()
        }
}
