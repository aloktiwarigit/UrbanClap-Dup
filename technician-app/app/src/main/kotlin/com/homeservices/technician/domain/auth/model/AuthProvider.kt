package com.homeservices.technician.domain.auth.model

public sealed class AuthProvider {
    public data object Phone : AuthProvider()

    public data object Google : AuthProvider()

    public data object Email : AuthProvider()
}
