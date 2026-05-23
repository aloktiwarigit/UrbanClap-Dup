package com.homeservices.technician.data.network.auth

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Singleton cache for Firebase ID tokens (technician-app).
 *
 * Background refresh every 55 minutes. Also invalidates synchronously on auth state
 * changes (sign-in / sign-out / user switch) — critical because the `cachedToken` is
 * read by the @AuthOkHttpClient interceptor without consulting `FirebaseAuth.currentUser`
 * per request. Without invalidation, the first request after a sign-out → sign-in
 * transition would send the *previous* user's bearer with the *new* user's payload
 * (cross-account leak; see Codex review W1 round 1).
 *
 * See customer-app's [com.homeservices.customer.data.network.auth.IdTokenCache] for the
 * shared design rationale.
 */
@Singleton
public class IdTokenCache
    @Inject
    constructor(
        private val firebaseAuth: FirebaseAuth,
    ) {
        private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

        @Volatile
        public var cachedToken: String? = null
            private set

        init {
            scope.launch { refreshLoop() }
            // Invalidate on auth state change: sign-out → drop stale token; sign-in →
            // fetch fresh token for the new user. The listener fires immediately with
            // the current user (or null), which is fine — the refreshLoop's first
            // iteration will populate cachedToken either way.
            firebaseAuth.addAuthStateListener { auth ->
                cachedToken = null
                if (auth.currentUser != null) {
                    scope.launch { freshToken() }
                }
            }
        }

        public suspend fun freshToken(): String? {
            return try {
                val user = firebaseAuth.currentUser ?: return null
                val startUid = user.uid
                val result = user.getIdToken(false).await()
                val token = result?.token
                // Fence: if the signed-in user changed while we were awaiting the
                // token fetch, discard this result rather than overwriting the cache
                // with a stale bearer. The AuthStateListener will have already
                // launched a fresh freshToken() for the new user; we'd be racing
                // against it (Codex review W1 round 2 [P2]).
                if (firebaseAuth.currentUser?.uid == startUid) {
                    cachedToken = token
                    token
                } else {
                    Log.w(TAG, "IdToken result discarded: user changed during fetch")
                    null
                }
            } catch (e: Exception) {
                Log.w(TAG, "IdToken fetch failed", e)
                null
            }
        }

        private suspend fun refreshLoop() {
            while (true) {
                freshToken()
                delay(REFRESH_INTERVAL_MS)
            }
        }

        private companion object {
            const val TAG = "TechIdTokenCache"
            val REFRESH_INTERVAL_MS = TimeUnit.MINUTES.toMillis(55)
        }
    }
