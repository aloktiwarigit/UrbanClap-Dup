package com.homeservices.customer.data.wallet

import app.cash.turbine.test
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

public class NoShowCreditEventBusTest {
    private val bus = NoShowCreditEventBus()

    @Test
    public fun `post emits event to collector`(): Unit =
        runTest {
            val event = NoShowCreditEvent(creditAmountPaise = 50000L, bookingId = "bk-1")
            bus.events.test {
                bus.post(event)
                assertThat(awaitItem()).isEqualTo(event)
                cancelAndIgnoreRemainingEvents()
            }
        }

    @Test
    public fun `post multiple events emits each in order`(): Unit =
        runTest {
            val first = NoShowCreditEvent(creditAmountPaise = 10000L, bookingId = "bk-1")
            val second = NoShowCreditEvent(creditAmountPaise = 20000L, bookingId = "bk-2")
            bus.events.test {
                bus.post(first)
                bus.post(second)
                assertThat(awaitItem()).isEqualTo(first)
                assertThat(awaitItem()).isEqualTo(second)
                cancelAndIgnoreRemainingEvents()
            }
        }

    @Test
    public fun `event with empty bookingId is posted successfully`(): Unit =
        runTest {
            val event = NoShowCreditEvent(creditAmountPaise = 50000L, bookingId = "")
            bus.events.test {
                bus.post(event)
                val received = awaitItem()
                assertThat(received.creditAmountPaise).isEqualTo(50000L)
                assertThat(received.bookingId).isEmpty()
                cancelAndIgnoreRemainingEvents()
            }
        }

    @Test
    public fun `zero credit amount is posted successfully`(): Unit =
        runTest {
            val event = NoShowCreditEvent(creditAmountPaise = 0L, bookingId = "bk-99")
            bus.events.test {
                bus.post(event)
                assertThat(awaitItem().creditAmountPaise).isEqualTo(0L)
                cancelAndIgnoreRemainingEvents()
            }
        }
}
