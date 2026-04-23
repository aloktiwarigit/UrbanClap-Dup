package com.homeservices.technician.domain.activeJob

import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.LatLng
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class CompleteJobUseCaseTest {

    private val repository: ActiveJobRepository = mockk()
    private val useCase = CompleteJobUseCase(repository)

    private fun aJob() = ActiveJob(
        bookingId = "bk-1", customerId = "c-1", serviceId = "svc-1", serviceName = "AC Repair",
        addressText = "12 Main St", addressLatLng = LatLng(12.9, 77.6),
        status = ActiveJobStatus.COMPLETED, slotDate = "2026-05-01", slotWindow = "10:00-12:00",
    )

    @Test
    public fun `calls transitionStatus with COMPLETED — no photo check`(): Unit = runTest {
        coEvery { repository.transitionStatus("bk-1", ActiveJobStatus.COMPLETED) } returns
            Result.success(aJob())

        val result = useCase("bk-1")

        assertThat(result.isSuccess).isTrue()
        coVerify(exactly = 1) { repository.transitionStatus("bk-1", ActiveJobStatus.COMPLETED) }
    }
}
