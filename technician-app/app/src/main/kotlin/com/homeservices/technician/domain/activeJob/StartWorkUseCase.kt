package com.homeservices.technician.domain.activeJob

import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.observability.analytics.AnalyticsTracker
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class StartWorkUseCase
    @Inject
    internal constructor(
        private val repository: ActiveJobRepository,
    ) {
        public suspend operator fun invoke(bookingId: String): Result<ActiveJob> =
            repository.transitionStatus(bookingId, ActiveJobStatus.IN_PROGRESS).also { result ->
                if (result.isSuccess) AnalyticsTracker.capture("job_started")
            }
    }
