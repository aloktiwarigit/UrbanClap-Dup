package com.homeservices.customer.data.tracking

import com.homeservices.customer.data.booking.remote.BookingApiService
import com.homeservices.customer.domain.tracking.TrackingRepository
import com.homeservices.customer.domain.tracking.model.BookingStatus
import com.homeservices.customer.domain.tracking.model.LiveLocation
import com.homeservices.customer.domain.tracking.model.TrackingState
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.scan
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class TrackingRepositoryImpl
    @Inject
    constructor(
        private val eventBus: TrackingEventBus,
        private val bookingApi: BookingApiService,
    ) : TrackingRepository {
        public override fun trackBooking(bookingId: String): Flow<TrackingState> =
            flow {
                val initialStatus =
                    runCatching {
                        BookingStatus.fromFcmString(bookingApi.getBooking(bookingId).status)
                    }.getOrDefault(BookingStatus.Unknown)
                val initialState = TrackingState(location = null, status = initialStatus)

                emitAll(
                    eventBus.events
                        .filter { it.bookingId == bookingId }
                        .scan(initialState) { state, event ->
                            when (event) {
                                is TrackingEvent.LocationUpdate ->
                                    state.copy(
                                        location =
                                            LiveLocation(
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
                        },
                )
            }
    }
