package com.homeservices.customer.ui.booking

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

public class SlotPickerScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun slotPickerInitial_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                SlotPickerScreen(
                    onSlotSelected = {},
                    onBack = {},
                )
            }
        }
    }

    @Test
    public fun slotPickerInitial_darkTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                SlotPickerScreen(
                    onSlotSelected = {},
                    onBack = {},
                )
            }
        }
    }
}
