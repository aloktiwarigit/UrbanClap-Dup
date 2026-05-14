package com.homeservices.customer.ui.tracking

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.booking.BookingRepository
import com.homeservices.customer.domain.tracking.GetLiveLocationUseCase
import com.homeservices.customer.domain.tracking.TrackBookingStatusUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
public class LiveTrackingViewModel
    @Inject
    constructor(
        savedStateHandle: SavedStateHandle,
        private val getLiveLocationUseCase: GetLiveLocationUseCase,
        private val trackBookingStatusUseCase: TrackBookingStatusUseCase,
        private val bookingRepository: BookingRepository,
    ) : ViewModel() {
        private val bookingId: String = checkNotNull(savedStateHandle["bookingId"])

        private val _technicianId = MutableStateFlow<String?>(null)

        init {
            viewModelScope.launch {
                bookingRepository
                    .getBookingTechnicianId(bookingId)
                    .collect { result ->
                        result.getOrNull()?.let { id -> _technicianId.value = id }
                    }
            }
        }

        public val uiState: StateFlow<LiveTrackingUiState> =
            combine(
                getLiveLocationUseCase.execute(bookingId),
                trackBookingStatusUseCase.execute(bookingId),
                _technicianId,
            ) { location, status, technicianId ->
                LiveTrackingUiState.Tracking(
                    bookingId = bookingId,
                    location = location,
                    status = status,
                    techName = location?.techName ?: "",
                    techPhotoUrl = location?.techPhotoUrl ?: "",
                    etaMinutes = location?.etaMinutes,
                    technicianId = technicianId ?: location?.technicianId,
                )
            }.stateIn(
                scope = viewModelScope,
                started = SharingStarted.Eagerly,
                initialValue = LiveTrackingUiState.Loading,
            )
    }
