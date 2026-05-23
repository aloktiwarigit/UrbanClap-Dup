package com.homeservices.technician.domain.jobOffer

import com.homeservices.technician.data.jobOffer.JobOfferApiService
import com.homeservices.technician.domain.jobOffer.model.JobOfferResult
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import okhttp3.ResponseBody.Companion.toResponseBody
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import retrofit2.Response
import java.io.IOException

// Per Karnataka FR-9.1: decline counts MUST NEVER appear in any UI label, sort order,
// or analytics event. These tests verify only that Declined is returned, never the count.
@OptIn(ExperimentalCoroutinesApi::class)
public class DeclineJobOfferUseCaseTest {
    private lateinit var api: JobOfferApiService
    private lateinit var useCase: DeclineJobOfferUseCase

    @BeforeEach
    public fun setUp(): Unit {
        api = mockk()
        useCase = DeclineJobOfferUseCase(api)
    }

    @Test
    public fun `invoke returns Declined on HTTP 200`(): Unit =
        runTest {
            coEvery { api.declineOffer("booking-123") } returns Response.success(Unit)

            val result = useCase("booking-123")

            assertThat(result).isEqualTo(JobOfferResult.Declined("booking-123"))
        }

    @Test
    public fun `invoke returns Declined on HTTP error (user intention is the source of truth)`(): Unit =
        runTest {
            coEvery { api.declineOffer("booking-http-err") } returns
                Response.error(503, "".toResponseBody(null))

            val result = useCase("booking-http-err")

            assertThat(result).isEqualTo(JobOfferResult.Declined("booking-http-err"))
        }

    @Test
    public fun `invoke returns Declined when network throws IOException`(): Unit =
        runTest {
            coEvery { api.declineOffer(any()) } throws IOException("No network")

            val result = useCase("booking-net-err")

            assertThat(result).isEqualTo(JobOfferResult.Declined("booking-net-err"))
        }
}
