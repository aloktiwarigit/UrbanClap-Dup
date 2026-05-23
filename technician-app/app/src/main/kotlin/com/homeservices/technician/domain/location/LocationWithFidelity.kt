package com.homeservices.technician.domain.location

import com.homeservices.technician.domain.activeJob.model.LatLng

public data class LocationWithFidelity(
    val latLng: LatLng,
    val fidelity: LocationFidelity,
)
