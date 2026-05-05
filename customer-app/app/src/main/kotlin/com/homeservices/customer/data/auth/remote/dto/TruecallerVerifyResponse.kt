package com.homeservices.customer.data.auth.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class TruecallerVerifyResponse(
    val firebaseCustomToken: String,
    val sessionExpiresAt: Long,
)
