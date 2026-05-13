package com.homeservices.customer.data.network.auth

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Singleton cache for Firebase ID tokens.
 *
 * Solves the [runBlocking] blocking-dispatcher problem in OkHttp interceptors:
 * the interceptor reads [cachedToken] (non-blocking), while this class keeps the
 * cached value fresh by refreshing every 55 minutes on [Dispatchers.IO].
 *
 * Token lifetime is ~1 hour. A 55-minute proactive refresh window ensures the cached
 * token is never stale when an OkHttp request fires.
 *
 * Usage in the interceptor:
 * ```
 * val token = idTokenCache.cachedToken
 * if (token != null) {
 *     chain.proceed(request.newBuilder().header("Authorization", "Bearer $token").build())
 * } else {
 *     chain.proceed(request)
 * }
 * ```
 *
 * The [FirebaseTokenAuthenticator] handles force-refresh on 401 responses and does not
 * use this cache — it calls `getIdToken(true)` directly via `Tasks.await` on the OkHttp
 * worker thread.
 *
 * Sign-out / sign-in lifecycle:
 * - [signalSignOut] clears [cachedToken] and pauses the refresh loop without cancelling
 *   the [CoroutineScope]. The scope is permanently alive for the lifetime of the singleton.
 * - [signalSignIn] re-enables the refresh loop so the next iteration fetches a fresh token.
 *   Call this from [SessionManager.saveSession] after a successful sign-in.
 */
@Singleton
public class IdTokenCache
    @Inject
    constructor(
        private val firebaseAuth: FirebaseAuth,
    ) {
        private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

        /**
         * Controls whether the refresh loop actively fetches tokens.
         * `true` = active (signed in); `false` = paused (signed out).
         */
        private val refreshEnabled = AtomicBoolean(true)

        /**
         * The latest cached Firebase ID token, or `null` if no token has been fetched yet
         * (cold start, signed-out user, or last fetch failed).
         *
         * Volatile to ensure visibility across OkHttp dispatcher threads without locking.
         */
        @Volatile
        public var cachedToken: String? = null
            private set

        init {
            // Start background refresh loop. The loop runs for the lifetime of the singleton
            // and self-pauses when refreshEnabled is false (i.e. user is signed out).
            scope.launch { refreshLoop() }
        }

        /**
         * Clears [cachedToken] and pauses the background refresh loop.
         *
         * Called by [com.homeservices.customer.data.auth.SessionManager.signOut] as part of
         * the sign-out cleanup sequence so stale tokens are never served after sign-out.
         *
         * Unlike the previous [cancelScope] approach, this does NOT cancel the coroutine
         * scope. The singleton remains alive across sign-out → sign-in cycles in the same
         * process, so a subsequent [signalSignIn] call resumes refreshing without requiring
         * an app restart.
         */
        public fun signalSignOut() {
            cachedToken = null
            refreshEnabled.set(false)
        }

        /**
         * Re-enables the background refresh loop after a sign-in.
         *
         * Call this from [com.homeservices.customer.data.auth.SessionManager.saveSession]
         * so the interceptor can serve a bearer token for the first API request made
         * immediately after sign-in.
         */
        public fun signalSignIn() {
            refreshEnabled.set(true)
        }

        /**
         * Fetches a fresh token from Firebase and updates [cachedToken].
         * Returns the new token, or `null` if no user is signed in or the fetch fails.
         *
         * Called from the refresh loop and can be called explicitly in tests.
         */
        public suspend fun freshToken(): String? {
            return try {
                val user = firebaseAuth.currentUser ?: return null
                val result = user.getIdToken(false).await()
                val token = result?.token
                cachedToken = token
                token
            } catch (e: Exception) {
                Log.w(TAG, "IdToken fetch failed", e)
                null
            }
        }

        private suspend fun refreshLoop() {
            while (true) {
                if (refreshEnabled.get()) {
                    freshToken()
                }
                delay(REFRESH_INTERVAL_MS)
            }
        }

        private companion object {
            const val TAG = "IdTokenCache"
            val REFRESH_INTERVAL_MS = TimeUnit.MINUTES.toMillis(55)
        }
    }
