package com.homeservices.customer.domain.auth.model

internal sealed class AuthState {
    data object Unauthenticated : AuthState()
    data class Authenticated(
        val uid: String,
        val phoneLastFour: String,
    ) : AuthState()
}
