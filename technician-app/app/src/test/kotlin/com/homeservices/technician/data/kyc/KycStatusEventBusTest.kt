package com.homeservices.technician.data.kyc

import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * TDD — [KycStatusEventBus] (E11-S05c WS-A).
 *
 * Mirrors [com.homeservices.technician.data.activeJob.BookingStatusEventBusTest]:
 * `replay = 0, extraBufferCapacity = 1` means a collector must be active at post time
 * to receive the event — there is no replay for late subscribers.
 */
@OptIn(ExperimentalCoroutinesApi::class)
public class KycStatusEventBusTest {
    @Test
    public fun `post emits KycStatusEvent to an active collector`(): Unit =
        runTest(UnconfinedTestDispatcher()) {
            val bus = KycStatusEventBus()
            var received: KycStatusEvent? = null
            val job = launch { received = bus.events.first() }

            bus.post(KycStatusEvent(technicianId = "tech-1", verified = true))
            job.join()

            assertThat(received).isNotNull()
            assertThat(received!!.technicianId).isEqualTo("tech-1")
            assertThat(received!!.verified).isTrue()
            assertThat(received!!.rejectionReason).isNull()
        }

    @Test
    public fun `late subscriber receives no replay`(): Unit =
        runTest(UnconfinedTestDispatcher()) {
            val bus = KycStatusEventBus()

            bus.post(KycStatusEvent(technicianId = "tech-1", verified = true))

            val collected = mutableListOf<KycStatusEvent>()
            val job = launch { bus.events.collect { collected.add(it) } }
            job.cancel()

            assertThat(collected).isEmpty()
        }

    @Test
    public fun `post propagates rejection reason verbatim`(): Unit =
        runTest(UnconfinedTestDispatcher()) {
            val bus = KycStatusEventBus()
            var received: KycStatusEvent? = null
            val job = launch { received = bus.events.first() }

            bus.post(
                KycStatusEvent(
                    technicianId = "tech-2",
                    verified = false,
                    rejectionReason = "PAN photo unreadable; please re-upload.",
                ),
            )
            job.join()

            assertThat(received).isNotNull()
            assertThat(received!!.verified).isFalse()
            assertThat(received!!.rejectionReason).isEqualTo("PAN photo unreadable; please re-upload.")
        }
}
