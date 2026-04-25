package com.homeservices.technician.data.rating

import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class RatingPromptEventBus
    @Inject
    constructor() {
        // replay = 1 so an FCM-delivered RATING_PROMPT_TECHNICIAN that arrives while
        // no collector is active (app backgrounded or cold-starting from the push)
        // is replayed to the AppNavigation collector once it subscribes. Without
        // replay, the prompt is silently dropped and the rating screen never opens.
        // The collector MUST call consume() after handling the event so the cached
        // bookingId is not re-delivered on the next collector (activity recreation,
        // returning to foreground, etc.).
        private val _events = MutableSharedFlow<String>(replay = 1, extraBufferCapacity = 0)
        public val events: SharedFlow<String> = _events.asSharedFlow()

        public fun post(bookingId: String) {
            _events.tryEmit(bookingId)
        }

        @OptIn(ExperimentalCoroutinesApi::class)
        public fun consume() {
            _events.resetReplayCache()
        }
    }
