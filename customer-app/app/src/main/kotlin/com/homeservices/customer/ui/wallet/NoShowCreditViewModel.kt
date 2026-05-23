package com.homeservices.customer.ui.wallet

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.wallet.NoShowCreditEvent
import com.homeservices.customer.data.wallet.NoShowCreditEventBus
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel that exposes the most recent [NoShowCreditEvent] to the UI layer.
 *
 * Screens observe [event]. When the banner is tapped or auto-dismissed, the
 * screen calls [dismiss] to clear the state.
 */
@HiltViewModel
public class NoShowCreditViewModel
    @Inject
    constructor(
        private val eventBus: NoShowCreditEventBus,
    ) : ViewModel() {
        private val _event = MutableStateFlow<NoShowCreditEvent?>(null)
        public val event: StateFlow<NoShowCreditEvent?> = _event.asStateFlow()

        init {
            viewModelScope.launch {
                eventBus.events.collect { e -> _event.value = e }
            }
        }

        public fun dismiss() {
            _event.value = null
        }
    }
