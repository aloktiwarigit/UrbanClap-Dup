package com.homeservices.technician.data.device

import com.squareup.moshi.JsonClass
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.POST
import retrofit2.http.Path

internal interface DeviceApi {
    @POST("v1/technician/devices/register")
    suspend fun registerToken(
        @Body body: RegisterDeviceTokenRequest,
    ): Response<Unit>

    @DELETE("v1/technician/devices/{deviceToken}")
    suspend fun unregisterToken(
        @Path("deviceToken") deviceToken: String,
    ): Response<Unit>
}

@JsonClass(generateAdapter = true)
internal data class RegisterDeviceTokenRequest(
    val deviceToken: String,
    val platform: String,
    val appBuild: String? = null,
)
