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

private const val HTTP_CREATED = 201
private const val HTTP_NO_CONTENT = 204
private const val HTTP_CONFLICT = 409
private const val HTTP_NOT_FOUND = 404

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
                    HTTP_CREATED -> {
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
                    HTTP_CONFLICT -> {
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
                    HTTP_NO_CONTENT -> Unit
                    HTTP_NOT_FOUND -> throw NoActiveErasureRequestException()
                    else -> error("Unexpected HTTP ${response.code()} from erasure-request DELETE")
                }
            }

        // NOTE: getActiveErasureRequest() (POST-probe strategy) has been intentionally removed.
        // It caused a DPDP-critical defect: the POST returned 201 on first entry, creating an
        // erasure request before the user confirmed anything. The ViewModel now always starts
        // in Idle state. A server-side GET endpoint is tracked for a future sprint.

        private fun parseConflict(raw: String): ErasureConflictDto? =
            runCatching {
                moshi.adapter(ErasureConflictDto::class.java).fromJson(raw)
            }.getOrNull()
    }
