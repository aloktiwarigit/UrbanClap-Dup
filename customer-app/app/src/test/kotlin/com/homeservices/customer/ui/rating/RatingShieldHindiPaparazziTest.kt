package com.homeservices.customer.ui.rating

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

// Record goldens on CI: trigger paparazzi-record.yml workflow_dispatch after push
// Per docs/patterns/paparazzi-cross-os-goldens.md — never record on Windows.
public class RatingShieldHindiPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5.copy(locale = "hi"),
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Ignore("Record goldens on CI via paparazzi-record.yml workflow_dispatch")
    @Test
    public fun shieldBottomSheet_hindiLocale() {
        paparazzi.snapshot {
            HomeservicesTheme {
                // ShieldBottomSheet is rendered within RatingContent when shieldState == ShowDialog
                RatingContent(
                    state = RatingUiState.Editing(null),
                    shieldState = RatingShieldState.ShowDialog,
                    overall = 2,
                    punctuality = 2,
                    skill = 2,
                    behaviour = 2,
                    comment = "",
                    canSubmit = true,
                    onOverallChange = {},
                    onPunctualityChange = {},
                    onSkillChange = {},
                    onBehaviourChange = {},
                    onCommentChange = {},
                    onSubmit = {},
                    onPostAnyway = {},
                )
            }
        }
    }
}
