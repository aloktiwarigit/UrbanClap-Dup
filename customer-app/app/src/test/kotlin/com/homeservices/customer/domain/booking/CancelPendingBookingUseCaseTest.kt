package com.homeservices.customer.domain.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.BookingRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test

public class CancelPendingBookingUseCaseTest {
    private val bookingRepository: BookingRepository = mockk()
    private val useCase = CancelPendingBookingUseCase(bookingRepository)

    @Test
    public fun `invoke calls repository cancelBooking with correct bookingId`(): Unit = runTest {
        coEvery { bookingRepository.cancelBooking("bk-123") } returns Result.success(Unit)
        val result = useCase("bk-123")
        assertThat(result.isSuccess).isTrue()
        coVerify(exactly = 1) { bookingRepository.cancelBooking("bk-123") }
    }

    @Test
    public fun `invoke propagates repository failure`(): Unit = runTest {
        coEvery { bookingRepository.cancelBooking("bk-err") } returns
            Result.failure(RuntimeException("cancel failed"))
        val result = useCase("bk-err")
        assertThat(result.isFailure).isTrue()
        assertThat(result.exceptionOrNull()?.message).isEqualTo("cancel failed")
    }
}
