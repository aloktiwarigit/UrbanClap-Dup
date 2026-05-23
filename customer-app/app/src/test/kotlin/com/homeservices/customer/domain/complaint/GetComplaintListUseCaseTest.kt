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

public class GetComplaintListUseCaseTest {
    private val repo: ComplaintRepository = mockk()
    private val useCase = GetComplaintListUseCase(repo)

    private val dto =
        ComplaintResponseDto(
            id = "c-1",
            status = "NEW",
            acknowledgeDeadlineAt = null,
            slaDeadlineAt = "2026-04-26T00:00:00Z",
            reasonCode = "LATE_ARRIVAL",
            filedBy = "CUSTOMER",
            createdAt = "2026-04-25T00:00:00Z",
        )

    @Test
    public fun `invoke with default page and limit returns complaint list`(): Unit =
        runTest {
            every { repo.getComplaints(page = 1, limit = 20) } returns
                flowOf(Result.success(listOf(dto)))

            val results = useCase().toList()

            assertThat(results.first().isSuccess).isTrue()
            assertThat(results.first().getOrNull()).hasSize(1)
            verify { repo.getComplaints(page = 1, limit = 20) }
        }

    @Test
    public fun `invoke with explicit page returns paginated results`(): Unit =
        runTest {
            every { repo.getComplaints(page = 2, limit = 10) } returns
                flowOf(Result.success(listOf(dto, dto.copy(id = "c-2"))))

            val results = useCase(page = 2, limit = 10).toList()

            assertThat(results.first().getOrNull()).hasSize(2)
        }

    @Test
    public fun `invoke returns empty list when no complaints`(): Unit =
        runTest {
            every { repo.getComplaints(page = 1, limit = 20) } returns
                flowOf(Result.success(emptyList()))

            val results = useCase().toList()

            assertThat(results.first().getOrNull()).isEmpty()
        }

    @Test
    public fun `invoke propagates failure from repo`(): Unit =
        runTest {
            every { repo.getComplaints(any(), any()) } returns
                flowOf(Result.failure(RuntimeException("network error")))

            val results = useCase().toList()

            assertThat(results.first().isFailure).isTrue()
        }
}
