package com.homeservices.technician.domain.photo.model

public data class JobPhoto(
    val bookingId: String,
    val stage: String,
    val remoteUrl: String,
    val uploadedAt: Long,
)
