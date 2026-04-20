package com.homeservices.customer.ui.catalogue

import com.homeservices.customer.domain.catalogue.model.Service

public sealed class ServiceDetailUiState {
    public data object Loading : ServiceDetailUiState()
    public data class Success(public val service: Service) : ServiceDetailUiState()
    public data class Error(public val message: String) : ServiceDetailUiState()
}
