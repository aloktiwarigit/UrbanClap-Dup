package com.homeservices.technician.data.rating

import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.receiveAsFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class RatingReceivedEventBus
    @Inject
    constructor() {
        private val _events = Channel<Unit>(capacity = 4, onBufferOverflow = BufferOverflow.DROP_OLDEST)
        public val events: Flow<Unit> = _events.receiveAsFlow()

        public fun post() {
            _events.trySend(Unit)
        }

        public fun clearBuffered() {
            while (_events.tryReceive().isSuccess) { }
        }
    }
