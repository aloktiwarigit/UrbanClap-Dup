package com.homeservices.technician.ui.jobOffer

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.homeservices.technician.domain.jobOffer.model.JobOffer
import org.junit.Rule
import org.junit.Test

public class JobOfferScreenHiPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5.copy(locale = "hi"),
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    private fun anOffer(): JobOffer =
        JobOffer(
            bookingId = "booking-123",
            serviceId = "svc-1",
            serviceName = "AC Repair",
            addressText = "12 Main Street, Bengaluru",
            slotDate = "2026-05-01",
            slotWindow = "10:00-12:00",
            amountPaise = 50000L,
            distanceKm = 2.5,
            expiresAtMs = System.currentTimeMillis() + 30_000L,
        )

    // Goldens recorded on CI Linux via paparazzi-record.yml; never locally on Windows.

    @Test
    public fun jobOfferScreen_offerArrived_hi(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                JobOfferScreenContent(
                    uiState = JobOfferUiState.Offering(offer = anOffer(), remainingSeconds = 28),
                    onAccept = {},
                    onDecline = {},
                )
            }
        }
    }

    @Test
    public fun jobOfferScreen_expired_hi(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                JobOfferScreenContent(
                    uiState = JobOfferUiState.Expired,
                    onAccept = {},
                    onDecline = {},
                )
            }
        }
    }
}
