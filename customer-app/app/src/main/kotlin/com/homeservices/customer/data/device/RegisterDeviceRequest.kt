package com.homeservices.customer.data.device

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/**
 * Request body for POST /v1/devices/register.
 *
 * [appBuild] is optional; the server uses it for analytics and targeted push filtering.
 */
@JsonClass(generateAdapter = true)
public data class RegisterDeviceRequest(
    @Json(name = "deviceToken") val deviceToken: String,
    @Json(name = "platform") val platform: String,
    @Json(name = "appBuild") val appBuild: String? = null,
)
