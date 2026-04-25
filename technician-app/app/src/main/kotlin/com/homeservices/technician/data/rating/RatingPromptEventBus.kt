package com.homeservices.technician.data.rating

import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.receiveAsFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Buffered one-shot event bus for FCM-delivered RATING_PROMPT_TECHNICIAN events.
 *
 * Backed by a [Channel] rather than a [kotlinx.coroutines.flow.MutableSharedFlow]
 * so that:
 *  1. A prompt that arrives while no UI collector is active (cold start, app
 *     backgrounded) is buffered and delivered once a collector subscribes.
 *  2. Each event is consumed exactly once — the AppNavigation collector won't
 *     re-receive an old prompt after activity recreation or returning to
 *     foreground.
 *  3. Multiple prompts that arrive while no collector is active are all queued
 *     up to [CAPACITY]; if more pile up, [BufferOverflow.DROP_OLDEST] preserves
 *     the most recent ones.
 *
 * The Channel is single-consumer: AppNavigation owns the only collector.
 */
@Singleton
public class RatingPromptEventBus
    @Inject
    constructor() {
        private companion object {
            const val CAPACITY = 8
        }

        private val _events =
            Channel<String>(
                capacity = CAPACITY,
                onBufferOverflow = BufferOverflow.DROP_OLDEST,
            )
        public val events: Flow<String> = _events.receiveAsFlow()

        public fun post(bookingId: String) {
            _events.trySend(bookingId)
        }

        /**
         * Drains any buffered prompts. AppNavigation calls this on transition to
         * Unauthenticated so that a prompt buffered for one technician can't
         * route the next signed-in technician into the wrong booking's rating
         * flow on shared devices.
         */
        public fun clearBuffered() {
            while (_events.tryReceive().isSuccess) {
                // intentionally empty — drain the channel
            }
        }
    }
