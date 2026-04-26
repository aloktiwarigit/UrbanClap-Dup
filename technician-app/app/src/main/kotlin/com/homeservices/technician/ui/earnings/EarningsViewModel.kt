package com.homeservices.technician.ui.earnings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.data.earnings.EarningsUpdateEventBus
import com.homeservices.technician.domain.earnings.GetEarningsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
public class EarningsViewModel
    @Inject
    constructor(
        private val getEarningsUseCase: GetEarningsUseCase,
        private val earningsUpdateEventBus: EarningsUpdateEventBus,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<EarningsUiState>(EarningsUiState.Loading)
        public val uiState: StateFlow<EarningsUiState> = _uiState.asStateFlow()

        init {
            loadEarnings()
            viewModelScope.launch {
                earningsUpdateEventBus.events.collect { loadEarnings() }
            }
        }

        public fun refresh(): Unit = loadEarnings()

        private fun loadEarnings() {
            viewModelScope.launch {
                _uiState.value = EarningsUiState.Loading
                val result = getEarningsUseCase.invoke()
                _uiState.value =
                    result.fold(
                        onSuccess = { EarningsUiState.Success(it) },
                        onFailure = { EarningsUiState.Error },
                    )
            }
        }
    }
