package com.homeservices.technician.data.erasure.remote

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.POST

public interface ErasureApiService {
    @POST("v1/users/me/erasure-request")
    public suspend fun submitErasureRequest(
        @Body body: ErasureSubmitRequestBody,
    ): Response<ErasureSubmitResponseBody>

    @DELETE("v1/users/me/erasure-request")
    public suspend fun revokeErasureRequest(): Response<Unit>
}

public data class ErasureSubmitRequestBody(
    val confirmationPhrase: String,
    val reason: String? = null,
)

public data class ErasureSubmitResponseBody(
    val erasureId: String,
    val scheduledDeletionAt: String,
    val status: String,
)
