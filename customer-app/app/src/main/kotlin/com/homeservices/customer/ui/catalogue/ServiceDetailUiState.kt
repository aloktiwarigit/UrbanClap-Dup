package com.homeservices.customer.ui.catalogue

import com.homeservices.customer.domain.catalogue.model.Service
import com.homeservices.customer.domain.technician.model.ConfidenceScore

public sealed class ServiceDetailUiState {
    public data object Loading : ServiceDetailUiState()

    public data class Success(
        public val service: Service,
    ) : ServiceDetailUiState()

    public data class Error(
        public val message: String,
    ) : ServiceDetailUiState()
}

public sealed class ConfidenceScoreUiState {
    public data object Hidden : ConfidenceScoreUiState()
    public data object Loading : ConfidenceScoreUiState()
    public data object Limited : ConfidenceScoreUiState()
    public data class Loaded(public val score: ConfidenceScore) : ConfidenceScoreUiState()
}
