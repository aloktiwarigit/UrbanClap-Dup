package com.homeservices.customer.data.places

import android.content.Context
import android.location.Geocoder
import com.homeservices.customer.domain.places.ReverseGeocoder
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Locale
import javax.inject.Inject

public class AndroidReverseGeocoder
    @Inject
    constructor(
        @ApplicationContext private val context: Context,
    ) : ReverseGeocoder {
        @Suppress("DEPRECATION")
        override suspend fun reverseGeocode(
            lat: Double,
            lng: Double,
        ): Result<String?> =
            runCatching {
                withContext(Dispatchers.IO) {
                    if (!Geocoder.isPresent()) return@withContext null
                    Geocoder(context, Locale.getDefault())
                        .getFromLocation(lat, lng, 1)
                        .orEmpty()
                        .firstOrNull()
                        ?.getAddressLine(0)
                }
            }
    }
