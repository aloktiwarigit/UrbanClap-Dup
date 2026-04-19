package com.homeservices.customer.ui

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.di.BuildInfoProvider
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

// Paparazzi / Robolectric cannot load variable-font TTFs with FontVariation.Settings at test
// time — the test renderer silently falls back to the system default typeface. Snapshots
// therefore render Roboto rather than Geist Sans; production APKs use Geist Sans correctly.
// Pixel-lock baseline accepts this fallback; a future story tightens Paparazzi variable-font
// support (likely via FontLoadingStrategy.OptionalLocal in design-system Typography.kt).
public class SmokeScreenPaparazziTest {
    // maxPercentDifference = 2.0 (vs default 0.1%) tolerates cross-OS font-metrics drift
    // between Windows-recorded goldens and Linux CI renders. Design-system's TokenGallery
    // (mostly boxes + small labels) stays under the default 0.1% threshold; SmokeScreen's
    // displayLarge 48sp text accumulates antialiasing diffs above that, hence the bump.
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            maxPercentDifference = 2.0,
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
