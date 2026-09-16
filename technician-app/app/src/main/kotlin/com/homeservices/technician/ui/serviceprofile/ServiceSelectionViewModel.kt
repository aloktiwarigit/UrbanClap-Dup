package com.homeservices.technician.ui.serviceprofile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.domain.catalogue.GetSelectableServicesUseCase
import com.homeservices.technician.domain.serviceprofile.GetServiceProfileUseCase
import com.homeservices.technician.domain.serviceprofile.SaveServiceProfileUseCase
import com.homeservices.technician.domain.serviceprofile.model.ServiceLocation
import com.homeservices.technician.domain.serviceprofile.model.ServiceProfile
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val MIN_LAT = -90.0
private const val MAX_LAT = 90.0
private const val MIN_LNG = -180.0
private const val MAX_LNG = 180.0

@HiltViewModel
internal class ServiceSelectionViewModel
    @Inject
    constructor(
        private val getServiceProfile: GetServiceProfileUseCase,
        private val saveServiceProfile: SaveServiceProfileUseCase,
        private val getSelectableServices: GetSelectableServicesUseCase,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow(ServiceSelectionUiState())
        val uiState: StateFlow<ServiceSelectionUiState> = _uiState.asStateFlow()

        init {
            refresh()
        }

        fun refresh(): Unit {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            viewModelScope.launch {
                val catalogueResult = getSelectableServices()
                val services = catalogueResult.getOrElse { emptyList() }
                val catalogueLoadFailed = catalogueResult.isFailure
                val catalogueIds = services.map { it.id }.toSet()
                val outcome = getServiceProfile()
                _uiState.value =
                    outcome.fold(
                        onSuccess = { profile ->
                            // Partition rather than filter: a skill the catalogue does not
                            // list is a service that was deactivated server-side (the
                            // catalogue and the server's own validation both read from the
                            // same /v1/categories source now). It is tracked in
                            // unlistedSkillIds — so the profile is never mistaken for
                            // empty — but never resubmitted: the server hard-rejects any
                            // payload containing a deactivated skill.
                            val (listed, unlisted) = profile.skills.partition { it in catalogueIds }
                            _uiState.value.copy(
                                services = services,
                                selectedSkillIds = listed.toSet(),
                                unlistedSkillIds = unlisted.toSet(),
                                serviceLat = profile.location?.lat,
                                serviceLng = profile.location?.lng,
                                serviceAreaLabel =
                                    if (profile.location == null) {
                                        "Service area not set"
                                    } else {
                                        "Saved service area"
                                    },
                                isLoading = false,
                                // No separate error copy here: when the catalogue is empty,
                                // ServiceListCard already shows the bilingual
                                // service_selection_catalogue_unavailable message itself.
                                errorMessage = null,
                                existingCompleteProfileLoaded =
                                    (listed.isNotEmpty() || unlisted.isNotEmpty()) &&
                                        profile.location?.let { validateLocation(it.lat, it.lng) == null } == true,
                                profileLoadFailed = false,
                                catalogueLoadFailed = catalogueLoadFailed,
                            )
                        },
                        onFailure = {
                            // The profile was never read, so any skills it holds are unknown
                            // here — they cannot be merged back in. Saving now would PATCH a
                            // reduced skills array over the technician's real one server-side
                            // (the backend replaces, it does not merge). profileLoadFailed
                            // blocks submit() and the Save button until a retry succeeds.
                            _uiState.value.copy(
                                services = services,
                                isLoading = false,
                                errorMessage = "Could not load your saved services.",
                                existingCompleteProfileLoaded = false,
                                profileLoadFailed = true,
                                catalogueLoadFailed = catalogueLoadFailed,
                            )
                        },
                    )
            }
        }

        fun toggleSkill(skillId: String): Unit {
            val current = _uiState.value
            // Only catalogue-listed services are toggleable; unlisted ones are held
            // untouched in unlistedSkillIds.
            if (current.services.none { it.id == skillId }) return
            val selected =
                if (skillId in current.selectedSkillIds) {
                    current.selectedSkillIds - skillId
                } else {
                    current.selectedSkillIds + skillId
                }
            _uiState.value =
                current.copy(
                    selectedSkillIds = selected,
                    errorMessage = null,
                    saved = false,
                    existingCompleteProfileLoaded = false,
                )
        }

        fun onLocateStarted(): Unit {
            _uiState.value = _uiState.value.copy(isLocating = true, errorMessage = null)
        }

        fun onServiceAreaCaptured(
            lat: Double,
            lng: Double,
        ): Unit {
            val validation = validateLocation(lat, lng)
            _uiState.value =
                if (validation == null) {
                    _uiState.value.copy(
                        serviceLat = lat,
                        serviceLng = lng,
                        serviceAreaLabel = "Current location captured",
                        isLocating = false,
                        errorMessage = null,
                        saved = false,
                        existingCompleteProfileLoaded = false,
                    )
                } else {
                    _uiState.value.copy(
                        isLocating = false,
                        errorMessage = validation,
                        saved = false,
                        existingCompleteProfileLoaded = false,
                    )
                }
        }

        fun onLocateFailed(message: String): Unit {
            _uiState.value =
                _uiState.value.copy(
                    isLocating = false,
                    errorMessage = message,
                    saved = false,
                    existingCompleteProfileLoaded = false,
                )
        }

        fun submit(): Unit {
            val current = _uiState.value
            // Defense in depth: the Save button is disabled while either flag is true,
            // but never trust that alone. profileLoadFailed: the profile was never read,
            // so saving now would PATCH a reduced skills array over the technician's real
            // one server-side (the backend replaces, it does not merge). catalogueLoadFailed:
            // without the catalogue we cannot tell an active skill from a deactivated one,
            // so we cannot build a payload the server is guaranteed to accept.
            if (current.profileLoadFailed || current.catalogueLoadFailed) return
            val validation = validate(current)
            if (validation != null) {
                _uiState.value = current.copy(errorMessage = validation)
                return
            }

            val location =
                ServiceLocation(
                    lat = current.serviceLat ?: DEFAULT_SERVICE_LAT,
                    lng = current.serviceLng ?: DEFAULT_SERVICE_LNG,
                )
            _uiState.value = current.copy(isSaving = true, errorMessage = null)
            viewModelScope.launch {
                val outcome =
                    saveServiceProfile(
                        ServiceProfile(
                            // unlistedSkillIds are deliberately NOT included: they are
                            // deactivated services, and the server hard-rejects any payload
                            // that references one (VALIDATION_ERROR). Sending only the
                            // catalogue-listed selection is the only payload guaranteed to
                            // be writable — submit() already refused above if the catalogue
                            // itself failed to load, so "unlisted" here always means
                            // "confirmed deactivated," never "unknown."
                            skills = current.selectedSkillIds.sorted(),
                            location = location,
                        ),
                    )
                _uiState.value =
                    outcome.fold(
                        onSuccess = {
                            val catalogueIds = current.services.map { svc -> svc.id }.toSet()
                            val (listed, unlisted) = it.skills.partition { skill -> skill in catalogueIds }
                            _uiState.value.copy(
                                selectedSkillIds = listed.toSet(),
                                unlistedSkillIds = unlisted.toSet(),
                                serviceLat = it.location?.lat ?: location.lat,
                                serviceLng = it.location?.lng ?: location.lng,
                                serviceAreaLabel = "Saved service area",
                                isSaving = false,
                                saved = true,
                                errorMessage = null,
                                existingCompleteProfileLoaded = true,
                            )
                        },
                        onFailure = {
                            _uiState.value.copy(
                                isSaving = false,
                                errorMessage = "Could not save services. Check your connection and try again.",
                            )
                        },
                    )
            }
        }

        private fun validate(state: ServiceSelectionUiState): String? {
            val lat = state.serviceLat
            val lng = state.serviceLng
            return when {
                // unlistedSkillIds counts too: a catalogue fetch failure or a deactivated
                // service must never force a technician to lose an already-saved skill
                // just because nothing is currently toggleable.
                state.selectedSkillIds.isEmpty() && state.unlistedSkillIds.isEmpty() -> "Select at least one service."
                lat == null || lng == null -> "Use current location to set your service area."
                else -> validateLocation(lat, lng)
            }
        }

        private fun validateLocation(
            lat: Double,
            lng: Double,
        ): String? =
            when {
                lat !in MIN_LAT..MAX_LAT -> "Location latitude is outside the supported range."
                lng !in MIN_LNG..MAX_LNG -> "Location longitude is outside the supported range."
                else -> null
            }
    }
