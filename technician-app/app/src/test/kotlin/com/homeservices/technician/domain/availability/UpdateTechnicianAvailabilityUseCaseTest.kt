package com.homeservices.technician.domain.availability

import com.homeservices.technician.domain.availability.model.TechnicianAvailability
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class UpdateTechnicianAvailabilityUseCaseTest {
    private val repository: TechnicianAvailabilityRepository = mockk()
    private val useCase = UpdateTechnicianAvailabilityUseCase(repository)

    @Test
    public fun `passes availability to repository and returns result`(): Unit =
        runTest {
            val availability = TechnicianAvailability(isOnline = false, isAvailable = false, availabilityWindows = emptyList())
            coEvery { repository.updateAvailability(availability) } returns Result.success(availability)

            val result = useCase(availability)

            assertThat(result.getOrThrow()).isEqualTo(availability)
            coVerify(exactly = 1) { repository.updateAvailability(availability) }
        }

    @Test
    public fun `propagates repository failure`(): Unit =
        runTest {
            val availability = TechnicianAvailability(isOnline = true, isAvailable = true, availabilityWindows = emptyList())
            coEvery { repository.updateAvailability(any()) } returns Result.failure(RuntimeException("server error"))

            val result = useCase(availability)

            assertThat(result.isFailure).isTrue()
        }
}
