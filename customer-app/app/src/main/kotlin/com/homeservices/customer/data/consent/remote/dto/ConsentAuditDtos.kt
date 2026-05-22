package com.homeservices.customer.data.consent.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class ConsentAuditRequestDto(
    @Json(name = "action") val action: String,
    @Json(name = "version") val version: Int,
    @Json(name = "timestamp") val timestamp: String,
    @Json(name = "analytics_opt_in") val analyticsOptIn: Boolean,
    @Json(name = "crash_opt_in") val crashOptIn: Boolean,
    @Json(name = "marketing_opt_in") val marketingOptIn: Boolean,
)
