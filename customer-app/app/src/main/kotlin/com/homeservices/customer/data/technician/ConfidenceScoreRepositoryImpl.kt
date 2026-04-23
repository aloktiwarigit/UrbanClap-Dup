package com.homeservices.customer.data.technician

import com.homeservices.customer.data.technician.remote.TechnicianApiService
import com.homeservices.customer.domain.technician.model.ConfidenceScore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

internal class ConfidenceScoreRepositoryImpl @Inject constructor(
    private val api: TechnicianApiService,
) : ConfidenceScoreRepository {
    override fun getConfidenceScore(
        technicianId: String,
        lat: Double,
        lng: Double,
    ): Flow<Result<ConfidenceScore>> = flow {
        emit(runCatching { api.getConfidenceScore(technicianId, lat, lng).toDomain() })
    }
}
