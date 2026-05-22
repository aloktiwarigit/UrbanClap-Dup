package com.homeservices.customer.domain.consent

import javax.inject.Inject
import kotlinx.coroutines.flow.Flow

/** Expose the current [ConsentState] as a hot [Flow] sourced from DataStore. */
public class GetConsentStateUseCase
    @Inject
    constructor(
        private val consentRepository: ConsentRepository,
    ) {
        public operator fun invoke(): Flow<ConsentState> = consentRepository.consentState
    }
