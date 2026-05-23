package com.homeservices.technician.data.jobOffer

import com.homeservices.technician.domain.jobOffer.model.JobOffer
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.withTimeoutOrNull
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class JobOfferEventBusTest {
    private fun offer(): JobOffer =
        JobOffer(
            bookingId = "booking-123",
            serviceId = "ac-deep-clean",
            serviceName = "AC Deep Clean",
            addressText = "HX6J+65C, Milkipur, Bhitari",
            slotDate = "2026-05-09",
            slotWindow = "10:00-12:00",
            amountPaise = 50000L,
            distanceKm = 1.2,
            expiresAtMs = System.currentTimeMillis() + 30_000L,
        )

    @Test
    public fun `late subscriber receives latest job offer`(): Unit =
        runTest {
            val eventBus = JobOfferEventBus()
            val offer = offer()

            eventBus.tryEmit(offer)

            assertThat(eventBus.events.first()).isEqualTo(offer)
        }

    @Test
    public fun `clearCurrentOffer wipes replayed payload`(): Unit =
        runTest {
            val eventBus = JobOfferEventBus()
            eventBus.tryEmit(offer())

            eventBus.clearCurrentOffer()

            val replayed = withTimeoutOrNull(100) { eventBus.events.first() }
            assertThat(replayed).isNull()
        }
}
