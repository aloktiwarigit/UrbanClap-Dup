package com.homeservices.customer.ui.settings

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

public class SettingsScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun settings_light() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                SettingsScreen(onLanguageClick = {}, onBack = {})
            }
        }
    }

    @Test
    public fun settings_dark() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                SettingsScreen(onLanguageClick = {}, onBack = {})
            }
        }
    }
}
