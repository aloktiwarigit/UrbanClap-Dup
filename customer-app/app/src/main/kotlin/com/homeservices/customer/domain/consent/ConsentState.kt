package com.homeservices.customer.domain.consent

import java.time.Instant

public sealed class ConsentState {
    public object NotGiven : ConsentState()

    public data class Granted(
        val version: Int,
        val grantedAt: Instant,
        val analyticsOptIn: Boolean,
        val crashOptIn: Boolean,
        val marketingOptIn: Boolean,
    ) : ConsentState()

    public object Revoked : ConsentState()
}

public const val CURRENT_CONSENT_VERSION: Int = 1
