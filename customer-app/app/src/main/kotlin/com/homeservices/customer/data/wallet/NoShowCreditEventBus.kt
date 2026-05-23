package com.homeservices.customer.data.wallet

import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * In-process event bus for no-show credit notifications.
 *
 * The FCM service calls [post] on the background thread; [WalletViewModel] and
 * [NoShowCreditViewModel] collect [events] in their viewModelScope to react.
 *
 * STICKY event bus — [replay] = 1 so a credit notification fired before any subscriber
 * attaches is cached and delivered when the first subscriber arrives.
 * [BufferOverflow.DROP_OLDEST] prevents accumulation if a second credit fires before the
 * first is consumed (only the latest credit is retained in the replay cache).
 */
@Singleton
public class NoShowCreditEventBus
    @Inject
    constructor() {
        // Sticky event — replay=1 ensures a credit fired before WalletViewModel subscribes is not lost.
        private val _events = MutableSharedFlow<NoShowCreditEvent>(
            replay = 1,
            onBufferOverflow = BufferOverflow.DROP_OLDEST,
        )
        public val events: SharedFlow<NoShowCreditEvent> = _events.asSharedFlow()

        public fun post(event: NoShowCreditEvent) {
            _events.tryEmit(event)
        }
    }
