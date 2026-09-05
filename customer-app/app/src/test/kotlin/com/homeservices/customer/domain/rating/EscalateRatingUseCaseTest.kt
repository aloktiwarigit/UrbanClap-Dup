package com.homeservices.customer.domain.rating

import com.homeservices.customer.data.rating.remote.RatingApiService
import com.homeservices.customer.data.rating.remote.dto.EscalateRatingRequestDto
import com.homeservices.customer.data.rating.remote.dto.EscalateRatingResponseDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import retrofit2.HttpException
import retrofit2.Response
import java.time.Instant

public class EscalateRatingUseCaseTest {
    private val apiService: RatingApiService = mockk()
    private val useCase = EscalateRatingUseCase(apiService)

    @Test
    public fun `returns EscalateRatingResult with parsed epoch millis on success`(): Unit =
        runTest {
            val isoExpiry = "2026-04-25T14:00:00.000Z"
            coEvery {
                apiService.escalate("bk-1", EscalateRatingRequestDto(2, null))
            } returns EscalateRatingResponseDto("complaint-abc", isoExpiry)

            val result = useCase.invoke("bk-1", 2, null)

            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrNull()?.complaintId).isEqualTo("complaint-abc")
            assertThat(result.getOrNull()?.expiresAtMs)
                .isEqualTo(Instant.parse(isoExpiry).toEpochMilli())
        }

    @Test
    public fun `passes draftComment when provided`(): Unit =
        runTest {
            coEvery {
                apiService.escalate("bk-1", EscalateRatingRequestDto(1, "rude technician"))
            } returns EscalateRatingResponseDto("complaint-xyz", "2026-04-25T14:00:00.000Z")

            val result = useCase.invoke("bk-1", 1, "rude technician")

            assertThat(result.isSuccess).isTrue()
        }

    @Test
    public fun `wraps network error in a mapped failure that keeps the cause`(): Unit =
        runTest {
            coEvery { apiService.escalate(any(), any()) } throws RuntimeException("timeout")

            val result = useCase.invoke("bk-1", 2, null)

            assertThat(result.isFailure).isTrue()
            val error = result.exceptionOrNull()
            assertThat(error).isInstanceOf(RatingSubmitException::class.java)
            assertThat((error as RatingSubmitException).failure).isEqualTo(RatingSubmitFailure.Unknown)
            assertThat(error.cause?.message).contains("timeout")
        }

    @Test
    public fun `maps an API rejection to its specific reason so the sheet can name it`(): Unit =
        runTest {
            coEvery { apiService.escalate(any(), any()) } throws
                HttpException(
                    Response.error<Unit>(
                        409,
                        """{"code":"NO_TECHNICIAN"}""".toResponseBody("application/json".toMediaType()),
                    ),
                )

            val result = useCase.invoke("bk-1", 2, null)

            val error = result.exceptionOrNull() as RatingSubmitException
            assertThat(error.failure).isEqualTo(RatingSubmitFailure.NoTechnician)
            assertThat(error.failure.retryable).isFalse()
        }
}
