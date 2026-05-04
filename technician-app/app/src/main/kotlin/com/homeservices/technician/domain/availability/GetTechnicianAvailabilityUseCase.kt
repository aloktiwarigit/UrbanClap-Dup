package com.homeservices.technician.domain.availability

import com.homeservices.technician.domain.availability.model.TechnicianAvailability
import javax.inject.Inject

public class GetTechnicianAvailabilityUseCase
    @Inject
    constructor(
        private val repository: TechnicianAvailabilityRepository,
    ) {
        public suspend operator fun invoke(): Result<TechnicianAvailability> = repository.getAvailability()
    }
