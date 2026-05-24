package com.homeservices.technician.data.fcm

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.homeservices.technician.data.device.DeviceTokenRegistrar
import com.homeservices.technician.domain.jobOffer.FcmTokenSyncUseCase
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

/**
 * Durable WorkManager worker that registers a new FCM token server-side.
 *
 * Enqueued by [HomeservicesFcmService.onNewToken] so that token registration
 * survives process death. Retries up to 3 attempts with exponential back-off
 * (configured at enqueue time) before giving up.
 */
@HiltWorker
internal class FcmTokenRegisterWorker
    @AssistedInject
    constructor(
        @Assisted context: Context,
        @Assisted params: WorkerParameters,
        private val fcmTokenSyncUseCase: FcmTokenSyncUseCase,
        private val deviceTokenRegistrar: DeviceTokenRegistrar,
    ) : CoroutineWorker(context, params) {
        override suspend fun doWork(): Result {
            val token = inputData.getString(KEY_FCM_TOKEN) ?: return Result.failure()
            return runCatching {
                fcmTokenSyncUseCase.invokeWithFcmToken(token)
                deviceTokenRegistrar.register()
                Result.success()
            }.getOrElse {
                com.google.firebase.crashlytics.FirebaseCrashlytics
                    .getInstance()
                    .recordException(it)
                if (runAttemptCount < MAX_RETRY_ATTEMPTS) Result.retry() else Result.failure()
            }
        }

        public companion object {
            public const val KEY_FCM_TOKEN: String = "fcm_token"
            private const val MAX_RETRY_ATTEMPTS = 3
        }
    }
