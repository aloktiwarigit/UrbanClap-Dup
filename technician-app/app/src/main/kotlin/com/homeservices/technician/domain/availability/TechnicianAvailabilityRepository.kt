package com.homeservices.technician.domain.availability

import com.homeservices.technician.domain.availability.model.TechnicianAvailability

public interface TechnicianAvailabilityRepository {
    public suspend fun getAvailability(): Result<TechnicianAvailability>

    public suspend fun updateAvailability(availability: TechnicianAvailability): Result<TechnicianAvailability>
}
