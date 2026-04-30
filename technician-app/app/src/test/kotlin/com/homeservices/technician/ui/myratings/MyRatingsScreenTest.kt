package com.homeservices.technician.ui.myratings

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.homeservices.technician.domain.rating.model.RatingSubScoreAverages
import com.homeservices.technician.domain.rating.model.RatingWeekTrend
import com.homeservices.technician.domain.rating.model.ReceivedRating
import com.homeservices.technician.domain.rating.model.TechRatingSummary
import org.junit.Rule
import org.junit.Test

public class MyRatingsScreenTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Test
    public fun myRatingsSuccess(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                MyRatingsContent(
                    uiState = MyRatingsUiState.Success(sampleSummary()),
                    onRetry = {},
                )
            }
        }
    }

    private fun sampleSummary(): TechRatingSummary =
        TechRatingSummary(
            totalCount = 128,
            averageOverall = 4.7,
            averageSubScores = RatingSubScoreAverages(4.8, 4.7, 4.9),
            trend =
                listOf(
                    RatingWeekTrend("2026-03-16", 4.5, 12),
                    RatingWeekTrend("2026-03-23", 4.6, 16),
                    RatingWeekTrend("2026-03-30", 4.8, 18),
                    RatingWeekTrend("2026-04-06", 4.7, 14),
                ),
            items =
                listOf(
                    ReceivedRating("bk-1", 5, 5, 5, 5, "Very professional and on time.", "2026-04-29T10:00:00Z"),
                    ReceivedRating("bk-2", 4, 5, 4, 5, "Good service.", "2026-04-28T10:00:00Z"),
                ),
        )
}
