package com.homeservices.technician.data.sync

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

/**
 * WorkManager worker that drains the offline outbox of pending status transitions.
 * Scheduled whenever network becomes available (via [ConnectivityObserver]) or
 * on app foreground (via ProcessLifecycleOwner).
 *
 * Retry policy: up to 3 attempts (runAttemptCount 0–2), then permanent failure.
 */
@HiltWorker
public class OutboxSyncWorker
    @AssistedInject
    constructor(
        @Assisted context: Context,
        @Assisted params: WorkerParameters,
        private val repository: ActiveJobRepository,
    ) : CoroutineWorker(context, params) {
        override suspend fun doWork(): Result =
            try {
                repository.syncPendingTransitions()
                Result.success()
            } catch (e: Exception) {
                if (runAttemptCount < 3) Result.retry() else Result.failure()
            }

        public companion object {
            public const val WORK_NAME: String = "outbox_sync"
        }
    }
