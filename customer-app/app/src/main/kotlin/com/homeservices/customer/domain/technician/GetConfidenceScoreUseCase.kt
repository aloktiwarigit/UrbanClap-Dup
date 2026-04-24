package com.homeservices.customer.domain.technician

import com.homeservices.customer.data.technician.ConfidenceScoreRepository
import com.homeservices.customer.domain.technician.model.ConfidenceScore
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetConfidenceScoreUseCase
    @Inject
    constructor(
        private val repository: ConfidenceScoreRepository,
    ) {
        public operator fun invoke(
            technicianId: String,
            lat: Double,
            lng: Double,
        ): Flow<Result<ConfidenceScore>> = repository.getConfidenceScore(technicianId, lat, lng)
    }
