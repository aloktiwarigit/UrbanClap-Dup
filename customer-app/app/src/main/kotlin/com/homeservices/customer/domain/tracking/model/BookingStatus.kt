package com.homeservices.customer.domain.tracking.model

public sealed class BookingStatus {
    public object PendingPayment : BookingStatus()

    public object Paid : BookingStatus()

    public object Searching : BookingStatus()

    public object Assigned : BookingStatus()

    public object EnRoute : BookingStatus()

    public object Reached : BookingStatus()

    public object InProgress : BookingStatus()

    public object Completed : BookingStatus()

    public object AwaitingPriceApproval : BookingStatus()

    public object Cancelled : BookingStatus()

    public object Closed : BookingStatus()

    public object Unfulfilled : BookingStatus()

    public object Unknown : BookingStatus()

    public companion object {
        public fun fromFcmString(value: String): BookingStatus =
            when (value) {
                "PENDING_PAYMENT" -> PendingPayment
                "PAID" -> Paid
                "SEARCHING" -> Searching
                "ASSIGNED" -> Assigned
                "EN_ROUTE" -> EnRoute
                "REACHED" -> Reached
                "IN_PROGRESS" -> InProgress
                "AWAITING_PRICE_APPROVAL" -> AwaitingPriceApproval
                "COMPLETED" -> Completed
                "CUSTOMER_CANCELLED", "CANCELLED" -> Cancelled
                "UNFULFILLED" -> Unfulfilled
                "NO_SHOW_REDISPATCH" -> Searching
                "CLOSED" -> Closed
                else -> Unknown
            }
    }
}
