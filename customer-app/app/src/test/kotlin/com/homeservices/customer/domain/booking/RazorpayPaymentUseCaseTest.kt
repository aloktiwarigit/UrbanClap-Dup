package com.homeservices.customer.domain.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.PaymentResultBus
import com.homeservices.customer.domain.booking.model.PaymentResult
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.yield
import org.junit.Test

public class RazorpayPaymentUseCaseTest {
    private val bus = PaymentResultBus()
    private val sut = RazorpayPaymentUseCase(bus)

    @Test
    public fun `resultFlow emits Success when bus posts success`(): Unit = runTest {
        val deferred = CompletableDeferred<PaymentResult>()
        backgroundScope.launch { deferred.complete(sut.resultFlow().first()) }
        yield()
        bus.post(PaymentResult.Success(paymentId = "pay_1", orderId = "order_1", signature = "sig_1"))
        val result = deferred.await()
        assertThat(result).isInstanceOf(PaymentResult.Success::class.java)
        assertThat((result as PaymentResult.Success).paymentId).isEqualTo("pay_1")
    }

    @Test
    public fun `resultFlow emits Failure when bus posts failure`(): Unit = runTest {
        val deferred = CompletableDeferred<PaymentResult>()
        backgroundScope.launch { deferred.complete(sut.resultFlow().first()) }
        yield()
        bus.post(PaymentResult.Failure(code = 2, description = "cancelled"))
        val result = deferred.await()
        assertThat(result).isInstanceOf(PaymentResult.Failure::class.java)
        assertThat((result as PaymentResult.Failure).code).isEqualTo(2)
    }
}
