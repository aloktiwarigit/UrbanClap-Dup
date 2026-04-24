package com.homeservices.customer.data.tracking

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class TrackingEventBus
    @Inject
    constructor() {
        private val mutableEvents = MutableSharedFlow<TrackingEvent>(extraBufferCapacity = 64)
        internal val events: SharedFlow<TrackingEvent> = mutableEvents.asSharedFlow()

        internal fun post(event: TrackingEvent) {
            mutableEvents.tryEmit(event)
        }
    }
