package com.homeservices.technician.data.activeJob

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Application-scoped event bus for [BookingStatusEvent]s originating from FCM.
 *
 * Mirrors the convention established by [com.homeservices.technician.data.earnings.EarningsUpdateEventBus]
 * and [com.homeservices.technician.data.jobOffer.JobOfferEventBus] — a hot
 * [MutableSharedFlow] with no replay and a single-slot buffer so a fast publisher
 * is not blocked by a slow collector.
 *
 * Why no replay: a late subscriber (e.g. the active-job screen opens after the
 * push fires) should fall back to a fresh server fetch, not a stale cached event.
 */
@Singleton
public class BookingStatusEventBus
    @Inject
    constructor() {
        private val _events: MutableSharedFlow<BookingStatusEvent> =
            MutableSharedFlow(
                replay = 0,
                extraBufferCapacity = 1,
            )
        public val events: SharedFlow<BookingStatusEvent> = _events.asSharedFlow()

        public fun post(event: BookingStatusEvent): Unit {
            _events.tryEmit(event)
        }
    }
