package com.homeservices.customer.data.device

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.Header
import retrofit2.http.POST

/**
 * Retrofit interface for device-token registration endpoints.
 *
 * Authentication is handled by the shared [AuthOkHttpClient] interceptor which
 * attaches a Firebase Bearer token to every request.
 *
 * - POST /v1/devices/register  — register or refresh a device token
 * - DELETE /v1/devices/me      — de-register a token on sign-out; token sent as X-Device-Token header
 */
public interface DeviceApi {
    @POST("v1/devices/register")
    public suspend fun registerDevice(
        @Body body: RegisterDeviceRequest,
    )

    @DELETE("v1/devices/me")
    public suspend fun unregisterDevice(
        @Header("X-Device-Token") deviceToken: String,
    )
}
