package com.homeservices.technician.ui.jobOffer

import android.content.Context
import android.content.Intent
import androidx.test.core.app.ApplicationProvider
import com.homeservices.technician.domain.jobOffer.model.JobOffer
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
public class JobOfferFullScreenActivityTest {
    private val context: Context = ApplicationProvider.getApplicationContext()

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
    public fun notificationIntentRoundTripsJobOfferPayload(): Unit {
        val offer = offer()

        val intent = JobOfferFullScreenActivity.intentFor(context, offer)

        assertThat(JobOfferFullScreenActivity.offerFromIntent(intent)).isEqualTo(offer)
        assertThat(intent.flags and Intent.FLAG_ACTIVITY_SINGLE_TOP).isNotZero()
    }

    @Test
    public fun emptyIntentDoesNotProduceJobOffer(): Unit {
        val intent = Intent(context, JobOfferFullScreenActivity::class.java)

        assertThat(JobOfferFullScreenActivity.offerFromIntent(intent)).isNull()
    }
}
