package com.homeservices.customer.domain.booking.model

public data class BookingRequest(
    val serviceId: String,
    val categoryId: String,
    val slot: BookingSlot,
    val addressText: String,
    val addressLat: Double,
    val addressLng: Double,
)
