package com.homeservices.customer.domain.consent

import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/**
 * Returns a [Flow] that emits `true` when the user must be shown the consent gate
 * (i.e. consent is [ConsentState.NotGiven] or was granted at an older version).
 */
public class IsConsentRequiredUseCase
    @Inject
    constructor(
        private val consentRepository: ConsentRepository,
    ) {
        public operator fun invoke(): Flow<Boolean> = consentRepository.isConsentRequired
    }
