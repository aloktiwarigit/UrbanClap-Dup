package com.homeservices.customer.data.tracking

public data class LocationUpdateEvent(
    public val bookingId: String,
    public val lat: Double,
    public val lng: Double,
    public val capturedAt: Long,
)
