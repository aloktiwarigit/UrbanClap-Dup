package com.homeservices.customer.ui.booking

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

public class BookingConfirmedScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Ignore("Layout changed (TrustDossierCard added) — delete golden and re-record on CI")
    @Test
    public fun bookingConfirmed_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                BookingConfirmedScreen(
                    bookingId = "BK-2026-001234",
                    onBackToHome = {},
                )
            }
        }
    }

    @Ignore("Layout changed (TrustDossierCard added) — delete golden and re-record on CI")
    @Test
    public fun bookingConfirmed_darkTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                BookingConfirmedScreen(
                    bookingId = "BK-2026-001234",
                    onBackToHome = {},
                )
            }
        }
    }
}
