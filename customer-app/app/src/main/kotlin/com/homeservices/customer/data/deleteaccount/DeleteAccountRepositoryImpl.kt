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

        // NOTE: getActiveErasureRequest() (POST-probe strategy) has been intentionally removed.
        // It caused a DPDP-critical defect: the POST returned 201 on first entry, creating an
        // erasure request before the user confirmed anything. The ViewModel now always starts
        // in Idle state. A server-side GET endpoint is tracked for a future sprint.

        private fun parseConflict(raw: String): ErasureConflictDto? =
            runCatching {
                moshi.adapter(ErasureConflictDto::class.java).fromJson(raw)
            }.getOrNull()
    }
