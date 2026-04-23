package com.homeservices.customer.ui.shared

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.domain.technician.GetTechnicianProfileUseCase
import com.homeservices.customer.domain.technician.model.TechnicianProfile
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class TrustDossierViewModelTest {
    private val useCase: GetTechnicianProfileUseCase = mockk()
    private val vm = TrustDossierViewModel(useCase)

    @Test
    public fun `initial state is Unavailable`(): Unit =
        runTest {
            assertThat(vm.uiState.value).isEqualTo(TrustDossierUiState.Unavailable)
        }

    @Test
    public fun `loadProfile emits Loaded on success`(): Unit =
        runTest(UnconfinedTestDispatcher()) {
            val profile = sampleProfile()
            every { useCase("tech-1") } returns flowOf(Result.success(profile))
            vm.loadProfile("tech-1")
            assertThat(vm.uiState.value).isEqualTo(TrustDossierUiState.Loaded(profile))
        }

    @Test
    public fun `loadProfile emits Error on failure`(): Unit =
        runTest(UnconfinedTestDispatcher()) {
            every { useCase("tech-1") } returns flowOf(Result.failure(RuntimeException("fail")))
            vm.loadProfile("tech-1")
            assertThat(vm.uiState.value).isInstanceOf(TrustDossierUiState.Error::class.java)
        }

    private fun sampleProfile() = TechnicianProfile(
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
