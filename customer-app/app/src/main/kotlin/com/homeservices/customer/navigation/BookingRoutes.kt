package com.homeservices.customer.navigation

internal object BookingRoutes {
    const val BOOKING_GRAPH = "booking"
    const val SLOT_PICKER = "booking/slot/{serviceId}/{categoryId}"
    const val ADDRESS = "booking/address"
    const val SUMMARY = "booking/summary"
    const val CONFIRMED = "booking/confirmed/{bookingId}"

    fun slotPicker(
        serviceId: String,
        categoryId: String,
    ) = "booking/slot/$serviceId/$categoryId"

    fun confirmedRoute(bookingId: String) = "booking/confirmed/$bookingId"

    const val PRICE_APPROVAL = "booking/price-approval/{bookingId}"

    fun priceApprovalRoute(bookingId: String) = "booking/price-approval/$bookingId"

    const val LIVE_TRACKING = "booking/tracking/{bookingId}"

    fun liveTrackingRoute(bookingId: String) = "booking/tracking/$bookingId"
}
