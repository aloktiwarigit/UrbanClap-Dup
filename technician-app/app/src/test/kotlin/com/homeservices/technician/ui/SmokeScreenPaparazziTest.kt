package com.homeservices.technician.ui

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.technician.di.BuildInfoProvider
import com.homeservices.technician.ui.theme.HomeservicesTechnicianTheme
import org.junit.Rule
import org.junit.Test

public class SmokeScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    private val fakeBuildInfo: BuildInfoProvider =
        BuildInfoProvider(
            version = "0.1.0",
            gitSha = "abcdef1234567890abcdef1234567890abcdef12",
        )

    @Test
    public fun smokeScreen_lightTheme_matchesSnapshot() {
        paparazzi.snapshot {
            HomeservicesTechnicianTheme(darkTheme = false) {
                SmokeScreen(buildInfo = fakeBuildInfo)
            }
        }
    }

    @Test
    public fun smokeScreen_darkTheme_matchesSnapshot() {
        paparazzi.snapshot {
            HomeservicesTechnicianTheme(darkTheme = true) {
                SmokeScreen(buildInfo = fakeBuildInfo)
            }
        }
    }
}
