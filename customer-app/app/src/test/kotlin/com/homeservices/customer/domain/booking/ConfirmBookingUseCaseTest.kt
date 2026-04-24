package com.homeservices.customer.domain.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.BookingRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Test

public class ConfirmBookingUseCaseTest {
    private val repo: BookingRepository = mockk()
    private val sut = ConfirmBookingUseCase(repo)

    @Test
    public fun `invoke returns confirmed bookingId on success`(): Unit =
        runTest {
            every { repo.confirmBooking("bk-1", "pay_1", "order_1", "sig_1") } returns flowOf(Result.success("bk-1"))
            assertThat(sut("bk-1", "pay_1", "order_1", "sig_1").first().getOrThrow()).isEqualTo("bk-1")
            verify(exactly = 1) { repo.confirmBooking("bk-1", "pay_1", "order_1", "sig_1") }
        }

    @Test
    public fun `invoke propagates failure`(): Unit =
        runTest {
            every { repo.confirmBooking(any(), any(), any(), any()) } returns flowOf(Result.failure(RuntimeException("confirm failed")))
            assertThat(sut("bk-1", "pay_1", "order_1", "sig_1").first().isFailure).isTrue()
        }
}
