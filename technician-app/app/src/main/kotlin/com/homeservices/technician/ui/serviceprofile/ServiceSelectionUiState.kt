package com.homeservices.technician.ui.serviceprofile

import com.homeservices.technician.domain.catalogue.model.SelectableService

internal data class ServiceSelectionUiState(
    val services: List<SelectableService> = emptyList(),
    val selectedSkillIds: Set<String> = emptySet(),
    // Skills the technician has saved that the fetched catalogue does not list — for
    // example a service deactivated after they selected it, or any skill at all when
    // the catalogue fetch fails. Held here and merged back on save so the app can
    // never silently delete a technician's skill.
    val unlistedSkillIds: Set<String> = emptySet(),
    val serviceLat: Double? = null,
    val serviceLng: Double? = null,
    val serviceAreaLabel: String = "Service area not set",
    val isLoading: Boolean = true,
    val isSaving: Boolean = false,
    val isLocating: Boolean = false,
    val errorMessage: String? = null,
    val saved: Boolean = false,
    val existingCompleteProfileLoaded: Boolean = false,
    // True when the last profile fetch failed. Unlisted skills can only be preserved if
    // they were actually read from the profile — when the read itself failed, submit()
    // must refuse to save, because the backend PATCH replaces the whole skills array and
    // an unread profile's skills would otherwise be wiped out.
    val profileLoadFailed: Boolean = false,
)

internal const val DEFAULT_SERVICE_LAT: Double = 26.7922
internal const val DEFAULT_SERVICE_LNG: Double = 82.1998
