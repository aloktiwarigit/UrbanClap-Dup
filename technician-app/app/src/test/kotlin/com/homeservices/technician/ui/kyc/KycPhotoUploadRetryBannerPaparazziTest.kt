package com.homeservices.technician.ui.kyc

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

/**
 * Paparazzi screenshot tests for the KYC variant of [PhotoUploadRetryBanner].
 *
 * Goldens are recorded on Linux CI via `workflow_dispatch` on paparazzi-record.yml
 * to avoid cross-OS font drift. See docs/patterns/paparazzi-cross-os-goldens.md.
 *
 * Class name intentionally differs from the activeJob banner test
 * (`com.homeservices.technician.ui.activeJob.PhotoUploadRetryBannerPaparazziTest`) so
 * the CI golden-runner generates distinct snapshot files for each variant.
 */
@Ignore("Paparazzi goldens recorded on CI Linux only — see paparazzi-cross-os-goldens.md")
public class KycPhotoUploadRetryBannerPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun `KYC PhotoUploadRetryBanner default`() {
        paparazzi.snapshot {
            HomeservicesTheme {
                PhotoUploadRetryBanner(onRetry = {})
            }
        }
    }
}
