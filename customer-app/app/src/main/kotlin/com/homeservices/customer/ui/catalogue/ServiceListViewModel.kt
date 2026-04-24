package com.homeservices.customer.ui.catalogue

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.catalogue.GetServicesForCategoryUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
internal class ServiceListViewModel
    @Inject
    constructor(
        savedStateHandle: SavedStateHandle,
        private val getServices: GetServicesForCategoryUseCase,
    ) : ViewModel() {
        private val categoryId: String = checkNotNull(savedStateHandle["categoryId"])

        private val _uiState = MutableStateFlow<ServiceListUiState>(ServiceListUiState.Loading)
        public val uiState: StateFlow<ServiceListUiState> = _uiState.asStateFlow()

        init {
            viewModelScope.launch {
                getServices(categoryId).collect { result ->
                    _uiState.value =
                        result.fold(
                            onSuccess = { ServiceListUiState.Success(it) },
                            onFailure = { ServiceListUiState.Error(it.message ?: "Unknown error") },
                        )
                }
            }
        }
    }
