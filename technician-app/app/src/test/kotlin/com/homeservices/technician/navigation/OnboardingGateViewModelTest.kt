package com.homeservices.technician.navigation

import com.homeservices.technician.domain.serviceprofile.GetServiceProfileUseCase
import com.homeservices.technician.domain.serviceprofile.model.ServiceLocation
import com.homeservices.technician.domain.serviceprofile.model.ServiceProfile
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class OnboardingGateViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val getServiceProfile: GetServiceProfileUseCase = mockk()

    @BeforeEach
    public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
    }

    @AfterEach
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    @Test
    public fun `complete saved service profile routes directly home`(): Unit =
        runTest {
            coEvery { getServiceProfile.invoke() } returns
                Result.success(
                    ServiceProfile(
                        skills = listOf("ac-deep-clean"),
                        location = ServiceLocation(lat = 26.7922, lng = 82.1998),
                    ),
                )

            val viewModel = OnboardingGateViewModel(getServiceProfile)

            assertThat(viewModel.uiState.value).isEqualTo(OnboardingGateUiState.Complete)
        }

    @Test
    public fun `missing service profile routes to onboarding`(): Unit =
        runTest {
            coEvery { getServiceProfile.invoke() } returns
                Result.success(ServiceProfile(skills = emptyList(), location = null))

            val viewModel = OnboardingGateViewModel(getServiceProfile)

            assertThat(viewModel.uiState.value).isEqualTo(OnboardingGateUiState.NeedsOnboarding)
        }

    @Test
    public fun `profile load failure routes to onboarding`(): Unit =
        runTest {
            coEvery { getServiceProfile.invoke() } returns Result.failure(RuntimeException("network"))

            val viewModel = OnboardingGateViewModel(getServiceProfile)

            assertThat(viewModel.uiState.value).isEqualTo(OnboardingGateUiState.NeedsOnboarding)
        }
}
