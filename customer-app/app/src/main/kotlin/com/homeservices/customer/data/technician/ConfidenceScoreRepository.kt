package com.homeservices.customer.data.technician

import com.homeservices.customer.domain.technician.model.ConfidenceScore
import kotlinx.coroutines.flow.Flow

public interface ConfidenceScoreRepository {
    public fun getConfidenceScore(
        technicianId: String,
        lat: Double,
        lng: Double,
    ): Flow<Result<ConfidenceScore>>
}
