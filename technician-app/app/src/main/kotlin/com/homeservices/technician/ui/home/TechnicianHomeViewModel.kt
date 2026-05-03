package com.homeservices.technician.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.domain.jobs.GetTechnicianBookingsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
internal class TechnicianHomeViewModel
    @Inject
    constructor(
        private val getBookings: GetTechnicianBookingsUseCase,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<TechnicianHomeUiState>(TechnicianHomeUiState.Loading)
        val uiState: StateFlow<TechnicianHomeUiState> = _uiState.asStateFlow()

        init {
            refresh()
        }

        fun refresh() {
            viewModelScope.launch {
                _uiState.value = TechnicianHomeUiState.Loading
                _uiState.value =
                    getBookings()
                        .fold(
                            onSuccess = { TechnicianHomeUiState.Ready(it) },
                            onFailure = { TechnicianHomeUiState.Error },
                        )
            }
        }
    }
