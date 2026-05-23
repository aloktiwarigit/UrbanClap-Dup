package com.homeservices.technician.domain.auth.model

import com.google.firebase.auth.AuthCredential

public sealed class GoogleSignInResult {
    public data class CredentialObtained(
        val credential: AuthCredential,
    ) : GoogleSignInResult()

    public data object Cancelled : GoogleSignInResult()

    public data object Unavailable : GoogleSignInResult()

    public data class Error(
        val cause: Throwable,
    ) : GoogleSignInResult()
}
