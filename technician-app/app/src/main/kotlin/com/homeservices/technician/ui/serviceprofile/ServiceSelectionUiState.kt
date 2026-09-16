package com.homeservices.technician.ui.serviceprofile

import com.homeservices.technician.domain.catalogue.model.SelectableService

internal data class ServiceSelectionUiState(
    val services: List<SelectableService> = emptyList(),
    val selectedSkillIds: Set<String> = emptySet(),
    // Skills the technician has saved that the fetched catalogue does not list — i.e.
    // services deactivated server-side. Tracked here (never merged into a save payload)
    // so the profile is never mistaken for empty just because its only skills are no
    // longer active; the server hard-rejects any payload that references one.
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
    // True when the last catalogue fetch failed. Without the catalogue we cannot tell an
    // active skill from a deactivated one, so we cannot build a save payload the server
    // is guaranteed to accept. submit() refuses to save while this is set.
    val catalogueLoadFailed: Boolean = false,
)

internal const val DEFAULT_SERVICE_LAT: Double = 26.7922
internal const val DEFAULT_SERVICE_LNG: Double = 82.1998
