package com.homeservices.customer.navigation

internal object BookingRoutes {
    const val BOOKING_GRAPH = "booking"
    const val SLOT_PICKER = "booking/slot/{serviceId}/{categoryId}"
    const val ADDRESS = "booking/address"
    const val SUMMARY = "booking/summary"
    const val CONFIRMED = "booking/confirmed/{bookingId}"

    fun slotPicker(serviceId: String, categoryId: String) = "booking/slot/$serviceId/$categoryId"
    fun confirmedRoute(bookingId: String) = "booking/confirmed/$bookingId"
}
