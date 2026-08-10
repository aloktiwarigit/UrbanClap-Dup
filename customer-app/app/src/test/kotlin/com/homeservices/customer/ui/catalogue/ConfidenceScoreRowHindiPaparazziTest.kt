package com.homeservices.customer.ui.catalogue

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.technician.model.ConfidenceScore
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

// Codex F2 (owner ruling 2026-08-09): HI-light variants only, dark deferred. See
// CatalogueHomeScreenHindiPaparazziTest for the locale-switch rationale.
public class ConfidenceScoreRowHindiPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5.copy(locale = "hi"),
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun loaded_hindiLight() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
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
    }

    @Test
    public fun limitedData_hindiLight() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                ConfidenceScoreRow(uiState = ConfidenceScoreUiState.Limited)
            }
        }
    }
}
