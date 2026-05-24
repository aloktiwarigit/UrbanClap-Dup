package com.homeservices.technician.domain.jobOffer

import com.google.firebase.crashlytics.FirebaseCrashlytics
import com.google.firebase.messaging.FirebaseMessaging
import com.homeservices.technician.data.jobOffer.FcmTokenRequest
import com.homeservices.technician.data.jobOffer.JobOfferApiService
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class FcmTokenSyncUseCase
    @Inject
    internal constructor(
        private val api: JobOfferApiService,
    ) {
        /** Called from app startup / login flow. Fetches the FCM token internally. */
        public suspend operator fun invoke(): Unit {
            try {
                val fcmToken = FirebaseMessaging.getInstance().token.await()
                invokeWithFcmToken(fcmToken)
            } catch (e: Exception) { // TooGenericExceptionCaught — token sync is best-effort; all exceptions handled identically
                // Token sync is best-effort; failures are non-fatal
                runCatching { FirebaseCrashlytics.getInstance().recordException(e) }
            }
        }

        /**
         * Testable entry point — accepts a pre-fetched FCM token.
         * Unit tests use this overload to avoid static FirebaseMessaging access.
         */
        @Suppress("TooGenericExceptionCaught")
        public suspend fun invokeWithFcmToken(fcmToken: String): Unit {
            try {
                api.syncFcmToken(FcmTokenRequest(fcmToken))
            } catch (e: Exception) {
                // Token sync is best-effort; failures are non-fatal
                runCatching { FirebaseCrashlytics.getInstance().recordException(e) }
            }
        }
    }
