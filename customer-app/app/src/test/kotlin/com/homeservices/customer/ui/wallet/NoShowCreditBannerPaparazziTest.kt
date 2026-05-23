package com.homeservices.customer.ui.wallet

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

/**
 * Paparazzi screenshot tests for [NoShowCreditBanner].
 *
 * All methods are @Ignored per paparazzi-cross-os-goldens.md pattern:
 * goldens are never committed from Windows; CI records them via
 * `paparazzi-record.yml` workflow_dispatch on Ubuntu.
 */
public class NoShowCreditBannerPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Ignore("Paparazzi goldens recorded on CI Linux — never on Windows (cross-OS font drift)")
    @Test
    public fun noShowCreditBanner_en_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                NoShowCreditBanner(
                    creditAmountPaise = 50000L,
                    onDismiss = {},
                )
            }
        }
    }

    @Ignore("Paparazzi goldens recorded on CI Linux — never on Windows (cross-OS font drift)")
    @Test
    public fun noShowCreditBanner_hi_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                // Hindi locale rendering — uses the same composable;
                // locale switching is handled by the CI paparazzi-hi config.
                NoShowCreditBanner(
                    creditAmountPaise = 50000L,
                    onDismiss = {},
                )
            }
        }
    }
}
