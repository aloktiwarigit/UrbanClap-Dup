package com.homeservices.customer.data.rating

import com.homeservices.customer.data.rating.remote.RatingApiService
import com.homeservices.customer.data.rating.remote.dto.GetRatingResponseDto
import com.homeservices.customer.data.rating.remote.dto.SidePayloadDto
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import io.mockk.slot
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class RatingRepositoryImplTest {
    private val api: RatingApiService = mockk()
    private val repo = RatingRepositoryImpl(api)

    @Test
    public fun `submitCustomerRating calls api with correct DTO`(): Unit =
        runTest {
            coEvery { api.submit(any()) } returns Unit
            val subScores = CustomerSubScores(punctuality = 5, skill = 4, behaviour = 3)

            val results = repo.submitCustomerRating("bk-1", 5, subScores, "good").toList()

            val captured = slot<com.homeservices.customer.data.rating.remote.dto.SubmitRatingRequestDto>()
            coVerify { api.submit(capture(captured)) }
            assertThat(captured.captured.side).isEqualTo("CUSTOMER_TO_TECH")
            assertThat(captured.captured.bookingId).isEqualTo("bk-1")
            assertThat(captured.captured.overall).isEqualTo(5)
            assertThat(captured.captured.subScores["punctuality"]).isEqualTo(5)
            assertThat(results.first().isSuccess).isTrue()
        }

    @Test
    public fun `submitCustomerRating returns failure on API error`(): Unit =
        runTest {
            coEvery { api.submit(any()) } throws RuntimeException("network error")

            val results = repo.submitCustomerRating("bk-1", 5, CustomerSubScores(5, 5, 5), null).toList()

            assertThat(results.first().isFailure).isTrue()
        }

    @Test
    public fun `get returns domain model on success`(): Unit =
        runTest {
            val dto =
                GetRatingResponseDto(
                    bookingId = "bk-1",
                    status = "PENDING",
                    revealedAt = null,
                    customerSide = SidePayloadDto(status = "PENDING"),
                    techSide = SidePayloadDto(status = "PENDING"),
                )
            coEvery { api.get("bk-1") } returns dto

            val results = repo.get("bk-1").toList()

            val snapshot = results.first().getOrThrow()
            assertThat(snapshot.bookingId).isEqualTo("bk-1")
            assertThat(snapshot.status).isEqualTo(RatingSnapshot.Status.PENDING)
        }

    @Test
    public fun `get returns failure on API error`(): Unit =
        runTest {
            coEvery { api.get("bk-1") } throws RuntimeException("timeout")

            val results = repo.get("bk-1").toList()

            assertThat(results.first().isFailure).isTrue()
        }
}
