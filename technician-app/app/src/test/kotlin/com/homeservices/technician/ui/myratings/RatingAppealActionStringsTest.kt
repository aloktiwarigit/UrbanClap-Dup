package com.homeservices.technician.ui.myratings

import androidx.test.core.app.ApplicationProvider
import com.homeservices.technician.R
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
public class RatingAppealActionStringsTest {
    @Test
    public fun `rating appeal action strings resolve in english by default`(): Unit {
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()

        assertThat(context.getString(R.string.rating_appeal_action)).isEqualTo("Appeal")
        assertThat(context.getString(R.string.rating_appeal_disputed_badge)).isEqualTo("Disputed")
        assertThat(context.getString(R.string.rating_appeal_success)).isEqualTo("Appeal submitted.")
        assertThat(context.getString(R.string.rating_appeal_quota_exceeded, "12 Aug"))
            .isEqualTo("You've reached your appeal limit — try again after 12 Aug.")
        assertThat(context.getString(R.string.rating_appeal_error_generic))
            .isEqualTo("Could not submit appeal. Try again.")
    }

    @Test
    public fun `rating appeal action strings resolve in hindi`(): Unit {
        RuntimeEnvironment.setQualifiers("hi")
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()

        assertThat(context.getString(R.string.rating_appeal_action)).isEqualTo("अपील करें")
        assertThat(context.getString(R.string.rating_appeal_disputed_badge)).isEqualTo("विवादित")
    }
}
