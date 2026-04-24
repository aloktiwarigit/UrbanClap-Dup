package com.homeservices.customer.data.tracking

import com.homeservices.customer.domain.tracking.TrackingRepository
import com.homeservices.customer.domain.tracking.model.BookingStatus
import com.homeservices.customer.domain.tracking.model.LiveLocation
import com.homeservices.customer.domain.tracking.model.TrackingState
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.scan
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class TrackingRepositoryImpl @Inject constructor(
    private val eventBus: TrackingEventBus,
) : TrackingRepository {

    public override fun trackBooking(bookingId: String): Flow<TrackingState> =
        eventBus.events
            .filter { it.bookingId == bookingId }
            .scan(TrackingState(location = null, status = BookingStatus.EnRoute)) { state, event ->
                when (event) {
                    is TrackingEvent.LocationUpdate ->
                        state.copy(
                            location = LiveLocation(
                                lat = event.lat,
                                lng = event.lng,
                                etaMinutes = event.etaMinutes,
                                techName = event.techName,
                                techPhotoUrl = event.techPhotoUrl,
                            ),
                        )
                    is TrackingEvent.StatusUpdate ->
                        state.copy(status = BookingStatus.fromFcmString(event.status))
                }
            }
            .drop(1) // skip scan's seed emission; only emit event-driven states
}
