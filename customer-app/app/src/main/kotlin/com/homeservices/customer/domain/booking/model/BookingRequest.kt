package com.homeservices.customer.domain.booking.model

public enum class BookingPaymentMethod {
    RAZORPAY,
    CASH_ON_SERVICE,
}

public data class BookingRequest(
    val serviceId: String,
    val categoryId: String,
    val slot: BookingSlot,
    val addressText: String,
    val addressLat: Double,
    val addressLng: Double,
    val paymentMethod: BookingPaymentMethod = BookingPaymentMethod.RAZORPAY,
)
