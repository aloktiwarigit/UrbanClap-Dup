package com.homeservices.customer.data.booking

import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * In-process event bus for FCM price-approval prompts.
 *
 * STICKY event bus — [replay] = 1 so a price-approval notification fired before the
 * BookingViewModel subscribes is cached and delivered when the first subscriber arrives.
 * [BufferOverflow.DROP_OLDEST] ensures only the most-recent booking ID is retained if a
 * second approval arrives before the first is consumed.
 */
@Singleton
public class PriceApprovalEventBus
    @Inject
    constructor() {
        // Sticky event — replay=1 ensures a price-approval prompt fired before the subscriber
        // attaches (e.g. FCM wakes the app) is not silently lost.
        private val _events = MutableSharedFlow<String>(
            replay = 1,
            onBufferOverflow = BufferOverflow.DROP_OLDEST,
        )
        public val events: SharedFlow<String> = _events.asSharedFlow()

        public fun post(bookingId: String) {
            _events.tryEmit(bookingId)
        }
    }
