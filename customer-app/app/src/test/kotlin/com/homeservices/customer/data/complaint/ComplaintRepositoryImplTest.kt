package com.homeservices.customer.data.complaint

import com.homeservices.customer.data.complaint.remote.ComplaintApiService
import com.homeservices.customer.data.complaint.remote.dto.ComplaintListResponseDto
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.customer.data.complaint.remote.dto.CreateComplaintRequestDto
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class ComplaintRepositoryImplTest {
    private val api: ComplaintApiService = mockk()
    private val repo = ComplaintRepositoryImpl(api)

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
    public fun `createComplaint returns success result with correct response`(): Unit =
        runTest {
            coEvery { api.createComplaint(any()) } returns mockResponse

            val results =
                repo
                    .createComplaint(
                        "bk-1",
                        "SERVICE_QUALITY",
                        "Some long enough description here.",
                        null,
                    ).toList()

            assertThat(results).hasSize(1)
            assertThat(results.first().isSuccess).isTrue()
            assertThat(results.first().getOrNull()?.id).isEqualTo("c-1")
            assertThat(results.first().getOrNull()?.status).isEqualTo("NEW")
        }

    @Test
    public fun `createComplaint passes photoStoragePath in request`(): Unit =
        runTest {
            coEvery { api.createComplaint(any()) } returns mockResponse

            repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description here.", "complaints/bk-1/uid/123.jpg").toList()

            coVerify {
                api.createComplaint(
                    CreateComplaintRequestDto(
                        bookingId = "bk-1",
                        reasonCode = "SERVICE_QUALITY",
                        description = "Some description here.",
                        photoStoragePath = "complaints/bk-1/uid/123.jpg",
                    ),
                )
            }
        }

    @Test
    public fun `createComplaint returns failure when api throws`(): Unit =
        runTest {
            coEvery { api.createComplaint(any()) } throws RuntimeException("network error")

            val results = repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description.", null).toList()

            assertThat(results.first().isFailure).isTrue()
        }

    @Test
    public fun `getComplaintsForBooking returns list of complaints`(): Unit =
        runTest {
            coEvery { api.getComplaintsForBooking("bk-1") } returns
                ComplaintListResponseDto(
                    complaints = listOf(mockResponse),
                )

            val results = repo.getComplaintsForBooking("bk-1").toList()

            assertThat(results.first().isSuccess).isTrue()
            assertThat(results.first().getOrNull()).hasSize(1)
            assertThat(
                results
                    .first()
                    .getOrNull()
                    ?.first()
                    ?.id,
            ).isEqualTo("c-1")
        }

    @Test
    public fun `getComplaintsForBooking returns failure when api throws`(): Unit =
        runTest {
            coEvery { api.getComplaintsForBooking(any()) } throws RuntimeException("network error")

            val results = repo.getComplaintsForBooking("bk-1").toList()

            assertThat(results.first().isFailure).isTrue()
        }
}
