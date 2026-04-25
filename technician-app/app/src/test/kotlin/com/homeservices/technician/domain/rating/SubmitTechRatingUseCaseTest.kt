package com.homeservices.technician.domain.rating

import com.homeservices.technician.data.rating.RatingRepository
import com.homeservices.technician.domain.rating.model.TechSubScores
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class SubmitTechRatingUseCaseTest {
    private val repo: RatingRepository = mockk()
    private val useCase = SubmitTechRatingUseCase(repo)

    @Test
    public fun `delegates to repository with correct parameters`(): Unit =
        runTest {
            val subScores = TechSubScores(behaviour = 5, communication = 4)
            coEvery {
                repo.submitTechRating("bk-1", 5, subScores, null)
            } returns flowOf(Result.success(Unit))

            val results = useCase.invoke("bk-1", 5, subScores, null).toList()

            assertThat(results).hasSize(1)
            assertThat(results.first().isSuccess).isTrue()
        }
}
