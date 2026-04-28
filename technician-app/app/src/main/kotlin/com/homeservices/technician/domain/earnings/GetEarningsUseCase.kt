package com.homeservices.technician.domain.earnings

import com.homeservices.technician.domain.earnings.model.EarningsSummary
import javax.inject.Inject

public class GetEarningsUseCase
    @Inject
    constructor(
        private val repository: EarningsRepository,
    ) {
        public suspend fun invoke(): Result<EarningsSummary> = repository.getEarnings()
    }
