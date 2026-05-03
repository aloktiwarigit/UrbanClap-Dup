package com.homeservices.designsystem.locale

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

public class LanguagePickerCardPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun englishSelected_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                LanguagePickerCard(
                    options = DefaultLanguageOptions,
                    selectedTag = "en",
                    onSelect = {},
                )
            }
        }
    }

    @Test
    public fun englishSelected_darkTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                LanguagePickerCard(
                    options = DefaultLanguageOptions,
                    selectedTag = "en",
                    onSelect = {},
                )
            }
        }
    }

    @Test
    public fun hindiSelected_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                LanguagePickerCard(
                    options = DefaultLanguageOptions,
                    selectedTag = "hi",
                    onSelect = {},
                )
            }
        }
    }

    @Test
    public fun hindiSelected_darkTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                LanguagePickerCard(
                    options = DefaultLanguageOptions,
                    selectedTag = "hi",
                    onSelect = {},
                )
            }
        }
    }
}
