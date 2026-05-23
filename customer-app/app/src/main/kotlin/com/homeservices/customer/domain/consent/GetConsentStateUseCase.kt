package com.homeservices.customer.domain.consent

import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/** Expose the current [ConsentState] as a hot [Flow] sourced from DataStore. */
public class GetConsentStateUseCase
    @Inject
    constructor(
        private val consentRepository: ConsentRepository,
    ) {
        public operator fun invoke(): Flow<ConsentState> = consentRepository.consentState
    }
