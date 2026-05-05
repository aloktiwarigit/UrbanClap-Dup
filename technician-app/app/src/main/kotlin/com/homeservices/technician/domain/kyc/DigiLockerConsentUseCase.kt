package com.homeservices.technician.domain.kyc

import com.google.firebase.auth.FirebaseAuth
import com.homeservices.technician.data.integrity.IntegrityApiService
import com.homeservices.technician.data.kyc.KycRepository
import com.homeservices.technician.domain.integrity.IntegrityAttestor
import com.homeservices.technician.domain.kyc.model.DigiLockerResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

public class DigiLockerConsentUseCase
    @Inject
    constructor(
        private val repository: KycRepository,
        private val integrityAttestor: IntegrityAttestor,
        private val integrityApiService: IntegrityApiService,
        private val firebaseAuth: FirebaseAuth,
    ) {
        public operator fun invoke(
            authCode: String,
            redirectUri: String,
        ): Flow<DigiLockerResult> =
            flow {
                // Fetch nonce → attest → attach integrity token (fail-open on errors)
                val integrityToken: String? =
                    runCatching {
                        val token =
                            firebaseAuth.currentUser
                                ?.getIdToken(false)
                                ?.await()
                                ?.token
                        val nonce =
                            if (token != null) {
                                integrityApiService.getNonce("Bearer $token").nonce
                            } else {
                                integrityApiService.getNonce("").nonce
                            }
                        integrityAttestor.attest(nonce).getOrThrow()
                    }.getOrNull()

                emit(repository.exchangeAadhaarCode(authCode, redirectUri, integrityToken))
            }
    }
