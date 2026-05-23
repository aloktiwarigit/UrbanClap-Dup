package com.homeservices.customer.data.rating

import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * In-process event bus for post-job rating prompts.
 *
 * STICKY event bus — [replay] = 1 so a rating-prompt notification fired before the
 * RatingViewModel subscribes (e.g. screen navigated from FCM deep-link) is cached and
 * delivered when the first subscriber arrives.
 * [BufferOverflow.DROP_OLDEST] ensures only the most-recent booking ID is retained.
 */
@Singleton
public class RatingPromptEventBus
    @Inject
    constructor() {
        // Sticky event — replay=1 ensures a rating prompt fired before the subscriber
        // attaches is not silently lost.
        private val _events =
            MutableSharedFlow<String>(
                replay = 1,
                onBufferOverflow = BufferOverflow.DROP_OLDEST,
            )
        public val events: SharedFlow<String> = _events.asSharedFlow()

        public fun post(bookingId: String) {
            _events.tryEmit(bookingId)
        }
    }
