package com.homeservices.customer.data.rating

import app.cash.turbine.test
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

public class RatingPromptEventBusTest {
    private val bus = RatingPromptEventBus()

    @Test
    public fun `post emits bookingId to active collector`(): Unit =
        runTest {
            bus.events.test {
                bus.post("booking-xyz")
                assertThat(awaitItem()).isEqualTo("booking-xyz")
                cancelAndIgnoreRemainingEvents()
            }
        }

    // --- replay=1 sticky behaviour tests ---

    @Test
    public fun `late subscriber receives replayed rating-prompt event`(): Unit =
        runTest {
            // Post BEFORE any subscriber exists (simulates FCM arriving before RatingViewModel attaches)
            bus.post("booking-456")

            // Late subscriber must receive the cached event due to replay=1
            bus.events.test {
                val received = awaitItem()
                assertThat(received).isEqualTo("booking-456")
                cancelAndIgnoreRemainingEvents()
            }
        }

    @Test
    public fun `second late prompt drops first when buffer overflows`(): Unit =
        runTest {
            // Post two prompts before any subscriber — DROP_OLDEST retains only the latest
            bus.post("booking-aaa")
            bus.post("booking-bbb")

            bus.events.test {
                val received = awaitItem()
                // Only the latest booking ID is replayed (DROP_OLDEST evicted booking-aaa)
                assertThat(received).isEqualTo("booking-bbb")
                cancelAndIgnoreRemainingEvents()
            }
        }
}
