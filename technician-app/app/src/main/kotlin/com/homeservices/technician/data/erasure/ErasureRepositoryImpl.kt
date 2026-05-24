package com.homeservices.technician.data.erasure

import com.homeservices.technician.data.erasure.remote.ErasureApiService
import com.homeservices.technician.data.erasure.remote.ErasureSubmitRequestBody
import com.homeservices.technician.domain.erasure.ErasureRepository
import com.homeservices.technician.domain.erasure.ErasureSubmitResult
import javax.inject.Inject

private const val CONFIRMATION_PHRASE = "DELETE MY ACCOUNT"
private const val HTTP_CONFLICT = 409

public class ErasureRepositoryImpl
    @Inject
    internal constructor(
        private val api: ErasureApiService,
    ) : ErasureRepository {
        public override suspend fun submitRequest(reason: String?): ErasureSubmitResult =
            runCatching {
                val response =
                    api.submitErasureRequest(
                        ErasureSubmitRequestBody(confirmationPhrase = CONFIRMATION_PHRASE, reason = reason),
                    )
                when {
                    response.isSuccessful -> {
                        val body = checkNotNull(response.body()) { "Null body on 2xx" }
                        ErasureSubmitResult.Success(body.scheduledDeletionAt)
                    }
                    response.code() == HTTP_CONFLICT -> {
                        val raw = response.errorBody()?.string() ?: ""
                        if (raw.contains("ACTIVE_JOB_EXISTS")) {
                            ErasureSubmitResult.ActiveJobExists
                        } else {
                            ErasureSubmitResult.DuplicatePending
                        }
                    }
                    else -> ErasureSubmitResult.UnknownError("HTTP ${response.code()}")
                }
            }.getOrElse { e -> ErasureSubmitResult.UnknownError(e.message ?: "Unknown") }

        public override suspend fun revokeRequest(): Result<Unit> =
            runCatching {
                val response = api.revokeErasureRequest()
                if (!response.isSuccessful) {
                    error("Revoke failed: HTTP ${response.code()}")
                }
            }
    }
