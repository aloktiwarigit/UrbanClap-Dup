package com.homeservices.technician.domain.activeJob

import com.google.firebase.auth.FirebaseAuth
import com.homeservices.technician.data.integrity.IntegrityApiService
import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.integrity.IntegrityAttestor
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class MarkReachedUseCase
    @Inject
    constructor(
        private val repository: ActiveJobRepository,
        private val integrityAttestor: IntegrityAttestor,
        private val integrityApiService: IntegrityApiService,
        private val firebaseAuth: FirebaseAuth,
    ) {
        public suspend operator fun invoke(bookingId: String): Result<ActiveJob> {
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

            return repository.transitionStatus(bookingId, ActiveJobStatus.REACHED, integrityToken)
        }
    }
