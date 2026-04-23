package com.homeservices.customer.ui.shared

import com.homeservices.customer.domain.technician.model.TechnicianProfile

public sealed class TrustDossierUiState {
    public object Loading : TrustDossierUiState()

    public data class Loaded(
        val profile: TechnicianProfile,
    ) : TrustDossierUiState()

    public data class Error(
        val message: String,
    ) : TrustDossierUiState()

    public object Unavailable : TrustDossierUiState()
}
