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
            val result = PaymentResult.Success(
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

    // --- replay=1 sticky behaviour tests ---

    @Test
    public fun `late subscriber receives replayed payment result`(): Unit =
        runTest {
            val result = PaymentResult.Success(
                paymentId = "pay_late",
                orderId = "order_late",
                signature = "sig_late",
            )

            // Post BEFORE any subscriber exists (simulates Razorpay callback firing before
            // BookingConfirmationViewModel re-subscribes after Activity re-creation)
            bus.post(result)

            // Late subscriber must receive the cached result due to replay=1
            bus.results.test {
                val received = awaitItem()
                assertThat(received).isEqualTo(result)
                cancelAndIgnoreRemainingEvents()
            }
        }

    @Test
    public fun `second late result drops first when buffer overflows`(): Unit =
        runTest {
            val result1 = PaymentResult.Failure(code = 1, description = "Network error")
            val result2 = PaymentResult.Success(
                paymentId = "pay_retry",
                orderId = "order_retry",
                signature = "sig_retry",
            )

            // Post two results before any subscriber — DROP_OLDEST retains only the latest
            bus.post(result1)
            bus.post(result2)

            bus.results.test {
                val received = awaitItem()
                // Only the latest result is replayed (DROP_OLDEST evicted result1)
                assertThat(received).isEqualTo(result2)
                cancelAndIgnoreRemainingEvents()
            }
        }
}
