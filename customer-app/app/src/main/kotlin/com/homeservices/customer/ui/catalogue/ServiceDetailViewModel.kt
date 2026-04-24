package com.homeservices.customer.ui.catalogue

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.catalogue.GetServiceDetailUseCase
import com.homeservices.customer.domain.technician.GetConfidenceScoreUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
internal class ServiceDetailViewModel
    @Inject
    constructor(
        savedStateHandle: SavedStateHandle,
        private val getServiceDetail: GetServiceDetailUseCase,
        private val getConfidenceScore: GetConfidenceScoreUseCase,
    ) : ViewModel() {
        private val serviceId: String = checkNotNull(savedStateHandle["serviceId"])
        private val technicianId: String? = savedStateHandle["techId"]

        private val _uiState = MutableStateFlow<ServiceDetailUiState>(ServiceDetailUiState.Loading)
        public val uiState: StateFlow<ServiceDetailUiState> = _uiState.asStateFlow()

        private val _confidenceScoreState =
            MutableStateFlow<ConfidenceScoreUiState>(
                if (technicianId != null) ConfidenceScoreUiState.Loading else ConfidenceScoreUiState.Hidden,
            )
        public val confidenceScoreState: StateFlow<ConfidenceScoreUiState> = _confidenceScoreState.asStateFlow()

        init {
            viewModelScope.launch {
                getServiceDetail(serviceId).collect { result ->
                    _uiState.value =
                        result.fold(
                            onSuccess = { ServiceDetailUiState.Success(it) },
                            onFailure = { ServiceDetailUiState.Error(it.message ?: "Unknown error") },
                        )
                }
            }
            if (technicianId != null) {
                viewModelScope.launch {
                    // (0.0, 0.0) sentinel: API returns nearestEtaMinutes=null. Replace with
                    // a LocationRepository call when customer GPS story is implemented.
                    getConfidenceScore(technicianId, 0.0, 0.0).collect { result ->
                        _confidenceScoreState.value =
                            result.fold(
                                onSuccess = { score ->
                                    if (score.isLimitedData) {
                                        ConfidenceScoreUiState.Limited
                                    } else {
                                        ConfidenceScoreUiState.Loaded(score)
                                    }
                                },
                                onFailure = { ConfidenceScoreUiState.Hidden },
                            )
                    }
                }
            }
        }
    }
