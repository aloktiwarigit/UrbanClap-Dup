package com.homeservices.technician.domain.activeJob.model

public data class ActiveJob(
    val bookingId: String,
    val customerId: String,
    val serviceId: String,
    val serviceName: String,
    val addressText: String,
    val addressLatLng: LatLng,
    val status: ActiveJobStatus,
    val slotDate: String,
    val slotWindow: String,
)
