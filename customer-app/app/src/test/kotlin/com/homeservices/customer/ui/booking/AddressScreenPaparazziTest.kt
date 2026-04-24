package com.homeservices.customer.ui.booking

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

public class AddressScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun addressScreenEmpty_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                AddressScreen(
                    onAddressConfirmed = { _, _, _ -> },
                    onBack = {},
                )
            }
        }
    }

    @Test
    public fun addressScreenEmpty_darkTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                AddressScreen(
                    onAddressConfirmed = { _, _, _ -> },
                    onBack = {},
                )
            }
        }
    }
}
