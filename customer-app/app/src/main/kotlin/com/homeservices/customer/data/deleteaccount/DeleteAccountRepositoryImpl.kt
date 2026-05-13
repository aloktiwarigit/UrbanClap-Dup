package com.homeservices.customer.data.deleteaccount

import com.homeservices.customer.data.deleteaccount.remote.ErasureApiService
import com.homeservices.customer.data.deleteaccount.remote.dto.ErasureConflictDto
import com.homeservices.customer.data.deleteaccount.remote.dto.SubmitErasureRequestDto
import com.homeservices.customer.domain.deleteaccount.DeleteAccountRepository
import com.homeservices.customer.domain.deleteaccount.ErasureAlreadyPendingException
import com.homeservices.customer.domain.deleteaccount.NoActiveErasureRequestException
import com.homeservices.customer.domain.deleteaccount.model.ErasureRequest
import com.squareup.moshi.Moshi
import javax.inject.Inject

internal class DeleteAccountRepositoryImpl
    @Inject
    constructor(
        private val api: ErasureApiService,
        private val moshi: Moshi,
    ) : DeleteAccountRepository {
        override suspend fun submitErasureRequest(reason: String?): Result<ErasureRequest> =
            runCatching {
                val response = api.submitErasureRequest(SubmitErasureRequestDto(reason = reason))
                when (response.code()) {
                    201 -> {
                        val body =
                            checkNotNull(response.body()) {
                                "Empty body on 201 erasure response"
                            }
                        ErasureRequest(
                            requestId = body.erasureId,
                            scheduledDeletionAt = body.scheduledDeletionAt,
                            status = body.status,
                        )
                    }
                    409 -> {
                        val rawError = response.errorBody()?.string() ?: ""
                        val conflictDto = parseConflict(rawError)
                        throw ErasureAlreadyPendingException(
                            erasureId = conflictDto?.erasureId ?: "unknown",
                        )
                    }
                    else -> {
                        error("Unexpected HTTP ${response.code()} from erasure-request POST")
                    }
                }
            }

        override suspend fun revokeErasureRequest(): Result<Unit> =
            runCatching {
                val response = api.revokeErasureRequest()
                when (response.code()) {
                    204 -> Unit
                    404 -> throw NoActiveErasureRequestException()
                    else -> error("Unexpected HTTP ${response.code()} from erasure-request DELETE")
                }
            }

        /**
         * The API does not expose a dedicated GET active endpoint in this milestone.
         *
         * Strategy: attempt a POST with no reason.
         * - 201 → a new request was created (no active one existed); we parse and return it.
         *   Note: This side-effects a new erasure request. Callers must use this method
         *   ONLY on the entry screen if no prior requestId is cached locally.
         * - 409 → existing pending request; parse the conflict body to get the erasureId.
         *   We cannot recover `scheduledDeletionAt` from this response — return `null`
         *   for that field and let the UI prompt the user to wait.
         *
         * This workaround will be replaced when the GET endpoint ships (tracked in backlog).
         */
        override suspend fun getActiveErasureRequest(): Result<ErasureRequest?> =
            runCatching {
                val response = api.submitErasureRequest(SubmitErasureRequestDto(reason = null))
                when (response.code()) {
                    201 -> {
                        // No prior active request — one was just created.
                        val body =
                            checkNotNull(response.body()) {
                                "Empty body on 201 erasure response"
                            }
                        ErasureRequest(
                            requestId = body.erasureId,
                            scheduledDeletionAt = body.scheduledDeletionAt,
                            status = body.status,
                        )
                    }
                    409 -> {
                        val rawError = response.errorBody()?.string() ?: ""
                        val conflictDto = parseConflict(rawError)
                        if (conflictDto?.code == "ERASURE_REQUEST_PENDING") {
                            // Active pending request exists; scheduledDeletionAt unknown from 409.
                            ErasureRequest(
                                requestId = conflictDto.erasureId ?: "unknown",
                                scheduledDeletionAt = "",
                                status = "PENDING",
                            )
                        } else {
                            // USER_ALREADY_ERASED or other non-pending conflict — treat as none.
                            null
                        }
                    }
                    else -> error("Unexpected HTTP ${response.code()} from erasure-request GET-active probe")
                }
            }

        private fun parseConflict(raw: String): ErasureConflictDto? =
            runCatching {
                moshi.adapter(ErasureConflictDto::class.java).fromJson(raw)
            }.getOrNull()
    }
