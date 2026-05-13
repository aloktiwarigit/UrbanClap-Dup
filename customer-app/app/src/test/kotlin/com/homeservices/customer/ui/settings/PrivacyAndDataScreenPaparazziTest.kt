package com.homeservices.customer.ui.settings

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

/**
 * Paparazzi screenshot tests for PrivacyAndDataScreen.
 *
 * Covers both DPDP flag-OFF (delete-account row hidden) and flag-ON (row visible)
 * variants introduced when the delete-account row was gated behind
 * featureFlags.dpdpSelfServiceEnabled() in E15-S01 fix-round.
 *
 * Goldens are NOT recorded locally on Windows — cross-OS font antialiasing drift
 * causes mismatches.  Record via the `paparazzi-record.yml` workflow_dispatch CI
 * job (Linux runner).  See docs/patterns/paparazzi-cross-os-goldens.md.
 */
@Ignore("CI-only — record goldens via paparazzi-record.yml workflow_dispatch on Linux runner")
public class PrivacyAndDataScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    /**
     * Flag OFF — only the "Download my data" row is visible.
     * The "Delete account" row must not appear in this snapshot.
     */
    @Test
    public fun privacyAndData_flagOff_deleteRowHidden() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                PrivacyAndDataScreen(
                    onDownloadDataClick = {},
                    onDeleteAccountClick = null,
                    onBack = {},
                )
            }
        }
    }

    /**
     * Flag ON — both rows are visible.
     * Used to verify the delete-account row renders correctly once
     * E15-S02 wires the route and the flag is flipped ON.
     */
    @Test
    public fun privacyAndData_flagOn_deleteRowVisible() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                PrivacyAndDataScreen(
                    onDownloadDataClick = {},
                    onDeleteAccountClick = {},
                    onBack = {},
                )
            }
        }
    }
}
