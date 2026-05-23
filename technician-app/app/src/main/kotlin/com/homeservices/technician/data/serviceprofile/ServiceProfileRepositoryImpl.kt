package com.homeservices.technician.data.serviceprofile

import com.homeservices.technician.data.serviceprofile.remote.ServiceProfileApiService
import com.homeservices.technician.data.serviceprofile.remote.dto.toRequestDto
import com.homeservices.technician.domain.serviceprofile.ServiceProfileRepository
import com.homeservices.technician.domain.serviceprofile.model.ServiceProfile
import javax.inject.Inject

internal class ServiceProfileRepositoryImpl
    @Inject
    constructor(
        private val apiService: ServiceProfileApiService,
    ) : ServiceProfileRepository {
        @Suppress("MaxLineLength")
        override suspend fun getServiceProfile(): Result<ServiceProfile> = runCatching { apiService.getServiceProfile().toDomain() }

        override suspend fun saveServiceProfile(profile: ServiceProfile): Result<ServiceProfile> =
            runCatching { apiService.saveServiceProfile(profile.toRequestDto()).toDomain() }
    }
