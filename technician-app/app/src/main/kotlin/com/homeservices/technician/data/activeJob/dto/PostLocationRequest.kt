package com.homeservices.technician.data.activeJob.dto

import com.homeservices.technician.data.activeJob.LocationAttestationDto
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
internal data class PostLocationRequest(
    val lat: Double,
    val lng: Double,
    val accuracyMeters: Double,
    val capturedAt: Long,
    val attestation: LocationAttestationDto? = null,
)
