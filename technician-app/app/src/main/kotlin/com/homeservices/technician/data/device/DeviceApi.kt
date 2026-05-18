package com.homeservices.technician.data.device

import com.squareup.moshi.JsonClass
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.POST
import retrofit2.http.Path

public interface DeviceApi {
    @POST("v1/technician/devices/register")
    public suspend fun registerToken(
        @Body body: RegisterDeviceTokenRequest,
    ): Response<Unit>

    @DELETE("v1/technician/devices/{deviceToken}")
    public suspend fun unregisterToken(
        @Path("deviceToken") deviceToken: String,
    ): Response<Unit>
}

@JsonClass(generateAdapter = true)
public data class RegisterDeviceTokenRequest(
    public val deviceToken: String,
    public val platform: String,
    public val appBuild: String? = null,
)
