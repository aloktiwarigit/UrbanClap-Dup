package com.homeservices.customer.data.booking

import app.cash.turbine.test
import com.homeservices.customer.domain.booking.model.PaymentResult
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

public class PaymentResultBusTest {
    private val bus = PaymentResultBus()

    @Test
    public fun `post emits result to active collector`(): Unit =
        runTest {
            val result =
                PaymentResult.Success(
                    paymentId = "pay_abc",
                    orderId = "order_123",
                    signature = "sig_xyz",
                )
            bus.results.test {
                bus.post(result)
                assertThat(awaitItem()).isEqualTo(result)
                cancelAndIgnoreRemainingEvents()
            }
        }

    @Test
    public fun `late subscriber does not receive stale prior-checkout result`(): Unit =
        runTest {
            val staleResult =
                PaymentResult.Success(
                    paymentId = "pay_old",
                    orderId = "order_old",
                    signature = "sig_old",
                )

            // Post BEFORE any subscriber — HOT bus must NOT deliver this to new collectors
            bus.post(staleResult)

            // Late subscriber must receive nothing (no stale replay)
            bus.results.test {
                expectNoEvents()
                cancelAndIgnoreRemainingEvents()
            }
        }

    @Test
    public fun `post failure emits to active collector`(): Unit =
        runTest {
            val failure = PaymentResult.Failure(code = 2, description = "cancelled")
            bus.results.test {
                bus.post(failure)
                assertThat(awaitItem()).isEqualTo(failure)
                cancelAndIgnoreRemainingEvents()
            }
        }
}
