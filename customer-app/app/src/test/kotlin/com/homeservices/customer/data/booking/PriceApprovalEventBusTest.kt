package com.homeservices.customer.data.booking

import app.cash.turbine.test
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

public class PriceApprovalEventBusTest {
    private val bus = PriceApprovalEventBus()

    @Test
    public fun `post emits bookingId to active collector`(): Unit =
        runTest {
            bus.events.test {
                bus.post("booking-abc")
                assertThat(awaitItem()).isEqualTo("booking-abc")
                cancelAndIgnoreRemainingEvents()
            }
        }

    // --- replay=1 sticky behaviour tests ---

    @Test
    public fun `late subscriber receives replayed price-approval event`(): Unit =
        runTest {
            // Post BEFORE any subscriber exists (simulates FCM arriving before ViewModel attaches)
            bus.post("booking-123")

            // Late subscriber must receive the cached event due to replay=1
            bus.events.test {
                val received = awaitItem()
                assertThat(received).isEqualTo("booking-123")
                cancelAndIgnoreRemainingEvents()
            }
        }

    @Test
    public fun `second late approval drops first when buffer overflows`(): Unit =
        runTest {
            // Post two events before any subscriber — DROP_OLDEST retains only the latest
            bus.post("booking-111")
            bus.post("booking-222")

            bus.events.test {
                val received = awaitItem()
                // Only the latest booking ID is replayed (DROP_OLDEST evicted booking-111)
                assertThat(received).isEqualTo("booking-222")
                cancelAndIgnoreRemainingEvents()
            }
        }
}
