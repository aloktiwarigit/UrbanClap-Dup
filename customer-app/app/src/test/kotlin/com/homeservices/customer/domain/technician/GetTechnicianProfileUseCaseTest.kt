package com.homeservices.customer.domain.technician

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.domain.technician.model.TechnicianProfile
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Test

public class GetTechnicianProfileUseCaseTest {
    private val repo: TechnicianProfileRepository = mockk()
    private val sut = GetTechnicianProfileUseCase(repo)

    @Test
    public fun `invoke delegates to repository and returns profile`(): Unit =
        runTest {
            val profile = sampleProfile()
            every { repo.getProfile("tech-1") } returns flowOf(Result.success(profile))
            val result = sut("tech-1").first()
            assertThat(result.getOrThrow()).isEqualTo(profile)
            verify(exactly = 1) { repo.getProfile("tech-1") }
        }

    @Test
    public fun `invoke propagates repository failure`(): Unit =
        runTest {
            val error = RuntimeException("network")
            every { repo.getProfile("tech-1") } returns flowOf(Result.failure(error))
            val result = sut("tech-1").first()
            assertThat(result.isFailure).isTrue()
            assertThat(result.exceptionOrNull()).isEqualTo(error)
        }

    private fun sampleProfile() =
        TechnicianProfile(
            id = "tech-1",
            displayName = "Ramesh Kumar",
            photoUrl = null,
            verifiedAadhaar = true,
            verifiedPoliceCheck = true,
            trainingInstitution = "HomeSkills Academy",
            certifications = listOf("Plumbing L2"),
            languages = listOf("Hindi", "English"),
            yearsInService = 5,
            totalJobsCompleted = 312,
            lastReviews = emptyList(),
        )
}
