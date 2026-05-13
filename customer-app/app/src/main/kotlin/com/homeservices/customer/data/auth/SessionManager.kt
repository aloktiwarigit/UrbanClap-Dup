package com.homeservices.customer.data.auth

import android.content.SharedPreferences
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.messaging.FirebaseMessaging
import com.homeservices.customer.data.auth.di.AuthPrefs
import com.homeservices.customer.data.network.auth.IdTokenCache
import com.homeservices.customer.domain.auth.model.AuthProvider
import com.homeservices.customer.domain.auth.model.AuthState
import io.sentry.Sentry
import io.sentry.SentryLevel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class SessionManager
    @Inject
    constructor(
        @AuthPrefs private val prefs: SharedPreferences,
        private val firebaseAuth: FirebaseAuth,
        private val firebaseMessaging: FirebaseMessaging,
        private val idTokenCache: IdTokenCache,
    ) {
        private companion object {
            const val KEY_UID = "uid"
            const val KEY_PHONE_LAST_FOUR = "phone_last_four"
            const val KEY_SESSION_CREATED_AT = "session_created_at_epoch_ms"
            const val KEY_EMAIL = "email"
            const val KEY_DISPLAY_NAME = "display_name"
            const val KEY_AUTH_PROVIDER = "auth_provider"
            val SESSION_TTL_MS = TimeUnit.DAYS.toMillis(180)
        }

        private val _authState = MutableStateFlow(readInitialState())
        public val authState: StateFlow<AuthState> = _authState.asStateFlow()

        private fun readInitialState(): AuthState {
            val uid = prefs.getString(KEY_UID, null)
            val createdAt = prefs.getLong(KEY_SESSION_CREATED_AT, 0L)
            val sessionExpired =
                uid == null ||
                    createdAt == 0L ||
                    System.currentTimeMillis() - createdAt > SESSION_TTL_MS
            return if (sessionExpired) {
                if (uid != null) clearPrefs()
                AuthState.Unauthenticated
            } else {
                AuthState.Authenticated(
                    uid = uid!!,
                    phoneLastFour = prefs.getString(KEY_PHONE_LAST_FOUR, null),
                    email = prefs.getString(KEY_EMAIL, null),
                    displayName = prefs.getString(KEY_DISPLAY_NAME, null),
                    authProvider = parseProvider(prefs.getString(KEY_AUTH_PROVIDER, null)),
                )
            }
        }

        private fun parseProvider(raw: String?): AuthProvider =
            when (raw) {
                "google" -> AuthProvider.Google
                "email" -> AuthProvider.Email
                else -> AuthProvider.Phone
            }

        private fun providerKey(provider: AuthProvider): String =
            when (provider) {
                AuthProvider.Phone -> "phone"
                AuthProvider.Google -> "google"
                AuthProvider.Email -> "email"
            }

        public suspend fun saveSession(
            uid: String,
            phoneLastFour: String? = null,
            email: String? = null,
            displayName: String? = null,
            authProvider: AuthProvider = AuthProvider.Phone,
        ) {
            withContext(Dispatchers.IO) {
                val editor =
                    prefs
                        .edit()
                        .putString(KEY_UID, uid)
                        .putString(KEY_AUTH_PROVIDER, providerKey(authProvider))
                        .putLong(KEY_SESSION_CREATED_AT, System.currentTimeMillis())
                if (phoneLastFour != null) {
                    editor.putString(KEY_PHONE_LAST_FOUR, phoneLastFour)
                } else {
                    editor.remove(KEY_PHONE_LAST_FOUR)
                }
                if (email != null) {
                    editor.putString(KEY_EMAIL, email)
                } else {
                    editor.remove(KEY_EMAIL)
                }
                if (displayName != null) {
                    editor.putString(KEY_DISPLAY_NAME, displayName)
                } else {
                    editor.remove(KEY_DISPLAY_NAME)
                }
                editor.apply()
            }
            _authState.value =
                AuthState.Authenticated(
                    uid = uid,
                    phoneLastFour = phoneLastFour,
                    email = email,
                    displayName = displayName,
                    authProvider = authProvider,
                )
        }

        public suspend fun updateDisplayName(displayName: String?) {
            val current = _authState.value as? AuthState.Authenticated ?: return
            val normalizedName = displayName?.trim()?.takeIf { it.isNotEmpty() }
            saveSession(
                uid = current.uid,
                phoneLastFour = current.phoneLastFour,
                email = current.email,
                displayName = normalizedName,
                authProvider = current.authProvider,
            )
        }

        /**
         * Full sign-out orchestration.
         *
         * Executes the following sequence, each step wrapped in [runCatching] so that
         * a failure in any one step (e.g. FCM unsubscribe timing out while offline) does
         * not prevent the remaining steps from running. Failures are logged as Sentry
         * breadcrumbs but never thrown — sign-out always completes.
         *
         * 1. [FirebaseAuth.signOut] — invalidates the Firebase session on-device
         * 2. [FirebaseMessaging.unsubscribeFromTopic] — removes the customer-topic binding
         * 3. [FirebaseMessaging.deleteToken] — rotates the FCM registration token
         * 4. [IdTokenCache.cancelScope] — stops background ID-token refresh
         * 5. Clear prefs — removes all persisted session data
         * 6. Transition [authState] to [AuthState.Unauthenticated]
         *
         * If there is no current UID the function returns immediately (idempotent).
         */
        public suspend fun signOut() {
            val uid =
                (prefs.getString(KEY_UID, null)
                    ?: (_authState.value as? AuthState.Authenticated)?.uid)
                    ?: return

            // Step 1 — Firebase Auth sign-out
            runCatching { firebaseAuth.signOut() }
                .onFailure { e ->
                    Sentry.addBreadcrumb(
                        io.sentry.Breadcrumb().apply {
                            category = "auth.signout"
                            message = "firebaseAuth.signOut() failed: ${e.message}"
                            level = SentryLevel.WARNING
                        },
                    )
                }

            // Step 2 — FCM topic unsubscribe
            runCatching { firebaseMessaging.unsubscribeFromTopic("customer_$uid").await() }
                .onFailure { e ->
                    Sentry.addBreadcrumb(
                        io.sentry.Breadcrumb().apply {
                            category = "auth.signout"
                            message = "FCM unsubscribeFromTopic failed: ${e.message}"
                            level = SentryLevel.WARNING
                        },
                    )
                }

            // Step 3 — FCM token deletion
            runCatching { firebaseMessaging.deleteToken().await() }
                .onFailure { e ->
                    Sentry.addBreadcrumb(
                        io.sentry.Breadcrumb().apply {
                            category = "auth.signout"
                            message = "FCM deleteToken failed: ${e.message}"
                            level = SentryLevel.WARNING
                        },
                    )
                }

            // Step 4 — Cancel IdTokenCache background refresh
            runCatching { idTokenCache.cancelScope() }
                .onFailure { e ->
                    Sentry.addBreadcrumb(
                        io.sentry.Breadcrumb().apply {
                            category = "auth.signout"
                            message = "idTokenCache.cancelScope() failed: ${e.message}"
                            level = SentryLevel.WARNING
                        },
                    )
                }

            // Step 5 — Clear persisted session prefs
            clearPrefs()

            // Step 6 — Transition to Unauthenticated
            _authState.value = AuthState.Unauthenticated
        }

        /**
         * Clears prefs and transitions to Unauthenticated without touching Firebase or FCM.
         *
         * Kept for backward-compatibility with internal callers that do not need full
         * Firebase cleanup (e.g. TTL-expired session eviction on cold start).
         * For user-initiated sign-out, prefer [signOut].
         */
        public suspend fun clearSession() {
            withContext(Dispatchers.IO) { clearPrefs() }
            _authState.value = AuthState.Unauthenticated
        }

        private fun clearPrefs() {
            prefs.edit().clear().apply()
        }
    }
