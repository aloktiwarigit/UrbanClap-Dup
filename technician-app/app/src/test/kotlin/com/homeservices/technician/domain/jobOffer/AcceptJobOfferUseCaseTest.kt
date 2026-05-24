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
import org.junit.jupiter.api.assertThrows
import retrofit2.Response
import java.io.IOException

@OptIn(ExperimentalCoroutinesApi::class)
public class AcceptJobOfferUseCaseTest {
    private lateinit var api: JobOfferApiService
    private lateinit var useCase: AcceptJobOfferUseCase

    @BeforeEach
    public fun setUp(): Unit {
        api = mockk()
        useCase = AcceptJobOfferUseCase(api)
    }

    @Test
    public fun `invoke returns Accepted on HTTP 200`(): Unit =
        runTest {
            coEvery { api.acceptOffer("booking-123") } returns Response.success(Unit)

            val result = useCase("booking-123")

            assertThat(result).isEqualTo(JobOfferResult.Accepted("booking-123"))
        }

    @Test
    public fun `invoke returns Expired on HTTP 410`(): Unit =
        runTest {
            coEvery { api.acceptOffer("booking-expired") } returns
                Response.error(410, "".toResponseBody(null))

            val result = useCase("booking-expired")

            assertThat(result).isEqualTo(JobOfferResult.Expired("booking-expired"))
        }

    @Test
    public fun `invoke returns Conflict on HTTP 409`(): Unit =
        runTest {
            coEvery { api.acceptOffer("booking-409") } returns
                Response.error(409, "".toResponseBody(null))

            val result = useCase("booking-409")

            assertThat(result).isEqualTo(JobOfferResult.Conflict("booking-409"))
        }

    @Test
    public fun `invoke returns UnknownError on unexpected HTTP error`(): Unit =
        runTest {
            coEvery { api.acceptOffer("booking-500") } returns
                Response.error(500, "".toResponseBody(null))

            val result = useCase("booking-500")

            assertThat(result).isEqualTo(JobOfferResult.UnknownError(500))
        }

    @Test
    public fun `invoke propagates IOException on network error`(): Unit {
        coEvery { api.acceptOffer(any()) } throws IOException("Connection reset")

        assertThrows<IOException> {
            // Use runBlocking instead of runTest so assertThrows can intercept the exception
            // synchronously (assertThrows does not support suspend lambdas).
            kotlinx.coroutines.runBlocking { useCase("booking-net-err") }
        }
    }
}
