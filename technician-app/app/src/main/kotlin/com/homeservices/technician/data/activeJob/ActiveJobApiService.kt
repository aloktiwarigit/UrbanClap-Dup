package com.homeservices.technician.data.activeJob

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.Path

internal interface ActiveJobApiService {
    @GET("v1/technicians/active-job/{bookingId}")
    suspend fun getActiveJob(
        @Header("Authorization") authHeader: String,
        @Path("bookingId") bookingId: String,
    ): Response<ActiveJobResponse>

    @PATCH("v1/technicians/active-job/{bookingId}/transition")
    suspend fun transitionStatus(
        @Header("Authorization") authHeader: String,
        @Path("bookingId") bookingId: String,
        @Body body: TransitionRequest,
    ): Response<ActiveJobResponse>
}

internal data class ActiveJobResponse(
    val id: String,
    val customerId: String,
    val serviceId: String,
    val serviceName: String,
    val addressText: String,
    val addressLatLng: LatLngDto,
    val status: String,
    val slotDate: String,
    val slotWindow: String,
)

internal data class LatLngDto(val lat: Double, val lng: Double)

internal data class TransitionRequest(val targetStatus: String)
