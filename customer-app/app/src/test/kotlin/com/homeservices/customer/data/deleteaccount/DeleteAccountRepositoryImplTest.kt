package com.homeservices.customer.data.deleteaccount

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.deleteaccount.remote.ErasureApiService
import com.homeservices.customer.data.deleteaccount.remote.dto.SubmitErasureResponseDto
import com.homeservices.customer.domain.deleteaccount.ErasureAlreadyPendingException
import com.homeservices.customer.domain.deleteaccount.NoActiveErasureRequestException
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Test
import retrofit2.Response

// NOTE: Tests for getActiveErasureRequest() (POST-probe) have been removed.
// That method was deleted as part of the DPDP-CRITICAL P1 fix — the POST-probe
// created an erasure request on screen entry, before user confirmation.
// The 409 conflict path is now handled in submitErasureRequest() via
// ErasureAlreadyPendingException; see the test below.
public class DeleteAccountRepositoryImplTest {
    private val api: ErasureApiService = mockk()
    private val moshi: Moshi =
        Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()

    private val sut = DeleteAccountRepositoryImpl(api = api, moshi = moshi)

    // ─── submitErasureRequest ────────────────────────────────────────────────

    @Test
    public fun `submitErasureRequest returns ErasureRequest on 201`(): Unit =
        runTest {
            val dto =
                SubmitErasureResponseDto(
                    erasureId = "pending:uid-1",
                    scheduledDeletionAt = "2026-05-19T12:00:00Z",
                    status = "PENDING",
                )
            coEvery { api.submitErasureRequest(any()) } returns Response.success(201, dto)

            val result = sut.submitErasureRequest()
            assertThat(result.isSuccess).isTrue()
            val erasure = result.getOrThrow()
            assertThat(erasure.requestId).isEqualTo("pending:uid-1")
            assertThat(erasure.scheduledDeletionAt).isEqualTo("2026-05-19T12:00:00Z")
        }

    @Test
    public fun `submitErasureRequest returns ErasureAlreadyPendingException on 409`(): Unit =
        runTest {
            val errorJson = """{"code":"ERASURE_REQUEST_PENDING","erasureId":"pending:uid-1"}"""
            val errorBody = errorJson.toResponseBody()
            coEvery { api.submitErasureRequest(any()) } returns
                Response.error(409, errorBody)

            val result = sut.submitErasureRequest()
            assertThat(result.isFailure).isTrue()
            assertThat(result.exceptionOrNull()).isInstanceOf(ErasureAlreadyPendingException::class.java)
            val ex = result.exceptionOrNull() as ErasureAlreadyPendingException
            assertThat(ex.erasureId).isEqualTo("pending:uid-1")
        }

    @Test
    public fun `submitErasureRequest returns ErasureAlreadyPendingException with unknown id when 409 body is unparseable`(): Unit =
        runTest {
            // Guard: malformed 409 body — erasureId falls back to "unknown".
            val errorBody = "not-json".toResponseBody()
            coEvery { api.submitErasureRequest(any()) } returns Response.error(409, errorBody)

            val result = sut.submitErasureRequest()
            assertThat(result.isFailure).isTrue()
            val ex = result.exceptionOrNull() as? ErasureAlreadyPendingException
            assertThat(ex).isNotNull()
            assertThat(ex!!.erasureId).isEqualTo("unknown")
        }

    @Test
    public fun `submitErasureRequest returns failure on unexpected status`(): Unit =
        runTest {
            val errorBody = "Server error".toResponseBody()
            coEvery { api.submitErasureRequest(any()) } returns Response.error(500, errorBody)

            val result = sut.submitErasureRequest()
            assertThat(result.isFailure).isTrue()
        }

    @Test
    public fun `submitErasureRequest returns failure on network exception`(): Unit =
        runTest {
            coEvery { api.submitErasureRequest(any()) } throws RuntimeException("No network")

            val result = sut.submitErasureRequest()
            assertThat(result.isFailure).isTrue()
            assertThat(result.exceptionOrNull()?.message).isEqualTo("No network")
        }

    // ─── revokeErasureRequest ────────────────────────────────────────────────

    @Test
    public fun `revokeErasureRequest returns success on 204`(): Unit =
        runTest {
            coEvery { api.revokeErasureRequest() } returns Response.success(204, Unit)

            val result = sut.revokeErasureRequest()
            assertThat(result.isSuccess).isTrue()
        }

    @Test
    public fun `revokeErasureRequest returns NoActiveErasureRequestException on 404`(): Unit =
        runTest {
            val errorBody = """{"code":"NO_PENDING_ERASURE_REQUEST"}""".toResponseBody()
            coEvery { api.revokeErasureRequest() } returns Response.error(404, errorBody)

            val result = sut.revokeErasureRequest()
            assertThat(result.isFailure).isTrue()
            assertThat(result.exceptionOrNull()).isInstanceOf(NoActiveErasureRequestException::class.java)
        }

    @Test
    public fun `revokeErasureRequest returns failure on unexpected status`(): Unit =
        runTest {
            val errorBody = "Server error".toResponseBody()
            coEvery { api.revokeErasureRequest() } returns Response.error(500, errorBody)

            val result = sut.revokeErasureRequest()
            assertThat(result.isFailure).isTrue()
        }

    // ─── API calls use the correct endpoints ────────────────────────────────

    @Test
    public fun `submitErasureRequest calls POST with reason`(): Unit =
        runTest {
            val dto = SubmitErasureResponseDto("id", "2026-05-19T12:00:00Z", "PENDING")
            coEvery { api.submitErasureRequest(any()) } returns Response.success(201, dto)

            sut.submitErasureRequest(reason = "Test reason")
            coVerify(exactly = 1) {
                api.submitErasureRequest(match { it.reason == "Test reason" })
            }
        }
}
