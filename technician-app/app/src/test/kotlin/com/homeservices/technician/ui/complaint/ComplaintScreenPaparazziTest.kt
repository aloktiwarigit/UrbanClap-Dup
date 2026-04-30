package com.homeservices.technician.ui.complaint

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.homeservices.technician.domain.complaint.TechComplaintReason
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
                            selectedReason = TechComplaintReason.LATE_PAYMENT,
                            description = "The customer paid cash but the payout was not reflected.",
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
