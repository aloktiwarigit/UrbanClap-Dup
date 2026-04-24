package com.homeservices.customer.data.tracking

internal sealed class TrackingEvent {
    internal abstract val bookingId: String

    internal data class LocationUpdate(
        override val bookingId: String,
        internal val lat: Double,
        internal val lng: Double,
        internal val etaMinutes: Int,
        internal val techName: String,
        internal val techPhotoUrl: String,
    ) : TrackingEvent()

    internal data class StatusUpdate(
        override val bookingId: String,
        internal val status: String,
    ) : TrackingEvent()
}
