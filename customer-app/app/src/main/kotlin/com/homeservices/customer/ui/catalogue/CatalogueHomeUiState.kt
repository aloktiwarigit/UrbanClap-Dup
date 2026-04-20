package com.homeservices.customer.ui.catalogue

import com.homeservices.customer.domain.catalogue.model.Category

public sealed class CatalogueHomeUiState {
    public data object Loading : CatalogueHomeUiState()

    public data class Success(
        public val categories: List<Category>,
    ) : CatalogueHomeUiState()

    public data class Error(
        public val message: String,
    ) : CatalogueHomeUiState()
}
