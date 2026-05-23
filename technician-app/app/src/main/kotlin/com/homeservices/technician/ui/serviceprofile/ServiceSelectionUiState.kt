package com.homeservices.technician.ui.serviceprofile

internal data class ServiceSelectionUiState(
    val services: List<ServiceCatalogueItem> = ServiceCatalogue.items,
    val selectedSkillIds: Set<String> = emptySet(),
    val serviceLat: Double? = null,
    val serviceLng: Double? = null,
    val serviceAreaLabel: String = "Service area not set",
    val isLoading: Boolean = true,
    val isSaving: Boolean = false,
    val isLocating: Boolean = false,
    val errorMessage: String? = null,
    val saved: Boolean = false,
    val existingCompleteProfileLoaded: Boolean = false,
)

internal const val DEFAULT_SERVICE_LAT: Double = 26.7922
internal const val DEFAULT_SERVICE_LNG: Double = 82.1998
