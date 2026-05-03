package com.homeservices.customer.domain.booking.model

public data class CustomerBooking(
    val bookingId: String,
    val serviceId: String,
    val serviceName: String,
    val addressText: String,
    val status: CustomerBookingStatus,
    val slotDate: String,
    val slotWindow: String,
    val amountPaise: Long,
    val paymentMethod: BookingPaymentMethod,
    val createdAt: String,
)

public enum class CustomerBookingStatus {
    PENDING_PAYMENT,
    PAID,
    SEARCHING,
    ASSIGNED,
    EN_ROUTE,
    REACHED,
    IN_PROGRESS,
    AWAITING_PRICE_APPROVAL,
    COMPLETED,
    CLOSED,
    UNFULFILLED,
    CUSTOMER_CANCELLED,
    NO_SHOW_REDISPATCH,
    UNKNOWN,
}
