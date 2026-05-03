package com.homeservices.technician.data.availability

import com.homeservices.technician.data.availability.remote.TechnicianAvailabilityApiService
import com.homeservices.technician.data.availability.remote.dto.toRequestDto
import com.homeservices.technician.domain.availability.TechnicianAvailabilityRepository
import com.homeservices.technician.domain.availability.model.TechnicianAvailability
import javax.inject.Inject

internal class TechnicianAvailabilityRepositoryImpl
    @Inject
    constructor(
        private val apiService: TechnicianAvailabilityApiService,
    ) : TechnicianAvailabilityRepository {
        override suspend fun getAvailability(): Result<TechnicianAvailability> = runCatching { apiService.getAvailability().toDomain() }

        override suspend fun updateAvailability(availability: TechnicianAvailability): Result<TechnicianAvailability> =
            runCatching { apiService.updateAvailability(availability.toRequestDto()).toDomain() }
    }
