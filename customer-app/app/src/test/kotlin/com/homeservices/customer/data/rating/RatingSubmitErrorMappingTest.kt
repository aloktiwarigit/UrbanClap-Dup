package com.homeservices.customer.data.rating

import com.homeservices.customer.data.rating.remote.RatingApiService
import com.homeservices.customer.domain.rating.RatingSubmitException
import com.homeservices.customer.domain.rating.RatingSubmitFailure
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import io.mockk.coEvery
import io.mockk.mockk
import io.mockk.unmockkAll
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import retrofit2.HttpException
import retrofit2.Response
import java.io.IOException

/**
 * The rating screen used to show "Could not load rating — HTTP 409 Conflict" whenever a submit
 * failed, because every throwable was passed through untranslated. These tests pin the mapping
 * from the API's stable error codes to [RatingSubmitFailure].
 */
public class RatingSubmitErrorMappingTest {
    private val api: RatingApiService = mockk()
    private val repo = RatingRepositoryImpl(api)

    @AfterEach
    public fun tearDown() {
        unmockkAll()
    }

    private fun httpError(
        code: Int,
        body: String,
    ): HttpException =
        HttpException(
            Response.error<Unit>(code, body.toResponseBody("application/json".toMediaType())),
        )

    private suspend fun submitFailure(throwable: Throwable): RatingSubmitFailure {
        coEvery { api.submit(any(), any()) } throws throwable
        val result =
            repo.submitCustomerRating("bk-1", 5, CustomerSubScores(5, 5, 5), null, "idem-1").toList().first()
        val error = result.exceptionOrNull()
        assertThat(error).isInstanceOf(RatingSubmitException::class.java)
        return (error as RatingSubmitException).failure
    }

    @Test
    public fun `409 NO_TECHNICIAN maps to NoTechnician`(): Unit =
        runTest {
            assertThat(submitFailure(httpError(409, """{"code":"NO_TECHNICIAN"}""")))
                .isEqualTo(RatingSubmitFailure.NoTechnician)
        }

    @Test
    public fun `409 RATING_ALREADY_SUBMITTED maps to AlreadySubmitted`(): Unit =
        runTest {
            assertThat(submitFailure(httpError(409, """{"code":"RATING_ALREADY_SUBMITTED"}""")))
                .isEqualTo(RatingSubmitFailure.AlreadySubmitted)
        }

    @Test
    public fun `409 BOOKING_NOT_CLOSED maps to BookingNotClosed`(): Unit =
        runTest {
            assertThat(submitFailure(httpError(409, """{"code":"BOOKING_NOT_CLOSED","status":"REACHED"}""")))
                .isEqualTo(RatingSubmitFailure.BookingNotClosed)
        }

    @Test
    public fun `403 FORBIDDEN maps to NotAvailable`(): Unit =
        runTest {
            assertThat(submitFailure(httpError(403, """{"code":"FORBIDDEN"}""")))
                .isEqualTo(RatingSubmitFailure.NotAvailable)
        }

    @Test
    public fun `404 BOOKING_NOT_FOUND maps to NotAvailable`(): Unit =
        runTest {
            assertThat(submitFailure(httpError(404, """{"code":"BOOKING_NOT_FOUND"}""")))
                .isEqualTo(RatingSubmitFailure.NotAvailable)
        }

    @Test
    public fun `IO failure maps to retryable Network`(): Unit =
        runTest {
            val failure = submitFailure(IOException("Unable to resolve host"))
            assertThat(failure).isEqualTo(RatingSubmitFailure.Network)
            assertThat(failure.retryable).isTrue()
        }

    @Test
    public fun `500 maps to retryable Unknown`(): Unit =
        runTest {
            val failure = submitFailure(httpError(500, """{"code":"INTERNAL"}"""))
            assertThat(failure).isEqualTo(RatingSubmitFailure.Unknown)
            assertThat(failure.retryable).isTrue()
        }

    @Test
    public fun `409 with an unrecognised code maps to Unknown rather than crashing`(): Unit =
        runTest {
            assertThat(submitFailure(httpError(409, """{"code":"SOMETHING_NEW"}""")))
                .isEqualTo(RatingSubmitFailure.Unknown)
        }

    @Test
    public fun `409 with a non-JSON body maps to Unknown rather than crashing`(): Unit =
        runTest {
            assertThat(submitFailure(httpError(409, "<html>gateway</html>")))
                .isEqualTo(RatingSubmitFailure.Unknown)
        }

    @Test
    public fun `terminal failures are not marked retryable`() {
        assertThat(RatingSubmitFailure.NoTechnician.retryable).isFalse()
        assertThat(RatingSubmitFailure.BookingNotClosed.retryable).isFalse()
        assertThat(RatingSubmitFailure.NotAvailable.retryable).isFalse()
    }

    @Test
    public fun `409 SHIELD_ALREADY_ESCALATED is terminal, not a retry invitation`(): Unit =
        runTest {
            val failure = submitFailure(httpError(409, """{"code":"SHIELD_ALREADY_ESCALATED"}"""))
            assertThat(failure).isEqualTo(RatingSubmitFailure.ShieldAlreadyEscalated)
            assertThat(failure.retryable).isFalse()
        }
}
