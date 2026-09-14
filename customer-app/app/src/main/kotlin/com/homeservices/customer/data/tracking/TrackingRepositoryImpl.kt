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
                val initialBooking = runCatching { bookingApi.getBooking(bookingId) }.getOrNull()
                val initialStatus =
                    initialBooking?.status?.let { BookingStatus.fromFcmString(it) } ?: BookingStatus.Unknown
                val initialState =
                    TrackingState(
                        location = null,
                        status = initialStatus,
                        technicianUpiMasked = initialBooking?.technicianUpiMasked,
                    )

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
                                is TrackingEvent.StatusUpdate -> {
                                    // Re-fetch on every status transition, not just at initial
                                    // subscription: a customer who opens tracking before a
                                    // technician is assigned (or before they've set a UPI VPA)
                                    // would otherwise never see technicianUpiMasked once the
                                    // booking reaches Completed, since status/location updates
                                    // arrive via FCM events that don't carry it. A *failed*
                                    // refetch falls back to the last known value (never regress
                                    // a previously-shown masked VPA to null over a transient
                                    // error) — but a *successful* refetch always wins, including
                                    // when it explicitly reports null (e.g. reassigned to a
                                    // technician with no VPA on file): showing a stale VPA for
                                    // the wrong technician is worse than showing none.
                                    val refreshedBooking = runCatching { bookingApi.getBooking(bookingId) }.getOrNull()
                                    val technicianUpiMasked =
                                        if (refreshedBooking != null) {
                                            refreshedBooking.technicianUpiMasked
                                        } else {
                                            state.technicianUpiMasked
                                        }
                                    state.copy(
                                        status = BookingStatus.fromFcmString(event.status),
                                        technicianUpiMasked = technicianUpiMasked,
                                    )
                                }
                            }
                        },
                )
            }
    }
