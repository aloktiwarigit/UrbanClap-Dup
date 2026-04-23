package com.homeservices.customer.data.technician

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.technician.remote.TechnicianProfileApiService
import com.homeservices.customer.data.technician.remote.dto.TechnicianProfileDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Test
import java.io.IOException

public class TechnicianProfileRepositoryImplTest {
    private val api: TechnicianProfileApiService = mockk()
    private val sut = TechnicianProfileRepositoryImpl(api)

    @Test
    public fun `getProfile maps DTO to domain model on success`(): Unit =
        runTest {
            coEvery { api.getProfile("tech-1") } returns sampleDto()
            val result = sut.getProfile("tech-1").first()
            assertThat(result.isSuccess).isTrue()
            val profile = result.getOrThrow()
            assertThat(profile.id).isEqualTo("tech-1")
            assertThat(profile.displayName).isEqualTo("Ramesh Kumar")
            assertThat(profile.verifiedAadhaar).isTrue()
            assertThat(profile.certifications).containsExactly("Plumbing L2")
        }

    @Test
    public fun `getProfile emits failure on network exception`(): Unit =
        runTest {
            coEvery { api.getProfile("tech-1") } throws IOException("timeout")
            val result = sut.getProfile("tech-1").first()
            assertThat(result.isFailure).isTrue()
        }

    private fun sampleDto() = TechnicianProfileDto(
        id = "tech-1",
        displayName = "Ramesh Kumar",
        photoUrl = null,
        verifiedAadhaar = true,
        verifiedPoliceCheck = false,
        trainingInstitution = null,
        certifications = listOf("Plumbing L2"),
        languages = listOf("Hindi"),
        yearsInService = 3,
        totalJobsCompleted = 100,
        lastReviews = emptyList(),
    )
}
