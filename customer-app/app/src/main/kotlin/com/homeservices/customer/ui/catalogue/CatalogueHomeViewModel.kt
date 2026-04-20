package com.homeservices.customer.ui.catalogue

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.catalogue.GetCategoriesUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
internal class CatalogueHomeViewModel @Inject constructor(
    private val getCategories: GetCategoriesUseCase,
) : ViewModel() {

    private val _uiState = MutableStateFlow<CatalogueHomeUiState>(CatalogueHomeUiState.Loading)
    public val uiState: StateFlow<CatalogueHomeUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            getCategories().collect { result ->
                _uiState.value = result.fold(
                    onSuccess = { CatalogueHomeUiState.Success(it) },
                    onFailure = { CatalogueHomeUiState.Error(it.message ?: "Unknown error") },
                )
            }
        }
    }
}
