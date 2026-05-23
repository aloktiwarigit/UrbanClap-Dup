package com.homeservices.technician.ui.activeJob

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

/**
 * Paparazzi screenshot tests for [CompletionConfirmationDialog].
 *
 * Goldens are recorded on Linux CI via `workflow_dispatch` on paparazzi-record.yml
 * to avoid cross-OS font drift. See docs/patterns/paparazzi-cross-os-goldens.md.
 */
@Ignore("Paparazzi goldens recorded on CI Linux only — see paparazzi-cross-os-goldens.md")
public class CompletionConfirmationDialogPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun `CompletionConfirmationDialog default`() {
        paparazzi.snapshot {
            HomeservicesTheme {
                CompletionConfirmationDialog(onConfirm = {}, onDismiss = {})
            }
        }
    }
}
