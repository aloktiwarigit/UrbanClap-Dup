package com.homeservices.customer.ui.booking

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.booking.model.BookingSlot
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

public class BookingSummaryScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    private val readyState =
        BookingUiState.Ready(
            slot = BookingSlot("2026-05-01", "10:00-12:00"),
            addressText = "123 MG Road, Bengaluru",
            lat = 12.9716,
            lng = 77.5946,
        )

    @Test
    public fun bookingSummaryReady_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                BookingSummaryContent(
                    uiState = readyState,
                    onCreateBooking = {},
                    onBack = {},
                )
            }
        }
    }

    @Test
    public fun bookingSummaryReady_darkTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                BookingSummaryContent(
                    uiState = readyState,
                    onCreateBooking = {},
                    onBack = {},
                )
            }
        }
    }
}
