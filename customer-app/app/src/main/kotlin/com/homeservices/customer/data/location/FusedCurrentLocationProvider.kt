package com.homeservices.customer.data.location

import android.annotation.SuppressLint
import android.util.Log
import com.google.android.gms.location.FusedLocationProviderClient
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
         * Uses [FusedLocationProviderClient.lastLocation] (fast, no GPS-fix wait) rather than
         * `getCurrentLocation`, which may block for the full fused-provider timeout on cold starts.
         * Callers fall back to the sentinel (0.0, 0.0) when this returns `null`.
         */
        @SuppressLint("MissingPermission")
        public suspend fun getLastLocation(): Pair<Double, Double>? =
            try {
                val cached = client.lastLocation.await()
                cached?.let { Pair(it.latitude, it.longitude) }
            } catch (e: SecurityException) {
                Log.w("FusedLocationProvider", "Location permission not granted: ${e.message}")
                null
            }
    }
