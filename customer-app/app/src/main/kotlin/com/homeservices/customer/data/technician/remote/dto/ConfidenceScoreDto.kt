package com.homeservices.customer.data.technician.remote.dto

import com.homeservices.customer.domain.technician.model.ConfidenceScore

public data class ConfidenceScoreDto(
    val onTimePercent: Int,
    val areaRating: Double?,
    val nearestEtaMinutes: Int?,
    val dataPointCount: Int,
    val isLimitedData: Boolean,
) {
    public fun toDomain(): ConfidenceScore = ConfidenceScore(
        onTimePercent = onTimePercent,
        areaRating = areaRating,
        nearestEtaMinutes = nearestEtaMinutes,
        dataPointCount = dataPointCount,
        isLimitedData = isLimitedData,
    )
}
