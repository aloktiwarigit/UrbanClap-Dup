package com.homeservices.customer.domain.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.SlotAvailabilityRepository
import com.homeservices.customer.domain.booking.model.SlotWindow
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Test
import java.time.LocalDate

public class GetSlotAvailabilityUseCaseTest {
    private val repository: SlotAvailabilityRepository = mockk()
    private val sut = GetSlotAvailabilityUseCase(repository)

    @Test
    public fun `invoke delegates to repository and returns result unchanged`(): Unit =
        runTest {
            val slots =
                listOf(
                    SlotWindow(window = "10:00-12:00", available = true),
                    SlotWindow(window = "14:00-16:00", available = false),
                )
            every { repository.getAvailability("svc-1", LocalDate.of(2026, 5, 20)) } returns
                flowOf(Result.success(slots))

            val result = sut("svc-1", LocalDate.of(2026, 5, 20)).first()

            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrThrow()).isEqualTo(slots)
        }

    @Test
    public fun `invoke propagates repository failure`(): Unit =
        runTest {
            val error = RuntimeException("boom")
            every { repository.getAvailability(any(), any()) } returns flowOf(Result.failure(error))

            val result = sut("svc-1", LocalDate.of(2026, 5, 20)).first()

            assertThat(result.isFailure).isTrue()
            assertThat(result.exceptionOrNull()).isSameInstanceAs(error)
        }
}
