package com.homeservices.technician.data.integrity

import com.squareup.moshi.JsonClass
import retrofit2.http.GET

internal interface IntegrityApiService {
    @GET("v1/integrity/nonce")
    public suspend fun getNonce(): IntegrityNonceResponseDto
}

@JsonClass(generateAdapter = true)
public data class IntegrityNonceResponseDto(
    val nonce: String,
)
