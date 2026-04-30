package com.homeservices.customer.ui.complaint

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.complaint.ComplaintReason
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

public class ComplaintScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Test
    public fun complaintScreenIdleWithReason(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                ComplaintContent(
                    state =
                        ComplaintUiState.Idle(
                            selectedReason = ComplaintReason.SERVICE_QUALITY,
                            description = "The service was incomplete and needs follow-up.",
                            submitEnabled = true,
                        ),
                    onBack = {},
                    onRetry = {},
                    onReasonSelected = {},
                    onDescriptionChanged = {},
                    onPhotoClick = {},
                    onSubmit = {},
                )
            }
        }
    }
}
