package com.homeservices.customer.data.auth

import android.content.SharedPreferences
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.messaging.FirebaseMessaging
import com.homeservices.customer.data.auth.di.AuthPrefs
import com.homeservices.customer.data.device.DeviceTokenRegistrar
import com.homeservices.customer.data.network.auth.IdTokenCache
import com.homeservices.customer.domain.auth.model.AuthProvider
import com.homeservices.customer.domain.auth.model.AuthState
import io.sentry.Sentry
import io.sentry.SentryLevel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

private val CUSTOMER_SESSION_TTL_MS = TimeUnit.DAYS.toMillis(180)

private fun parseProvider(raw: String?): AuthProvider =
    when (raw) {
        "google" -> AuthProvider.Google
        "email" -> AuthProvider.Email
        else -> AuthProvider.Phone
    }

private fun inferProvider(user: FirebaseUser): AuthProvider =
    when {
        user.providerData.any { it.providerId == "google.com" } -> AuthProvider.Google
        user.providerData.any { it.providerId == "password" } -> AuthProvider.Email
        else -> AuthProvider.Phone
    }

private fun providerKey(provider: AuthProvider): String =
    when (provider) {
        AuthProvider.Phone -> "phone"
        AuthProvider.Google -> "google"
        AuthProvider.Email -> "email"
    }

private fun isSessionExpired(createdAt: Long): Boolean = createdAt == 0L || System.currentTimeMillis() - createdAt > CUSTOMER_SESSION_TTL_MS

@Singleton
public class SessionManager
    @Inject
    constructor(
        @AuthPrefs private val prefs: SharedPreferences,
        private val firebaseAuth: FirebaseAuth,
        private val firebaseMessaging: FirebaseMessaging,
        private val idTokenCache: IdTokenCache,
        private val deviceTokenRegistrar: DeviceTokenRegistrar,
    ) : SessionInvalidator {
        private companion object {
            const val KEY_UID = "uid"
            const val KEY_PHONE_LAST_FOUR = "phone_last_four"
            const val KEY_SESSION_CREATED_AT = "session_created_at_epoch_ms"
            const val KEY_EMAIL = "email"
            const val KEY_DISPLAY_NAME = "display_name"
            const val KEY_AUTH_PROVIDER = "auth_provider"
            const val PHONE_LAST_DIGITS = 4
        }

        private val sessionScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
        private val _authState = MutableStateFlow<AuthState>(AuthState.Initializing)
        public val authState: StateFlow<AuthState> = _authState.asStateFlow()

        private val authStateListener =
            FirebaseAuth.AuthStateListener { auth ->
                reconcileFirebaseUser(auth.currentUser)
            }

        init {
            firebaseAuth.addAuthStateListener(authStateListener)
            val currentUser = firebaseAuth.currentUser
            if (currentUser != null) {
                reconcileFirebaseUser(currentUser)
            } else if (!hasPersistedSession()) {
                idTokenCache.signalSignOut()
                _authState.value = AuthState.Unauthenticated
            }
        }

        private fun reconcileFirebaseUser(user: FirebaseUser?) {
            if (user == null) {
                if (hasPersistedSession() || _authState.value is AuthState.Authenticated) {
                    invalidateSession(SessionInvalidationReason.FirebaseUserMissing)
                } else {
                    idTokenCache.signalSignOut()
                    _authState.value = AuthState.Unauthenticated
                }
                return
            }

            val persistedUid = prefs.getString(KEY_UID, null)
            val createdAt = prefs.getLong(KEY_SESSION_CREATED_AT, 0L)
            if (persistedUid == user.uid && isSessionExpired(createdAt)) {
                invalidateSession(SessionInvalidationReason.LocalSessionExpired)
                return
            }

            val state = authStateFor(user, persistedUid)
            if (persistedUid != user.uid || createdAt == 0L) {
                writeSessionMetadata(state)
            }
            if (publishAuthenticatedState(state)) {
                sessionScope.launch { deviceTokenRegistrar.register() }
            }
        }

        private fun hasPersistedSession(): Boolean = prefs.getString(KEY_UID, null) != null

        private fun authStateFor(
            user: FirebaseUser,
            persistedUid: String?,
        ): AuthState.Authenticated {
            val usePersistedMetadata = persistedUid == user.uid
            return AuthState.Authenticated(
                uid = user.uid,
                phoneLastFour =
                    if (usePersistedMetadata) {
                        prefs.getString(KEY_PHONE_LAST_FOUR, null)
                    } else {
                        user.phoneNumber?.takeLast(PHONE_LAST_DIGITS)
                    },
                email =
                    if (usePersistedMetadata) {
                        prefs.getString(KEY_EMAIL, null) ?: user.email
                    } else {
                        user.email
                    },
                displayName =
                    if (usePersistedMetadata) {
                        prefs.getString(KEY_DISPLAY_NAME, null) ?: user.displayName
                    } else {
                        user.displayName
                    },
                authProvider =
                    if (usePersistedMetadata) {
                        parseProvider(prefs.getString(KEY_AUTH_PROVIDER, null))
                    } else {
                        inferProvider(user)
                    },
            )
        }

        public suspend fun saveSession(
            user: FirebaseUser,
            phoneLastFour: String? = null,
            email: String? = null,
            displayName: String? = null,
            authProvider: AuthProvider = AuthProvider.Phone,
        ) {
            val currentUid = firebaseAuth.currentUser?.uid
            if (currentUid != user.uid) {
                invalidateSession(SessionInvalidationReason.FirebaseUserMismatch)
                error("Cannot save a customer session for a non-current Firebase user")
            }

            val state =
                AuthState.Authenticated(
                    uid = user.uid,
                    phoneLastFour = phoneLastFour,
                    email = email ?: user.email,
                    displayName = displayName ?: user.displayName,
                    authProvider = authProvider,
                )
            withContext(Dispatchers.IO) { writeSessionMetadata(state) }
            publishAuthenticatedState(state)
            // Best-effort device token registration — ensures token is enrolled even when onNewToken
            // is not invoked (e.g. sign-in with an already-issued FCM token).
            runCatching { deviceTokenRegistrar.register() }
                .onFailure { e ->
                    Sentry.addBreadcrumb(
                        io.sentry.Breadcrumb().apply {
                            category = "auth.signin"
                            message = "deviceTokenRegistrar.register failed: ${e.message}"
                            level = SentryLevel.WARNING
                        },
                    )
                }
        }

        private fun publishAuthenticatedState(state: AuthState.Authenticated): Boolean {
            val previous = _authState.value as? AuthState.Authenticated
            val userChanged = previous?.uid != state.uid
            if (userChanged) {
                idTokenCache.signalSignIn()
            }
            _authState.value = state
            return userChanged
        }

        private fun writeSessionMetadata(state: AuthState.Authenticated) {
            val editor =
                prefs
                    .edit()
                    .putString(KEY_UID, state.uid)
                    .putString(KEY_AUTH_PROVIDER, providerKey(state.authProvider))
                    .putLong(KEY_SESSION_CREATED_AT, System.currentTimeMillis())
            if (state.phoneLastFour != null) {
                editor.putString(KEY_PHONE_LAST_FOUR, state.phoneLastFour)
            } else {
                editor.remove(KEY_PHONE_LAST_FOUR)
            }
            if (state.email != null) {
                editor.putString(KEY_EMAIL, state.email)
            } else {
                editor.remove(KEY_EMAIL)
            }
            if (state.displayName != null) {
                editor.putString(KEY_DISPLAY_NAME, state.displayName)
            } else {
                editor.remove(KEY_DISPLAY_NAME)
            }
            if (!editor.commit()) {
                Sentry.addBreadcrumb("SessionManager.writeSessionMetadata: SharedPreferences commit failed")
            }
        }

        public suspend fun updateDisplayName(displayName: String?) {
            val current = _authState.value as? AuthState.Authenticated ?: return
            val user =
                firebaseAuth.currentUser ?: run {
                    invalidateSession(SessionInvalidationReason.FirebaseUserMissing)
                    return
                }
            val normalizedName = displayName?.trim()?.takeIf { it.isNotEmpty() }
            saveSession(
                user = user,
                phoneLastFour = current.phoneLastFour,
                email = current.email,
                displayName = normalizedName,
                authProvider = current.authProvider,
            )
        }

        override fun invalidateSession(reason: SessionInvalidationReason) {
            clearPrefs()
            runCatching { idTokenCache.signalSignOut() }
                .onFailure { e ->
                    Sentry.addBreadcrumb(
                        io.sentry.Breadcrumb().apply {
                            category = "auth.invalidate"
                            message = "idTokenCache.signalSignOut failed for $reason: ${e.message}"
                            level = SentryLevel.WARNING
                        },
                    )
                }
            _authState.value = AuthState.Unauthenticated
            if (reason == SessionInvalidationReason.FirebaseUserMismatch ||
                reason == SessionInvalidationReason.LocalSessionExpired
            ) {
                runCatching { firebaseAuth.signOut() }
                    .onFailure { e ->
                        Sentry.addBreadcrumb(
                            io.sentry.Breadcrumb().apply {
                                category = "auth.invalidate"
                                message = "firebaseAuth.signOut failed for $reason: ${e.message}"
                                level = SentryLevel.WARNING
                            },
                        )
                    }
            }
            sessionScope.launch {
                runCatching { firebaseMessaging.deleteToken().await() }
                    .onFailure { e ->
                        Sentry.addBreadcrumb(
                            io.sentry.Breadcrumb().apply {
                                category = "auth.invalidate"
                                message = "FCM deleteToken failed for $reason: ${e.message}"
                                level = SentryLevel.WARNING
                            },
                        )
                    }
            }
        }

        /**
         * Full sign-out orchestration.
         *
         * Local state is cleared **first** so that if the process is killed mid-flight
         * (e.g. FCM cleanup hangs), the persisted prefs are already gone and
         * Firebase auth reconciliation will correctly return [AuthState.Unauthenticated] on the
         * next cold start rather than treating the stale [KEY_UID] as an active session.
         *
         * Sequence:
         * 1. Capture UID (needed for FCM topic name — must happen before prefs are cleared)
         * 2. Clear persisted session prefs synchronously
         * 3. Transition [authState] to [AuthState.Unauthenticated] (UI immediately reflects sign-out)
         * 3.5. Best-effort [DeviceTokenRegistrar.unregister] — runs HERE while the cached bearer
         *    token is still valid and before [FirebaseMessaging.deleteToken] rotates the FCM token.
         *    Removes this device's token from the server's active-token list so push notifications
         *    stop being sent to the signed-out device.
         * 4. [IdTokenCache.signalSignOut] — clears cached token, pauses the refresh loop,
         *    and increments signOutGeneration; capture the generation for FCM guards below.
         *    Does NOT cancel the singleton scope so the next sign-in can resume.
         * 5. Best-effort [FirebaseAuth.signOut] (local-only SDK call; safe after prefs are cleared)
         * 6. Best-effort FCM cleanup — [FirebaseMessaging.deleteToken] (may hang or fail
         *    offline; never block sign-out).
         *    The deleteToken step is guarded by the sign-out generation: if the user signs back in
         *    while the FCM await is in-flight, the generation will have changed (via
         *    [signalSignIn] → incrementAndGet) and the operation is skipped to avoid deleting
         *    the new session's FCM token.
         *
         * Each step after step 1 is wrapped in [runCatching] so failures are logged as
         * Sentry breadcrumbs but never thrown — sign-out always completes.
         *
         * If there is no current UID the function returns immediately (idempotent).
         */
        public suspend fun signOut() {
            // Step 1 — Capture uid BEFORE clearing prefs (needed for FCM topic name)
            if (prefs.getString(KEY_UID, null) == null && _authState.value !is AuthState.Authenticated) return

            // Step 2 — Clear persisted session prefs (local-state-first: survives process kill)
            clearPrefs()

            // Step 3 — Transition to Unauthenticated immediately (UI reflects sign-out now)
            _authState.value = AuthState.Unauthenticated

            // Step 3.5 — Best-effort device-token server unregister.
            //             Runs BEFORE signalSignOut so the cached bearer token is still valid
            //             and BEFORE deleteToken so the FCM token hasn't been rotated.
            runCatching { deviceTokenRegistrar.unregister() }
                .onFailure { e ->
                    Sentry.addBreadcrumb(
                        io.sentry.Breadcrumb().apply {
                            category = "auth.signout"
                            message = "deviceTokenRegistrar.unregister failed: ${e.message}"
                            level = SentryLevel.WARNING
                        },
                    )
                }

            // Step 4 — Signal IdTokenCache to clear cached token and pause refresh loop.
            //           signalSignOut() increments signOutGeneration; capture it here so the
            //           FCM steps below can detect a concurrent sign-in and bail out.
            runCatching { idTokenCache.signalSignOut() }
                .onFailure { e ->
                    Sentry.addBreadcrumb(
                        io.sentry.Breadcrumb().apply {
                            category = "auth.signout"
                            message = "idTokenCache.signalSignOut() failed: ${e.message}"
                            level = SentryLevel.WARNING
                        },
                    )
                }
            // Read the generation AFTER signalSignOut (which bumps it) so any concurrent
            // signalSignIn (via saveSession) will produce a different value.
            val signOutGen = idTokenCache.currentSignOutGeneration()

            // Step 5 — Best-effort Firebase Auth sign-out (local SDK call; safe after prefs cleared)
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

            // Step 6b — Best-effort FCM token deletion (rotates registration token).
            //            Guard: skip if generation changed (new sign-in raced the FCM await).
            runCatching {
                if (idTokenCache.currentSignOutGeneration() != signOutGen) return@runCatching
                firebaseMessaging.deleteToken().await()
            }.onFailure { e ->
                Sentry.addBreadcrumb(
                    io.sentry.Breadcrumb().apply {
                        category = "auth.signout"
                        message = "FCM deleteToken failed: ${e.message}"
                        level = SentryLevel.WARNING
                    },
                )
            }
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
            idTokenCache.signalSignOut()
            _authState.value = AuthState.Unauthenticated
        }

        private fun clearPrefs(): Boolean {
            val committed = prefs.edit().clear().commit()
            if (!committed) {
                Sentry.addBreadcrumb("SessionManager.clearPrefs: SharedPreferences commit failed")
            }
            return committed
        }
    }
