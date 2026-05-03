package com.homeservices.customer.domain.booking.model

public data class BookingResult(
    val bookingId: String,
    val razorpayOrderId: String,
    val amount: Int,
    val requiresPayment: Boolean = true,
    val paymentMethod: BookingPaymentMethod = BookingPaymentMethod.RAZORPAY,
)
