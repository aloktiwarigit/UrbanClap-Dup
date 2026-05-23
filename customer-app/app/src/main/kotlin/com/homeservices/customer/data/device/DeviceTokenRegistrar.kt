package com.homeservices.customer.data.device

import com.google.firebase.messaging.FirebaseMessaging
import io.sentry.Breadcrumb
import io.sentry.Sentry
import io.sentry.SentryLevel
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Best-effort device-token registration against the homeservices API.
 *
 * Both [register] and [unregister] swallow all exceptions via [runCatching]:
 * failures are logged as Sentry breadcrumbs but never propagate to callers.
 * This means they can be called freely from [SessionManager] without
 * disrupting the sign-in / sign-out flow.
 */
@Singleton
public class DeviceTokenRegistrar
    @Inject
    constructor(
        private val firebaseMessaging: FirebaseMessaging,
        private val deviceApi: DeviceApi,
    ) {
        /**
         * Fetches the current FCM registration token and POSTs it to the API.
         *
         * @param appBuild optional version string (e.g. "1.2.3") included in the
         *                 request for server-side analytics and push targeting.
         */
        public suspend fun register(appBuild: String? = null) {
            runCatching {
                val token = firebaseMessaging.token.await()
                deviceApi.registerDevice(
                    RegisterDeviceRequest(
                        deviceToken = token,
                        platform = "android",
                        appBuild = appBuild,
                    ),
                )
            }.onFailure { e ->
                Sentry.addBreadcrumb(
                    Breadcrumb().apply {
                        category = "device.token"
                        message = "DeviceTokenRegistrar.register failed: ${e.message}"
                        level = SentryLevel.WARNING
                    },
                )
            }
        }

        /**
         * Fetches the current FCM token and issues a DELETE to remove it from the
         * server's active-token list.
         *
         * Called during sign-out (Step 6c) so that push messages are no longer
         * delivered to this device after the user logs out.
         */
        public suspend fun unregister() {
            runCatching {
                val token = firebaseMessaging.token.await()
                deviceApi.unregisterDevice(token)
            }.onFailure { e ->
                Sentry.addBreadcrumb(
                    Breadcrumb().apply {
                        category = "device.token"
                        message = "DeviceTokenRegistrar.unregister failed: ${e.message}"
                        level = SentryLevel.WARNING
                    },
                )
            }
        }
    }
