package com.homeservices.technician.data.device

import com.squareup.moshi.JsonClass
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.POST

internal interface DeviceApi {
    @POST("v1/technicians/me/device-tokens")
    suspend fun registerToken(
        @Body body: RegisterDeviceTokenRequest,
    ): Response<Unit>

    @DELETE("v1/technicians/me/device-tokens/current")
    suspend fun unregisterToken(): Response<Unit>
}

@JsonClass(generateAdapter = true)
internal data class RegisterDeviceTokenRequest(
    val fcmToken: String,
    val platform: String,
)
