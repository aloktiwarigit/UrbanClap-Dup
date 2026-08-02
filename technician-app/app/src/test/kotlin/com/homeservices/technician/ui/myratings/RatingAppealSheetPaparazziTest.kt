package com.homeservices.technician.ui.myratings

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

/**
 * Paparazzi screenshot tests for [RatingAppealSheet].
 *
 * Goldens are recorded on Linux CI via `workflow_dispatch` on paparazzi-record.yml
 * to avoid cross-OS font drift. See docs/patterns/paparazzi-cross-os-goldens.md.
 */
public class RatingAppealSheetPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun `RatingAppealSheet default en`() {
        paparazzi.snapshot {
            HomeservicesTheme {
                RatingAppealSheet(bookingId = "bk-1", onDismiss = {}, onSubmit = { _, _ -> }, isSubmitting = false)
            }
        }
    }

    @Test
    public fun `RatingAppealSheet submitting en`() {
        paparazzi.snapshot {
            HomeservicesTheme {
                RatingAppealSheet(bookingId = "bk-1", onDismiss = {}, onSubmit = { _, _ -> }, isSubmitting = true)
            }
        }
    }
}
