package com.homeservices.technician.domain.activeJob

import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.StateFlow

public interface ActiveJobRepository {
    /**
     * Returns a flow of [ActiveJob] updates for [bookingId].
     * After refactor (E11-S04) this is backed by [activeJobState] rather than a polling loop.
     */
    public fun getActiveJob(bookingId: String): Flow<ActiveJob>

    /**
     * In-memory state of the currently active job. Null until [startObserving] is called or
     * an FCM JOB_UPDATE payload is received.
     */
    public val activeJobState: StateFlow<ActiveJob?>

    /** One-shot fetch for [bookingId] that primes [activeJobState]. */
    public suspend fun startObserving(bookingId: String)

    /** Called by FCM service when a JOB_UPDATE payload arrives. */
    public fun updateFromFcm(job: ActiveJob)

    public val hasPendingTransitions: Flow<Boolean>

    public suspend fun transitionStatus(
        bookingId: String,
        targetStatus: ActiveJobStatus,
        integrityToken: String? = null,
    ): Result<ActiveJob>

    public suspend fun syncPendingTransitions()
}
