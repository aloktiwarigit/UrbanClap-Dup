package com.homeservices.customer.domain.rating

import com.homeservices.customer.data.rating.RatingRepository
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import com.homeservices.customer.domain.rating.model.SideState
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class GetRatingUseCaseTest {
    private val repo: RatingRepository = mockk()
    private val useCase = GetRatingUseCase(repo)

    @Test
    public fun `delegates to repository`(): Unit =
        runTest {
            val snapshot =
                RatingSnapshot(
                    bookingId = "bk-1",
                    status = RatingSnapshot.Status.PENDING,
                    revealedAt = null,
                    customerSide = SideState.Pending,
                    techSide = SideState.Pending,
                )
            coEvery { repo.get("bk-1") } returns flowOf(Result.success(snapshot))

            val results = useCase.invoke("bk-1").toList()

            assertThat(results.first().getOrThrow().bookingId).isEqualTo("bk-1")
        }
}
