package com.homeservices.designsystem.components

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

@Ignore("Record on CI Linux via workflow_dispatch paparazzi-record.yml")
class HsScreenTitlePaparazziTest {

    @get:Rule
    val paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Test
    fun defaultTitle_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                HsScreenTitle(text = "Screen Title")
            }
        }
    }

    @Test
    fun defaultTitle_darkTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                HsScreenTitle(text = "Screen Title")
            }
        }
    }
}
