package com.homeservices.customer.data.technician

import com.homeservices.customer.data.technician.remote.TechnicianProfileApiService
import com.homeservices.customer.data.technician.remote.dto.toDomain
import com.homeservices.customer.domain.technician.TechnicianProfileRepository
import com.homeservices.customer.domain.technician.model.TechnicianProfile
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

internal class TechnicianProfileRepositoryImpl
    @Inject
    constructor(
        private val api: TechnicianProfileApiService,
    ) : TechnicianProfileRepository {
        override fun getProfile(technicianId: String): Flow<Result<TechnicianProfile>> =
            flow {
                emit(runCatching { api.getProfile(technicianId).toDomain() })
            }
    }
