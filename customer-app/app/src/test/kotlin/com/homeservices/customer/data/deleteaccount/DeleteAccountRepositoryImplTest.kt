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

    // ─── getActiveErasureRequest ─────────────────────────────────────────────

    @Test
    public fun `getActiveErasureRequest returns ErasureRequest when 201 (probe created new)`(): Unit =
        runTest {
            val dto =
                SubmitErasureResponseDto(
                    erasureId = "pending:uid-1",
                    scheduledDeletionAt = "2026-05-19T12:00:00Z",
                    status = "PENDING",
                )
            coEvery { api.submitErasureRequest(any()) } returns Response.success(201, dto)

            val result = sut.getActiveErasureRequest()
            assertThat(result.isSuccess).isTrue()
            val erasure = result.getOrThrow()
            assertThat(erasure).isNotNull()
            assertThat(erasure!!.requestId).isEqualTo("pending:uid-1")
        }

    @Test
    public fun `getActiveErasureRequest returns ErasureRequest with empty scheduledAt on 409 PENDING`(): Unit =
        runTest {
            val errorJson = """{"code":"ERASURE_REQUEST_PENDING","erasureId":"pending:uid-1"}"""
            val errorBody = errorJson.toResponseBody()
            coEvery { api.submitErasureRequest(any()) } returns Response.error(409, errorBody)

            val result = sut.getActiveErasureRequest()
            assertThat(result.isSuccess).isTrue()
            val erasure = result.getOrThrow()
            assertThat(erasure).isNotNull()
            assertThat(erasure!!.requestId).isEqualTo("pending:uid-1")
            assertThat(erasure.scheduledDeletionAt).isEmpty()
        }

    @Test
    public fun `getActiveErasureRequest returns null on 409 USER_ALREADY_ERASED`(): Unit =
        runTest {
            val errorJson = """{"code":"USER_ALREADY_ERASED","erasureId":null}"""
            val errorBody = errorJson.toResponseBody()
            coEvery { api.submitErasureRequest(any()) } returns Response.error(409, errorBody)

            val result = sut.getActiveErasureRequest()
            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrThrow()).isNull()
        }

    @Test
    public fun `getActiveErasureRequest returns failure on network exception`(): Unit =
        runTest {
            coEvery { api.submitErasureRequest(any()) } throws RuntimeException("timeout")

            val result = sut.getActiveErasureRequest()
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
