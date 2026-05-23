package com.homeservices.technician.data.activeJob

import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class BookingStatusEventBusTest {
    @Test
    public fun `post emits BookingStatusEvent to an active collector`(): Unit =
        runTest(UnconfinedTestDispatcher()) {
            val bus = BookingStatusEventBus()
            var received: BookingStatusEvent? = null
            val job = launch { received = bus.events.first() }

            bus.post(BookingStatusEvent(bookingId = "bk-1", newStatus = "PRICE_APPROVED", priceApprovedPaise = 5_000L))
            job.join()

            assertThat(received).isNotNull()
            assertThat(received!!.bookingId).isEqualTo("bk-1")
            assertThat(received!!.newStatus).isEqualTo("PRICE_APPROVED")
            assertThat(received!!.priceApprovedPaise).isEqualTo(5_000L)
        }

    @Test
    public fun `late subscriber receives no replay`(): Unit =
        runTest(UnconfinedTestDispatcher()) {
            val bus = BookingStatusEventBus()

            // post before any collector exists
            bus.post(BookingStatusEvent(bookingId = "bk-1", newStatus = "PRICE_REJECTED"))

            val collected = mutableListOf<BookingStatusEvent>()
            val job = launch { bus.events.collect { collected.add(it) } }
            job.cancel()

            assertThat(collected).isEmpty()
        }

    @Test
    public fun `multiple posts each emit an event to a continuous collector`(): Unit =
        runTest(UnconfinedTestDispatcher()) {
            val bus = BookingStatusEventBus()
            val collected = mutableListOf<BookingStatusEvent>()
            val job = launch { bus.events.collect { collected.add(it) } }

            bus.post(BookingStatusEvent(bookingId = "bk-1", newStatus = "PRICE_APPROVED"))
            bus.post(BookingStatusEvent(bookingId = "bk-2", newStatus = "PRICE_REJECTED"))
            job.cancel()

            assertThat(collected).hasSize(2)
            assertThat(collected[0].bookingId).isEqualTo("bk-1")
            assertThat(collected[1].bookingId).isEqualTo("bk-2")
        }

    @Test
    public fun `priceApprovedPaise defaults to null when not provided`() {
        val event = BookingStatusEvent(bookingId = "bk-1", newStatus = "ASSIGNED")
        assertThat(event.priceApprovedPaise).isNull()
    }
}
