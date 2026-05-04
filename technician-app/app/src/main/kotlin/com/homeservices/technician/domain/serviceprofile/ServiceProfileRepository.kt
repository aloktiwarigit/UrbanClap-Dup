package com.homeservices.technician.domain.serviceprofile

import com.homeservices.technician.domain.serviceprofile.model.ServiceProfile

public interface ServiceProfileRepository {
    public suspend fun getServiceProfile(): Result<ServiceProfile>

    public suspend fun saveServiceProfile(profile: ServiceProfile): Result<ServiceProfile>
}
