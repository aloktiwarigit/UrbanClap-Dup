package com.homeservices.technician.domain.serviceprofile

import com.homeservices.technician.domain.serviceprofile.model.ServiceProfile
import javax.inject.Inject

public class GetServiceProfileUseCase
    @Inject
    constructor(
        private val repository: ServiceProfileRepository,
    ) {
        @Suppress("MaxLineLength")
        public suspend operator fun invoke(): Result<ServiceProfile> = repository.getServiceProfile()
    }
