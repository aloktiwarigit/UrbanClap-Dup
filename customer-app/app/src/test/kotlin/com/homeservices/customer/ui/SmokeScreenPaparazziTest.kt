package com.homeservices.customer.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.font.FontFamily
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.di.BuildInfoProvider
import com.homeservices.designsystem.theme.HomeservicesTheme
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

    /**
     * Paparazzi / Robolectric cannot load variable-font TTFs via ResourcesCompat at test
     * time (known limitation — no font-variation-settings support in the test renderer).
     * We wrap HomeservicesTheme with a typography override that substitutes FontFamily.Default
     * so Paparazzi can render the layout. Colors, shapes, and spacing remain unchanged; only
     * the typeface is swapped to the system default for snapshot purposes.
     *
     * This wrapper is test-only. Production code always gets HomeservicesTheme unmodified.
     */
    @Composable
    private fun HomeservicesThemeForPaparazzi(
        darkTheme: Boolean,
        content: @Composable () -> Unit,
    ): Unit {
        HomeservicesTheme(darkTheme = darkTheme) {
            MaterialTheme(
                typography =
                    Typography(
                        displayLarge = MaterialTheme.typography.displayLarge.copy(fontFamily = FontFamily.Default),
                        displayMedium = MaterialTheme.typography.displayMedium.copy(fontFamily = FontFamily.Default),
                        headlineLarge = MaterialTheme.typography.headlineLarge.copy(fontFamily = FontFamily.Default),
                        headlineMedium = MaterialTheme.typography.headlineMedium.copy(fontFamily = FontFamily.Default),
                        titleLarge = MaterialTheme.typography.titleLarge.copy(fontFamily = FontFamily.Default),
                        bodyLarge = MaterialTheme.typography.bodyLarge.copy(fontFamily = FontFamily.Default),
                        bodyMedium = MaterialTheme.typography.bodyMedium.copy(fontFamily = FontFamily.Default),
                        bodySmall = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Default),
                        labelLarge = MaterialTheme.typography.labelLarge.copy(fontFamily = FontFamily.Default),
                        labelSmall = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Default),
                    ),
                content = content,
            )
        }
    }

    @Test
    public fun smokeScreenLightThemeMatchesSnapshot(): Unit {
        paparazzi.snapshot {
            HomeservicesThemeForPaparazzi(darkTheme = false) {
                SmokeScreen(buildInfo = fakeBuildInfo)
            }
        }
    }

    @Test
    public fun smokeScreenDarkThemeMatchesSnapshot(): Unit {
        paparazzi.snapshot {
            HomeservicesThemeForPaparazzi(darkTheme = true) {
                SmokeScreen(buildInfo = fakeBuildInfo)
            }
        }
    }
}
