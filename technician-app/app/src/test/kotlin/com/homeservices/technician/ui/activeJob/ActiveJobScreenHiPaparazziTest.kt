package com.homeservices.technician.ui.activeJob

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.LatLng
import org.junit.Rule
import org.junit.Test

public class ActiveJobScreenHiPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5.copy(locale = "hi"),
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    private fun aJob(status: ActiveJobStatus) =
        ActiveJob(
            bookingId = "bk-1",
            customerId = "c-1",
            serviceId = "svc-1",
            serviceName = "AC Repair",
            addressText = "12 Main Street, Bengaluru",
            addressLatLng = LatLng(12.9, 77.6),
            status = status,
            slotDate = "2026-05-01",
            slotWindow = "10:00-12:00",
        )

    // Goldens recorded on CI Linux via paparazzi-record.yml; never locally on Windows.

    @Test
    public fun activeJobScreen_enRoute_hi(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                ActiveJobScreenContent(
                    uiState = ActiveJobUiState.Active(aJob(ActiveJobStatus.EN_ROUTE), ActiveJobAction.MARK_ARRIVED),
                    onTransitionRequested = {},
                    onPhotoCancelled = {},
                    onPhotoConfirmed = {},
                    onPhotoRetake = {},
                    onPhotoRetryRequested = {},
                    onCompleteConfirmRequest = {},
                    onCompleteConfirm = {},
                    onCompleteCancel = {},
                )
            }
        }
    }

    @Test
    public fun activeJobScreen_inProgress_hi(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                ActiveJobScreenContent(
                    uiState = ActiveJobUiState.Active(aJob(ActiveJobStatus.IN_PROGRESS), ActiveJobAction.COMPLETE_JOB),
                    onTransitionRequested = {},
                    onPhotoCancelled = {},
                    onPhotoConfirmed = {},
                    onPhotoRetake = {},
                    onPhotoRetryRequested = {},
                    onCompleteConfirmRequest = {},
                    onCompleteConfirm = {},
                    onCompleteCancel = {},
                )
            }
        }
    }
}
