package com.homeservices.customer.domain.consent

import javax.inject.Inject

/**
 * Grant DPDP consent.
 *
 * Delegates entirely to [ConsentRepository.grantConsent], which persists the
 * consent state and fires a best-effort audit POST to the server internally.
 */
public class GrantConsentUseCase
    @Inject
    constructor(
        private val consentRepository: ConsentRepository,
    ) {
        public suspend operator fun invoke(
            analyticsOptIn: Boolean,
            crashOptIn: Boolean,
            marketingOptIn: Boolean,
        ) {
            consentRepository.grantConsent(
                analyticsOptIn = analyticsOptIn,
                crashOptIn = crashOptIn,
                marketingOptIn = marketingOptIn,
            )
        }
    }
