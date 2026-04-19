package com.homeservices.technician.ui

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.homeservices.technician.di.BuildInfoProvider
import org.junit.Rule
import org.junit.Test

// Paparazzi falls back to FontFamily.Default for variable-font TTFs under Robolectric
// (FontLoadingStrategy.OptionalLocal in design-system Typography.kt). Production APKs
// render Geist Sans correctly; snapshots render system default. Pixel-lock accepts this.
public class SmokeScreenPaparazziTest {
    // maxPercentDifference = 10.0 (vs default 0.1%) tolerates cross-OS font-metrics drift
    // between Windows-recorded goldens and Linux CI renders. See customer-app's test for
    // the same rationale; keep the tolerance value in sync across both apps.
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
