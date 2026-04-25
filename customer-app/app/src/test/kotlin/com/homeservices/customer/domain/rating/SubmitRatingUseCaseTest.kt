package com.homeservices.customer.domain.rating

import com.homeservices.customer.data.rating.RatingRepository
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class SubmitRatingUseCaseTest {
    private val repo: RatingRepository = mockk()
    private val useCase = SubmitRatingUseCase(repo)

    @Test
    public fun `delegates to repository with correct parameters`(): Unit =
        runTest {
            val subScores = CustomerSubScores(punctuality = 5, skill = 4, behaviour = 5)
            coEvery {
                repo.submitCustomerRating("bk-1", 5, subScores, "great")
            } returns flowOf(Result.success(Unit))

            val results = useCase.invoke("bk-1", 5, subScores, "great").toList()

            assertThat(results).hasSize(1)
            assertThat(results.first().isSuccess).isTrue()
        }
}
