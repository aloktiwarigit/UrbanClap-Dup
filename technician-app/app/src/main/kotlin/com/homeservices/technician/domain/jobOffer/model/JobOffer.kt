package com.homeservices.technician.domain.jobOffer.model

public data class JobOffer(
    val bookingId: String,
    val serviceId: String,
    val serviceName: String,
    val addressText: String,
    val slotDate: String,
    val slotWindow: String,
    val amountPaise: Long,
    val distanceKm: Double,
    val expiresAtMs: Long,
)
