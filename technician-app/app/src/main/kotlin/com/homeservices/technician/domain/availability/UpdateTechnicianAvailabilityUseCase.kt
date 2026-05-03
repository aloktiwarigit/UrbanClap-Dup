package com.homeservices.technician.domain.availability

import com.homeservices.technician.domain.availability.model.TechnicianAvailability
import javax.inject.Inject

public class UpdateTechnicianAvailabilityUseCase
    @Inject
    constructor(
        private val repository: TechnicianAvailabilityRepository,
    ) {
        public suspend operator fun invoke(availability: TechnicianAvailability): Result<TechnicianAvailability> =
            repository.updateAvailability(availability)
    }
