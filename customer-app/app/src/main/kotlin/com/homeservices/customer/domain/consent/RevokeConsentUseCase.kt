package com.homeservices.customer.domain.consent

import javax.inject.Inject

/**
 * Revoke DPDP consent.
 *
 * Delegates entirely to [ConsentRepository.revokeConsent], which persists the
 * revocation and fires a best-effort audit POST to the server internally.
 */
public class RevokeConsentUseCase
    @Inject
    constructor(
        private val consentRepository: ConsentRepository,
    ) {
        public suspend operator fun invoke() {
            consentRepository.revokeConsent()
        }
    }
