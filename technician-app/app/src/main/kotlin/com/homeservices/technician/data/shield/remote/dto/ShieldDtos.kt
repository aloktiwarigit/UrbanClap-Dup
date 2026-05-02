package com.homeservices.technician.data.shield.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class ShieldReportRequestDto(
    val bookingId: String,
    val description: String?,
)

@JsonClass(generateAdapter = true)
public data class ShieldReportResponseDto(
    val complaintId: String,
)

@JsonClass(generateAdapter = true)
public data class RatingAppealRequestDto(
    val bookingId: String,
    val reason: String,
)

@JsonClass(generateAdapter = true)
public data class RatingAppealResponseDto(
    val appealId: String,
)

@JsonClass(generateAdapter = true)
public data class AppealQuotaErrorDto(
    val code: String,
    val nextAvailableAt: String?,
)
