package com.homeservices.customer.data.deleteaccount.remote

import com.homeservices.customer.data.deleteaccount.remote.dto.SubmitErasureRequestDto
import com.homeservices.customer.data.deleteaccount.remote.dto.SubmitErasureResponseDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.POST

/**
 * Retrofit interface for the DPDP erasure endpoints.
 *
 * Endpoints confirmed in `api/src/functions/users-erasure-request.ts`:
 *   - POST  `v1/users/me/erasure-request`  (submit)   → 201 | 409
 *   - DELETE `v1/users/me/erasure-request` (revoke)   → 204 | 404
 *
 * NOTE: A dedicated GET active-request endpoint does not exist in this API
 * milestone. The repository emulates it via POST + 409 interception.
 * See [DeleteAccountRepositoryImpl.getActiveErasureRequest].
 */
internal interface ErasureApiService {
    /**
     * Submit an erasure request.
     * Returns a raw [Response] so the repository can inspect the HTTP status code
     * directly (201 vs 409) without Retrofit throwing on non-2xx.
     */
    @POST("v1/users/me/erasure-request")
    suspend fun submitErasureRequest(
        @Body body: SubmitErasureRequestDto,
    ): Response<SubmitErasureResponseDto>

    /**
     * Revoke the active erasure request.
     * Returns a raw [Response] so the repository can distinguish 204 from 404.
     */
    @DELETE("v1/users/me/erasure-request")
    suspend fun revokeErasureRequest(): Response<Unit>
}
