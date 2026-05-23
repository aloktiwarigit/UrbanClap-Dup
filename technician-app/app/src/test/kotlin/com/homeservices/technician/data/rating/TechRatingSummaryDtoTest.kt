package com.homeservices.technician.data.rating

import com.homeservices.technician.data.rating.remote.dto.AverageSubScoresDto
import com.homeservices.technician.data.rating.remote.dto.RatingWeekTrendDto
import com.homeservices.technician.data.rating.remote.dto.ReceivedRatingDto
import com.homeservices.technician.data.rating.remote.dto.TechRatingSummaryDto
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class TechRatingSummaryDtoTest {
    private fun aSubScores() = AverageSubScoresDto(punctuality = 4.5, skill = 4.8, behaviour = 4.9)

    private fun aWeekTrend() = RatingWeekTrendDto(weekStart = "2026-05-05", average = 4.6, count = 10)

    private fun aReceivedRating() =
        ReceivedRatingDto(
            bookingId = "bk-1",
            overall = 5,
            subScores = mapOf("punctuality" to 5, "skill" to 4, "behaviour" to 5),
            comment = "Excellent",
            submittedAt = "2026-05-10T09:00:00Z",
            appealDisputed = false,
        )

    @Test
    public fun `toDomain maps totalCount, averageOverall, and averageSubScores`() {
        val dto =
            TechRatingSummaryDto(
                totalCount = 42,
                averageOverall = 4.7,
                averageSubScores = aSubScores(),
                trend = emptyList(),
                items = emptyList(),
            )

        val domain = dto.toDomain()

        assertThat(domain.totalCount).isEqualTo(42)
        assertThat(domain.averageOverall).isEqualTo(4.7)
        assertThat(domain.averageSubScores.punctuality).isEqualTo(4.5)
        assertThat(domain.averageSubScores.skill).isEqualTo(4.8)
        assertThat(domain.averageSubScores.behaviour).isEqualTo(4.9)
    }

    @Test
    public fun `toDomain maps trend list to RatingWeekTrend domain objects`() {
        val dto =
            TechRatingSummaryDto(
                totalCount = 0,
                averageOverall = 0.0,
                averageSubScores = aSubScores(),
                trend = listOf(aWeekTrend()),
                items = emptyList(),
            )

        val domain = dto.toDomain()

        assertThat(domain.trend).hasSize(1)
        assertThat(domain.trend[0].weekStart).isEqualTo("2026-05-05")
        assertThat(domain.trend[0].average).isEqualTo(4.6)
        assertThat(domain.trend[0].count).isEqualTo(10)
    }

    @Test
    public fun `toDomain maps items list and extracts sub-score punctuality, skill, behaviour`() {
        val dto =
            TechRatingSummaryDto(
                totalCount = 1,
                averageOverall = 5.0,
                averageSubScores = aSubScores(),
                trend = emptyList(),
                items = listOf(aReceivedRating()),
            )

        val domain = dto.toDomain()

        assertThat(domain.items).hasSize(1)
        val item = domain.items[0]
        assertThat(item.bookingId).isEqualTo("bk-1")
        assertThat(item.overall).isEqualTo(5)
        assertThat(item.punctuality).isEqualTo(5)
        assertThat(item.skill).isEqualTo(4)
        assertThat(item.behaviour).isEqualTo(5)
        assertThat(item.comment).isEqualTo("Excellent")
        assertThat(item.submittedAt).isEqualTo("2026-05-10T09:00:00Z")
        assertThat(item.appealDisputed).isFalse()
    }

    @Test
    public fun `toDomain defaults missing sub-score keys to 0`() {
        val rating =
            ReceivedRatingDto(
                bookingId = "bk-2",
                overall = 4,
                subScores = emptyMap(),
                submittedAt = "2026-05-11T10:00:00Z",
            )
        val dto =
            TechRatingSummaryDto(
                totalCount = 1,
                averageOverall = 4.0,
                averageSubScores = aSubScores(),
                trend = emptyList(),
                items = listOf(rating),
            )

        val domain = dto.toDomain()

        val item = domain.items[0]
        assertThat(item.punctuality).isEqualTo(0)
        assertThat(item.skill).isEqualTo(0)
        assertThat(item.behaviour).isEqualTo(0)
    }

    @Test
    public fun `toDomain maps appealDisputed null as false`() {
        val rating =
            ReceivedRatingDto(
                bookingId = "bk-3",
                overall = 3,
                subScores = mapOf("punctuality" to 3, "skill" to 3, "behaviour" to 3),
                submittedAt = "2026-05-12T08:00:00Z",
                appealDisputed = null,
            )
        val dto =
            TechRatingSummaryDto(
                totalCount = 1,
                averageOverall = 3.0,
                averageSubScores = aSubScores(),
                trend = emptyList(),
                items = listOf(rating),
            )

        assertThat(dto.toDomain().items[0].appealDisputed).isFalse()
    }
}
