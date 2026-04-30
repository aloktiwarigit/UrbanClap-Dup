package com.homeservices.customer.ui.rating

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

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
