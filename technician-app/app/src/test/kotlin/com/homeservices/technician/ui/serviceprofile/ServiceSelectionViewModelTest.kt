package com.homeservices.technician.ui.serviceprofile

import com.homeservices.technician.domain.serviceprofile.GetServiceProfileUseCase
import com.homeservices.technician.domain.serviceprofile.SaveServiceProfileUseCase
import com.homeservices.technician.domain.serviceprofile.model.ServiceLocation
import com.homeservices.technician.domain.serviceprofile.model.ServiceProfile
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class ServiceSelectionViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val getServiceProfile: GetServiceProfileUseCase = mockk()
    private val saveServiceProfile: SaveServiceProfileUseCase = mockk()

    @BeforeEach
    public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
    }

    @AfterEach
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    @Test
    public fun `loads saved profile with curated IDs`(): Unit =
        runTest {
            coEvery { getServiceProfile.invoke() } returns
                Result.success(
                    ServiceProfile(
                        skills = listOf("ac-deep-clean", "plumbing", "ro-installation"),
                        location = ServiceLocation(lat = 26.79221, lng = 82.19982),
                    ),
                )

            val vm = ServiceSelectionViewModel(getServiceProfile, saveServiceProfile)

            assertFalse(vm.uiState.value.isLoading)
            assertEquals(setOf("ac-deep-clean", "ro-installation"), vm.uiState.value.selectedSkillIds)
            assertEquals(26.79221, vm.uiState.value.serviceLat)
            assertEquals(82.19982, vm.uiState.value.serviceLng)
            assertEquals("Saved service area", vm.uiState.value.serviceAreaLabel)
        }

    @Test
    public fun `load failure leaves service area unset`(): Unit =
        runTest {
            coEvery { getServiceProfile.invoke() } returns Result.failure(RuntimeException("network"))

            val vm = ServiceSelectionViewModel(getServiceProfile, saveServiceProfile)

            assertFalse(vm.uiState.value.isLoading)
            assertEquals(null, vm.uiState.value.serviceLat)
            assertEquals(null, vm.uiState.value.serviceLng)
            assertTrue(
                vm.uiState.value.errorMessage!!
                    .contains("Could not load"),
            )
        }

    @Test
    public fun `submit requires at least one selected service`(): Unit =
        runTest {
            coEvery { getServiceProfile.invoke() } returns Result.success(ServiceProfile(emptyList(), null))
            val vm = ServiceSelectionViewModel(getServiceProfile, saveServiceProfile)

            vm.submit()

            assertEquals("Select at least one service.", vm.uiState.value.errorMessage)
        }

    @Test
    public fun `submit saves selected service IDs and captured location`(): Unit =
        runTest {
            coEvery { getServiceProfile.invoke() } returns Result.success(ServiceProfile(emptyList(), null))
            coEvery { saveServiceProfile.invoke(any()) } answers { Result.success(firstArg()) }
            val vm = ServiceSelectionViewModel(getServiceProfile, saveServiceProfile)

            vm.toggleSkill("water-pump-repair")
            vm.toggleSkill("electrical-wiring")
            vm.onServiceAreaCaptured(26.8, 82.2)
            vm.submit()

            coVerify {
                saveServiceProfile.invoke(
                    ServiceProfile(
                        skills = listOf("electrical-wiring", "water-pump-repair"),
                        location = ServiceLocation(lat = 26.8, lng = 82.2),
                    ),
                )
            }
            assertTrue(vm.uiState.value.saved)
        }

    @Test
    public fun `submit requires captured service area`(): Unit =
        runTest {
            coEvery { getServiceProfile.invoke() } returns Result.success(ServiceProfile(emptyList(), null))
            val vm = ServiceSelectionViewModel(getServiceProfile, saveServiceProfile)

            vm.toggleSkill("ac-installation")
            vm.submit()

            assertEquals("Use current location to set your service area.", vm.uiState.value.errorMessage)
        }

    @Test
    public fun `invalid captured location is rejected`(): Unit =
        runTest {
            coEvery { getServiceProfile.invoke() } returns Result.success(ServiceProfile(emptyList(), null))
            val vm = ServiceSelectionViewModel(getServiceProfile, saveServiceProfile)

            vm.onServiceAreaCaptured(120.0, 82.2)

            assertEquals("Location latitude is outside the supported range.", vm.uiState.value.errorMessage)
        }
}
