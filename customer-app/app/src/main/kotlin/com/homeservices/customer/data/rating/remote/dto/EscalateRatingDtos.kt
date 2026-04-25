package com.homeservices.customer.data.rating.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class EscalateRatingRequestDto(
    val draftOverall: Int,
    val draftComment: String?,
)

@JsonClass(generateAdapter = true)
public data class EscalateRatingResponseDto(
    val complaintId: String,
    val expiresAt: String,
)
