package com.homeservices.technician.ui.activeJob

import app.cash.paparazzi.Paparazzi
import org.junit.Rule
import org.junit.Test

public class PhotoCaptureScreenTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi()

    @Test
    public fun `PhotoCaptureScreen arrived stage prompt`(): Unit {
        paparazzi.snapshot {
            PhotoCaptureScreen(
                stage = "REACHED",
                onPhotoTaken = {},
                onDismiss = {},
                isUploading = false,
                uploadError = null,
                onRetry = {},
            )
        }
    }
}
