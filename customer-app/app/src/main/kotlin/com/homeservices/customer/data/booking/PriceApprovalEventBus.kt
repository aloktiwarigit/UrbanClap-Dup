package com.homeservices.customer.data.booking

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class PriceApprovalEventBus
    @Inject
    constructor() {
        private val _events = MutableSharedFlow<String>(extraBufferCapacity = 1)

        public val events: SharedFlow<String> = _events.asSharedFlow()

        public fun post(bookingId: String) {
            _events.tryEmit(bookingId)
        }
    }
