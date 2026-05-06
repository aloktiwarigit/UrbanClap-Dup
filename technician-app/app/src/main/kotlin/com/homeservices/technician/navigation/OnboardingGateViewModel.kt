package com.homeservices.technician.navigation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.domain.serviceprofile.GetServiceProfileUseCase
import com.homeservices.technician.domain.serviceprofile.model.ServiceLocation
import com.homeservices.technician.domain.serviceprofile.model.ServiceProfile
import com.homeservices.technician.ui.serviceprofile.ServiceCatalogue
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
internal class OnboardingGateViewModel
    @Inject
    constructor(
        private val getServiceProfile: GetServiceProfileUseCase,
    ) : ViewModel() {
        private val validSkillIds = ServiceCatalogue.items.map { it.id }.toSet()
        private val _uiState = MutableStateFlow<OnboardingGateUiState>(OnboardingGateUiState.Checking)
        val uiState: StateFlow<OnboardingGateUiState> = _uiState.asStateFlow()

        init {
            resolve()
        }

        fun resolve(): Unit {
            _uiState.value = OnboardingGateUiState.Checking
            viewModelScope.launch {
                val profile = getServiceProfile().getOrNull()
                _uiState.value =
                    if (profile != null && profile.isComplete()) {
                        OnboardingGateUiState.Complete
                    } else {
                        OnboardingGateUiState.NeedsOnboarding
                    }
            }
        }

        private fun ServiceProfile.isComplete(): Boolean =
            skills.any { it in validSkillIds } &&
                location?.isValid() == true

        private fun ServiceLocation.isValid(): Boolean =
            lat in MIN_LAT..MAX_LAT &&
                lng in MIN_LNG..MAX_LNG
    }

internal sealed interface OnboardingGateUiState {
    data object Checking : OnboardingGateUiState

    data object Complete : OnboardingGateUiState

    data object NeedsOnboarding : OnboardingGateUiState
}
