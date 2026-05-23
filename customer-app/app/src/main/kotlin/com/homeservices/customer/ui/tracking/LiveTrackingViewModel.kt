package com.homeservices.customer.ui.tracking

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.tracking.LocationUpdateEvent
import com.homeservices.customer.data.tracking.LocationUpdateEventBus
import com.homeservices.customer.domain.tracking.GetLiveLocationUseCase
import com.homeservices.customer.domain.tracking.TrackBookingStatusUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
public class LiveTrackingViewModel
    @Inject
    constructor(
        savedStateHandle: SavedStateHandle,
        private val getLiveLocationUseCase: GetLiveLocationUseCase,
        private val trackBookingStatusUseCase: TrackBookingStatusUseCase,
        private val locationUpdateEventBus: LocationUpdateEventBus,
    ) : ViewModel() {
        private val bookingId: String = checkNotNull(savedStateHandle["bookingId"])

        private val liveLocationFromBus: StateFlow<LocationUpdateEvent?> =
            locationUpdateEventBus.events
                .filter { it.bookingId == bookingId }
                .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

        public val uiState: StateFlow<LiveTrackingUiState> =
            combine(
                getLiveLocationUseCase.execute(bookingId),
                trackBookingStatusUseCase.execute(bookingId),
                liveLocationFromBus,
            ) { location, status, busEvent ->
                LiveTrackingUiState.Tracking(
                    bookingId = bookingId,
                    location = location,
                    status = status,
                    techName = location?.techName ?: "",
                    techPhotoUrl = location?.techPhotoUrl ?: "",
                    etaMinutes = location?.etaMinutes,
                    technicianId = location?.technicianId,
                    liveLat = busEvent?.lat ?: location?.lat,
                    liveLng = busEvent?.lng ?: location?.lng,
                    liveCapturedAt = busEvent?.capturedAt,
                )
            }.stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5_000),
                initialValue = LiveTrackingUiState.Loading,
            )
    }
