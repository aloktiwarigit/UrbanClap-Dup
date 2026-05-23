package com.homeservices.customer.ui.settings

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.MutableStateFlow
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

public class LanguageSettingsScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    private fun vmWithTag(tag: String): LanguageSettingsViewModel =
        mockk<LanguageSettingsViewModel>(relaxed = true).also { vm ->
            every { vm.selectedTag } returns MutableStateFlow(tag)
            every { vm.savedFlow } returns MutableStateFlow(false)
        }

    @Ignore("Record goldens on CI via paparazzi-record.yml workflow_dispatch — Sprint 5 follow-up PR")
    @Test
    public fun englishSelected_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                LanguageSettingsScreen(onSaved = {}, viewModel = vmWithTag("en"))
            }
        }
    }

    @Ignore("Record goldens on CI via paparazzi-record.yml workflow_dispatch — Sprint 5 follow-up PR")
    @Test
    public fun englishSelected_darkTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                LanguageSettingsScreen(onSaved = {}, viewModel = vmWithTag("en"))
            }
        }
    }

    @Ignore("Record goldens on CI via paparazzi-record.yml workflow_dispatch — Sprint 5 follow-up PR")
    @Test
    public fun hindiSelected_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                LanguageSettingsScreen(onSaved = {}, viewModel = vmWithTag("hi"))
            }
        }
    }
}
