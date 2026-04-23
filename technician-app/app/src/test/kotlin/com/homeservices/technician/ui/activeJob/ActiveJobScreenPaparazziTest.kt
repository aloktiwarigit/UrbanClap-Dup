package com.homeservices.technician.ui.activeJob

import app.cash.paparazzi.Paparazzi
import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.LatLng
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

public class ActiveJobScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi()

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

    @Ignore("Record on CI Linux via paparazzi-record.yml workflow_dispatch")
    @Test
    public fun activeJobScreen_enRoute(): Unit {
        paparazzi.snapshot {
            ActiveJobScreenContent(
                uiState =
                    ActiveJobUiState.Active(
                        aJob(ActiveJobStatus.EN_ROUTE),
                        ActiveJobAction.MARK_ARRIVED,
                    ),
                onStartTrip = {},
                onMarkReached = {},
                onStartWork = {},
                onCompleteJob = {},
            )
        }
    }

    @Ignore("Record on CI Linux via paparazzi-record.yml workflow_dispatch")
    @Test
    public fun activeJobScreen_reached(): Unit {
        paparazzi.snapshot {
            ActiveJobScreenContent(
                uiState =
                    ActiveJobUiState.Active(
                        aJob(ActiveJobStatus.REACHED),
                        ActiveJobAction.START_WORK,
                    ),
                onStartTrip = {},
                onMarkReached = {},
                onStartWork = {},
                onCompleteJob = {},
            )
        }
    }

    @Ignore("Record on CI Linux via paparazzi-record.yml workflow_dispatch")
    @Test
    public fun activeJobScreen_inProgress(): Unit {
        paparazzi.snapshot {
            ActiveJobScreenContent(
                uiState =
                    ActiveJobUiState.Active(
                        aJob(ActiveJobStatus.IN_PROGRESS),
                        ActiveJobAction.COMPLETE_JOB,
                    ),
                onStartTrip = {},
                onMarkReached = {},
                onStartWork = {},
                onCompleteJob = {},
            )
        }
    }
}
