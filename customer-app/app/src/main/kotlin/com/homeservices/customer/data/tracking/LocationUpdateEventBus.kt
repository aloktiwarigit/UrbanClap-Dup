package com.homeservices.customer.data.tracking

import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * In-process event bus for slim LOCATION_UPDATE FCM pushes (E17-S02).
 *
 * The FCM service calls [post] when a slim location payload arrives (identified by the
 * presence of `capturedAt`). [LiveTrackingViewModel] collects [events] in viewModelScope
 * to update the map marker in near-real-time without a Firestore round-trip.
 *
 * HOT event bus — only the latest technician position matters; there is no value in
 * replaying a stale coordinate to a late subscriber. [BufferOverflow.DROP_OLDEST] ensures
 * back-pressure from a slow collector does not accumulate stale coordinates.
 */
@Singleton
public class LocationUpdateEventBus
    @Inject
    constructor() {
        // Hot event — replay=0, extraBufferCapacity=1, DROP_OLDEST.
        // Only the current location is relevant; stale positions are silently dropped.
        private val _events = MutableSharedFlow<LocationUpdateEvent>(
            replay = 0,
            extraBufferCapacity = 1,
            onBufferOverflow = BufferOverflow.DROP_OLDEST,
        )
        public val events: SharedFlow<LocationUpdateEvent> = _events.asSharedFlow()

        public fun post(event: LocationUpdateEvent) {
            _events.tryEmit(event)
        }
    }
