package com.homeservices.customer.data.tracking

internal sealed class TrackingEvent {
    abstract val bookingId: String

    internal data class LocationUpdate(
        override val bookingId: String,
        val lat: Double,
        val lng: Double,
        val etaMinutes: Int,
        val techName: String,
        val techPhotoUrl: String,
    ) : TrackingEvent()

    internal data class StatusUpdate(
        override val bookingId: String,
        val status: String,
    ) : TrackingEvent()
}
