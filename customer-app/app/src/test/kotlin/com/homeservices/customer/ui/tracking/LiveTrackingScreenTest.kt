package com.homeservices.customer.ui.tracking

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.tracking.model.BookingStatus
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
public class LiveTrackingScreenTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Ignore("CI-only — record via paparazzi-record.yml after E14-S01 layout changes")
    @Test
    public fun liveTrackingInProgressNoLocation(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                LiveTrackingContent(
                    uiState =
                        LiveTrackingUiState.Tracking(
                            bookingId = "bk-1",
                            location = null,
                            status = BookingStatus.InProgress,
                            techName = "Ravi Kumar",
                            techPhotoUrl = "",
                            etaMinutes = 12,
                        ),
                    onFileComplaint = {},
                )
            }
        }
    }
}
