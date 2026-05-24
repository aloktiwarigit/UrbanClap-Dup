package com.homeservices.customer.data.auth

public enum class SessionInvalidationReason {
    FirebaseUserMissing,
    FirebaseUserMismatch,
    LocalSessionExpired,
    UnauthenticatedTokenRefresh,
}

public interface SessionInvalidator {
    public fun invalidateSession(reason: SessionInvalidationReason)
}
