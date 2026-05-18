package com.homeservices.customer.domain.places

public interface ReverseGeocoder {
    public suspend fun reverseGeocode(lat: Double, lng: Double): Result<String?>
}
