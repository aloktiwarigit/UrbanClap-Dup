package com.homeservices.customer.domain.consent

import kotlinx.coroutines.flow.Flow

public interface ConsentRepository {
    public val consentState: Flow<ConsentState>

    /** True if consent is [ConsentState.NotGiven] or granted at a version older than [CURRENT_CONSENT_VERSION]. */
    public val isConsentRequired: Flow<Boolean>

    public suspend fun grantConsent(
        analyticsOptIn: Boolean,
        crashOptIn: Boolean,
        marketingOptIn: Boolean,
    )

    public suspend fun revokeConsent()
}
