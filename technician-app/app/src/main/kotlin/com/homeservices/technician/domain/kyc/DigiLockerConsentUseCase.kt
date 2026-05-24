package com.homeservices.technician.domain.kyc

import com.homeservices.technician.data.integrity.IntegrityApiService
import com.homeservices.technician.data.kyc.KycRepository
import com.homeservices.technician.domain.integrity.IntegrityAttestor
import com.homeservices.technician.domain.kyc.model.DigiLockerResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

public class DigiLockerConsentUseCase
    @Inject
    internal constructor(
        private val repository: KycRepository,
        private val integrityAttestor: IntegrityAttestor,
        private val integrityApiService: IntegrityApiService,
    ) {
        public operator fun invoke(
            authCode: String,
            redirectUri: String,
        ): Flow<DigiLockerResult> =
            flow {
                // Fetch nonce → attest → attach integrity token (fail-open on errors).
                // Auth on the nonce endpoint is handled by NetworkModule's @AuthOkHttpClient
                // interceptor; no manual token plumbing here.
                val integrityToken: String? =
                    runCatching {
                        val nonce = integrityApiService.getNonce().nonce
                        integrityAttestor.attest(nonce).getOrThrow()
                    }.getOrNull()

                emit(repository.exchangeAadhaarCode(authCode, redirectUri, integrityToken))
            }
    }
