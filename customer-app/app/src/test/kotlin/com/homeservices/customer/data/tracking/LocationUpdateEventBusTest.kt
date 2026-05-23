package com.homeservices.customer.data.tracking

import app.cash.turbine.test
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

public class LocationUpdateEventBusTest {
    private val bus = LocationUpdateEventBus()

    @Test
    public fun `post emits event to collector`(): Unit =
        runTest {
            val event = LocationUpdateEvent(bookingId = "bk-1", lat = 12.97, lng = 77.59, capturedAt = 1_000L)
            bus.events.test {
                bus.post(event)
                assertThat(awaitItem()).isEqualTo(event)
                cancelAndIgnoreRemainingEvents()
            }
        }

    @Test
    public fun `post multiple events emits each in order`(): Unit =
        runTest {
            val first = LocationUpdateEvent(bookingId = "bk-1", lat = 12.97, lng = 77.59, capturedAt = 1_000L)
            val second = LocationUpdateEvent(bookingId = "bk-1", lat = 12.98, lng = 77.60, capturedAt = 2_000L)
            bus.events.test {
                bus.post(first)
                bus.post(second)
                assertThat(awaitItem()).isEqualTo(first)
                assertThat(awaitItem()).isEqualTo(second)
                cancelAndIgnoreRemainingEvents()
            }
        }

    @Test
    public fun `post for different bookingIds both emitted`(): Unit =
        runTest {
            val eventA = LocationUpdateEvent(bookingId = "bk-A", lat = 12.0, lng = 77.0, capturedAt = 100L)
            val eventB = LocationUpdateEvent(bookingId = "bk-B", lat = 13.0, lng = 78.0, capturedAt = 200L)
            bus.events.test {
                bus.post(eventA)
                bus.post(eventB)
                assertThat(awaitItem()).isEqualTo(eventA)
                assertThat(awaitItem()).isEqualTo(eventB)
                cancelAndIgnoreRemainingEvents()
            }
        }
}
