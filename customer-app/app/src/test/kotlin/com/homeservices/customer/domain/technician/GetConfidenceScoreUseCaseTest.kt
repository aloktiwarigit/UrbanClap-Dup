package com.homeservices.customer.domain.technician

import com.homeservices.customer.data.technician.ConfidenceScoreRepository
import com.homeservices.customer.domain.technician.model.ConfidenceScore
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

public class GetConfidenceScoreUseCaseTest {
    private val repo: ConfidenceScoreRepository = mockk()
    private val sut = GetConfidenceScoreUseCase(repo)
    private val score =
        ConfidenceScore(onTimePercent = 94, areaRating = 4.7, nearestEtaMinutes = 12, dataPointCount = 35, isLimitedData = false)

    @Test
    public fun `invoke delegates to repository with correct params`(): Unit =
        runTest {
            every { repo.getConfidenceScore("tech-1", 12.97, 77.59) } returns flowOf(Result.success(score))
            val result = sut("tech-1", 12.97, 77.59).first()
            assertThat(result.getOrThrow()).isEqualTo(score)
            verify(exactly = 1) { repo.getConfidenceScore("tech-1", 12.97, 77.59) }
        }

    @Test
    public fun `invoke propagates repository failure`(): Unit =
        runTest {
            val err = RuntimeException("network error")
            every { repo.getConfidenceScore("tech-1", 0.0, 0.0) } returns flowOf(Result.failure(err))
            val result = sut("tech-1", 0.0, 0.0).first()
            assertThat(result.isFailure).isTrue()
        }
}
