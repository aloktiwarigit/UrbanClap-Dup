package com.homeservices.technician.data.jobOffer

import com.squareup.moshi.JsonClass
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.PATCH
import retrofit2.http.Path

internal interface JobOfferApiService {
    @PATCH("v1/technicians/job-offers/{bookingId}/accept")
    suspend fun acceptOffer(
        @Path("bookingId") bookingId: String,
    ): Response<Unit>

    @PATCH("v1/technicians/job-offers/{bookingId}/decline")
    suspend fun declineOffer(
        @Path("bookingId") bookingId: String,
    ): Response<Unit>

    @PATCH("v1/technicians/fcm-token")
    suspend fun syncFcmToken(
        @Body body: FcmTokenRequest,
    ): Response<Unit>
}

@JsonClass(generateAdapter = true)
internal data class FcmTokenRequest(
    val fcmToken: String,
)
