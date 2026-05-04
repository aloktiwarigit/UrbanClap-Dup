package com.homeservices.technician.domain.location

import com.homeservices.technician.domain.activeJob.model.LatLng

public interface CurrentLocationProvider {
    public suspend fun currentLocation(): LatLng?
}
