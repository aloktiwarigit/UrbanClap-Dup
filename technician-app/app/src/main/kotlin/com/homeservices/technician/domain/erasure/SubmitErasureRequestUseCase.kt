package com.homeservices.technician.domain.erasure

import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class SubmitErasureRequestUseCase
    @Inject
    constructor(
        private val erasureRepository: ErasureRepository,
        private val activeJobRepository: ActiveJobRepository,
    ) {
        public suspend operator fun invoke(reason: String? = null): ErasureSubmitResult {
            // Fast-path: activeJobState is non-null only while observing an active job.
            // The server gate is authoritative for cases the client can't see.
            if (activeJobRepository.activeJobState.value != null) {
                return ErasureSubmitResult.ActiveJobExists
            }
            return erasureRepository.submitRequest(reason)
        }
    }
