package com.homeservices.technician.data.availability

import com.homeservices.technician.data.availability.remote.TechnicianAvailabilityApiService
import com.homeservices.technician.data.availability.remote.dto.AvailabilityWindowDto
import com.homeservices.technician.data.availability.remote.dto.TechnicianAvailabilityDto
import com.homeservices.technician.data.availability.remote.dto.UpdateAvailabilityRequestDto
import com.homeservices.technician.domain.availability.model.AvailabilityWindow
import com.homeservices.technician.domain.availability.model.TechnicianAvailability
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

public class TechnicianAvailabilityRepositoryImplTest {
    private val apiService: TechnicianAvailabilityApiService = mockk()
    private val repository = TechnicianAvailabilityRepositoryImpl(apiService)

    @Test
    public fun `getAvailability maps response to domain`(): Unit =
        runTest {
            coEvery { apiService.getAvailability() } returns
                TechnicianAvailabilityDto(
                    isOnline = true,
                    isAvailable = true,
                    availabilityWindows = listOf(AvailabilityWindowDto(1, 8, 12)),
                )

            val result = repository.getAvailability()

            assertTrue(result.isSuccess)
            assertEquals(
                TechnicianAvailability(
                    isOnline = true,
                    isAvailable = true,
                    availabilityWindows = listOf(AvailabilityWindow(1, 8, 12)),
                ),
                result.getOrThrow(),
            )
        }

    @Test
    public fun `updateAvailability sends request and maps response`(): Unit =
        runTest {
            val availability =
                TechnicianAvailability(
                    isOnline = false,
                    isAvailable = false,
                    availabilityWindows = emptyList(),
                )
            coEvery { apiService.updateAvailability(any()) } returns
                TechnicianAvailabilityDto(
                    isOnline = false,
                    isAvailable = false,
                    availabilityWindows = emptyList(),
                )

            val result = repository.updateAvailability(availability)

            assertTrue(result.isSuccess)
            coVerify {
                apiService.updateAvailability(
                    UpdateAvailabilityRequestDto(
                        isOnline = false,
                        isAvailable = false,
                        availabilityWindows = emptyList(),
                    ),
                )
            }
        }

    @Test
    public fun `getAvailability returns failure on API exception`(): Unit =
        runTest {
            coEvery { apiService.getAvailability() } throws RuntimeException("network")

            val result = repository.getAvailability()

            assertTrue(result.isFailure)
        }
}
