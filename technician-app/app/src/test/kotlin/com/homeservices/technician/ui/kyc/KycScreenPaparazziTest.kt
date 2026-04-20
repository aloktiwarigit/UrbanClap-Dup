package com.homeservices.technician.ui.kyc

import android.net.Uri
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.homeservices.technician.domain.kyc.model.KycStatus
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

public class KycScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    @Ignore("goldens recorded on CI — see docs/patterns/paparazzi-cross-os-goldens.md")
    public fun snapshot_step1_aadhaar(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycStepAadhaar(onStartKyc = {})
            }
        }
    }

    @Test
    @Ignore("goldens recorded on CI — see docs/patterns/paparazzi-cross-os-goldens.md")
    public fun snapshot_step2_pan_no_selection(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycStepPan(selectedUri = null, onUriSelected = {})
            }
        }
    }

    @Test
    @Ignore("goldens recorded on CI — see docs/patterns/paparazzi-cross-os-goldens.md")
    public fun snapshot_step2_pan_selected(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycStepPan(
                    selectedUri = Uri.parse("content://media/external/images/media/1"),
                    onUriSelected = {},
                )
            }
        }
    }

    @Test
    @Ignore("goldens recorded on CI — see docs/patterns/paparazzi-cross-os-goldens.md")
    public fun snapshot_step3_complete(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycStepReview(status = KycStatus.PAN_DONE, onRetry = null)
            }
        }
    }

    @Test
    @Ignore("goldens recorded on CI — see docs/patterns/paparazzi-cross-os-goldens.md")
    public fun snapshot_step3_error(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycStepReview(
                    status = null,
                    onRetry = {},
                    errorMessage = "Network error during Aadhaar verification. Please try again.",
                )
            }
        }
    }

    @Test
    @Ignore("goldens recorded on CI — see docs/patterns/paparazzi-cross-os-goldens.md")
    public fun snapshot_loading(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycLoadingContent(message = "Processing\u2026")
            }
        }
    }
}
