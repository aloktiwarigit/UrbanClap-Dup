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
    public fun `post different events emits each in order`(): Unit =
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

    @Test
    public fun `late subscriber receives cached credit event`(): Unit =
        runTest {
            val event = NoShowCreditEvent(creditAmountPaise = 15000L, bookingId = "booking-123")

            // Post BEFORE any subscriber — StateFlow value is cached
            bus.post(event)

            // Late subscriber receives the cached value immediately
            bus.events.test {
                val received = awaitItem()
                assertThat(received).isEqualTo(event)
                cancelAndIgnoreRemainingEvents()
            }
        }

    @Test
    public fun `consume clears the cache — late subscriber after dismiss receives nothing`(): Unit =
        runTest {
            val event = NoShowCreditEvent(creditAmountPaise = 15000L, bookingId = "booking-456")
            bus.post(event)
            bus.consume()

            // After consume(), no stale event is delivered to a new subscriber
            bus.events.test {
                expectNoEvents()
                cancelAndIgnoreRemainingEvents()
            }
        }

    @Test
    public fun `new post after consume is delivered to late subscriber`(): Unit =
        runTest {
            val stale = NoShowCreditEvent(creditAmountPaise = 10000L, bookingId = "bk-old")
            val fresh = NoShowCreditEvent(creditAmountPaise = 25000L, bookingId = "bk-new")

            bus.post(stale)
            bus.consume()
            bus.post(fresh)

            bus.events.test {
                val received = awaitItem()
                assertThat(received).isEqualTo(fresh)
                cancelAndIgnoreRemainingEvents()
            }
        }
}
