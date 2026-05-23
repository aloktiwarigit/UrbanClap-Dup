package com.homeservices.technician.data.erasure

import com.homeservices.technician.data.erasure.remote.ErasureApiService
import com.homeservices.technician.data.erasure.remote.ErasureSubmitResponseBody
import com.homeservices.technician.domain.erasure.ErasureSubmitResult
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import okhttp3.ResponseBody.Companion.toResponseBody
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import retrofit2.Response

public class ErasureRepositoryImplTest {
    private val api: ErasureApiService = mockk()
    private lateinit var repo: ErasureRepositoryImpl

    @BeforeEach
    public fun setUp() {
        repo = ErasureRepositoryImpl(api)
    }

    @Test
    public fun `submitRequest returns Success on 200`(): Unit =
        runTest {
            val body =
                ErasureSubmitResponseBody(
                    erasureId = "er-1",
                    scheduledDeletionAt = "2026-05-29T02:00:00.000Z",
                    status = "PENDING",
                )
            coEvery { api.submitErasureRequest(any()) } returns Response.success(body)

            val result = repo.submitRequest(null)

            assertThat(result).isEqualTo(ErasureSubmitResult.Success("2026-05-29T02:00:00.000Z"))
        }

    @Test
    public fun `submitRequest returns ActiveJobExists on 409 ACTIVE_JOB_EXISTS`(): Unit =
        runTest {
            val errorBody = """{"code":"ACTIVE_JOB_EXISTS"}""".toResponseBody()
            coEvery { api.submitErasureRequest(any()) } returns
                Response.error(409, errorBody)

            val result = repo.submitRequest(null)

            assertThat(result).isEqualTo(ErasureSubmitResult.ActiveJobExists)
        }

    @Test
    public fun `submitRequest returns DuplicatePending on 409 without ACTIVE_JOB_EXISTS`(): Unit =
        runTest {
            val errorBody = """{"code":"DUPLICATE_PENDING"}""".toResponseBody()
            coEvery { api.submitErasureRequest(any()) } returns
                Response.error(409, errorBody)

            val result = repo.submitRequest(null)

            assertThat(result).isEqualTo(ErasureSubmitResult.DuplicatePending)
        }

    @Test
    public fun `submitRequest returns UnknownError on 500`(): Unit =
        runTest {
            val errorBody = "Internal Server Error".toResponseBody()
            coEvery { api.submitErasureRequest(any()) } returns
                Response.error(500, errorBody)

            val result = repo.submitRequest(null)

            assertThat(result).isInstanceOf(ErasureSubmitResult.UnknownError::class.java)
        }

    @Test
    public fun `submitRequest returns UnknownError when api throws`(): Unit =
        runTest {
            coEvery { api.submitErasureRequest(any()) } throws RuntimeException("network failure")

            val result = repo.submitRequest(null)

            assertThat(result).isEqualTo(ErasureSubmitResult.UnknownError("network failure"))
        }

    @Test
    public fun `revokeRequest returns success on 200`(): Unit =
        runTest {
            coEvery { api.revokeErasureRequest() } returns Response.success(null)

            val result = repo.revokeRequest()

            assertThat(result.isSuccess).isTrue
        }

    @Test
    public fun `revokeRequest returns failure on non-2xx`(): Unit =
        runTest {
            val errorBody = "Not Found".toResponseBody()
            coEvery { api.revokeErasureRequest() } returns Response.error(404, errorBody)

            val result = repo.revokeRequest()

            assertThat(result.isFailure).isTrue
        }
}
