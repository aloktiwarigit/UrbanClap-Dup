package com.homeservices.technician.data.rating.remote.dto

import com.homeservices.technician.domain.rating.model.RatingSubScoreAverages
import com.homeservices.technician.domain.rating.model.RatingWeekTrend
import com.homeservices.technician.domain.rating.model.ReceivedRating
import com.homeservices.technician.domain.rating.model.TechRatingSummary
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class ReceivedRatingDto(
    val bookingId: String,
    val overall: Int,
    val subScores: Map<String, Int>,
    val comment: String? = null,
    val submittedAt: String,
)

@JsonClass(generateAdapter = true)
public data class RatingWeekTrendDto(
    val weekStart: String,
    val average: Double,
    val count: Int,
)

@JsonClass(generateAdapter = true)
public data class AverageSubScoresDto(
    val punctuality: Double,
    val skill: Double,
    val behaviour: Double,
)

@JsonClass(generateAdapter = true)
public data class TechRatingSummaryDto(
    val totalCount: Int,
    val averageOverall: Double,
    val averageSubScores: AverageSubScoresDto,
    val trend: List<RatingWeekTrendDto>,
    val items: List<ReceivedRatingDto>,
) {
    public fun toDomain(): TechRatingSummary = TechRatingSummary(
        totalCount = totalCount,
        averageOverall = averageOverall,
        averageSubScores = RatingSubScoreAverages(
            punctuality = averageSubScores.punctuality,
            skill = averageSubScores.skill,
            behaviour = averageSubScores.behaviour,
        ),
        trend = trend.map { RatingWeekTrend(it.weekStart, it.average, it.count) },
        items = items.map {
            ReceivedRating(
                bookingId = it.bookingId,
                overall = it.overall,
                punctuality = it.subScores["punctuality"] ?: 0,
                skill = it.subScores["skill"] ?: 0,
                behaviour = it.subScores["behaviour"] ?: 0,
                comment = it.comment,
                submittedAt = it.submittedAt,
            )
        },
    )
}
