package com.homeservices.technician.domain.activeJob

import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.LatLng
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class StartWorkUseCaseTest {
    private val repository: ActiveJobRepository = mockk()
    private val useCase = StartWorkUseCase(repository)

    private fun aJob() =
        ActiveJob(
            bookingId = "bk-1",
            customerId = "c-1",
            serviceId = "svc-1",
            serviceName = "AC Repair",
            addressText = "12 Main St",
            addressLatLng = LatLng(12.9, 77.6),
            status = ActiveJobStatus.IN_PROGRESS,
            slotDate = "2026-05-01",
            slotWindow = "10:00-12:00",
        )

    @Test
    public fun `transitions REACHED to IN_PROGRESS`(): Unit =
        runTest {
            coEvery { repository.transitionStatus("bk-1", ActiveJobStatus.IN_PROGRESS) } returns
                Result.success(aJob())

            val result = useCase("bk-1")

            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrThrow().status).isEqualTo(ActiveJobStatus.IN_PROGRESS)
        }
}
