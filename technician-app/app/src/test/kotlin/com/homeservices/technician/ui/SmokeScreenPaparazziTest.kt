package com.homeservices.technician.ui

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.homeservices.technician.di.BuildInfoProvider
import org.junit.Rule
import org.junit.Test

// See customer-app's SmokeScreenPaparazziTest for full rationale. Same trade-off
// applied here for symmetry (keep both app catalogs byte-identical).
public class SmokeScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            maxPercentDifference = 10.0,
        )

    private val fakeBuildInfo: BuildInfoProvider =
        BuildInfoProvider(
            version = "0.1.0",
            gitSha = "abcdef1234567890abcdef1234567890abcdef12",
        )

    @Test
    public fun smokeScreenLightThemeMatchesSnapshot(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                SmokeScreen(buildInfo = fakeBuildInfo)
            }
        }
    }

    @Test
    public fun smokeScreenDarkThemeMatchesSnapshot(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                SmokeScreen(buildInfo = fakeBuildInfo)
            }
        }
    }
}
