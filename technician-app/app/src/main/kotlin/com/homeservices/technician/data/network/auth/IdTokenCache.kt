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
 * See customer-app's [com.homeservices.customer.data.network.auth.IdTokenCache] for full
 * design rationale. Refreshes every 55 minutes on [Dispatchers.IO] background coroutine.
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
        }

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
                freshToken()
                delay(REFRESH_INTERVAL_MS)
            }
        }

        private companion object {
            const val TAG = "TechIdTokenCache"
            val REFRESH_INTERVAL_MS = TimeUnit.MINUTES.toMillis(55)
        }
    }
