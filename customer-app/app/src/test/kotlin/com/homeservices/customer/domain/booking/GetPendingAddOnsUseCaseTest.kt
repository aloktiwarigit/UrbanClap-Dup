package com.homeservices.customer.domain.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.BookingRepository
import com.homeservices.customer.domain.booking.model.PendingAddOn
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Test

public class GetPendingAddOnsUseCaseTest {
    private val repo: BookingRepository = mockk()
    private val sut = GetPendingAddOnsUseCase(repo)

    @Test
    public fun `invoke returns add-ons on success`(): Unit = runTest {
        val addOns = listOf(PendingAddOn("Gas refill", 120000, "Low pressure"))
        every { repo.getBooking("bk-1") } returns flowOf(Result.success(addOns))
        assertThat(sut("bk-1").first().getOrThrow()).isEqualTo(addOns)
    }

    @Test
    public fun `invoke propagates failure`(): Unit = runTest {
        every { repo.getBooking(any()) } returns flowOf(Result.failure(RuntimeException("not found")))
        assertThat(sut("bk-1").first().isFailure).isTrue()
    }
}
