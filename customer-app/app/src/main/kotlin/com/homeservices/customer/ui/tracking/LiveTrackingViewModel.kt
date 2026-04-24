package com.homeservices.customer.ui.tracking

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.tracking.GetLiveLocationUseCase
import com.homeservices.customer.domain.tracking.TrackBookingStatusUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
public class LiveTrackingViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val getLiveLocationUseCase: GetLiveLocationUseCase,
    private val trackBookingStatusUseCase: TrackBookingStatusUseCase,
) : ViewModel() {

    private val bookingId: String = checkNotNull(savedStateHandle["bookingId"])

    public val uiState: StateFlow<LiveTrackingUiState> =
        combine(
            getLiveLocationUseCase.execute(bookingId),
            trackBookingStatusUseCase.execute(bookingId),
        ) { location, status ->
            LiveTrackingUiState.Tracking(
                location = location,
                status = status,
                techName = location?.techName ?: "",
                techPhotoUrl = location?.techPhotoUrl ?: "",
                etaMinutes = location?.etaMinutes,
            )
        }.stateIn(
            scope = viewModelScope,
            started = SharingStarted.Eagerly,
            initialValue = LiveTrackingUiState.Loading,
        )
}
