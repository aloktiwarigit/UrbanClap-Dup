package com.homeservices.technician.domain.activeJob

import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.NavigationEvent
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class StartTripUseCase
    @Inject
    internal constructor(
        private val repository: ActiveJobRepository,
    ) {
        public suspend operator fun invoke(bookingId: String): Pair<Result<ActiveJob>, NavigationEvent?> {
            val result = repository.transitionStatus(bookingId, ActiveJobStatus.EN_ROUTE)
            val navEvent =
                if (result.isSuccess) {
                    val job = result.getOrThrow()
                    NavigationEvent.Maps(
                        "google.navigation:q=${job.addressLatLng.lat},${job.addressLatLng.lng}",
                    )
                } else {
                    null
                }
            return Pair(result, navEvent)
        }
    }
