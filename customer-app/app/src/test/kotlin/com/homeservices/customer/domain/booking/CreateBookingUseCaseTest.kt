package com.homeservices.customer.domain.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.BookingRepository
import com.homeservices.customer.domain.booking.model.BookingRequest
import com.homeservices.customer.domain.booking.model.BookingResult
import com.homeservices.customer.domain.booking.model.BookingSlot
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Test

public class CreateBookingUseCaseTest {
    private val repo: BookingRepository = mockk()
    private val sut = CreateBookingUseCase(repo)

    private val request =
        BookingRequest(
            serviceId = "svc-1",
            categoryId = "cat-1",
            slot = BookingSlot(date = "2026-05-01", window = "10:00-12:00"),
            addressText = "123 Main St",
            addressLat = 12.97,
            addressLng = 77.59,
        )

    @Test
    public fun `invoke returns BookingResult on success`(): Unit =
        runTest {
            val expected = BookingResult(bookingId = "bk-1", razorpayOrderId = "order_1", amount = 59900)
            every { repo.createBooking(request) } returns flowOf(Result.success(expected))
            assertThat(sut(request).first().getOrThrow()).isEqualTo(expected)
            verify(exactly = 1) { repo.createBooking(request) }
        }

    @Test
    public fun `invoke propagates repository failure`(): Unit =
        runTest {
            every { repo.createBooking(request) } returns flowOf(Result.failure(RuntimeException("network error")))
            assertThat(sut(request).first().isFailure).isTrue()
        }
}
