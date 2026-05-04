package com.homeservices.technician.ui.home

import com.homeservices.technician.domain.availability.GetTechnicianAvailabilityUseCase
import com.homeservices.technician.domain.availability.UpdateTechnicianAvailabilityUseCase
import com.homeservices.technician.domain.availability.model.AvailabilityWindow
import com.homeservices.technician.domain.availability.model.TechnicianAvailability
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
public class AvailabilityViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val getAvailability: GetTechnicianAvailabilityUseCase = mockk()
    private val updateAvailability: UpdateTechnicianAvailabilityUseCase = mockk()

    private val availability =
        TechnicianAvailability(
            isOnline = true,
            isAvailable = true,
            availabilityWindows = listOf(AvailabilityWindow(1, 8, 12)),
        )

    @BeforeEach
    public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
    }

    @AfterEach
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    @Test
    public fun `init loads availability`(): Unit =
        runTest {
            coEvery { getAvailability.invoke() } returns Result.success(availability)

            val vm = AvailabilityViewModel(getAvailability, updateAvailability)

            assertFalse(vm.uiState.value.isLoading)
            assertEquals(availability, vm.uiState.value.availability)
        }

    @Test
    public fun `setAcceptingJobs persists online and available flags together`(): Unit =
        runTest {
            coEvery { getAvailability.invoke() } returns Result.success(availability)
            coEvery { updateAvailability.invoke(any()) } returns Result.success(availability.copy(isOnline = false, isAvailable = false))
            val vm = AvailabilityViewModel(getAvailability, updateAvailability)

            vm.setAcceptingJobs(false)

            coVerify {
                updateAvailability.invoke(
                    availability.copy(isOnline = false, isAvailable = false),
                )
            }
        }

    @Test
    public fun `setWindowEnabled expands preset window to all weekdays`(): Unit =
        runTest {
            coEvery { getAvailability.invoke() } returns Result.success(availability.copy(availabilityWindows = emptyList()))
            coEvery { updateAvailability.invoke(any()) } answers { Result.success(firstArg()) }
            val vm = AvailabilityViewModel(getAvailability, updateAvailability)

            vm.setWindowEnabled(startHour = 17, endHour = 21, enabled = true)

            val windows = vm.uiState.value.availability.availabilityWindows
            assertEquals(7, windows.size)
            assertTrue(windows.all { it.startHour == 17 && it.endHour == 21 })
            assertEquals((0..6).toList(), windows.map { it.dayOfWeek })
        }

    @Test
    public fun `update failure restores previous availability and exposes error`(): Unit =
        runTest {
            coEvery { getAvailability.invoke() } returns Result.success(availability)
            coEvery { updateAvailability.invoke(any()) } returns Result.failure(RuntimeException("network"))
            val vm = AvailabilityViewModel(getAvailability, updateAvailability)

            vm.setAcceptingJobs(false)

            assertEquals(availability, vm.uiState.value.availability)
            assertEquals("Could not save availability", vm.uiState.value.errorMessage)
        }
}
