package com.homeservices.customer.domain.places

public data class ResolvedPlace(
    val placeId: String,
    val formattedAddress: String,
    val lat: Double,
    val lng: Double,
)
