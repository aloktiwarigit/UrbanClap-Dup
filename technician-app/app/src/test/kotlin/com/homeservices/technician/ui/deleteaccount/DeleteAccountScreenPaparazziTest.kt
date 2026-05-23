package com.homeservices.technician.ui.deleteaccount

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

public class DeleteAccountScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun deleteAccountScreen_idle(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                DeleteAccountScreenContent(
                    uiState = DeleteAccountUiState.Idle,
                    onConfirm = {},
                    onCancel = {},
                )
            }
        }
    }

    @Test
    public fun deleteAccountScreen_submitting(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                DeleteAccountScreenContent(
                    uiState = DeleteAccountUiState.Submitting,
                    onConfirm = {},
                    onCancel = {},
                )
            }
        }
    }
}
