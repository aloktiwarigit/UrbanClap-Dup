package com.homeservices.technician.ui.home

import com.homeservices.technician.domain.jobs.model.TechnicianBooking

internal sealed class TechnicianHomeUiState {
    data object Loading : TechnicianHomeUiState()

    data class Ready(
        val bookings: List<TechnicianBooking>,
    ) : TechnicianHomeUiState()

    data object Error : TechnicianHomeUiState()
}
