package com.homeservices.customer.data.tracking

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
 * Uses [extraBufferCapacity] = 1 so a single in-flight location update is not dropped
 * if no collector is active at the moment of emission, but replayed events are not
 * accumulated (replay = 0).
 */
@Singleton
public class LocationUpdateEventBus
    @Inject
    constructor() {
        private val _events = MutableSharedFlow<LocationUpdateEvent>(extraBufferCapacity = 1)
        public val events: SharedFlow<LocationUpdateEvent> = _events.asSharedFlow()

        public fun post(event: LocationUpdateEvent) {
            _events.tryEmit(event)
        }
    }
