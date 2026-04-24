package com.homeservices.customer.ui.catalogue

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.technician.GetConfidenceScoreUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
internal class ServiceDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val getConfidenceScore: GetConfidenceScoreUseCase,
) : ViewModel() {
    private val serviceId: String = checkNotNull(savedStateHandle["serviceId"])
    private val technicianId: String? = savedStateHandle["techId"]

    private val _uiState = MutableStateFlow<ServiceDetailUiState>(ServiceDetailUiState.Loading)
    public val uiState: StateFlow<ServiceDetailUiState> = _uiState.asStateFlow()

    private val _confidenceScoreState = MutableStateFlow<ConfidenceScoreUiState>(
        if (technicianId != null) ConfidenceScoreUiState.Loading else ConfidenceScoreUiState.Hidden,
    )
    public val confidenceScoreState: StateFlow<ConfidenceScoreUiState> = _confidenceScoreState.asStateFlow()

    init {
        _uiState.value = ServiceDetailUiState.Success(serviceId)
        if (technicianId != null) {
            viewModelScope.launch {
                // (0.0, 0.0) sentinel: API returns nearestEtaMinutes=null for these coords rather
                // than a nonsensical Gulf-of-Guinea ETA. Wire in a LocationRepository here when
                // customer GPS is available (follow-up story after customer auth merges).
                getConfidenceScore(technicianId, 0.0, 0.0).collect { result ->
                    _confidenceScoreState.value = result.fold(
                        onSuccess = { score ->
                            if (score.isLimitedData) ConfidenceScoreUiState.Limited
                            else ConfidenceScoreUiState.Loaded(score)
                        },
                        onFailure = { ConfidenceScoreUiState.Hidden },
                    )
                }
            }
        }
    }
}
