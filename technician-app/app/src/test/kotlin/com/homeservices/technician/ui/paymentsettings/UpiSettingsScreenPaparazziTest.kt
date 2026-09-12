package com.homeservices.technician.ui.paymentsettings

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

/**
 * Paparazzi screenshot test for [UpiSettingsScreenContent].
 *
 * Goldens are recorded on Linux CI via `workflow_dispatch` on paparazzi-record.yml
 * to avoid cross-OS font drift. See docs/patterns/paparazzi-cross-os-goldens.md.
 */
@Ignore("Paparazzi goldens recorded on CI Linux only — see paparazzi-cross-os-goldens.md")
public class UpiSettingsScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun `UpiSettingsScreen empty state`() {
        paparazzi.snapshot {
            HomeservicesTheme {
                UpiSettingsScreenContent(
                    uiState = UpiSettingsUiState.Ready(vpaInput = ""),
                    onVpaChange = {},
                    onSave = {},
                    onSaveSuccessConsumed = {},
                )
            }
        }
    }

    @Test
    public fun `UpiSettingsScreen with VPA entered`() {
        paparazzi.snapshot {
            HomeservicesTheme {
                UpiSettingsScreenContent(
                    uiState = UpiSettingsUiState.Ready(vpaInput = "alok@okhdfcbank"),
                    onVpaChange = {},
                    onSave = {},
                    onSaveSuccessConsumed = {},
                )
            }
        }
    }
}
