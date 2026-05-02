package com.homeservices.customer.domain.auth.model

public sealed class AuthState {
    public data object Unauthenticated : AuthState()

    public data class Authenticated(
        public val uid: String,
        public val phoneLastFour: String? = null,
        public val email: String? = null,
        public val displayName: String? = null,
        public val authProvider: AuthProvider = AuthProvider.Phone,
    ) : AuthState()
}
