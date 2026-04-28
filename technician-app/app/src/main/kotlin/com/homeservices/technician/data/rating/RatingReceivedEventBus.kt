package com.homeservices.technician.data.rating

import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class RatingReceivedEventBus
    @Inject
    constructor() {
        private val _events = MutableSharedFlow<Unit>(extraBufferCapacity = 4, onBufferOverflow = BufferOverflow.DROP_OLDEST)
        public val events: SharedFlow<Unit> = _events.asSharedFlow()

        public fun post() {
            _events.tryEmit(Unit)
        }

        public fun clearBuffered() {
            // SharedFlow (replay=0) holds no per-subscriber buffer; nothing to drain.
        }
    }
