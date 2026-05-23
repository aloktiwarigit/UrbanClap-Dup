package com.homeservices.technician.data.network.auth

import android.util.Log
import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.FirebaseAuth
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import javax.inject.Inject
import javax.inject.Singleton

/**
 * OkHttp [Authenticator] that handles 401 responses by force-refreshing the Firebase ID token
 * (technician-app).
 *
 * See customer-app's [com.homeservices.customer.data.network.auth.FirebaseTokenAuthenticator]
 * for full design rationale. `Tasks.await` is safe here because OkHttp calls Authenticator
 * on a worker thread, never the main thread.
 */
@Singleton
public class FirebaseTokenAuthenticator
    @Inject
    constructor(
        private val firebaseAuth: FirebaseAuth,
    ) : Authenticator {
        override fun authenticate(
            route: Route?,
            response: Response,
        ): Request? {
            if (response.priorResponse != null) {
                Log.w(TAG, "Stopping token retry — prior 401 already retried")
                return null
            }

            val user = firebaseAuth.currentUser
            if (user == null) {
                Log.w(TAG, "No signed-in user — cannot refresh token")
                return null
            }

            return try {
                val result = Tasks.await(user.getIdToken(true))
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
                null
            }
        }

        private companion object {
            const val TAG = "TechFirebaseTokenAuth"
        }
    }
