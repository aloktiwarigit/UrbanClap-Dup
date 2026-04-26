package com.homeservices.customer.domain.sos

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.sos.remote.SosApiService
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Test

public class SosUseCaseTest {
    private val api: SosApiService = mockk()
    private val useCase = SosUseCase(api)

    @Test
    public fun `execute returns success on HTTP 2xx`(): Unit =
        runTest {
            coEvery { api.triggerSos("bk-1") } returns Unit
            val result = useCase.execute("bk-1")
            assertThat(result.isSuccess).isTrue()
            coVerify(exactly = 1) { api.triggerSos("bk-1") }
        }

    @Test
    public fun `execute returns failure on network error`(): Unit =
        runTest {
            coEvery { api.triggerSos("bk-1") } throws RuntimeException("timeout")
            val result = useCase.execute("bk-1")
            assertThat(result.isFailure).isTrue()
        }
}
