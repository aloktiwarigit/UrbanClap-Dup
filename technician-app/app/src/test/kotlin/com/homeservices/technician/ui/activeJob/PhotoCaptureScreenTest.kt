package com.homeservices.technician.ui.activeJob

import app.cash.paparazzi.Paparazzi
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

public class PhotoCaptureScreenTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi()

    @Ignore("HandlerDispatcher IllegalStateException — CameraX/MediaStore Handler fires after Paparazzi Looper quits; fix with mock camera provider before recording")
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
