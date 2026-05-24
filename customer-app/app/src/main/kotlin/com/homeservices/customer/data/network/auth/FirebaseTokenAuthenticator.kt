package com.homeservices.customer.data.network.auth

import android.util.Log
import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.FirebaseAuth
import com.homeservices.customer.data.auth.SessionInvalidationReason
import com.homeservices.customer.data.auth.SessionInvalidator
import io.sentry.Sentry
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import javax.inject.Inject
import javax.inject.Provider
import javax.inject.Singleton

/**
 * OkHttp [Authenticator] that handles 401 responses by force-refreshing the Firebase ID token.
 *
 * Design notes:
 * - [Authenticator.authenticate] is called on an OkHttp worker thread, **never the main thread**.
 *   `Tasks.await(...)` is therefore safe here — it blocks the worker thread while waiting for
 *   the Firebase token refresh, which is exactly what OkHttp's Authenticator contract expects.
 * - The retry guard checks for a prior response with the same URL to prevent an infinite 401 loop.
 *   On the second consecutive 401 (prior response count ≥ 1), we return `null` to stop retrying.
 * - On any error (Firebase exception, null token, no user), we return `null` so OkHttp surfaces
 *   the 401 to the caller rather than looping indefinitely.
 */
@Singleton
public class FirebaseTokenAuthenticator
    @Inject
    constructor(
        private val firebaseAuth: FirebaseAuth,
        private val sessionInvalidator: Provider<SessionInvalidator>,
    ) : Authenticator {
        override fun authenticate(
            route: Route?,
            response: Response,
        ): Request? {
            // Infinite-retry guard: stop after the first retry attempt
            if (response.priorResponse != null) {
                Log.w(TAG, "Stopping token retry — prior 401 already retried")
                if (response.request.header("Authorization") != null) {
                    sessionInvalidator.get().invalidateSession(SessionInvalidationReason.UnauthenticatedTokenRefresh)
                }
                return null
            }

            val user = firebaseAuth.currentUser
            if (user == null) {
                Log.w(TAG, "No signed-in user — cannot refresh token")
                sessionInvalidator.get().invalidateSession(SessionInvalidationReason.UnauthenticatedTokenRefresh)
                return null
            }

            return try {
                // Force-refresh (true) to get a new token, not the cached one
                val result = Tasks.await(user.getIdToken(true), 25, java.util.concurrent.TimeUnit.SECONDS)
                val newToken = result?.token
                if (newToken == null) {
                    Log.w(TAG, "getIdToken(true) returned null token")
                    return null
                }
                Log.d(TAG, "Token refreshed successfully on 401")
                response.request
                    .newBuilder()
                    .header("Authorization", "Bearer $newToken")
                    .build()
            } catch (e: Exception) {
                Log.e(TAG, "Token force-refresh failed on 401", e)
                Sentry.captureException(e)
                if (firebaseAuth.currentUser == null) {
                    sessionInvalidator.get().invalidateSession(SessionInvalidationReason.UnauthenticatedTokenRefresh)
                }
                null
            }
        }

        private companion object {
            const val TAG = "FirebaseTokenAuth"
        }
    }
