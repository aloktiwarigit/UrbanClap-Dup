package com.homeservices.customer.data.tracking

import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

@Singleton
public class TrackingEventBus @Inject constructor() {
    private val _events = MutableSharedFlow<TrackingEvent>(extraBufferCapacity = 64)
    internal val events: SharedFlow<TrackingEvent> = _events.asSharedFlow()

    internal fun post(event: TrackingEvent) {
        _events.tryEmit(event)
    }
}
