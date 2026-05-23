package com.homeservices.technician.domain.serviceprofile

import com.homeservices.technician.domain.serviceprofile.model.ServiceProfile
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class SaveServiceProfileUseCaseTest {
    private val repository: ServiceProfileRepository = mockk()
    private val useCase = SaveServiceProfileUseCase(repository)

    @Test
    public fun `passes profile to repository and returns result`(): Unit =
        runTest {
            val profile = ServiceProfile(skills = listOf("Electrical"), location = null)
            coEvery { repository.saveServiceProfile(profile) } returns Result.success(profile)

            val result = useCase(profile)

            assertThat(result.getOrThrow()).isEqualTo(profile)
            coVerify(exactly = 1) { repository.saveServiceProfile(profile) }
        }

    @Test
    public fun `propagates repository failure`(): Unit =
        runTest {
            val profile = ServiceProfile(skills = emptyList(), location = null)
            coEvery { repository.saveServiceProfile(any()) } returns Result.failure(RuntimeException("network"))

            val result = useCase(profile)

            assertThat(result.isFailure).isTrue()
        }
}
