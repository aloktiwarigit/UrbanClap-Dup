package com.homeservices.customer.ui.catalogue

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.catalogue.CatalogueLocalizer
import com.homeservices.customer.domain.catalogue.GetServicesForCategoryUseCase
import com.homeservices.customer.domain.locale.GetCurrentLocaleUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
@OptIn(ExperimentalCoroutinesApi::class)
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

        private val retryTrigger = MutableStateFlow(0)

        init {
            viewModelScope.launch {
                retryTrigger
                    .flatMapLatest {
                        combine(getServices(categoryId), getCurrentLocale()) { result, locale ->
                            result.fold(
                                onSuccess = { services ->
                                    ServiceListUiState.Success(
                                        services.map { localizer.localizeService(it, locale) },
                                    )
                                },
                                onFailure = { ServiceListUiState.Error(it.message ?: "Unknown error") },
                            )
                        }
                    }.collect { state -> _uiState.value = state }
            }
        }

        /** Re-fetches the service list. Returns to [ServiceListUiState.Loading] first. */
        public fun retry() {
            _uiState.value = ServiceListUiState.Loading
            retryTrigger.value += 1
        }
    }
