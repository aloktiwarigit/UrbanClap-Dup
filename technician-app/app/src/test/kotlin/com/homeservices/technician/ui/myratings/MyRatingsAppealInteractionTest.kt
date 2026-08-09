package com.homeservices.technician.ui.myratings

import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.homeservices.technician.domain.rating.model.RatingSubScoreAverages
import com.homeservices.technician.domain.rating.model.ReceivedRating
import com.homeservices.technician.domain.rating.model.TechRatingSummary
import org.assertj.core.api.Assertions.assertThat
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.util.concurrent.atomic.AtomicReference

/**
 * Interaction tests for the Appeal/Disputed wiring — tapping "Appeal" must open
 * [RatingAppealSheet] for the correct booking, a disputed rating must show the "Disputed" badge
 * instead of an Appeal trigger, and submitting the sheet must call back with the exact bookingId
 * and reason typed. No unit test previously exercised this wiring (only its rendered output via
 * Paparazzi) — see the final-review follow-up that flagged the gap.
 *
 * Two things needed for this to actually work under Robolectric, neither obvious from the API:
 *
 * 1. A tall test window (`w360dp-h1200dp`). Robolectric's default display is short enough that
 *    [MyRatingsContent]'s `LazyColumn` never composes the second rating card at all — not merely
 *    off-screen, genuinely absent from the semantics tree — which silently made an early version
 *    of this test assert against a tree that only ever contained one card.
 * 2. The submit interaction is tested against [RatingAppealSheetContent] directly, not through
 *    [RatingAppealSheet]'s `ModalBottomSheet` wrapper. Clicks on content inside a `ModalBottomSheet`
 *    (which Compose renders in a separate Popup window) don't reliably dispatch under
 *    Robolectric+`ComposeTestRule` — `onNodeWithText` finds the node and `assertIsEnabled` confirms
 *    it's clickable, but `performClick()` on it is a silent no-op. This is the same class of
 *    Popup/Dialog-vs-test-tooling friction already documented for Paparazzi in
 *    docs/patterns/paparazzi-cross-os-goldens.md ("ModalBottomSheet + Paparazzi renders blank");
 *    the fix there and here is the same — test the extracted pure content, not the wrapper.
 */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "w360dp-h1200dp")
public class MyRatingsAppealInteractionTest {
    @get:Rule
    public val composeTestRule: ComposeContentTestRule = createComposeRule()

    private fun summary(): TechRatingSummary =
        TechRatingSummary(
            totalCount = 2,
            averageOverall = 4.5,
            averageSubScores = RatingSubScoreAverages(4.5, 4.5, 4.5),
            trend = emptyList(),
            items =
                listOf(
                    ReceivedRating(
                        bookingId = "bk-open",
                        overall = 4,
                        punctuality = 4,
                        skill = 4,
                        behaviour = 4,
                        comment = "Good service.",
                        submittedAt = "2026-04-28T10:00:00Z",
                        appealDisputed = false,
                    ),
                    ReceivedRating(
                        bookingId = "bk-disputed",
                        overall = 2,
                        punctuality = 2,
                        skill = 2,
                        behaviour = 2,
                        comment = "Late arrival.",
                        submittedAt = "2026-04-27T10:00:00Z",
                        appealDisputed = true,
                    ),
                ),
        )

    @Test
    public fun `disputed rating shows Disputed badge and no Appeal trigger`(): Unit {
        composeTestRule.setContent {
            HomeservicesTheme(darkTheme = false) {
                MyRatingsContent(
                    uiState = MyRatingsUiState.Success(summary()),
                    onRetry = {},
                )
            }
        }

        composeTestRule.onNodeWithText("Disputed").assertExists()
        // Exactly one "Appeal" trigger must exist — the non-disputed rating's, not the disputed one's.
        composeTestRule.onNodeWithText("Appeal").assertExists()
    }

    @Test
    public fun `tapping Appeal opens the sheet for the tapped rating`(): Unit {
        composeTestRule.setContent {
            HomeservicesTheme(darkTheme = false) {
                MyRatingsContent(
                    uiState = MyRatingsUiState.Success(summary()),
                    onRetry = {},
                )
            }
        }

        // Sheet is not shown until the trigger is tapped.
        composeTestRule.onNodeWithText("Rating appeal").assertDoesNotExist()

        composeTestRule.onNodeWithText("Appeal").performClick()

        // The only rating with an Appeal trigger is bk-open (bk-disputed shows the badge instead),
        // so this sheet opening at all proves it's scoped to the tapped (correct) booking.
        composeTestRule.onNodeWithText("Rating appeal").assertExists()
    }

    @Test
    public fun `submitting the sheet calls onSubmit with the exact bookingId and reason typed`(): Unit {
        val submittedBookingId = AtomicReference<String?>(null)
        val submittedReason = AtomicReference<String?>(null)

        composeTestRule.setContent {
            HomeservicesTheme(darkTheme = false) {
                RatingAppealSheetContent(
                    bookingId = "bk-under-appeal",
                    onSubmit = { bookingId, reason ->
                        submittedBookingId.set(bookingId)
                        submittedReason.set(reason)
                    },
                    isSubmitting = false,
                )
            }
        }

        composeTestRule.onNodeWithText("Write reason…").performTextInput("This rating is wrong, customer was rude to me.")
        composeTestRule.onNodeWithText("Submit appeal").assertIsEnabled()
        composeTestRule.onNodeWithText("Submit appeal").performClick()

        assertThat(submittedBookingId.get()).isEqualTo("bk-under-appeal")
        assertThat(submittedReason.get()).isEqualTo("This rating is wrong, customer was rude to me.")
    }

    @Test
    public fun `submit stays disabled below the 20-character reason minimum`(): Unit {
        composeTestRule.setContent {
            HomeservicesTheme(darkTheme = false) {
                RatingAppealSheetContent(
                    bookingId = "bk-under-appeal",
                    onSubmit = { _, _ -> },
                    isSubmitting = false,
                )
            }
        }

        composeTestRule.onNodeWithText("Write reason…").performTextInput("too short")
        composeTestRule.onNodeWithText("Submit appeal").assertIsNotEnabled()
    }
}
