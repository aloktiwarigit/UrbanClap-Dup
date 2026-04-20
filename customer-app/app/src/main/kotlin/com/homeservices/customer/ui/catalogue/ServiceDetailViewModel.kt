package com.homeservices.customer.ui.catalogue

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.catalogue.GetServiceDetailUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
internal class ServiceDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val getServiceDetail: GetServiceDetailUseCase,
) : ViewModel() {

    private val serviceId: String = checkNotNull(savedStateHandle["serviceId"])

    private val _uiState = MutableStateFlow<ServiceDetailUiState>(ServiceDetailUiState.Loading)
    public val uiState: StateFlow<ServiceDetailUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            getServiceDetail(serviceId).collect { result ->
                _uiState.value = result.fold(
                    onSuccess = { ServiceDetailUiState.Success(it) },
                    onFailure = { ServiceDetailUiState.Error(it.message ?: "Unknown error") },
                )
            }
        }
    }
}
