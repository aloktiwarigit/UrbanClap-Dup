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

public class GetComplaintStatusUseCaseTest {
    private val repo: ComplaintRepository = mockk()
    private val useCase = GetComplaintStatusUseCase(repo)

    @Test
    public fun `delegates to repository and returns list`(): Unit =
        runTest {
            val list =
                listOf(
                    ComplaintResponseDto(
                        "c-1",
                        "INVESTIGATING",
                        null,
                        "2026-04-26T00:00:00Z",
                        "SERVICE_QUALITY",
                        "CUSTOMER",
                        "2026-04-25T00:00:00Z",
                    ),
                )
            coEvery { repo.getComplaintsForBooking("bk-1") } returns flowOf(Result.success(list))

            val results = useCase("bk-1").toList()

            assertThat(results.first().getOrNull()).hasSize(1)
            assertThat(
                results
                    .first()
                    .getOrNull()
                    ?.first()
                    ?.status,
            ).isEqualTo("INVESTIGATING")
        }
}
