package com.homeservices.customer.ui.dataexport

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

/**
 * Paparazzi screenshot tests for DataExportScreen.
 *
 * Goldens are NOT recorded locally on Windows — cross-OS font antialiasing
 * drift causes mismatches. Record goldens via the `paparazzi-record.yml`
 * workflow_dispatch CI job (Linux runner).
 *
 * See docs/patterns/paparazzi-cross-os-goldens.md.
 */
@Ignore("CI-only — record goldens via paparazzi-record.yml workflow_dispatch on Linux runner")
public class DataExportScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Test
    public fun dataExportScreenIdle(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                DataExportContent(
                    state = DataExportUiState.Idle,
                    onDownloadClick = {},
                    onRetry = {},
                )
            }
        }
    }

    @Test
    public fun dataExportScreenLoading(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                DataExportContent(
                    state = DataExportUiState.Loading,
                    onDownloadClick = {},
                    onRetry = {},
                )
            }
        }
    }

    @Test
    public fun dataExportScreenError(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                DataExportContent(
                    state = DataExportUiState.Error("Network unavailable. Please retry."),
                    onDownloadClick = {},
                    onRetry = {},
                )
            }
        }
    }
}
