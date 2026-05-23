package com.homeservices.customer.data.deleteaccount.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/**
 * DTO for `POST /v1/users/me/erasure-request` request body.
 * The `reason` field is optional — the server accepts an empty object `{}`.
 */
@JsonClass(generateAdapter = true)
internal data class SubmitErasureRequestDto(
    @Json(name = "reason") val reason: String? = null,
)

/**
 * DTO for `POST /v1/users/me/erasure-request` 201 response.
 *
 * Server shape (from `users-erasure-request.ts`):
 * ```json
 * { "erasureId": "pending:{uid}", "scheduledDeletionAt": "<ISO-8601>", "status": "PENDING" }
 * ```
 */
@JsonClass(generateAdapter = true)
internal data class SubmitErasureResponseDto(
    @Json(name = "erasureId") val erasureId: String,
    @Json(name = "scheduledDeletionAt") val scheduledDeletionAt: String,
    @Json(name = "status") val status: String,
)

/**
 * DTO for `POST /v1/users/me/erasure-request` 409 response body.
 * Used to extract the existing erasureId when a request is already pending.
 */
@JsonClass(generateAdapter = true)
internal data class ErasureConflictDto(
    @Json(name = "code") val code: String,
    @Json(name = "erasureId") val erasureId: String?,
)
