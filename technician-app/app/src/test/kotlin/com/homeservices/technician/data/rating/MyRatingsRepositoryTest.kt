package com.homeservices.technician.data.rating

import com.homeservices.technician.data.rating.remote.RatingApiService
import com.homeservices.technician.data.rating.remote.dto.AverageSubScoresDto
import com.homeservices.technician.data.rating.remote.dto.TechRatingSummaryDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

public class MyRatingsRepositoryTest {
    private val apiService: RatingApiService = mockk()
    private val repository = RatingRepositoryImpl(apiService)

    private val dto =
        TechRatingSummaryDto(
            totalCount = 2,
            averageOverall = 4.5,
            averageSubScores = AverageSubScoresDto(punctuality = 4.5, skill = 4.5, behaviour = 4.5),
            trend = emptyList(),
            items = emptyList(),
        )

    @Test
    public fun `getMyRatings maps DTO to domain`(): Unit =
        runTest {
            coEvery { apiService.getMyRatings() } returns dto
            val result = repository.getMyRatings()
            assertTrue(result.isSuccess)
            assertEquals(2, result.getOrThrow().totalCount)
            assertEquals(4.5, result.getOrThrow().averageOverall)
        }

    @Test
    public fun `getMyRatings returns failure on API exception`(): Unit =
        runTest {
            coEvery { apiService.getMyRatings() } throws RuntimeException("Network error")
            val result = repository.getMyRatings()
            assertTrue(result.isFailure)
        }
}
