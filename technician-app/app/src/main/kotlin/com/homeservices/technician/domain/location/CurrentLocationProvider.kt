package com.homeservices.technician.domain.location

public interface CurrentLocationProvider {
    /**
     * Returns the current device location together with fidelity metadata
     * (mock-location flag + GPS accuracy in metres), or null if permission
     * is denied or no location fix is available.
     */
    public suspend fun currentLocation(): LocationWithFidelity?
}
