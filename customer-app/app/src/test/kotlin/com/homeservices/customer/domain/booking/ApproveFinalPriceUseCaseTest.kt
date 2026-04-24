package com.homeservices.customer.domain.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.BookingRepository
import com.homeservices.customer.domain.booking.model.AddOnDecision
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Test

public class ApproveFinalPriceUseCaseTest {
    private val repo: BookingRepository = mockk()
    private val sut = ApproveFinalPriceUseCase(repo)
    private val decisions = listOf(AddOnDecision("Gas refill", approved = true))

    @Test
    public fun `invoke returns finalAmount on success`(): Unit = runTest {
        every { repo.approveFinalPrice("bk-1", decisions) } returns flowOf(Result.success(179900))
        assertThat(sut("bk-1", decisions).first().getOrThrow()).isEqualTo(179900)
        io.mockk.verify(exactly = 1) { repo.approveFinalPrice("bk-1", decisions) }
    }

    @Test
    public fun `invoke propagates failure`(): Unit = runTest {
        every { repo.approveFinalPrice(any(), any()) } returns flowOf(Result.failure(RuntimeException("conflict")))
        assertThat(sut("bk-1", decisions).first().isFailure).isTrue()
    }
}
