package com.homeservices.corenav

/**
 * Shared auth state sealed interface for use in [RouteContext].
 * Mirrors the per-app AuthState, allowing core-nav to be auth-aware without
 * depending on Android or any per-app module.
 */
public sealed interface AuthState {
    /** User is authenticated. [uid] is the Firebase UID; [role] is "customer" or "technician". */
    public data class Authenticated(
        public val uid: String,
        public val role: String,
    ) : AuthState

    /** User is not authenticated or session has expired. */
    public object Unauthenticated : AuthState
}
