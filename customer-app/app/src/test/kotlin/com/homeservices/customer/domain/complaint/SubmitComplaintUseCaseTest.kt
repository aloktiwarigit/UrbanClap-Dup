package com.homeservices.customer.domain.complaint

import com.homeservices.customer.data.complaint.ComplaintRepository
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
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
            reasonCode = "SERVICE_QUALITY",
            filedBy = "CUSTOMER",
            createdAt = "2026-04-25T00:00:00Z",
        )

    @Test
    public fun `delegates to repo with reason code and returns success`(): Unit =
        runTest {
            coEvery {
                repo.createComplaint("bk-1", "SERVICE_QUALITY", "A long enough description.", null)
            } returns flowOf(Result.success(mockResponse))

            val results = useCase("bk-1", ComplaintReason.SERVICE_QUALITY, "A long enough description.", null).toList()

            assertThat(results.first().isSuccess).isTrue()
            assertThat(results.first().getOrNull()?.id).isEqualTo("c-1")
        }

    @Test
    public fun `propagates failure from repository`(): Unit =
        runTest {
            coEvery { repo.createComplaint(any(), any(), any(), any()) } returns
                flowOf(Result.failure(RuntimeException("network")))

            val results = useCase("bk-1", ComplaintReason.OTHER, "A long enough description.", null).toList()

            assertThat(results.first().isFailure).isTrue()
        }

    @Test
    public fun `uses reason code string from enum`(): Unit =
        runTest {
            coEvery {
                repo.createComplaint("bk-1", "BILLING_DISPUTE", any(), any())
            } returns flowOf(Result.success(mockResponse))

            val results = useCase("bk-1", ComplaintReason.BILLING_DISPUTE, "Some long description here.", null).toList()
            assertThat(results.first().isSuccess).isTrue()
        }
}
