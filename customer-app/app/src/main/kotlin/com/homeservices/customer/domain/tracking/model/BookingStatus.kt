package com.homeservices.customer.domain.tracking.model

public sealed class BookingStatus {
    public object EnRoute : BookingStatus()

    public object Reached : BookingStatus()

    public object InProgress : BookingStatus()

    public object Completed : BookingStatus()

    public object Cancelled : BookingStatus()

    public object Closed : BookingStatus()

    public object Unknown : BookingStatus()

    public companion object {
        public fun fromFcmString(value: String): BookingStatus =
            when (value) {
                "EN_ROUTE" -> EnRoute
                "REACHED" -> Reached
                "IN_PROGRESS" -> InProgress
                "COMPLETED" -> Completed
                "CANCELLED" -> Cancelled
                "CLOSED" -> Closed
                else -> Unknown
            }
    }
}
