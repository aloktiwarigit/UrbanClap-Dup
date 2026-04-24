package com.homeservices.customer.domain.technician.model

public data class ConfidenceScore(
    val onTimePercent: Int,
    val areaRating: Double?,
    val nearestEtaMinutes: Int?,
    val dataPointCount: Int,
    val isLimitedData: Boolean,
)
