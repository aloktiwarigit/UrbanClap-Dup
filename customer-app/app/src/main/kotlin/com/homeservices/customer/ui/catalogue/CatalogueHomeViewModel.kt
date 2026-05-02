package com.homeservices.customer.ui.catalogue

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.catalogue.CatalogueLocalizer
import com.homeservices.customer.domain.catalogue.GetCategoriesUseCase
import com.homeservices.customer.domain.locale.GetCurrentLocaleUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
internal class CatalogueHomeViewModel
    @Inject
    constructor(
        private val getCategories: GetCategoriesUseCase,
        private val localizer: CatalogueLocalizer,
        private val getCurrentLocale: GetCurrentLocaleUseCase,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<CatalogueHomeUiState>(CatalogueHomeUiState.Loading)
        public val uiState: StateFlow<CatalogueHomeUiState> = _uiState.asStateFlow()

        init {
            viewModelScope.launch {
                combine(getCategories(), getCurrentLocale()) { result, locale ->
                    result.fold(
                        onSuccess = { categories ->
                            CatalogueHomeUiState.Success(
                                categories.map { localizer.localizeCategory(it, locale) },
                            )
                        },
                        onFailure = { CatalogueHomeUiState.Error(it.message ?: "Unknown error") },
                    )
                }.collect { state ->
                    _uiState.value = state
                }
            }
        }
    }
