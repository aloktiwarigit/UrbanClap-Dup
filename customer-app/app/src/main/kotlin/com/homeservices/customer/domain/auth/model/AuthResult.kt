package com.homeservices.customer.domain.auth.model

import com.google.firebase.auth.FirebaseUser

public sealed class AuthResult {
    public data class Success(val user: FirebaseUser) : AuthResult()
    public data object Cancelled : AuthResult()
    public data object Unavailable : AuthResult()

    public sealed class Error : AuthResult() {
        public data class General(val cause: Throwable) : Error()
        public data object RateLimited : Error()
        public data object WrongCode : Error()
        public data object CodeExpired : Error()
    }
}
