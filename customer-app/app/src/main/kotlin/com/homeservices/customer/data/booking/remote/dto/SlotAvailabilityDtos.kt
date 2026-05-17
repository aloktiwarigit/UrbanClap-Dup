package com.homeservices.customer.data.booking.remote.dto

import com.homeservices.customer.domain.booking.model.SlotWindow
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class SlotDto(
    val window: String,
    val available: Boolean,
) {
    public fun toDomain(): SlotWindow = SlotWindow(window = window, available = available)
}

@JsonClass(generateAdapter = true)
public data class SlotAvailabilityResponseDto(
    val slots: List<SlotDto>,
)
