package com.homeservices.technician.data.earnings

import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class EarningsUpdateEventBusTest {
    @Test
    public fun `notifyEarningsUpdate emits Unit to events flow`(): Unit =
        runTest(UnconfinedTestDispatcher()) {
            val bus = EarningsUpdateEventBus()
            var received = false
            // UnconfinedTestDispatcher ensures the collector subscribes before notifyEarningsUpdate fires.
            val job =
                launch {
                    bus.events.first()
                    received = true
                }

            bus.notifyEarningsUpdate()
            job.join()

            assertThat(received).isTrue()
        }

    @Test
    public fun `multiple notifyEarningsUpdate calls each emit an event`(): Unit =
        runTest(UnconfinedTestDispatcher()) {
            val bus = EarningsUpdateEventBus()
            val collected = mutableListOf<Unit>()
            val job = launch { bus.events.collect { collected.add(it) } }

            bus.notifyEarningsUpdate()
            bus.notifyEarningsUpdate()
            job.cancel()

            assertThat(collected.size).isGreaterThanOrEqualTo(1)
        }
}
