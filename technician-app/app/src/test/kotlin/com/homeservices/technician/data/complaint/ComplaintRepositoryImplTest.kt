package com.homeservices.technician.data.complaint

import com.homeservices.technician.data.complaint.remote.ComplaintApiService
import com.homeservices.technician.data.complaint.remote.dto.ComplaintListResponseDto
import com.homeservices.technician.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.technician.data.complaint.remote.dto.CreateComplaintRequestDto
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
            reasonCode = "CUSTOMER_MISCONDUCT",
            filedBy = "TECHNICIAN",
            createdAt = "2026-04-25T00:00:00Z",
        )

    @Test
    public fun `createComplaint returns success`() {
        runTest {
            coEvery { api.createComplaint(any()) } returns mockResponse
            val results = repo.createComplaint("bk-1", "CUSTOMER_MISCONDUCT", "Valid long description here.", null).toList()
            assertThat(results.first().isSuccess).isTrue()
            assertThat(results.first().getOrNull()?.id).isEqualTo("c-1")
        }
    }

    @Test
    public fun `createComplaint passes all fields to API`() {
        runTest {
            coEvery { api.createComplaint(any()) } returns mockResponse
            repo.createComplaint("bk-1", "LATE_PAYMENT", "Customer refused to pay.", "complaints/bk-1/uid/1.jpg").toList()
            coVerify {
                api.createComplaint(
                    CreateComplaintRequestDto(
                        bookingId = "bk-1",
                        reasonCode = "LATE_PAYMENT",
                        description = "Customer refused to pay.",
                        photoStoragePath = "complaints/bk-1/uid/1.jpg",
                    ),
                )
            }
        }
    }

    @Test
    public fun `createComplaint returns failure on exception`() {
        runTest {
            coEvery { api.createComplaint(any()) } throws RuntimeException("network")
            val results = repo.createComplaint("bk-1", "OTHER", "Some description.", null).toList()
            assertThat(results.first().isFailure).isTrue()
        }
    }

    @Test
    public fun `getComplaintsForBooking returns list`() {
        runTest {
            coEvery { api.getComplaintsForBooking("bk-1") } returns ComplaintListResponseDto(listOf(mockResponse))
            val results = repo.getComplaintsForBooking("bk-1").toList()
            assertThat(results.first().getOrNull()).hasSize(1)
        }
    }
}
