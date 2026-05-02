package com.homeservices.technician.domain.shield

import com.homeservices.technician.domain.shield.model.RatingAppealResult
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class FileRatingAppealUseCaseTest {
    private val repository: ShieldRepository = mockk()
    private val useCase = FileRatingAppealUseCase(repository)

    @Test
    public fun `delegates to repository and returns success with appealId`(): Unit =
        runTest {
            coEvery { repository.fileRatingAppeal("bk-1", "unfair rating long enough reason") } returns
                Result.success(RatingAppealResult(appealId = "appeal-456"))

            val result = useCase.invoke("bk-1", "unfair rating long enough reason")

            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrThrow().appealId).isEqualTo("appeal-456")
            coVerify(exactly = 1) { repository.fileRatingAppeal("bk-1", "unfair rating long enough reason") }
        }

    @Test
    public fun `delegates to repository and returns quota exceeded`(): Unit =
        runTest {
            coEvery { repository.fileRatingAppeal(any(), any()) } returns
                Result.success(RatingAppealResult(quotaExceeded = true, nextAvailableAt = "2026-05-01T00:00:00.000Z"))

            val result = useCase.invoke("bk-1", "reason")

            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrThrow().quotaExceeded).isTrue()
        }

    @Test
    public fun `delegates to repository and returns failure`(): Unit =
        runTest {
            coEvery { repository.fileRatingAppeal(any(), any()) } returns
                Result.failure(RuntimeException("error"))

            val result = useCase.invoke("bk-1", "reason")

            assertThat(result.isFailure).isTrue()
        }
}
