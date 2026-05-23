package com.homeservices.customer.data.auth.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class TruecallerVerifyRequest(
    val payload: String,
    val signature: String,
    val signatureAlgorithm: String,
    val fcmToken: String? = null,
)
