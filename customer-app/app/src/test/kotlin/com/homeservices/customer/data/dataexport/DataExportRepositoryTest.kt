package com.homeservices.customer.data.dataexport

import com.homeservices.customer.data.dataexport.remote.DataExportApiService
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class DataExportRepositoryTest {
    private val api: DataExportApiService = mockk()
    private val repo = DataExportRepositoryImpl(api)

    private val sampleJson = """{"profile":{"uid":"u-1"},"bookings":[]}"""

    @Test
    public fun `fetchExport returns success with json bytes on happy path`(): Unit =
        runTest {
            coEvery { api.fetchDataExport() } returns
                sampleJson.toResponseBody("application/json".toMediaType())

            val results = repo.fetchExport().toList()

            assertThat(results).hasSize(1)
            assertThat(results.first().isSuccess).isTrue()
            val bytes = results.first().getOrNull()
            assertThat(bytes).isNotNull
            assertThat(String(bytes!!)).isEqualTo(sampleJson)
        }

    @Test
    public fun `fetchExport returns failure when api throws`(): Unit =
        runTest {
            coEvery { api.fetchDataExport() } throws RuntimeException("network error")

            val results = repo.fetchExport().toList()

            assertThat(results).hasSize(1)
            assertThat(results.first().isFailure).isTrue()
        }

    @Test
    public fun `fetchExport emits single element`(): Unit =
        runTest {
            coEvery { api.fetchDataExport() } returns
                sampleJson.toResponseBody("application/json".toMediaType())

            val results = repo.fetchExport().toList()

            assertThat(results).hasSize(1)
        }
}
