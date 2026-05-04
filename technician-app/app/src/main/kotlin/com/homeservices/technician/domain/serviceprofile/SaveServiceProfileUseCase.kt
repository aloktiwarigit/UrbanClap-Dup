package com.homeservices.technician.domain.serviceprofile

import com.homeservices.technician.domain.serviceprofile.model.ServiceProfile
import javax.inject.Inject

public class SaveServiceProfileUseCase
    @Inject
    constructor(
        private val repository: ServiceProfileRepository,
    ) {
        @Suppress("MaxLineLength")
        public suspend operator fun invoke(profile: ServiceProfile): Result<ServiceProfile> = repository.saveServiceProfile(profile)
    }
