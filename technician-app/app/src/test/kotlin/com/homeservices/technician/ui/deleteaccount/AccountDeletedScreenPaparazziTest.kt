package com.homeservices.technician.ui.deleteaccount

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

public class AccountDeletedScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun accountDeletedScreen(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                AccountDeletedScreenContent(
                    formattedDate = "29 May 2026",
                    deletionRequestUrl = "https://example.com/deletion-request/",
                    onDone = {},
                )
            }
        }
    }
}
