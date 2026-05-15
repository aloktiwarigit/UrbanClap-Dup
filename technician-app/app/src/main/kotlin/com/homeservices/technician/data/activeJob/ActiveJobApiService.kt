package com.homeservices.technician.data.activeJob

import com.squareup.moshi.JsonClass
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.Path

internal interface ActiveJobApiService {
    @GET("v1/technicians/active-job/{bookingId}")
    suspend fun getActiveJob(
        @Path("bookingId") bookingId: String,
    ): Response<ActiveJobResponse>

    @PATCH("v1/technicians/active-job/{bookingId}/transition")
    suspend fun transitionStatus(
        @Path("bookingId") bookingId: String,
        @Body body: TransitionRequest,
        @Header("X-Integrity-Token") integrityToken: String? = null,
    ): Response<ActiveJobResponse>
}

@JsonClass(generateAdapter = true)
internal data class ActiveJobResponse(
    val bookingId: String,
    val customerId: String,
    val serviceId: String,
    val serviceName: String,
    val addressText: String,
    val addressLatLng: LatLngDto,
    val status: String,
    val slotDate: String,
    val slotWindow: String,
)

@JsonClass(generateAdapter = true)
internal data class LatLngDto(
    val lat: Double,
    val lng: Double,
)

@JsonClass(generateAdapter = true)
internal data class LocationAttestationDto(
    val isMock: Boolean,
    val gpsAccuracyM: Float,
)

@JsonClass(generateAdapter = true)
internal data class TransitionRequest(
    val targetStatus: String,
    val currentLocation: LatLngDto? = null,
    val attestation: LocationAttestationDto? = null,
)
