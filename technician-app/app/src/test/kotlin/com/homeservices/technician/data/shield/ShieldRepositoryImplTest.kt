package com.homeservices.technician.data.shield

import com.homeservices.technician.data.shield.remote.ShieldApiService
import com.homeservices.technician.data.shield.remote.dto.RatingAppealResponseDto
import com.homeservices.technician.data.shield.remote.dto.ShieldReportResponseDto
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import retrofit2.Response

public class ShieldRepositoryImplTest {
    private val api: ShieldApiService = mockk()
    private val moshi: Moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()
    private val repo = ShieldRepositoryImpl(api, moshi)

    @Test
    public fun `fileShieldReport returns ShieldReportResult on success`(): Unit =
        runTest {
            coEvery { api.fileShieldReport(any()) } returns Response.success(ShieldReportResponseDto("complaint-123"))

            val result = repo.fileShieldReport("bk-1", "abusive")

            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrThrow().complaintId).isEqualTo("complaint-123")
        }

    @Test
    public fun `fileShieldReport returns failure when API throws`(): Unit =
        runTest {
            coEvery { api.fileShieldReport(any()) } throws RuntimeException("network error")

            val result = repo.fileShieldReport("bk-1", null)

            assertThat(result.isFailure).isTrue()
        }

    @Test
    public fun `fileRatingAppeal returns RatingAppealResult with appealId on success`(): Unit =
        runTest {
            coEvery { api.fileRatingAppeal(any()) } returns Response.success(RatingAppealResponseDto("appeal-456"))

            val result = repo.fileRatingAppeal("bk-1", "unfair rating reason that is long enough")

            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrThrow().appealId).isEqualTo("appeal-456")
            assertThat(result.getOrThrow().quotaExceeded).isFalse()
        }

    @Test
    public fun `fileRatingAppeal returns quotaExceeded=true on 409 with APPEAL_QUOTA_EXCEEDED`(): Unit =
        runTest {
            val errorJson = """{"code":"APPEAL_QUOTA_EXCEEDED","nextAvailableAt":"2026-05-01T00:00:00.000Z"}"""
            val errorBody = errorJson.toResponseBody("application/json".toMediaType())
            coEvery { api.fileRatingAppeal(any()) } returns Response.error(409, errorBody)

            val result = repo.fileRatingAppeal("bk-1", "unfair rating reason that is long enough")

            assertThat(result.isSuccess).isTrue()
            val value = result.getOrThrow()
            assertThat(value.quotaExceeded).isTrue()
            assertThat(value.nextAvailableAt).isEqualTo("2026-05-01T00:00:00.000Z")
        }

    @Test
    public fun `fileRatingAppeal returns failure when API throws`(): Unit =
        runTest {
            coEvery { api.fileRatingAppeal(any()) } throws RuntimeException("timeout")

            val result = repo.fileRatingAppeal("bk-1", "unfair rating reason that is long enough")

            assertThat(result.isFailure).isTrue()
        }

    @Test
    public fun `fileShieldReport returns failure on non-2xx response`(): Unit =
        runTest {
            val errorBody = "server error".toResponseBody("text/plain".toMediaType())
            coEvery { api.fileShieldReport(any()) } returns Response.error(500, errorBody)

            val result = repo.fileShieldReport("bk-1", "abusive")

            assertThat(result.isFailure).isTrue()
        }

    @Test
    public fun `fileRatingAppeal returns failure on non-409 error response`(): Unit =
        runTest {
            val errorBody = "server error".toResponseBody("text/plain".toMediaType())
            coEvery { api.fileRatingAppeal(any()) } returns Response.error(500, errorBody)

            val result = repo.fileRatingAppeal("bk-1", "valid reason that is at least twenty characters")

            assertThat(result.isFailure).isTrue()
        }

    @Test
    public fun `fileRatingAppeal returns failure on 409 with malformed JSON`(): Unit =
        runTest {
            val errorBody = "not-json".toResponseBody("application/json".toMediaType())
            coEvery { api.fileRatingAppeal(any()) } returns Response.error(409, errorBody)

            val result = repo.fileRatingAppeal("bk-1", "valid reason that is at least twenty characters")

            assertThat(result.isFailure).isTrue()
        }

    @Test
    public fun `fileRatingAppeal returns failure on 409 with non-quota error code`(): Unit =
        runTest {
            val errorJson = """{"code":"RATING_NOT_APPEALABLE"}"""
            val errorBody = errorJson.toResponseBody("application/json".toMediaType())
            coEvery { api.fileRatingAppeal(any()) } returns Response.error(409, errorBody)

            val result = repo.fileRatingAppeal("bk-1", "valid reason that is at least twenty characters")

            assertThat(result.isFailure).isTrue()
        }
}
