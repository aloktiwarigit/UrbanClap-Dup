package com.homeservices.customer.domain.tracking.model

public data class TrackingState(
    val location: LiveLocation?,
    val status: BookingStatus,
)
