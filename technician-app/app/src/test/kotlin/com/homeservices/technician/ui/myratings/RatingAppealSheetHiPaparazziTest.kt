package com.homeservices.technician.ui.myratings

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

/**
 * Hindi-locale Paparazzi screenshot test for [RatingAppealSheet].
 *
 * Goldens are recorded on Linux CI via `workflow_dispatch` on paparazzi-record.yml
 * to avoid cross-OS font drift. See docs/patterns/paparazzi-cross-os-goldens.md.
 */
public class RatingAppealSheetHiPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5.copy(locale = "hi"),
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun ratingAppealSheet_default_hi() {
        paparazzi.snapshot {
            HomeservicesTheme {
                RatingAppealSheet(bookingId = "bk-1", onDismiss = {}, onSubmit = { _, _ -> }, isSubmitting = false)
            }
        }
    }
}
