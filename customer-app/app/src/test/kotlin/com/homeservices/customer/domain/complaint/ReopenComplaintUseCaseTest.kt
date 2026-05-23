package com.homeservices.customer.domain.complaint

import com.homeservices.customer.data.complaint.ComplaintRepository
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class ReopenComplaintUseCaseTest {
    private val repo: ComplaintRepository = mockk()
    private val useCase = ReopenComplaintUseCase(repo)

    private val reopenedDto =
        ComplaintResponseDto(
            id = "c-1",
            status = "OPEN",
            acknowledgeDeadlineAt = null,
            slaDeadlineAt = "2026-04-26T00:00:00Z",
            reasonCode = "SERVICE_QUALITY",
            filedBy = "CUSTOMER",
            createdAt = "2026-04-25T00:00:00Z",
        )

    @Test
    public fun `invoke delegates to repo reopenComplaint and returns result`(): Unit =
        runTest {
            every { repo.reopenComplaint("c-1") } returns flowOf(Result.success(reopenedDto))

            val results = useCase("c-1").toList()

            assertThat(results).hasSize(1)
            assertThat(results.first().isSuccess).isTrue()
            assertThat(results.first().getOrNull()?.status).isEqualTo("OPEN")
            verify { repo.reopenComplaint("c-1") }
        }

    @Test
    public fun `invoke propagates failure from repo`(): Unit =
        runTest {
            every { repo.reopenComplaint("c-1") } returns flowOf(Result.failure(RuntimeException("error")))

            val results = useCase("c-1").toList()

            assertThat(results.first().isFailure).isTrue()
        }
}
