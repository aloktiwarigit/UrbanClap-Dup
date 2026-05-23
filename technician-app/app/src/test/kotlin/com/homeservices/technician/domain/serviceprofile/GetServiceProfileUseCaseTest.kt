package com.homeservices.technician.domain.serviceprofile

import com.homeservices.technician.domain.serviceprofile.model.ServiceProfile
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class GetServiceProfileUseCaseTest {
    private val repository: ServiceProfileRepository = mockk()
    private val useCase = GetServiceProfileUseCase(repository)

    @Test
    public fun `delegates to repository and returns profile`(): Unit =
        runTest {
            val profile = ServiceProfile(skills = listOf("Plumbing"), location = null)
            coEvery { repository.getServiceProfile() } returns Result.success(profile)

            val result = useCase()

            assertThat(result.getOrThrow()).isEqualTo(profile)
        }

    @Test
    public fun `propagates repository failure`(): Unit =
        runTest {
            coEvery { repository.getServiceProfile() } returns Result.failure(RuntimeException("server error"))

            val result = useCase()

            assertThat(result.isFailure).isTrue()
        }
}
