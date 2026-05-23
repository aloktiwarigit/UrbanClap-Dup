package com.homeservices.customer.data.tracking

import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class TrackingEventBus
    @Inject
    constructor() {
        // Hot event — no replay for late subscribers (live position only matters now).
        // extraBufferCapacity=64: absorbs a burst of FCM events without blocking the poster.
        // DROP_OLDEST: under extreme backpressure (>64 queued events), oldest position is
        // discarded; normal FCM cadence (~1/s) never reaches this limit.
        private val mutableEvents =
            MutableSharedFlow<TrackingEvent>(
                replay = 0,
                extraBufferCapacity = 64,
                onBufferOverflow = BufferOverflow.DROP_OLDEST,
            )
        internal val events: SharedFlow<TrackingEvent> = mutableEvents.asSharedFlow()

        internal fun post(event: TrackingEvent) {
            mutableEvents.tryEmit(event)
        }
    }
