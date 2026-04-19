package com.homeservices.designsystem.gallery

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.android.ide.common.rendering.api.SessionParams
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

internal class TokenGalleryPaparazziTest {
    @get:Rule
    internal val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            renderingMode = SessionParams.RenderingMode.V_SCROLL,
        )

    @Test
    internal fun tokenGallery_lightTheme_matchesSnapshot() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                TokenGallery()
            }
        }
    }

    @Test
    internal fun tokenGallery_darkTheme_matchesSnapshot() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                TokenGallery()
            }
        }
    }
}
