package com.homeservices.customer.ui.tracking

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

public class SosBottomSheetPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_6)

    @Test
    @Ignore("Goldens recorded on CI Linux via paparazzi-record.yml workflow_dispatch")
    public fun sosBottomSheet_uploadingEvidence_lightTheme() {
        paparazzi.snapshot {
            SosUploadingEvidenceSheet(pct = 42, onDismiss = {})
        }
    }

    @Test
    @Ignore("Goldens recorded on CI Linux via paparazzi-record.yml workflow_dispatch")
    public fun sosBottomSheet_evidenceSaved_lightTheme() {
        paparazzi.snapshot {
            SosEvidenceSavedSheet(onDismiss = {})
        }
    }

    @Test
    @Ignore("Goldens recorded on CI Linux via paparazzi-record.yml workflow_dispatch")
    public fun sosBottomSheet_evidenceUploadError_lightTheme() {
        paparazzi.snapshot {
            SosEvidenceUploadErrorSheet(message = "upload_failed", onDismiss = {})
        }
    }
}
