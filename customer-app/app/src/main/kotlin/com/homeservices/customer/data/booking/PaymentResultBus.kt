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
 * STICKY event bus — [replay] = 1 so a payment result posted by the Razorpay Activity
 * callback is cached and delivered to the BookingConfirmationViewModel even if it
 * subscribes after the result has been emitted (e.g. Activity re-creation race).
 * [BufferOverflow.DROP_OLDEST] retains only the most-recent result.
 */
@Singleton
public class PaymentResultBus
    @Inject
    constructor() {
        // Sticky event — replay=1 ensures a payment result is not lost during
        // Activity re-creation between the Razorpay callback and ViewModel collection.
        private val _results = MutableSharedFlow<PaymentResult>(
            replay = 1,
            onBufferOverflow = BufferOverflow.DROP_OLDEST,
        )
        public val results: SharedFlow<PaymentResult> = _results.asSharedFlow()

        public fun post(result: PaymentResult) {
            _results.tryEmit(result)
        }
    }
