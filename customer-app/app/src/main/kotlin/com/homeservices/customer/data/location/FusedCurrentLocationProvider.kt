package com.homeservices.customer.data.location

import android.annotation.SuppressLint
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.Priority
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

/**
 * Thin wrapper around [FusedLocationProviderClient] that returns the device's last
 * known location as a (lat, lng) pair, or `null` when the location is unavailable
 * (permission denied, GPS off, or no cached fix).
 *
 * Callers must handle `null` by falling back to a sentinel value such as (0.0, 0.0).
 */
public class FusedCurrentLocationProvider
    @Inject
    constructor(
        private val client: FusedLocationProviderClient,
    ) {
        /**
         * Returns the last cached (latitude, longitude) pair, or `null` if the device has no
         * last-known location or if a [SecurityException] is thrown (permission not granted).
         *
         * This function is a suspend function backed by [FusedLocationProviderClient.getLastLocation].
         * It never throws; a [SecurityException] is caught and treated as `null`.
         */
        @SuppressLint("MissingPermission")
        public suspend fun getLastLocation(): Pair<Double, Double>? =
            try {
                val location =
                    client.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, null).await()
                        ?: client.lastLocation.await()
                location?.let { Pair(it.latitude, it.longitude) }
            } catch (e: SecurityException) {
                null
            }
    }
