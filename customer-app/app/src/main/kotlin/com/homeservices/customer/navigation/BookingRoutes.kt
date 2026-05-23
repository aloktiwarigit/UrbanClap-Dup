package com.homeservices.customer.navigation

internal object BookingRoutes {
    const val BOOKING_GRAPH = "booking"
    const val SLOT_PICKER = "booking/slot/{serviceId}/{categoryId}"
    const val ADDRESS = "booking/address"
    const val ADDRESS_PICKER = "booking/address-picker/{serviceId}"
    const val WAITLIST = "booking/waitlist?lat={lat}&lng={lng}&serviceId={serviceId}"
    const val SUMMARY = "booking/summary"
    const val CONFIRMED = "booking/confirmed/{bookingId}/{appliedCredit}"

    fun slotPicker(
        serviceId: String,
        categoryId: String,
    ) = "booking/slot/$serviceId/$categoryId"

    fun addressPicker(serviceId: String) = "booking/address-picker/$serviceId"

    fun waitlist(
        lat: Double,
        lng: Double,
        serviceId: String,
    ) = "booking/waitlist?lat=$lat&lng=$lng&serviceId=$serviceId"

    fun confirmedRoute(
        bookingId: String,
        appliedCredit: Int = 0,
    ) = "booking/confirmed/$bookingId/$appliedCredit"

    const val PRICE_APPROVAL = "booking/price-approval/{bookingId}"

    fun priceApprovalRoute(bookingId: String) = "booking/price-approval/$bookingId"

    const val LIVE_TRACKING = "booking/tracking/{bookingId}"

    fun liveTrackingRoute(bookingId: String) = "booking/tracking/$bookingId"

    const val RESUME_PAYMENT = "booking/resume/{bookingId}/{orderId}/{amount}"

    fun resumePaymentRoute(
        bookingId: String,
        orderId: String,
        amount: Int,
    ) = "booking/resume/$bookingId/$orderId/$amount"
}
