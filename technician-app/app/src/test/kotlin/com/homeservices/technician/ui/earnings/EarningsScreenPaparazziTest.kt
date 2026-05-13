package com.homeservices.technician.ui.earnings

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.homeservices.technician.domain.earnings.model.DailyEarnings
import com.homeservices.technician.domain.earnings.model.EarningsPeriod
import com.homeservices.technician.domain.earnings.model.EarningsSummary
import com.homeservices.technician.domain.earnings.model.MonthEarningsPeriod
import org.junit.Rule
import org.junit.Test

public class EarningsScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @get:Rule
    public val paparazziHi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5.copy(locale = "hi"),
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    private fun aSummary(): EarningsSummary =
        EarningsSummary(
            today = EarningsPeriod(techAmountPaise = 120000L, count = 3),
            week = EarningsPeriod(techAmountPaise = 480000L, count = 11),
            month = MonthEarningsPeriod(techAmountPaise = 1800000L, count = 42, goalPaise = 2500000L),
            lifetime = EarningsPeriod(techAmountPaise = 24000000L, count = 520),
            lastSevenDays =
                listOf(
                    DailyEarnings(date = "2026-05-07", techAmountPaise = 80000L, jobs = 2),
                    DailyEarnings(date = "2026-05-08", techAmountPaise = 120000L, jobs = 3),
                    DailyEarnings(date = "2026-05-09", techAmountPaise = 0L, jobs = 0),
                    DailyEarnings(date = "2026-05-10", techAmountPaise = 100000L, jobs = 2),
                    DailyEarnings(date = "2026-05-11", techAmountPaise = 90000L, jobs = 2),
                    DailyEarnings(date = "2026-05-12", techAmountPaise = 60000L, jobs = 1),
                    DailyEarnings(date = "2026-05-13", techAmountPaise = 120000L, jobs = 3),
                ),
        )

    @Test
    public fun earningsScreen_success(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                EarningsContent(
                    uiState = EarningsUiState.Success(summary = aSummary()),
                    onRetry = {},
                    onViewRatings = {},
                    onPayoutSettings = {},
                )
            }
        }
    }

    @Test
    public fun earningsScreen_loading(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                EarningsContent(
                    uiState = EarningsUiState.Loading,
                    onRetry = {},
                    onViewRatings = {},
                    onPayoutSettings = {},
                )
            }
        }
    }

    @Test
    public fun earningsScreen_error(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                EarningsContent(
                    uiState = EarningsUiState.Error,
                    onRetry = {},
                    onViewRatings = {},
                    onPayoutSettings = {},
                )
            }
        }
    }

    // ── hi-locale variants ────────────────────────────────────────────────────
    // Goldens recorded on CI Linux via paparazzi-record.yml; never locally on Windows.

    @Test
    public fun earningsScreen_success_hi(): Unit {
        paparazziHi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                EarningsContent(
                    uiState = EarningsUiState.Success(summary = aSummary()),
                    onRetry = {},
                    onViewRatings = {},
                    onPayoutSettings = {},
                )
            }
        }
    }

    @Test
    public fun earningsScreen_loading_hi(): Unit {
        paparazziHi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                EarningsContent(
                    uiState = EarningsUiState.Loading,
                    onRetry = {},
                    onViewRatings = {},
                    onPayoutSettings = {},
                )
            }
        }
    }
}
