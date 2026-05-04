package com.homeservices.customer.data.integrity

import retrofit2.http.GET

public interface IntegrityApiService {
    @GET("v1/integrity/nonce")
    public suspend fun getNonce(): IntegrityNonceResponseDto
}

public data class IntegrityNonceResponseDto(
    val nonce: String,
)
