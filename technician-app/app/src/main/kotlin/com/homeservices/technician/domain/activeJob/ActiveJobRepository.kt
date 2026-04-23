package com.homeservices.technician.domain.activeJob

import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import kotlinx.coroutines.flow.Flow

public interface ActiveJobRepository {
    public fun getActiveJob(bookingId: String): Flow<ActiveJob>
    public val hasPendingTransitions: Flow<Boolean>
    public suspend fun transitionStatus(bookingId: String, targetStatus: ActiveJobStatus): Result<ActiveJob>
    public suspend fun syncPendingTransitions()
}
