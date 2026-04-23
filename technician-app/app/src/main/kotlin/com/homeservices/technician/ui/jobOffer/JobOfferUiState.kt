package com.homeservices.technician.ui.jobOffer

import com.homeservices.technician.domain.jobOffer.model.JobOffer

public sealed class JobOfferUiState {
    public data object Idle : JobOfferUiState()

    public data class Offering(
        val offer: JobOffer,
        val remainingSeconds: Int,
    ) : JobOfferUiState()

    public data class Accepted(
        val bookingId: String,
    ) : JobOfferUiState()

    public data object Declined : JobOfferUiState()

    public data object Expired : JobOfferUiState()
}
