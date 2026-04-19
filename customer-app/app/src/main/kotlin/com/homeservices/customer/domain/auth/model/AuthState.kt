package com.homeservices.customer.domain.auth.model

public sealed class AuthState {
    public data object Unauthenticated : AuthState()

    public data class Authenticated(
        public val uid: String,
        public val phoneLastFour: String,
    ) : AuthState()
}
