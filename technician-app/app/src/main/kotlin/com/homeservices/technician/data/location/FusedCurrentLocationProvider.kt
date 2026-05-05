package com.homeservices.technician.data.location

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.homeservices.technician.domain.activeJob.model.LatLng
import com.homeservices.technician.domain.location.CurrentLocationProvider
import com.homeservices.technician.domain.location.LocationFidelity
import com.homeservices.technician.domain.location.LocationWithFidelity
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class FusedCurrentLocationProvider
    @Inject
    internal constructor(
        @ApplicationContext private val context: Context,
    ) : CurrentLocationProvider {
        @SuppressLint("MissingPermission")
        override suspend fun currentLocation(): LocationWithFidelity? {
            if (!hasLocationPermission()) return null
            val client = LocationServices.getFusedLocationProviderClient(context)
            val current =
                runCatching {
                    client
                        .getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, null)
                        .await()
                }.getOrNull()
            val location = current ?: runCatching { client.lastLocation.await() }.getOrNull()
            return location?.let {
                val isMock =
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        it.isMock
                    } else {
                        @Suppress("DEPRECATION")
                        it.isFromMockProvider
                    }
                LocationWithFidelity(
                    latLng = LatLng(lat = it.latitude, lng = it.longitude),
                    fidelity = LocationFidelity(isMock = isMock, accuracyMetres = it.accuracy),
                )
            }
        }

        private fun hasLocationPermission(): Boolean =
            ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
                ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
    }
