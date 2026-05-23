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
        // Hot event — only the latest tracking position matters; backpressure is safe to drop.
        // replay=0: no caching for late subscribers. extraBufferCapacity=1: absorbs one in-flight
        // event to avoid suspension. DROP_OLDEST: stale positions are silently discarded.
        private val mutableEvents = MutableSharedFlow<TrackingEvent>(
            replay = 0,
            extraBufferCapacity = 1,
            onBufferOverflow = BufferOverflow.DROP_OLDEST,
        )
        internal val events: SharedFlow<TrackingEvent> = mutableEvents.asSharedFlow()

        internal fun post(event: TrackingEvent) {
            mutableEvents.tryEmit(event)
        }
    }
