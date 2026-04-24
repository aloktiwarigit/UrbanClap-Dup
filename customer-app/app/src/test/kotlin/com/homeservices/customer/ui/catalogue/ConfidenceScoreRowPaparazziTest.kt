package com.homeservices.customer.ui.catalogue

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.technician.model.ConfidenceScore
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

public class ConfidenceScoreRowPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Ignore("Goldens recorded on CI Linux -- trigger paparazzi-record.yml workflow_dispatch, then remove @Ignore")
    @Test
    public fun loaded_lightTheme() {
        paparazzi.snapshot {
            ConfidenceScoreRow(
                uiState =
                    ConfidenceScoreUiState.Loaded(
                        ConfidenceScore(
                            onTimePercent = 94,
                            areaRating = 4.7,
                            nearestEtaMinutes = 12,
                            dataPointCount = 35,
                            isLimitedData = false,
                        ),
                    ),
            )
        }
    }

    @Ignore("Goldens recorded on CI Linux -- trigger paparazzi-record.yml workflow_dispatch, then remove @Ignore")
    @Test
    public fun limitedData_lightTheme() {
        paparazzi.snapshot {
            ConfidenceScoreRow(uiState = ConfidenceScoreUiState.Limited)
        }
    }
}
