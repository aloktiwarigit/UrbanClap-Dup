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
import java.util.concurrent.atomic.AtomicInteger
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
 * - [signalSignOut] clears [cachedToken], pauses the refresh loop, and increments the
 *   internal [signOutGeneration] counter so that any in-flight [freshToken] call discards
 *   its result rather than writing a stale token back to [cachedToken].
 * - [signalSignIn] increments the generation (invalidating any lingering in-flight fetches
 *   from the sign-out path), re-enables the refresh loop, and immediately primes
 *   [cachedToken] via a fire-and-forget [freshToken] call so the first API request after
 *   sign-in already has a bearer token without waiting for the 55-minute loop to wake.
 * - Call [signalSignIn] from [SessionManager.saveSession] after a successful sign-in.
 * - Use [currentSignOutGeneration] to read the current generation value for cross-class
 *   coordination (e.g. [SessionManager] guards FCM cleanup with it).
 */
@Singleton
public class IdTokenCache
    @Inject
    constructor(
        private val firebaseAuth: FirebaseAuth,
    ) {
        /**
         * Exposed so the coroutine scope can be referenced for fire-and-forget launches
         * triggered by [signalSignIn]. Package-private visibility is sufficient because only
         * [SessionManager] and test code access this.
         */
        internal val idTokenCacheScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

        /**
         * Controls whether the refresh loop actively fetches tokens.
         * `true` = active (signed in); `false` = paused (signed out).
         */
        private val refreshEnabled = AtomicBoolean(false)

        /**
         * Monotonic generation counter. Incremented on every [signalSignOut] and every
         * [signalSignIn]. Any [freshToken] or [refreshLoop] call captures the generation
         * BEFORE the async await and discards its result if the generation has changed by
         * the time the await completes. This closes the window where an in-flight
         * `getIdToken().await()` could write a stale token back to [cachedToken] after
         * a sign-out (or an old sign-out's FCM coroutine racing a new sign-in).
         */
        private val signOutGeneration = AtomicInteger(0)

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
            idTokenCacheScope.launch { refreshLoop() }
        }

        /**
         * Returns the current sign-out generation counter value.
         *
         * Callers such as [com.homeservices.customer.data.auth.SessionManager] can capture
         * this value before queuing async FCM cleanup and check it again before executing
         * each step — if the generation has changed a new sign-in happened and the cleanup
         * should be skipped to avoid deleting the new session's FCM token.
         */
        public fun currentSignOutGeneration(): Int = signOutGeneration.get()

        /**
         * Clears [cachedToken], pauses the background refresh loop, and increments the
         * [signOutGeneration] counter to invalidate any in-flight [freshToken] awaits.
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
            signOutGeneration.incrementAndGet()
            refreshEnabled.set(false)
            cachedToken = null
        }

        /**
         * Re-enables the background refresh loop after a sign-in and immediately primes
         * [cachedToken] via a fire-and-forget [freshToken] call on the cache's own scope.
         *
         * The immediate prime ensures the interceptor can serve a bearer token for the
         * very first API request made after sign-in without waiting for the 55-minute
         * loop delay to expire (which would cause every immediate post-login request to
         * go without a bearer and rely on the 401-retry path).
         *
         * The generation is also incremented here so that any lingering in-flight fetches
         * from the preceding sign-out path discard their results.
         *
         * Call this from [com.homeservices.customer.data.auth.SessionManager.saveSession]
         * so the interceptor can serve a bearer token for the first API request made
         * immediately after sign-in.
         */
        public fun signalSignIn() {
            // Bump generation to discard any in-flight stale fetches from the sign-out path.
            signOutGeneration.incrementAndGet()
            refreshEnabled.set(true)
            // Immediately prime the cache — fire-and-forget on the cache's own scope.
            // This avoids the 55-minute wait before the background loop would otherwise
            // fetch the first token for the new session.
            idTokenCacheScope.launch { freshToken() }
        }

        /**
         * Fetches a fresh token from Firebase and updates [cachedToken].
         * Returns the new token, or `null` if no user is signed in or the fetch fails.
         *
         * Generation-guarded: captures [signOutGeneration] BEFORE the async await and
         * only writes to [cachedToken] if the generation still matches after the await
         * completes. This prevents an in-flight fetch from a previous session from
         * overwriting `null` after a sign-out.
         *
         * Called from the refresh loop and can be called explicitly in tests.
         */
        public suspend fun freshToken(): String? {
            val gen = signOutGeneration.get()
            return try {
                fetchAndStoreToken(gen)
            } catch (e: Exception) {
                Log.w(TAG, "IdToken fetch failed", e)
                null
            }
        }

        // Performs the await + generation check + cache write in one place so both freshToken()
        // and the refresh loop share the same generation guard. Returns null when there's no
        // current user OR the generation moved during the await (signOut/signIn happened).
        private suspend fun fetchAndStoreToken(expectedGen: Int): String? {
            val user = firebaseAuth.currentUser ?: return null
            val token = user.getIdToken(false).await()?.token
            return if (signOutGeneration.get() == expectedGen) {
                cachedToken = token
                token
            } else {
                null
            }
        }

        private suspend fun refreshLoop() {
            while (true) {
                runRefreshIteration()
                delay(REFRESH_INTERVAL_MS)
            }
        }

        // Single iteration of the refresh loop, factored out so the loop body stays shallow.
        private suspend fun runRefreshIteration() {
            if (!refreshEnabled.get()) return
            val gen = signOutGeneration.get()
            try {
                fetchAndStoreToken(gen)
            } catch (e: Exception) {
                Log.w(TAG, "Refresh loop token fetch failed", e)
            }
        }

        private companion object {
            const val TAG = "IdTokenCache"
            val REFRESH_INTERVAL_MS = TimeUnit.MINUTES.toMillis(55)
        }
    }
