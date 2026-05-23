package com.homeservices.customer.ui.complaint

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.complaint.ComplaintReason
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

@Ignore("Re-record on CI Linux via workflow_dispatch paparazzi-record.yml after sprint2a merge")
public class ComplaintScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Ignore("Paparazzi goldens recorded on CI Linux — never on Windows (cross-OS font drift)")
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
                    onRetry = {},
                    onReasonSelected = {},
                    onDescriptionChanged = {},
                    onPhotoClick = {},
                    onSubmit = {},
                    onReopen = {},
                )
            }
        }
    }
}
