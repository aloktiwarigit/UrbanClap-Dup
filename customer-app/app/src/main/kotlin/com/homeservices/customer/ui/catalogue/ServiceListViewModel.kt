package com.homeservices.customer.ui.catalogue

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.catalogue.CatalogueLocalizer
import com.homeservices.customer.domain.catalogue.GetServicesForCategoryUseCase
import com.homeservices.customer.domain.locale.GetCurrentLocaleUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
internal class ServiceListViewModel
    @Inject
    constructor(
        savedStateHandle: SavedStateHandle,
        private val getServices: GetServicesForCategoryUseCase,
        private val localizer: CatalogueLocalizer,
        private val getCurrentLocale: GetCurrentLocaleUseCase,
    ) : ViewModel() {
        private val categoryId: String = checkNotNull(savedStateHandle["categoryId"])

        private val _uiState = MutableStateFlow<ServiceListUiState>(ServiceListUiState.Loading)
        public val uiState: StateFlow<ServiceListUiState> = _uiState.asStateFlow()

        init {
            viewModelScope.launch {
                combine(getServices(categoryId), getCurrentLocale()) { result, locale ->
                    result.fold(
                        onSuccess = { services ->
                            ServiceListUiState.Success(
                                services.map { localizer.localizeService(it, locale) },
                            )
                        },
                        onFailure = { ServiceListUiState.Error(it.message ?: "Unknown error") },
                    )
                }.collect { state ->
                    _uiState.value = state
                }
            }
        }
    }
