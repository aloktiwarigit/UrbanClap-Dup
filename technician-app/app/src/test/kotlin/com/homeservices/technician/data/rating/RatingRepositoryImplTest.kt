package com.homeservices.technician.data.rating

import com.homeservices.technician.data.rating.remote.RatingApiService
import com.homeservices.technician.data.rating.remote.dto.GetRatingResponseDto
import com.homeservices.technician.data.rating.remote.dto.SidePayloadDto
import com.homeservices.technician.data.rating.remote.dto.SubmitRatingRequestDto
import com.homeservices.technician.domain.rating.model.RatingSnapshot
import com.homeservices.technician.domain.rating.model.TechSubScores
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
    public fun `submitTechRating calls api with side TECH_TO_CUSTOMER and behaviour communication keys`(): Unit =
        runTest {
            coEvery { api.submit(any()) } returns Unit
            val subScores = TechSubScores(behaviour = 4, communication = 5)

            val results = repo.submitTechRating("bk-1", 5, subScores, "great").toList()

            val captured = slot<SubmitRatingRequestDto>()
            coVerify { api.submit(capture(captured)) }
            assertThat(captured.captured.side).isEqualTo("TECH_TO_CUSTOMER")
            assertThat(captured.captured.bookingId).isEqualTo("bk-1")
            assertThat(captured.captured.overall).isEqualTo(5)
            assertThat(captured.captured.subScores["behaviour"]).isEqualTo(4)
            assertThat(captured.captured.subScores["communication"]).isEqualTo(5)
            assertThat(captured.captured.subScores).hasSize(2)
            assertThat(captured.captured.comment).isEqualTo("great")
            assertThat(results.first().isSuccess).isTrue()
        }

    @Test
    public fun `submitTechRating returns failure on API error`(): Unit =
        runTest {
            coEvery { api.submit(any()) } throws RuntimeException("network error")

            val results = repo.submitTechRating("bk-1", 5, TechSubScores(5, 5), null).toList()

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
