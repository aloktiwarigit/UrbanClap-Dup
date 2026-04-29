package com.homeservices.technician.domain.payout

import javax.inject.Inject

public class UpdatePayoutCadenceUseCase
    @Inject
    constructor(
        private val repository: PayoutRepository,
    ) {
        public suspend fun invoke(cadence: String): Result<PayoutCadenceResult> = repository.updatePayoutCadence(cadence)
    }
