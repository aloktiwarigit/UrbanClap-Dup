package com.homeservices.customer.domain.tracking.model

public data class LiveLocation(
    val lat: Double,
    val lng: Double,
    val etaMinutes: Int,
    val techName: String,
    val techPhotoUrl: String,
)
