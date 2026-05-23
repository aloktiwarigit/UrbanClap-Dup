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

    // --- replay=1 sticky behaviour tests ---

    @Test
    public fun `late subscriber receives replayed credit event`(): Unit =
        runTest {
            val event = NoShowCreditEvent(creditAmountPaise = 15000L, bookingId = "booking-123")

            // Post BEFORE any subscriber exists
            bus.post(event)

            // Late subscriber should still receive the event due to replay=1
            bus.events.test {
                val received = awaitItem()
                assertThat(received).isEqualTo(event)
                cancelAndIgnoreRemainingEvents()
            }
        }

    @Test
    public fun `second late credit drops first when buffer overflows`(): Unit =
        runTest {
            val event1 = NoShowCreditEvent(creditAmountPaise = 10000L, bookingId = "booking-111")
            val event2 = NoShowCreditEvent(creditAmountPaise = 20000L, bookingId = "booking-222")

            // Post two events before any subscriber — DROP_OLDEST keeps only the latest
            bus.post(event1)
            bus.post(event2)

            bus.events.test {
                val received = awaitItem()
                // Only the latest event should be replayed (DROP_OLDEST evicted event1)
                assertThat(received).isEqualTo(event2)
                cancelAndIgnoreRemainingEvents()
            }
        }
}
