package com.homeservices.customer.data.booking

import com.homeservices.customer.domain.booking.model.PaymentResult
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class PaymentResultBus @Inject constructor() {
    private val _results = MutableSharedFlow<PaymentResult>(extraBufferCapacity = 1)
    public val results: SharedFlow<PaymentResult> = _results.asSharedFlow()

    public fun post(result: PaymentResult) {
        _results.tryEmit(result)
    }
}
