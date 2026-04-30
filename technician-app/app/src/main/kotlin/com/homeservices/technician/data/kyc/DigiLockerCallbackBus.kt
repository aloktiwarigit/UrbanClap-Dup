package com.homeservices.technician.data.kyc

import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.receiveAsFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class DigiLockerCallbackBus
    @Inject
    constructor() {
        private val _events =
            Channel<String>(
                capacity = 1,
                onBufferOverflow = BufferOverflow.DROP_OLDEST,
            )
        public val events: Flow<String> = _events.receiveAsFlow()

        public fun post(authCode: String) {
            _events.trySend(authCode)
        }
    }
