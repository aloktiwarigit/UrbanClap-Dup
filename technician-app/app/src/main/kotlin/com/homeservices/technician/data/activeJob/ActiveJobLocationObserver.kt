package com.homeservices.technician.data.activeJob

import android.content.Context
import com.homeservices.technician.data.location.service.LocationForegroundService
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Application-scoped observer that starts or stops [LocationForegroundService]
 * in response to changes in the active-job state.
 *
 * Lifecycle: [start] is called once from [com.homeservices.technician.HomeservicesTechnicianApplication.onCreate].
 * The internal [CoroutineScope] lives for the process lifetime — no teardown is needed.
 */
@Singleton
public class ActiveJobLocationObserver
    @Inject
    internal constructor(
        @ApplicationContext private val appContext: Context,
        private val repository: ActiveJobRepository,
    ) {
        private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

        /** Subscribes to [ActiveJobRepository.activeJobState] and manages [LocationForegroundService]. */
        public fun start() {
            scope.launch {
                repository.activeJobState.collect { job ->
                    when (job?.status) {
                        ActiveJobStatus.EN_ROUTE,
                        ActiveJobStatus.REACHED,
                        ActiveJobStatus.IN_PROGRESS,
                        -> LocationForegroundService.startIfNeeded(appContext, job.bookingId)

                        ActiveJobStatus.COMPLETED,
                        null,
                        -> LocationForegroundService.stop(appContext)

                        else -> Unit
                    }
                }
            }
        }
    }
