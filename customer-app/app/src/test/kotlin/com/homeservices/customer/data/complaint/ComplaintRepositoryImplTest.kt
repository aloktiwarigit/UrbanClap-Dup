package com.homeservices.customer.data.complaint

import com.homeservices.customer.data.complaint.remote.ComplaintApiService
import com.homeservices.customer.data.complaint.remote.dto.ComplaintListResponseDto
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.customer.data.complaint.remote.dto.CreateComplaintRequestDto
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.slot
import io.mockk.unmockkAll
import io.mockk.verify
import io.sentry.Sentry
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test

public class ComplaintRepositoryImplTest {
    private val api: ComplaintApiService = mockk()
    private val repo = ComplaintRepositoryImpl(api)

    @AfterEach
    public fun tearDown() {
        unmockkAll()
    }

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
            coEvery { api.createComplaint(any(), any()) } returns mockResponse

            val results =
                repo
                    .createComplaint(
                        "bk-1",
                        "SERVICE_QUALITY",
                        "Some long enough description here.",
                        null,
                        "test-key-1",
                    ).toList()

            assertThat(results).hasSize(1)
            assertThat(results.first().isSuccess).isTrue()
            assertThat(results.first().getOrNull()?.id).isEqualTo("c-1")
            assertThat(results.first().getOrNull()?.status).isEqualTo("NEW")
        }

    @Test
    public fun `createComplaint passes photoStoragePath in request`(): Unit =
        runTest {
            coEvery { api.createComplaint(any(), any()) } returns mockResponse

            repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description here.", "complaints/bk-1/uid/123.jpg", "test-key-2").toList()

            coVerify {
                api.createComplaint(
                    CreateComplaintRequestDto(
                        bookingId = "bk-1",
                        reasonCode = "SERVICE_QUALITY",
                        description = "Some description here.",
                        photoStoragePath = "complaints/bk-1/uid/123.jpg",
                    ),
                    any(),
                )
            }
        }

    @Test
    public fun `createComplaint returns failure when api throws`(): Unit =
        runTest {
            coEvery { api.createComplaint(any(), any()) } throws RuntimeException("network error")

            val results = repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description.", null, "test-key-err").toList()

            assertThat(results.first().isFailure).isTrue()
        }

    @Test
    public fun `createComplaint passes idempotency key to api`(): Unit =
        runTest {
            coEvery { api.createComplaint(any(), any()) } returns mockResponse
            val capturedKey = slot<String>()

            repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description.", null, "idem-key-xyz").toList()

            coVerify { api.createComplaint(any(), capture(capturedKey)) }
            assertThat(capturedKey.captured).isEqualTo("idem-key-xyz")
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

    @Test
    public fun `reopenComplaint returns success result`(): Unit =
        runTest {
            coEvery { api.reopenComplaint("c-1") } returns mockResponse

            val results = repo.reopenComplaint("c-1").toList()

            assertThat(results).hasSize(1)
            assertThat(results.first().isSuccess).isTrue()
            assertThat(results.first().getOrNull()?.id).isEqualTo("c-1")
        }

    @Test
    public fun `reopenComplaint returns failure when api throws`(): Unit =
        runTest {
            coEvery { api.reopenComplaint(any()) } throws RuntimeException("network error")

            val results = repo.reopenComplaint("c-1").toList()

            assertThat(results.first().isFailure).isTrue()
        }

    @Test
    public fun `getComplaints returns paginated list`(): Unit =
        runTest {
            coEvery { api.getComplaints(page = 1, limit = 20) } returns
                ComplaintListResponseDto(complaints = listOf(mockResponse))

            val results = repo.getComplaints(page = 1, limit = 20).toList()

            assertThat(results.first().isSuccess).isTrue()
            assertThat(results.first().getOrNull()).hasSize(1)
        }

    @Test
    public fun `getComplaints returns failure when api throws`(): Unit =
        runTest {
            coEvery { api.getComplaints(any(), any()) } throws RuntimeException("network error")

            val results = repo.getComplaints().toList()

            assertThat(results.first().isFailure).isTrue()
        }

    @Test
    public fun `createComplaint captures exception in Sentry on failure`(): Unit =
        runTest {
            mockkStatic("io.sentry.Sentry")
            coEvery { api.createComplaint(any(), any()) } throws RuntimeException("network error")
            every { Sentry.captureException(any()) } returns mockk()

            repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description.", null, "idem-key").toList()

            verify { Sentry.captureException(any()) }
        }
}
