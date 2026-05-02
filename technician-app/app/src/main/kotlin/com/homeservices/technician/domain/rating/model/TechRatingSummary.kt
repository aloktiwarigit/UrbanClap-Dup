package com.homeservices.technician.domain.rating.model

public data class RatingSubScoreAverages(
    val punctuality: Double,
    val skill: Double,
    val behaviour: Double,
)

public data class RatingWeekTrend(
    val weekStart: String,
    val average: Double,
    val count: Int,
)

public data class ReceivedRating(
    val bookingId: String,
    val overall: Int,
    val punctuality: Int,
    val skill: Int,
    val behaviour: Int,
    val comment: String?,
    val submittedAt: String,
    val appealDisputed: Boolean = false,
)

public data class TechRatingSummary(
    val totalCount: Int,
    val averageOverall: Double,
    val averageSubScores: RatingSubScoreAverages,
    val trend: List<RatingWeekTrend>,
    val items: List<ReceivedRating>,
)
