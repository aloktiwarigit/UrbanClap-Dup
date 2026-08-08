package com.homeservices.technician.ui.activeJob

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

/**
 * Paparazzi screenshot tests for [ShieldReportSheet].
 *
 * Goldens are recorded on Linux CI via `workflow_dispatch` on paparazzi-record.yml
 * to avoid cross-OS font drift. See docs/patterns/paparazzi-cross-os-goldens.md.
 */
public class ShieldReportSheetPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun `ShieldReportSheet default en`() {
        paparazzi.snapshot {
            HomeservicesTheme {
                ShieldReportSheetContent(onSubmit = {}, isSubmitting = false)
            }
        }
    }

    @Test
    public fun `ShieldReportSheet submitting en`() {
        paparazzi.snapshot {
            HomeservicesTheme {
                ShieldReportSheetContent(onSubmit = {}, isSubmitting = true)
            }
        }
    }

    @Test
    public fun `ShieldReportSheet error en`() {
        paparazzi.snapshot {
            HomeservicesTheme {
                ShieldReportSheetContent(
                    onSubmit = {},
                    isSubmitting = false,
                    errorMessage = "Could not submit report. Try again.",
                )
            }
        }
    }
}
