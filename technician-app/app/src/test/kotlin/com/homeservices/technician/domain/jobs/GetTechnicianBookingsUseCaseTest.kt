package com.homeservices.technician.domain.jobs

import com.homeservices.technician.domain.jobs.model.TechnicianBooking
import com.homeservices.technician.domain.jobs.model.TechnicianBookingStatus
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class GetTechnicianBookingsUseCaseTest {
    private val repository: TechnicianJobsRepository = mockk()
    private val useCase = GetTechnicianBookingsUseCase(repository)

    private fun aBooking() =
        TechnicianBooking(
            bookingId = "bk-1",
            serviceId = "svc-1",
            serviceName = "Plumbing",
            addressText = "12 Main St",
            status = TechnicianBookingStatus.ASSIGNED,
            slotDate = "2026-06-01",
            slotWindow = "10:00-12:00",
            amountPaise = 60000L,
        )

    @Test
    public fun `delegates to repository and returns bookings`(): Unit =
        runTest {
            coEvery { repository.getMyBookings() } returns Result.success(listOf(aBooking()))

            val result = useCase()

            assertThat(result.getOrThrow()).hasSize(1)
            assertThat(result.getOrThrow().first().bookingId).isEqualTo("bk-1")
        }

    @Test
    public fun `propagates repository failure`(): Unit =
        runTest {
            coEvery { repository.getMyBookings() } returns Result.failure(RuntimeException("offline"))

            val result = useCase()

            assertThat(result.isFailure).isTrue()
        }
}
