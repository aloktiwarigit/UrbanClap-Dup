package com.homeservices.technician.data.payout.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class UpdatePayoutCadenceRequestDto(
    val cadence: String,
)

@JsonClass(generateAdapter = true)
public data class UpdatePayoutCadenceResponseDto(
    val cadence: String,
    val nextPayoutAt: String?,
)
