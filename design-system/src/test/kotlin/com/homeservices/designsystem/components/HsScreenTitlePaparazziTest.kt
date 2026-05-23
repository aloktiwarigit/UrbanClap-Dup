package com.homeservices.designsystem.components

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

@Ignore("Record on CI Linux via workflow_dispatch paparazzi-record.yml")
public class HsScreenTitlePaparazziTest {

    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Test
    public fun defaultTitle_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                HsScreenTitle(text = "Screen Title")
            }
        }
    }

    @Test
    public fun defaultTitle_darkTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                HsScreenTitle(text = "Screen Title")
            }
        }
    }
}
