package com.homeservices.customer.ui.dataexport

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.dataexport.DataExportRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val UNKNOWN_ERROR = "Unknown error"

/** ViewModel for the data-export screen (E15-S01, DPDP §11). */
@HiltViewModel
public class DataExportViewModel
    @Inject
    constructor(
        private val repository: DataExportRepository,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<DataExportUiState>(DataExportUiState.Idle)
        public val uiState: StateFlow<DataExportUiState> = _uiState.asStateFlow()

        /**
         * Trigger a data-export request.
         *
         * State transitions:
         *   [Idle] → [Loading] (synchronous before coroutine runs)
         *   [Loading] → [Ready] on success
         *   [Loading] → [Error] on network / auth failure
         */
        public fun requestExport() {
            _uiState.value = DataExportUiState.Loading
            viewModelScope.launch {
                try {
                    repository.fetchExport().collect { result ->
                        _uiState.value =
                            result.fold(
                                onSuccess = { bytes -> DataExportUiState.Ready(bytes) },
                                onFailure = { e -> DataExportUiState.Error(e.message ?: UNKNOWN_ERROR) },
                            )
                    }
                } catch (e: Exception) {
                    _uiState.value = DataExportUiState.Error(e.message ?: UNKNOWN_ERROR)
                }
            }
        }

        /** Called after the SAF write completes successfully. Resets state to [Idle]. */
        public fun onSaved() {
            _uiState.value = DataExportUiState.Idle
        }

        /** Called when the user taps "Retry" from the [Error] state. */
        public fun onRetry() {
            _uiState.value = DataExportUiState.Idle
        }
    }
