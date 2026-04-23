package com.homeservices.technician.data.jobOffer

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.Path

internal interface JobOfferApiService {
    @PATCH("v1/technicians/job-offers/{bookingId}/accept")
    suspend fun acceptOffer(
        @Header("Authorization") authHeader: String,
        @Path("bookingId") bookingId: String,
    ): Response<Unit>

    @PATCH("v1/technicians/job-offers/{bookingId}/decline")
    suspend fun declineOffer(
        @Header("Authorization") authHeader: String,
        @Path("bookingId") bookingId: String,
    ): Response<Unit>

    @PATCH("v1/technicians/fcm-token")
    suspend fun syncFcmToken(
        @Header("Authorization") authHeader: String,
        @Body body: FcmTokenRequest,
    ): Response<Unit>
}

internal data class FcmTokenRequest(
    val fcmToken: String,
)
