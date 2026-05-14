package com.homeservices.customer.navigation

internal object BookingRoutes {
    const val BOOKING_GRAPH = "booking"
    const val SLOT_PICKER = "booking/slot/{serviceId}/{categoryId}"
    const val ADDRESS = "booking/address"
    const val SUMMARY = "booking/summary"
    /**
     * Booking confirmed route with an optional `techId` query parameter.
     *
     * E11-S05b-1: techId is nullable — at booking confirmation the technician is not yet
     * assigned. The parameter is wired so dispatch stories can pass it later without
     * changing the route signature.
     */
    const val CONFIRMED = "booking/confirmed/{bookingId}?techId={techId}"

    fun slotPicker(
        serviceId: String,
        categoryId: String,
    ) = "booking/slot/$serviceId/$categoryId"

    /** Navigate to confirmed screen without a technician (default flow). */
    fun confirmedRoute(bookingId: String): String = "booking/confirmed/$bookingId"

    /** Navigate to confirmed screen with an already-known technician id. */
    fun confirmedRoute(
        bookingId: String,
        technicianId: String,
    ): String = "booking/confirmed/$bookingId?techId=$technicianId"

    const val PRICE_APPROVAL = "booking/price-approval/{bookingId}"

    fun priceApprovalRoute(bookingId: String) = "booking/price-approval/$bookingId"

    const val LIVE_TRACKING = "booking/tracking/{bookingId}"

    fun liveTrackingRoute(bookingId: String) = "booking/tracking/$bookingId"
}
