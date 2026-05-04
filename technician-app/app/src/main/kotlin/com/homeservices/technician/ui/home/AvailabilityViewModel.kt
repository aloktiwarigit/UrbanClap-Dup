package com.homeservices.technician.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.domain.availability.GetTechnicianAvailabilityUseCase
import com.homeservices.technician.domain.availability.UpdateTechnicianAvailabilityUseCase
import com.homeservices.technician.domain.availability.model.AvailabilityWindow
import com.homeservices.technician.domain.availability.model.TechnicianAvailability
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
internal class AvailabilityViewModel
    @Inject
    constructor(
        private val getAvailability: GetTechnicianAvailabilityUseCase,
        private val updateAvailability: UpdateTechnicianAvailabilityUseCase,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow(AvailabilityUiState())
        val uiState: StateFlow<AvailabilityUiState> = _uiState.asStateFlow()

        init {
            refresh()
        }

        fun refresh() {
            viewModelScope.launch {
                _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
                getAvailability()
                    .fold(
                        onSuccess = {
                            _uiState.value = AvailabilityUiState(availability = it, isLoading = false)
                        },
                        onFailure = {
                            _uiState.value =
                                _uiState.value.copy(
                                    isLoading = false,
                                    errorMessage = "Could not sync availability",
                                )
                        },
                    )
            }
        }

        fun setAcceptingJobs(acceptingJobs: Boolean) {
            persist(
                _uiState.value.availability.copy(
                    isOnline = acceptingJobs,
                    isAvailable = acceptingJobs,
                ),
            )
        }

        fun setWindowEnabled(
            startHour: Int,
            endHour: Int,
            enabled: Boolean,
        ) {
            val current = _uiState.value.availability
            val withoutWindow =
                current.availabilityWindows.filterNot { it.startHour == startHour && it.endHour == endHour }
            val nextWindows =
                if (enabled) {
                    withoutWindow + (0..6).map { dayOfWeek -> AvailabilityWindow(dayOfWeek, startHour, endHour) }
                } else {
                    withoutWindow
                }
            persist(current.copy(availabilityWindows = nextWindows.sortedWith(windowComparator)))
        }

        private fun persist(next: TechnicianAvailability) {
            val previous = _uiState.value
            _uiState.value = previous.copy(availability = next, isSaving = true, errorMessage = null)
            viewModelScope.launch {
                updateAvailability(next)
                    .fold(
                        onSuccess = { _uiState.value = AvailabilityUiState(availability = it, isLoading = false) },
                        onFailure = {
                            _uiState.value =
                                previous.copy(
                                    isLoading = false,
                                    isSaving = false,
                                    errorMessage = "Could not save availability",
                                )
                        },
                    )
            }
        }

        private companion object {
            val windowComparator =
                compareBy<AvailabilityWindow>({ it.dayOfWeek }, { it.startHour }, { it.endHour })
        }
    }
