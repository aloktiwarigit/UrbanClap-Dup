package com.homeservices.technician.data.jobs

import com.homeservices.technician.data.jobs.remote.TechnicianJobsApiService
import com.homeservices.technician.data.jobs.remote.dto.TechnicianBookingDto
import com.homeservices.technician.data.jobs.remote.dto.TechnicianBookingsResponseDto
import com.homeservices.technician.domain.jobs.model.TechnicianBookingStatus
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class TechnicianJobsRepositoryImplTest {
    private val apiService: TechnicianJobsApiService = mockk()
    private val repository = TechnicianJobsRepositoryImpl(apiService)

    private fun aDto(status: String = "ASSIGNED") =
        TechnicianBookingDto(
            bookingId = "bk-1",
            serviceId = "svc-1",
            serviceName = "AC Repair",
            addressText = "12 Main St",
            status = status,
            slotDate = "2026-06-01",
            slotWindow = "10:00-12:00",
            amount = 50000L,
        )

    @Test
    public fun `getMyBookings maps response to domain list`(): Unit =
        runTest {
            coEvery { apiService.getMyBookings() } returns
                TechnicianBookingsResponseDto(bookings = listOf(aDto()))

            val result = repository.getMyBookings()

            assertThat(result.isSuccess).isTrue()
            val bookings = result.getOrThrow()
            assertThat(bookings).hasSize(1)
            assertThat(bookings[0].bookingId).isEqualTo("bk-1")
            assertThat(bookings[0].status).isEqualTo(TechnicianBookingStatus.ASSIGNED)
        }

    @Test
    public fun `getMyBookings maps unknown status string to UNKNOWN`(): Unit =
        runTest {
            coEvery { apiService.getMyBookings() } returns
                TechnicianBookingsResponseDto(bookings = listOf(aDto(status = "FUTURE_STATUS")))

            val result = repository.getMyBookings()

            assertThat(result.getOrThrow()[0].status).isEqualTo(TechnicianBookingStatus.UNKNOWN)
        }

    @Test
    public fun `getMyBookings returns failure when API throws`(): Unit =
        runTest {
            coEvery { apiService.getMyBookings() } throws RuntimeException("network error")

            val result = repository.getMyBookings()

            assertThat(result.isFailure).isTrue()
        }
}
