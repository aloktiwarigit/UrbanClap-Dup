package com.homeservices.customer.data.wallet

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
 * Uses [extraBufferCapacity] = 1 so a single in-flight credit is not dropped if
 * no collector is active at the moment of emission, but replayed events are not
 * accumulated (replay = 0).
 */
@Singleton
public class NoShowCreditEventBus
    @Inject
    constructor() {
        private val _events = MutableSharedFlow<NoShowCreditEvent>(extraBufferCapacity = 1)
        public val events: SharedFlow<NoShowCreditEvent> = _events.asSharedFlow()

        public fun post(event: NoShowCreditEvent) {
            _events.tryEmit(event)
        }
    }
