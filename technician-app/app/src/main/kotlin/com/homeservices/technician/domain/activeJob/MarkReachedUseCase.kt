package com.homeservices.technician.domain.activeJob

import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class MarkReachedUseCase
    @Inject
    internal constructor(
        private val repository: ActiveJobRepository,
    ) {
        public suspend operator fun invoke(bookingId: String): Result<ActiveJob> =
            repository.transitionStatus(bookingId, ActiveJobStatus.REACHED)
    }
