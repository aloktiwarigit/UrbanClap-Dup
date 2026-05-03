package com.homeservices.technician.ui.home

import com.homeservices.technician.domain.availability.model.TechnicianAvailability
import com.homeservices.technician.domain.availability.model.defaultTechnicianAvailability

internal data class AvailabilityUiState(
    val availability: TechnicianAvailability = defaultTechnicianAvailability(),
    val isLoading: Boolean = true,
    val isSaving: Boolean = false,
    val errorMessage: String? = null,
)
