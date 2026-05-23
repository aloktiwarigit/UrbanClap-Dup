package com.homeservices.customer.data.booking

import com.homeservices.customer.domain.booking.model.PaymentResult
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * In-process event bus carrying the Razorpay payment result back to the booking flow.
 *
 * HOT event bus — [RazorpayPaymentUseCase.open] launches a collector coroutine before
 * calling [com.razorpay.Checkout.open], eliminating the race window that would require
 * replay. Using replay=1 here would surface a stale prior-checkout result to the next
 * [open] call's [kotlinx.coroutines.flow.first] collector.
 */
@Singleton
public class PaymentResultBus
    @Inject
    constructor() {
        // Hot event — replay=0; extraBufferCapacity=1 absorbs the single result per checkout.
        // DROP_OLDEST is harmless since there is at most one active checkout at a time.
        private val _results =
            MutableSharedFlow<PaymentResult>(
                replay = 0,
                extraBufferCapacity = 1,
                onBufferOverflow = BufferOverflow.DROP_OLDEST,
            )
        public val results: SharedFlow<PaymentResult> = _results.asSharedFlow()

        public fun post(result: PaymentResult) {
            _results.tryEmit(result)
        }
    }
