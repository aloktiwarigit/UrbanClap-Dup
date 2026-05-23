package com.homeservices.technician.domain.erasure

import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Statuses that represent a job still in-flight and should block account deletion.
 * COMPLETED is intentionally excluded: the job is over; the server gate is the
 * authoritative check for edge cases. Leaving COMPLETED in-memory would incorrectly
 * block deletion until process restart.
 */
private val BLOCKING_STATUSES =
    setOf(
        ActiveJobStatus.ASSIGNED,
        ActiveJobStatus.EN_ROUTE,
        ActiveJobStatus.REACHED,
        ActiveJobStatus.IN_PROGRESS,
    )

@Singleton
public class SubmitErasureRequestUseCase
    @Inject
    constructor(
        private val erasureRepository: ErasureRepository,
        private val activeJobRepository: ActiveJobRepository,
    ) {
        public suspend operator fun invoke(reason: String? = null): ErasureSubmitResult {
            // Fast-path: check only genuinely blocking statuses. COMPLETED jobs remain
            // in activeJobState until process restart; excluding COMPLETED ensures a
            // freshly-finished technician is not incorrectly prevented from deleting.
            // The server gate (ACTIVE_JOB_EXISTS) is authoritative for cases the client
            // cannot observe (e.g. a second device, or a race condition).
            val currentJob = activeJobRepository.activeJobState.value
            if (currentJob != null && currentJob.status in BLOCKING_STATUSES) {
                return ErasureSubmitResult.ActiveJobExists
            }
            return erasureRepository.submitRequest(reason)
        }
    }
