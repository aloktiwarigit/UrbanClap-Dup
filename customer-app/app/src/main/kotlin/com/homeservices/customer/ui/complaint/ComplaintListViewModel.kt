package com.homeservices.customer.ui.complaint

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.customer.domain.complaint.GetComplaintListUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

public sealed class ComplaintListUiState {
    public data object Loading : ComplaintListUiState()

    public data class Ready(
        val complaints: List<ComplaintResponseDto>,
    ) : ComplaintListUiState()

    public data class Error(
        val message: String,
    ) : ComplaintListUiState()

    public data object Empty : ComplaintListUiState()
}

@HiltViewModel
public class ComplaintListViewModel
    @Inject
    constructor(
        private val getComplaintListUseCase: GetComplaintListUseCase,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<ComplaintListUiState>(ComplaintListUiState.Loading)
        public val uiState: StateFlow<ComplaintListUiState> = _uiState.asStateFlow()

        init {
            loadComplaints()
        }

        public fun retry() {
            loadComplaints()
        }

        private fun loadComplaints() {
            _uiState.value = ComplaintListUiState.Loading
            viewModelScope.launch {
                getComplaintListUseCase().collect { result ->
                    _uiState.value =
                        result.fold(
                            onSuccess = { list ->
                                if (list.isEmpty()) {
                                    ComplaintListUiState.Empty
                                } else {
                                    ComplaintListUiState.Ready(list)
                                }
                            },
                            onFailure = { e ->
                                ComplaintListUiState.Error(e.message ?: "Unknown error")
                            },
                        )
                }
            }
        }
    }
