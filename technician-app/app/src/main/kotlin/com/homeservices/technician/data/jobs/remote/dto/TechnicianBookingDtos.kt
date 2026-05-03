package com.homeservices.technician.data.jobs.remote.dto

import com.homeservices.technician.domain.jobs.model.TechnicianBooking
import com.homeservices.technician.domain.jobs.model.TechnicianBookingStatus

internal data class TechnicianBookingsResponseDto(
    val bookings: List<TechnicianBookingDto> = emptyList(),
)

internal data class TechnicianBookingDto(
    val bookingId: String,
    val serviceId: String,
    val serviceName: String,
    val addressText: String,
    val status: String,
    val slotDate: String,
    val slotWindow: String,
    val amount: Long,
) {
    fun toDomain(): TechnicianBooking =
        TechnicianBooking(
            bookingId = bookingId,
            serviceId = serviceId,
            serviceName = serviceName,
            addressText = addressText,
            status =
                runCatching {
                    TechnicianBookingStatus.valueOf(status)
                }.getOrDefault(TechnicianBookingStatus.UNKNOWN),
            slotDate = slotDate,
            slotWindow = slotWindow,
            amountPaise = amount,
        )
}
