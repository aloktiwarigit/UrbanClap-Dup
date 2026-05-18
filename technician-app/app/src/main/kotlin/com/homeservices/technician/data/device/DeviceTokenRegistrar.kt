package com.homeservices.technician.data.device

import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Registers and unregisters the current device's FCM token with the homeservices backend.
 *
 * - [register] is called after successful sign-in to bind the FCM token to the authenticated user.
 * - [unregister] is called during sign-out ([SessionManager.clearSession]) so the server
 *   stops delivering push notifications to a signed-out device (PII trim, E19-S02).
 *
 * Both operations are **best-effort**: failures are swallowed via [runCatching] and never
 * propagate to the caller. This matches the customer-app pattern and ensures sign-in/sign-out
 * flows are never blocked by backend or FCM availability.
 */
@Singleton
public class DeviceTokenRegistrar
    @Inject
    constructor(
        private val api: DeviceApi,
        private val messaging: FirebaseMessaging,
    ) {
        /**
         * Fetches the current FCM token and POSTs it to the server.
         * Swallows all failures (FCM unavailable, network error, server error).
         */
        public suspend fun register() {
            runCatching {
                val token = messaging.token.await()
                api.registerToken(RegisterDeviceTokenRequest(fcmToken = token, platform = "android"))
            }
        }

        /**
         * Sends a DELETE to the server to remove the current device token.
         * Swallows all failures (network error, server error).
         */
        public suspend fun unregister() {
            runCatching {
                api.unregisterToken()
            }
        }
    }
