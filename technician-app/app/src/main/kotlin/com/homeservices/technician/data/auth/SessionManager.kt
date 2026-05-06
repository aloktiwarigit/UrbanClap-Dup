package com.homeservices.technician.data.auth

import android.content.SharedPreferences
import com.homeservices.technician.data.auth.di.AuthPrefs
import com.homeservices.technician.domain.auth.model.AuthProvider
import com.homeservices.technician.domain.auth.model.AuthState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class SessionManager
    @Inject
    constructor(
        @AuthPrefs private val prefs: SharedPreferences,
    ) {
        private companion object {
            const val KEY_UID = "uid"
            const val KEY_PHONE_LAST_FOUR = "phone_last_four"
            const val KEY_SESSION_CREATED_AT = "session_created_at_epoch_ms"
            const val KEY_EMAIL = "email"
            const val KEY_DISPLAY_NAME = "display_name"
            const val KEY_AUTH_PROVIDER = "auth_provider"
            const val KEY_ONBOARDING_COMPLETE_LEGACY = "onboarding_complete"
            const val KEY_ONBOARDING_COMPLETE_PREFIX = "onboarding_complete_"
            val SESSION_TTL_MS = TimeUnit.DAYS.toMillis(180)
        }

        private val _authState = MutableStateFlow(readInitialState())
        public val authState: StateFlow<AuthState> = _authState.asStateFlow()

        public val isOnboardingComplete: Boolean
            get() {
                val uid = currentUid() ?: return false
                return prefs.getBoolean(onboardingCompleteKey(uid), false)
            }

        public suspend fun setOnboardingComplete() {
            withContext(Dispatchers.IO) {
                val uid = currentUid() ?: return@withContext
                prefs
                    .edit()
                    .putBoolean(onboardingCompleteKey(uid), true)
                    .remove(KEY_ONBOARDING_COMPLETE_LEGACY)
                    .apply()
            }
        }

        private fun readInitialState(): AuthState {
            val uid = prefs.getString(KEY_UID, null)
            val createdAt = prefs.getLong(KEY_SESSION_CREATED_AT, 0L)
            val sessionExpired =
                uid == null ||
                    createdAt == 0L ||
                    System.currentTimeMillis() - createdAt > SESSION_TTL_MS
            return if (sessionExpired) {
                if (uid != null) clearSessionPrefs()
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
                val legacyOnboardingComplete = prefs.getBoolean(KEY_ONBOARDING_COMPLETE_LEGACY, false)
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
                if (legacyOnboardingComplete) {
                    editor
                        .putBoolean(onboardingCompleteKey(uid), true)
                        .remove(KEY_ONBOARDING_COMPLETE_LEGACY)
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

        public suspend fun clearSession() {
            withContext(Dispatchers.IO) { clearSessionPrefs() }
            _authState.value = AuthState.Unauthenticated
        }

        private fun currentUid(): String? {
            val fromState = (authState.value as? AuthState.Authenticated)?.uid
            return fromState ?: prefs.getString(KEY_UID, null)
        }

        private fun onboardingCompleteKey(uid: String): String = "$KEY_ONBOARDING_COMPLETE_PREFIX$uid"

        private fun clearSessionPrefs() {
            prefs
                .edit()
                .remove(KEY_UID)
                .remove(KEY_PHONE_LAST_FOUR)
                .remove(KEY_SESSION_CREATED_AT)
                .remove(KEY_EMAIL)
                .remove(KEY_DISPLAY_NAME)
                .remove(KEY_AUTH_PROVIDER)
                .remove(KEY_ONBOARDING_COMPLETE_LEGACY)
                .apply()
        }
    }
