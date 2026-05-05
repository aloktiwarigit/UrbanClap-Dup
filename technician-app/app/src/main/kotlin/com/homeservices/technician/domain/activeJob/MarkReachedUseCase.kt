package com.homeservices.technician.domain.activeJob

import com.google.firebase.auth.FirebaseAuth
import com.homeservices.technician.data.integrity.IntegrityApiService
import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.integrity.IntegrityAttestor
import com.homeservices.technician.domain.location.CurrentLocationProvider
import com.homeservices.technician.domain.location.LocationFidelity
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Result wrapper that carries the mock-location flag alongside the [Result].
 * The ViewModel uses [isMock] to show a warning Snackbar before (or after)
 * firing the actual transition — the transition itself is NOT blocked.
 */
public data class MarkReachedOutcome(
    val result: Result<ActiveJob>,
    val isMock: Boolean,
)

@Singleton
public class MarkReachedUseCase
    @Inject
    constructor(
        private val repository: ActiveJobRepository,
        private val integrityAttestor: IntegrityAttestor,
        private val integrityApiService: IntegrityApiService,
        private val firebaseAuth: FirebaseAuth,
        private val currentLocationProvider: CurrentLocationProvider,
    ) {
        public suspend operator fun invoke(bookingId: String): MarkReachedOutcome {
            val fidelity: LocationFidelity? =
                runCatching { currentLocationProvider.currentLocation()?.fidelity }.getOrNull()
            val isMock = fidelity?.isMock ?: false

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

            val result = repository.transitionStatus(bookingId, ActiveJobStatus.REACHED, integrityToken)
            return MarkReachedOutcome(result = result, isMock = isMock)
        }
    }
