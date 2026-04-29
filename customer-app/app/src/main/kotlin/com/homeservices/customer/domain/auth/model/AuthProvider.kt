package com.homeservices.customer.domain.auth.model

public sealed class AuthProvider {
    public data object Phone : AuthProvider()
    public data object Google : AuthProvider()
    public data object Email : AuthProvider()
}
