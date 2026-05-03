package com.homeservices.technician.domain.jobs.model

public data class TechnicianBooking(
    val bookingId: String,
    val serviceId: String,
    val serviceName: String,
    val addressText: String,
    val status: TechnicianBookingStatus,
    val slotDate: String,
    val slotWindow: String,
    val amountPaise: Long,
)

public enum class TechnicianBookingStatus {
    ASSIGNED,
    EN_ROUTE,
    REACHED,
    IN_PROGRESS,
    AWAITING_PRICE_APPROVAL,
    COMPLETED,
    PAID,
    CLOSED,
    UNKNOWN,
}
