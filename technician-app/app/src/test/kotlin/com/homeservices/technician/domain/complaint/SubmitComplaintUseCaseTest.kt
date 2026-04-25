package com.homeservices.technician.domain.complaint

import com.homeservices.technician.data.complaint.ComplaintRepository
import com.homeservices.technician.data.complaint.remote.dto.ComplaintResponseDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class SubmitComplaintUseCaseTest {
    private val repo: ComplaintRepository = mockk()
    private val useCase = SubmitComplaintUseCase(repo)

    private val mockResponse =
        ComplaintResponseDto(
            id = "c-1",
            status = "NEW",
            acknowledgeDeadlineAt = "2026-04-25T02:00:00Z",
            slaDeadlineAt = "2026-04-26T00:00:00Z",
            reasonCode = "LATE_PAYMENT",
            filedBy = "TECHNICIAN",
            createdAt = "2026-04-25T00:00:00Z",
        )

    @Test
    public fun `delegates to repo with reason code`(): Unit =
        runTest {
            coEvery {
                repo.createComplaint("bk-1", "LATE_PAYMENT", "Customer refused to pay after the work.", null)
            } returns flowOf(Result.success(mockResponse))

            val results = useCase("bk-1", TechComplaintReason.LATE_PAYMENT, "Customer refused to pay after the work.", null).toList()

            assertThat(results.first().isSuccess).isTrue()
            assertThat(results.first().getOrNull()?.id).isEqualTo("c-1")
        }

    @Test
    public fun `propagates failure`(): Unit =
        runTest {
            coEvery { repo.createComplaint(any(), any(), any(), any()) } returns
                flowOf(Result.failure(RuntimeException("network")))

            val results = useCase("bk-1", TechComplaintReason.OTHER, "A long enough description here.", null).toList()

            assertThat(results.first().isFailure).isTrue()
        }
}
