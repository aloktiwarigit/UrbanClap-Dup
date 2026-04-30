package com.homeservices.technician.ui.earnings

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.homeservices.technician.domain.earnings.model.DailyEarnings
import com.homeservices.technician.domain.earnings.model.EarningsPeriod
import com.homeservices.technician.domain.earnings.model.EarningsSummary
import org.junit.Rule
import org.junit.Test

public class EarningsScreenTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Test
    public fun earningsSuccess(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                EarningsContent(
                    uiState = EarningsUiState.Success(sampleSummary()),
                    onRetry = {},
                    onViewRatings = {},
                )
            }
        }
    }

    private fun sampleSummary(): EarningsSummary =
        EarningsSummary(
            today = EarningsPeriod(125000, 3),
            week = EarningsPeriod(865000, 14),
            month = EarningsPeriod(2140000, 41),
            lifetime = EarningsPeriod(18450000, 326),
            lastSevenDays =
                listOf(
                    DailyEarnings("2026-04-23", 90000),
                    DailyEarnings("2026-04-24", 110000),
                    DailyEarnings("2026-04-25", 80000),
                    DailyEarnings("2026-04-26", 160000),
                    DailyEarnings("2026-04-27", 150000),
                    DailyEarnings("2026-04-28", 170000),
                    DailyEarnings("2026-04-29", 125000),
                ),
        )
}
