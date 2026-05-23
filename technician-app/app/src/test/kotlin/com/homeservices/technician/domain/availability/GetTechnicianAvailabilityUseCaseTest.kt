package com.homeservices.technician.domain.availability

import com.homeservices.technician.domain.availability.model.TechnicianAvailability
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class GetTechnicianAvailabilityUseCaseTest {
    private val repository: TechnicianAvailabilityRepository = mockk()
    private val useCase = GetTechnicianAvailabilityUseCase(repository)

    @Test
    public fun `delegates to repository and returns success`(): Unit =
        runTest {
            val availability = TechnicianAvailability(isOnline = true, isAvailable = true, availabilityWindows = emptyList())
            coEvery { repository.getAvailability() } returns Result.success(availability)

            val result = useCase()

            assertThat(result.getOrThrow()).isEqualTo(availability)
        }

    @Test
    public fun `propagates repository failure`(): Unit =
        runTest {
            coEvery { repository.getAvailability() } returns Result.failure(RuntimeException("network"))

            val result = useCase()

            assertThat(result.isFailure).isTrue()
        }
}
