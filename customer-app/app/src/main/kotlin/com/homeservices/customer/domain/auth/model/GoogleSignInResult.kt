package com.homeservices.customer.domain.auth.model

import com.google.firebase.auth.AuthCredential

public sealed class GoogleSignInResult {
    public data class CredentialObtained(
        public val credential: AuthCredential,
    ) : GoogleSignInResult()

    public data object Cancelled : GoogleSignInResult()

    public data object Unavailable : GoogleSignInResult()

    public data class Error(
        public val cause: Throwable,
    ) : GoogleSignInResult()
}
