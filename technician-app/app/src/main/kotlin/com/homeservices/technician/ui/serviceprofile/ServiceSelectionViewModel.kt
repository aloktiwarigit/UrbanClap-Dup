package com.homeservices.technician.ui.serviceprofile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
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
    ) : ViewModel() {
        private val validSkillIds = ServiceCatalogue.items.map { it.id }.toSet()
        private val _uiState = MutableStateFlow(ServiceSelectionUiState())
        val uiState: StateFlow<ServiceSelectionUiState> = _uiState.asStateFlow()

        init {
            refresh()
        }

        fun refresh(): Unit {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            viewModelScope.launch {
                val outcome = getServiceProfile()
                _uiState.value =
                    outcome.fold(
                        onSuccess = { profile ->
                            val selectedSkillIds = profile.skills.filter { it in validSkillIds }.toSet()
                            _uiState.value.copy(
                                selectedSkillIds = selectedSkillIds,
                                serviceLat = profile.location?.lat,
                                serviceLng = profile.location?.lng,
                                serviceAreaLabel =
                                    if (profile.location == null) {
                                        "Service area not set"
                                    } else {
                                        "Saved service area"
                                    },
                                isLoading = false,
                                errorMessage = null,
                                existingCompleteProfileLoaded =
                                    selectedSkillIds.isNotEmpty() &&
                                        profile.location?.let { validateLocation(it.lat, it.lng) == null } == true,
                            )
                        },
                        onFailure = {
                            _uiState.value.copy(
                                isLoading = false,
                                errorMessage = "Could not load your saved services. You can still save this form.",
                                existingCompleteProfileLoaded = false,
                            )
                        },
                    )
            }
        }

        fun toggleSkill(skillId: String): Unit {
            if (skillId !in validSkillIds) return
            val current = _uiState.value
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
                            skills = current.selectedSkillIds.sorted(),
                            location = location,
                        ),
                    )
                _uiState.value =
                    outcome.fold(
                        onSuccess = {
                            _uiState.value.copy(
                                selectedSkillIds = it.skills.filter { skill -> skill in validSkillIds }.toSet(),
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
                state.selectedSkillIds.isEmpty() -> "Select at least one service."
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
