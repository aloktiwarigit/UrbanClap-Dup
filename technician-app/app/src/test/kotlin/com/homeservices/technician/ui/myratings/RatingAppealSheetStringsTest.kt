package com.homeservices.technician.ui.myratings

import androidx.test.core.app.ApplicationProvider
import com.homeservices.technician.R
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/**
 * [RatingAppealSheet] mirrors [com.homeservices.technician.ui.activeJob.ShieldReportSheet]
 * line-for-line: two hardcoded Devanagari literals and one hardcoded English literal (S-33).
 * These tests assert the replacement resources exist and carry en/hi parity.
 */
@RunWith(RobolectricTestRunner::class)
public class RatingAppealSheetStringsTest {
    @Test
    public fun `rating appeal strings resolve in english by default`(): Unit {
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()

        assertThat(context.getString(R.string.rating_appeal_title)).isEqualTo("Rating appeal")
        assertThat(context.getString(R.string.rating_appeal_subtitle))
            .isEqualTo("Why is this rating wrong? (at least 20 characters)")
        assertThat(context.getString(R.string.rating_appeal_char_count, 0)).isEqualTo("0/500")
        assertThat(context.getString(R.string.rating_appeal_submit)).isEqualTo("Submit appeal")
        assertThat(context.getString(R.string.rating_appeal_submitting)).isEqualTo("Submitting appeal")
    }

    @Test
    public fun `rating appeal strings resolve in hindi`(): Unit {
        RuntimeEnvironment.setQualifiers("hi")
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()

        assertThat(context.getString(R.string.rating_appeal_title)).isEqualTo("रेटिंग अपील")
        assertThat(context.getString(R.string.rating_appeal_subtitle))
            .isEqualTo("क्यों रेटिंग गलत है? (कम से कम 20 अक्षर)")
        assertThat(context.getString(R.string.rating_appeal_submit)).isEqualTo("अपील सबमिट करें")
        assertThat(context.getString(R.string.rating_appeal_submitting)).isEqualTo("अपील सबमिट हो रही है")
    }
}
