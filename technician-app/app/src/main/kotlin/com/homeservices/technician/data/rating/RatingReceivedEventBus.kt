package com.homeservices.technician.data.rating

import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.receiveAsFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Buffered one-shot event bus for FCM-delivered RATING_RECEIVED events.
 *
 * Signals that the technician has received a new customer rating so that
 * [com.homeservices.technician.ui.myratings.MyRatingsViewModel] can refresh
 * the rating summary without requiring a manual pull-to-refresh.
 *
 * Backed by a [Channel] (capacity 8, DROP_OLDEST) so that events received
 * while no collector is active are buffered and delivered once a collector
 * subscribes, and each event is consumed exactly once.
 */
@Singleton
public class RatingReceivedEventBus
    @Inject
    constructor() {
        private companion object {
            const val CAPACITY = 8
        }

        private val _events =
            Channel<Unit>(
                capacity = CAPACITY,
                onBufferOverflow = BufferOverflow.DROP_OLDEST,
            )
        public val events: Flow<Unit> = _events.receiveAsFlow()

        public fun post() {
            _events.trySend(Unit)
        }
    }
