package com.homeservices.customer.ui.tracking

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.tracking.LocationUpdateEvent
import com.homeservices.customer.data.tracking.LocationUpdateEventBus
import com.homeservices.customer.domain.tracking.GetLiveLocationUseCase
import com.homeservices.customer.domain.tracking.TrackBookingStatusUseCase
import com.homeservices.customer.domain.tracking.TrackTechnicianUpiUseCase
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
        private val trackTechnicianUpiUseCase: TrackTechnicianUpiUseCase,
        private val locationUpdateEventBus: LocationUpdateEventBus,
    ) : ViewModel() {
        private val bookingId: String = checkNotNull(savedStateHandle["bookingId"])

        private val liveLocationFromBus: StateFlow<LocationUpdateEvent?> =
            locationUpdateEventBus.events
                .filter { it.bookingId == bookingId }
                .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

        // KNOWN LIMITATION (accepted, tracked — see backlog issue "share the trackBooking flow
        // across LiveTrackingViewModel's use cases"): each of these three use cases independently
        // subscribes to the same cold TrackingRepository.trackBooking(bookingId) flow. Since that
        // flow re-fetches the booking on every status transition (E24-S01c, for
        // technicianUpiMasked), a single status push issues 3 redundant reads, and a transient
        // failure in just one of the three subscriptions' refetch can suppress that one field
        // (e.g. the payment-declaration card) even though the other two succeeded. Accepted
        // because: (a) not money-correctness — commission settles server-side off finalAmount
        // regardless of what this screen shows, matching the E09-S08/E21-S04 precedent that client
        // display state never feeds the ledger; (b) pre-existing debt this story made 3-way rather
        // than introduced — the location/status split already had the same redundancy; (c) the
        // real fix (share one flow instance — either a repository-level shareIn behind a proper
        // CoroutineScope/Dispatcher DI seam, or replacing these three use cases with one shared
        // TrackingRepository subscription) is real work that touches this ViewModel's two existing,
        // already-passing test files' mocking approach — out of scope for a Feature-tier story
        // after 3 Codex rounds already spent on this branch.
        public val uiState: StateFlow<LiveTrackingUiState> =
            combine(
                getLiveLocationUseCase.execute(bookingId),
                trackBookingStatusUseCase.execute(bookingId),
                trackTechnicianUpiUseCase.execute(bookingId),
                liveLocationFromBus,
            ) { location, status, technicianUpiMasked, busEvent ->
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
                    technicianUpiMasked = technicianUpiMasked,
                )
            }.stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5_000),
                initialValue = LiveTrackingUiState.Loading,
            )
    }
