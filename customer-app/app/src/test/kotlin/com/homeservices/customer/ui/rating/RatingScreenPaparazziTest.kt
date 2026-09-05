package com.homeservices.customer.ui.rating

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

@Ignore("Re-record on CI Linux via workflow_dispatch paparazzi-record.yml after sprint2a merge")
public class RatingScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Test
    public fun ratingEditingReadyToSubmit(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                RatingContent(
                    state = RatingUiState.Editing(null),
                    shieldState = RatingShieldState.Idle,
                    overall = 5,
                    punctuality = 4,
                    skill = 5,
                    behaviour = 5,
                    comment = "Professional and quick.",
                    canSubmit = true,
                    submitError = null,
                    onOverallChange = {},
                    onPunctualityChange = {},
                    onSkillChange = {},
                    onBehaviourChange = {},
                    onCommentChange = {},
                    onSubmit = {},
                    onPostAnyway = {},
                    onBack = {},
                )
            }
        }
    }
}
