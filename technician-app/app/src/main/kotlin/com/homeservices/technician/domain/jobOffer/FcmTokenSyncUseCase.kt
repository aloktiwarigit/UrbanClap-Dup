package com.homeservices.technician.domain.jobOffer

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.messaging.FirebaseMessaging
import com.homeservices.technician.data.jobOffer.FcmTokenRequest
import com.homeservices.technician.data.jobOffer.JobOfferApiService
import kotlinx.coroutines.tasks.await
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class FcmTokenSyncUseCase
    @Inject
    internal constructor(
        private val api: JobOfferApiService,
        private val firebaseAuth: FirebaseAuth,
    ) {
        /** Called from app startup / login flow. Fetches the FCM token internally. */
        public suspend operator fun invoke(): Unit {
            try {
                val fcmToken = FirebaseMessaging.getInstance().token.await()
                invokeWithFcmToken(fcmToken)
            } catch (_: IOException) {
                // Token sync is best-effort; failures are non-fatal
            }
        }

        /**
         * Testable entry point — accepts a pre-fetched FCM token.
         * Unit tests use this overload to avoid static FirebaseMessaging access.
         */
        public suspend fun invokeWithFcmToken(fcmToken: String): Unit {
            try {
                val idToken =
                    firebaseAuth.currentUser
                        ?.getIdToken(false)
                        ?.await()
                        ?.token
                        .orEmpty()
                api.syncFcmToken("Bearer $idToken", FcmTokenRequest(fcmToken))
            } catch (_: IOException) {
                // Token sync is best-effort; failures are non-fatal
            }
        }
    }
