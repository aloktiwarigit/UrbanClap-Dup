package com.homeservices.customer.ui.shared

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.technician.GetTechnicianProfileUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
internal class TrustDossierViewModel
    @Inject
    constructor(
        private val getProfile: GetTechnicianProfileUseCase,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<TrustDossierUiState>(TrustDossierUiState.Unavailable)
        public val uiState: StateFlow<TrustDossierUiState> = _uiState.asStateFlow()

        public fun loadProfile(technicianId: String) {
            viewModelScope.launch {
                _uiState.value = TrustDossierUiState.Loading
                getProfile(technicianId).collect { result ->
                    _uiState.value =
                        result.fold(
                            onSuccess = { TrustDossierUiState.Loaded(it) },
                            onFailure = { TrustDossierUiState.Error(it.message ?: "Unknown error") },
                        )
                }
            }
        }
    }
