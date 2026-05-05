package com.homeservices.technician.data.integrity

import retrofit2.http.GET
import retrofit2.http.Header

public interface IntegrityApiService {
    @GET("v1/integrity/nonce")
    public suspend fun getNonce(
        @Header("Authorization") authHeader: String,
    ): IntegrityNonceResponseDto
}

public data class IntegrityNonceResponseDto(
    val nonce: String,
)
