package com.homeservices.technician.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.domain.jobs.GetTechnicianBookingsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import retrofit2.HttpException
import java.io.IOException
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
                            onFailure = { TechnicianHomeUiState.Error(it.toJobsMessage()) },
                        )
            }
        }

        private fun Throwable.toJobsMessage(): String =
            when (this) {
                is HttpException ->
                    when (code()) {
                        401 -> "Session expired. Sign out and sign in again to refresh jobs."
                        403 -> "This account is not enabled for technician jobs."
                        in 500..599 -> "Jobs service is unavailable. Retry in a few minutes."
                        else -> "Could not refresh jobs. Server returned ${code()}."
                    }
                is IOException -> "Network unavailable. Check your connection and retry."
                else -> "Could not refresh jobs. Retry in a moment."
            }
    }
