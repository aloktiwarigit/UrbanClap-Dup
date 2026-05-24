package com.homeservices.customer.observability

import com.homeservices.customer.domain.auth.model.AuthState
import io.sentry.Breadcrumb
import io.sentry.Sentry
import io.sentry.SentryLevel
import io.sentry.protocol.User
import kotlinx.coroutines.flow.Flow

/**
 * Thin, testable façade for all Sentry context mutations (E18-S06).
 *
 * Responsibilities:
 * - Bind user-context in Sentry when [AuthState] changes (never raw UID).
 * - Record route-transition breadcrumbs on every NavController destination change.
 *
 * Stateless object — all functions are pure side-effect dispatchers so they can
 * be unit-tested by MockK-patching Sentry's static API.
 *
 * Coordination note (Stream 2.1 / E11-S01b-1):
 * [bindAuthState] is driven from a [LaunchedEffect] in [AppNavigation] and does
 * NOT change the composable's signature. The breadcrumb listener is also added
 * inside a [LaunchedEffect] block. Both additions are purely additive.
 */
public object SentryContextBinder {
    /**
     * Collects [authStateFlow] and updates Sentry user-context on each emission.
     *
     * - [AuthState.Authenticated]: calls [Sentry.setUser] with a 16-char hashed uid.
     * - [AuthState.Unauthenticated]: calls [Sentry.setUser] with null (clears context).
     *
     * Intended to be called from a [kotlinx.coroutines.CoroutineScope] that is
     * tied to the lifecycle of [AppNavigation] via [LaunchedEffect].
     *
     * @param authStateFlow A cold or hot [Flow] of [AuthState] values.
     */
    public suspend fun bindAuthState(authStateFlow: Flow<AuthState>) {
        authStateFlow.collect { state ->
            when (state) {
                is AuthState.Authenticated -> {
                    val user =
                        User().apply {
                            id = SentryIdentity.sentryUserId(state.uid)
                        }
                    Sentry.setUser(user)
                }
                is AuthState.Unauthenticated -> Sentry.setUser(null)
                is AuthState.Initializing -> Unit
            }
        }
    }

    /**
     * Adds a Sentry navigation breadcrumb for a single route transition.
     *
     * Safe to call from a [androidx.navigation.NavController.OnDestinationChangedListener].
     * Falls back to "(initial)" when [from] is null (first destination), and
     * "(unknown)" when [to] is null (defensive, should not happen with typed routes).
     *
     * @param from Previous route string, or null if this is the first destination.
     * @param to New route string.
     */
    public fun recordNavigationBreadcrumb(
        from: String?,
        to: String?,
    ) {
        val crumb =
            Breadcrumb
                .navigation(
                    from ?: "(initial)",
                    to ?: "(unknown)",
                ).apply {
                    level = SentryLevel.INFO
                }
        Sentry.addBreadcrumb(crumb)
    }
}
