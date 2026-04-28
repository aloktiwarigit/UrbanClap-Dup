package com.homeservices.technician.domain.rating

import com.homeservices.technician.data.rating.RatingRepository
import com.homeservices.technician.domain.rating.model.RatingSubScoreAverages
import com.homeservices.technician.domain.rating.model.TechRatingSummary
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

public class GetMyRatingsSummaryUseCaseTest {
    private val repository: RatingRepository = mockk()
    private val useCase = GetMyRatingsSummaryUseCase(repository)

    private val fakeSummary =
        TechRatingSummary(
            totalCount = 3,
            averageOverall = 4.2,
            averageSubScores = RatingSubScoreAverages(4.5, 4.1, 4.0),
            trend = emptyList(),
            items = emptyList(),
        )

    @Test
    public fun `invoke delegates to repository`(): Unit =
        runTest {
            coEvery { repository.getMyRatings() } returns Result.success(fakeSummary)
            val result = useCase.invoke()
            assertTrue(result.isSuccess)
            assertEquals(fakeSummary, result.getOrThrow())
        }

    @Test
    public fun `invoke returns failure when repository fails`(): Unit =
        runTest {
            coEvery { repository.getMyRatings() } returns Result.failure(RuntimeException())
            val result = useCase.invoke()
            assertTrue(result.isFailure)
        }
}
