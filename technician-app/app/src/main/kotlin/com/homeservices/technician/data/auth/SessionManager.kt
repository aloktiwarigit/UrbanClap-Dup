package com.homeservices.technician.data.auth

import android.content.SharedPreferences
import com.homeservices.technician.data.auth.di.AuthPrefs
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
                val phoneLastFour = prefs.getString(KEY_PHONE_LAST_FOUR, "") ?: ""
                AuthState.Authenticated(uid = uid!!, phoneLastFour = phoneLastFour)
            }
        }

        public suspend fun saveSession(
            uid: String,
            phoneLastFour: String,
        ) {
            withContext(Dispatchers.IO) {
                prefs
                    .edit()
                    .putString(KEY_UID, uid)
                    .putString(KEY_PHONE_LAST_FOUR, phoneLastFour)
                    .putLong(KEY_SESSION_CREATED_AT, System.currentTimeMillis())
                    .apply()
            }
            _authState.value = AuthState.Authenticated(uid = uid, phoneLastFour = phoneLastFour)
        }

        public suspend fun clearSession() {
            withContext(Dispatchers.IO) { clearPrefs() }
            _authState.value = AuthState.Unauthenticated
        }

        private fun clearPrefs() {
            prefs.edit().clear().apply()
        }
    }
