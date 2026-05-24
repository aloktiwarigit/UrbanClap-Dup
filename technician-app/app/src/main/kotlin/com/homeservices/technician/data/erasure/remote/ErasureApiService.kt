package com.homeservices.technician.data.erasure.remote

import com.squareup.moshi.JsonClass
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.POST

internal interface ErasureApiService {
    @POST("v1/users/me/erasure-request")
    public suspend fun submitErasureRequest(
        @Body body: ErasureSubmitRequestBody,
    ): Response<ErasureSubmitResponseBody>

    @DELETE("v1/users/me/erasure-request")
    public suspend fun revokeErasureRequest(): Response<Unit>
}

@JsonClass(generateAdapter = true)
public data class ErasureSubmitRequestBody(
    val confirmationPhrase: String,
    val reason: String? = null,
)

@JsonClass(generateAdapter = true)
public data class ErasureSubmitResponseBody(
    val erasureId: String,
    val scheduledDeletionAt: String,
    val status: String,
)
