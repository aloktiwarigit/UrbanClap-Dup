package com.homeservices.technician.data.kyc

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * In-process bus that propagates [KycStatusEvent] from the FCM service to any active
 * `KycViewModel`. Mirrors the channel-vs-SharedFlow choice in `DigiLockerCallbackBus`:
 * a buffered SharedFlow with `tryEmit` is used here because multiple ViewModels may be
 * subscribed transiently and we never want the FCM service to suspend.
 *
 * `extraBufferCapacity = 1` lets a verdict delivered while the screen is dying still
 * be observed by the next subscriber within the lifecycle, without replaying old
 * verdicts to brand-new subscribers (no `replay`).
 */
@Singleton
public class KycStatusEventBus
    @Inject
    constructor() {
        private val _events = MutableSharedFlow<KycStatusEvent>(extraBufferCapacity = 1)
        public val events: SharedFlow<KycStatusEvent> = _events.asSharedFlow()

        public fun post(event: KycStatusEvent) {
            _events.tryEmit(event)
        }
    }
