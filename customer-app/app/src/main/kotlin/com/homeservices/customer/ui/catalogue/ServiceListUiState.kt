package com.homeservices.customer.ui.catalogue

import com.homeservices.customer.domain.catalogue.model.Service

public sealed class ServiceListUiState {
    public data object Loading : ServiceListUiState()

    public data class Success(
        public val services: List<Service>,
    ) : ServiceListUiState()

    public data class Error(
        public val message: String,
    ) : ServiceListUiState()
}
