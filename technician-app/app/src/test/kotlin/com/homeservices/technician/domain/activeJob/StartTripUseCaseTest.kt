package com.homeservices.technician.domain.activeJob

import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.LatLng
import com.homeservices.technician.domain.activeJob.model.NavigationEvent
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class StartTripUseCaseTest {

    private val repository: ActiveJobRepository = mockk()
    private val useCase = StartTripUseCase(repository)

    private fun aJob(status: ActiveJobStatus = ActiveJobStatus.EN_ROUTE) = ActiveJob(
        bookingId = "bk-1", customerId = "c-1", serviceId = "svc-1", serviceName = "AC Repair",
        addressText = "12 Main St", addressLatLng = LatLng(12.9, 77.6),
        status = status, slotDate = "2026-05-01", slotWindow = "10:00-12:00",
    )

    @Test
    public fun `success — returns Result success and emits Maps NavigationEvent`(): Unit = runTest {
        coEvery { repository.transitionStatus("bk-1", ActiveJobStatus.EN_ROUTE) } returns
            Result.success(aJob(ActiveJobStatus.EN_ROUTE))

        val (result, navEvent) = useCase("bk-1")

        assertThat(result.isSuccess).isTrue()
        assertThat(navEvent).isEqualTo(NavigationEvent.Maps("google.navigation:q=12.9,77.6"))
    }

    @Test
    public fun `failure — returns Result failure and navEvent is null`(): Unit = runTest {
        coEvery { repository.transitionStatus("bk-1", ActiveJobStatus.EN_ROUTE) } returns
            Result.failure(RuntimeException("offline"))

        val (result, navEvent) = useCase("bk-1")

        assertThat(result.isFailure).isTrue()
        assertThat(navEvent).isNull()
    }
}
