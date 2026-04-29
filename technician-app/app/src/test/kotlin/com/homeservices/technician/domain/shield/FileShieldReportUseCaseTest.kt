package com.homeservices.technician.domain.shield

import com.homeservices.technician.domain.shield.model.ShieldReportResult
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class FileShieldReportUseCaseTest {
    private val repository: ShieldRepository = mockk()
    private val useCase = FileShieldReportUseCase(repository)

    @Test
    public fun `delegates to repository and returns success`(): Unit =
        runTest {
            coEvery { repository.fileShieldReport("bk-1", "abusive") } returns
                Result.success(ShieldReportResult("complaint-123"))

            val result = useCase.invoke("bk-1", "abusive")

            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrThrow().complaintId).isEqualTo("complaint-123")
            coVerify(exactly = 1) { repository.fileShieldReport("bk-1", "abusive") }
        }

    @Test
    public fun `delegates to repository and returns failure`(): Unit =
        runTest {
            coEvery { repository.fileShieldReport(any(), any()) } returns
                Result.failure(RuntimeException("network error"))

            val result = useCase.invoke("bk-1", null)

            assertThat(result.isFailure).isTrue()
        }
}
