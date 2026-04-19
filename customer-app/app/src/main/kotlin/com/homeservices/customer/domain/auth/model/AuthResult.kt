package com.homeservices.customer.domain.auth.model

import com.google.firebase.auth.FirebaseUser

internal sealed class AuthResult {
    data class Success(val user: FirebaseUser) : AuthResult()
    data object Cancelled : AuthResult()
    data object Unavailable : AuthResult()

    internal sealed class Error : AuthResult() {
        data class General(val cause: Throwable) : Error()
        data object RateLimited : Error()
        data object WrongCode : Error()
        data object CodeExpired : Error()
    }
}
