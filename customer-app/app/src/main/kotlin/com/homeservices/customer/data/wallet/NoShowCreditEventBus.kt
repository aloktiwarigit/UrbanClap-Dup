package com.homeservices.customer.data.wallet

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.filterNotNull
import javax.inject.Inject
import javax.inject.Singleton

/**
 * In-process event bus for no-show credit notifications.
 *
 * The FCM service calls [post] on the background thread; [NoShowCreditViewModel] collects
 * [events] in viewModelScope to react. [consume] must be called when the credit banner is
 * dismissed so that the [MutableStateFlow] cache is cleared and subsequent screen collectors
 * (e.g. navigating between CustomerBookingsScreen and LiveTrackingScreen) do not re-receive
 * a stale credit without a new FCM event.
 *
 * State-based (resettable) rather than [kotlinx.coroutines.flow.SharedFlow] replay, because
 * a SharedFlow replay cache cannot be cleared after emission.
 */
@Singleton
public class NoShowCreditEventBus
    @Inject
    constructor() {
        private val _events = MutableStateFlow<NoShowCreditEvent?>(null)

        // Emits only when a non-null credit is posted; silent after consume().
        public val events: Flow<NoShowCreditEvent> = _events.filterNotNull()

        public fun post(event: NoShowCreditEvent) {
            _events.value = event
        }

        // Called by NoShowCreditViewModel.dismiss() to clear the cached event so that
        // new collectors on other screens do not re-receive a stale credit.
        public fun consume() {
            _events.value = null
        }
    }
